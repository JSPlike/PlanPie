// src/pages/Calendar/CalendarList.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from '../../types/calendar.types';
import { calendarAPI } from '../../services/calendarApi';
import Loading from '../../components/Common/Loading';
import './CalendarList.css';

const CalendarList: React.FC = () => {
  const navigate = useNavigate();
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'personal' | 'shared'>('all');

  useEffect(() => {
    fetchCalendars();
  }, []);

  const fetchCalendars = async () => {
    try {
      setLoading(true);
      const response = await calendarAPI.getCalendars();
      setCalendars(response.data);
    } catch (error) {
      console.error('Failed to fetch calendars:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalendarClick = (calendarId: string) => {
    navigate(`/calendars/${calendarId}`);
  };

  const handleCreateCalendar = () => {
    navigate('/calendars/create');
  };

  const filteredCalendars = calendars.filter(calendar => {
    if (filter === 'all') return true;
    return calendar.calendar_type === filter;
  });

  if (loading) {
    return <Loading message="캘린더를 불러오는 중..." />;
  }

  return (
    <div className="calendar-list-container">
      <div className="calendar-list-header">
        <h1>내 캘린더</h1>
        <button className="btn-create" onClick={handleCreateCalendar}>
          + 새 캘린더
        </button>
      </div>

      <div className="calendar-filter-tabs">
        <button 
          className={`tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          전체 ({calendars.length})
        </button>
        <button 
          className={`tab ${filter === 'personal' ? 'active' : ''}`}
          onClick={() => setFilter('personal')}
        >
          개인 ({calendars.filter(c => c.calendar_type === 'personal').length})
        </button>
        <button 
          className={`tab ${filter === 'shared' ? 'active' : ''}`}
          onClick={() => setFilter('shared')}
        >
          공유 ({calendars.filter(c => c.calendar_type === 'shared').length})
        </button>
      </div>

      {filteredCalendars.length === 0 ? (
        <div className="empty-state">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="6" width="18" height="15" rx="2" stroke="#CBD5E0" strokeWidth="2"/>
            <path d="M3 10H21" stroke="#CBD5E0" strokeWidth="2"/>
            <path d="M8 2V6" stroke="#CBD5E0" strokeWidth="2" strokeLinecap="round"/>
            <path d="M16 2V6" stroke="#CBD5E0" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h3>캘린더가 없습니다</h3>
          <p>새 캘린더를 만들어 일정을 관리해보세요</p>
          <button className="btn-primary" onClick={handleCreateCalendar}>
            캘린더 만들기
          </button>
        </div>
      ) : (
        <div className="calendar-grid">
          {filteredCalendars.map(calendar => (
            <div 
              key={calendar.id} 
              className="calendar-card"
              onClick={() => handleCalendarClick(calendar.id)}
            >
              <div className="calendar-card-header">
                <div 
                  className="calendar-color-badge"
                  style={{ backgroundColor: calendar.color }}
                />
                <span className={`calendar-type-badge ${calendar.calendar_type}`}>
                  {calendar.calendar_type === 'personal' ? '개인' : '공유'}
                </span>
              </div>
              
              {calendar.image && (
                <div className="calendar-image">
                  <img src={calendar.image} alt={calendar.name} />
                </div>
              )}
              
              <div className="calendar-card-body">
                <h3>{calendar.name}</h3>
                {calendar.description && (
                  <p className="calendar-description">{calendar.description}</p>
                )}
                
                <div className="calendar-stats">
                  <span className="stat">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="currentColor"/>
                    </svg>
                    {calendar.member_count}명
                  </span>
                  <span className="stat">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" fill="currentColor"/>
                    </svg>
                    {calendar.event_count}개
                  </span>
                </div>
                
                {calendar.is_admin && (
                  <div className="admin-badge">관리자</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CalendarList;
