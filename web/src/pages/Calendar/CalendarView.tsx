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

    tempEvent,
    setTempEvent,
    updateTempEvent,
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
  /*
  // 날짜 클릭 핸들러
  const handleDateSelect = (date: Date) => {
    if (isRightSideOpen && tempEvent && !hasDateError) {
      const currentStart = new Date(tempEvent.start_date);
      const currentEnd = new Date(tempEvent.end_date);
      const startDateOnly = new Date(currentStart.getFullYear(), currentStart.getMonth(), currentStart.getDate());
      const endDateOnly = new Date(currentEnd.getFullYear(), currentEnd.getMonth(), currentEnd.getDate());

      // 실제 날짜 차이 계산 (시간 무시)
      const rangeDays = Math.round((endDateOnly.getTime() - startDateOnly.getTime()) / (1000 * 60 * 60 * 24));

      const newEndDate = new Date(date);
      newEndDate.setDate(newEndDate.getDate() + rangeDays);
      setSelectedDate(date);

      const currentTitle = tempEvent?.title || '';
      const currentTag = tempEvent?.tag || '';
      const allDay = tempEvent.all_day;

      const preservedData = {
        title: currentTitle,
        tag: currentTag,
        all_day: allDay,
      };

      if (tempEvent) {
        setTempEvent(null);
      }

      setTimeout(() => {
        handleCreateNewEvent(date, newEndDate, preservedData);
      }, 0);

    } else {
      setSelectedDate(date);
      if (tempEvent) {
        setTempEvent(null);
      }
    }
  };
  */

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

    setSelectedDate(date);
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
    /*
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

    */
    try {
      console.log('저장할 이벤트 데이터:', eventData);
      
      if (eventData.id && eventData.id.startsWith('temp-')) {
        // 새 이벤트 생성
        console.log('새 이벤트 생성 중...');
        
        // API 호출 (실제 백엔드가 있다면)
        // const response = await fetch('/api/events', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(eventData)
        // });
        
        await calendarAPI.createEvent(eventData);
        toast.success('일정이 생성되었습니다.');
        // 임시로 로컬에서 처리 (실제 API 대신)
        /*
        const newEvent: Event = {
          id: 'event-' + Date.now(), // 실제로는 서버에서 생성된 ID
          title: eventData.title,
          start_date: eventData.start_date,
          end_date: eventData.end_date,
          all_day: eventData.all_day,
          calendar: eventData.calendar,
          tag: eventData.tag_id ? {
            id: eventData.tag_id,
            name: 'Selected Tag', // 실제로는 태그 정보를 가져와야 함
            color: '#FF6B6B',
            order: 0,
            calendar: eventData.calendar,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } : undefined,
          description: eventData.description || '',
          location: eventData.location || '',
          color: '#FF6B6B', // 실제로는 태그나 캘린더 색상
          created_by: {
            id: 'user-1',
            name: 'Current User',
            email: 'user@example.com'
          },
          can_edit: true,
          can_delete: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        */
        // events 배열에 추가
        //setEvents(prev => [...prev, newEvent]);
        
        // tempEvent 제거
        setTempEvent(null);
        
      } else if (eventData.id) {
        // 기존 이벤트 수정
        console.log('이벤트 수정 중...');
        
        // API 호출 (실제 백엔드가 있다면)
        // const response = await fetch(`/api/events/${eventData.id}`, {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(eventData)
        // });
        
        // 임시로 로컬에서 처리
        setEvents(prev => 
          prev.map(event => 
            event.id === eventData.id 
              ? { ...event, ...eventData, updated_at: new Date().toISOString() }
              : event
          )
        );
        
        console.log('이벤트 수정 완료');
      }
      
      // 저장 성공 후 UI 정리
      setIsRightSideOpen(false);
      setSelectedEvent(null);
      
      // 성공 메시지 (선택사항)
      alert('이벤트가 성공적으로 저장되었습니다!');
      console.log('이벤트 저장완료후 저장된 이벤트를 불러옵니다....');
      await fetchEvents();
      
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
            //tempEvent={tempEvent}
            calendars={calendars}
            onDateSelect={handleDateSelect}
            onDateClick={handleDateClick}
            onMonthChange={setCurrentDate}
            //getEventColor={getEventColor} // Context 함수 사용
            onEventClick={(event) => {
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
            isLoading={isLoading}
            onDateErrorChange={handleDateErrorChange}
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
