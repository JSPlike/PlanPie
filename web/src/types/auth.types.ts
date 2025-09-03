// 사용자 모델
export interface User {
    id: string;
    email: string | null;
    username: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
    profile_image?: string;
    profile_image_url?: string;
    birth_date?: string;
    login_method: 'email' | 'google' | 'kakao';
    is_active: boolean;
    is_staff: boolean;
    is_verified: boolean;
    date_joined: string;
    last_login?: string;
  }
  
  // 인증 토큰
  export interface AuthTokens {
    access: string;
    refresh: string;
  }
  
  // 회원가입 요청
  export interface RegisterRequest {
    email: string;
    username: string;
    password: string;
    password2: string;
    first_name?: string;
    last_name?: string;
  }
  
  // 로그인 요청
  export interface LoginRequest {
    email: string;
    password: string;
  }
  
  // 소셜 로그인 요청
  export interface SocialLoginRequest {
    provider: 'google' | 'kakao';
    access_token: string;
  }
  
  // API 응답
  export interface AuthResponse {
    user: User;
    tokens: AuthTokens;
  }
  
  // 에러 응답
  export interface ErrorResponse {
    detail?: string;
    [key: string]: any;
  }
  