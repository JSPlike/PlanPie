### 주요 시리얼라이저 설명
1. CalendarSerializer
- 캘린더 전체 정보 직렬화
- 멤버 목록, 권한 정보 포함
- 현재 사용자 기준 권한 체크 (is_admin, can_leave, can_delete)

2. CalendarMemberSerializer
- 캘린더 멤버 정보 직렬화
- 사용자 정보와 역할 포함

3. EventSerializer
- 일정 정보 직렬화
- 수정/삭제 권한 체크
- 시간 유효성 검증

4. CalendarInvitationSerializer
- 초대 정보 직렬화
- 캘린더와 초대자 정보 포함

5. 전용 시리얼라이저들
- CreateEventSerializer: 일정 생성 전용
- UpdateEventSerializer: 일정 수정 전용
- SendInvitationSerializer: 초대 발송용
- AcceptInvitationSerializer: 초대 수락용
- ChangeRoleSerializer: 역할 변경용

- 각 시리얼라이저는 권한 검증과 데이터 유효성 검사를 포함하고 있어 보안과 데이터 무결성을 보장합니다.