# PlanPie
PlanPie 캘린더 애플리케이션 (Django + React + React Native)

## 🚀 개발 환경 실행 방법

### 방법 1: 로컬 개발 환경 (권장)
```bash
# 로컬 PostgreSQL 필요
brew install postgresql
brew services start postgresql

# 데이터베이스 생성
createdb plan_pie_db

# 로컬 개발 환경 실행
./run_local.sh
```

### 방법 2: Docker 개발 환경
```bash
# Docker 개발 환경 실행
./run_docker.sh
```

## 📁 프로젝트 구조
```
PlanPie/
├── backend/          # Django 백엔드
├── web/             # React 웹 프론트엔드
├── mobile/          # React Native 모바일 앱
├── run_local.sh     # 로컬 개발 실행 스크립트
├── run_docker.sh    # Docker 개발 실행 스크립트
└── docker-compose.dev.yml  # Docker 개발 설정
```

## 🔧 환경별 설정

### 로컬 개발 환경
- **백엔드**: `http://localhost:8000`
- **프론트엔드**: `http://localhost:3000`
- **데이터베이스**: 로컬 PostgreSQL
- **설정 파일**: `backend/config/settings_local.py`

### Docker 개발 환경
- **백엔드**: `http://localhost:8000`
- **프론트엔드**: `http://localhost:3000`
- **데이터베이스**: Docker PostgreSQL
- **설정 파일**: `backend/config/settings_docker.py`

## 🗄️ 데이터베이스 마이그레이션

### 로컬 환경
```bash
cd backend
source venv/bin/activate
export DJANGO_SETTINGS_MODULE=config.settings_local
python manage.py makemigrations
python manage.py migrate
```

### Docker 환경
```bash
docker-compose -f docker-compose.dev.yml exec backend python manage.py makemigrations
docker-compose -f docker-compose.dev.yml exec backend python manage.py migrate
```

## 🛑 서버 종료

### 로컬 환경
- `Ctrl+C` 또는 터미널에서 프로세스 종료

### Docker 환경
```bash
docker-compose -f docker-compose.dev.yml down
```


