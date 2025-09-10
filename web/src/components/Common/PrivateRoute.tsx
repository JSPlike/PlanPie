import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { calendarAPI } from '../../services/calendarApi';
import Loading from './Loading';
import CalendarCreate from '../../pages/Calendar/CalendarCreate';

interface PrivateRouteProps {
  children: React.ReactNode;
  requireCalendar?: boolean;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  children, 
  requireCalendar = false 
}) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const [hasCalendar, setHasCalendar] = useState<boolean | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && requireCalendar) {
      checkCalendar();
    }
  }, [isAuthenticated, requireCalendar]);

  const checkCalendar = async () => {
    setCalendarLoading(true);
    try {
      const response = await calendarAPI.checkCalendars();
      setHasCalendar(response.data.has_calendars);
    } catch (error) {
      console.error('Failed to check calendars:', error);
      setHasCalendar(false);
    } finally {
      setCalendarLoading(false);
    }
  };

  // 인증 로딩 중
  if (authLoading) {
    return <Loading />;
  }

  // 인증되지 않은 경우
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 캘린더 체크가 필요한 경우
  if (requireCalendar) {
    if (calendarLoading) {
      return <Loading />;
    }

    if (hasCalendar === false) {
      return <CalendarCreate onCalendarCreated={() => setHasCalendar(true)} />;
    }
  }

  return <>{children}</>;
};

export default PrivateRoute;