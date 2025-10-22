package sharedb

import (
	"context"
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/easyspace-ai/luckdb/server/internal/events"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"go.uber.org/zap"
)

// ShareDBService ShareDB 核心服务
type ShareDBService struct {
	adapter        Adapter
	pubsub         PubSub
	presence       PresenceManager
	middleware     []Middleware
	connections    sync.Map // connection ID -> *Connection
	documents      sync.Map // document ID -> *Document
	eventHook      *TransactionHook
	eventConverter *OpsToEventsConverter
	logger         *zap.Logger
	ctx            context.Context
	cancel         context.CancelFunc
	mu             sync.RWMutex
}

// Document 文档信息
type Document struct {
	ID        string
	Version   int64
	CreatedAt time.Time
	UpdatedAt time.Time
	mu        sync.RWMutex
}

// NewService 创建 ShareDB 服务
func NewService(adapter Adapter, pubsub PubSub, presence PresenceManager, logger *zap.Logger) *ShareDBService {
	ctx, cancel := context.WithCancel(context.Background())

	service := &ShareDBService{
		adapter:    adapter,
		pubsub:     pubsub,
		presence:   presence,
		middleware: make([]Middleware, 0),
		logger:     logger,
		ctx:        ctx,
		cancel:     cancel,
	}

	// 启动清理协程
	go service.cleanupRoutine()

	return service
}

// SetEventManager 设置事件管理器
func (s *ShareDBService) SetEventManager(eventManager *events.BusinessEventManager) {
	s.eventHook = NewTransactionHook(eventManager, s.logger)
	s.eventConverter = NewOpsToEventsConverter(eventManager, s.logger)
	s.logger.Info("✅ ShareDB 事件管理器已设置")
}

// AddMiddleware 添加中间件
func (s *ShareDBService) AddMiddleware(middleware Middleware) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.middleware = append(s.middleware, middleware)
}

// HandleWebSocket 处理 WebSocket 连接
func (s *ShareDBService) HandleWebSocket(c *gin.Context) {
	// 记录详细的请求信息用于调试
	s.logger.Info("WebSocket upgrade request received",
		zap.String("connection_header", c.Request.Header.Get("Connection")),
		zap.String("upgrade_header", c.Request.Header.Get("Upgrade")),
		zap.String("sec_websocket_key", c.Request.Header.Get("Sec-WebSocket-Key")),
		zap.String("sec_websocket_version", c.Request.Header.Get("Sec-WebSocket-Version")),
		zap.String("user_id", c.GetString("user_id")),
		zap.String("remote_addr", c.Request.RemoteAddr),
		zap.String("user_agent", c.Request.Header.Get("User-Agent")),
		zap.String("origin", c.Request.Header.Get("Origin")),
		zap.String("query", c.Request.URL.RawQuery))

	// 升级到 WebSocket
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true // 在生产环境中应该进行更严格的检查
		},
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		s.logger.Error("Failed to upgrade WebSocket connection",
			zap.Error(err),
			zap.String("connection_header", c.Request.Header.Get("Connection")),
			zap.String("upgrade_header", c.Request.Header.Get("Upgrade")),
			zap.String("user_id", c.GetString("user_id")))
		return
	}
	defer conn.Close()

	// 创建连接信息
	connection := &Connection{
		ID:       generateConnectionID(),
		UserID:   c.GetString("user_id"), // 从中间件获取用户ID
		LastSeen: time.Now(),
		IsActive: true,
	}

	// 注册连接
	s.connections.Store(connection.ID, connection)
	defer s.connections.Delete(connection.ID)

	s.logger.Info("ShareDB WebSocket connection established",
		zap.String("connection_id", connection.ID),
		zap.String("user_id", connection.UserID))

	// 处理消息
	s.handleConnection(conn, connection)
}

// handleConnection 处理连接消息
func (s *ShareDBService) handleConnection(conn *websocket.Conn, connection *Connection) {
	defer func() {
		if r := recover(); r != nil {
			s.logger.Error("Panic in ShareDB connection handler", zap.Any("panic", r))
		}
	}()

	for {
		select {
		case <-s.ctx.Done():
			return
		default:
		}

		// 读取消息
		_, data, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway) {
				s.logger.Info("ShareDB WebSocket connection closed normally",
					zap.String("connection_id", connection.ID))
			} else {
				s.logger.Error("ShareDB WebSocket connection error",
					zap.Error(err),
					zap.String("connection_id", connection.ID))
			}
			break
		}

		// 更新最后活跃时间
		connection.LastSeen = time.Now()

		// 解析消息
		var msg Message
		if err := json.Unmarshal(data, &msg); err != nil {
			s.logger.Error("Failed to parse ShareDB message", zap.Error(err))
			continue
		}

		// 处理消息
		if err := s.handleMessage(conn, connection, &msg); err != nil {
			s.logger.Error("Failed to handle ShareDB message", zap.Error(err))
			// 发送错误响应
			s.sendError(conn, &msg, &Error{
				Code:    500,
				Message: err.Error(),
			})
		}
	}
}

// handleMessage 处理消息
func (s *ShareDBService) handleMessage(conn *websocket.Conn, connection *Connection, msg *Message) error {
	// 应用中间件
	for _, middleware := range s.middleware {
		if err := middleware.Handle(s.ctx, connection, msg); err != nil {
			return err
		}
	}

	// 根据消息类型处理
	switch msg.Action {
	case "hs": // handshake
		return s.handleHandshake(conn, connection, msg)
	case "f": // fetch
		return s.handleFetch(conn, connection, msg)
	case "s": // subscribe
		return s.handleSubscribe(conn, connection, msg)
	case "op": // operation
		return s.handleOperation(conn, connection, msg)
	case "p": // presence
		return s.handlePresence(conn, connection, msg)
	default:
		return s.sendError(conn, msg, &Error{
			Code:    400,
			Message: "Unknown action: " + msg.Action,
		})
	}
}

// handleHandshake 处理握手
func (s *ShareDBService) handleHandshake(conn *websocket.Conn, connection *Connection, msg *Message) error {
	// 发送握手响应
	response := Message{
		Action: "hs",
		Data: map[string]interface{}{
			"protocol": "1.0.0",
			"id":       connection.ID,
		},
	}
	return s.sendMessage(conn, &response)
}

// handleFetch 处理获取请求
func (s *ShareDBService) handleFetch(conn *websocket.Conn, connection *Connection, msg *Message) error {
	// 获取文档快照
	snapshot, err := s.adapter.GetSnapshot(s.ctx, msg.Collection, msg.DocID, nil)
	if err != nil {
		return err
	}

	// 发送快照
	response := Message{
		Action:     "f",
		Collection: msg.Collection,
		DocID:      msg.DocID,
		Data:       snapshot,
	}
	return s.sendMessage(conn, &response)
}

// handleSubscribe 处理订阅
func (s *ShareDBService) handleSubscribe(conn *websocket.Conn, connection *Connection, msg *Message) error {
	// 订阅文档
	channel := msg.Collection + "." + msg.DocID

	// 订阅操作更新
	if err := s.pubsub.Subscribe(s.ctx, channel, func(op *Operation) {
		// 发送操作到客户端
		response := Message{
			Action:     "op",
			Collection: msg.Collection,
			DocID:      msg.DocID,
			Op:         op.Op,
			Version:    op.Version,
		}
		s.sendMessage(conn, &response)
	}); err != nil {
		return err
	}

	// 发送订阅确认
	response := Message{
		Action:     "s",
		Collection: msg.Collection,
		DocID:      msg.DocID,
	}
	return s.sendMessage(conn, &response)
}

// handleOperation 处理操作
func (s *ShareDBService) handleOperation(conn *websocket.Conn, connection *Connection, msg *Message) error {
	// 创建操作
	op := &Operation{
		Type:       OpTypeEdit,
		Op:         msg.Op,
		Version:    msg.Version,
		Source:     connection.ID,
		Collection: msg.Collection,
		DocID:      msg.DocID,
	}

	// 提交操作
	if err := s.SubmitOp(s.ctx, msg.Collection, msg.DocID, op); err != nil {
		return err
	}

	// 发布操作
	if err := s.PublishOp(s.ctx, msg.Collection, msg.DocID, op); err != nil {
		return err
	}

	return nil
}

// handlePresence 处理在线状态
func (s *ShareDBService) handlePresence(conn *websocket.Conn, connection *Connection, msg *Message) error {
	// 解析在线状态数据
	var presenceData PresenceData
	if msg.Presence != nil {
		presenceData = PresenceData{
			UserID:    connection.UserID,
			Data:      msg.Presence,
			Timestamp: time.Now().Unix(),
		}
	}

	// 提交在线状态
	channel := msg.Collection + "." + msg.DocID
	if err := s.presence.Submit(s.ctx, channel, connection.ID, presenceData); err != nil {
		return err
	}

	// 广播在线状态到其他客户端
	presences, err := s.presence.GetPresences(s.ctx, channel)
	if err != nil {
		return err
	}

	// 转换在线状态数据
	presenceMap := make(map[string]interface{})
	for clientID, presence := range presences {
		presenceMap[clientID] = presence
	}

	// 发送在线状态更新
	response := Message{
		Action:     "p",
		Collection: msg.Collection,
		DocID:      msg.DocID,
		Presence:   presenceMap,
	}
	return s.sendMessage(conn, &response)
}

// SubmitOp 提交操作
func (s *ShareDBService) SubmitOp(ctx context.Context, collection, docID string, op *Operation) error {
	// 这里应该将操作保存到数据库
	// 暂时只记录日志
	s.logger.Info("Operation submitted",
		zap.String("collection", collection),
		zap.String("doc_id", docID),
		zap.String("op_type", string(op.Type)),
		zap.Int64("version", op.Version))

	// 触发事件钩子
	if s.eventHook != nil {
		s.eventHook.AfterCommit(collection, docID, op)
	}

	return nil
}

// PublishOp 发布操作
func (s *ShareDBService) PublishOp(ctx context.Context, collection, docID string, op *Operation) error {
	channels := []string{collection, collection + "." + docID}
	return s.pubsub.Publish(ctx, channels, op)
}

// sendMessage 发送消息
func (s *ShareDBService) sendMessage(conn *websocket.Conn, msg *Message) error {
	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}
	return conn.WriteMessage(websocket.TextMessage, data)
}

// sendError 发送错误
func (s *ShareDBService) sendError(conn *websocket.Conn, msg *Message, err *Error) error {
	response := Message{
		Action:     msg.Action,
		Collection: msg.Collection,
		DocID:      msg.DocID,
		Error:      err,
	}
	return s.sendMessage(conn, &response)
}

// GetStats 获取统计信息
func (s *ShareDBService) GetStats() map[string]interface{} {
	stats := map[string]interface{}{
		"connections": 0,
		"documents":   0,
		"timestamp":   time.Now().Unix(),
	}

	// 统计连接数
	connectionCount := 0
	s.connections.Range(func(key, value interface{}) bool {
		connectionCount++
		return true
	})
	stats["connections"] = connectionCount

	// 统计文档数
	documentCount := 0
	s.documents.Range(func(key, value interface{}) bool {
		documentCount++
		return true
	})
	stats["documents"] = documentCount

	return stats
}

// Shutdown 关闭服务
func (s *ShareDBService) Shutdown() error {
	s.cancel()

	// 关闭所有连接
	s.connections.Range(func(key, value interface{}) bool {
		// 这里可以关闭连接
		return true
	})

	// 关闭适配器
	if s.adapter != nil {
		s.adapter.Close()
	}

	// 关闭发布订阅
	if s.pubsub != nil {
		s.pubsub.Close()
	}

	// 关闭在线状态管理器
	if s.presence != nil {
		s.presence.Close()
	}

	s.logger.Info("ShareDB service shutdown completed")
	return nil
}

// cleanupRoutine 清理协程
func (s *ShareDBService) cleanupRoutine() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-s.ctx.Done():
			return
		case <-ticker.C:
			s.cleanupInactiveConnections()
		}
	}
}

// cleanupInactiveConnections 清理非活跃连接
func (s *ShareDBService) cleanupInactiveConnections() {
	now := time.Now()
	timeout := 5 * time.Minute

	s.connections.Range(func(key, value interface{}) bool {
		conn := value.(*Connection)
		if now.Sub(conn.LastSeen) > timeout {
			conn.IsActive = false
			s.connections.Delete(key)
			s.logger.Info("Cleaned up inactive connection",
				zap.String("connection_id", conn.ID))
		}
		return true
	})
}

// generateConnectionID 生成连接ID
func generateConnectionID() string {
	return "conn_" + time.Now().Format("20060102150405") + "_" + randomString(8)
}

// randomString 生成随机字符串
func randomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[time.Now().UnixNano()%int64(len(charset))]
	}
	return string(b)
}
