/**
 * MemberListSection 컴포넌트
 * 
 * 캘린더별 멤버 리스트를 아코디언 형태로 표시하는 컴포넌트
 * 
 * 주요 기능:
 * 1. 각 캘린더별 멤버 리스트 조회 및 표시
 * 2. 아코디언 형태로 열고 닫기
 * 3. 멤버 역할 표시 (관리자/참여자)
 * 4. 공유 링크 섹션 포함
 */

import React, { useState, useEffect } from 'react';
import { calendarAPI } from '../../services/calendarApi';
import { Calendar, CalendarMember } from '../../types/calendar.types';
import { toast } from 'react-toastify';
import ShareLinkSection from './ShareLinkSection';
import styles from './MemberListSection.module.css';

interface MemberListSectionProps {
  calendars: Calendar[];
  calendarVisibility?: Record<string, boolean>;
  isAdmin: boolean;
}

const MemberListSection: React.FC<MemberListSectionProps> = ({ calendars, calendarVisibility, isAdmin }) => {
  const [expandedCalendars, setExpandedCalendars] = useState<Set<string>>(new Set());
  const [membersMap, setMembersMap] = useState<Record<string, CalendarMember[]>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [invitePopupCalendarId, setInvitePopupCalendarId] = useState<string | null>(null);

  // 관리자 권한이 있고, 왼쪽에서 활성화된 캘린더만 필터링
  const adminCalendars = calendars.filter(cal => {
    // 관리자 권한이 있어야 함
    if (!cal.is_admin) return false;
    
    // calendarVisibility가 제공되면 활성화된 캘린더만 필터링
    // 기본적으로는 항상 활성화된 상태 (undefined이거나 true인 경우)
    if (calendarVisibility) {
      return calendarVisibility[cal.id] !== false;
    }
    
    // calendarVisibility가 없으면 기본적으로 활성화된 것으로 간주
    return true;
  });

  // 캘린더 토글
  const toggleCalendar = (calendarId: string) => {
    const newExpanded = new Set(expandedCalendars);
    if (newExpanded.has(calendarId)) {
      newExpanded.delete(calendarId);
    } else {
      newExpanded.add(calendarId);
      // 멤버 리스트가 없으면 로드
      if (!membersMap[calendarId]) {
        fetchMembers(calendarId);
      }
    }
    setExpandedCalendars(newExpanded);
  };

  // 멤버 리스트 조회
  const fetchMembers = async (calendarId: string) => {
    try {
      setLoadingMap(prev => ({ ...prev, [calendarId]: true }));
      const response = await calendarAPI.getMembers(calendarId);
      
      // 캘린더 소유자를 찾아서 멤버 리스트 맨 위에 추가
      const calendar = adminCalendars.find(cal => cal.id === calendarId);
      if (calendar && calendar.owner) {
        // 소유자를 CalendarMember 형태로 변환
        const ownerAsMember: CalendarMember = {
          id: 0, // 소유자는 멤버 ID가 없으므로 0으로 설정
          user: calendar.owner,
          role: 'admin',
          joined_at: calendar.created_at || new Date().toISOString(),
        };
        
        // 소유자를 맨 위에, 나머지 멤버는 그 아래에 배치
        const allMembers = [ownerAsMember, ...response.data];
        setMembersMap(prev => ({ ...prev, [calendarId]: allMembers }));
      } else {
        setMembersMap(prev => ({ ...prev, [calendarId]: response.data }));
      }
    } catch (error: any) {
      console.error('Failed to fetch members:', error);
      toast.error('멤버 리스트를 불러오는데 실패했습니다.');
    } finally {
      setLoadingMap(prev => ({ ...prev, [calendarId]: false }));
    }
  };

  // 모든 활성화된 관리자 캘린더는 기본으로 열기
  useEffect(() => {
    if (adminCalendars.length > 0 && expandedCalendars.size === 0) {
      // 모든 활성화된 관리자 캘린더 ID를 Set에 추가
      const allCalendarIds = new Set(adminCalendars.map(cal => cal.id));
      setExpandedCalendars(allCalendarIds);
      
      // 모든 캘린더의 멤버 리스트를 로드
      adminCalendars.forEach(cal => {
        fetchMembers(cal.id);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminCalendars.length]);

  if (!isAdmin || adminCalendars.length === 0) {
    return null;
  }

  return (
    <div className={styles.memberListSection}>
      {/* 캘린더별 멤버 리스트 */}
      <div className={styles.calendarList}>
        <h4 className={styles.sectionTitle}>캘린더별 멤버</h4>
        {adminCalendars.map((calendar) => {
          const isExpanded = expandedCalendars.has(calendar.id);
          const members = membersMap[calendar.id] || [];
          const isLoading = loadingMap[calendar.id] || false;
          
          // 멤버 수 계산: 소유자(1명) + 실제 멤버 수
          // members가 로드되지 않았으면 소유자 1명만 표시
          const memberCount = members.length > 0 ? members.length : 1;

          return (
            <div key={calendar.id} className={styles.calendarItem}>
              <button
                type="button"
                onClick={() => toggleCalendar(calendar.id)}
                className={styles.calendarHeader}
              >
                <div className={styles.calendarHeaderLeft}>
                  <div 
                    className={styles.calendarColorDot}
                    style={{ backgroundColor: calendar.color }}
                  />
                  <span className={styles.calendarName}>{calendar.name}</span>
                  <span className={styles.memberCount}>
                    ({memberCount}명)
                  </span>
                </div>
                <div className={styles.calendarHeaderRight}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInvitePopupCalendarId(calendar.id);
                    }}
                    className={styles.inviteButton}
                    title="멤버 초대"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="18" cy="5" r="3"/>
                      <circle cx="6" cy="12" r="3"/>
                      <circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                    초대
                  </button>
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    className={`${styles.chevron} ${isExpanded ? styles.expanded : ''}`}
                  >
                    <path d="M6 9L12 15L18 9"/>
                  </svg>
                </div>
              </button>

              {isExpanded && (
                <div className={styles.memberList}>
                  {isLoading ? (
                    <div className={styles.loading}>로딩 중...</div>
                  ) : members.length > 0 ? (
                    members.map((member, index) => (
                      <div key={member.id || `owner-${index}`} className={styles.memberItem}>
                        <div className={styles.memberInfo}>
                          <div className={styles.memberAvatar}>
                            {member.user.username?.[0]?.toUpperCase() || member.user.email?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div className={styles.memberDetails}>
                            <div className={styles.memberNameRow}>
                              <span className={styles.memberName}>
                                {member.user.username || member.user.email}
                              </span>
                              <span className={styles.memberEmail}>
                                {member.user.email}
                              </span>
                            </div>
                            <div className={styles.memberBadges}>
                              {member.id === 0 && <span className={styles.meBadge}>Me</span>}
                              {member.role === 'admin' && <span className={styles.adminBadge}>관리자</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.emptyMembers}>
                      멤버가 없습니다.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 초대 팝업 */}
      {invitePopupCalendarId && (
        <div className={styles.popupOverlay} onClick={() => setInvitePopupCalendarId(null)}>
          <div className={styles.popupContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.popupHeader}>
              <h3>멤버 초대</h3>
              <button
                type="button"
                onClick={() => setInvitePopupCalendarId(null)}
                className={styles.popupCloseButton}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className={styles.popupBody}>
              <ShareLinkSection 
                calendarId={invitePopupCalendarId}
                isAdmin={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberListSection;
