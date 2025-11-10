/**
 * InviteCalendarPage 컴포넌트
 * 
 * 초대 링크를 통해 접속한 사용자를 위한 캘린더 참가 페이지
 * 
 * 주요 기능:
 * 1. 초대 링크 토큰으로 캘린더 정보 조회
 * 2. 캘린더 카드 표시 (배경 이미지, 이름, 참가하기 버튼)
 * 3. 로그인 상태에 따른 헤더 표시 (프로필 또는 로그인/가입 버튼)
 * 4. 캘린더 참가 기능
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { calendarAPI } from '../../services/calendarApi';
import { useAuth } from '../../hooks/useAuth';
import { Calendar } from '../../types/calendar.types';
import Loading from '../../components/Common/Loading';
import ProfileWidget from '../../components/Common/ProfileWidget';
import styles from './InviteCalendarPage.module.css';

const InviteCalendarPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calendar, setCalendar] = useState<Calendar | null>(null);

  useEffect(() => {
    if (token) {
      fetchCalendarInfo();
    } else {
      setError('유효하지 않은 초대 링크입니다.');
      setLoading(false);
    }
  }, [token]);

  // 초대 링크로 캘린더 정보 조회
  const fetchCalendarInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('초대링크로 캘린더 조회 =====');
      // share_token으로 캘린더 정보 조회 (공개 API)
      const response = await calendarAPI.getCalendarByShareToken(token!);
      console.log('캘린더 정보 =====', response.data);
      setCalendar(response.data);
    } catch (error: any) {
      console.error('Failed to fetch calendar info:', error);
      setError(
        error.response?.data?.error || 
        '캘린더 정보를 불러오는데 실패했습니다.'
      );
    } finally {
      setLoading(false);
    }
  };

  // 캘린더 참가
  const handleJoin = async () => {
    if (!token || !calendar) return;

    // 로그인하지 않은 경우 로그인 페이지로 이동 (로그인 후 다시 이 페이지로 돌아옴)
    if (!isAuthenticated) {
      navigate(`/login?redirect=/calendar/join/${token}?autoJoin=true`);
      return;
    }

    setJoining(true);
    setError(null);

    try {
      const response = await calendarAPI.joinByShareLink(token);
      
      if (response.data.calendar) {
        alert(response.data.message || '캘린더에 참여했습니다!');
        navigate('/calendars');
      }
    } catch (error: any) {
      console.error('Failed to join calendar:', error);
      setError(
        error.response?.data?.error || 
        error.response?.data?.message || 
        '캘린더 참여에 실패했습니다.'
      );
    } finally {
      setJoining(false);
    }
  };

  // 로그인 후 자동으로 참가하기 실행
  useEffect(() => {
    // 로그인 상태가 되고, 캘린더 정보가 있고, 아직 참가하지 않은 경우 자동으로 참가
    if (isAuthenticated && calendar && !joining && !error) {
      // URL에 autoJoin 파라미터가 있으면 자동으로 참가
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('autoJoin') === 'true') {
        handleJoin();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, calendar]);


  if (loading) {
    return <Loading message="캘린더 정보를 불러오는 중..." />;
  }

  return (
    <div className={styles.invitePage}>
      {/* 헤더 */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link to="/" className={styles.logo}>
            PlanPie
          </Link>
          <div className={styles.headerRight}>
            {isAuthenticated && user ? (
              <ProfileWidget />
            ) : (
              <div className={styles.authButtons}>
                <Link to={`/login?redirect=/calendar/join/${token}?autoJoin=true`} className={styles.loginButton}>
                  로그인
                </Link>
                <Link to="/register" className={styles.signupButton}>
                  가입
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className={styles.mainContent}>
        {error ? (
          <div className={styles.errorCard}>
            <div className={styles.errorIcon}>⚠️</div>
            <h2>오류</h2>
            <p>{error}</p>
            <Link to="/" className={styles.homeButton}>
              홈으로 돌아가기
            </Link>
          </div>
        ) : calendar ? (
          <div className={styles.calendarCard}>
            {/* 배경 이미지 */}
            <div 
              className={styles.cardHeader}
              style={{
                backgroundImage: calendar.image 
                  ? `url(${calendar.image})` 
                  : `linear-gradient(135deg, ${calendar.color} 0%, ${calendar.color}dd 100%)`,
              }}
            >
              {!calendar.image && (
                <div className={styles.colorOverlay} style={{ backgroundColor: calendar.color }} />
              )}
            </div>

            {/* 캘린더 정보 */}
            <div className={styles.cardBody}>
              <h2 className={styles.calendarName}>{calendar.name}</h2>
              {calendar.description && (
                <p className={styles.calendarDescription}>{calendar.description}</p>
              )}
              
              {error && (
                <div className={styles.errorMessage}>
                  {error}
                </div>
              )}

              <button
                onClick={handleJoin}
                disabled={joining}
                className={styles.joinButton}
              >
                {joining ? '참가 중...' : '참가하기'}
              </button>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default InviteCalendarPage;
