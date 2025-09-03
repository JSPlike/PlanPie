import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types/auth.types';
import { authAPI } from '../services/api';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const isAuthenticated = Boolean(localStorage.getItem('access_token'));

  const fetchUser = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await authAPI.getProfile();
      setUser(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch user profile');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.login({ email, password });
      const { tokens, user } = response.data;
      
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      setUser(user);
      
      navigate('/profile');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = (): void => {
    authAPI.logout();
    setUser(null);
    navigate('/login');
  };

  const refreshUser = async (): Promise<void> => {
    await fetchUser();
  };

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    refreshUser,
  };
};
