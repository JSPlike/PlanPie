/*
// src/pages/Calendar/CalendarView.tsx
import React, { useState, useMemo, useEffect } from 'react';
import styles from './CalendarView.module.css';
import { toast } from 'react-toastify';
import CalendarHeader from '../../components/Calendar/CalendarHeader';
import CalendarLeftSide from '../../components/Calendar/CalendarLeftSide';
import CalendarGrid from '../../components/Calendar/CalendarGrid';
import CalendarRightSide from '../../components/Calendar/CalendarRightSide';
import EventModal from '../../components/Calendar/EventModal';
import { CalendarProvider, useCalendarContext } from '../../contexts/CalendarContext';
import { calendarAPI } from '../../services/calendarApi'; // 기존 API 사용
import { Calendar, CalendarWithVisibility, CreateUpdateEventRequest, CalendarTag, Event } from '../../types/calendar.types';
import { User } from '../../types/auth.types';

const CalendarView: React.FC = () => {

  const [myUser, setMyUser] = useState<User | null>(null);
  const dummyUser: User = {
      id: "u1",
      email: "test@test.com",
      username: "tester",
      first_name: "테스트",
      last_name: "유저",
      login_method: "email",
      is_active: true,
      is_staff: false,
      is_verified: true,
      date_joined: new Date().toISOString(),
  };

  // 캘린더 목록
  const [calendars, setCalendars] = useState<Calendar[]>([]);

    // 임시 태그 데이터를 CalendarView로 이동
    // const MOCK_TAGS: CalendarTag[] = [
    //   {
    //     id: '1',
    //     name: '회의',
    //     color: '#FF6B6B',
    //     order: 0,
    //     calendar: '1',
    //     created_at: '2024-01-01',
    //     updated_at: '2024-01-01'
    //   },
    //   {
    //     id: '2',
    //     name: '개인 일정',
    //     color: '#4ECDC4',
    //     order: 1,
    //     calendar: '1',
    //     created_at: '2024-01-01',
    //     updated_at: '2024-01-01'
    //   },
    //   {
    //     id: '3',
    //     name: '업무',
    //     color: '#45B7D1',
    //     order: 2,
    //     calendar: '1',
    //     created_at: '2024-01-01',
    //     updated_at: '2024-01-01'
    //   },
    //   {
    //     id: '4',
    //     name: '휴가',
    //     color: '#96CEB4',
    //     order: 0,
    //     calendar: '2',
    //     created_at: '2024-01-01',
    //     updated_at: '2024-01-01'
    //   },
    //   {
    //     id: '5',
    //     name: '약속',
    //     color: '#FECA57',
    //     order: 1,
    //     calendar: '2',
    //     created_at: '2024-01-01',
    //     updated_at: '2024-01-01'
    //   }
    // ];

    const [events, setEvents] = useState<Event[]>([
    {
        id: 'e1',
        calendar: '1',
        title: '회의',
        description: '',
        location: '',
        start_date: new Date(2025, 9, 15, 10, 0).toISOString(),
        end_date: new Date(2025, 9, 15, 11, 0).toISOString(),
        all_day: false,
        color: '#4A90E2',
        created_by: dummyUser,
        can_edit: true,
        can_delete: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'e2',
        calendar: '2',
        title: '프로젝트 마감',
        description: '',
        location: '',
        start_date: new Date(2025, 9, 20).toISOString(),
        end_date: new Date(2025, 9, 20).toISOString(),
        all_day: true,
        color: '#50C878',
        created_by: dummyUser,
        can_edit: true,
        can_delete: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }
  ]);
    
  // 캘린더 표시 상태 (로컬 상태)
  const [calendarVisibility, setCalendarVisibility] = useState<Record<string, boolean>>({
    '1': true,
    '2': true,
    '3': false
  });

  // 캘린더와 표시 상태를 합친 데이터
  const toggleCalendarsVisibility = useMemo((): CalendarWithVisibility[] => {
    return calendars.map(cal => ({
      ...cal,
      isVisible: calendarVisibility[cal.id] ?? true
    }));
  }, [calendars, calendarVisibility]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedRange, setSelectedRange] = useState<{start: Date, end: Date} | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [tempEvent, setTempEvent] = useState<Event | null>(null); // 임시 이벤트 상태 추가
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('');
  const [isLeftSideOpen, setIsLeftSideOpen] = useState(false);
  const [isRightSideOpen, setIsRightSideOpen] = useState(false);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  // 페이지 로드 시 캘린더 데이터 가져오기
  useEffect(() => {
    fetchCalendars();
  }, []);

  const getCalendarTags = (calendarId: string) => {
    const calendar = calendars.find(cal => cal.id === calendarId);
    
    // 실제 캘린더에 태그가 있으면 사용, 없으면 MOCK_TAGS 사용
    if (calendar?.tags && calendar.tags.length > 0) {
      return calendar.tags;
    }
  };

  const handleCreateNewEvent = (startDate: Date, endDate?: Date, preserveData?: {
    title?: string;
    tag?: any;
    // 이동할 데이터를 추가할 수 있다.
  }) => {
    const selectedCalendar = calendars.find(cal => cal.id === selectedCalendarId);
    const calendarTags = getCalendarTags(selectedCalendarId) || []; // 캘린더 태그 리스틑
    const firstTag = calendarTags[0]; // 첫 번째 태그 선택

    const temp: Event = {
      id: 'temp-' + Date.now(), // 임시 ID
      calendar: selectedCalendarId, // 현재 선택된 캘린더
      title: preserveData?.title || '',
      description: '',
      location: '',
      start_date: startDate.toISOString(),
      end_date: endDate ? endDate.toISOString() : startDate.toISOString(),
      all_day: true, // 기본값으로 종일 이벤트
      color: '', // 캘린더 색상 사용
      tag: preserveData?.tag || { // 기본 태그 설정
        id: firstTag.id,
        name: firstTag.name,
        color: firstTag.color,
        order: firstTag.order,
        calendar: firstTag.calendar,
        created_at: firstTag.created_at,
        updated_at: firstTag.updated_at
      },
      created_by: dummyUser,
      can_edit: true,
      can_delete: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTempEvent(temp);
  };

  // 임시 이벤트 업데이트 함수 추가
  const updateTempEvent = (updates: Partial<Event>) => {
    if (tempEvent) {
      setTempEvent({
        ...tempEvent,
        ...updates,
        updated_at: new Date().toISOString()
      });
    }
  };

  // 임시 이벤트 취소
  const handleCancelTempEvent = () => {
    setTempEvent(null);
  };

  // 날짜 클릭 핸들러 (선택만)
  const handleDateSelect = (date: Date) => {
    const isSameDate = selectedDate && 
      date.getFullYear() === selectedDate.getFullYear() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getDate() === selectedDate.getDate();

    console.log(date)
    console.log(isSameDate)
    if (isRightSideOpen) {
      // 오른쪽 패널이 이미 열려있으면 → 바로 임시 이벤트 생성
      console.log('오른쪽 패널 열린 상태에서 클릭');
      setSelectedDate(date);

      const currentTitle = tempEvent?.title || '';
      const currentTag = tempEvent?.tag || '';
      if (tempEvent) {
        setTempEvent(null);
      }
      setTimeout(() => {
        handleCreateNewEvent(date, undefined, {
          title: currentTitle,
          tag: currentTag,
        });
      }, 0);
    } else {
      // 첫 번째 클릭 → 선택만
      console.log('첫 번째 클릭 - 선택만');
      setSelectedDate(date);
      // 기존 임시 이벤트가 있으면 제거
      if (tempEvent) {
        setTempEvent(null);
      }
    }
  };

  // 날짜 클릭 시 범위 설정
  const handleDateClick = (date: Date) => {

    setSelectedDate(date);
  
    if (tempEvent) {
      setTempEvent(null);
    }
    
    setTimeout(() => {
      handleCreateNewEvent(date);
    }, 0);
    
    setIsRightSideOpen(true);
  
    // 범위 설정 로직 (필요하면 유지)
    if (selectedRange) {
      const rangeDays = Math.ceil((selectedRange.end.getTime() - selectedRange.start.getTime()) / (1000 * 60 * 60 * 24));
      const newEndDate = new Date(date);
      newEndDate.setDate(date.getDate() + rangeDays);
      
      setSelectedRange({
        start: date,
        end: newEndDate
      });
    } else {
      setSelectedRange({
        start: date,
        end: new Date(date)
      });
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await calendarAPI.getEvents();
      setEvents(response.data);
    } catch (error) {
      console.error('이벤트 불러오기 실패:', error);
      alert('일정을 불러오는데 실패했습니다.');
    }
  };

  // 캘린더 목록 불러오기
  const fetchCalendars = async () => {
    try {
      const response = await calendarAPI.getCalendars();
      const calendarsData = response.data;
      setCalendars(calendarsData);
      
      // 첫 번째 캘린더를 기본으로 선택
      if (calendarsData.length > 0 && !selectedCalendarId) {
        setSelectedCalendarId(calendarsData[0].id);
      }
    } catch (error) {
      console.error('캘린더 불러오기 실패:', error);
    }
  };

  // 활성화된 캘린더의 이벤트만 필터링
  const visibleEvents = useMemo(() => {
    const activeCalendarIds = calendars
      .filter(cal => cal.is_active)
      .map(cal => cal.id);
    
    return events.filter(event => activeCalendarIds.includes(event.calendar));
  }, [calendars, events]);

  // 캘린더 토글
  const toggleCalendar = (calendarId: string) => {
    setCalendars(prev => prev.map(cal => 
      cal.id === calendarId 
        ? { ...cal, isActive: !cal.is_active }
        : cal
    ));
  };

  // 캘린더 추가
  const addCalendar = (newCalendar: Omit<Calendar, 'id' | 'createdAt' | 'updatedAt'>) => {
    const calendar: Calendar = {
      ...newCalendar,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setCalendars(prev => [...prev, calendar]);
  };

  // 캘린더 수정
  const updateCalendar = (calendarId: string, updates: Partial<Calendar>) => {
    setCalendars(prev => prev.map(cal =>
      cal.id === calendarId
        ? { ...cal, ...updates, updatedAt: new Date() }
        : cal
    ));
  };

  // 캘린더 삭제
  const deleteCalendar = (calendarId: string) => {
    // 기본 캘린더는 삭제 불가
    const calendar = calendars.find(cal => cal.id === calendarId);

    setCalendars(prev => prev.filter(cal => cal.id !== calendarId));
    // 해당 캘린더의 이벤트도 삭제
    setEvents(prev => prev.filter(event => event.calendar !== calendarId));
  };

  const handleSaveEvent = async (eventData: CreateUpdateEventRequest & { id?: string }) => {
    try {
      if (eventData.id) {
        // 기존 이벤트 수정 (ID가 있으면)
        await calendarAPI.updateEvent(eventData.id, eventData);
        toast.success('일정이 수정되었습니다.');
      } else {
        // 새 이벤트 생성 (ID가 없으면)
        await calendarAPI.createEvent(eventData);
        toast.success('일정이 생성되었습니다.');
      }
      
      // 임시 이벤트 제거
      setTempEvent(null);

      // 이벤트 목록 새로고침
      await fetchEvents();
      
    } catch (error) {
      console.error('이벤트 저장 실패:', error);
      toast.error(eventData.id ? '일정 수정에 실패했습니다.' : '일정 생성에 실패했습니다.');
    }
  };

  // 이벤트 삭제
  const deleteEvent = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event?.can_delete) {
      alert('이 일정은 삭제할 수 없습니다.');
      return;
    }
    setEvents(prev => prev.filter(e => e.id !== eventId));
    // 삭제 후 선택된 이벤트 초기화
    if (selectedEvent?.id === eventId) {
      setSelectedEvent(null);
    }
  };

  // 이벤트 색상 가져오기 (이벤트 커스텀 색상 또는 캘린더 색상)
  const getEventColor = (event: Event): string => {
    if (event.color) return event.color;
    const calendar = calendars.find(cal => cal.id === event.calendar);
    return calendar?.color || '#4A90E2';
  };

  return (
    <div className={styles.calendarLayout}>

      <CalendarHeader
        currentDate={currentDate}
        view={view}
        isLeftSideOpen={isLeftSideOpen}
        isRightSideOpen={isRightSideOpen}
        onToggleLeftSide={() => setIsLeftSideOpen(!isLeftSideOpen)}
        onToggleRightSide={() => {
          setIsRightSideOpen(true);
          setSelectedEvent(null);
          setIsEventModalOpen(true);
        }}
        onDateChange={setCurrentDate}
        onViewChange={setView}
        onToday={() => setCurrentDate(new Date())}
      />
      <div className={styles.calendarContainer}>

        <div className={`${styles.leftSideContainer} ${isLeftSideOpen ? styles.open : ''}`}>
          <CalendarLeftSide
            calendars={calendars}
            onToggleCalendar={toggleCalendar}
            onAddCalendar={addCalendar}
            onUpdateCalendar={updateCalendar}
            onDeleteCalendar={deleteCalendar}
            selectedCalendarId={selectedCalendarId}
            onSelectCalendar={setSelectedCalendarId}
            onAddEvent={() => setIsEventModalOpen(true)}
            isOpen={isLeftSideOpen}
          />
        </div>

        <div className={styles.calendarMain}>
          <CalendarGrid
            currentDate={currentDate}
            selectedDate={selectedDate}
            selectedRange={selectedRange}
            events={visibleEvents}
            tempEvent={tempEvent}
            calendars={calendars}
            onDateSelect={handleDateSelect} // 날짜 클릭
            onDateClick={handleDateClick} // 날짜 선택(더블클릭 혹은 선택된 날짜를 한번더 클릭)
            onMonthChange={setCurrentDate}
            getEventColor={getEventColor}
            onEventClick={(event) => {
              console.log("이벤트 클릭:", event);
              // 상세보기 모달 열기 같은 동작
            }}
            onEventDelete={(eventId) => {
              console.log("이벤트 삭제:", eventId);
              setEvents((prev) => prev.filter(e => e.id !== eventId));
            }}
          />
        </div>

        <div className={`${styles.rightSideContainer} ${isRightSideOpen ? styles.open : ''}`}>
          <CalendarRightSide
            isOpen={isRightSideOpen}
            selectedDate={selectedDate}
            selectedRange={selectedRange}
            selectedEvent={selectedEvent}
            calendars={calendars}
            events={visibleEvents}
            tempEvent={tempEvent}
            onUpdateTempEvent={updateTempEvent}
            onDeleteEvent={deleteEvent}
            onSaveEvent={handleSaveEvent}
            onClose={() => {
              setIsRightSideOpen(false);
              setSelectedEvent(null);
              setTempEvent(null); // 임시 이벤트도 제거
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
*/

// src/pages/Calendar/CalendarView.tsx
import React, { useState } from 'react';
import styles from './CalendarView.module.css';
import { toast } from 'react-toastify';
import CalendarHeader from '../../components/Calendar/CalendarHeader';
import CalendarLeftSide from '../../components/Calendar/CalendarLeftSide';
import CalendarGrid from '../../components/Calendar/CalendarGrid';
import CalendarRightSide from '../../components/Calendar/CalendarRightSide';
import { CalendarProvider, useCalendarContext } from '../../contexts/CalendarContext';
import { CreateUpdateEventRequest, Event } from '../../types/calendar.types';
import { User } from '../../types/auth.types';
import { calendarAPI } from '../../services/calendarApi';

// Context를 사용하는 내부 컴포넌트
const CalendarViewContent: React.FC = () => {
  // Context에서 필요한 상태와 함수들을 가져옴
  const {
    calendars,
    selectedCalendarId,
    setSelectedCalendarId,
    toggleCalendarVisibility,
    addCalendar,
    updateCalendar,
    deleteCalendar,
    visibleEvents,
    getEventColor,
    getCalendarTags,
    deleteEvent,
    fetchEvents,
  } = useCalendarContext();

  // 더미 사용자 (임시)
  const dummyUser: User = {
    id: "u1",
    email: "test@test.com",
    username: "tester",
    first_name: "테스트",
    last_name: "유저",
    login_method: "email",
    is_active: true,
    is_staff: false,
    is_verified: true,
    date_joined: new Date().toISOString(),
  };

  // UI 관련 로컬 상태만 남김
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedRange, setSelectedRange] = useState<{start: Date, end: Date} | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [tempEvent, setTempEvent] = useState<Event | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isLeftSideOpen, setIsLeftSideOpen] = useState(false);
  const [isRightSideOpen, setIsRightSideOpen] = useState(false);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  // 새 이벤트 생성 핸들러
  const handleCreateNewEvent = (startDate: Date, endDate?: Date, preserveData?: {
    title?: string;
    tag?: any;
  }) => {
    const calendarTags = getCalendarTags(selectedCalendarId) || [];
    const firstTag = calendarTags[0];

    const temp: Event = {
      id: 'temp-' + Date.now(),
      calendar: selectedCalendarId,
      title: preserveData?.title || '',
      description: '',
      location: '',
      start_date: startDate.toISOString(),
      end_date: endDate ? endDate.toISOString() : startDate.toISOString(),
      all_day: true,
      color: '',
      tag: preserveData?.tag || (firstTag ? {
        id: firstTag.id,
        name: firstTag.name,
        color: firstTag.color,
        order: firstTag.order,
        calendar: firstTag.calendar,
        created_at: firstTag.created_at,
        updated_at: firstTag.updated_at
      } : undefined),
      created_by: dummyUser,
      can_edit: true,
      can_delete: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTempEvent(temp);
  };

  // 임시 이벤트 업데이트
  const updateTempEvent = (updates: Partial<Event>) => {
    if (tempEvent) {
      setTempEvent({
        ...tempEvent,
        ...updates,
        updated_at: new Date().toISOString()
      });
    }
  };

  // 날짜 선택 핸들러
  const handleDateSelect = (date: Date) => {
    if (isRightSideOpen) {
      setSelectedDate(date);
      const currentTitle = tempEvent?.title || '';
      const currentTag = tempEvent?.tag || '';
      if (tempEvent) {
        setTempEvent(null);
      }
      setTimeout(() => {
        handleCreateNewEvent(date, undefined, {
          title: currentTitle,
          tag: currentTag,
        });
      }, 0);
    } else {
      setSelectedDate(date);
      if (tempEvent) {
        setTempEvent(null);
      }
    }
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  
    if (tempEvent) {
      setTempEvent(null);
    }
    
    setTimeout(() => {
      handleCreateNewEvent(date);
    }, 0);
    
    setIsRightSideOpen(true);
  
    // 범위 설정 로직
    if (selectedRange) {
      const rangeDays = Math.ceil((selectedRange.end.getTime() - selectedRange.start.getTime()) / (1000 * 60 * 60 * 24));
      const newEndDate = new Date(date);
      newEndDate.setDate(date.getDate() + rangeDays);
      
      setSelectedRange({
        start: date,
        end: newEndDate
      });
    } else {
      setSelectedRange({
        start: date,
        end: new Date(date)
      });
    }
  };

  // 이벤트 저장 핸들러
  const handleSaveEvent = async (eventData: CreateUpdateEventRequest & { id?: string }) => {
    try {
      if (eventData.id) {
        await calendarAPI.updateEvent(eventData.id, eventData);
        toast.success('일정이 수정되었습니다.');
      } else {
        await calendarAPI.createEvent(eventData);
        toast.success('일정이 생성되었습니다.');
      }
      
      setTempEvent(null);
      // Context의 fetchEvents를 사용하여 이벤트 목록 새로고침
      await fetchEvents();
      
    } catch (error) {
      console.error('이벤트 저장 실패:', error);
      toast.error(eventData.id ? '일정 수정에 실패했습니다.' : '일정 생성에 실패했습니다.');
    }
  };

  return (
    <div className={styles.calendarLayout}>
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        isLeftSideOpen={isLeftSideOpen}
        isRightSideOpen={isRightSideOpen}
        onToggleLeftSide={() => setIsLeftSideOpen(!isLeftSideOpen)}
        onToggleRightSide={() => {
          setIsRightSideOpen(true);
          setSelectedEvent(null);
          setIsEventModalOpen(true);
        }}
        onDateChange={setCurrentDate}
        onViewChange={setView}
        onToday={() => setCurrentDate(new Date())}
      />
      
      <div className={styles.calendarContainer}>
        <div className={`${styles.leftSideContainer} ${isLeftSideOpen ? styles.open : ''}`}>
          <CalendarLeftSide
            calendars={calendars}
            onToggleCalendar={toggleCalendarVisibility} // Context 함수 사용
            onAddCalendar={addCalendar}
            onUpdateCalendar={updateCalendar}
            onDeleteCalendar={deleteCalendar}
            selectedCalendarId={selectedCalendarId}
            onSelectCalendar={setSelectedCalendarId}
            onAddEvent={() => setIsEventModalOpen(true)}
            isOpen={isLeftSideOpen}
          />
        </div>

        <div className={styles.calendarMain}>
          <CalendarGrid
            currentDate={currentDate}
            selectedDate={selectedDate}
            selectedRange={selectedRange}
            events={visibleEvents} // Context에서 필터된 이벤트 사용
            tempEvent={tempEvent}
            calendars={calendars}
            onDateSelect={handleDateSelect}
            onDateClick={handleDateClick}
            onMonthChange={setCurrentDate}
            getEventColor={getEventColor} // Context 함수 사용
            onEventClick={(event) => {
              console.log("이벤트 클릭:", event);
            }}
            onEventDelete={deleteEvent} // Context 함수 사용
          />
        </div>

        <div className={`${styles.rightSideContainer} ${isRightSideOpen ? styles.open : ''}`}>
          <CalendarRightSide
            isOpen={isRightSideOpen}
            selectedDate={selectedDate}
            selectedRange={selectedRange}
            selectedEvent={selectedEvent}
            calendars={calendars}
            events={visibleEvents}
            tempEvent={tempEvent}
            onUpdateTempEvent={updateTempEvent}
            onDeleteEvent={deleteEvent}
            onSaveEvent={handleSaveEvent}
            onClose={() => {
              setIsRightSideOpen(false);
              setSelectedEvent(null);
              setTempEvent(null);
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Provider로 감싸는 메인 컴포넌트
const CalendarView: React.FC = () => {
  return (
    <CalendarProvider>
      <CalendarViewContent />
    </CalendarProvider>
  );
};

export default CalendarView;
