// src/components/CalendarSidebar/CalendarSidebar.tsx
import React, { useState } from 'react';
import styles from './CalendarLeftSide.module.css';
import { Calendar } from '../../types/calendar.types';
import { useCalendarContext } from '../../contexts/CalendarContext';
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
  const { calendarVisibility } = useCalendarContext();

  const navigate = useNavigate();
  const [isAddingCalendar, setIsAddingCalendar] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState('');
  const [newCalendarColor, setNewCalendarColor] = useState('#4A90E2');
  const [editingCalendarId, setEditingCalendarId] = useState<string | null>(null);

  const handleAddCalendar = () => {
    // 캘린더 생성 페이지로 이동한다
    navigate('/calendars/create');
  };

  const defaultImages = '/images/default-calendar.png';

  const getCalendarImage = (calendar: any) => {
    if (calendar.image) return calendar.image;
    return defaultImages;
  };

  if (!isOpen) {
    return (
      <div className={styles.sidebarCollapsed}>
        <div className={styles.calendarListCollapsed}>
          {calendars.map(calendar => {
            const isVisible = calendarVisibility[calendar.id] !== false;
            const isSelected = selectedCalendarId === calendar.id;

            return (
              <div
              key={calendar.id}
              className={`${styles.calendarItemCollapsed} 
                          ${isSelected ? styles.selected : ''} 
                          ${isVisible ? styles.hidden : ''}`}
              onClick={() => onSelectCalendar(calendar.id)}
              title={calendar.name}
            >
              <div 
                className={`${styles.calendarImageWrapper} ${isVisible ? styles.hidden : ''}`}
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
                {isVisible && (
                  <div className={styles.checkOverlay}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}


              </div>
              <span className={styles.tooltip}>{calendar.name}</span>
            </div>
            )
          })}
        </div>
      </div>
    );
  }

  // 확장 모드
  return (
    <div className={styles.sidebar}>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <p className={styles.sectionHeaderTitle}>Calendar List</p>
        </div>

        <div className={styles.calendarList}>
          {calendars.map(calendar => {
            const isVisible = calendarVisibility[calendar.id] !== false;
            const isSelected = selectedCalendarId === calendar.id;

            return (
              <div 
                key={calendar.id} 
                className={`${styles.calendarItem} 
                            ${isSelected ? styles.selected : ''} 
                            ${isVisible ? styles.hidden : ''}
                `}

                onClick={(e) => {
                  if (onSelectCalendar) {
                    onSelectCalendar(calendar.id);
                  }
                  onToggleCalendar(calendar.id);
                }}
              >
                <div className={styles.calendarItemLeft}>
                  <div 
                    className={` ${styles.calendarThumbnail} ${isVisible ? styles.hidden : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
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
                    {isVisible && (
                      <div className={styles.checkOverlay}>
                        <svg width="55" height="50" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className={styles.calendarInfo}>
                    <span className={styles.calendarName}>{calendar.name}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <button className={styles.addCalendarButton} onClick={handleAddCalendar}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        Add Calendar
      </button>
    </div>
  );
};

export default CalendarLeftSide;