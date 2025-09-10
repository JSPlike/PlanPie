// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authAPI } from '../services/api';
import { User } from '../types/auth.types';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  checkAuth: () => Promise<void>;
}

interface RegisterRequest {
  email: string;
  password: string;
  password2: string;
  username: string;
  first_name?: string;
  last_name?: string;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 토큰 설정 헬퍼 함수
  const setAuthToken = (token: string | null) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  };

  // 인증 상태 확인
  const checkAuth = useCallback(async () => {
    const accessToken = localStorage.getItem('access_token');
    
    if (!accessToken) {
      setIsLoading(false);
      setIsAuthenticated(false);
      return;
    }

    try {
      setAuthToken(accessToken);
      const response = await authAPI.getCurrentUser();
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth check failed:', error);
      // 토큰이 유효하지 않으면 정리
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setAuthToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 컴포넌트 마운트 시 인증 확인
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 로그인
  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      const { access, refresh, user: userData } = response.data;

      // 토큰 저장
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      // API 헤더 설정
      setAuthToken(access);

      // 상태 업데이트
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error: any) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // 회원가입
  const register = async (data: RegisterRequest) => {
    try {
      const response = await authAPI.register(data);
      const { access, refresh, user: userData } = response.data;

      // 토큰 저장
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      // API 헤더 설정
      setAuthToken(access);

      // 상태 업데이트
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error: any) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  // 로그아웃
  const logout = async () => {
    try {
      // 서버에 로그아웃 요청 (선택적)
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // 로컬 정리
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setAuthToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // 사용자 정보 업데이트
  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
