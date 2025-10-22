/**
 * ShareDB 文档管理
 * 封装单个文档的操作和状态管理
 */

import type { ShareDBClient } from './sharedb-client.js';
import type {
  ShareDBMessage,
  ShareDBOperation,
  ShareDBSnapshot,
  ShareDBPresenceData,
} from '../types/index.js';

export type DocumentEventType = 'snapshot' | 'operation' | 'presence' | 'error';

export interface DocumentEvent {
  type: DocumentEventType;
  data: any;
  timestamp: number;
}

export type DocumentEventHandler = (event: DocumentEvent) => void;

export class ShareDBDocument {
  private client: ShareDBClient;
  private collection: string;
  private docId: string;
  private snapshot?: ShareDBSnapshot;
  private version: number = 0;
  private isSubscribed: boolean = false;
  private eventHandlers: Map<DocumentEventType, DocumentEventHandler[]> = new Map();
  private messageHandler?: (message: ShareDBMessage) => void;

  constructor(client: ShareDBClient, collection: string, docId: string) {
    this.client = client;
    this.collection = collection;
    this.docId = docId;
    this.setupMessageHandler();
  }

  /**
   * 获取文档快照
   */
  public async fetch(): Promise<ShareDBSnapshot> {
    const snapshot = await this.client.fetch(this.collection, this.docId);
    this.snapshot = snapshot;
    this.version = snapshot.v;
    this.emit('snapshot', snapshot);
    return snapshot;
  }

  /**
   * 订阅文档变更
   */
  public subscribe(): void {
    if (this.isSubscribed) {
      return;
    }

    this.client.subscribe(this.collection, this.docId, this.messageHandler!);
    this.isSubscribed = true;
  }

  /**
   * 取消订阅文档
   */
  public unsubscribe(): void {
    if (!this.isSubscribed) {
      return;
    }

    this.client.unsubscribe(this.collection, this.docId);
    this.isSubscribed = false;
  }

  /**
   * 提交操作
   */
  public submitOp(op: ShareDBOperation[]): void {
    this.client.submitOp(this.collection, this.docId, op, this.version);
  }

  /**
   * 获取当前数据
   */
  public getData(): any {
    return this.snapshot?.data;
  }

  /**
   * 获取当前版本
   */
  public getVersion(): number {
    return this.version;
  }

  /**
   * 获取快照
   */
  public getSnapshot(): ShareDBSnapshot | undefined {
    return this.snapshot;
  }

  /**
   * 检查是否已订阅
   */
  public isSubscribedTo(): boolean {
    return this.isSubscribed;
  }

  /**
   * 提交在线状态
   */
  public submitPresence(data: Record<string, any>): void {
    this.client.submitPresence(this.collection, this.docId, data);
  }

  /**
   * 获取在线状态
   */
  public getPresence(): ShareDBPresenceData | null {
    return this.client.getPresence(this.collection, this.docId);
  }

  /**
   * 监听事件
   */
  public on(event: DocumentEventType, handler: DocumentEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  /**
   * 移除事件监听器
   */
  public off(event: DocumentEventType, handler: DocumentEventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * 移除所有事件监听器
   */
  public removeAllListeners(event?: DocumentEventType): void {
    if (event) {
      this.eventHandlers.delete(event);
    } else {
      this.eventHandlers.clear();
    }
  }

  /**
   * 销毁文档实例
   */
  public destroy(): void {
    this.unsubscribe();
    this.removeAllListeners();
    if (this.messageHandler) {
      this.client.offMessage(this.messageHandler);
    }
  }

  // ==================== 私有方法 ====================

  private setupMessageHandler(): void {
    this.messageHandler = (message: ShareDBMessage) => {
      if (message.c !== this.collection || message.d !== this.docId) {
        return;
      }

      switch (message.a) {
        case 'f': // fetch response
          if (message.data) {
            this.snapshot = message.data as ShareDBSnapshot;
            this.version = this.snapshot.v;
            this.emit('snapshot', this.snapshot);
          }
          break;

        case 'op': // operation
          if (message.op && message.v !== undefined) {
            this.version = message.v;
            this.emit('operation', {
              op: message.op,
              version: message.v,
            });
          }
          break;

        case 'p': // presence
          if (message.presence) {
            this.emit('presence', message.presence);
          }
          break;

        case 'error':
          if (message.error) {
            this.emit('error', message.error);
          }
          break;
      }
    };

    this.client.onMessage(this.messageHandler);
  }

  private emit(event: DocumentEventType, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const documentEvent: DocumentEvent = {
        type: event,
        data,
        timestamp: Date.now(),
      };

      handlers.forEach(handler => {
        try {
          handler(documentEvent);
        } catch (error) {
          console.error('Error in document event handler:', error);
        }
      });
    }
  }
}
