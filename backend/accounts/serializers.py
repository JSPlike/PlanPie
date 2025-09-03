from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, SocialAccount
import requests
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 
                 'profile_image', 'profile_image_url', 'birth_date', 
                 'phone_number', 'login_method', 'is_verified', 'date_joined')
        read_only_fields = ('id', 'date_joined', 'login_method')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('email', 'username', 'password', 'password2', 'first_name', 'last_name')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "비밀번호가 일치하지 않습니다."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        if email and password:
            user = authenticate(email=email, password=password)
            if not user:
                raise serializers.ValidationError('이메일 또는 비밀번호가 올바르지 않습니다.')
        else:
            raise serializers.ValidationError('이메일과 비밀번호를 입력해주세요.')

        data['user'] = user
        return data

class SocialLoginSerializer(serializers.Serializer):
    provider = serializers.ChoiceField(choices=['google', 'kakao'])
    access_token = serializers.CharField()

    def validate_google_token(self, token):
        try:
            # Google OAuth2 토큰 검증
            idinfo = id_token.verify_oauth2_token(
                token, 
                google_requests.Request(), 
                settings.GOOGLE_CLIENT_ID
            )
            
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')
                
            return {
                'social_id': idinfo['sub'],
                'email': idinfo.get('email'),
                'first_name': idinfo.get('given_name', ''),
                'last_name': idinfo.get('family_name', ''),
                'profile_image_url': idinfo.get('picture', ''),
                'is_verified': idinfo.get('email_verified', False),
            }
        except ValueError:
            raise serializers.ValidationError('유효하지 않은 Google 토큰입니다.')

    def validate_kakao_token(self, token):
        try:
            # Kakao 토큰 검증
            response = requests.get(
                'https://kapi.kakao.com/v2/user/me',
                headers={'Authorization': f'Bearer {token}'}
            )
            
            if response.status_code != 200:
                raise ValueError('Invalid token')
                
            user_info = response.json()
            kakao_account = user_info.get('kakao_account', {})
            profile = kakao_account.get('profile', {})
            
            return {
                'social_id': str(user_info['id']),
                'email': kakao_account.get('email'),
                'first_name': profile.get('nickname', ''),
                'profile_image_url': profile.get('profile_image_url', ''),
                'is_verified': kakao_account.get('is_email_verified', False),
            }
        except Exception:
            raise serializers.ValidationError('유효하지 않은 Kakao 토큰입니다.')

    def validate(self, attrs):
        provider = attrs['provider']
        access_token = attrs['access_token']
        
        if provider == 'google':
            user_info = self.validate_google_token(access_token)
        elif provider == 'kakao':
            user_info = self.validate_kakao_token(access_token)
        else:
            raise serializers.ValidationError('지원하지 않는 소셜 로그인 제공자입니다.')
        
        attrs['user_info'] = user_info
        attrs['social_id'] = user_info['social_id']
        return attrs