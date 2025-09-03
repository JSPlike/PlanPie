from django.urls import path
from .views import (
    RegisterView, login_view, social_login_view, 
    profile_view, disconnect_social_account
)
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', login_view, name='login'),
    path('social-login/', social_login_view, name='social_login'),
    path('profile/', profile_view, name='profile'),
    path('disconnect-social/', disconnect_social_account, name='disconnect_social'),
    
    # JWT 토큰 관련
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
]
