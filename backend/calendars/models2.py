from django.db import models
from django.conf import settings
import uuid

# 기본 태그 색상과 이름
DEFAULT_TAGS = [
    {'color': '#FF6B6B', 'name': '빨강', 'default_name': 'Red'},
    {'color': '#FF9F40', 'name': '주황', 'default_name': 'Orange'},
    {'color': '#FFD93D', 'name': '노랑', 'default_name': 'Yellow'},
    {'color': '#6BCF7F', 'name': '초록', 'default_name': 'Green'},
    {'color': '#4ECDC4', 'name': '민트', 'default_name': 'Mint'},
    {'color': '#4A90E2', 'name': '파랑', 'default_name': 'Blue'},
    {'color': '#9B59B6', 'name': '보라', 'default_name': 'Purple'},
    {'color': '#FF6B9D', 'name': '분홍', 'default_name': 'Pink'},
    {'color': '#95A5A6', 'name': '회색', 'default_name': 'Gray'},
    {'color': '#34495E', 'name': '검정', 'default_name': 'Black'},
]

class CalendarTag(models.Model):
    """캘린더별 태그 설정"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    calendar = models.ForeignKey(
        'Calendar',
        on_delete=models.CASCADE,
        related_name='calendar_tags',
        verbose_name='캘린더'
    )
    color = models.CharField(max_length=7, verbose_name='태그 색상')
    default_name = models.CharField(max_length=50, verbose_name='기본 이름')
    custom_name = models.CharField(max_length=50, verbose_name='사용자 정의 이름')
    is_active = models.BooleanField(default=True, verbose_name='활성화')
    order = models.IntegerField(default=0, verbose_name='정렬 순서')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='생성일')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='수정일')

    class Meta:
        verbose_name = '캘린더 태그'
        verbose_name_plural = '캘린더 태그'
        db_table = 'calendar_tags'
        unique_together = ('calendar', 'color')
        ordering = ['order', 'default_name']

    def __str__(self):
        return f"{self.calendar.name} - {self.display_name}"

    @property
    def display_name(self):
        """표시할 태그 이름 (커스텀 이름 우선)"""
        return self.custom_name or self.default_name

    @classmethod
    def create_default_tags(cls, calendar):
        """캘린더 생성 시 기본 태그 세트 생성"""
        for index, tag_info in enumerate(DEFAULT_TAGS):
            cls.objects.create(
                calendar=calendar,
                color=tag_info['color'],
                default_name=tag_info['name'],
                custom_name=tag_info['name'],  # 초기에는 기본 이름 사용
                order=index
            )


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
        verbose_name='캘린더 아이콘'
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
        import secrets
        if not self.share_token:
            self.share_token = secrets.token_urlsafe(32)
        
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        # 새 캘린더 생성 시 기본 태그 생성
        if is_new:
            CalendarTag.create_default_tags(self)

    def get_share_url(self):
        return f"{settings.FRONTEND_URL}/calendar/join/{self.share_token}"


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
    
    # 태그 (1대1 관계로 변경)
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
    
    # 반복 설정
    recurrence_rule = models.CharField(
        max_length=50,
        blank=True,
        choices=[
            ('', '반복 없음'),
            ('daily', '매일'),
            ('weekly', '매주'),
            ('monthly', '매월'),
            ('yearly', '매년'),
            ('weekdays', '평일'),
            ('weekends', '주말'),
        ],
        verbose_name='반복 규칙'
    )
    recurrence_end = models.DateField(null=True, blank=True, verbose_name='반복 종료일')
    
    # 알림 설정
    reminder_minutes = models.IntegerField(
        default=0,
        verbose_name='알림 (분 전)',
        help_text='0이면 알림 없음'
    )
    
    # 중요도
    priority = models.CharField(
        max_length=10,
        choices=[
            ('low', '낮음'),
            ('normal', '보통'),
            ('high', '높음'),
        ],
        default='normal',
        verbose_name='중요도'
    )
    
    # 완료 상태
    is_completed = models.BooleanField(default=False, verbose_name='완료 여부')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='완료 시간')
    
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
            models.Index(fields=['created_by', 'start_date']),
        ]

    def __str__(self):
        return f"{self.title} ({self.start_date.strftime('%Y-%m-%d')})"

    @property
    def color(self):
        """이벤트 색상 (태그 색상 사용)"""
        return self.tag.color if self.tag else '#95A5A6'

    @property
    def tag_name(self):
        """태그 이름"""
        return self.tag.display_name if self.tag else None

    def can_edit(self, user):
        """사용자가 이 일정을 수정할 수 있는지 확인"""
        # 일정 생성자
        if self.created_by == user:
            return True
        
        # 캘린더 소유자
        if self.calendar.owner == user:
            return True
        
        # 캘린더 공유 권한 확인
        share = self.calendar.shares.filter(user=user).first()
        if share and share.permission in ['edit', 'admin']:
            return True
        
        return False