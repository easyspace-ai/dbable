import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthResponse, RegisterRequest } from '@easygrid/sdk';
import luckdb from '@/lib/luckdb';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  setAuth: (auth: AuthResponse) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          const response = await luckdb.login({ email, password });
          
          // 设置 SDK 的 token
          luckdb.setAccessToken(response.accessToken);
          luckdb.setRefreshToken(response.refreshToken);
          
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error('Login failed:', error);
          throw error;
        }
      },

      register: async (userData: RegisterRequest) => {
        try {
          const response = await luckdb.register(userData);
          
          // 设置 SDK 的 token
          luckdb.setAccessToken(response.accessToken);
          luckdb.setRefreshToken(response.refreshToken);
          
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error('Register failed:', error);
          throw error;
        }
      },

      logout: async () => {
        try {
          await luckdb.logout();
        } catch (error) {
          console.error('Logout failed:', error);
        } finally {
          // 清除 SDK 的 token
          luckdb.clearTokens();
          
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
        }
      },

      setAuth: (auth: AuthResponse) => {
        set({
          user: auth.user,
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          isAuthenticated: true,
        });
      },

      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'luckdb-auth', // localStorage key
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

