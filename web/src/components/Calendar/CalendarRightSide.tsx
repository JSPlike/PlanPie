// src/components/CalendarRightSide/CalendarRightSide.tsx
import React from 'react';
import styles from './CalendarRightSide.module.css';
import { Event } from '../../types/calendar.types';
import { format, parseISO, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';

interface CalendarRightSideProps {
  selectedDate: Date | null;
  selectedEvent: Event | null;
  events: Event[];
  onEditEvent: (event: Event) => void;
  onDeleteEvent: (eventId: string) => void;
  onAddEvent: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const CalendarRightSide: React.FC<CalendarRightSideProps> = ({
  selectedDate,
  selectedEvent,
  events,
  onEditEvent,
  onDeleteEvent,
  onAddEvent,
  isOpen,
  onClose
}) => {
  // 선택된 날짜의 이벤트 필터링
  const dayEvents = selectedDate 
    ? events.filter(event => {
        const eventDate = parseISO(event.start_date);
        return isSameDay(eventDate, selectedDate);
      })
    : [];

  return (
    <div className={styles.sidebar}>
      {/* 헤더 */}
      <div className={styles.sidebarHeader}>
        <h2>
          {selectedEvent ? '일정 상세' : selectedDate ? '일정 목록' : '날짜를 선택하세요'}
        </h2>
        <button className={styles.closeButton} onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className={styles.sidebarContent}>
        {selectedEvent ? (
          // 이벤트 상세 보기
          <div className={styles.eventDetail}>
            <div className={styles.eventHeader}>
              <div 
                className={styles.eventColorBar}
                style={{ backgroundColor: selectedEvent.color }}
              />
              <h3>{selectedEvent.title}</h3>
            </div>

            <div className={styles.eventInfo}>
              <div className={styles.infoItem}>
                <span className={styles.infoIcon}>📅</span>
                <div>
                  <div className={styles.infoLabel}>날짜</div>
                  <div className={styles.infoValue}>
                    {format(parseISO(selectedEvent.start_date), 'yyyy년 M월 d일 (EEE)', { locale: ko })}
                  </div>
                </div>
              </div>

              {!selectedEvent.all_day && (
                <div className={styles.infoItem}>
                  <span className={styles.infoIcon}>⏰</span>
                  <div>
                    <div className={styles.infoLabel}>시간</div>
                    <div className={styles.infoValue}>
                      {format(parseISO(selectedEvent.start_date), 'HH:mm')} - 
                      {format(parseISO(selectedEvent.end_date), 'HH:mm')}
                    </div>
                  </div>
                </div>
              )}

              {selectedEvent.location && (
                <div className={styles.infoItem}>
                  <span className={styles.infoIcon}>📍</span>
                  <div>
                    <div className={styles.infoLabel}>위치</div>
                    <div className={styles.infoValue}>{selectedEvent.location}</div>
                  </div>
                </div>
              )}

              {selectedEvent.description && (
                <div className={styles.infoItem}>
                  <span className={styles.infoIcon}>📝</span>
                  <div>
                    <div className={styles.infoLabel}>설명</div>
                    <div className={styles.infoValue}>{selectedEvent.description}</div>
                  </div>
                </div>
              )}

              <div className={styles.infoItem}>
                <span className={styles.infoIcon}>📚</span>
                <div>
                  <div className={styles.infoLabel}>캘린더</div>
                  <div className={styles.infoValue}>{selectedEvent.calendar_name}</div>
                </div>
              </div>
            </div>

            <div className={styles.eventActions}>
              {selectedEvent.can_edit && (
                <button 
                  className={styles.editButton}
                  onClick={() => onEditEvent(selectedEvent)}
                >
                  수정
                </button>
              )}
              {selectedEvent.can_delete && (
                <button 
                  className={styles.deleteButton}
                  onClick={() => {
                    if (window.confirm('이 일정을 삭제하시겠습니까?')) {
                      onDeleteEvent(selectedEvent.id);
                      onClose();
                    }
                  }}
                >
                  삭제
                </button>
              )}
            </div>
          </div>
        ) : selectedDate ? (
          // 선택된 날짜의 일정 목록
          <div className={styles.dayView}>
            <div className={styles.selectedDate}>
              <h3>{format(selectedDate, 'yyyy년 M월 d일', { locale: ko })}</h3>
              <p>{format(selectedDate, 'EEEE', { locale: ko })}</p>
            </div>

            <button className={styles.addEventButton} onClick={onAddEvent}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              일정 추가
            </button>

            <div className={styles.eventsList}>
              {dayEvents.length > 0 ? (
                dayEvents.map(event => (
                  <div 
                    key={event.id}
                    className={styles.eventCard}
                    onClick={() => onEditEvent(event)}
                  >
                    <div 
                      className={styles.eventIndicator}
                      style={{ backgroundColor: event.color }}
                    />
                    <div className={styles.eventContent}>
                      <div className={styles.eventTime}>
                        {event.all_day ? '종일' : format(parseISO(event.start_date), 'HH:mm')}
                      </div>
                      <div className={styles.eventTitle}>{event.title}</div>
                      {event.location && (
                        <div className={styles.eventLocation}>📍 {event.location}</div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.noEvents}>
                  <p>일정이 없습니다</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          // 날짜 미선택 상태
          <div className={styles.emptyState}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="#ccc" strokeWidth="2"/>
              <path d="M16 2V6M8 2V6M3 10H21" stroke="#ccc" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p>날짜를 선택하면</p>
            <p>일정을 확인할 수 있습니다</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarRightSide;
