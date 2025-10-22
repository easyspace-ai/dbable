/**
 * ShareDB 客户端
 * 实现 ShareDB 协议，支持实时协作
 */

import WebSocket from 'ws';
import type {
  ShareDBMessage,
  ShareDBOperation,
  ShareDBError,
  ShareDBSnapshot,
  ShareDBConnection,
  ShareDBPresenceData,
} from '../types/index.js';

export interface ShareDBClientConfig {
  baseUrl: string;
  accessToken?: string;
  debug?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export type ShareDBConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

export type ShareDBMessageHandler = (message: ShareDBMessage) => void;
export type ShareDBErrorHandler = (error: ShareDBError) => void;
export type ShareDBConnectionHandler = (state: ShareDBConnectionState) => void;

export class ShareDBClient {
  private config: ShareDBClientConfig;
  private ws?: WebSocket;
  private connectionState: ShareDBConnectionState = 'disconnected';
  private connectionId?: string;
  private reconnectAttempts = 0;
  private reconnectTimer?: any;
  private messageHandlers: ShareDBMessageHandler[] = [];
  private errorHandlers: ShareDBErrorHandler[] = [];
  private connectionHandlers: ShareDBConnectionHandler[] = [];
  private subscriptions: Map<string, ShareDBMessageHandler> = new Map();
  private presenceData: Map<string, ShareDBPresenceData> = new Map();

  constructor(config: ShareDBClientConfig) {
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      debug: false,
      ...config,
    };
  }

  /**
   * 连接到 ShareDB WebSocket
   */
  public async connect(): Promise<void> {
    if (this.connectionState === 'connected' || this.connectionState === 'connecting') {
      return;
    }

    this.connectionState = 'connecting';
    this.notifyConnectionHandlers();

    try {
      const wsUrl = this.buildWebSocketUrl();
      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        this.connectionState = 'connected';
        this.reconnectAttempts = 0;
        this.notifyConnectionHandlers();
        this.sendHandshake();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const message: ShareDBMessage = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          this.log('Error parsing message:', error);
        }
      });

      this.ws.on('close', (code: number, reason: string) => {
        this.connectionState = 'disconnected';
        this.notifyConnectionHandlers();
        this.log(`WebSocket closed: ${code} ${reason}`);
        this.scheduleReconnect();
      });

      this.ws.on('error', (error: Error) => {
        this.connectionState = 'error';
        this.notifyConnectionHandlers();
        this.log('WebSocket error:', error);
        this.notifyErrorHandlers({
          code: 500,
          message: error.message,
        });
      });

    } catch (error) {
      this.connectionState = 'error';
      this.notifyConnectionHandlers();
      this.log('Connection error:', error);
      throw error;
    }
  }

  /**
   * 断开连接
   */
  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }

    this.connectionState = 'disconnected';
    this.connectionId = undefined;
    this.subscriptions.clear();
    this.presenceData.clear();
    this.notifyConnectionHandlers();
  }

  /**
   * 获取连接状态
   */
  public getConnectionState(): ShareDBConnectionState {
    return this.connectionState;
  }

  /**
   * 获取连接信息
   */
  public getConnectionInfo(): ShareDBConnection | null {
    if (!this.connectionId) {
      return null;
    }

    return {
      id: this.connectionId,
      userId: 'current-user', // 从认证信息获取
      isConnected: this.connectionState === 'connected',
      lastSeen: new Date().toISOString(),
    };
  }

  /**
   * 订阅文档
   */
  public subscribe(collection: string, docId: string, handler: ShareDBMessageHandler): void {
    const key = `${collection}:${docId}`;
    this.subscriptions.set(key, handler);

    if (this.connectionState === 'connected') {
      this.sendSubscribe(collection, docId);
    }
  }

  /**
   * 取消订阅文档
   */
  public unsubscribe(collection: string, docId: string): void {
    const key = `${collection}:${docId}`;
    this.subscriptions.delete(key);

    if (this.connectionState === 'connected') {
      this.sendUnsubscribe(collection, docId);
    }
  }

  /**
   * 获取文档快照
   */
  public async fetch(collection: string, docId: string): Promise<ShareDBSnapshot> {
    return new Promise((resolve, reject) => {
      if (this.connectionState !== 'connected') {
        reject(new Error('Not connected to ShareDB'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Fetch timeout'));
      }, 10000);

      const handler = (message: ShareDBMessage) => {
        if (message.a === 'f' && message.c === collection && message.d === docId) {
          clearTimeout(timeout);
          this.messageHandlers.splice(this.messageHandlers.indexOf(handler), 1);
          if (message.error) {
            reject(new Error(message.error.message));
          } else {
            resolve(message.data as ShareDBSnapshot);
          }
        }
      };

      this.messageHandlers.push(handler);
      this.sendFetch(collection, docId);
    });
  }

  /**
   * 提交操作
   */
  public submitOp(collection: string, docId: string, op: ShareDBOperation[], version?: number): void {
    if (this.connectionState !== 'connected') {
      throw new Error('Not connected to ShareDB');
    }

    this.sendOperation(collection, docId, op, version);
  }

  /**
   * 提交在线状态
   */
  public submitPresence(collection: string, docId: string, data: Record<string, any>): void {
    if (this.connectionState !== 'connected') {
      throw new Error('Not connected to ShareDB');
    }

    const presenceData: ShareDBPresenceData = {
      userId: 'current-user', // 从认证信息获取
      data,
      timestamp: Date.now(),
    };

    this.presenceData.set(`${collection}:${docId}`, presenceData);
    this.sendPresence(collection, docId, presenceData);
  }

  /**
   * 获取在线状态
   */
  public getPresence(collection: string, docId: string): ShareDBPresenceData | null {
    return this.presenceData.get(`${collection}:${docId}`) || null;
  }

  /**
   * 监听消息
   */
  public onMessage(handler: ShareDBMessageHandler): void {
    this.messageHandlers.push(handler);
  }

  /**
   * 监听错误
   */
  public onError(handler: ShareDBErrorHandler): void {
    this.errorHandlers.push(handler);
  }

  /**
   * 监听连接状态变化
   */
  public onConnection(handler: ShareDBConnectionHandler): void {
    this.connectionHandlers.push(handler);
  }

  /**
   * 移除消息监听器
   */
  public offMessage(handler: ShareDBMessageHandler): void {
    const index = this.messageHandlers.indexOf(handler);
    if (index > -1) {
      this.messageHandlers.splice(index, 1);
    }
  }

  /**
   * 移除错误监听器
   */
  public offError(handler: ShareDBErrorHandler): void {
    const index = this.errorHandlers.indexOf(handler);
    if (index > -1) {
      this.errorHandlers.splice(index, 1);
    }
  }

  /**
   * 移除连接监听器
   */
  public offConnection(handler: ShareDBConnectionHandler): void {
    const index = this.connectionHandlers.indexOf(handler);
    if (index > -1) {
      this.connectionHandlers.splice(index, 1);
    }
  }

  /**
   * 设置访问令牌
   */
  public setAccessToken(token: string): void {
    this.config.accessToken = token;
  }

  // ==================== 私有方法 ====================

  private buildWebSocketUrl(): string {
    const baseUrl = this.config.baseUrl.replace(/^https?:\/\//, '');
    const protocol = this.config.baseUrl.startsWith('https') ? 'wss' : 'ws';
    const token = this.config.accessToken ? `?token=${this.config.accessToken}` : '';
    return `${protocol}://${baseUrl}/socket${token}`;
  }

  private sendHandshake(): void {
    this.sendMessage({
      a: 'hs',
    });
  }

  private sendSubscribe(collection: string, docId: string): void {
    this.sendMessage({
      a: 's',
      c: collection,
      d: docId,
    });
  }

  private sendUnsubscribe(collection: string, docId: string): void {
    this.sendMessage({
      a: 'us', // unsubscribe
      c: collection,
      d: docId,
    });
  }

  private sendFetch(collection: string, docId: string): void {
    this.sendMessage({
      a: 'f',
      c: collection,
      d: docId,
    });
  }

  private sendOperation(collection: string, docId: string, op: ShareDBOperation[], version?: number): void {
    this.sendMessage({
      a: 'op',
      c: collection,
      d: docId,
      op,
      v: version,
    });
  }

  private sendPresence(collection: string, docId: string, data: ShareDBPresenceData): void {
    this.sendMessage({
      a: 'p',
      c: collection,
      d: docId,
      presence: {
        [data.userId]: data,
      },
    });
  }

  private sendMessage(message: ShareDBMessage): void {
    if (this.ws && this.connectionState === 'connected') {
      this.ws.send(JSON.stringify(message));
    }
  }

  private handleMessage(message: ShareDBMessage): void {
    this.log('Received message:', message);

    // 处理握手响应
    if (message.a === 'hs' && message.data) {
      this.connectionId = message.data.id;
      this.log('Handshake completed, connection ID:', this.connectionId);
    }

    // 处理错误
    if (message.error) {
      this.notifyErrorHandlers(message.error);
    }

    // 处理订阅确认
    if (message.a === 's') {
      this.log(`Subscribed to ${message.c}:${message.d}`);
    }

    // 处理操作
    if (message.a === 'op') {
      const key = `${message.c}:${message.d}`;
      const handler = this.subscriptions.get(key);
      if (handler) {
        handler(message);
      }
    }

    // 处理在线状态
    if (message.a === 'p' && message.presence) {
      this.handlePresenceUpdate(message.c!, message.d!, message.presence);
    }

    // 通知所有消息处理器
    this.messageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        this.log('Error in message handler:', error);
      }
    });
  }

  private handlePresenceUpdate(collection: string, docId: string, presence: Record<string, any>): void {
    Object.entries(presence).forEach(([userId, data]) => {
      const key = `${collection}:${docId}`;
      this.presenceData.set(key, data as ShareDBPresenceData);
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts!) {
      this.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    this.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${this.config.reconnectInterval}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        this.log('Reconnection failed:', error);
      });
    }, this.config.reconnectInterval);
  }

  private notifyConnectionHandlers(): void {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(this.connectionState);
      } catch (error) {
        this.log('Error in connection handler:', error);
      }
    });
  }

  private notifyErrorHandlers(error: ShareDBError): void {
    this.errorHandlers.forEach(handler => {
      try {
        handler(error);
      } catch (err) {
        this.log('Error in error handler:', err);
      }
    });
  }

  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[ShareDBClient]', ...args);
    }
  }
}
