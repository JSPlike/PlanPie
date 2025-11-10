// src/components/CalendarHeader/CalendarHeader.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './CalendarHeader.module.css';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useAuth } from '../../hooks/useAuth';

interface CalendarHeaderProps {
  currentDate: Date;
  view: 'month' | 'week' | 'day';
  isLeftSideOpen: boolean;
  isRightSideOpen: boolean;
  onToggleLeftSide: () => void;
  onToggleRightSide: () => void;
  onDateChange: (date: Date) => void;
  onViewChange: (view: 'month' | 'week' | 'day') => void;
  onToday: () => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  view,
  isLeftSideOpen,
  isRightSideOpen,
  onToggleLeftSide,
  onToggleRightSide,
  onDateChange,
  onViewChange,
  onToday,
}) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLeftToggle = () => {
    console.log('Left toggle clicked, current state:', isLeftSideOpen);
    onToggleLeftSide();
  };

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

  const handlePrevious = () => {
    switch (view) {
      case 'month':
        onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
        break;
      case 'week':
        onDateChange(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
        break;
      case 'day':
        onDateChange(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
        break;
    }
  };

  const handleNext = () => {
    switch (view) {
      case 'month':
        onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
        break;
      case 'week':
        onDateChange(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
        break;
      case 'day':
        onDateChange(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
        break;
    }
  };

  const getDateDisplay = () => {
    switch (view) {
      case 'month':
        return format(currentDate, 'yyyy년 M월', { locale: ko });
      case 'week':
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${format(weekStart, 'M월 d일', { locale: ko })} - ${format(weekEnd, 'M월 d일', { locale: ko })}`;
      case 'day':
        return format(currentDate, 'yyyy년 M월 d일 (EEEE)', { locale: ko });
      default:
        return format(currentDate, 'yyyy년 M월', { locale: ko });
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <div className={styles.toggleDiv}>
          <button 
            className={`${styles.sidebarToggle} ${isLeftSideOpen ? styles.active : ''}`}
            onClick={handleLeftToggle}
            title="캘린더 목록"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* 로고/타이틀 */}
        <h1 className={styles.logo}>📅 Plan Pie</h1>

        {/* 날짜 네비게이션 */}
        <div className={styles.dateNavigation}>
          <button className={styles.todayButton} onClick={onToday}>
            Today
          </button>
          
          <div className={styles.monthControls}>
            <button className={styles.navButton} onClick={handlePrevious}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            
            <h2 className={styles.currentDate}>
              {getDateDisplay()}
            </h2>
            
            <button className={styles.navButton} onClick={handleNext}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className={styles.headerRight}>
        {/* 뷰 전환 버튼 */}
        <div className={styles.viewToggle}>
          {/* 활성 슬라이더 */}
          <div
            className={styles.segmentSlider}
            style={{
              transform:
                view === 'month'
                  ? 'translateX(0%)'
                  : view === 'week'
                  ? 'translateX(100%)'
                  : 'translateX(200%)',
            }}
          />
          <button 
            className={`${styles.viewButton} ${view === 'month' ? styles.active : ''}`}
            onClick={() => onViewChange('month')}
          >
            월
          </button>
          <button 
            className={`${styles.viewButton} ${view === 'week' ? styles.active : ''}`}
            onClick={() => onViewChange('week')}
          >
            주
          </button>
          <button 
            className={`${styles.viewButton} ${view === 'day' ? styles.active : ''}`}
            onClick={() => onViewChange('day')}
          >
            일
          </button>
        </div>

        {/* 새 일정 추가 버튼 */}
        <button className={styles.addEventButton} onClick={onToggleRightSide}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* 프로필 버튼 */}
        {isAuthenticated && user && (
          <div className={styles.profileSection}>
            <button 
              className={styles.profileButton}
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              aria-label="Profile menu"
            >
              {user.profile_image_url ? (
                <img 
                  src={user.profile_image_url} 
                  alt={user.username || user.email || 'Profile'}
                  className={styles.profileImage}
                />
              ) : (
                <div className={styles.profileAvatar}>
                  {getInitials()}
                </div>
              )}
            </button>

            {/* 드롭다운 메뉴 */}
            {isProfileOpen && (
              <>
                <div className={styles.profileDropdown}>
                  <div className={styles.profileHeader}>
                    <div className={styles.profileInfo}>
                      <h4>{user.username || user.email}</h4>
                      <p>{user.email}</p>
                    </div>
                  </div>

                  <div className={styles.profileMenu}>
                    <button 
                      className={styles.profileMenuItem}
                      onClick={() => {
                        navigate('/profile');
                        setIsProfileOpen(false);
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12Z" fill="currentColor"/>
                        <path d="M12 14C7.59 14 4 17.59 4 22H20C20 17.59 16.41 14 12 14Z" fill="currentColor"/>
                      </svg>
                      내 프로필
                    </button>

                    <button 
                      className={styles.profileMenuItem}
                      onClick={() => {
                        navigate('/calendars');
                        setIsProfileOpen(false);
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="6" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M3 10H21" stroke="currentColor" strokeWidth="2"/>
                        <path d="M8 2V6M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      내 캘린더
                    </button>

                    <div className={styles.profileMenuDivider}></div>

                    <button 
                      className={`${styles.profileMenuItem} ${styles.logout}`}
                      onClick={handleLogout}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M17 7L15.59 8.41L18.17 11H8V13H18.17L15.59 15.59L17 17L22 12L17 7Z" fill="currentColor"/>
                        <path d="M4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z" fill="currentColor"/>
                      </svg>
                      로그아웃
                    </button>
                  </div>
                </div>
                <div 
                  className={styles.profileBackdrop}
                  onClick={() => setIsProfileOpen(false)}
                />
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default CalendarHeader;
