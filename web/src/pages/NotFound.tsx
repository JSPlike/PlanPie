// src/pages/NotFound.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './NotFound.css';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleGoHome = () => {
    navigate(isAuthenticated ? '/' : '/login');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        {/* 404 일러스트 */}
        <div className="not-found-illustration">
          <svg
            className="not-found-svg"
            width="400"
            height="300"
            viewBox="0 0 400 300"
            fill="none"
          >
            {/* 캘린더 아이콘 */}
            <g className="calendar-icon">
              <rect x="150" y="80" width="100" height="100" rx="10" fill="#E2E8F0" stroke="#CBD5E0" strokeWidth="2"/>
              <rect x="150" y="80" width="100" height="30" rx="10" fill="#5C7AEA"/>
              <circle cx="175" cy="70" r="5" fill="#5C7AEA"/>
              <circle cx="225" cy="70" r="5" fill="#5C7AEA"/>
              <line x1="175" y1="70" x2="175" y2="90" stroke="#5C7AEA" strokeWidth="3" strokeLinecap="round"/>
              <line x1="225" y1="70" x2="225" y2="90" stroke="#5C7AEA" strokeWidth="3" strokeLinecap="round"/>
              
              {/* 404 텍스트 */}
              <text x="200" y="145" fontSize="36" fontWeight="bold" textAnchor="middle" fill="#2D3748">404</text>
            </g>
            
            {/* 구름 장식 */}
            <g className="clouds">
              <ellipse cx="80" cy="50" rx="25" ry="15" fill="#F7FAFC" opacity="0.8"/>
              <ellipse cx="320" cy="60" rx="30" ry="18" fill="#F7FAFC" opacity="0.8"/>
              <ellipse cx="350" cy="200" rx="20" ry="12" fill="#F7FAFC" opacity="0.6"/>
              <ellipse cx="50" cy="180" rx="22" ry="13" fill="#F7FAFC" opacity="0.7"/>
            </g>
            
            {/* 물음표들 */}
            <g className="question-marks">
              <text x="120" y="150" fontSize="24" fill="#CBD5E0" opacity="0.6">?</text>
              <text x="280" y="130" fontSize="28" fill="#CBD5E0" opacity="0.5">?</text>
              <text x="100" y="220" fontSize="20" fill="#CBD5E0" opacity="0.4">?</text>
              <text x="300" y="210" fontSize="26" fill="#CBD5E0" opacity="0.5">?</text>
            </g>
          </svg>
        </div>

        {/* 에러 메시지 */}
        <div className="not-found-text">
          <h1 className="not-found-title">페이지를 찾을 수 없습니다</h1>
          <p className="not-found-description">
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          </p>
          <p className="not-found-subdescription">
            URL을 다시 확인하시거나 아래 버튼을 통해 이동해주세요.
          </p>
        </div>

        {/* 액션 버튼들 */}
        <div className="not-found-actions">
          <button 
            className="btn-primary"
            onClick={handleGoHome}
          >
            {isAuthenticated ? '캘린더로 돌아가기' : '로그인 페이지로'}
          </button>
          <button 
            className="btn-secondary"
            onClick={handleGoBack}
          >
            이전 페이지로
          </button>
        </div>

        {/* 추가 도움말 */}
        <div className="not-found-help">
          <p>계속 문제가 발생한다면?</p>
          <div className="help-links">
            <a href="/help" className="help-link">도움말 센터</a>
            <span className="separator">•</span>
            <a href="/contact" className="help-link">문의하기</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
