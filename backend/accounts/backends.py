"""
커스텀 인증 백엔드
이메일로 로그인할 수 있도록 설정
"""
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()


class EmailBackend(ModelBackend):
    """
    이메일을 사용하여 인증하는 커스텀 백엔드
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        # email 파라미터로도 인증 가능하도록
        email = kwargs.get('email', username)
        
        if email is None or password is None:
            return None
        
        try:
            # 이메일로 사용자 찾기 (email이 null이 아닌 경우만)
            user = User.objects.get(email=email)
        except (User.DoesNotExist, User.MultipleObjectsReturned):
            # 이메일이 없으면 사용자명으로 시도
            try:
                user = User.objects.get(username=email)
            except (User.DoesNotExist, User.MultipleObjectsReturned):
                return None
        
        # 비밀번호 확인 및 사용자 활성화 여부 확인
        if user and user.check_password(password) and self.user_can_authenticate(user):
            return user
        
        return None

