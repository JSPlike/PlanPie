import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  User,
  AuthTokens,
  RegisterRequest,
  LoginRequest,
  SocialLoginRequest,
  AuthResponse,
} from '../types/auth.types';

// API Base URL 설정 (환경 변수 또는 동적 설정)
const getApiBaseUrl = () => {
  // 환경 변수가 있으면 사용
  if (process.env.REACT_APP_API_URL) {
    console.log('[API] Using environment variable API URL:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }
  
  // 개발 환경에서 현재 호스트의 IP 사용
  if (process.env.NODE_ENV === 'development') {
    const hostname = window.location.hostname;
    
    // localhost가 아니면 현재 호스트 사용 (핸드폰에서 접속 시 PC의 IP 주소 사용)
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      const apiUrl = `http://${hostname}:8000/api`;
      console.log('[API] Using network API URL:', apiUrl, '(from hostname:', hostname, ')');
      // sessionStorage에 저장 (다음 요청에서 사용)
      sessionStorage.setItem('api_base_url', apiUrl);
      return apiUrl;
    }
    
    // localhost인 경우에도 sessionStorage에 저장된 API URL이 있으면 사용
    // 단, localhost를 포함하지 않은 경우만 사용
    const savedApiUrl = sessionStorage.getItem('api_base_url');
    if (savedApiUrl && !savedApiUrl.includes('localhost')) {
      console.log('[API] Using saved API URL from sessionStorage:', savedApiUrl);
      return savedApiUrl;
    }
  }
  
  // 기본값: localhost
  const defaultUrl = 'http://localhost:8000/api';
  console.log('[API] Using default API URL:', defaultUrl);
  return defaultUrl;
};

// API_BASE_URL을 동적으로 가져오도록 함수로 변경
const getAPIBaseURL = () => getApiBaseUrl();

// Axios 인스턴스 생성 (baseURL을 동적으로 설정)
const api: AxiosInstance = axios.create({
  baseURL: getAPIBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10초 타임아웃
});

// Request 인터셉터 - 토큰 자동 추가 및 baseURL 동적 설정
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 매 요청마다 baseURL을 동적으로 설정 (핸드폰에서 접속 시 올바른 IP 사용)
    // window.location.hostname을 직접 확인하여 항상 최신 값 사용
    let currentBaseURL: string;
    
    // 개발 환경에서 hostname을 직접 확인하여 baseURL 설정
    if (process.env.NODE_ENV === 'development') {
      const hostname = window.location.hostname;
      
      // localhost가 아니면 네트워크 IP 사용 (핸드폰에서 접속 시)
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        currentBaseURL = `http://${hostname}:8000/api`;
        // sessionStorage에 저장 (다음 요청에서 사용)
        sessionStorage.setItem('api_base_url', currentBaseURL);
      } else {
        // localhost인 경우 sessionStorage에 저장된 네트워크 IP 사용
        const savedApiUrl = sessionStorage.getItem('api_base_url');
        if (savedApiUrl && !savedApiUrl.includes('localhost')) {
          currentBaseURL = savedApiUrl;
        } else {
          // 기본값: localhost
          currentBaseURL = 'http://localhost:8000/api';
        }
      }
    } else {
      // 프로덕션 환경
      currentBaseURL = getAPIBaseURL();
    }
    
    // baseURL을 항상 최신 값으로 설정
    config.baseURL = currentBaseURL;
    
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // 개발 환경에서 요청 URL 로깅
    if (process.env.NODE_ENV === 'development') {
      const url = (config.baseURL || '') + (config.url || '');
      console.log('[API Request]', config.method?.toUpperCase(), url, '(hostname:', window.location.hostname, ')');
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response 인터셉터 - 에러 로깅
api.interceptors.response.use(
  (response) => {
    // 개발 환경에서 응답 로깅
    if (process.env.NODE_ENV === 'development') {
      console.log('[API Response]', response.status, response.config.url);
    }
    return response;
  },
  (error: AxiosError) => {
    console.error('[API Response Error]', error.response?.status, error.config?.url);
    console.error('[API Response Error Data]', error.response?.data);
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
