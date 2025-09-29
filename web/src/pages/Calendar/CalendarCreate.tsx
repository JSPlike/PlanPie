// CalendarCreate.tsx
import React, { useState } from 'react';
import CreateCalendarModal from './CalendarCreateModal';
import { useNavigate } from 'react-router-dom';
import './CalendarCreate.css';

interface CalendarCreateProps {
  onCalendarCreated?: (calendarId: string) => void;
}

const CalendarCreate: React.FC<CalendarCreateProps> = ({ onCalendarCreated }) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [calendarType, setCalendarType] = useState<'personal' | 'shared'>('personal');

  const handleCreateClick = (type: 'personal' | 'shared') => {
    setCalendarType(type);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleCalendarCreated = (calendarId: string) => {
    console.log('=== Calendar Created Successfully ===');
    console.log('Calendar ID:', calendarId);
    setShowModal(false);
    if (onCalendarCreated) {
      console.log('부모 콜백 호출:', onCalendarCreated);
      onCalendarCreated(calendarId);
    } else {
      console.log('부모 콜백이 없음 - 캘린더 페이지로 이동');
      // 캘린더 생성 완료 후 캘린더 페이지로 이동 (새로 생성된 캘린더 포함)
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="calendar-create-container">
      <div className="calendar-create-content">
        <div className="welcome-section">
          <h1 className="welcome-title">캘린더 만들기</h1>
          <p className="welcome-subtitle">
            개인 일정을 관리하거나 팀과 함께 일정을 공유해보세요
          </p>
        </div>

        <div className="calendar-type-cards">
          <div 
            className="calendar-type-card personal"
            onClick={() => handleCreateClick('personal')}
          >
            <div className="card-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12Z" fill="#5C7AEA"/>
                <path d="M12 14C7.59 14 4 17.59 4 22H20C20 17.59 16.41 14 12 14Z" fill="#5C7AEA"/>
              </svg>
            </div>
            <h2 className="card-title">개인 캘린더</h2>
            <p className="card-description">
              나만의 일정을 관리하고<br/>
              개인 목표를 달성하세요
            </p>
            <ul className="card-features">
              <li>✓ 개인 일정 관리</li>
              <li>✓ 태그로 일정 분류</li>
              <li>✓ 색상 커스터마이징</li>
            </ul>
            <button className="card-button">
              개인 캘린더 만들기
            </button>
          </div>

          <div 
            className="calendar-type-card shared"
            onClick={() => handleCreateClick('shared')}
          >
            <div className="card-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                <path d="M16 11C17.66 11 19 9.66 19 8C19 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11Z" fill="#6FCF97"/>
                <path d="M8 11C9.66 11 11 9.66 11 8C11 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11Z" fill="#6FCF97"/>
                <path d="M8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13Z" fill="#6FCF97"/>
                <path d="M16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z" fill="#6FCF97"/>
              </svg>
            </div>
            <h2 className="card-title">공유 캘린더</h2>
            <p className="card-description">
              팀, 가족, 친구와 함께<br/>
              일정을 공유하고 협업하세요
            </p>
            <ul className="card-features">
              <li>✓ 멤버 초대 및 관리</li>
              <li>✓ 실시간 일정 공유</li>
              <li>✓ 권한 관리 (관리자/멤버)</li>
            </ul>
            <button className="card-button shared-button">
              공유 캘린더 만들기
            </button>
          </div>
        </div>

        <div className="help-section">
          <p className="help-text">
            이미 초대받은 캘린더가 있으신가요?
          </p>
          <a href="/calendar/join" className="join-link">
            초대 링크로 참여하기 →
          </a>
        </div>
      </div>

      {showModal && (
        <CreateCalendarModal
          calendarType={calendarType}
          onClose={handleModalClose}
          onSuccess={handleCalendarCreated}
        />
      )}
    </div>
  );
};

export default CalendarCreate;