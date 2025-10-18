// src/pages/Calendar/CalendarDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Event } from '../../types/calendar.types';
import { calendarAPI } from '../../services/calendarApi';
import Loading from '../../components/Common/Loading';
import CalendarGrid from '../../components/Calendar/CalendarGrid';
import CalendarGridW from '../../components/Calendar/CalendarGridW';
//import './CalendarDetail.css';

const CalendarDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (id) {
      fetchCalendarData();
    }
  }, [id]);

  const fetchCalendarData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const [calendarRes, eventsRes] = await Promise.all([
        calendarAPI.getCalendar(id),
        calendarAPI.getCalendarEvents(id)
      ]);
      
      setCalendar(calendarRes.data);
      setEvents(eventsRes.data);
    } catch (error) {
      console.error('Failed to fetch calendar:', error);
      navigate('/calendars');
    } finally {
      setLoading(false);
    }
  };

  const handleEventCreate = () => {
    // 이벤트 생성 모달 열기
    console.log('Create event');
  };

  const handleDateSelect = (date: Date) => {
    console.log('Date selected:', date);
  };

  const handleDateClick = (date: Date) => {
    console.log('Date clicked:', date);
  };

  const handleEventClick = (event: Event) => {
    console.log('Event clicked:', event);
  };

  const handleEventDelete = (eventId: string) => {
    console.log('Delete event:', eventId);
    setEvents(prev => prev.filter(e => e.id !== eventId));
  };

  const handleCalendarSettings = () => {
    // 캘린더 설정 모달 열기
    console.log('Calendar settings');
  };

  const handleInviteMembers = () => {
    // 멤버 초대 모달 열기
    console.log('Invite members');
  };

  if (loading) {
    return <Loading message="캘린더를 불러오는 중..." />;
  }

  if (!calendar) {
    return <div>캘린더를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="calendar-detail-container">
      <div className="calendar-detail-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate('/calendars')}>
            ← 목록으로
          </button>
          <h1>
            <span 
              className="calendar-color-dot"
              style={{ backgroundColor: calendar.color }}
            />
            {calendar.name}
          </h1>
        </div>
        
        <div className="header-actions">
          {calendar.calendar_type === 'shared' && calendar.is_admin && (
            <button className="btn-invite" onClick={handleInviteMembers}>
              멤버 초대
            </button>
          )}
          <button className="btn-event" onClick={handleEventCreate}>
            + 일정 추가
          </button>
          {calendar.is_admin && (
            <button className="btn-settings" onClick={handleCalendarSettings}>
              설정
            </button>
          )}
        </div>
      </div>

      <div className="calendar-info">
        {calendar.description && (
          <p className="calendar-description">{calendar.description}</p>
        )}
        <div className="calendar-meta">
          <span className="meta-item">
            {calendar.calendar_type === 'personal' ? '개인 캘린더' : '공유 캘린더'}
          </span>
          <span className="meta-item">멤버 {calendar.member_count}명</span>
          <span className="meta-item">일정 {calendar.event_count}개</span>
        </div>
      </div>

      <div className="calendar-view-controls">
        <div className="view-tabs">
          <button 
            className={`tab ${view === 'month' ? 'active' : ''}`}
            onClick={() => setView('month')}
          >
            월
          </button>
          <button 
            className={`tab ${view === 'week' ? 'active' : ''}`}
            onClick={() => setView('week')}
          >
            주
          </button>
          <button 
            className={`tab ${view === 'day' ? 'active' : ''}`}
            onClick={() => setView('day')}
          >
            일
          </button>
        </div>
        
        <div className="date-navigation">
          <button onClick={() => setCurrentDate(new Date())}>오늘</button>
          <span className="current-date">
            {currentDate.toLocaleDateString('ko-KR', { 
              year: 'numeric', 
              month: 'long' 
            })}
          </span>
        </div>
      </div>

      <div className="calendar-content">
        {/* 실제 캘린더 뷰 컴포넌트 */}
        {view === 'month' ? (
          <CalendarGrid
            currentDate={currentDate}
            selectedDate={null}
            selectedRange={null}
            events={events}
            calendars={calendar ? [calendar] : []}
            onDateSelect={handleDateSelect}
            onDateClick={handleDateClick}
            onMonthChange={setCurrentDate}
            onEventClick={handleEventClick}
            onEventDelete={handleEventDelete}
          />
        ) : view === 'week' ? (
          <CalendarGridW
            currentDate={currentDate}
            selectedDate={null}
            events={events}
            calendars={calendar ? [calendar] : []}
            onDateSelect={handleDateSelect}
            onDateClick={handleDateClick}
            onTimeSlotClick={(date, hour) => {
              console.log('Time slot clicked:', date, hour);
              // CalendarDetail에서는 기본 동작만 수행
            }}
            onEventClick={handleEventClick}
            onEventDelete={handleEventDelete}
          />
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            일별 뷰는 아직 구현되지 않았습니다.
          </div>
        )}

        {/* 이벤트 목록 (모든 뷰에서 보여주기) */}
        <div className="events-summary" style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h3>이번 달 일정</h3>
          <div className="events-list">
            {events.length === 0 ? (
              <p className="no-events" style={{ color: '#666', fontStyle: 'italic' }}>등록된 일정이 없습니다.</p>
            ) : (
              events.map(event => (
                <div key={event.id} className="event-item" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '8px 0', 
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer'
                }} onClick={() => handleEventClick(event)}>
                  <div 
                    className="event-color"
                    style={{ 
                      backgroundColor: event.color, 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '50%', 
                      marginRight: '12px' 
                    }}
                  />
                  <div className="event-info">
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '500' }}>{event.title}</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                      {new Date(event.start_date).toLocaleString('ko-KR')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarDetail;
