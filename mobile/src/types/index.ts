// 사용자 타입
export interface User {
  id: number;
  email: string;
  name: string;
  profile_image?: string;
}

// 인증 타입
export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

