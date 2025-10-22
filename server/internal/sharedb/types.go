package sharedb

import (
	"time"
)

// OpType 操作类型
type OpType string

const (
	OpTypeCreate OpType = "create"
	OpTypeEdit   OpType = "edit"
	OpTypeDelete OpType = "delete"
)

// OTOperation JSON0 操作类型
type OTOperation map[string]interface{}

// CreateData 创建操作数据
type CreateData struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

// Operation ShareDB 操作
type Operation struct {
	Type    OpType          `json:"type"`
	Op      []OTOperation   `json:"op,omitempty"`
	Create  *CreateData     `json:"create,omitempty"`
	Version int64           `json:"v"`
	Source  string          `json:"src"`
	Seq     int             `json:"seq"`
	// 额外字段用于内部处理
	Collection string `json:"c,omitempty"`
	DocID      string `json:"d,omitempty"`
}

// Snapshot 文档快照
type Snapshot struct {
	ID      string      `json:"id"`
	Type    string      `json:"type"`
	Version int64       `json:"v"`
	Data    interface{} `json:"data"`
	Meta    interface{} `json:"m,omitempty"`
}

// Message ShareDB 协议消息
type Message struct {
	Action     string        `json:"a"`
	Collection string        `json:"c,omitempty"`
	DocID      string        `json:"d,omitempty"`
	Version    int64         `json:"v,omitempty"`
	Op         []OTOperation  `json:"op,omitempty"`
	Create     *CreateData   `json:"create,omitempty"`
	Data       interface{}   `json:"data,omitempty"`
	Error      *Error        `json:"error,omitempty"`
	// Presence 相关
	Presence map[string]interface{} `json:"presence,omitempty"`
}

// Error ShareDB 错误
type Error struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// Connection 连接信息
type Connection struct {
	ID       string
	UserID   string
	LastSeen time.Time
	IsActive bool
}

// PresenceData 在线状态数据
type PresenceData struct {
	UserID    string                 `json:"userId"`
	Data      map[string]interface{} `json:"data"`
	Timestamp int64                  `json:"timestamp"`
}

// QueryOptions 查询选项
type QueryOptions struct {
	Projection map[string]bool `json:"projection,omitempty"`
	Limit      int             `json:"limit,omitempty"`
	Skip       int             `json:"skip,omitempty"`
	Sort       interface{}     `json:"sort,omitempty"`
}

// DocumentType 文档类型
type DocumentType string

const (
	DocumentTypeRecord DocumentType = "record"
	DocumentTypeField  DocumentType = "field"
	DocumentTypeView   DocumentType = "view"
	DocumentTypeTable  DocumentType = "table"
)

// CollectionInfo 集合信息
type CollectionInfo struct {
	Type         DocumentType
	TableID      string
	DocumentID   string
}

