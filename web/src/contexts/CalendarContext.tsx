/**
 * CalendarContext
 * 
 * 캘린더 애플리케이션의 전역 상태를 관리하는 Context입니다.
 * 다음과 같은 기능을 제공합니다:
 * 
 * 1. 캘린더 관리
 *   - 캘린더 목록 조회, 생성, 수정, 삭제
 *   - 캘린더 가시성 토글
 *   - 선택된 캘린더 관리
 * 
 * 2. 이벤트 관리
 *   - 이벤트 목록 조회, 생성, 수정, 삭제
 *   - 임시 이벤트 관리 (생성 중인 이벤트)
 *   - 선택된 날짜의 이벤트 목록 관리
 * 
 * 3. 상태 관리
 *   - 로딩 상태 관리
 *   - 에러 상태 관리
 *   - 캘린더 가시성 상태 관리
 * 
 * 4. 유틸리티 함수
 *   - 이벤트 색상 계산
 *   - 캘린더 태그 조회
 *   - 가시성 필터링된 이벤트 목록
 * 
 * 주요 특징:
 * - API 호출과 로컬 상태 동기화
 * - Optimistic UI 업데이트
 * - 에러 처리 및 토스트 알림
 * - 메모이제이션을 통한 성능 최적화
 */

// contexts/CalendarContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { format } from 'date-fns';
import { Calendar, Event } from '../types/calendar.types';
import { calendarAPI } from '../services/calendarApi';
import { toast } from 'react-toastify';

interface CalendarContextType {
  // 캘린더 관련 상태
  calendars: Calendar[];
  selectedCalendarId: string;
  calendarVisibility: Record<string, boolean>;
  
  // 이벤트 관련 상태
  events: Event[];
  tempEvent: Event | null;
  setTempEvent: (event: Event | null) => void;
  updateTempEvent: (updates: Partial<Event>) => void;
  
  // 선택된 날짜의 이벤트 목록
  selectedDateEvents: Event[];
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
  setSelectedDateEvents: (events: Event[]) => void;
  showDateEvents: (date: Date) => void;

  // 캘린더 액션
  setSelectedCalendarId: (id: string) => void;
  toggleCalendarVisibility: (calendarId: string) => void;
  fetchCalendars: () => Promise<void>;
  addCalendar: (newCalendar: Omit<Calendar, 'id' | 'created_at' | 'updated_at'>) => void;
  updateCalendar: (calendarId: string, updates: Partial<Calendar>) => void;
  deleteCalendar: (calendarId: string) => void;
  
  // 이벤트 액션
  fetchEvents: () => Promise<void>;
  addEvent: (event: Event) => void;
  updateEvent: (eventId: string, updates: Partial<Event>) => void;
  deleteEvent: (eventId: string) => void;
  
  // 계산된 값들
  visibleEvents: Event[];
  getEventColor: (event: Event) => string;
  getCalendarTags: (calendarId: string) => any[];
  
  // 로딩 상태
  isLoading: boolean;
  error: string | null;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const useCalendarContext = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendarContext must be used within a CalendarProvider');
  }
  return context;
};

interface CalendarProviderProps {
  children: ReactNode;
}

// API 응답 타입 정의
interface CalendarAPIResponse {
  data?: Calendar[] | { calendars?: Calendar[]; data?: Calendar[] } | any;
}

interface EventAPIResponse {
  data?: Event[] | { events?: Event[]; data?: Event[] } | any;
}

export const CalendarProvider: React.FC<CalendarProviderProps> = ({ children }) => {
  // 상태 정의 - 초기값을 명확하게 설정
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('');
  const [calendarVisibility, setCalendarVisibility] = useState<Record<string, boolean>>({});
  const [events, setEvents] = useState<Event[]>([]); // 빈 배열로 초기화
  const [tempEvent, setTempEvent] = useState<Event | null>(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 캘린더 목록 불러오기
  const fetchCalendars = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await calendarAPI.getCalendars() as CalendarAPIResponse;
      
      // 응답 구조 확인 - 타입 안전하게 처리
      let calendarsData: Calendar[] = [];
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          calendarsData = response.data;
        } else {
          // 객체인 경우 안전하게 접근
          const responseData = response.data as any;
          if (responseData.calendars && Array.isArray(responseData.calendars)) {
            calendarsData = responseData.calendars;
          } else if (responseData.data && Array.isArray(responseData.data)) {
            calendarsData = responseData.data;
          }
        }
      }
      
      setCalendars(calendarsData);
      
      // 모든 캘린더를 기본적으로 표시
      const initialVisibility = calendarsData.reduce((acc: Record<string, boolean>, cal: Calendar) => {
        acc[cal.id] = true;
        return acc;
      }, {});
      setCalendarVisibility(initialVisibility);
      
      // 첫 번째 캘린더를 기본으로 선택
      if (calendarsData.length > 0 && !selectedCalendarId) {
        setSelectedCalendarId(calendarsData[0].id);
      }
      
    } catch (err) {
      console.error('캘린더 불러오기 실패:', err);
      setError('캘린더를 불러오는데 실패했습니다.');
      toast.error('캘린더를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCalendarId]);

  // 이벤트 목록 불러오기
  const fetchEvents = useCallback(async () => {
    console.log('fetchEvents ========> 저장된 이벤트를 불러오는 중.....')
    console.log('현재 인증 토큰:', localStorage.getItem('token'));
    try {
      setIsLoading(true);
      
      const response = await calendarAPI.getEvents() as EventAPIResponse;
      console.log('API 응답 결과 ===>', response)
      console.log('응답 데이터 타입:', typeof response.data)
      console.log('응답 데이터:', response.data)
      
      // 응답 구조 확인 - 타입 안전하게 처리
      let eventsData: Event[] = [];
      
      if (response.data) {
        if (response.data.results && Array.isArray(response.data.results)) {
          eventsData = response.data.results;
        } else if (Array.isArray(response.data)) {
          eventsData = response.data;
        } else {
          console.warn('예상하지 못한 응답 구조:', response.data);
        }
      }

      const uniqueEvents = eventsData.filter((event, index, self) => {
        const firstIndex = self.findIndex(e => 
          e.id === event.id || 
          (e.title === event.title && 
           e.start_date === event.start_date && 
           e.end_date === event.end_date)
        );
        return index === firstIndex;
      });

      console.log('처리된 이벤트 수:', uniqueEvents.length);
      console.log('시간 이벤트 수:', uniqueEvents.filter(e => !e.all_day).length);
      console.log('종일 이벤트 수:', uniqueEvents.filter(e => e.all_day).length);
      
      setEvents(() => uniqueEvents); 
      
    } catch (err) {
      console.error('이벤트 불러오기 실패:', err);
      console.error('에러 상세:', err);
      setError('일정을 불러오는데 실패했습니다.');
      // 에러 발생시에도 빈 배열로 설정
      setEvents([]);
      toast.error('일정을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateTempEvent = (updates: Partial<Event>) => {
    console.log('Context updateTempEvent 호출:', updates);
    if (tempEvent) {
      const updatedEvent = {
        ...tempEvent,
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      console.log('업데이트된 tempEvent:', updatedEvent);
      setTempEvent(updatedEvent);
    } else {
      console.log('tempEvent가 null입니다');
    }
  };

  // 캘린더 표시/숨김 토글
  /**
   * 캘린더 가시성을 토글하는 함수
   * 
   * 특정 캘린더의 표시/숨김 상태를 변경합니다.
   * 이 함수가 호출되면 visibleEvents가 자동으로 재계산됩니다.
   * 
   * 동작:
   * 1. 현재 캘린더의 가시성 상태 확인
   * 2. 상태를 반전시킴 (true -> false, false -> true)
   * 3. 변경된 상태를 저장
   * 4. 디버깅을 위한 로그 출력
   * 
   * @param calendarId - 토글할 캘린더의 ID
   */
  const toggleCalendarVisibility = useCallback((calendarId: string) => {
    setCalendarVisibility(prev => {
      const currentState = prev[calendarId];
      const newState = !currentState;
      const newVisibility = {
        ...prev,
        [calendarId]: newState
      };
      
      console.log(`캘린더 ${calendarId} 토글:`, {
        이전상태: currentState,
        새로운상태: newState,
        전체가시성: newVisibility
      });
      
      return newVisibility;
    });
  }, []);

  // 캘린더 추가
  const addCalendar = useCallback((newCalendar: Omit<Calendar, 'id' | 'created_at' | 'updated_at'>) => {
    const calendar: Calendar = {
      ...newCalendar,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setCalendars(prev => [...prev, calendar]);
    setCalendarVisibility(prev => ({ ...prev, [calendar.id]: true }));
    
    console.log('캘린더 추가됨:', calendar.name);
    toast.success('캘린더가 추가되었습니다.');
  }, []);

  // 캘린더 수정
  const updateCalendar = useCallback((calendarId: string, updates: Partial<Calendar>) => {
    setCalendars(prev => prev.map(cal =>
      cal.id === calendarId
        ? { ...cal, ...updates, updated_at: new Date().toISOString() }
        : cal
    ));
    
    console.log('캘린더 수정됨:', calendarId);
    toast.success('캘린더가 수정되었습니다.');
  }, []);

  // 캘린더 삭제
  const deleteCalendar = useCallback((calendarId: string) => {
    const calendar = calendars.find(cal => cal.id === calendarId);
    if (!calendar) return;

    setCalendars(prev => prev.filter(cal => cal.id !== calendarId));
    setEvents(prev => prev.filter(event => event.calendar !== calendarId));
    setCalendarVisibility(prev => {
      const newVisibility = { ...prev };
      delete newVisibility[calendarId];
      return newVisibility;
    });

    // 삭제된 캘린더가 선택된 캘린더였다면 다른 캘린더 선택
    if (selectedCalendarId === calendarId) {
      const remainingCalendars = calendars.filter(cal => cal.id !== calendarId);
      setSelectedCalendarId(remainingCalendars.length > 0 ? remainingCalendars[0].id : '');
    }

    console.log('캘린더 삭제됨:', calendar.name);
    toast.success('캘린더가 삭제되었습니다.');
  }, [calendars, selectedCalendarId]);

  // 이벤트 추가
  const addEvent = useCallback((event: Event) => {
    setEvents(prev => [...prev, event]);
    console.log('이벤트 추가됨:', event.title);
  }, []);

  // 이벤트 수정
  const updateEvent = useCallback((eventId: string, updates: Partial<Event>) => {
    setEvents(prev => prev.map(event =>
      event.id === eventId
        ? { ...event, ...updates, updated_at: new Date().toISOString() }
        : event
    ));
    console.log('이벤트 수정됨:', eventId);
  }, []);

  // 이벤트 삭제
  const deleteEvent = useCallback((eventId: string) => {
    // events가 배열인지 확인
    if (!Array.isArray(events)) {
      console.error('Events is not an array:', events);
      return;
    }
    
    const event = events.find(e => e.id === eventId);
    if (!event?.can_delete) {
      toast.error('이 일정은 삭제할 수 없습니다.');
      return;
    }
    
    setEvents(prev => prev.filter(e => e.id !== eventId));
    console.log('이벤트 삭제됨:', event.title);
    toast.success('일정이 삭제되었습니다.');
  }, [events]);

  /**
   * 가시성 필터링된 이벤트 목록을 계산하는 메모이제이션된 값
   * 
   * 활성화된 캘린더에 속한 이벤트만 필터링하여 반환합니다.
   * 캘린더 가시성이 변경될 때마다 자동으로 재계산됩니다.
   * 
   * 동작:
   * 1. 모든 이벤트를 순회
   * 2. 각 이벤트의 캘린더가 활성화되어 있는지 확인
   * 3. 활성화된 캘린더의 이벤트만 필터링하여 반환
   * 
   * @returns 필터링된 이벤트 배열
   */
  const visibleEvents = React.useMemo(() => {
    // events가 배열이 아닌 경우 빈 배열 반환
    if (!Array.isArray(events)) {
      console.warn('Events is not an array, returning empty array');
      return [];
    }
    
    console.log('visibleEvents 필터링:', {
      totalEvents: events.length,
      calendarVisibility,
      events: events.map(e => ({ id: e.id, title: e.title, calendar: e.calendar }))
    });
    
    const filtered = events.filter(event => {
      const isVisible = calendarVisibility[event.calendar] !== false;
      console.log(`이벤트 ${event.title} (캘린더: ${event.calendar}) - 가시성: ${isVisible}`);
      return isVisible;
    });
    
    console.log('필터링된 이벤트:', filtered.length);
    return filtered;
  }, [events, calendarVisibility]);

  // 이벤트 색상 가져오기
  const getEventColor = useCallback((event: Event): string => {
    if (tempEvent && event.id === tempEvent.id) {
      return tempEvent.color || tempEvent.tag?.color || '#4A90E2';
    }

    if (event.color) return event.color;
    const calendar = calendars.find(cal => cal.id === event.calendar);
    return calendar?.color || '#4A90E2';
  }, [calendars, tempEvent]);

  // 캘린더 태그 가져오기
  const getCalendarTags = useCallback((calendarId: string) => {
    const calendar = calendars.find(cal => cal.id === calendarId);
    return calendar?.tags || [];
  }, [calendars]);

  // 선택된 날짜의 이벤트 보여주기
  /**
   * 특정 날짜의 이벤트 목록을 표시하는 함수
   * 
   * 선택된 날짜와 해당 날짜의 이벤트 목록을 설정합니다.
   * 이 함수는 "+n" 버튼 클릭 시 호출되어 해당 날짜의 이벤트 목록을 표시합니다.
   * 
   * 동작:
   * 1. 선택된 날짜 설정
   * 2. 해당 날짜의 이벤트들을 필터링
   * 3. 필터링된 이벤트 목록을 상태에 저장
   * 
   * @param date - 이벤트 목록을 표시할 날짜
   */
  const showDateEvents = useCallback((date: Date) => {
    // 로컬 타임존 기준 날짜 문자열 (UTC로 변환하면 하루가 어긋날 수 있음)
    const dateStr = format(date, 'yyyy-MM-dd');

    
    const dayEvents = events.filter(event => {
      const eventStartDate = event.start_date.split('T')[0];
      const eventEndDate = event.end_date.split('T')[0];
      
      // 시작일이 해당 날짜이거나, 종료일이 해당 날짜이거나, 해당 날짜가 이벤트 기간 내에 있는 경우
      return eventStartDate === dateStr || 
             eventEndDate === dateStr || 
             (eventStartDate <= dateStr && eventEndDate >= dateStr);
    });
    
    console.log('Filtered dayEvents:', {
      dayEvents: dayEvents.length,
      events: dayEvents.map(e => ({ id: e.id, title: e.title, start_date: e.start_date }))
    });
    
    setSelectedDate(date);
    setSelectedDateEvents(dayEvents);
  }, [events]);

  // 초기 데이터 로드
  useEffect(() => {
    fetchCalendars();
  }, []);

  // 캘린더가 로드된 후 이벤트 로드
  useEffect(() => {
    if (calendars.length > 0) {
      console.log('캘린더 로드 완료, 이벤트 가져오기 시작');
      fetchEvents();
    }
  }, [calendars.length, fetchEvents]);

  const contextValue: CalendarContextType = {
    // 상태
    calendars,
    selectedCalendarId,
    calendarVisibility,
    events,
    setTempEvent,
    updateTempEvent,
    
    // 선택된 날짜의 이벤트 목록
    selectedDateEvents,
    selectedDate,
    setSelectedDate,
    setSelectedDateEvents,
    showDateEvents,
    
    tempEvent,
    isLoading,
    error,
    
    // 캘린더 액션
    setSelectedCalendarId,
    toggleCalendarVisibility,
    fetchCalendars,
    addCalendar,
    updateCalendar,
    deleteCalendar,
    
    // 이벤트 액션
    fetchEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    
    // 계산된 값들
    visibleEvents,
    getEventColor,
    getCalendarTags,
  };

  return (
    <CalendarContext.Provider value={contextValue}>
      {children}
    </CalendarContext.Provider>
  );
};
