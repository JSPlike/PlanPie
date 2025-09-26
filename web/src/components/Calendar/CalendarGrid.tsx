// src/components/CalendarGrid/CalendarGrid.tsx
import React, { useMemo } from 'react';
import styles from './CalendarGrid.module.css';
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek,
  startOfDay, endOfDay, isWithinInterval, differenceInDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Event, Calendar } from '../../types/calendar.types';

interface CalendarGridProps {
  currentDate: Date;
  selectedDate: Date | null;
  selectedRange: {start: Date, end: Date} | null;
  events: Event[];
  tempEvent: Event | null;
  calendars: Calendar[];
  onDateClick: (date: Date) => void;
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  onEventClick: (event: Event) => void;
  onEventDelete: (eventId: string) => void;
  getEventColor: (event: Event) => string;
}

interface EventBar {
  event: Event;
  weekIndex: number;
  startDay: number;
  endDay: number;
  width: number;
  isMultiDay: boolean;
  layer: number;
}

interface WeekLayers {
  [weekIndex: number]: EventBar[][];
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  selectedDate,
  selectedRange,
  events,
  tempEvent,
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

  // 이벤트를 바 형태로 처리하는 로직 추가
  const processEventBars = useMemo(() => {
    const allEvents = tempEvent ? [...events, tempEvent] : events;

    const eventBars: EventBar[] = [];
    const weeks: Date[][] = [];
    
    // 주별로 날짜 그룹화
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }


    // 2025-09-26 events에서 allEvents로 변경
    allEvents.forEach(event => {
      const eventStart = parseISO(event.start_date);
      const eventEnd = parseISO(event.end_date);
      
      // 이벤트가 달력 범위와 겹치는지 확인
      if (eventEnd < calendarStart || eventStart > calendarEnd) {
        return;
      }

      weeks.forEach((week, weekIndex) => {
        const weekStart = week[0];
        const weekEnd = week[6];
        
        // 이벤트가 이 주와 겹치는지 확인
        if (eventEnd >= weekStart && eventStart <= weekEnd) {
          // 이벤트가 시작되는 날과 끝나는 날 찾기
          let startDayIndex = 0;
          let endDayIndex = 6;
          
          week.forEach((day, dayIndex) => {
            if (eventStart <= day && startDayIndex === -1) {
              startDayIndex = dayIndex;
            }
            if (eventEnd >= day) {
              endDayIndex = dayIndex;
            }
          });

          // 주의 시작일보다 이벤트가 먼저 시작하는 경우
          if (eventStart < weekStart) {
            startDayIndex = 0;
          }

          // 주의 종료일보다 이벤트가 늦게 끝나는 경우
          if (eventEnd > weekEnd) {
            endDayIndex = 6;
          }
          
          if (startDayIndex <= endDayIndex) {
            eventBars.push({
              event,
              weekIndex,
              startDay: startDayIndex,
              endDay: endDayIndex,
              width: endDayIndex - startDayIndex + 1,
              isMultiDay: differenceInDays(eventEnd, eventStart) > 0,
              layer: 0 // 기본값
            });
          }
        }
      });
    });

    // 우선순위에 따른 정렬 및 레이어 배치
    const weekLayers: WeekLayers = {};
    
    // 주별로 이벤트 바들을 그룹화
    const eventsByWeek: { [weekIndex: number]: EventBar[] } = {};
    eventBars.forEach(bar => {
      if (!eventsByWeek[bar.weekIndex]) {
        eventsByWeek[bar.weekIndex] = [];
      }
      eventsByWeek[bar.weekIndex].push(bar);
    });

    // 각 주별로 우선순위 정렬 및 레이어 배치
    Object.keys(eventsByWeek).forEach(weekIndexStr => {
      const weekIndex = parseInt(weekIndexStr);
      const weekBars = eventsByWeek[weekIndex];
      
      // 우선순위 정렬
      weekBars.sort((a, b) => {
        const aStart = parseISO(a.event.start_date);
        const aEnd = parseISO(a.event.end_date);
        const bStart = parseISO(b.event.start_date);
        const bEnd = parseISO(b.event.end_date);
        
        const aDuration = differenceInDays(aEnd, aStart);
        const bDuration = differenceInDays(bEnd, bStart);
        
        // 임시 이벤트 확인
        const aIsTemp = tempEvent && a.event.id === tempEvent.id;
        const bIsTemp = tempEvent && b.event.id === tempEvent.id;
        
        // 0. 임시 이벤트는 항상 맨 아래 (나중에 배치)
        if (aIsTemp && !bIsTemp) return 1;
        if (!aIsTemp && bIsTemp) return -1;
        
        // 1. 종일 이벤트 우선
        if (a.event.all_day && !b.event.all_day) return -1;
        if (!a.event.all_day && b.event.all_day) return 1;
        
        // 2. 종일 이벤트끼리는 기간이 긴 것 우선 (위에 배치)
        if (a.event.all_day && b.event.all_day) {
          if (aDuration !== bDuration) {
            return bDuration - aDuration; // 긴 기간이 먼저 (위에)
          }
          // 기간이 같으면 시작일이 빠른 것 우선
          return aStart.getTime() - bStart.getTime();
        }
        
        // 3. 시간 이벤트끼리는 시작 시간 순
        if (!a.event.all_day && !b.event.all_day) {
          return aStart.getTime() - bStart.getTime();
        }
        
        return 0;
      });
      
      // 레이어 배치 (겹치지 않도록)
      weekLayers[weekIndex] = [];
      
      weekBars.forEach(bar => {
        let layer = 0;
        let placed = false;
        
        while (!placed) {
          if (!weekLayers[weekIndex][layer]) {
            weekLayers[weekIndex][layer] = [];
          }
          
          const hasOverlap = weekLayers[weekIndex][layer].some(existing => 
            !(bar.startDay > existing.endDay || existing.startDay > bar.endDay)
          );
          
          if (!hasOverlap) {
            bar.layer = layer;
            weekLayers[weekIndex][layer].push(bar);
            placed = true;
          } else {
            layer++;
          }
          
          // 무한 루프 방지
          if (layer > 10) {
            bar.layer = 10;
            if (!weekLayers[weekIndex][10]) {
              weekLayers[weekIndex][10] = [];
            }
            weekLayers[weekIndex][10].push(bar);
            placed = true;
          }
        }
      });
    });
    
    return weekLayers;
  }, [events, calendarDays, calendarStart, calendarEnd]);

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
      {/* 주별로 그룹화하여 렌더링 */}
        {calendarDays.map((date, dateIndex) => {
          const dayEvents = getEventsForDate(date);
          const weekIndex = Math.floor(dateIndex / 7);
          const dayIndex = dateIndex % 7;

          // 해당 날짜에서 시작하는 이벤트 바들 찾기
          const dayEventBars = processEventBars[weekIndex] 
          ? processEventBars[weekIndex].flat().filter(bar => {
              // 이벤트가 이 날짜에 표시되어야 하는지 확인
              const eventStartDate = new Date(parseISO(bar.event.start_date));
              const eventEndDate = new Date(parseISO(bar.event.end_date));
              
              // 이벤트가 이 날짜에 걸쳐있는지 확인
              return date >= eventStartDate && date <= eventEndDate;
            })
          : [];
          
          const getClassNames = (date: Date) => {
            const isOtherMonth = !isCurrentMonth(date);
            const isSunday = date.getDay() === 0;
            const isSaturday = date.getDay() === 6;
            
            return {
              [styles.dayCell]: true,
              [styles.otherMonth]: isOtherMonth,
              [styles.today]: isToday(date),
              [styles.selected]: isSelected(date),
              [styles.sunday]: !isOtherMonth && isSunday,
              [styles.saturday]: !isOtherMonth && isSaturday,
              [styles.otherSunday]: isOtherMonth && isSunday,
              [styles.otherSaturday]: isOtherMonth && isSaturday,
            };
          };

          return (
            <div
              key={date.toISOString()}
              className={Object.entries(getClassNames(date))
                .filter(([key, value]) => value)
                .map(([key]) => key)
                .join(' ')
              }
              // className={`
              //   ${styles.dayCell} 
              //   ${!isCurrentMonth(date) ? styles.otherMonth : ''}
              //   ${isToday(date) ? styles.today : ''}
              //   ${isSelected(date) ? styles.selected : ''}
              //   ${isCurrentMonth(date) && date.getDay() === 0 ? styles.sunday : ''}
              //   ${isCurrentMonth(date) && date.getDay() === 6 ? styles.saturday : ''}
              //   ${!isCurrentMonth(date) && date.getDay() === 0 ? styles.otherSunday : ''}
              //   ${!isCurrentMonth(date) && date.getDay() === 6 ? styles.otherSaturday : ''}
              // `}
              onClick={(e) => handleDateCellClick(date, e)}
            >
              <div className={styles.dayNumber}>
                {format(date, 'd')}
              </div>
               {/* 이벤트 바들을 날짜 셀 내부에 표시 */}
              <div className={styles.dayEvents}>
                {dayEventBars.map((bar, barIndex) => {
                  const isTemp = tempEvent && bar.event.id === tempEvent.id;
                  let eventColor = getEventColor(bar.event);
                  console.log('eventColor : ', eventColor);
                  return (
                    <div
                      key={`${bar.event.id}-${barIndex}`}
                      className={`
                        ${styles.eventBar} 
                        ${isTemp ? styles.tempEvent : ''}
                      `}
                      style={{
                        backgroundColor: eventColor,
                        opacity: isTemp ? 0.8 : 1,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isTemp) {
                          onEventClick(bar.event);
                        }
                      }}
                    >
                      <span className={styles.eventTitle}>
                        {isTemp ? 'New Event' : bar.event.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarGrid;
