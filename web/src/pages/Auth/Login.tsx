// src/pages/Auth/Login.tsx
import React, { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { LoginRequest } from '../../types/auth.types';
import SocialLogin from '../../components/SocialLogin';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import './Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/calendars';
  
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });

  // 현재 달 가져오기
  const getCurrentMonth = () => {
    const months = [
      'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
      'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
    ];
    return months[new Date().getMonth()];
  };

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
      console.log('[Login] Attempting login with:', formData.email);
      const response = await authAPI.login(formData);
      console.log('[Login] Login response:', response);
      
      const { access, refresh, user } = response.data;
      
      if (!access || !refresh) {
        throw new Error('로그인 응답에 토큰이 없습니다.');
      }
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      console.log('[Login] Tokens saved to localStorage');
      
      if (rememberMe) {
        localStorage.setItem('remember_email', formData.email);
      }
      
      // 로그인 성공 후 리다이렉트 (redirect 파라미터가 있으면 해당 경로로)
      console.log('[Login] Redirecting to:', redirectPath);
      navigate(redirectPath);
    } catch (error: any) {
      console.error('[Login] Login error:', error);
      console.error('[Login] Error response:', error.response);
      
      // Network Error인 경우 더 자세한 메시지 표시
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        const apiUrl = sessionStorage.getItem('api_base_url') || 'http://localhost:8000/api';
        setError(`네트워크 연결 오류: 백엔드 서버(${apiUrl})에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.`);
      } else {
        setError(error.response?.data?.detail || error.response?.data?.non_field_errors?.[0] || error.message || '이메일 또는 비밀번호를 확인해주세요.');
      }
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
            {/* 배경 그라데이션 원 */}
            <defs>
              <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#667eea" stopOpacity="0.6"/>
                <stop offset="100%" stopColor="#764ba2" stopOpacity="0.3"/>
              </linearGradient>
              <linearGradient id="gradient2" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f472b6" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#bd34fe" stopOpacity="0.2"/>
              </linearGradient>
              <filter id="shadow">
                <feDropShadow dx="0" dy="10" stdDeviation="15" floodOpacity="0.2"/>
              </filter>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* 배경 장식 원들 */}
            <circle cx="100" cy="100" r="60" fill="url(#gradient2)" className="floating-circle-1"/>
            <circle cx="300" cy="320" r="80" fill="url(#gradient1)" className="floating-circle-2"/>
            <circle cx="350" cy="150" r="40" fill="url(#gradient2)" className="floating-circle-3"/>
            
            {/* 메인 캘린더 카드 */}
            <g filter="url(#shadow)" className="calendar-card-group">
              {/* 카드 배경 */}
              <rect x="120" y="120" width="160" height="160" rx="20" fill="white"/>
              
              {/* 캘린더 헤더 */}
              <rect x="120" y="120" width="160" height="45" rx="20" fill="#667eea"/>
              <rect x="120" y="145" width="160" height="20" fill="#667eea"/>
              
              {/* 캘린더 고리 */}
              <circle cx="160" cy="115" r="8" fill="none" stroke="white" strokeWidth="3"/>
              <circle cx="240" cy="115" r="8" fill="none" stroke="white" strokeWidth="3"/>
              <line x1="160" y1="107" x2="160" y2="130" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              <line x1="240" y1="107" x2="240" y2="130" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              
              {/* 월 표시 */}
              <text x="200" y="150" fontSize="18" fontWeight="bold" fill="white" textAnchor="middle">
                {getCurrentMonth()}
              </text>
              
              {/* 캘린더 그리드 */}
              <g className="calendar-grid">
                {/* 요일 헤더 */}
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <text 
                    key={day + i}
                    x={135 + i * 20} 
                    y="185" 
                    fontSize="10" 
                    fill="#94a3b8" 
                    textAnchor="middle"
                  >
                    {day}
                  </text>
                ))}
                
                {/* 날짜 점들 */}
                {Array.from({ length: 28 }, (_, i) => {
                  const row = Math.floor(i / 7);
                  const col = i % 7;
                  const isToday = i === 14;
                  const hasEvent = [5, 12, 14, 20, 25].includes(i);
                  
                  return (
                    <g key={i}>
                      {isToday && (
                        <circle 
                          cx={135 + col * 20} 
                          cy={200 + row * 20} 
                          r="10" 
                          fill="#667eea" 
                          opacity="0.2"
                        />
                      )}
                      <circle 
                        cx={135 + col * 20} 
                        cy={200 + row * 20} 
                        r="2" 
                        fill={isToday ? "#667eea" : hasEvent ? "#f472b6" : "#cbd5e1"}
                        className={hasEvent ? "event-dot" : ""}
                      />
                    </g>
                  );
                })}
              </g>
            </g>
            
            {/* 플로팅 아이콘들 */}
            <g className="floating-icons">
              <g transform="translate(50, 200)" className="float-icon-1">
                <circle cx="0" cy="0" r="25" fill="white" opacity="0.9" filter="url(#shadow)"/>
                <text x="0" y="5" fontSize="20" textAnchor="middle">✅</text>
              </g>
              
              <g transform="translate(320, 80)" className="float-icon-2">
                <circle cx="0" cy="0" r="25" fill="white" opacity="0.9" filter="url(#shadow)"/>
                <text x="0" y="5" fontSize="20" textAnchor="middle">📅</text>
              </g>
              
              <g transform="translate(350, 250)" className="float-icon-3">
                <circle cx="0" cy="0" r="25" fill="white" opacity="0.9" filter="url(#shadow)"/>
                <text x="0" y="5" fontSize="20" textAnchor="middle">⏰</text>
              </g>
            </g>
            
            {/* 연결선 */}
            <g className="connection-lines" opacity="0.3">
              <line x1="75" y1="200" x2="120" y2="200" stroke="#667eea" strokeWidth="2" strokeDasharray="5,5"/>
              <line x1="280" y1="200" x2="325" y2="225" stroke="#764ba2" strokeWidth="2" strokeDasharray="5,5"/>
              <line x1="320" y1="105" x2="280" y2="140" stroke="#f472b6" strokeWidth="2" strokeDasharray="5,5"/>
            </g>
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
                  className="auth-form-input has-icon"
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
                  className="auth-form-input has-icon"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? AiOutlineEyeInvisible({}) : AiOutlineEye({})}
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
