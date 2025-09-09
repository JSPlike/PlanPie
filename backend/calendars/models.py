from django.db import models
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import uuid
import secrets

# 기본 태그 색상 (10개)
DEFAULT_TAG_COLORS = [
    '#2D4059',  # 차콜 블랙
    '#FF6B6B',  # 코랄 레드
    '#5C7AEA',  # 모던 블루
    '#6FCF97',  # 세이지 그린
    '#F2C94C',  # 머스타드 옐로우
    '#9B51E0',  # 라벤더 퍼플
    '#F2994A',  # 앰버 오렌지
    '#56CCF2',  # 스카이 민트
    '#EB5757',  # 체리 핑크
    '#BDBDBD',  # 쿨 그레이
]

# 기본 캘린더 캘린더를 생성한다
class Calendar(models.Model):
    """캘린더 (공유 가능)"""
    CALENDAR_TYPES = [
        ('personal', '개인 캘린더'),
        ('shared', '공유 캘린더'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, verbose_name='캘린더 이름')
    description = models.TextField(blank=True, verbose_name='설명')
    calendar_type = models.CharField(
        max_length=10, 
        choices=CALENDAR_TYPES, 
        default='personal',
        verbose_name='캘린더 유형'
    )
    
    # 캘린더 이미지/아이콘
    image = models.ImageField(
        upload_to='calendar_images/', 
        null=True, 
        blank=True,
        verbose_name='캘린더 이미지'
    )
    color = models.CharField(max_length=7, default='#007bff', verbose_name='캘린더 색상')
    
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_calendars',
        verbose_name='소유자'
    )
    
    share_token = models.CharField(
        max_length=64, 
        unique=True, 
        null=True, 
        blank=True,
        verbose_name='공유 토큰'
    )
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='생성일')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='수정일')

    class Meta:
        verbose_name = '캘린더'
        verbose_name_plural = '캘린더'
        db_table = 'calendars'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.get_calendar_type_display()})"

    def save(self, *args, **kwargs):
        if not self.share_token:
            self.share_token = secrets.token_urlsafe(32)
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        # 새 캘린더 생성 시 기본 태그 10개 생성
        if is_new:
            self.create_default_tags()

    def create_default_tags(self):
        """캘린더 생성 시 기본 태그 10개 생성"""
        for index, color in enumerate(DEFAULT_TAG_COLORS):
            CalendarTag.objects.create(
                calendar=self,
                name=f"태그 {index + 1}",
                color=color,
                order=index
            )

    def get_share_url(self):
        from django.urls import reverse
        return f"{settings.FRONTEND_URL}/calendar/join/{self.share_token}"

    def is_admin(self, user):
        """사용자가 관리자인지 확인"""
        # 소유자는 항상 관리자
        if self.owner == user:
            return True
        
        # 공유된 사용자 중 관리자 권한 확인
        member = self.members.filter(user=user).first()
        return member and member.role == 'admin'
    
    def can_delete(self, user):
        """캘린더 삭제 권한 확인 (관리자만)"""
        return self.is_admin(user)
    
    def can_edit_event(self, user):
        """일정 수정 권한 확인 (모든 멤버)"""
        # 소유자
        if self.owner == user:
            return True
        
        # 캘린더 멤버인지 확인
        return self.members.filter(user=user).exists()
    
    def can_leave(self, user):
        """캘린더 나가기 가능 여부 (소유자는 불가)"""
        return self.owner != user and self.members.filter(user=user).exists()

class CalendarTag(models.Model):
    """캘린더별 태그 (참여자 및 이벤트 구분용)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    calendar = models.ForeignKey(
        Calendar,
        on_delete=models.CASCADE,
        related_name='tags',
        verbose_name='캘린더'
    )
    color = models.CharField(max_length=7, verbose_name='태그 색상')
    name = models.CharField(max_length=50, verbose_name='태그 이름')
    order = models.IntegerField(default=0, verbose_name='정렬 순서')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='생성일')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='수정일')

    class Meta:
        verbose_name = '캘린더 태그'
        verbose_name_plural = '캘린더 태그'
        db_table = 'calendar_tags'
        ordering = ['order', 'name']
        # 한 캘린더에서 같은 색상의 태그는 하나만
        unique_together = ('calendar', 'color')

    def __str__(self):
        return f"{self.calendar.name} - {self.name} ({self.color})"
    
class CalendarMember(models.Model):
    """캘린더 멤버 (참여자)"""
    ROLE_CHOICES = [
        ('admin', '관리자'),     # 캘린더 삭제 가능, 멤버 관리
        ('member', '참여자'),    # 일정 추가/수정 가능
    ]
    
    calendar = models.ForeignKey(
        Calendar,
        on_delete=models.CASCADE,
        related_name='members',
        verbose_name='캘린더'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='calendar_memberships',
        verbose_name='사용자'
    )
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default='member',
        verbose_name='역할'
    )
    joined_at = models.DateTimeField(auto_now_add=True, verbose_name='참여일')

    class Meta:
        verbose_name = '캘린더 멤버'
        verbose_name_plural = '캘린더 멤버'
        db_table = 'calendar_members'
        unique_together = ('calendar', 'user')

    def __str__(self):
        return f"{self.calendar.name} - {self.user.email} ({self.get_role_display()})"

class CalendarInvitation(models.Model):
    """캘린더 초대"""
    STATUS_CHOICES = [
        ('pending', '대기중'),
        ('accepted', '수락'),
        ('declined', '거절'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    calendar = models.ForeignKey(
        Calendar,
        on_delete=models.CASCADE,
        related_name='invitations',
        verbose_name='캘린더'
    )
    inviter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_invitations',
        verbose_name='초대한 사람'
    )
    invitee_email = models.EmailField(verbose_name='초대받은 이메일')
    invitee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='received_invitations',
        verbose_name='초대받은 사람'
    )
    role = models.CharField(
        max_length=10,
        choices=CalendarMember.ROLE_CHOICES,
        default='member',
        verbose_name='역할'
    )
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='상태'
    )
    invitation_token = models.CharField(
        max_length=64,
        unique=True,
        verbose_name='초대 토큰'
    )
    message = models.TextField(blank=True, verbose_name='초대 메시지')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='초대일')
    responded_at = models.DateTimeField(null=True, blank=True, verbose_name='응답일')
    expires_at = models.DateTimeField(verbose_name='만료일')

    class Meta:
        verbose_name = '캘린더 초대'
        verbose_name_plural = '캘린더 초대'
        db_table = 'calendar_invitations'
        unique_together = ('calendar', 'invitee_email')

    def save(self, *args, **kwargs):
        if not self.invitation_token:
            self.invitation_token = secrets.token_urlsafe(32)
        if not self.expires_at:
            from django.utils import timezone
            from datetime import timedelta
            self.expires_at = timezone.now() + timedelta(days=7)
        super().save(*args, **kwargs)

    def send_invitation_email(self):
        """초대 이메일 발송"""
        subject = f"{self.inviter.get_full_name() or self.inviter.email}님이 '{self.calendar.name}' 캘린더에 초대했습니다"
        
        context = {
            'invitation': self,
            'accept_url': f"{settings.FRONTEND_URL}/calendar/invitation/{self.invitation_token}",
            'calendar': self.calendar,
            'inviter': self.inviter,
            'role': self.get_role_display(),
        }
        
        html_message = render_to_string('calendars/invitation_email.html', context)
        plain_message = strip_tags(html_message)
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[self.invitee_email],
            html_message=html_message,
            fail_silently=False,
        )

class Event(models.Model):
    """일정/이벤트"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    calendar = models.ForeignKey(
        Calendar,
        on_delete=models.CASCADE,
        related_name='events',
        verbose_name='캘린더'
    )
    
    # 기본 정보
    title = models.CharField(max_length=200, verbose_name='제목')
    description = models.TextField(blank=True, verbose_name='메모')
    location = models.CharField(max_length=200, blank=True, verbose_name='장소')
    
    # 태그 (구분용)
    tag = models.ForeignKey(
        CalendarTag,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='events',
        verbose_name='태그'
    )

    # 시간 정보
    start_date = models.DateTimeField(verbose_name='시작 시간')
    end_date = models.DateTimeField(verbose_name='종료 시간')
    all_day = models.BooleanField(default=False, verbose_name='종일 일정')
    
    # 메타 정보
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_events',
        verbose_name='생성자'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='생성일')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='수정일')

    class Meta:
        verbose_name = '일정'
        verbose_name_plural = '일정'
        db_table = 'events'
        ordering = ['start_date']
        indexes = [
            models.Index(fields=['calendar', 'start_date']),
            models.Index(fields=['calendar', 'tag']),
        ]

    def __str__(self):
        tag_info = f" [{self.tag.name}]" if self.tag else ""
        return f"{self.title}{tag_info} ({self.start_date.strftime('%Y-%m-%d')})"

    @property
    def color(self):
        """이벤트 색상 (태그 색상 사용)"""
        return self.tag.color if self.tag else '#95A5A6'
    
    def can_edit(self, user):
        """사용자가 이 일정을 수정할 수 있는지 확인"""
        # 캘린더의 모든 멤버는 일정 수정 가능
        return self.calendar.can_edit_event(user)

    def can_delete(self, user):
        """사용자가 이 일정을 삭제할 수 있는지 확인"""
        # 일정 생성자 또는 캘린더 관리자만 삭제 가능
        if self.created_by == user:
            return True
        return self.calendar.is_admin(user)