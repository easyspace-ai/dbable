import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { WebSocketManager } from '../../lib/websocket';
import { ShareDBConnection } from '../../lib/sharedb';
// import type ReconnectingWebSocket from 'reconnecting-websocket';

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

interface IConnectionContext {
  status: ConnectionStatus;
  socket: any | null;
  shareConnection: any | null; // sharedb.Connection type
  subscribeDoc: (collection: string, id: string) => any | null;
  unsubscribeDoc: (collection: string, id: string) => void;
  reconnect: () => void;
}

const ConnectionContext = createContext<IConnectionContext | null>(null);

export function ConnectionProvider({ 
  wsUrl,
  autoConnect = false, // 默认不自动连接，避免示例页面出错
  children 
}: { 
  wsUrl?: string;
  autoConnect?: boolean;
  children: ReactNode;
}) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [wsManager] = useState(() => new WebSocketManager());
  const [shareDBManager] = useState(() => new ShareDBConnection());
  const [socket, setSocket] = useState<ReconnectingWebSocket | null>(null);
  const [shareConnection, setShareConnection] = useState<any | null>(null);

  const connect = useCallback(() => {
    if (!wsUrl) {
      console.warn('No WebSocket URL provided');
      return;
    }

    setStatus('connecting');
    try {
      const ws = wsManager.connect(wsUrl);
      const connection = shareDBManager.initialize(ws);
      
      ws.addEventListener('open', () => setStatus('connected'));
      ws.addEventListener('close', () => setStatus('disconnected'));
      ws.addEventListener('error', () => setStatus('error'));
      
      setSocket(ws);
      setShareConnection(connection);
    } catch (error) {
      console.error('Connection failed:', error);
      setStatus('error');
    }
  }, [wsUrl, wsManager, shareDBManager]);

  const subscribeDoc = useCallback((collection: string, id: string) => {
    if (!shareConnection) {return null;}
    return shareConnection.get(collection, id);
  }, [shareConnection]);

  const unsubscribeDoc = useCallback((collection: string, id: string) => {
    if (!shareConnection) {return;}
    const doc = shareConnection.get(collection, id);
    doc.destroy();
  }, [shareConnection]);

  useEffect(() => {
    if (autoConnect && wsUrl) {
      connect();
    }
    return () => {
      socket?.close();
    };
  }, [autoConnect, wsUrl, connect]);

  return (
    <ConnectionContext.Provider value={{
      status,
      socket,
      shareConnection,
      subscribeDoc,
      unsubscribeDoc,
      reconnect: connect,
    }}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnection must be used within ConnectionProvider');
  }
  return context;
}


