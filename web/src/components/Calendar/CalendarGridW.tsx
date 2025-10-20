// src/components/Calendar/CalendarGridW.tsx
import React, { useMemo } from 'react';
import styles from './CalendarGridW.module.css';
import { format, parseISO, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, 
  addHours, startOfDay, isSameWeek, differenceInMinutes, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Event, Calendar } from '../../types/calendar.types';
import { useCalendarContext } from '../../contexts/CalendarContext';

interface CalendarGridWProps {
  currentDate: Date;
  selectedDate: Date | null;
  events: Event[];
  calendars: Calendar[];
  onDateClick: (date: Date) => void;
  onDateSelect: (date: Date) => void;
  onTimeSlotClick?: (date: Date, hour: number) => void;
  onEventClick: (event: Event) => void;
  onEventDelete: (eventId: string) => void;
}

interface AllDayEventBar {
  event: Event;
  dayIndex: number;
  width: number;
  lane: number;
  isFirst?: boolean;
  isLast?: boolean;
  isSingle?: boolean;
  continueLeft?: boolean;
  continueRight?: boolean;
}

interface TimedEvent {
  event: Event;
  dayIndex: number;
  top: number;
  height: number;
  width?: number;
  isFirst?: boolean;
  isLast?: boolean;
  isSingle?: boolean;
  continueLeft?: boolean;
  continueRight?: boolean;
}

const CalendarGridW: React.FC<CalendarGridWProps> = ({
  currentDate,
  selectedDate,
  events,
  calendars,
  onDateClick,
  onDateSelect,
  onTimeSlotClick,
  onEventClick,
  onEventDelete,
}) => {
  const { tempEvent, getEventColor } = useCalendarContext();
  const [hoveredEventId, setHoveredEventId] = React.useState<string | null>(null);

  // 주의 시작과 끝 계산
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // 시간 슬롯 생성 (0시 ~ 23시)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      slots.push({
        hour,
        label: format(addHours(startOfDay(new Date()), hour), 'H:mm')
      });
    }
    return slots;
  }, []);

  // 이벤트를 종일 이벤트와 시간 이벤트로 분리
  const { allDayEvents, timedEvents } = useMemo(() => {
    const allEvents = tempEvent ? [...events, tempEvent] : events;
    const currentWeekEvents = allEvents.filter(event => {
      const eventStart = parseISO(event.start_date);
      const eventEnd = parseISO(event.end_date);
      return isSameWeek(eventStart, weekStart, { weekStartsOn: 0 }) || 
             isSameWeek(eventEnd, weekStart, { weekStartsOn: 0 }) ||
             (eventStart <= weekStart && eventEnd >= weekEnd);
    });

    const allDay: Event[] = [];
    const timed: Event[] = [];

    currentWeekEvents.forEach(event => {
      if (event.all_day) {
        allDay.push(event);
      } else {
        timed.push(event);
      }
    });

    return { allDayEvents: allDay, timedEvents: timed };
  }, [events, tempEvent, weekStart, weekEnd]);

  // 종일 이벤트 바 처리
  const allDayEventBars = useMemo(() => {
    const bars: AllDayEventBar[] = [];
    const lanes: AllDayEventBar[][] = []; // 레인별로 이벤트 바 관리

    allDayEvents.forEach(event => {
      const eventStart = parseISO(event.start_date);
      // 자정 종료(00:00:00...)는 전날까지로 간주
      const endsAtMidnight = /T00:00:00/.test(event.end_date);
      const eventEnd = endsAtMidnight ? subDays(parseISO(event.end_date), 1) : parseISO(event.end_date);

      let startDayIndex = -1;
      let endDayIndex = -1;

      weekDays.forEach((day, dayIndex) => {
        const dayDateString = format(day, 'yyyy-MM-dd');
        const eventStartString = format(eventStart, 'yyyy-MM-dd');
        const eventEndString = format(eventEnd, 'yyyy-MM-dd');
        
        if (dayDateString >= eventStartString && dayDateString <= eventEndString) {
          if (startDayIndex === -1) startDayIndex = dayIndex;
          endDayIndex = dayIndex;
        }
      });

      if (startDayIndex !== -1 && endDayIndex !== -1) {
        const width = endDayIndex - startDayIndex + 1;
        const eventBar: AllDayEventBar = {
          event,
          dayIndex: startDayIndex,
          width,
          lane: 0, // 레인은 나중에 할당
          isSingle: width === 1,
          isFirst: startDayIndex === 0 && eventStart < weekStart,
          isLast: endDayIndex === 6 && eventEnd > weekEnd,
          continueLeft: eventStart < weekStart,
          continueRight: eventEnd > weekEnd
        };

        // 레인 할당
        let assignedLane = -1;
        for (let laneIndex = 0; laneIndex < lanes.length; laneIndex++) {
          const lane = lanes[laneIndex];
          let hasConflict = false;
          
          for (const existingBar of lane) {
            if (!(endDayIndex < existingBar.dayIndex || startDayIndex > existingBar.dayIndex + existingBar.width - 1)) {
              hasConflict = true;
              break;
            }
          }
          
          if (!hasConflict) {
            assignedLane = laneIndex;
            break;
          }
        }

        if (assignedLane === -1) {
          assignedLane = lanes.length;
          lanes.push([]);
        }

        eventBar.lane = assignedLane;
        lanes[assignedLane].push(eventBar);
        bars.push(eventBar);
      }
    });

    return bars;
  }, [allDayEvents, weekDays, weekStart, weekEnd]);

  // 시간 이벤트 처리 (여러 날짜에 걸친 이벤트 연결 지원)
  const processedTimedEvents = useMemo(() => {
    const processed: TimedEvent[] = [];

    timedEvents.forEach(event => {
      const eventStart = parseISO(event.start_date);
      const eventEnd = parseISO(event.end_date);

      // 이벤트가 여러 날에 걸쳐 있는지 확인
      let startDayIndex = -1;
      let endDayIndex = -1;
      let eventStartTime = 0;
      let eventEndTime = 0;

      weekDays.forEach((day, dayIndex) => {
        const dayStart = startOfDay(day);
        const dayEnd = addHours(dayStart, 24);

        // 이벤트가 이 날에 걸치는지 확인
        if (eventStart < dayEnd && eventEnd > dayStart) {
          if (startDayIndex === -1) {
            startDayIndex = dayIndex;
            const displayStart = eventStart > dayStart ? eventStart : dayStart;
            eventStartTime = displayStart.getHours() * 60 + displayStart.getMinutes();
          }
          endDayIndex = dayIndex;
          const displayEnd = eventEnd < dayEnd ? eventEnd : dayEnd;
          eventEndTime = displayEnd.getHours() * 60 + displayEnd.getMinutes();
        }
      });

      if (startDayIndex !== -1 && endDayIndex !== -1) {
        const width = endDayIndex - startDayIndex + 1;
        const isMultiDay = width > 1;

        if (isMultiDay) {
          // 여러 날에 걸친 이벤트 - 연결된 바로 표시
          const timedEvent: TimedEvent = {
            event,
            dayIndex: startDayIndex,
            top: (eventStartTime / 60) * 44,
            height: Math.max(44, 20), // 여러 날 이벤트는 최소 1시간 높이
            width,
            isSingle: false,
            isFirst: startDayIndex === 0 && eventStart < weekStart,
            isLast: endDayIndex === 6 && eventEnd > weekEnd,
            continueLeft: eventStart < weekStart,
            continueRight: eventEnd > weekEnd
          };
          processed.push(timedEvent);
        } else {
          // 단일 날짜 이벤트 - 기존 방식
          weekDays.forEach((day, dayIndex) => {
            const dayStart = startOfDay(day);
            const dayEnd = addHours(dayStart, 24);

            if (eventStart < dayEnd && eventEnd > dayStart) {
              const displayStart = eventStart > dayStart ? eventStart : dayStart;
              const displayEnd = eventEnd < dayEnd ? eventEnd : dayEnd;
              
              const startMinutes = displayStart.getHours() * 60 + displayStart.getMinutes();
              const durationMinutes = differenceInMinutes(displayEnd, displayStart);
              
              processed.push({
                event,
                dayIndex,
                top: (startMinutes / 60) * 44,
                height: Math.max((durationMinutes / 60) * 44, 20),
                isSingle: true
              });
            }
          });
        }
      }
    });

    return processed;
  }, [timedEvents, weekDays, weekStart, weekEnd]);

  // 종일 이벤트 영역의 높이 계산
  const allDayHeight = Math.max(allDayEventBars.length > 0 ? 
    Math.max(...allDayEventBars.map(bar => bar.lane)) * 26 + 32 : 32, 32);

  const handleDateCellClick = (date: Date, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const isSameDate = selectedDate && isSameDay(date, selectedDate);
    
    if (isSameDate) {
      onDateClick(date);
    } else {
      onDateSelect(date);
    }
  };

  const handleTimeSlotClick = (date: Date, hour: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (onTimeSlotClick) {
      onTimeSlotClick(date, hour);
    } else {
      // fallback to regular date click
      const isSameDate = selectedDate && isSameDay(date, selectedDate);
      if (isSameDate) {
        onDateClick(date);
      } else {
        onDateSelect(date);
      }
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
              {format(day, 'E', { locale: ko })}
            </div>
            <div className={`${styles.weekHeaderDate} ${isToday(day) ? styles.today : ''}`}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* 종일 이벤트 영역 */}
      <div className={styles.allDayRow} style={{ height: `${allDayHeight}px` }}>
        <div className={styles.timeGutter}>
          <div style={{ padding: '8px', fontSize: '12px', color: '#666' }}>
            종일
          </div>
        </div>
        {weekDays.map((day, dayIndex) => (
          <div key={`allday-${dayIndex}`} className={styles.allDayCell}>
            <div className={styles.allDayLaneContainer} style={{ height: `${allDayHeight - 12}px` }}>
              {allDayEventBars
                .filter(bar => dayIndex >= bar.dayIndex && dayIndex < bar.dayIndex + bar.width)
                .map((bar, barIndex) => {
                  const isTemp = tempEvent && bar.event.id === tempEvent.id;
                  const eventColor = getEventColor(bar.event);
                  const shouldShowText = dayIndex === bar.dayIndex;

                  const isFirstSegment = dayIndex === bar.dayIndex;
                  const isLastSegment = dayIndex === bar.dayIndex + bar.width - 1;
                  const isMiddleSegment = !isFirstSegment && !isLastSegment && bar.width > 2;
                  const isHovered = hoveredEventId === bar.event.id;
                  
                  return (
                    <div
                      key={`${bar.event.id}-${barIndex}`}
                      className={`
                        ${styles.allDayPill}
                        ${bar.isSingle ? styles.single : ''}
                        ${isFirstSegment ? styles.first : ''}
                        ${isLastSegment ? styles.last : ''}
                        ${bar.continueLeft && isFirstSegment ? styles.continueLeft : ''}
                        ${bar.continueRight && isLastSegment ? styles.continueRight : ''}
                        ${isMiddleSegment ? styles.middle : ''}
                        ${isHovered ? styles.hovered : ''}
                      `}
                      style={{
                        backgroundColor: eventColor,
                        color: 'white',
                        top: `${bar.lane * 24 + 2}px`,
                        fontWeight: isTemp ? '700' : '500',
                        zIndex: isTemp ? 15 : (isHovered ? 10 : 5),
                        transform: isHovered ? 'translateY(-1px)' : 'none'
                      }}
                      onMouseEnter={() => setHoveredEventId(bar.event.id)}
                      onMouseLeave={() => setHoveredEventId(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isTemp) {
                          onEventClick(bar.event);
                        }
                      }}
                    >
                      {shouldShowText && (
                        <span style={{ 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          maxWidth: '100%',
                          display: 'block'
                        }}>
                          {isTemp ? tempEvent?.title || 'New Event' : bar.event.title}
                        </span>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      {/* 시간 영역 */}
      <div className={styles.timeScroll}>
        {/* 시간 가터 */}
        <div className={styles.timeGutter}>
          {timeSlots.map((slot, index) => (
            <div key={slot.hour} className={styles.timeGutterRow} style={{ height: '44px' }}>
              {index > 0 && slot.label}
            </div>
          ))}
        </div>

        {/* 시간 컬럼들 */}
        <div className={styles.timeColumns}>
          <div className={styles.timeGrid} style={{ height: `${timeSlots.length * 44}px` }}>
            {weekDays.map((day, dayIndex) => (
              <div key={`time-${dayIndex}`} className={styles.timeDayColumn}>
                {/* 시간 슬롯들 */}
                {timeSlots.map((slot) => (
                  <div 
                    key={`${dayIndex}-${slot.hour}`} 
                    className={styles.timeHourRow} 
                    style={{ height: '44px' }}
                    onClick={(e) => handleTimeSlotClick(day, slot.hour, e)}
                  />
                ))}
                
                {/* 시간 이벤트들 */}
                {processedTimedEvents
                  .filter(timedEvent => {
                    if (timedEvent.width && timedEvent.width > 1) {
                      // 여러 날 이벤트는 시작 날짜부터 끝 날짜까지 모든 날에 표시
                      return dayIndex >= timedEvent.dayIndex && dayIndex < timedEvent.dayIndex + timedEvent.width;
                    } else {
                      // 단일 날 이벤트는 해당 날짜에만 표시
                      return timedEvent.dayIndex === dayIndex;
                    }
                  })
                  .map((timedEvent, eventIndex) => {
                    const isTemp = tempEvent && timedEvent.event.id === tempEvent.id;
                    const eventColor = getEventColor(timedEvent.event);
                    const isMultiDay = timedEvent.width && timedEvent.width > 1;
                    const shouldShowText = !isMultiDay || dayIndex === timedEvent.dayIndex;
                    const isFirstSegment = isMultiDay && dayIndex === timedEvent.dayIndex;
                    const isLastSegment = isMultiDay && dayIndex === timedEvent.dayIndex + (timedEvent.width || 1) - 1;
                    const isMiddleSegment = isMultiDay && !isFirstSegment && !isLastSegment && (timedEvent.width || 1) > 2;
                    const isHovered = hoveredEventId === timedEvent.event.id;
                    
                    return (
                      <div
                        key={`${timedEvent.event.id}-${eventIndex}`}
                        className={`
                          ${styles.timedEvent}
                          ${isMultiDay ? styles.multiDayTimedEvent : ''}
                          ${isMultiDay && timedEvent.isSingle ? styles.single : ''}
                          ${isFirstSegment ? styles.first : ''}
                          ${isLastSegment ? styles.last : ''}
                          ${isMultiDay && timedEvent.continueLeft && isFirstSegment ? styles.continueLeft : ''}
                          ${isMultiDay && timedEvent.continueRight && isLastSegment ? styles.continueRight : ''}
                          ${isMiddleSegment ? styles.middle : ''}
                          ${isHovered ? styles.hovered : ''}
                        `}
                        style={{
                          top: `${timedEvent.top}px`,
                          height: `${timedEvent.height}px`,
                          backgroundColor: eventColor,
                          color: 'rgba(33, 33, 33, 0.6);',
                          fontWeight: isTemp ? '700' : '400',
                          zIndex: isTemp ? 15 : (isHovered ? 10 : (isMultiDay ? 8 : 5)),
                          transform: isHovered ? 'translateY(-1px)' : 'none'
                        }}
                        onMouseEnter={() => setHoveredEventId(timedEvent.event.id)}
                        onMouseLeave={() => setHoveredEventId(null)}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isTemp) {
                            onEventClick(timedEvent.event);
                          }
                        }}
                      >
                        {shouldShowText && (
                          <>
                            <div className={styles.eventTitle}>
                              {isTemp ? tempEvent?.title || 'New Event' : timedEvent.event.title}
                            </div>
                            <div style={{ fontSize: '10px', opacity: 0.9 }}>
                              {format(parseISO(timedEvent.event.start_date), 'HH:mm')} - 
                              {format(parseISO(timedEvent.event.end_date), 'HH:mm')}
                            </div>
                          </>
                        )}
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