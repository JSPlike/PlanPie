// src/pages/Calendar/JoinCalendar.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { calendarAPI } from '../../services/calendarApi';
import Loading from '../../components/Common/Loading';
//import './JoinCalendar.css';

interface JoinCalendarProps {
  type?: 'share' | 'invitation';
}

const JoinCalendar: React.FC<JoinCalendarProps> = ({ type = 'share' }) => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calendarInfo, setCalendarInfo] = useState<any>(null);

  useEffect(() => {
    if (token) {
      if (type === 'invitation') {
        fetchInvitationInfo();
      }
    }
  }, [token, type]);

  const fetchInvitationInfo = async () => {
    // 초대 정보 조회 API 호출
    try {
      // const response = await calendarAPI.getInvitationInfo(token);
      // setCalendarInfo(response.data);
    } catch (error) {
      setError('유효하지 않은 초대 링크입니다.');
    }
  };

  const handleJoin = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      if (type === 'invitation') {
        await calendarAPI.acceptInvitation({ token });
      } else {
        await calendarAPI.joinByShareLink(token);
      }
      
      alert('캘린더에 참여했습니다!');
      navigate('/calendars');
    } catch (error: any) {
      console.error('Failed to join calendar:', error);
      setError(
        error.response?.data?.message || 
        '캘린더 참여에 실패했습니다. 링크를 다시 확인해주세요.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/calendars');
  };

  if (loading) {
    return <Loading message="캘린더에 참여하는 중..." />;
  }

  return (
    <div className="join-calendar-container">
      <div className="join-calendar-card">
        <div className="join-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="6" width="18" height="15" rx="2" stroke="#5C7AEA" strokeWidth="2"/>
            <path d="M3 10H21" stroke="#5C7AEA" strokeWidth="2"/>
            <path d="M8 2V6" stroke="#5C7AEA" strokeWidth="2" strokeLinecap="round"/>
            <path d="M16 2V6" stroke="#5C7AEA" strokeWidth="2" strokeLinecap="round"/>
            <path d="M12 14V18M10 16H14" stroke="#5C7AEA" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>

        <h2>
          {type === 'invitation' ? '캘린더 초대' : '캘린더 참여'}
        </h2>

        {calendarInfo ? (
          <div className="calendar-preview">
            <h3>{calendarInfo.name}</h3>
            <p>{calendarInfo.description}</p>
            <div className="calendar-stats">
              <span>멤버 {calendarInfo.member_count}명</span>
              <span>일정 {calendarInfo.event_count}개</span>
            </div>
          </div>
        ) : (
          <p className="join-description">
            {type === 'invitation' 
              ? '초대받은 캘린더에 참여하시겠습니까?'
              : '공유 링크를 통해 캘린더에 참여하시겠습니까?'}
          </p>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="join-actions">
          <button 
            className="btn-cancel"
            onClick={handleCancel}
            disabled={loading}
          >
            취소
          </button>
          <button 
            className="btn-join"
            onClick={handleJoin}
            disabled={loading || !token}
          >
            {loading ? '참여 중...' : '캘린더 참여'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinCalendar;
