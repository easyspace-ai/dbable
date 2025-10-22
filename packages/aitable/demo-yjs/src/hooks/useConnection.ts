import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { config } from '../config';

export interface User {
  id: string;
  email: string;
  name: string;
}

export function useConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // 从 localStorage 恢复登录状态
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('accessToken');
    
    if (savedUser && savedToken) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setAccessToken(savedToken);
        setIsConnected(true);
        console.log('从 localStorage 恢复登录状态:', userData);
      } catch (error) {
        console.error('恢复登录状态失败:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
      }
    }
  }, []);

  console.log('useConnection 渲染 - isConnected:', isConnected, 'user:', user);

  // 登录
  const login = useCallback(async (email: string, password: string) => {
    console.log('开始登录:', email);
    setIsConnecting(true);
    setError(null);

    try {
      const response = await axios.post(`${config.baseURL}/api/v1/auth/login`, {
        email,
        password,
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('登录响应:', response.data);
      
      if (response.data.code === 200000 && response.data.data) {
        const { accessToken: token, user: userData } = response.data.data;
        
        console.log('登录成功，设置状态');
        
        // 直接设置状态
        setUser(userData);
        setAccessToken(token);
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        
        // 保存到 localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('accessToken', token);
        
        console.log('状态设置完成，已保存到 localStorage');
        
        // 强制触发重新渲染
        setTimeout(() => {
          console.log('强制重新渲染触发');
        }, 0);
        return true;
      } else {
        setError(response.data.message || '登录失败');
        setIsConnecting(false);
        setIsConnected(false);
        setUser(null);
        setAccessToken(null);
        return false;
      }
    } catch (error) {
      console.error('登录失败:', error);
      setError(`登录失败: ${error}`);
      setIsConnecting(false);
      setIsConnected(false);
      setUser(null);
      setAccessToken(null);
      return false;
    }
  }, []);

  // 登出
  const logout = useCallback(async () => {
    console.log('登出');
    setIsConnected(false);
    setUser(null);
    setAccessToken(null);
    setError(null);
    
    // 清除 localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    
    console.log('已清除 localStorage');
  }, []);

  // 获取连接状态
  const getConnectionState = useCallback(() => {
    return isConnected ? 'connected' : 'disconnected';
  }, [isConnected]);

  return {
    isConnected,
    isConnecting,
    error,
    user,
    accessToken,
    login,
    logout,
    getConnectionState,
  };
}
