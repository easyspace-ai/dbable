/**
 * Yjs-ShareDB 适配层
 * 让 Yjs 像 ShareDB 一样工作，保留 Teable 的所有业务逻辑
 */

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

// ShareDB 类型定义
export interface ShareDBDoc<T = any> {
  id: string;
  collection: string;
  data: T;
  version: number;
  
  emit(event: string, ops: any[], local?: boolean): void;
  on(event: string, listener: Function): void;
  removeListener(event: string, listener: Function): void;
  listenerCount(event: string): number;
  
  subscribe(callback?: (error?: Error) => void): void;
  unsubscribe(callback?: () => void): void;
  fetch(callback: (error?: Error) => void): void;
  destroy(): void;
}

export interface ShareDBConnection {
  get<T = any>(collection: string, id: string): ShareDBDoc<T>;
  createSubscribeQuery<T = any>(collection: string, query: any): ShareDBQuery<T>;
  
  on(event: string, listener: Function): void;
  emit(event: string, ...args: any[]): void;
  removeListener(event: string, listener: Function): void;
  
  ping(): void;
  close(): void;
}

export interface ShareDBQuery<T = any> {
  collection: string;
  query: any;
  results: ShareDBDoc<T>[];
  extra: any;
  ready: boolean;
  sent: boolean;
  
  on(event: string, listener: Function): void;
  emit(event: string, ...args: any[]): void;
  once(event: string, listener: Function): void;
  removeListener(event: string, listener: Function): void;
  removeAllListeners(): void;
  destroy(callback?: () => void): void;
}

/**
 * Yjs 适配 ShareDB Doc 接口
 * 让 Yjs Y.Doc 像 ShareDB Doc 一样工作
 */
export class YjsDoc<T = any> implements Partial<ShareDBDoc<T>> {
  public id: string;
  public collection: string;
  public data: T;
  public version: number = 0;
  
  private yjsDoc: Y.Doc;
  private yjsMap: Y.Map<any>;
  private listeners: Map<string, Set<Function>> = new Map();
  
  constructor(collection: string, id: string, yjsDoc: Y.Doc) {
    this.id = id;
    this.collection = collection;
    this.yjsDoc = yjsDoc;
    
    // 从 Yjs 文档中获取对应的 Map
    this.yjsMap = yjsDoc.getMap(`${collection}_${id}`);
    
    // 同步 data
    this.data = this.yjsMapToPlainObject(this.yjsMap) as T;
    
    // 监听 Yjs 更新,转换为 ShareDB 风格事件
    this.yjsMap.observe((event) => {
      this.handleYjsChange(event);
    });
  }
  
  /**
   * 模拟 ShareDB 的 emit 方法
   * 触发 'op batch' 事件
   */
  emit(event: string, ops: any[], local: boolean = false): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        listener(ops, local);
      });
    }
  }
  
  /**
   * 模拟 ShareDB 的 on 方法
   * 监听 'op batch' 事件
   */
  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }
  
  /**
   * 移除监听器
   */
  removeListener(event: string, listener: Function): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }
  
  /**
   * 获取监听器数量
   */
  listenerCount(event: string): number {
    return this.listeners.get(event)?.size || 0;
  }
  
  /**
   * 处理 Yjs 变更,转换为 ShareDB ops
   */
  private handleYjsChange(event: Y.YMapEvent<any>): void {
    const ops: any[] = [];
    
    event.changes.keys.forEach((change, key) => {
      if (change.action === 'add' || change.action === 'update') {
        const newValue = this.yjsMap.get(key);
        const oldValue = change.oldValue;
        
        // 构建类似 ShareDB 的 op
        ops.push({
          p: ['fields', key],  // path
          oi: newValue,         // object insert
          od: oldValue,         // object delete
        });
        
        // 同步更新 data
        if (this.data && typeof this.data === 'object') {
          (this.data as any).fields = (this.data as any).fields || {};
          (this.data as any).fields[key] = newValue;
        }
      } else if (change.action === 'delete') {
        ops.push({
          p: ['fields', key],
          od: change.oldValue,
        });
        
        if (this.data && typeof this.data === 'object') {
          delete (this.data as any).fields?.[key];
        }
      }
    });
    
    if (ops.length > 0) {
      // 触发 'op batch' 事件 (不是本地操作)
      this.emit('op batch', ops, false);
    }
  }
  
  /**
   * 将 Y.Map 转换为普通对象
   */
  private yjsMapToPlainObject(ymap: Y.Map<any>): any {
    const obj: any = {};
    ymap.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }
  
  /**
   * 模拟 ShareDB 的 subscribe
   */
  subscribe(callback?: (error?: Error) => void): void {
    // Yjs 自动订阅,这里只需要触发回调
    callback?.();
  }
  
  /**
   * 模拟 ShareDB 的 unsubscribe
   */
  unsubscribe(callback?: () => void): void {
    // Yjs 的取消订阅在 destroy 中处理
    callback?.();
  }
  
  /**
   * 模拟 ShareDB 的 fetch
   */
  fetch(callback: (error?: Error) => void): void {
    // Yjs 文档已经同步,直接触发回调
    callback();
  }
  
  /**
   * 销毁文档
   */
  destroy(): void {
    this.listeners.clear();
    // Yjs 文档由连接管理,这里不直接销毁
  }
}

/**
 * Yjs 适配 ShareDB Connection 接口
 */
export class YjsConnection implements Partial<ShareDBConnection> {
  private yjsDoc: Y.Doc;
  private provider: WebsocketProvider | null = null;
  private documents: Map<string, YjsDoc> = new Map();
  private listeners: Map<string, Set<Function>> = new Map();
  
  constructor(wsUrl: string, accessToken?: string) {
    this.yjsDoc = new Y.Doc();
    
    // 创建 WebSocket Provider
    this.provider = new WebsocketProvider(
      wsUrl,
      'shared-doc',  // room name
      this.yjsDoc,
      {
        params: {
          token: accessToken,
        },
      }
    );
    
    // 监听连接状态
    this.provider.on('status', ({ status }: { status: string }) => {
      if (status === 'connected') {
        this.emit('connected');
      } else if (status === 'disconnected') {
        this.emit('disconnected');
      }
    });
  }
  
  /**
   * 模拟 ShareDB 的 get 方法
   * 获取或创建文档
   */
  get<T = any>(collection: string, id: string): YjsDoc<T> {
    const key = `${collection}_${id}`;
    
    if (!this.documents.has(key)) {
      const doc = new YjsDoc<T>(collection, id, this.yjsDoc);
      this.documents.set(key, doc);
    }
    
    return this.documents.get(key) as YjsDoc<T>;
  }
  
  /**
   * 模拟 ShareDB 的 createSubscribeQuery
   * 创建查询订阅
   */
  createSubscribeQuery<T = any>(
    collection: string, 
    query: any
  ): YjsQuery<T> {
    return new YjsQuery<T>(collection, query, this.yjsDoc, this);
  }
  
  /**
   * 事件系统
   */
  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }
  
  emit(event: string, ...args: any[]): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(...args));
    }
  }
  
  removeListener(event: string, listener: Function): void {
    this.listeners.get(event)?.delete(listener);
  }
  
  /**
   * 模拟 ping 方法
   */
  ping(): void {
    // Yjs provider 自带心跳,这里不需要额外实现
  }
  
  /**
   * 关闭连接
   */
  close(): void {
    this.provider?.destroy();
    this.documents.clear();
    this.listeners.clear();
  }
}

/**
 * Yjs 适配 ShareDB Query 接口
 * 处理批量文档查询
 */
export class YjsQuery<T = any> implements Partial<ShareDBQuery<T>> {
  public collection: string;
  public query: any;
  public results: YjsDoc<T>[] = [];
  public extra: any;
  public ready: boolean = false;
  public sent: boolean = false;
  
  private yjsDoc: Y.Doc;
  private connection: YjsConnection;
  private listeners: Map<string, Set<Function>> = new Map();
  
  constructor(
    collection: string,
    query: any,
    yjsDoc: Y.Doc,
    connection: YjsConnection
  ) {
    this.collection = collection;
    this.query = query;
    this.yjsDoc = yjsDoc;
    this.connection = connection;
    
    // 自动执行查询
    this.executeQuery();
  }
  
  /**
   * 执行查询
   */
  private async executeQuery(): Promise<void> {
    this.sent = true;
    
    // 模拟查询逻辑
    // 实际应该通过 HTTP API 获取初始数据
    // 然后用 Yjs 同步后续更新
    
    // 这里简化处理,假设通过 HTTP 获取了记录 IDs
    const recordIds = await this.fetchRecordIds();
    
    // 为每个记录创建 YjsDoc
    this.results = recordIds.map(id => {
      return this.connection.get<T>(this.collection, id);
    });
    
    this.ready = true;
    this.emit('ready');
  }
  
  /**
   * 通过 HTTP 获取记录 IDs
   */
  private async fetchRecordIds(): Promise<string[]> {
    // TODO: 调用 REST API 获取记录列表
    // 例如: GET /api/tables/{tableId}/records
    return [];
  }
  
  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }
  
  emit(event: string, ...args: any[]): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(...args));
    }
  }
  
  once(event: string, listener: Function): void {
    const onceWrapper = (...args: any[]) => {
      listener(...args);
      this.removeListener(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }
  
  removeListener(event: string, listener: Function): void {
    this.listeners.get(event)?.delete(listener);
  }
  
  removeAllListeners(): void {
    this.listeners.clear();
  }
  
  destroy(callback?: () => void): void {
    this.listeners.clear();
    this.results = [];
    callback?.();
  }
}

// 导出类型供其他模块使用
export type { ShareDBDoc, ShareDBConnection, ShareDBQuery };
