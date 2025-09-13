// src/components/CalendarGrid/CalendarGrid.tsx
import React from 'react';
import styles from './CalendarGrid.module.css';
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Event, Calendar } from '../../types/calendar.types';

interface CalendarGridProps {
  currentDate: Date;
  selectedDate: Date | null;
  events: Event[];
  calendars: Calendar[];
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  onEventClick: (event: Event) => void;
  onEventDelete: (eventId: string) => void;
  getEventColor: (event: Event) => string;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  selectedDate,
  events,
  calendars,
  onDateSelect,
  onMonthChange,
  onEventClick,
  onEventDelete,
  getEventColor
}) => {
  // 캘린더에 표시할 날짜 배열 생성
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  });

  // 특정 날짜의 이벤트 가져오기
  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventStart = parseISO(event.start_date);
      const eventEnd = parseISO(event.end_date);
      
      if (event.all_day) {
        // 종일 이벤트는 날짜만 비교
        return isSameDay(eventStart, date) || 
               (date >= eventStart && date <= eventEnd);
      } else {
        // 시간이 있는 이벤트
        return isSameDay(eventStart, date);
      }
    });
  };

  const isToday = (date: Date) => isSameDay(date, new Date());
  const isSelected = (date: Date) => selectedDate ? isSameDay(date, selectedDate) : false;
  const isCurrentMonth = (date: Date) => date.getMonth() === currentDate.getMonth();

  const handlePrevMonth = () => {
    onMonthChange(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    onMonthChange(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleToday = () => {
    onMonthChange(new Date());
  };

  return (
    <div className={styles.calendarGrid}>
      {/* 헤더 */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.todayButton} onClick={handleToday}>
            오늘
          </button>
        </div>

        <div className={styles.headerCenter}>
          <button className={styles.navButton} onClick={handlePrevMonth}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <h2 className={styles.currentMonth}>
            {format(currentDate, 'yyyy년 M월', { locale: ko })}
          </h2>
          <button className={styles.navButton} onClick={handleNextMonth}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className={styles.weekDays}>
        {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
          <div 
            key={day} 
            className={`${styles.weekDay} ${index === 0 ? styles.sunday : ''} ${index === 6 ? styles.saturday : ''}`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className={styles.daysGrid}>
        {calendarDays.map((date) => {
          const dayEvents = getEventsForDate(date);
          
          return (
            <div
              key={date.toISOString()}
              className={`
                ${styles.dayCell} 
                ${!isCurrentMonth(date) ? styles.otherMonth : ''}
                ${isToday(date) ? styles.today : ''}
                ${isSelected(date) ? styles.selected : ''}
                ${date.getDay() === 0 ? styles.sunday : ''}
                ${date.getDay() === 6 ? styles.saturday : ''}
              `}
              onClick={() => onDateSelect(date)}
            >
              <div className={styles.dayNumber}>
                {format(date, 'd')}
              </div>
              
              {/* 이벤트 표시 */}
              <div className={styles.dayEvents}>
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className={styles.eventItem}
                    style={{ 
                      backgroundColor: getEventColor(event),
                      opacity: event.all_day ? 1 : 0.9
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                  >
                    <span className={styles.eventTime}>
                      {!event.all_day && format(parseISO(event.start_date), 'HH:mm')}
                    </span>
                    <span className={styles.eventTitle}>{event.title}</span>
                    {event.can_delete && (
                      <button
                        className={styles.deleteButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('이 일정을 삭제하시겠습니까?')) {
                            onEventDelete(event.id);
                          }
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className={styles.moreEvents}>
                    +{dayEvents.length - 3}개 더보기
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarGrid;
