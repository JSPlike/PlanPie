import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  User,
  AuthTokens,
  RegisterRequest,
  LoginRequest,
  SocialLoginRequest,
  AuthResponse,
} from '../types/auth.types';

const API_BASE_URL = 'http://localhost:8000/api';

// Axios 인스턴스 생성
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request 인터셉터 - 토큰 자동 추가
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response 인터셉터 - 토큰 갱신
/* TODO: 개발중 임시 인터셉터 주석처리
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post<{ access: string }>(
          `${API_BASE_URL}/accounts/token/refresh/`,
          { refresh: refreshToken }
        );

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access}`;
        }
        
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
*/

// // 개발용 임시 인터셉터 (필요시)
// api.interceptors.request.use(
//   (config: InternalAxiosRequestConfig) => {
//     console.log('API Request:', config.method?.toUpperCase(), config.url);
//     console.log('Request data:', config.data);
//     return config;
//   },
//   (error: AxiosError) => {
//     return Promise.reject(error);
//   }
// );

// api.interceptors.response.use(
//   (response) => {
//     console.log('API Response:', response.status, response.config.url);
//     return response;
//   },
//   (error: AxiosError) => {
//     console.error('API Error:', error.response?.status, error.config?.url);
//     return Promise.reject(error);
//   }
// );

// API 함수들
export const authAPI = {
  register: (userData: RegisterRequest) => 
    api.post<AuthResponse>('/accounts/register/', userData),
  
  login: (credentials: LoginRequest) => 
    api.post<AuthResponse>('/accounts/login/', credentials),
  
  socialLogin: (provider: 'google' | 'kakao', accessToken: string) => 
    api.post<AuthResponse>('/accounts/social-login/', {
      provider,
      access_token: accessToken,
    } as SocialLoginRequest),

  getCurrentUser: () => 
    api.get<User>('/accounts/user/'),
  
  refreshToken: (refreshToken: string) =>
    api.post<{ access: string }>('/accounts/token/refresh/', {
      refresh: refreshToken,
    }),
  
  logout: (): void => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};

export default api;
