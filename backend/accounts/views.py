from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import transaction
from .models import User, SocialAccount
from .serializers import (
    UserSerializer, RegisterSerializer, 
    LoginSerializer, SocialLoginSerializer
)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # JWT 토큰 생성
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data['user']
    
    # JWT 토큰 생성
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'user': UserSerializer(user).data,
        'tokens': {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
    })

@api_view(['POST'])
@permission_classes([AllowAny])
@transaction.atomic
def social_login_view(request):
    serializer = SocialLoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    provider = serializer.validated_data['provider']
    social_id = serializer.validated_data['social_id']
    user_info = serializer.validated_data['user_info']
    access_token = serializer.validated_data['access_token']
    
    # 기존 소셜 계정 확인
    try:
        social_account = SocialAccount.objects.get(
            provider=provider,
            social_id=social_id
        )
        user = social_account.user
        
        # 토큰 업데이트
        social_account.access_token = access_token
        social_account.save()
        
    except SocialAccount.DoesNotExist:
        # 이메일로 기존 사용자 확인
        email = user_info.get('email')
        if email and User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)
            # 기존 사용자에 소셜 계정 연결
            SocialAccount.objects.create(
                user=user,
                provider=provider,
                social_id=social_id,
                access_token=access_token,
                extra_data=user_info
            )
        else:
            # 새 사용자 생성
            user = User.objects.create(
                email=email,
                first_name=user_info.get('first_name', ''),
                last_name=user_info.get('last_name', ''),
                profile_image_url=user_info.get('profile_image_url', ''),
                login_method=provider,
                is_verified=user_info.get('is_verified', False),
            )
            
            # 소셜 계정 생성
            SocialAccount.objects.create(
                user=user,
                provider=provider,
                social_id=social_id,
                access_token=access_token,
                extra_data=user_info
            )
    
    # JWT 토큰 생성
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'user': UserSerializer(user).data,
        'tokens': {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def disconnect_social_account(request):
    provider = request.data.get('provider')
    
    try:
        social_account = SocialAccount.objects.get(
            user=request.user,
            provider=provider
        )
        
        # 다른 로그인 방법이 있는지 확인
        if request.user.password or SocialAccount.objects.filter(user=request.user).count() > 1:
            social_account.delete()
            return Response({'message': '소셜 계정 연동이 해제되었습니다.'})
        else:
            return Response(
                {'error': '마지막 로그인 방법은 해제할 수 없습니다.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    except SocialAccount.DoesNotExist:
        return Response(
            {'error': '연동된 소셜 계정이 없습니다.'}, 
            status=status.HTTP_404_NOT_FOUND
        )
