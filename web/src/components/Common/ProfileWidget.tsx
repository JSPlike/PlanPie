// src/components/Common/ProfileWidget.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './ProfileWidget.css';

const ProfileWidget: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3); // 예시 알림 개수

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = () => {
    if (!user) return '?';
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    const email = user.email || '';
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    } else if (firstName) {
      return firstName.slice(0, 2).toUpperCase();
    } else if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return '?';
  };

  if (!user) return null;

  return (
    <>
      {/* 플로팅 프로필 버튼 */}
      <div className="profile-widget">
        <button 
          className="profile-trigger"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Profile menu"
        >
          {user.profile_image_url ? (
            <img 
              src={user.profile_image_url} 
            //   alt={user.username || user.email}
              className="profile-image"
            />
          ) : (
            <div className="profile-avatar">
              {getInitials()}
            </div>
          )}
          <div className="profile-status-dot"></div>

          {unreadCount > 0 && (
            <div className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</div>
          )}
        </button>

        {/* 드롭다운 메뉴 */}
        <div className={`profile-dropdown ${isOpen ? 'open' : ''}`}>
          <div className="profile-header">
            <div className="profile-info">
              <h4>{user.username || user.email}</h4>
              <p>{user.email}</p>
            </div>
          </div>

          {/* 빠른 액션 버튼 추가 */}
          <div className="quick-actions">
            <button 
              className="quick-action-btn"
              onClick={() => {
                navigate('/calendars/create');
                setIsOpen(false);
              }}
              title="새 캘린더"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/>
              </svg>
              <span>캘린더</span>
            </button>
            
            <button 
              className="quick-action-btn"
              onClick={() => {
                navigate('/events/create');
                setIsOpen(false);
              }}
              title="새 일정"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/>
              </svg>
              <span>일정</span>
            </button>
            
            <button 
              className="quick-action-btn"
              onClick={() => {
                navigate('/invitations');
                setIsOpen(false);
              }}
              title="초대 관리"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7V11C2 16.55 5.84 21.74 11 23C16.16 21.74 20 16.55 20 11V7L12 2Z" fill="currentColor"/>
              </svg>
              <span>초대</span>
            </button>
          </div>

          {/* 알림 섹션 추가 */}
          {unreadCount > 0 && (
            <>
              <div className="profile-menu-divider"></div>
              <div className="notifications-section">
                <div className="notifications-header">
                  <span>알림</span>
                  <span className="notification-count">{unreadCount}</span>
                </div>
                <div className="notification-items">
                  <div className="notification-item">
                    <div className="notification-icon calendar">📅</div>
                    <div className="notification-content">
                      <p>새로운 캘린더 초대</p>
                      <small>5분 전</small>
                    </div>
                  </div>
                  <div className="notification-item">
                    <div className="notification-icon event">📌</div>
                    <div className="notification-content">
                      <p>내일 일정이 있습니다</p>
                      <small>1시간 전</small>
                    </div>
                  </div>
                </div>
                <button 
                  className="view-all-notifications"
                  onClick={() => {
                    navigate('/notifications');
                    setIsOpen(false);
                  }}
                >
                  모든 알림 보기
                </button>
              </div>
            </>
          )}  

          <div className="profile-menu-divider"></div>

          <div className="profile-menu">
            <button 
              className="profile-menu-item"
              onClick={() => {
                navigate('/profile');
                setIsOpen(false);
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12Z" fill="currentColor"/>
                <path d="M12 14C7.59 14 4 17.59 4 22H20C20 17.59 16.41 14 12 14Z" fill="currentColor"/>
              </svg>
              내 프로필
            </button>

            <button 
              className="profile-menu-item"
              onClick={() => {
                navigate('/calendars');
                setIsOpen(false);
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="6" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M3 10H21" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 2V6M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              내 캘린더
            </button>

            <button 
              className="profile-menu-item"
              onClick={() => {
                navigate('/settings');
                setIsOpen(false);
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15Z" fill="currentColor"/>
                <path d="M19.4 15C19.2 15.4 19.1 15.8 19.1 16.2L21 17.7C21.2 17.9 21.2 18.2 21.1 18.4L19.3 21.6C19.2 21.8 18.9 21.9 18.6 21.8L16.4 21C15.9 21.4 15.4 21.7 14.8 21.9L14.5 24.1C14.5 24.3 14.3 24.5 14 24.5H10C9.7 24.5 9.5 24.3 9.5 24.1L9.2 21.9C8.6 21.7 8.1 21.4 7.6 21L5.4 21.8C5.1 21.9 4.8 21.8 4.7 21.6L2.9 18.4C2.8 18.2 2.8 17.9 3 17.7L4.9 16.2C4.9 15.8 4.8 15.4 4.6 15C4.6 14.6 4.7 14.2 4.9 13.8L3 12.3C2.8 12.1 2.8 11.8 2.9 11.6L4.7 8.4C4.8 8.2 5.1 8.1 5.4 8.2L7.6 9C8.1 8.6 8.6 8.3 9.2 8.1L9.5 5.9C9.5 5.7 9.7 5.5 10 5.5H14C14.3 5.5 14.5 5.7 14.5 5.9L14.8 8.1C15.4 8.3 15.9 8.6 16.4 9L18.6 8.2C18.9 8.1 19.2 8.2 19.3 8.4L21.1 11.6C21.2 11.8 21.2 12.1 21 12.3L19.1 13.8C19.1 14.2 19.2 14.6 19.4 15Z" fill="currentColor"/>
              </svg>
              설정
            </button>

            <div className="profile-menu-divider"></div>

            <button 
              className="profile-menu-item logout"
              onClick={handleLogout}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M17 7L15.59 8.41L18.17 11H8V13H18.17L15.59 15.59L17 17L22 12L17 7Z" fill="currentColor"/>
                <path d="M4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z" fill="currentColor"/>
              </svg>
              로그아웃
            </button>
          </div>

          <div className="profile-footer">
            <small>마지막 로그인: {new Date(user.last_login || '').toLocaleDateString('ko-KR')}</small>
          </div>
        </div>
      </div>

      {/* 드롭다운 외부 클릭 시 닫기 */}
      {isOpen && (
        <div 
          className="profile-backdrop"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default ProfileWidget;
