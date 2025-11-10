// calendarApi.ts
import api from './api';
import axios from 'axios';
import {
  Calendar,
  CalendarTag,
  CalendarMember,
  CalendarInvitation,
  Event,
  CreateCalendarRequest,
  UpdateCalendarRequest,
  CreateUpdateEventRequest,
  SendInvitationRequest,
  AcceptInvitationRequest,
  ChangeRoleRequest,
  CalendarCheckResponse,
  CalendarStatsResponse,
  InvitationResponse,
  EventFilters,
  CalendarFilters,
} from '../types/calendar.types';

export const calendarAPI = {
  // ===== 캘린더 관련 =====
  // 캘린더 목록 조회
  getCalendars: (filters?: CalendarFilters) => 
    api.get<Calendar[]>('/calendars/', { params: filters }),
  
  // 특정 캘린더 조회
  getCalendar: (id: string) => 
    api.get<Calendar>(`/calendars/${id}/`),
  
  // 캘린더 생성
  createCalendar: (data: CreateCalendarRequest) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('calendar_type', data.calendar_type);
    
    if (data.description) formData.append('description', data.description);
    if (data.color) formData.append('color', data.color);
    if (data.image) formData.append('image', data.image);
    
    return api.post<Calendar>('/calendars/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // 캘린더 수정
  updateCalendar: (id: string, data: UpdateCalendarRequest) => {
    const formData = new FormData();
    
    if (data.name) formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    if (data.color) formData.append('color', data.color);
    if (data.image) formData.append('image', data.image);
    
    return api.patch<Calendar>(`/calendars/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // 캘린더 삭제
  deleteCalendar: (id: string) => 
    api.delete(`/calendars/${id}/`),
  
  // 캘린더 나가기
  leaveCalendar: (id: string) => 
    api.post(`/calendars/${id}/leave/`),
  
  // 캘린더 통계
  getCalendarStats: (id: string) => 
    api.get<CalendarStatsResponse>(`/calendars/${id}/stats/`),
  
  // 캘린더 체크 (캘린더 존재 여부 확인)
  checkCalendars: () => 
    api.get<CalendarCheckResponse>('/calendars/check_calendars/'),

  // ===== 태그 관련 =====
  // 캘린더 태그 조회
  getCalendarTags: (calendarId: string) => 
    api.get<CalendarTag[]>(`/calendars/${calendarId}/tags/`),
  
  // 캘린더 태그 업데이트
  updateCalendarTags: (calendarId: string, data: { tags: Partial<CalendarTag>[] }) => 
    api.put<CalendarTag[]>(`/calendars/${calendarId}/tags/`, data),
  
  // 캘린더 태그 초기화
  resetCalendarTags: (calendarId: string) => 
    api.post<CalendarTag[]>(`/calendars/${calendarId}/tags/reset/`),

  // ===== 멤버 관련 =====
  // 멤버 목록 조회
  getMembers: (calendarId: string) => 
    api.get<CalendarMember[]>(`/calendars/${calendarId}/members/`),
  
  // 멤버 역할 변경
  changeRole: (calendarId: string, data: ChangeRoleRequest) => 
    api.post<CalendarMember>(`/calendars/${calendarId}/change_role/`, data),
  
  // 멤버 제거
  removeMember: (calendarId: string, userId: string) => 
    api.delete(`/calendars/${calendarId}/members/${userId}/`),

  // ===== 초대 관련 =====
  // 초대 보내기
  sendInvitations: (calendarId: string, data: SendInvitationRequest) => 
    api.post<InvitationResponse>(`/calendars/${calendarId}/invite/`, data),
  
  // 초대 목록 조회 (보낸 초대)
  getSentInvitations: (calendarId: string) => 
    api.get<CalendarInvitation[]>(`/calendars/${calendarId}/invitations/`),
  
  // 받은 초대 목록 조회
  getReceivedInvitations: () => 
    api.get<CalendarInvitation[]>('/calendars/invitations/received/'),
  
  // 초대 수락
  acceptInvitation: (data: AcceptInvitationRequest) => 
    api.post<Calendar>('/calendars/invitations/accept/', data),
  
  // 초대 거절
  declineInvitation: (token: string) => 
    api.post('/calendars/invitations/decline/', { token }),
  
  // 초대 취소
  cancelInvitation: (calendarId: string, invitationId: string) => 
    api.delete(`/calendars/${calendarId}/invitations/${invitationId}/`),
  
  // 공유 링크 관련
  getShareLink: (calendarId: string) => 
    api.get<{ share_token: string; share_url: string }>(`/calendars/${calendarId}/share_link/`),
  
  generateShareLink: (calendarId: string) => 
    api.post<{ share_token: string; share_url: string; message: string }>(
      `/calendars/${calendarId}/generate_share_link/`
    ),
  
  // 공유 링크로 캘린더 정보 조회 (참가 전, 공개 API - 인증 불필요)
  getCalendarByShareToken: (token: string) => {
    // 공개 API이므로 인증 헤더 없이 별도 axios 인스턴스 사용
    // 현재 호스트의 IP 사용
    const getApiBaseUrl = () => {
      if (process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
      }
      const hostname = window.location.hostname;
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return `http://${hostname}:8000/api`;
      }
      return 'http://localhost:8000/api';
    };
    
    const publicApi = axios.create({
      baseURL: getApiBaseUrl(),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return publicApi.get<Calendar>('/calendars/share/', { params: { share_token: token } });
  },
  
  // 공유 링크로 참여
  joinByShareLink: (token: string) => 
    api.post<{ calendar: Calendar; message: string }>('/calendars/join/', { share_token: token }),

  // ===== 이벤트 관련 =====
  // 이벤트 목록 조회
  getEvents: (filters?: EventFilters) => 
    api.get<Event[]>('/events/', { params: filters }),
  
  // 특정 이벤트 조회
  getEvent: (id: string) => 
    api.get<Event>(`/events/${id}/`),
  
  // 이벤트 생성
  createEvent: (data: CreateUpdateEventRequest) => 
    api.post<Event>('/events/', data),
  
  // 이벤트 수정
  updateEvent: (id: string, data: CreateUpdateEventRequest) => 
    api.patch<Event>(`/events/${id}/`, data),
  
  // 이벤트 삭제
  deleteEvent: (id: string) => 
    api.delete(`/events/${id}/`),
  
  // 캘린더별 이벤트 조회
  getCalendarEvents: (calendarId: string, filters?: Omit<EventFilters, 'calendar_id'>) => 
    api.get<Event[]>(`/calendars/${calendarId}/events/`, { params: filters }),
};

export default api;