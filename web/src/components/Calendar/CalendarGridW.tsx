// src/components/Calendar/CalendarGridW.tsx
import React, { useMemo } from 'react';
import styles from './CalendarGridW.module.css';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addHours, startOfDay, endOfDay, isAfter, isBefore } from 'date-fns';
import { Event, Calendar } from '../../types/calendar.types';
import { useCalendarContext } from '../../contexts/CalendarContext';

interface CalendarGridWProps {
  currentDate: Date;
  selectedDate: Date | null;
  selectedRange: {start: Date, end: Date} | null;
  events: Event[];
  calendars: Calendar[];
  onDateClick: (date: Date) => void;
  onDateSelect: (date: Date) => void;
  onEventClick: (event: Event) => void;
  onEventDelete: (eventId: string) => void;
}

interface AllDayEvent extends Event {
  startDay: number;
  endDay: number; 
  width: number;
  lane: number;
  isFirst?: boolean;
  isLast?: boolean;
  isSingle?: boolean;
  continueLeft?: boolean;
  continueRight?: boolean;
}

interface TimedEventPosition {
  event: Event;
  top: number;
  height: number;
  left: number;
  width: number;
  dayIndex: number;
}

const CalendarGridW: React.FC<CalendarGridWProps> = ({
  currentDate,
  selectedDate,
  events,
  calendars,
  onDateClick,
  onDateSelect,
  onEventClick,
  onEventDelete,
}) => {
  const { tempEvent, getEventColor } = useCalendarContext();

  // 주 범위 계산
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // 하루 종일 이벤트 처리
  const allDayEvents = useMemo(() => {
    const allEvents = tempEvent ? [...events, tempEvent] : events;
    const allDayEventList: AllDayEvent[] = [];

    allEvents
      .filter(event => event.all_day)
      .forEach(event => {
        const eventStart = parseISO(event.start_date);
        const eventEnd = parseISO(event.end_date);
        
        // 주 범위와 겹치는지 확인
        if (isAfter(eventStart, weekEnd) || isBefore(eventEnd, weekStart)) {
          return;
        }

        // 주 내에서 시작/끝 날짜 계산
        let startDay = 0;
        let endDay = 6;

        weekDays.forEach((day, index) => {
          if (isSameDay(day, eventStart) || (isAfter(day, eventStart) && startDay === 0)) {
            startDay = index;
          }
          if (isSameDay(day, eventEnd) || isBefore(day, eventEnd)) {
            endDay = index;
          }
        });

        // 이벤트가 주 범위를 벗어나는 경우 조정
        const continueLeft = isBefore(eventStart, weekStart);
        const continueRight = isAfter(eventEnd, weekEnd);

        if (continueLeft) startDay = 0;
        if (continueRight) endDay = 6;

        const width = endDay - startDay + 1;
        const isSingle = width === 1;

        allDayEventList.push({
          ...event,
          startDay,
          endDay,
          width,
          lane: 0, // 나중에 레이아웃에서 계산
          isSingle,
          isFirst: !continueLeft,
          isLast: !continueRight,
          continueLeft,
          continueRight,
        });
      });

    // 같은 이벤트 그룹화 및 연결
    const eventGroups: { [eventId: string]: AllDayEvent[] } = {};
    allDayEventList.forEach(event => {
      if (!eventGroups[event.id]) {
        eventGroups[event.id] = [];
      }
      eventGroups[event.id].push(event);
    });

    // 연결된 이벤트 처리
    const processedEvents: AllDayEvent[] = [];
    Object.values(eventGroups).forEach(group => {
      if (group.length === 1) {
        // 단일 세그먼트
        processedEvents.push({
          ...group[0],
          isSingle: true,
          isFirst: true,
          isLast: true,
        });
      } else {
        // 다중 세그먼트 - 연결된 이벤트
        group.sort((a, b) => a.startDay - b.startDay);
        group.forEach((event, index) => {
          processedEvents.push({
            ...event,
            isSingle: false,
            isFirst: index === 0,
            isLast: index === group.length - 1,
          });
        });
      }
    });

    // 레이아웃 계산 (레인 배치)
    processedEvents.sort((a, b) => {
      if (a.startDay !== b.startDay) return a.startDay - b.startDay;
      return b.width - a.width; // 더 긴 이벤트를 먼저
    });

    const lanes: boolean[][] = Array(4).fill(null).map(() => Array(7).fill(false));
    
    processedEvents.forEach(event => {
      // 사용 가능한 레이 찾기
      let laneIndex = 0;
      while (laneIndex < lanes.length) {
        let canPlace = true;
        for (let day = event.startDay; day <= event.endDay; day++) {
          if (lanes[laneIndex][day]) {
            canPlace = false;
            break;
          }
        }
        
        if (canPlace) {
          // 레인에 배치
          for (let day = event.startDay; day <= event.endDay; day++) {
            lanes[laneIndex][day] = true;
          }
          event.lane = laneIndex;
          break;
        }
        laneIndex++;
      }
    });

    return processedEvents;
  }, [events, tempEvent, weekStart, weekEnd]);

  // 시간 이벤트 처리
  const timedEvents = useMemo(() => {
    const allEvents = tempEvent ? [...events, tempEvent] : events;
    const timedEventList: TimedEventPosition[] = [];

    allEvents
      .filter(event => !event.all_day)
      .forEach(event => {
        const eventStart = parseISO(event.start_date);
        const eventEnd = parseISO(event.end_date);
        
        weekDays.forEach((day, dayIndex) => {
          const dayStart = startOfDay(day);
          const dayEnd = endOfDay(day);
          
          // 이벤트가 이 날에 속하는지 확인
          if (isSameDay(eventStart, day) || (isAfter(eventStart, dayStart) && isBefore(eventStart, dayEnd))) {
            const startHour = eventStart.getHours();
            const startMinute = eventStart.getMinutes();
            const endHour = isSameDay(eventStart, eventEnd) ? eventEnd.getHours() : 24;
            const endMinute = isSameDay(eventStart, eventEnd) ? eventEnd.getMinutes() : 0;
            
            const top = (startHour * 44) + (startMinute / 60 * 44);
            const duration = (endHour - startHour) + ((endMinute - startMinute) / 60);
            const height = Math.max(duration * 44, 22); // 최소 높이 22px
            
            timedEventList.push({
              event,
              top,
              height,
              left: 6,
              width: 100, // 퍼센트
              dayIndex,
            });
          }
        });
      });

    return timedEventList;
  }, [events, tempEvent, weekDays]);

  // 시간 그리드 생성 (24시간)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      slots.push(hour);
    }
    return slots;
  }, []);

  const handleDateCellClick = (date: Date, event: React.MouseEvent) => {
    event.stopPropagation();

    const isSameDate = selectedDate && 
      date.getFullYear() === selectedDate.getFullYear() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getDate() === selectedDate.getDate();

    if (isSameDate) {
      onDateClick(date);
    } else {
      onDateSelect(date);
    }
  };

  const isToday = (date: Date) => isSameDay(date, new Date());
  const isSelected = (date: Date) => selectedDate ? isSameDay(date, selectedDate) : false;

  return (
    <div className={styles.weekView}>
      {/* 주 헤더 */}
      <div className={styles.weekHeader}>
        <div className={styles.timeGutterHeader}></div>
        {weekDays.map((day, index) => (
          <div key={day.toISOString()} className={styles.weekHeaderCell}>
            <div className={styles.weekHeaderDay}>
              {['일', '월', '화', '수', '목', '금', '토'][index]}
            </div>
            <div className={`${styles.weekHeaderDate} ${isToday(day) ? styles.today : ''}`}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* 하루 종일 이벤트 영역 */}
      <div className={styles.allDayRow}>
        <div className={styles.timeGutter}>
          <div style={{ padding: '8px', fontSize: '11px', color: '#777' }}>
            종일
          </div>
        </div>
        {weekDays.map((day, dayIndex) => (
          <div 
            key={`allday-${day.toISOString()}`} 
            className={styles.allDayCell}
            onClick={(e) => handleDateCellClick(day, e)}
          >
            <div className={styles.allDayLaneContainer}>
              {allDayEvents
                .filter(event => dayIndex >= event.startDay && dayIndex <= event.endDay)
                .map(event => {
                  const isTemp = tempEvent && event.id === tempEvent.id;
                  const eventColor = getEventColor(event);
                  
                  // 클래스명 결정
                  const classNames = [styles.allDayPill];
                  
                  if (event.isSingle) {
                    classNames.push(styles.single);
                  } else {
                    if (event.isFirst && dayIndex === event.startDay) {
                      classNames.push(styles.first);
                    }
                    if (event.isLast && dayIndex === event.endDay) {
                      classNames.push(styles.last);
                    }
                    if (event.continueLeft && dayIndex === event.startDay) {
                      classNames.push(styles.continueLeft);
                    }
                    if (event.continueRight && dayIndex === event.endDay) {
                      classNames.push(styles.continueRight);
                    }
                  }
                  
                  return (
                    <div
                      key={`${event.id}-${dayIndex}`}
                      className={classNames.join(' ')}
                      style={{
                        backgroundColor: eventColor,
                        color: 'white',
                        top: `${event.lane * 24}px`,
                        fontWeight: isTemp ? '700' : '500',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isTemp) {
                          onEventClick(event);
                        }
                      }}
                    >
                      {(dayIndex === event.startDay || event.continueLeft) && (
                        <span>{isTemp ? (tempEvent?.title || 'New Event') : event.title}</span>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      {/* 시간 그리드 */}
      <div className={styles.timeScroll}>
        <div className={styles.timeGutter}>
          {timeSlots.map(hour => (
            <div key={hour} className={styles.timeGutterRow} style={{ height: '44px' }}>
              {hour === 0 ? '' : `${hour}:00`}
            </div>
          ))}
        </div>
        
        <div className={styles.timeColumns}>
          <div className={styles.timeGrid} style={{ height: `${timeSlots.length * 44}px` }}>
            {weekDays.map((day, dayIndex) => (
              <div 
                key={day.toISOString()} 
                className={styles.timeDayColumn}
                onClick={(e) => handleDateCellClick(day, e)}
              >
                {/* 시간별 구분선 */}
                {timeSlots.map(hour => (
                  <div key={hour} className={styles.timeHourRow} style={{ height: '44px' }} />
                ))}
                
                {/* 시간 이벤트들 */}
                {timedEvents
                  .filter(eventPos => eventPos.dayIndex === dayIndex)
                  .map((eventPos, index) => {
                    const isTemp = tempEvent && eventPos.event.id === tempEvent.id;
                    const eventColor = getEventColor(eventPos.event);
                    
                    return (
                      <div
                        key={`${eventPos.event.id}-${index}`}
                        className={styles.timedEvent}
                        style={{
                          top: `${eventPos.top}px`,
                          height: `${eventPos.height}px`,
                          backgroundColor: eventColor,
                          color: 'white',
                          fontWeight: isTemp ? '700' : '500',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isTemp) {
                            onEventClick(eventPos.event);
                          }
                        }}
                      >
                        <div className={styles.eventTitle}>
                          {isTemp ? (tempEvent?.title || 'New Event') : eventPos.event.title}
                        </div>
                        <div style={{ fontSize: '10px', opacity: 0.9 }}>
                          {format(parseISO(eventPos.event.start_date), 'HH:mm')} - {format(parseISO(eventPos.event.end_date), 'HH:mm')}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarGridW;