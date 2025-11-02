/**
 * CalendarView 컴포넌트
 * 
 * 이 컴포넌트는 캘린더 애플리케이션의 메인 뷰를 담당합니다.
 * 다음과 같은 기능을 제공합니다:
 * 
 * 1. 캘린더 헤더 (월/주/일 뷰 전환, 날짜 네비게이션)
 * 2. 왼쪽 사이드바 (캘린더 목록, 태그 관리)
 * 3. 메인 캘린더 그리드 (월별/주별 뷰)
 * 4. 오른쪽 사이드바 (이벤트 상세보기/편집)
 * 
 * 주요 상태 관리:
 * - view: 현재 뷰 모드 ('month' | 'week' | 'day')
 * - currentDate: 현재 표시 중인 날짜
 * - selectedEvent: 선택된 이벤트 (상세보기/편집용)
 * - tempEvent: 임시 이벤트 (생성 중인 이벤트)
 * - isRightSideOpen: 오른쪽 사이드바 열림/닫힘 상태
 * 
 * 이벤트 관리:
 * - 이벤트 생성, 수정, 삭제
 * - 시간 슬롯 클릭 시 이벤트 생성
 * - 날짜 클릭 시 이벤트 생성
 * - 이벤트 클릭 시 상세보기/편집
 */

// src/pages/Calendar/CalendarView.tsx
import React, { useState } from 'react';
import styles from './CalendarView.module.css';
import { toast } from 'react-toastify';
import CalendarHeader from '../../components/Calendar/CalendarHeader';
import CalendarLeftSide from '../../components/Calendar/CalendarLeftSide';
import CalendarGrid from '../../components/Calendar/CalendarGrid';
import CalendarGridW from '../../components/Calendar/CalendarGridW';
import CalendarRightSide from '../../components/Calendar/CalendarRightSide';
import { CalendarProvider, useCalendarContext } from '../../contexts/CalendarContext';
import { CreateUpdateEventRequest, Event } from '../../types/calendar.types';
import { User } from '../../types/auth.types';
import { calendarAPI } from '../../services/calendarApi';
import { format, formatDate, isSameDay } from 'date-fns';

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
    addEvent,
    updateEvent,

    tempEvent,
    setTempEvent,
    updateTempEvent,
    setSelectedDate: setContextSelectedDate,
    setSelectedDateEvents,
    showDateEvents,
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

  // UI 관련 로컬 상태 - 현재 날짜로 초기화
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedRange, setSelectedRange] = useState<{start: Date, end: Date} | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  //const [tempEvent, setTempEvent] = useState<Event | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isLeftSideOpen, setIsLeftSideOpen] = useState(false);
  const [isRightSideOpen, setIsRightSideOpen] = useState(false);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  const [hasDateError, setHasDateError] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleDateErrorChange = (hasError: boolean) => {
    setHasDateError(hasError);
  };

  // 뷰 변경 핸들러 - rightSide 닫고 내용 초기화
  const handleViewChange = (newView: 'month' | 'week' | 'day') => {
    setView(newView);
    // rightSide 닫고 모든 상태 초기화
    setIsRightSideOpen(false);
    setSelectedEvent(null);
    setTempEvent(null);
    setSelectedDate(null);
    setSelectedRange(null);
    // context 상태도 초기화
    setContextSelectedDate(null);
    setSelectedDateEvents([]);
  };

  // 달력 날짜 변경 핸들러
  const handleCalendarDateChange = (date: Date) => {
    setCurrentDate(date);
    console.log('달력 날짜가 시작일에 맞춰 변경됨:', date);
  };


  // 시간 슬롯 클릭 핸들러
  /**
   * 시간 슬롯 클릭 핸들러
   * 
   * 주별 캘린더에서 시간 슬롯을 클릭했을 때 호출됩니다.
   * 지정된 시간으로 새 이벤트 생성을 시작합니다.
   * 
   * 동작:
   * 1. 선택된 이벤트 초기화 (새 이벤트 생성 모드)
   * 2. 지정된 시간으로 새 이벤트 생성
   * 3. 오른쪽 사이드바 열기
   * 
   * @param date - 클릭된 날짜
   * @param hour - 클릭된 시간 (소수점 포함, 예: 9.5 = 9:30)
   */
  const handleTimeSlotClick = (date: Date, hour: number) => {
    console.log('=======시간 슬롯 클릭', date, hour);
    // 리스트 모드 해제
    setContextSelectedDate(null);
    setSelectedDateEvents([]);
    setSelectedDate(date);
    setSelectedEvent(null); // 새 이벤트 생성이므로 기존 선택 이벤트 초기화
    
    if (tempEvent) {
      setTempEvent(null);
    }
    
    setTimeout(() => {
      handleCreateNewEventWithTime(date, hour);
    }, 0);
    
    console.log('[RightSide Open] from handleTimeSlotClick', { date: date.toISOString(), hour });
    setIsRightSideOpen(true);
  };

  // 시간이 지정된 새 이벤트 생성 핸들러
  const handleCreateNewEventWithTime = (date: Date, hour: number) => {
    const formatLocalDateTime = (date: Date, isAllDay: boolean, isEnd: boolean, specificHour?: number) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      if (isAllDay) {
        return isEnd ? `${year}-${month}-${day}T23:59:59+09:00` : `${year}-${month}-${day}T00:00:00+09:00`;
      } else {
        // 30분 단위 처리: 9.5 -> 09:30, 9.0 -> 09:00
        const hours = Math.floor(specificHour ?? (isEnd ? 23 : 0));
        const minutes = (specificHour ?? 0) % 1 === 0.5 ? 30 : 0;
        const hourStr = String(hours).padStart(2, '0');
        const minuteStr = String(minutes).padStart(2, '0');
        return `${year}-${month}-${day}T${hourStr}:${minuteStr}:00+09:00`;
      }
    };

    const firstTag = getCalendarTags(selectedCalendarId)[0];
    const dummyUser = { 
      id: 'temp', 
      username: 'temp', 
      email: 'temp@temp.com',
      first_name: '',
      last_name: '',
      login_method: 'email' as const,
      is_active: true,
      is_staff: false,
      is_verified: true,
      date_joined: new Date().toISOString()
    };

    const temp: Event = {
      id: 'temp-' + Date.now(),
      calendar: selectedCalendarId,
      title: '',
      description: '',
      location: '',
      start_date: formatLocalDateTime(date, false, false, hour),
      end_date: formatLocalDateTime(date, false, true, hour + 1), // 1시간 기본 길이
      all_day: false, // 종일 체크 해제
      color: '',
      tag: firstTag ? {
        id: firstTag.id,
        name: firstTag.name,
        color: firstTag.color,
        order: firstTag.order,
        calendar: firstTag.calendar,
        created_at: firstTag.created_at,
        updated_at: firstTag.updated_at
      } : undefined,
      created_by: dummyUser,
      can_edit: true,
      can_delete: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTempEvent(temp);
  };

  // 새 이벤트 생성 핸들러
  const handleCreateNewEvent = (startDate: Date, endDate?: Date, preserveData?: {
    title?: string;
    tag?: any;
    all_day?: boolean;
  }) => {
    const calendarTags = getCalendarTags(selectedCalendarId) || [];
    const firstTag = calendarTags[0];

    // const formatLocalDate = (date: Date) => {
    //   const year = date.getFullYear();
    //   const month = String(date.getMonth() + 1).padStart(2, '0');
    //   const day = String(date.getDate()).padStart(2, '0');
    //   return `${year}-${month}-${day}T00:00:00+09:00`;
    // };

    const formatLocalDateTime = (date: Date, isAllDay: boolean = true, isEndOfDay: boolean = false) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      if (isAllDay) {
        return isEndOfDay 
          ? `${year}-${month}-${day}T23:59:59+09:00`
          : `${year}-${month}-${day}T00:00:00+09:00`;
      } else {
        // 시간 지정 이벤트의 경우 기본값
        const hour = isEndOfDay ? '18' : '09';
        return `${year}-${month}-${day}T${hour}:00:00+09:00`;
      }
    };

    // 종료 날짜가 없으면 시작 날짜와 같은 날로 설정
    const actualEndDate = endDate || startDate;
    const isAllDay = preserveData?.all_day !== undefined ? preserveData.all_day : true;

    const temp: Event = {
      id: 'temp-' + Date.now(),
      calendar: selectedCalendarId,
      title: preserveData?.title || '',
      description: '',
      location: '',
      start_date: formatLocalDateTime(startDate, isAllDay, false),
      end_date: formatLocalDateTime(actualEndDate, isAllDay, true),
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

  // 날짜 포맷 헬퍼
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // +n 버튼 클릭 시 해당 날짜 이벤트 목록을 사이드바에 표시
  const handleShowDateEvents = (date: Date) => {
    // 새/기존 편집 상태 해제하고, 생성모드 진입을 막기 위해 local selectedDate는 비움
    setSelectedEvent(null);
    setTempEvent(null);
    setSelectedDate(null);
    console.log('[RightSide Open] from +n (handleShowDateEvents)', { date: date.toISOString() });
    setIsRightSideOpen(true);
  };

  /**
   * 이벤트 클릭 핸들러
   * 
   * 캘린더에서 이벤트를 클릭했을 때 호출됩니다.
   * 해당 이벤트의 상세보기를 표시합니다.
   * 
   * 동작:
   * 1. 선택된 이벤트 설정
   * 2. 오른쪽 사이드바 열기
   * 3. 상세보기 모드로 전환
   * 
   * @param event - 클릭된 이벤트 객체
   */
  const handleEventClick = (event: Event) => {
    // 리스트 모드 해제
    setContextSelectedDate(null);
    setSelectedDateEvents([]);
    setSelectedEvent(event);
    setTempEvent(null);
    console.log('[RightSide Open] from handleEventClick', { eventId: event.id, title: event.title });
    setIsRightSideOpen(true);
  };

  const handleDateSelect = (date: Date) => {
    console.log('=======캘린더 날짜 첫번째 클릭');
    
    if (isRightSideOpen && tempEvent) {
      // 정상 상태: 범위 유지 로직
      if(!hasDateError) {
        const currentStart = new Date(tempEvent.start_date);
        const currentEnd = new Date(tempEvent.end_date);
        const startDateOnly = new Date(currentStart.getFullYear(), currentStart.getMonth(), currentStart.getDate());
        const endDateOnly = new Date(currentEnd.getFullYear(), currentEnd.getMonth(), currentEnd.getDate());
    
        const rangeDays = Math.round((endDateOnly.getTime() - startDateOnly.getTime()) / (1000 * 60 * 60 * 24));
    
        const newEndDate = new Date(date);
        newEndDate.setDate(newEndDate.getDate() + rangeDays);
        setSelectedDate(date);
    
        const preservedData = {
          title: tempEvent?.title || '',
          tag: tempEvent?.tag || '',
          all_day: tempEvent.all_day,
          description: tempEvent?.description || '',
          location: tempEvent?.location || ''
        };
    
        setTempEvent(null);
    
        setTimeout(() => {
          handleCreateNewEvent(date, newEndDate, preservedData);
        }, 0);
      } else {
        setSelectedDate(date);
      
        if (tempEvent) {
          setTempEvent(null);
        }
        
        setTimeout(() => {
          handleCreateNewEvent(date, date, { // 시작일과 종료일을 같게
            title: tempEvent?.title || '',
            tag: tempEvent?.tag || '',
            all_day: tempEvent?.all_day || true,
          });
        }, 0);

        // 항상 사이드바 열기
        setIsRightSideOpen(true);
        
        // 범위 설정도 단일 날짜로
        setSelectedRange({
          start: date,
          end: new Date(date)
        });
      }
    } else {
      setSelectedDate(date);
      if (tempEvent) {
        setTempEvent(null);
      }
    }
  };


  // 날짜 더블 클릭 핸들러
  /**
   * 날짜 클릭 핸들러
   * 
   * 월별 캘린더에서 날짜를 클릭했을 때 호출됩니다.
   * 해당 날짜로 새 이벤트 생성을 시작합니다.
   * 
   * 동작:
   * 1. 선택된 이벤트 초기화 (새 이벤트 생성 모드)
   * 2. 클릭된 날짜로 새 이벤트 생성
   * 3. 오른쪽 사이드바 열기
   * 
   * @param date - 클릭된 날짜
   */
  const handleDateClick = (date: Date) => {
    if (tempEvent) {
      const currentStart = new Date(tempEvent.start_date);
      const currentEnd = new Date(tempEvent.end_date);
      const isMultiDay = !isSameDay(currentStart, currentEnd);
      
      if (isMultiDay && isRightSideOpen) {
        console.log('여러 날짜 범위 수정 중 - 클릭 무시');
        return; // 함수 종료
      }
    }

    // 리스트 모드 해제
    setContextSelectedDate(null);
    setSelectedDateEvents([]);
    setSelectedDate(date);
    setSelectedEvent(null); // 새 이벤트 생성이므로 기존 선택 이벤트 초기화
    console.log('=======캘린더 날짜 두번째 클릭')
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
    //setIsLoading(true);

    console.log('CalendarView ======> handleSaveEvent 실행')
   
    try {
      console.log('저장할 이벤트 데이터:', eventData);
      
      if (eventData.id && eventData.id.startsWith('temp-')) {
        // 새 이벤트 생성
        console.log('새 이벤트 생성 중...');
        
        const response = await calendarAPI.createEvent(eventData as any);
        const savedEvent = (response as any)?.data || response;
        if (savedEvent) {
          // 화면 깜빡임 없이 즉시 추가
          addEvent(savedEvent);
        }
        toast.success('일정이 생성되었습니다.');
        // temp 이벤트는 실제 이벤트가 추가된 후 제거 (겹침 방지)
        setTempEvent(null);
        
      } else if (eventData.id) {
        // 기존 이벤트 수정
        console.log('이벤트 수정 중...');
        
        // 낙관적 업데이트: API 호출 전에 먼저 UI 업데이트
        updateEvent(eventData.id, eventData);
        
        try {
          // 서버에 실제 업데이트 요청
          const response = await calendarAPI.updateEvent(eventData.id, eventData as any);
          const updatedEvent = (response as any)?.data || response;
          
          if (updatedEvent) {
            // 서버 응답으로 최종 업데이트 (서버에서 추가된 정보가 있을 수 있음)
            updateEvent(eventData.id, updatedEvent);
          }
          
          toast.success('일정이 수정되었습니다.');
          console.log('이벤트 수정 완료');
        } catch (error) {
          // API 실패 시 원래 상태로 롤백
          console.error('이벤트 수정 실패:', error);
          // 원래 이벤트 데이터로 롤백하려면 여기서 fetchEvents() 호출
          fetchEvents();
          throw error; // 에러를 다시 던져서 catch 블록에서 처리
        }
      }
      
      // 저장 성공 후 UI 정리
      setIsRightSideOpen(false);
      setSelectedEvent(null);
      
      // 백그라운드 동기화는 필요한 경우에만 (새 이벤트 생성 시에는 이미 추가했으므로 불필요)
      // fetchEvents();
      
    } catch (error) {
      console.error('이벤트 저장 오류:', error);
      toast.error(eventData.id ? '일정 수정에 실패했습니다.' : '일정 생성에 실패했습니다.');
    } finally {
      //setIsLoading(false);
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
          console.log('[RightSide Open] from header add button');
          setIsRightSideOpen(true);
          setSelectedEvent(null);
          setIsEventModalOpen(true);
        }}
        onDateChange={setCurrentDate}
        onViewChange={handleViewChange}
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
          {view === 'month' ? (
            <CalendarGrid
              currentDate={currentDate}
              selectedDate={selectedDate}
              selectedRange={selectedRange}
              events={visibleEvents} // Context에서 필터된 이벤트 사용
              //tempEvent={tempEvent}
              calendars={calendars}
              onDateSelect={handleDateSelect}
              onDateClick={handleDateClick}
              onMonthChange={setCurrentDate}
              //getEventColor={getEventColor} // Context 함수 사용
              onEventClick={(event) => {
                if (tempEvent) {
                  setTempEvent(null);
                }
                handleEventClick(event);
              }}
              onEventDelete={deleteEvent} // Context 함수 사용
              onShowDateEvents={handleShowDateEvents}
            />
          ) : view === 'week' ? (
            <CalendarGridW
              currentDate={currentDate}
              selectedDate={selectedDate}
              events={visibleEvents}
              calendars={calendars}
              onDateSelect={handleDateSelect}
              onDateClick={handleDateClick}
              onTimeSlotClick={handleTimeSlotClick}
              onEventClick={(event) => {
                handleEventClick(event);
              }}
              onEventDelete={deleteEvent}
              onShowDateEvents={handleShowDateEvents}
            />
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              일별 뷰는 아직 구현되지 않았습니다.
            </div>
          )}
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
            onEventClick={handleEventClick}
            onSaveEvent={handleSaveEvent}
            isLoading={isLoading}
            onDateErrorChange={handleDateErrorChange}
            onCalendarDateChange={handleCalendarDateChange}
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
