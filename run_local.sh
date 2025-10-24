#!/bin/bash

echo "🚀 로컬 개발 환경 시작"
echo "================================"

# 기존 프로세스 정리
echo "🧹 기존 프로세스 정리 중..."
pkill -f "python manage.py runserver" 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true
sleep 2

# 포트 확인
if lsof -ti:8000 >/dev/null 2>&1; then
    echo "❌ 포트 8000이 사용 중입니다. 다른 프로세스를 종료해주세요."
    exit 1
fi

if lsof -ti:3000 >/dev/null 2>&1; then
    echo "❌ 포트 3000이 사용 중입니다. 다른 프로세스를 종료해주세요."
    exit 1
fi

# 백엔드 서버 시작
echo "📦 Django 백엔드 시작..."
cd backend
source venv/bin/activate
export DJANGO_SETTINGS_MODULE=config.settings_local
python manage.py runserver &
BACKEND_PID=$!

# 잠시 대기
sleep 3

# 프론트엔드 서버 시작
echo "⚛️  React 프론트엔드 시작..."
cd ../web
npm start &
FRONTEND_PID=$!

echo "================================"
echo "✅ 로컬 개발 환경이 시작되었습니다!"
echo "🌐 백엔드: http://localhost:8000"
echo "🌐 프론트엔드: http://localhost:3000"
echo "================================"
echo "종료하려면 Ctrl+C를 누르세요"

# 프로세스 종료 처리
trap "echo '🛑 서버를 종료합니다...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
