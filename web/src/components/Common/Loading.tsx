import React from 'react';
import './Loading.css';

interface LoadingProps {
  fullScreen?: boolean;
  message?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'spinner' | 'dots' | 'calendar';
}

const Loading: React.FC<LoadingProps> = ({ 
  fullScreen = true, 
  message = 'Loading...', 
  size = 'medium',
  variant = 'spinner'
}) => {
  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>;
      
      case 'calendar':
        return <div className="loading-calendar">
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="6" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M3 10H21" stroke="currentColor" strokeWidth="2"/>
            <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="15" r="1" fill="currentColor" className="calendar-dot"/>
          </svg>
        </div>;
      
      default:
        return <div className={`loading-spinner ${size}`}></div>;
    }
  };

  return (
    <div className={`loading-container ${fullScreen ? 'fullscreen' : ''}`}>
      <div className="loading-content">
        {renderLoader()}
        {message && <p className="loading-message">{message}</p>}
      </div>
    </div>
  );
};

export default Loading;