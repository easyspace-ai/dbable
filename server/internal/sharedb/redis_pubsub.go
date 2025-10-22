package sharedb

import (
	"context"
	"encoding/json"
	"sync"

	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

// RedisPubSub Redis 发布订阅实现
type RedisPubSub struct {
	client    *redis.Client
	prefix    string
	listeners sync.Map // channel -> []func(*Operation)
	logger    *zap.Logger
	mu        sync.RWMutex
}

// NewRedisPubSub 创建 Redis 发布订阅
func NewRedisPubSub(redisURI string, logger *zap.Logger) (PubSub, error) {
	// 解析 Redis URI
	opt, err := redis.ParseURL(redisURI)
	if err != nil {
		return nil, err
	}

	client := redis.NewClient(opt)

	// 测试连接
	ctx := context.Background()
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, err
	}

	return &RedisPubSub{
		client: client,
		prefix: "sharedb:",
		logger: logger,
	}, nil
}

// Publish 发布消息
func (p *RedisPubSub) Publish(ctx context.Context, channels []string, op *Operation) error {
	p.mu.RLock()
	defer p.mu.RUnlock()

	// 序列化操作
	data, err := json.Marshal(op)
	if err != nil {
		return err
	}

	// 发布到所有频道
	for _, channel := range channels {
		fullChannel := p.prefix + channel
		if err := p.client.Publish(ctx, fullChannel, data).Err(); err != nil {
			p.logger.Error("Failed to publish to channel",
				zap.Error(err),
				zap.String("channel", fullChannel))
			continue
		}
	}

	p.logger.Debug("Message published to Redis",
		zap.Strings("channels", channels),
		zap.String("op_type", string(op.Type)))

	return nil
}

// Subscribe 订阅频道
func (p *RedisPubSub) Subscribe(ctx context.Context, channel string, handler func(*Operation)) error {
	p.mu.Lock()
	defer p.mu.Unlock()

	fullChannel := p.prefix + channel

	// 启动订阅协程
	go func() {
		pubsub := p.client.Subscribe(ctx, fullChannel)
		defer pubsub.Close()

		p.logger.Debug("Subscribed to Redis channel", zap.String("channel", fullChannel))

		// 监听消息
		ch := pubsub.Channel()
		for {
			select {
			case <-ctx.Done():
				return
			case msg := <-ch:
				if msg == nil {
					continue
				}

				// 解析操作
				var op Operation
				if err := json.Unmarshal([]byte(msg.Payload), &op); err != nil {
					p.logger.Error("Failed to unmarshal operation",
						zap.Error(err),
						zap.String("channel", fullChannel))
					continue
				}

				// 调用处理器
				handler(&op)
			}
		}
	}()

	return nil
}

// Unsubscribe 取消订阅
func (p *RedisPubSub) Unsubscribe(ctx context.Context, channel string) error {
	fullChannel := p.prefix + channel
	
	// Redis 的取消订阅由上下文控制
	p.logger.Debug("Unsubscribed from Redis channel", zap.String("channel", fullChannel))
	return nil
}

// Close 关闭发布订阅
func (p *RedisPubSub) Close() error {
	if p.client != nil {
		return p.client.Close()
	}
	return nil
}
