// src/components/CalendarGrid/CalendarGrid.tsx
import React, { useMemo } from 'react';
import styles from './CalendarGrid.module.css';
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek,
  startOfDay, differenceInDays, subDays } from 'date-fns';
import { Event, Calendar } from '../../types/calendar.types';
import { useCalendarContext } from '../../contexts/CalendarContext';

interface CalendarGridProps {
  currentDate: Date;
  selectedDate: Date | null;
  selectedRange: {start: Date, end: Date} | null;
  events: Event[];
  //tempEvent: Event | null;
  calendars: Calendar[];
  onDateClick: (date: Date) => void;
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  onEventClick: (event: Event) => void;
  onEventDelete: (eventId: string) => void;
  // getEventColor: (event: Event) => string;
}

interface EventBar {
  event: Event;
  weekIndex: number;
  startDay: number;
  endDay: number;
  width: number;
  isMultiDay: boolean;
  layer: number;
  showText?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  isMiddle?: boolean;
}

interface WeekLayers {
  [weekIndex: number]: EventBar[][];
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  selectedDate,
  events,
  // tempEvent,
  calendars,
  onDateClick,
  onDateSelect,
  onMonthChange,
  onEventClick,
  onEventDelete,
  // getEventColor
}) => {
  const [hoveredEventId, setHoveredEventId] = React.useState<string | null>(null);
  
  // 캘린더 날짜 범위 계산
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const { tempEvent, getEventColor } = useCalendarContext();

  // const calendarDays = eachDayOfInterval({
  //   start: calendarStart,
  //   end: calendarEnd
  // });

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    
    return eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd
    });
  }, [currentDate]);
  
  // 이벤트 바 처리 로직
  const processEventBars = useMemo(() => {
    const allEvents = tempEvent ? [...events, tempEvent] : events;
    const eventBars: EventBar[] = [];
    const weeks: Date[][] = [];
    
    // 주별로 날짜 그룹화
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }
  
    // 모든 이벤트에 대해 이벤트 바 생성 (기존 로직 동일)
    allEvents.forEach(event => {
      const eventStart = parseISO(event.start_date);
      const eventEnd = parseISO(event.end_date);
      
      if (eventEnd < calendarStart || eventStart > calendarEnd) {
        return;
      }
  
      weeks.forEach((week, weekIndex) => {
        let startDayIndex = -1;
        let endDayIndex = -1;
        
        week.forEach((day, dayIndex) => {
          let shouldShow = false;
        
          if (event.all_day) {
            const dayDateString = format(day, 'yyyy-MM-dd');
            const eventStartString = event.start_date.substring(0, 10);
            // 자정 종료(00:00:00...)는 전날까지로 간주하여 표시 범위에서 제외
            const endsAtMidnight = /T00:00:00/.test(event.end_date);
            const adjustedEnd = endsAtMidnight ? subDays(parseISO(event.end_date), 1) : parseISO(event.end_date);
            const eventEndString = format(adjustedEnd, 'yyyy-MM-dd');
            shouldShow = dayDateString >= eventStartString && dayDateString <= eventEndString;
          } else {
            const eventStartDay = startOfDay(eventStart);
            const eventEndDay = startOfDay(eventEnd);
            const currentDay = startOfDay(day);
            shouldShow = currentDay >= eventStartDay && currentDay <= eventEndDay;
          }
          
          if (shouldShow) {
            if (startDayIndex === -1) {
              startDayIndex = dayIndex;
            }
            endDayIndex = dayIndex;
          }
        });
        
        if (startDayIndex !== -1 && endDayIndex !== -1) {
          eventBars.push({
            event,
            weekIndex,
            startDay: startDayIndex,
            endDay: endDayIndex,
            width: endDayIndex - startDayIndex + 1,
            isMultiDay: differenceInDays(eventEnd, eventStart) > 0,
            layer: 0
          });
        }
      });
    });
  
    // 연속된 이벤트 바 병합 처리
    const mergeConsecutiveEvents = (eventBars: EventBar[]): EventBar[] => {
      const eventGroups: { [eventId: string]: EventBar[] } = {};
  
      eventBars.forEach(bar => {

        if (!eventGroups[bar.event.id]) {
          eventGroups[bar.event.id] = [];
        }
        eventGroups[bar.event.id].push(bar);
      });

      const mergedBars: EventBar[] = [];

      Object.values(eventGroups).forEach(bars => {
        
        if (bars.length === 1) {
          // 단일 바
          mergedBars.push({
            ...bars[0],
            showText: true,
            // isFirst, isLast, isMiddle 모두 설정하지 않음 (undefined)
          });
        } else {
          bars.sort((a, b) => a.weekIndex - b.weekIndex || a.startDay - b.startDay);
          
          bars.forEach((bar, index) => {
            
            if (index === 0) {
              // 첫 번째 바
              mergedBars.push({
                ...bar,
                showText: true,
                isFirst: true,
                isLast: false,
                isMiddle: false
              });
            } else if (index === bars.length - 1) {
              // 마지막 바
              mergedBars.push({
                ...bar,
                showText: false,
                isFirst: false,
                isLast: true,
                isMiddle: false
              });
            } else {
              // 중간 바들
              mergedBars.push({
                ...bar,
                showText: false,
                isFirst: false,
                isLast: false,
                isMiddle: true
              });
            }
          });
        }
      });

      return mergedBars;
    };

    // 병합된 이벤트 바 적용
    const mergedEventBars = mergeConsecutiveEvents(eventBars);

    // 주별로 이벤트 바들을 그룹화하고 레이어 배치
    const weekLayers: WeekLayers = {};
    const eventsByWeek: { [weekIndex: number]: EventBar[] } = {};

    // ✅ 중요: mergedEventBars 사용!
    mergedEventBars.forEach(bar => {
      if (!eventsByWeek[bar.weekIndex]) {
        eventsByWeek[bar.weekIndex] = [];
      }
      eventsByWeek[bar.weekIndex].push(bar);
    });

    // 주 단위 레인 배치: 한 주 내에서 같은 이벤트는 주 전 기간에 걸쳐 동일한 레이어 유지
    Object.keys(eventsByWeek).forEach(weekIndexStr => {
      const weekIndex = parseInt(weekIndexStr);
      const weekBars = eventsByWeek[weekIndex].slice();

      // 시작일 오름차순, 길이(내림차순)로 정렬하여 넓은 바를 먼저 배치
      weekBars.sort((a, b) => {
        if (a.startDay !== b.startDay) return a.startDay - b.startDay;
        const aLen = a.endDay - a.startDay;
        const bLen = b.endDay - b.startDay;
        return bLen - aLen;
      });

      const occupancy: boolean[][] = []; // occupancy[layer][day]
      const assignedBars: EventBar[] = [];
      weekBars.forEach(bar => {
        let layer = 0;
        // 첫 번째로 모든 날짜가 비어있는 레이어 찾기
        while (true) {
          if (!occupancy[layer]) occupancy[layer] = [false, false, false, false, false, false, false];
          let conflict = false;
          for (let d = bar.startDay; d <= bar.endDay; d++) {
            if (occupancy[layer][d]) { conflict = true; break; }
          }
          if (!conflict) {
            for (let d = bar.startDay; d <= bar.endDay; d++) occupancy[layer][d] = true;
            bar.layer = layer;
            assignedBars.push(bar);
            break;
          }
          layer++;
        }
      });

      // 레이어별로 그룹화 저장
      weekLayers[weekIndex] = [];
      assignedBars.forEach(bar => {
        if (!weekLayers[weekIndex][bar.layer]) weekLayers[weekIndex][bar.layer] = [];
        weekLayers[weekIndex][bar.layer].push(bar);
      });
    });

    return weekLayers;
  }, [events, tempEvent, currentDate]);

  // 날짜 셀 클릭 핸들러
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

  // 유틸리티 함수들
  const isToday = (date: Date) => isSameDay(date, new Date());
  const isSelected = (date: Date) => selectedDate ? isSameDay(date, selectedDate) : false;
  const isCurrentMonth = (date: Date) => date.getMonth() === currentDate.getMonth();

  const LAYER_ROW_HEIGHT_PX = 24; // fixed vertical spacing per layer to avoid overlaps

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
        {calendarDays.map((date, dateIndex) => {
          const weekIndex = Math.floor(dateIndex / 7);
          const dayIndex = dateIndex % 7;

          // 해당 날짜에 표시될 이벤트 바들 찾기
          const dayEventBars = processEventBars[weekIndex] 
            ? processEventBars[weekIndex].flat().filter(bar => {
                return dayIndex >= bar.startDay && dayIndex <= bar.endDay;
              })
            : [];

            dayEventBars.sort((a, b) => a.layer - b.layer);

          // 주 단위 레이어 할당을 유지하기 위해 일 단위 재매핑 제거
          
          // CSS 클래스명 생성
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
              onClick={(e) => handleDateCellClick(date, e)}
            >
              <div className={styles.dayNumber}>
                <div className={styles.dayNumberMain}>
                  {format(date, 'd')}
                </div>
                <div className={styles.dayNumberSub}>
                  {format(date, 'M.d')}
                </div>
              </div>
              
              {/* 이벤트 바들 표시 */}
              <div className={styles.dayEvents}>
                {dayEventBars.map((bar, barIndex) => {
                  const isTemp = tempEvent && bar.event.id === tempEvent.id;
                  const isAllDay = bar.event.all_day === true;
                  const eventColor = getEventColor(bar.event);

                  const showText = bar.showText === true && dayIndex === bar.startDay;;

                  // 같은 이벤트의 인접한 바 확인
                  const isFirst = dayIndex === bar.startDay;
                  const isLast = dayIndex === bar.endDay;
                  const isSingle = bar.width === 1;
                  
                  // 오른쪽에 같은 이벤트가 계속되는지 확인
                  const hasRightContinuation = dayIndex < bar.endDay;
                  // 왼쪽에 같은 이벤트가 계속되는지 확인  
                  const hasLeftContinuation = dayIndex > bar.startDay;

                  const isSaturdayWithContinuation = dayIndex === 6 && bar.isFirst && !bar.isLast;
                  const isSundayWithContinuation = dayIndex === 0 && !bar.isFirst && bar.isLast;
                  const isHovered = hoveredEventId === bar.event.id;

                  return (
                    <div
                      key={`${bar.event.id}-${barIndex}`}
                      className={`
                        ${styles.eventBar} 
                        ${isTemp ? styles.tempEvent : ''}
                        ${isSingle ? styles.single : ''}
                        ${isFirst && !isSingle && !isSundayWithContinuation ? styles.first : ''}
                        ${isLast && !isSingle && !isSaturdayWithContinuation ? styles.last : ''}
                        ${hasRightContinuation ? styles.continueRight : ''}
                        ${hasLeftContinuation ? styles.continueLeft : ''}
                        ${isSaturdayWithContinuation ? styles.weekEndContinue : ''}
                        ${isSundayWithContinuation ? styles.weekStartContinue : ''}
                        ${isHovered ? styles.hovered : ''}
                      `}
                      style={{
                        backgroundColor: (isAllDay || bar.width > 1) 
                          ? eventColor 
                          : eventColor.includes('rgb') 
                            ? eventColor.replace('rgb(', 'rgba(').replace(')', ', 0.1)')
                            : `${eventColor}1A`,
                        color: (isAllDay || bar.width > 1) ? 'white' : eventColor,
                        fontWeight: isTemp ? '700' : '300',
                        top: `${bar.layer * LAYER_ROW_HEIGHT_PX}px`,
                        height: `${LAYER_ROW_HEIGHT_PX - 6}px`,
                        transform: isHovered ? 'translateY(-1px)' : 'none',
                        zIndex: isHovered ? 15 : 10,
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
                      <span className={styles.eventTitle}>
                        {showText ? 
                          (isTemp ? tempEvent?.title || 'New Event' : bar.event.title) : 
                          ''
                        }
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
