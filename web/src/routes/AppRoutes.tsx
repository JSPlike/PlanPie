import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Auth Pages
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';

// Calendar Pages
import CalendarList from '../pages/Calendar/CalendarList';
import CalendarCreate from '../pages/Calendar/CalendarCreate';
import CalendarDetail from '../pages/Calendar/CalendarDetail';
import JoinCalendar from '../pages/Calendar/JoinCalendar';
import InviteCalendarPage from '../pages/Calendar/InviteCalendarPage';

// Common Components
import PrivateRoute from '../components/Common/PrivateRoute';
import NotFound from '../pages/NotFound';
import Calendar from '../pages/Calendar/CalendarView';

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Routes - 로그인한 사용자는 메인으로 리다이렉트 */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <Login />
        } 
      />
      <Route 
        path="/register" 
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <Register />
        } 
      />

      {/* Root Route - 캘린더 체크 후 적절한 페이지로 */}
      <Route 
        path="/" 
        element={
          <PrivateRoute requireCalendar={true}>
            {/* <CalendarList /> */}
            <Calendar/>
          </PrivateRoute>
        } 
      />

      {/* Calendar Invite Route - 공개 라우트 */}
      <Route 
        path="/calendar/invite/:token" 
        element={<InviteCalendarPage />} 
      />

      {/* Calendar Routes */}
      <Route 
        path="/calendars" 
        element={
          <PrivateRoute requireCalendar={true}>
            {/* <CalendarList /> */}
            <Calendar/>
          </PrivateRoute>
        }
      />

      <Route 
        path="/calendars/create" 
        element={
          <PrivateRoute>
            <CalendarCreate />
          </PrivateRoute>
        } 
      />

      <Route 
        path="/calendars/:id" 
        element={
          <PrivateRoute>
            <CalendarDetail />
          </PrivateRoute>
        } 
      />

      {/* Invitation Routes */}
      <Route 
        path="/calendar/join/:token" 
        element={<InviteCalendarPage />} 
      />

      <Route 
        path="/calendar/invitation/:token" 
        element={
          <PrivateRoute>
            <JoinCalendar type="invitation" />
          </PrivateRoute>
        } 
      />

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;