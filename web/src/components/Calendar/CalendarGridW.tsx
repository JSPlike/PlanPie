// src/components/Calendar/CalendarGridW.tsx
import React, { useMemo } from 'react';
import styles from './CalendarGridW.module.css';
import { addDays, endOfWeek, format, isSameDay, parseISO, startOfDay, startOfWeek, differenceInMinutes } from 'date-fns';
import { Event } from '../../types/calendar.types';
import { useCalendarContext } from '../../contexts/CalendarContext';

interface CalendarGridWrops {
  currentDate: Date;
  selectedDate: Date | null;
  events: Event[];
  onDateSelect: (date: Date) => void;
  onEventClick: (event: Event) => void;
  onDateDoubleClick?: (date: Date) => void;
}

const CalendarGridW: React.FC<CalendarGridWrops> = ({ currentDate, selectedDate, events, onDateSelect, onEventClick, onDateDoubleClick }) => {
  const { tempEvent, getEventColor } = useCalendarContext();
  const HOUR_ROW_HEIGHT = 44; // px per hour
  const ALLDAY_LANE_HEIGHT = 24; // px per all-day lane
  const HEADER_HEIGHT = 48; // px, matches sticky header top in CSS

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  // 주간 전체 이벤트 목록 (temp 포함)
  const allWeekEvents = useMemo(() => (tempEvent ? [...events, tempEvent] : events), [events, tempEvent]);

  // 종일 이벤트에 대한 주 단위 레인 배치 (같은 이벤트는 같은 줄 유지)
  const allDayBars = useMemo(() => {
    type Bar = {
      event: Event;
      startDay: number; // 0..6
      endDay: number;   // 0..6
      lane: number;
    };

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
    const bars: Omit<Bar, 'lane'>[] = [];

    allWeekEvents.filter(e => e.all_day).forEach(e => {
      const es = parseISO(e.start_date);
      const ee = parseISO(e.end_date);
      if (ee < weekStart || es > weekEnd) return;
      let startIdx = Math.max(0, Math.floor((startOfDay(es).getTime() - startOfDay(weekStart).getTime()) / (24*60*60*1000)));
      let endIdx = Math.min(6, Math.floor((startOfDay(ee).getTime() - startOfDay(weekStart).getTime()) / (24*60*60*1000)));
      if (startIdx > 6 || endIdx < 0) return;
      bars.push({ event: e, startDay: Math.max(0, startIdx), endDay: Math.min(6, endIdx) });
    });

    // 정렬: 시작일 오름차순, 길이 내림차순
    bars.sort((a, b) => a.startDay - b.startDay || (b.endDay - b.startDay) - (a.endDay - a.startDay));

    const occupancy: boolean[][] = []; // occupancy[lane][day]
    const assigned: Bar[] = [];
    bars.forEach(bar => {
      let lane = 0;
      while (true) {
        if (!occupancy[lane]) occupancy[lane] = [false,false,false,false,false,false,false];
        let conflict = false;
        for (let d = bar.startDay; d <= bar.endDay; d++) {
          if (occupancy[lane][d]) { conflict = true; break; }
        }
        if (!conflict) {
          for (let d = bar.startDay; d <= bar.endDay; d++) occupancy[lane][d] = true;
          assigned.push({ ...bar, lane });
          break;
        }
        lane++;
      }
    });

    return assigned;
  }, [allWeekEvents, currentDate]);

  const maxAllDayLane = useMemo(() => {
    return allDayBars.reduce((m, b) => Math.max(m, b.lane), -1);
  }, [allDayBars]);
  const allDayHeightPx = (maxAllDayLane + 1) * ALLDAY_LANE_HEIGHT;

  // 시간 지정 이벤트: 요일별로 단순 그룹 (후속으로 겹침 분할 가능)
  const timedEventsByDay = useMemo(() => {
    const map: Record<number, Event[]> = { 0:[],1:[],2:[],3:[],4:[],5:[],6:[] };
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
    allWeekEvents.filter(e => !e.all_day).forEach(e => {
      const es = parseISO(e.start_date);
      const ee = parseISO(e.end_date);
      if (ee < weekStart || es > weekEnd) return;
      // 이벤트가 걸치는 각 날짜에 배치
      weekDays.forEach((day, dayIdx) => {
        const dayStart = startOfDay(day);
        const dayEnd = new Date(dayStart.getTime() + 24*60*60*1000 - 1);
        if (!(ee < dayStart || es > dayEnd)) {
          map[dayIdx].push(e);
        }
      });
    });
    return map;
  }, [allWeekEvents, currentDate, weekDays]);

  // 시간 그리드 전체 높이
  const timeGridHeight = 24 * HOUR_ROW_HEIGHT;

  return (
    <div className={styles.weekView}>
      {/* 요일 헤더 */}
      <div className={styles.weekHeader}>
        <div className={styles.timeGutterHeader} />
        {weekDays.map((day) => (
          <div key={day.toISOString()} className={styles.weekHeaderCell}>
            <div className={styles.weekHeaderDay}>{format(day, 'EEE')}</div>
            <div className={`${styles.weekHeaderDate} ${isSameDay(day, new Date()) ? styles.today : ''}`}>{format(day, 'd')}</div>
          </div>
        ))}
      </div>

      {/* 종일 섹션: 주 단위 레인 고정 */}
      <div className={styles.allDayRow}>
        <div className={styles.timeGutter} />
        {weekDays.map((_, dayIdx) => (
          <div
            key={dayIdx}
            className={styles.allDayCell}
            onClick={() => onDateSelect(weekDays[dayIdx])}
            onDoubleClick={() => onDateDoubleClick && onDateDoubleClick(weekDays[dayIdx])}
          >
            <div className={styles.allDayLaneContainer} style={{ height: `${allDayHeightPx}px` }}>
              {allDayBars
                .filter(b => dayIdx >= b.startDay && dayIdx <= b.endDay)
                .map(b => {
                  const color = getEventColor(b.event);
                  const isStart = dayIdx === b.startDay;
                  const isEnd = dayIdx === b.endDay;
                  const isSingle = b.startDay === b.endDay;
                  return (
                    <div
                      key={`${b.event.id}-${b.lane}-${dayIdx}`}
                      className={`${styles.allDayPill} ${isSingle ? styles.single : ''} ${isStart && !isSingle ? styles.first : ''} ${isEnd && !isSingle ? styles.last : ''} ${dayIdx > b.startDay ? styles.continueLeft : ''} ${dayIdx < b.endDay ? styles.continueRight : ''}`}
                      style={{
                        top: `${b.lane * ALLDAY_LANE_HEIGHT}px`,
                        backgroundColor: color,
                        color: 'white'
                      }}
                      onClick={(ev) => { ev.stopPropagation(); onEventClick(b.event); }}
                    >
                      {isStart ? b.event.title : ''}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      {/* 시간 그리드 (스크롤) */}
      <div className={styles.timeScroll} style={{ height: `calc(100% - ${HEADER_HEIGHT}px - ${allDayHeightPx}px)` }}>
        <div className={styles.timeGutter}>
          <div style={{ position: 'relative', height: timeGridHeight }}>
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className={styles.timeGutterRow} style={{ height: HOUR_ROW_HEIGHT }}>
                {format(new Date(2000,1,1,h), h === 0 ? 'hh a' : 'hh a')}
              </div>
            ))}
          </div>
        </div>
        <div className={styles.timeColumns}>
          {weekDays.map((day, dayIdx) => (
            <div
              key={day.toISOString()}
              className={styles.timeDayColumn}
              onClick={() => onDateSelect(day)}
              onDoubleClick={() => onDateDoubleClick && onDateDoubleClick(day)}
            >
              <div className={styles.timeGrid} style={{ height: timeGridHeight }}>
                {Array.from({ length: 24 }, (_, h) => (
                  <div key={h} className={styles.timeHourRow} style={{ height: HOUR_ROW_HEIGHT }} />
                ))}
                {/* 시간 이벤트 배치 (대략적) */}
                {timedEventsByDay[dayIdx].map(e => {
                  const es = parseISO(e.start_date);
                  const ee = parseISO(e.end_date);
                  const startM = es.getHours() * 60 + es.getMinutes();
                  const endM = ee.getHours() * 60 + ee.getMinutes();
                  const top = (startM / 60) * HOUR_ROW_HEIGHT;
                  const height = Math.max(20, ((Math.max(0, endM - startM)) / 60) * HOUR_ROW_HEIGHT);
                  const color = getEventColor(e);
                  return (
                    <div
                      key={`${e.id}-t-${dayIdx}`}
                      className={styles.timedEvent}
                      style={{ top, height, borderLeft: `3px solid ${color}` }}
                      onClick={(ev) => { ev.stopPropagation(); onEventClick(e); }}
                    >
                      <span className={styles.eventTitle}>{e.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarGridW;


