// src/components/EventModal/EventModal.tsx
import React, { useState, useEffect } from 'react';
import styles from './EventModal.module.css';
import { Event, Calendar } from '../../types/calendar.types';
import { format } from 'date-fns';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Partial<Event>) => void;
  event?: Event | null;
  selectedDate: Date;
  calendars: Calendar[];
  defaultCalendarId: string;
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  event,
  selectedDate,
  calendars,
  defaultCalendarId
}) => {
  const [formData, setFormData] = useState<Partial<Event>>({
    title: '',
    description: '',
    location: '',
    calendar: defaultCalendarId,
    start_date: format(selectedDate, "yyyy-MM-dd'T'HH:mm"),
    end_date: format(selectedDate, "yyyy-MM-dd'T'HH:mm"),
    all_day: false,
    color: ''
  });

  useEffect(() => {
    if (event) {
      // 수정 모드
      setFormData({
        ...event,
        start_date: event.start_date.slice(0, 16), // datetime-local 형식
        end_date: event.end_date.slice(0, 16)
      });
    } else {
      // 새 이벤트 모드
      const selectedCalendar = calendars.find(cal => cal.id === defaultCalendarId);
      setFormData({
        title: '',
        description: '',
        location: '',
        calendar: defaultCalendarId,
        start_date: format(selectedDate, "yyyy-MM-dd'T'HH:mm"),
        end_date: format(selectedDate, "yyyy-MM-dd'T'HH:mm"),
        all_day: false,
        color: selectedCalendar?.color || '#4A90E2'
      });
    }
  }, [event, selectedDate, defaultCalendarId, calendars]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // ISO 형식으로 변환
    const eventData: Partial<Event> = {
      ...formData,
      start_date: formData.all_day 
        ? `${formData.start_date?.slice(0, 10)}T00:00:00`
        : `${formData.start_date}:00`,
      end_date: formData.all_day
        ? `${formData.end_date?.slice(0, 10)}T23:59:59`
        : `${formData.end_date}:00`
    };

    onSave(eventData);
  };

  const handleCalendarChange = (calendarId: string) => {
    const selectedCalendar = calendars.find(cal => cal.id === calendarId);
    setFormData({
      ...formData,
      calendar: calendarId,
      color: selectedCalendar?.color || formData.color
    });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{event ? '일정 수정' : '새 일정'}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.eventForm}>
          <div className={styles.formGroup}>
            <label>캘린더</label>
            <select
              value={formData.calendar}
              onChange={(e) => handleCalendarChange(e.target.value)}
              disabled={!!event && !event.can_edit}
            >
              {calendars.map(calendar => (
                <option key={calendar.id} value={calendar.id}>
                  {calendar.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>제목 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="일정 제목을 입력하세요"
              required
              disabled={!!event && !event.can_edit}
            />
          </div>

          <div className={styles.formGroup}>
            <label>
              <input
                type="checkbox"
                checked={formData.all_day}
                onChange={(e) => setFormData({ ...formData, all_day: e.target.checked })}
                disabled={!!event && !event.can_edit}
              />
              종일
            </label>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>시작</label>
              <input
                type={formData.all_day ? "date" : "datetime-local"}
                value={formData.all_day 
                  ? formData.start_date?.slice(0, 10)
                  : formData.start_date?.slice(0, 16)
                }
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
                disabled={!!event && !event.can_edit}
              />
            </div>

            <div className={styles.formGroup}>
              <label>종료</label>
              <input
                type={formData.all_day ? "date" : "datetime-local"}
                value={formData.all_day
                  ? formData.end_date?.slice(0, 10)
                  : formData.end_date?.slice(0, 16)
                }
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
                disabled={!!event && !event.can_edit}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>위치</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="위치를 입력하세요"
              disabled={!!event && !event.can_edit}
            />
          </div>

          <div className={styles.formGroup}>
            <label>설명</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="상세 설명을 입력하세요"
              rows={3}
              disabled={!!event && !event.can_edit}
            />
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              취소
            </button>
            {(!event || event.can_edit) && (
              <button type="submit" className={styles.saveButton}>
                {event ? '수정' : '저장'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
