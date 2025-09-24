// src/components/CalendarGrid/CalendarGrid.tsx
import React from 'react';
import styles from './CalendarGrid.module.css';
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Event, Calendar } from '../../types/calendar.types';

interface CalendarGridProps {
  currentDate: Date;
  selectedDate: Date | null;
  selectedRange: {start: Date, end: Date} | null;
  events: Event[];
  calendars: Calendar[];
  onDateClick: (date: Date) => void;
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  onEventClick: (event: Event) => void;
  onEventDelete: (eventId: string) => void;
  getEventColor: (event: Event) => string;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  selectedDate,
  selectedRange,
  events,
  calendars,
  onDateClick,
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

  // 날짜 셀 클릭 핸들러
  const handleDateCellClick = (date: Date, event: React.MouseEvent) => {
    // 이벤트 버블링 방지 (이벤트 클릭과 구분)
    event.stopPropagation();

    const isSameDate = selectedDate && 
      date.getFullYear() === selectedDate.getFullYear() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getDate() === selectedDate.getDate();

    if (isSameDate) {
      // 이미 선택된 날짜 재클릭 → 오른쪽 섹션 열기
      onDateClick(date);
    } else {
      // 새로운 날짜 클릭 → 선택만 하기
      onDateSelect(date);
    }
  };

  // 날짜가 선택된 날짜인지 확인
  const isSelectedDate = (date: Date) => {
    if (!selectedDate) return false;
    return date.getFullYear() === selectedDate.getFullYear() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getDate() === selectedDate.getDate();
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
              onClick={(e) => handleDateCellClick(date, e)}
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
