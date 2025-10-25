package cache

import (
	"io"
	"os"
	"strings"

	"go.uber.org/zap"
)

// SuppressRedisErrors 抑制Redis关闭时的错误输出
func SuppressRedisErrors(logger *zap.Logger, fn func() error) error {
	// 保存原始stderr
	originalStderr := os.Stderr

	// 创建错误抑制器
	suppressor := &ErrorSuppressor{
		original: originalStderr,
		logger:   logger,
	}

	// 重定向stderr到错误抑制器
	os.Stderr = suppressor
	defer func() {
		os.Stderr = originalStderr
	}()

	// 执行函数
	return fn()
}

// ErrorSuppressor 错误抑制器
type ErrorSuppressor struct {
	original io.Writer
	logger   *zap.Logger
}

// Write 写入时过滤Redis关闭错误
func (e *ErrorSuppressor) Write(p []byte) (n int, err error) {
	content := string(p)

	// 过滤Redis连接关闭错误
	if strings.Contains(content, "use of closed network connection") ||
		strings.Contains(content, "connection reset by peer") ||
		strings.Contains(content, "broken pipe") ||
		strings.Contains(content, "discarding bad PubSub connection") {
		// 静默忽略这些错误，不输出到stderr
		return len(p), nil
	}

	// 其他错误正常输出
	return e.original.Write(p)
}
