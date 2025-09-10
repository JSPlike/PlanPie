from django.urls import path
from . import views
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
)

urlpatterns = [
    # 인증 관련
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),  # 클래스 기반으로 변경
    path('logout/', views.LogoutView.as_view(), name='logout'),  # 추가
    path('social-login/', views.SocialLoginView.as_view(), name='social_login'),  # 클래스 기반으로 변경
    
    # 사용자 정보 관련
    path('user/', views.UserView.as_view(), name='user'),  # 클래스 기반
    path('profile/', views.UserView.as_view(), name='profile'),  # UserView를 재사용 (profile_view 대신)
    
    # 비밀번호 관련
    path('password/change/', views.PasswordChangeView.as_view(), name='password_change'),
    
    # 소셜 계정 관련
    path('social-accounts/', views.SocialAccountView.as_view(), name='social_accounts'),
    
    # 유틸리티
    path('check-email/', views.EmailCheckView.as_view(), name='check_email'),
    
    # JWT 토큰 관련
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
]
