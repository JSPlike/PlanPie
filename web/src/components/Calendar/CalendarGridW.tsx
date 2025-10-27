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
  const { tempEvent, getEventColor, showDateEvents } = useCalendarContext();
  const [hoveredEventId, setHoveredEventId] = React.useState<string | null>(null);

  // 주의 시작과 끝 계산
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // 시간 슬롯 생성 (30분 단위)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let halfHour = 0; halfHour < 48; halfHour++) { // 48개 = 24시간 * 2 (30분 단위)
      const hour = Math.floor(halfHour / 2);
      const minutes = (halfHour % 2) * 30;
      
      slots.push({
        hour,
        minutes,
        halfHour,
        actualHour: hour + (minutes / 60) // 클릭 시 사용할 실제 시간 (0, 0.5, 1, 1.5, 2, 2.5...)
      });
    }
    return slots;
  }, []);

  // 시간 라벨 생성 (1시간 단위, 0AM은 빈칸, 1AM부터 표시)
  const timeLabels = useMemo(() => {
    const labels = [];
    for (let hour = 0; hour < 24; hour++) { // 0시부터 23시까지
      const ampmLabel = hour === 0 ? '' : // 0AM은 빈칸
                       hour < 12 ? `${hour}AM` : 
                       hour === 12 ? '12PM' : 
                       `${hour - 12}PM`;
      
      labels.push({
        hour,
        label: ampmLabel
      });
    }
    return labels;
  }, []);

  // 이벤트를 종일 이벤트와 시간 이벤트로 분리
  const { allDayEvents, timedEvents } = useMemo(() => {
    // tempEvent는 모든 이벤트에 포함 (종일/시간 구분 없이)
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
    
    console.log('시간 이벤트 처리 시작:', timedEvents.length, '개');
    console.log('현재 주 범위:', weekStart, '~', weekEnd);

    timedEvents.forEach(event => {
      const eventStart = parseISO(event.start_date);
      const eventEnd = parseISO(event.end_date);
      
      console.log('이벤트:', event.title, '시작:', eventStart, '종료:', eventEnd);

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
            top: (eventStartTime / 30) * 45, // 30분 = 45px
            height: Math.max(90, 45), // 여러 날 이벤트는 최소 1시간 높이
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
                top: (startMinutes / 30) * 45, // 30분 = 45px
                height: Math.max((durationMinutes / 30) * 45, 45), // 최소 30분 높이
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
    
    // 30분 단위 처리: 0.5는 30분으로 변환
    const clickedTime = new Date(date);
    const hours = Math.floor(hour);
    const minutes = hour % 1 === 0.5 ? 30 : 0; // 0.5일 때만 30분, 나머지는 0분
    
    clickedTime.setHours(hours, minutes, 0, 0);
    
    // 시간 표시 포맷
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    console.log(`시간 슬롯 클릭: ${clickedTime.toLocaleString()}, 시간: ${timeString}, 원본 hour: ${hour}`);
    
    if (onTimeSlotClick) {
      // 30분 단위 값을 그대로 전달 (부모 컴포넌트에서 처리)
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

  // 배경색에 따라 최적의 텍스트 색상을 반환하는 함수
  const getContrastColor = (backgroundColor: string): string => {
    // hex 색상을 rgb로 변환
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // 상대적 밝기 계산 (0-255)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // 밝기가 128보다 크면 어두운 텍스트, 작으면 밝은 텍스트
    return brightness > 128 ? '#333333' : '#ffffff';
  };

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
                        color: getContrastColor(eventColor),
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
          {timeLabels.map((label, index) => (
            <div key={label.hour} className={styles.timeGutterRow} style={{ height: '90px' }}>
              <time className={styles.timeText}>{label.label}</time>
            </div>
          ))}
        </div>

        {/* 시간 컬럼들 */}
        <div className={styles.timeColumns}>
          <div className={styles.timeGrid} style={{ height: `${timeLabels.length * 90}px` }}>
            {weekDays.map((day, dayIndex) => (
              <div key={`time-${dayIndex}`} className={styles.timeDayColumn}>
                {/* 시간 블록들 - 1시간당 2개의 30분 격자 */}
                {timeLabels.map((label, labelIndex) => (
                  <div key={`${dayIndex}-hour-${label.hour}`} style={{ height: '90px' }}>
                    {/* 첫 번째 30분 (정시) */}
                    <div 
                      className={styles.timeHourRow} 
                      style={{ height: '45px' }}
                      onClick={(e) => handleTimeSlotClick(day, label.hour, e)}
                      title={`${label.hour}:00`}
                    />
                    {/* 두 번째 30분 (30분) */}
                    <div 
                      className={styles.timeHourRow} 
                      style={{ height: '45px' }}
                      onClick={(e) => handleTimeSlotClick(day, label.hour + 0.5, e)}
                      title={`${label.hour}:30`}
                    />
                  </div>
                ))}
                
                {/* 시간 이벤트들 */}
                {(() => {
                  const dayTimedEvents = processedTimedEvents.filter(timedEvent => {
                    if (timedEvent.width && timedEvent.width > 1) {
                      // 여러 날 이벤트는 시작 날짜부터 끝 날짜까지 모든 날에 표시
                      return dayIndex >= timedEvent.dayIndex && dayIndex < timedEvent.dayIndex + timedEvent.width;
                    } else {
                      // 단일 날 이벤트는 해당 날짜에만 표시
                      return timedEvent.dayIndex === dayIndex;
                    }
                  });
                  
                  return (
                    <>
                      {dayTimedEvents.slice(0, 3).map((timedEvent, eventIndex) => {
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
                          color: getContrastColor(eventColor),
                          fontWeight: '400',
                          zIndex: isHovered ? 10 : (isMultiDay ? 8 : 5),
                          transform: isHovered ? 'translateY(-1px)' : 'none'
                        }}
                        onMouseEnter={() => setHoveredEventId(timedEvent.event.id)}
                        onMouseLeave={() => setHoveredEventId(null)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(timedEvent.event);
                        }}
                      >
                        {shouldShowText && (
                          <>
                            <div className={styles.eventTitle}>
                              {timedEvent.event.title}
                            </div>
                            <div style={{ fontSize: '10px', opacity: 0.9 }}>
                              {format(parseISO(timedEvent.event.start_date), 'HH:mm', { locale: ko })} -
                              {format(parseISO(timedEvent.event.end_date), 'HH:mm', { locale: ko })}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                    </>
                  );
                })()}
                
                {/* 3개 이상의 시간 이벤트가 있을 때 "+n개" 버튼 표시 - 격자 셀 오른쪽 아래 모서리 */}
                {(() => {
                  const dayTimedEvents = processedTimedEvents.filter(timedEvent => {
                    if (timedEvent.width && timedEvent.width > 1) {
                      return dayIndex >= timedEvent.dayIndex && dayIndex < timedEvent.dayIndex + timedEvent.width;
                    } else {
                      return timedEvent.dayIndex === dayIndex;
                    }
                  });
                  
                  return dayTimedEvents.length > 3 ? (
                    <div 
                      className={styles.moreEventsButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        // 오른쪽 사이드바에 해당 날짜의 모든 이벤트 표시
                        showDateEvents(day);
                        console.log(`날짜 ${format(day, 'yyyy-MM-dd')}의 추가 시간 이벤트 ${dayTimedEvents.length - 3}개`);
                      }}
                    >
                      +{dayTimedEvents.length - 3}개
                    </div>
                  ) : null;
                })()}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarGridW;