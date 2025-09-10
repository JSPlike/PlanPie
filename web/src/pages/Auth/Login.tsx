// src/pages/Auth/Login.tsx
import React, { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { LoginRequest } from '../../types/auth.types';
import SocialLogin from '../../components/SocialLogin';
import './Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // 에러 메시지 클리어
    if (error) setError('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(formData);
      const { access, refresh, user } = response.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      if (rememberMe) {
        localStorage.setItem('remember_email', formData.email);
      }
      
      navigate('/');
    } catch (error: any) {
      setError(error.response?.data?.detail || '이메일 또는 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* 왼쪽 일러스트 섹션 */}
      <div className="login-illustration">
        <div className="illustration-content">
          <h1>Welcome Back!</h1>
          <p>일정 관리의 모든 것, PlanPie와 함께하세요</p>
          <div className="features">
            <div className="feature">
              <span className="feature-icon">📅</span>
              <span>스마트한 일정 관리</span>
            </div>
            <div className="feature">
              <span className="feature-icon">👥</span>
              <span>팀과 실시간 공유</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🎨</span>
              <span>나만의 캘린더 커스터마이징</span>
            </div>
          </div>
        </div>
        <div className="illustration-image">
          <svg viewBox="0 0 400 400" className="animated-svg">
            <circle cx="200" cy="200" r="150" fill="url(#gradient)" opacity="0.3"/>
            <rect x="150" y="150" width="100" height="100" rx="20" fill="white" opacity="0.9"/>
            <path d="M150 180 L250 180" stroke="#667eea" strokeWidth="3"/>
            <circle cx="180" cy="140" r="5" fill="#667eea"/>
            <circle cx="220" cy="140" r="5" fill="#667eea"/>
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#667eea"/>
                <stop offset="100%" stopColor="#764ba2"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* 오른쪽 로그인 폼 섹션 */}
      <div className="login-form-section">
        <div className="login-form-container">
          <div className="login-header">
            <h2>로그인</h2>
            <p>계정에 로그인하여 시작하세요</p>
          </div>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">이메일</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M3 8L12 13L21 8M3 8V16C3 17.1 3.9 18 5 18H19C20.1 18 21 17.1 21 16V8M3 8L12 3L21 8" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </span>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">비밀번호</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 11V7C12 5 13 3 16 3C19 3 20 5 20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>로그인 상태 유지</span>
              </label>
              <Link to="/forgot-password" className="forgot-link">
                비밀번호를 잊으셨나요?
              </Link>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className={`submit-button ${loading ? 'loading' : ''}`}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  로그인 중...
                </>
              ) : (
                '로그인'
              )}
            </button>
          </form>

          <div className="divider">
            <span>또는</span>
          </div>

          <SocialLogin />

          <div className="signup-link">
            <span>아직 계정이 없으신가요?</span>
            <Link to="/register">회원가입하기</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
