"""
해당파일의 저작권은 감자코딩(박준영)에게 있으며 무단 이용 및 배포를 삼가해 주시기 바랍니다.

"""

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
import uuid

#
# 기본 유저를 생성해주는 모델
#
class CustomUserManager(BaseUserManager):
    def create_user(self, email=None, password=None, **extra_fields):
        if email:
            email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    # 고유 식별자
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # 로그인 정보 (소셜 로그인 시 email이 없을 수 있음)
    email = models.EmailField(unique=True, null=True, blank=True, verbose_name='이메일')
    username = models.CharField(max_length=30, unique=True, null=True, blank=True, verbose_name='사용자명')
    
    # 기본 정보
    first_name = models.CharField(max_length=30, blank=True, verbose_name='이름')
    last_name = models.CharField(max_length=30, blank=True, verbose_name='성')
    phone_number = models.CharField(max_length=15, blank=True, verbose_name='전화번호')
    
    # 프로필 정보
    profile_image = models.ImageField(upload_to='profile_images/', blank=True, null=True, verbose_name='프로필 이미지')
    profile_image_url = models.URLField(max_length=500, blank=True, verbose_name='프로필 이미지 URL')  # 소셜 프로필 이미지
    birth_date = models.DateField(null=True, blank=True, verbose_name='생년월일')
  
    # 소셜 로그인 정보
    login_method = models.CharField(
        max_length=20,
        choices=[
            ('email', '이메일'),
            ('google', '구글'),
            ('kakao', '카카오'),
        ],
        default='email',
        verbose_name='가입 방법'
    )
    
    # 권한 및 상태
    is_active = models.BooleanField(default=True, verbose_name='활성화 여부')
    is_staff = models.BooleanField(default=False, verbose_name='스태프 권한')
    is_verified = models.BooleanField(default=False, verbose_name='인증 여부')

    # PermissionsMixin의 groups와 user_permissions에 related_name 추가
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_set',
        blank=True,
        verbose_name='groups',
        help_text='The groups this user belongs to.',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_set',
        blank=True,
        verbose_name='user permissions',
        help_text='Specific permissions for this user.',
    )
    
    # 타임스탬프
    date_joined = models.DateTimeField(default=timezone.now, verbose_name='가입일')
    last_login = models.DateTimeField(blank=True, null=True, verbose_name='마지막 로그인')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='수정일')

    # 추가 설정
    is_marketing_agreed = models.BooleanField(default=False, verbose_name='마케팅 수신 동의')
    is_terms_agreed = models.BooleanField(default=True, verbose_name='이용약관 동의')
    is_privacy_agreed = models.BooleanField(default=True, verbose_name='개인정보처리방침 동의')

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = '사용자'
        verbose_name_plural = '사용자들'
        db_table = 'users'

    def __str__(self):
        return self.email or self.username or str(self.id)

    def get_full_name(self):
        return f'{self.first_name} {self.last_name}'.strip()

    def get_short_name(self):
        return self.first_name

    def save(self, *args, **kwargs):
        # username이 없으면 자동 생성
        if not self.username:
            base_username = self.email.split('@')[0] if self.email else f'user_{self.id.hex[:8]}'
            self.username = self.generate_unique_username(base_username)
        super().save(*args, **kwargs)

    def generate_unique_username(self, base_username):
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f'{base_username}_{counter}'
            counter += 1
        return username
    
    # 유저의 마지막 로그인 일시 저장
    def update_last_login(self):
        self.last_login = timezone.now()
        self.save(update_fields=['last_login'])
    


class SocialAccount(models.Model):
    """소셜 계정 연동 정보"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='social_accounts')
    provider = models.CharField(
        max_length=20,
        choices=[
            ('google', 'Google'),
            ('kakao', 'Kakao'),
        ],
        verbose_name='제공자'
    )
    social_id = models.CharField(max_length=255, verbose_name='소셜 ID')
    access_token = models.TextField(blank=True, verbose_name='액세스 토큰')
    refresh_token = models.TextField(blank=True, verbose_name='리프레시 토큰')
    expires_at = models.DateTimeField(null=True, blank=True, verbose_name='토큰 만료일')
    
    # 소셜 계정에서 가져온 추가 정보
    extra_data = models.JSONField(default=dict, blank=True, verbose_name='추가 데이터')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='연동일')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='수정일')

    class Meta:
        verbose_name = '소셜 계정'
        verbose_name_plural = '소셜 계정들'
        db_table = 'social_accounts'
        unique_together = ('provider', 'social_id')

    def __str__(self):
        return f'{self.user} - {self.provider}'