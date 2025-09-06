from django.db import models
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import uuid
import secrets

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
    icon = models.CharField(
        max_length=50,
        default='📅',
        verbose_name='캘린더 아이콘',
        help_text='이모지 또는 아이콘 클래스'
    )
    color = models.CharField(max_length=7, default='#007bff', verbose_name='캘린더 색상')
    
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_calendars',
        verbose_name='소유자'
    )
    
    # 공유 설정
    is_public = models.BooleanField(default=False, verbose_name='공개 여부')
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
        super().save(*args, **kwargs)

    def get_share_url(self):
        from django.urls import reverse
        return f"{settings.FRONTEND_URL}/calendar/join/{self.share_token}"


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
    permission = models.CharField(
        max_length=10,
        choices=CalendarShare.PERMISSION_CHOICES,
        default='edit',
        verbose_name='권한'
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
