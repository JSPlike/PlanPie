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
}

const CalendarLeftSide: React.FC<CalendarSidebarProps> = ({
  calendars,
  onToggleCalendar,
  onAddCalendar,
  onUpdateCalendar,
  onDeleteCalendar,
  selectedCalendarId,
  onSelectCalendar,
  onAddEvent
}) => {
  const navigate = useNavigate();
  const [isAddingCalendar, setIsAddingCalendar] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState('');
  const [newCalendarColor, setNewCalendarColor] = useState('#4A90E2');
  const [editingCalendarId, setEditingCalendarId] = useState<string | null>(null);

  const handleAddCalendar = () => {
    navigate('/calendar/create');  // react-router 사용 시 예시
  };

  const colorOptions = [
    '#4A90E2', '#50C878', '#FFB347', '#FF6B6B', 
    '#9B59B6', '#3498DB', '#E74C3C', '#F39C12'
  ];

  return (
    <div className={styles.sidebar}>
      {/* 새 일정 추가 버튼 */}
      <button className={styles.addEventButton} onClick={onAddEvent}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        새 일정
      </button>

      {/* 내 캘린더 섹션 */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>내 캘린더</h3>
          <button 
            className={styles.addButton}
            onClick={() => setIsAddingCalendar(true)}
            title="새 캘린더 추가"
          >
            +
          </button>
        </div>

        {/* 캘린더 목록 */}
        <div className={styles.calendarList}>
          {calendars.map(calendar => (
            <div 
              key={calendar.id} 
              className={`${styles.calendarItem} ${selectedCalendarId === calendar.id ? styles.selected : ''}`}
              onClick={() => onSelectCalendar(calendar.id)}
            >
              <div className={styles.calendarItemLeft}>
                <input
                  type="checkbox"
                  checked={calendar.is_active}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleCalendar(calendar.id);
                  }}
                  className={styles.checkbox}
                  style={{ accentColor: calendar.color }}
                />
                <div 
                  className={styles.colorDot}
                  style={{ backgroundColor: calendar.color }}
                />
                {editingCalendarId === calendar.id ? (
                  <input
                    type="text"
                    value={calendar.name}
                    onChange={(e) => onUpdateCalendar(calendar.id, { name: e.target.value })}
                    onBlur={() => setEditingCalendarId(null)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') setEditingCalendarId(null);
                    }}
                    className={styles.editInput}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className={styles.calendarName}>{calendar.name}</span>
                )}
              </div>

              <div className={styles.calendarActions}>
                <button
                  className={styles.actionButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCalendarId(calendar.id);
                  }}
                  title="수정"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M11 4H4C2.9 4 2 4.9 2 6V20C2 21.1 2.9 22 4 22H18C19.1 22 20 21.1 20 20V13" stroke="currentColor" strokeWidth="2"/>
                    <path d="M18.5 2.5C19.3 1.7 20.7 1.7 21.5 2.5C22.3 3.3 22.3 4.7 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </button>
                {(
                  <button
                    className={styles.actionButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`"${calendar.name}" 캘린더를 삭제하시겠습니까?`)) {
                        onDeleteCalendar(calendar.id);
                      }
                    }}
                    title="삭제"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M3 6H21M8 6V4C8 3.4 8.4 3 9 3H15C15.6 3 16 3.4 16 4V6M10 11V17M14 11V17M5 6L6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19L19 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 새 캘린더 추가 폼 */}
        {isAddingCalendar && (
          <div className={styles.addCalendarForm}>
            <input
              type="text"
              placeholder="캘린더 이름"
              value={newCalendarName}
              onChange={(e) => setNewCalendarName(e.target.value)}
              className={styles.calendarNameInput}
              autoFocus
            />
            <div className={styles.colorPicker}>
              {colorOptions.map(color => (
                <button
                  key={color}
                  className={`${styles.colorOption} ${newCalendarColor === color ? styles.selected : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setNewCalendarColor(color)}
                />
              ))}
            </div>
            <div className={styles.formActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => {
                  setIsAddingCalendar(false);
                  setNewCalendarName('');
                }}
              >
                취소
              </button>
              <button 
                className={styles.saveButton}
                onClick={handleAddCalendar}
                disabled={!newCalendarName.trim()}
              >
                추가
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 다른 캘린더 섹션 (공유받은 캘린더 등) */}
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
