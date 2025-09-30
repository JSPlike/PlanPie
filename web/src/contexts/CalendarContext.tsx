// contexts/CalendarContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
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
    try {
      setIsLoading(true);
      
      const response = await calendarAPI.getEvents() as EventAPIResponse;
      
      // 응답 구조 확인 - 타입 안전하게 처리
      let eventsData: Event[] = [];
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          eventsData = response.data;
        } else {
          // 객체인 경우 안전하게 접근
          const responseData = response.data as any;
          if (responseData.events && Array.isArray(responseData.events)) {
            eventsData = responseData.events;
          } else if (responseData.data && Array.isArray(responseData.data)) {
            eventsData = responseData.data;
          }
        }
      }
      setEvents(eventsData);
      
    } catch (err) {
      console.error('이벤트 불러오기 실패:', err);
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
  const toggleCalendarVisibility = useCallback((calendarId: string) => {
    setCalendarVisibility(prev => {
      const newVisibility = {
        ...prev,
        [calendarId]: !prev[calendarId]
      };
      
      console.log(`캘린더 ${calendarId} ${newVisibility[calendarId] ? '활성화' : '비활성화'}`);
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

  // 활성화된 캘린더의 이벤트만 필터링
  const visibleEvents = React.useMemo(() => {
    // events가 배열이 아닌 경우 빈 배열 반환
    if (!Array.isArray(events)) {
      console.warn('Events is not an array, returning empty array');
      return [];
    }
    
    const filtered = events.filter(event => {
      const isVisible = calendarVisibility[event.calendar] !== false;
      return isVisible;
    });
    
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

  // 초기 데이터 로드
  useEffect(() => {
    fetchCalendars();
  }, []);

  // 캘린더가 로드된 후 이벤트 로드
  useEffect(() => {
    if (calendars.length > 0) {
      fetchEvents();
    }
  }, [calendars.length]);

  const contextValue: CalendarContextType = {
    // 상태
    calendars,
    selectedCalendarId,
    calendarVisibility,
    events,
    setTempEvent,
    updateTempEvent,
    
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
