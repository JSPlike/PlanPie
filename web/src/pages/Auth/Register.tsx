// src/pages/Auth/Register.tsx
import React, { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { RegisterRequest } from '../../types/auth.types';
import SocialLogin from '../../components/SocialLogin';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import './Register.css';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterRequest>({
    email: '',
    username: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showPassword2, setShowPassword2] = useState<boolean>(false);
  const [agreeTerms, setAgreeTerms] = useState<boolean>(false);
  const [step, setStep] = useState<number>(1); // 단계별 회원가입

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // 해당 필드 에러 클리어
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.';
    }
    
    if (!formData.username) {
      newErrors.username = '사용자명을 입력해주세요.';
    } else if (formData.username.length < 3) {
      newErrors.username = '사용자명은 3자 이상이어야 합니다.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password.length < 8) {
      newErrors.password = '비밀번호는 8자 이상이어야 합니다.';
    }
    
    if (!formData.password2) {
      newErrors.password2 = '비밀번호를 다시 입력해주세요.';
    } else if (formData.password !== formData.password2) {
      newErrors.password2 = '비밀번호가 일치하지 않습니다.';
    }
    
    if (!agreeTerms) {
      newErrors.terms = '이용약관에 동의해주세요.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = (): void => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handlePrevStep = (): void => {
    setStep(1);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (step === 1) {
      handleNextStep();
      return;
    }
    
    if (!validateStep2()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await authAPI.register(formData);
      const { access, refresh, user } = response.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      navigate('/calendars/create'); // 회원가입 후 캘린더 생성으로
    } catch (error: any) {
      if (error.response?.data) {
        setErrors(error.response.data);
      } else {
        setErrors({ general: '회원가입에 실패했습니다. 다시 시도해주세요.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (): { text: string; color: string; width: string } => {
    const password = formData.password;
    if (!password) return { text: '', color: '', width: '0%' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    const strengthMap = {
      0: { text: '매우 약함', color: '#ef4444', width: '20%' },
      1: { text: '약함', color: '#f97316', width: '40%' },
      2: { text: '보통', color: '#eab308', width: '60%' },
      3: { text: '강함', color: '#22c55e', width: '80%' },
      4: { text: '매우 강함', color: '#10b981', width: '100%' },
      5: { text: '매우 강함', color: '#10b981', width: '100%' },
    };
    
    return strengthMap[strength as keyof typeof strengthMap];
  };

  return (
    <div className="register-container">
      {/* 왼쪽 일러스트 섹션 */}
      <div className="register-illustration">
        <div className="illustration-content">
          <h1>Join PlanPie!</h1>
          <p>지금 가입하고 스마트한 일정 관리를 시작하세요</p>
          
          <div className="steps-indicator">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>
              <span className="step-number">1</span>
              <span className="step-label">기본 정보</span>
            </div>
            <div className="step-line"></div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>
              <span className="step-number">2</span>
              <span className="step-label">보안 설정</span>
            </div>
          </div>

          <div className="benefits">
            <h3>회원 혜택</h3>
            <ul>
              <li>
                <span className="benefit-icon">✨</span>
                <span>무제한 캘린더 생성</span>
              </li>
              <li>
                <span className="benefit-icon">🚀</span>
                <span>실시간 동기화</span>
              </li>
              <li>
                <span className="benefit-icon">🎨</span>
                <span>커스텀 테마</span>
              </li>
              <li>
                <span className="benefit-icon">📱</span>
                <span>모바일 앱 지원</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="illustration-decoration">
          <div className="floating-card card-1">📅</div>
          <div className="floating-card card-2">✅</div>
          <div className="floating-card card-3">🎯</div>
        </div>
      </div>

      {/* 오른쪽 회원가입 폼 섹션 */}
      <div className="register-form-section">
        <div className="register-form-container">
          <div className="register-header">
            <h2>회원가입</h2>
            <p>
              {step === 1 ? '기본 정보를 입력해주세요' : '보안 설정을 완료해주세요'}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="register-form">
            {step === 1 ? (
              <>
                {/* Step 1: 기본 정보 */}
                <div className="form-group">
                  <label htmlFor="email">이메일 *</label>
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
                      className={`auth-form-input has-icon ${errors.email ? 'error' : ''}`}
                    />
                  </div>
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="username">사용자명 *</label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12Z" fill="currentColor"/>
                        <path d="M12 14C7.59 14 4 17.59 4 22H20C20 17.59 16.41 14 12 14Z" fill="currentColor"/>
                      </svg>
                    </span>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      placeholder="사용자명"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      className={`auth-form-input has-icon ${errors.username ? 'error' : ''}`}
                    />
                  </div>
                  {errors.username && <span className="field-error">{errors.username}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="first_name">이름 (선택)</label>
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      placeholder="이름"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="auth-form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="last_name">성 (선택)</label>
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      placeholder="성"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="auth-form-input"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="submit-button next-button"
                >
                  다음 단계
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </>
            ) : (
              <>
                {/* Step 2: 보안 설정 */}
                <div className="form-group">
                  <label htmlFor="password">비밀번호 *</label>
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
                      placeholder="8자 이상의 비밀번호"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className={`auth-form-input has-icon ${errors.password ? 'error' : ''}`}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? AiOutlineEyeInvisible({}) : AiOutlineEye({})}
                    </button>
                  </div>
                  {errors.password && <span className="field-error">{errors.password}</span>}
                  
                  {formData.password && (
                    <div className="password-strength">
                      <div className="strength-bar">
                        <div 
                          className="strength-fill"
                          style={{ 
                            width: getPasswordStrength().width,
                            backgroundColor: getPasswordStrength().color 
                          }}
                        />
                      </div>
                      <span 
                        className="strength-text"
                        style={{ color: getPasswordStrength().color }}
                      >
                        {getPasswordStrength().text}
                      </span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="password2">비밀번호 확인 *</label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </span>
                    <input
                      type={showPassword2 ? "text" : "password"}
                      id="password2"
                      name="password2"
                      placeholder="비밀번호를 다시 입력하세요"
                      value={formData.password2}
                      onChange={handleChange}
                      required
                      className={`auth-form-input has-icon ${errors.password2 ? 'error' : ''}`}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword2(!showPassword2)}
                    >
                      {showPassword ? AiOutlineEyeInvisible({}) : AiOutlineEye({})}
                    </button>
                  </div>
                  {errors.password2 && <span className="field-error">{errors.password2}</span>}
                  {formData.password2 && formData.password === formData.password2 && (
                    <span className="success-message">✓ 비밀번호가 일치합니다</span>
                  )}
                </div>

                <div className="terms-section">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                    />
                    <span>
                      <Link to="/terms" target="_blank">이용약관</Link> 및 
                      <Link to="/privacy" target="_blank"> 개인정보처리방침</Link>에 동의합니다
                    </span>
                  </label>
                  {errors.terms && <span className="field-error">{errors.terms}</span>}
                </div>

                <div className="button-group">
                  <button 
                    type="button"
                    onClick={handlePrevStep}
                    className="back-button"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    이전
                  </button>
                  
                  <button 
                    type="submit" 
                    disabled={loading || !agreeTerms}
                    className={`submit-button ${loading ? 'loading' : ''}`}
                  >
                    {loading ? (
                      <>
                        <span className="spinner"></span>
                        가입 중...
                      </>
                    ) : (
                      '가입하기'
                    )}
                  </button>
                </div>
              </>
            )}

            {errors.general && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {errors.general}
              </div>
            )}
          </form>

          <div className="divider">
            <span>또는</span>
          </div>

          <SocialLogin />

          <div className="signin-link">
            <span>이미 계정이 있으신가요?</span>
            <Link to="/login">로그인하기</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
