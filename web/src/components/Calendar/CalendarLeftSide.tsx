// src/components/CalendarSidebar/CalendarSidebar.tsx
import React, { useState } from 'react';
import styles from './CalendarLeftSide.module.css';
import { Calendar } from '../../types/calendar.types';
import { useNavigate } from 'react-router-dom';
interface CalendarSidebarProps {
  calendars: Calendar[];
  onToggleCalendar: (calendarId: string) => void;
  onAddCalendar: (calendar: Omit<Calendar, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateCalendar: (calendarId: string, updates: Partial<Calendar>) => void;
  onDeleteCalendar: (calendarId: string) => void;
  selectedCalendarId: string;
  onSelectCalendar: (calendarId: string) => void;
  onAddEvent: () => void;
  isOpen: boolean;
}

const CalendarLeftSide: React.FC<CalendarSidebarProps> = ({
  calendars,
  onToggleCalendar,
  onAddCalendar,
  onUpdateCalendar,
  onDeleteCalendar,
  selectedCalendarId,
  onSelectCalendar,
  onAddEvent,
  isOpen

}) => {
  const navigate = useNavigate();
  const [isAddingCalendar, setIsAddingCalendar] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState('');
  const [newCalendarColor, setNewCalendarColor] = useState('#4A90E2');
  const [editingCalendarId, setEditingCalendarId] = useState<string | null>(null);

  console.log('CalendarLeftSide props:', {
    onToggleCalendar: typeof onToggleCalendar,
    onSelectCalendar: typeof onSelectCalendar
  });

  const handleAddCalendar = () => {
    navigate('/calendars/create');  // react-router 사용 시 예시
  };

  const defaultImages = '/images/default-calendar.png';

  const getCalendarImage = (calendar: any) => {
    if (calendar.image) return calendar.image;
    return defaultImages;
  };

  const colorOptions = [
    '#4A90E2', '#50C878', '#FFB347', '#FF6B6B', 
    '#9B59B6', '#3498DB', '#E74C3C', '#F39C12'
  ];

  if (!isOpen) {
    return (
      <div className={styles.sidebarCollapsed}>
        {/* 축소 모드 새 일정 버튼 */}
        <button 
          className={styles.addEventButtonCollapsed} 
          onClick={handleAddCalendar}
          title="새 캘린더 만들기"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* 축소 모드 캘린더 목록 - 이미지만 표시 */}
        <div className={styles.calendarListCollapsed}>
          {calendars.map(calendar => (
            <div
              key={calendar.id}
              className={`${styles.calendarItemCollapsed} ${selectedCalendarId === calendar.id ? styles.selected : ''}`}
              onClick={() => onSelectCalendar(calendar.id)}
              title={calendar.name}
            >
              <div 
                className={`${styles.calendarImageWrapper} ${calendar.is_active ? styles.visible : styles.hidden}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCalendar(calendar.id);
                }}
                style={{ borderColor: calendar.color }}
              >
                <img 
                  src={getCalendarImage(calendar)}
                  alt={calendar.name}
                  className={styles.calendarImage}
                  onError={(e) => {
                    // 이미지 로드 실패시 첫 번째 기본 이미지로
                    (e.target as HTMLImageElement).src = defaultImages[0];
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* 축소 모드 새 캘린더 추가 */}
        <button 
          className={styles.addCalendarButtonCollapsed}
          onClick={() => setIsAddingCalendar(true)}
          title="새 캘린더 추가"
        >
          +
        </button>
      </div>
    );
  }

  // 확장 모드
  return (
    <div className={styles.sidebar}>
      {/* 새 일정 추가 버튼 */}
      <button className={styles.addCalendarButton} onClick={handleAddCalendar}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        새 캘린더
      </button>

      {/* 내 캘린더 섹션 */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>내 캘린더</h3>
        </div>

        {/* 캘린더 목록 */}
        <div className={styles.calendarList}>
          {calendars.map(calendar => (
            <div 
              key={calendar.id} 
              className={`${styles.calendarItem} ${selectedCalendarId === calendar.id ? styles.selected : ''}`}
              
              onClick={(e) => {
                console.log('Calendar selected:', calendar.id); 

                console.log('Calendar item clicked:', calendar.id);
                console.log('Event target:', e.target);
                console.log('onSelectCalendar exists?', !!onSelectCalendar);
              
                if (onSelectCalendar) {
                  onSelectCalendar(calendar.id);
                }
              }}
            >
              <div className={styles.calendarItemLeft}>
                {/* 이미지와 체크 오버레이 */}
                <div 
                  className={`${styles.calendarThumbnail} ${!calendar.is_active ? styles.unchecked : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Toggle visibility:', calendar.id);
                    onToggleCalendar(calendar.id);
                  }}
                >
                  <img 
                    src={getCalendarImage(calendar)}
                    alt={calendar.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = defaultImages[0];
                    }}
                  />
                  {/* 체크 오버레이 */}
                  {calendar.is_active && (
                    <div className={styles.checkOverlay}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>
                {/* 캘린더 이름 */}
                <div className={styles.calendarInfo}>
                  <span className={styles.calendarName}>{calendar.name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 공유 캘린더 섹션 */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>공유 캘린더</h3>
        </div>
        <div className={styles.emptyState}>
          <p>공유받은 캘린더가 없습니다</p>
        </div>
      </div>
    </div>
  );





};

export default CalendarLeftSide;
