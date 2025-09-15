// src/components/CalendarHeader/CalendarHeader.tsx
import React from 'react';
import styles from './CalendarHeader.module.css';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

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
  onAddEvent: () => void;
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
  onAddEvent
}) => {
  const handleLeftToggle = () => {
    console.log('Left toggle clicked, current state:', isLeftSideOpen);
    onToggleLeftSide();
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
        {/* 사이드바 토글 */}
        <button 
          className={`${styles.sidebarToggle} ${isLeftSideOpen ? styles.active : ''}`}
          onClick={handleLeftToggle}
          title="캘린더 목록"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* 로고/타이틀 */}
        <h1 className={styles.logo}>📅 Calendar</h1>

        {/* 날짜 네비게이션 */}
        <div className={styles.dateNavigation}>
          <button className={styles.todayButton} onClick={onToday}>
            오늘
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
        <button className={styles.addEventButton} onClick={onAddEvent}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>새 일정</span>
        </button>

        {/* 오른쪽 사이드바 토글 */}
        <button 
          className={`${styles.sidebarToggle} ${isRightSideOpen ? styles.active : ''}`}
          onClick={onToggleRightSide}
          title="일정 상세"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7V17C2 17 12 22 12 22C12 22 22 17 22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </header>
  );
};

export default CalendarHeader;
