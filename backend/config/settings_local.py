"""
로컬 개발 환경 설정
"""
from .settings import *

# 로컬 개발용 데이터베이스 설정
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'plan_pie_db',
        'USER': 'postgres',
        'PASSWORD': 'postgres',
        'HOST': '127.0.0.1',  # 로컬 PostgreSQL
        'PORT': '5432'
    }
}

# 로컬 개발용 CORS 설정
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React 웹
    "http://localhost:8081",  # React Native
]

# 로컬 개발용 Redis 설정 (선택사항)
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "unique-snowflake",
    }
}

# 로컬 개발용 정적 파일 설정
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# 로컬 개발용 프론트엔드 URL
FRONTEND_URL = 'http://localhost:3000'

print("🔧 로컬 개발 환경 설정이 로드되었습니다.")
