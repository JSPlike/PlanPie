"""
Docker 개발 환경 설정
"""
from .settings import *

# Docker용 데이터베이스 설정
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'plan_pie_db',
        'USER': 'postgres',
        'PASSWORD': 'postgres',
        'HOST': 'db',  # Docker 컨테이너명
        'PORT': '5432'
    }
}

# Docker용 CORS 설정
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React 웹
    "http://localhost:8081",  # React Native
]

# Docker용 Redis 설정
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": "redis://redis:6379/1",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        }
    }
}

# Docker용 프론트엔드 URL
FRONTEND_URL = 'http://localhost:3000'

print("🐳 Docker 개발 환경 설정이 로드되었습니다.")
