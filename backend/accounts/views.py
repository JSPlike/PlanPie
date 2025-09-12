from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import transaction
from django.shortcuts import get_object_or_404
from .models import User, SocialAccount
from .serializers import (
    UserSerializer, 
    RegisterSerializer, 
    LoginSerializer, 
    SocialLoginSerializer,
    UpdateProfileSerializer,
    ChangePasswordSerializer,
)


class RegisterView(APIView):
    """회원가입"""
    permission_classes = [AllowAny]
    
    @transaction.atomic
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # JWT 토큰 생성
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """로그인"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        print('로그인 요청')
        print(request.data)
        # 마지막 로그인 시간 업데이트
        user.update_last_login()
        
        # JWT 토큰 생성
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })


class SocialLoginView(APIView):
    """소셜 로그인"""
    permission_classes = [AllowAny]
    
    @transaction.atomic
    def post(self, request):
        serializer = SocialLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        provider = serializer.validated_data['provider']
        social_id = serializer.validated_data['social_id']
        user_info = serializer.validated_data['user_info']
        access_token = serializer.validated_data.get('access_token')
        
        # 소셜 계정으로 사용자 찾기 또는 생성
        user = self._get_or_create_user(provider, social_id, user_info, access_token)
        
        # 마지막 로그인 시간 업데이트
        user.update_last_login()
        
        # JWT 토큰 생성
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })
    
    def _get_or_create_user(self, provider, social_id, user_info, access_token):
        """소셜 계정으로 사용자 찾기 또는 생성"""
        # 기존 소셜 계정 확인
        social_account = SocialAccount.objects.filter(
            provider=provider,
            social_id=social_id
        ).first()
        
        if social_account:
            # 기존 사용자 반환 및 토큰 업데이트
            if access_token:
                social_account.access_token = access_token
                social_account.save(update_fields=['access_token'])
            return social_account.user
        
        # 이메일로 기존 사용자 확인
        email = user_info.get('email')
        if email:
            user = User.objects.filter(email=email).first()
            if user:
                # 기존 사용자에 소셜 계정 연결
                SocialAccount.objects.create(
                    user=user,
                    provider=provider,
                    social_id=social_id,
                    access_token=access_token,
                    extra_data=user_info
                )
                return user
        
        # 새 사용자 생성
        user = User.objects.create(
            email=email or f"{social_id}@{provider}.social",
            username=user_info.get('username', social_id),
            first_name=user_info.get('first_name', ''),
            last_name=user_info.get('last_name', ''),
            profile_image_url=user_info.get('profile_image_url', ''),
            login_method=provider,
            is_verified=True,  # 소셜 로그인은 이미 검증됨
        )
        user.set_unusable_password()  # 소셜 로그인 사용자는 비밀번호 없음
        user.save()
        
        # 소셜 계정 생성
        SocialAccount.objects.create(
            user=user,
            provider=provider,
            social_id=social_id,
            access_token=access_token,
            extra_data=user_info
        )
        
        return user

class UserView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """현재 로그인한 사용자 정보 조회"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def patch(self, request):
        """사용자 정보 업데이트"""
        serializer = UserSerializer(
            request.user, 
            data=request.data, 
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request):
        """계정 삭제"""
        user = request.user
        # 삭제 전 확인 (옵션)
        password = request.data.get('password')
        if user.has_usable_password() and not user.check_password(password):
            return Response(
                {'error': '비밀번호가 일치하지 않습니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class PasswordChangeView(APIView):
    """비밀번호 변경"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        # 새 토큰 발급 (선택사항)
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': '비밀번호가 변경되었습니다.',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })


class SocialAccountView(APIView):
    """소셜 계정 관리"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """연결된 소셜 계정 목록"""
        social_accounts = SocialAccount.objects.filter(user=request.user)
        data = [
            {
                'provider': sa.provider,
                'connected_at': sa.created_at,
                'email': sa.extra_data.get('email', '')
            }
            for sa in social_accounts
        ]
        return Response(data)
    
    def delete(self, request):
        """소셜 계정 연결 해제"""
        provider = request.data.get('provider')
        
        if not provider:
            return Response(
                {'error': 'provider를 지정해주세요.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 소셜 계정 찾기
        social_account = get_object_or_404(
            SocialAccount,
            user=request.user,
            provider=provider
        )
        
        # 마지막 로그인 방법인지 확인
        if not request.user.has_usable_password() and \
           SocialAccount.objects.filter(user=request.user).count() == 1:
            return Response(
                {'error': '마지막 로그인 방법은 해제할 수 없습니다. 먼저 비밀번호를 설정해주세요.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        social_account.delete()
        return Response({'message': f'{provider} 계정 연결이 해제되었습니다.'})


class LogoutView(APIView):
    """로그아웃"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # Refresh 토큰 블랙리스트 추가 (선택사항)
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            return Response({'message': '로그아웃되었습니다.'})
        except Exception as e:
            # 블랙리스트 실패해도 로그아웃은 성공으로 처리
            return Response({'message': '로그아웃되었습니다.'})


class EmailCheckView(APIView):
    """이메일 중복 확인"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response(
                {'error': 'email을 입력해주세요.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        exists = User.objects.filter(email=email).exists()
        return Response({
            'email': email,
            'available': not exists,
            'message': '사용 가능한 이메일입니다.' if not exists else '이미 사용 중인 이메일입니다.'
        })