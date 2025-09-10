import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { authAPI } from '../services/api';

// 환경 변수나 설정 파일에서 가져오기
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const KAKAO_APP_KEY = process.env.REACT_APP_KAKAO_APP_KEY || 'YOUR_KAKAO_APP_KEY';

// Kakao SDK 타입 정의
declare global {
  interface Window {
    Kakao: any;
  }
}

const SocialLogin: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Kakao SDK 초기화
    const initKakao = () => {
      const script = document.createElement('script');
      script.src = 'https://developers.kakao.com/sdk/js/kakao.js';
      script.async = true;
      
      script.onload = () => {
        if (window.Kakao && !window.Kakao.isInitialized()) {
          window.Kakao.init(KAKAO_APP_KEY);
          console.log('Kakao SDK initialized');
        }
      };
      
      document.body.appendChild(script);
      
      return () => {
        document.body.removeChild(script);
      };
    };

    initKakao();
  }, []);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse): Promise<void> => {
    if (!credentialResponse.credential) {
      alert('Google 로그인 실패: 인증 정보를 받을 수 없습니다.');
      return;
    }

    try {
      const response = await authAPI.socialLogin('google', credentialResponse.credential);
      const { access, refresh, user } = response.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      alert(`Google 로그인 성공! ${user.email || user.username}님 환영합니다.`);
      navigate('/profile');
    } catch (error) {
      console.error('Google 로그인 실패:', error);
      alert('Google 로그인 처리 중 오류가 발생했습니다.');
    }
  };

  const handleGoogleError = (): void => {
    console.error('Google 로그인 에러');
    alert('Google 로그인에 실패했습니다.');
  };

  const handleKakaoLogin = (): void => {
    if (!window.Kakao) {
      alert('Kakao SDK를 로드할 수 없습니다.');
      return;
    }

    window.Kakao.Auth.login({
      success: async (authObj: any) => {
        try {
          const response = await authAPI.socialLogin('kakao', authObj.access_token);
          const { access, refresh, user } = response.data;
          
          localStorage.setItem('access_token', access);
          localStorage.setItem('refresh_token', refresh);
          
          alert(`Kakao 로그인 성공! ${user.email || user.username}님 환영합니다.`);
          navigate('/profile');
        } catch (error) {
          console.error('Kakao 로그인 실패:', error);
          alert('Kakao 로그인 처리 중 오류가 발생했습니다.');
        }
      },
      fail: (err: any) => {
        console.error('Kakao 로그인 실패:', err);
        alert('Kakao 로그인에 실패했습니다.');
      },
    });
  };

  return (
    <div>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <div style={{ marginBottom: '10px' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
            text="signin_with"
            shape="rectangular"
            theme="outline"
            size="large"
            width={400}
          />
        </div>
      </GoogleOAuthProvider>

      <button
        onClick={handleKakaoLogin}
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: '#FEE500',
          color: '#000000',
          border: '1px solid #FEE500',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img 
          src="https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_small.png" 
          alt="Kakao" 
          style={{ width: '20px', marginRight: '8px' }}
        />
        카카오 로그인
      </button>
    </div>
  );
};

export default SocialLogin;
