import React, { useState, useEffect } from 'react';
import { LoginForm } from './components/LoginForm';
import { TableViewV3 } from './components/TableViewV3';
import { useConnection } from './hooks/useConnection';

export default function App() {
  const { isConnected, user, login, logout, isConnecting, error } = useConnection();
  const [showLogin, setShowLogin] = useState(!isConnected);

  // 同步登录状态
  useEffect(() => {
    console.log('🔄 同步登录状态:', { isConnected, showLogin });
    setShowLogin(!isConnected);
  }, [isConnected]);

  const handleLogin = async (email: string, password: string) => {
    const success = await login(email, password);
    if (success) {
      setShowLogin(false);
    }
    return success;
  };

  const handleLogout = () => {
    logout();
    setShowLogin(true);
  };

  console.log('🎯 App 渲染状态:', { showLogin, isConnected, user: user?.name });

  if (showLogin || !isConnected) {
    console.log('📝 显示登录页面');
    return (
      <LoginForm 
        onLogin={handleLogin}
        isConnecting={isConnecting}
        error={error}
        isConnected={isConnected}
      />
    );
  }

  console.log('🏠 显示主界面');
  return (
    <div className="h-screen w-full flex flex-col">
      {/* 顶部导航栏 */}
      <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center space-x-3">
          <h1 className="text-lg font-semibold text-gray-900">EasyGrid Demo</h1>
          <span className="text-sm text-gray-500">v3.0</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600">
            欢迎, {user?.name} ({user?.email})
          </span>
          <button
            onClick={handleLogout}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
          >
            退出登录
          </button>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 min-h-0">
        <TableViewV3 />
      </div>
    </div>
  );
}