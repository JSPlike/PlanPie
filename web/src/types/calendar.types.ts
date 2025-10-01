import { User } from './auth.types';

// 캘린더 태그
export interface CalendarTag {
  id: string;
  name: string;
  color: string;
  order: number;
  calendar: string;
  created_at: string;
  updated_at: string;
}

// 캘린더 멤버 타입
export interface CalendarMember {
  id: number;  // Django의 자동 생성 ID는 정수
  user: User;
  role: 'admin' | 'member';
  joined_at: string;
}

// 캘린더 타입
export interface Calendar {
  id: string;
  name: string;
  description: string;
  calendar_type: 'personal' | 'shared';
  image?: string;
  color: string;
  owner: User;
  members: CalendarMember[];
  tags: CalendarTag[];  // 10개의 태그
  member_count: number;
  event_count: number;
  share_url: string;
  share_token: string;
  is_admin: boolean;
  is_active: boolean; // 후에 추가됨 (현재 화면에서 캘린더 활성/비활성)
  can_leave: boolean;
  can_delete: boolean;
  created_at: string;
  updated_at: string;
}

// 캘린더 초대 타입
export interface CalendarInvitation {
  id: string;
  calendar: Calendar;
  inviter: User;
  invitee_email: string;
  invitee?: User;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'declined';
  invitation_token: string;
  message?: string;
  expires_at: string;
  created_at: string;
  responded_at?: string;
}

// 이벤트 타입
export interface Event {
  id: string;
  calendar: string;  // calendar ID
  calendar_name?: string;
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  all_day: boolean;
  color: string;
  tag?: CalendarTag | null;
  created_by?: User;
  can_edit?: boolean;
  can_delete?: boolean;
  created_at: string;
  updated_at: string;
}

// Request 타입들
export interface CreateCalendarRequest {
  name: string;
  description?: string;
  calendar_type: 'personal' | 'shared';
  color?: string;
  image?: File;
}

export interface UpdateCalendarRequest {
  name?: string;
  description?: string;
  color?: string;
  image?: File;
}

export interface CreateUpdateEventRequest {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  all_day?: boolean;
  calendar: string;
  color?: string;
  description?: string;
  tag_id?: string | null;
  location?: string;
}

export interface SendInvitationRequest {
  emails: string[];
  role?: 'admin' | 'member';
  message?: string;
}

export interface AcceptInvitationRequest {
  token: string;
}

export interface ChangeRoleRequest {
  user_id: string;
  role: 'admin' | 'member';
}

// Response 타입들
export interface CalendarStatsResponse {
  total_events: number;
  upcoming_events: number;
  past_events: number;
  total_members: number;
  admins: number;
  members: number;
}

export interface InvitationResponse {
  sent: CalendarInvitation[];
  errors: string[];
}

export interface CalendarCheckResponse {
  has_calendars: boolean;
  owned_count: number;
  member_count: number;
}

// 필터 타입들
export interface EventFilters {
  calendar_id?: string;
  start_date?: string;
  end_date?: string;
  color?: string;
}

export interface CalendarFilters {
  calendar_type?: 'personal' | 'shared';
  is_admin?: boolean;
}

// 로컬 상태 관리용 (Calendar + 화면 표시 여부)
export interface CalendarWithVisibility extends Calendar {
  isVisible: boolean;  // 로컬 상태 (DB 저장 X)
}