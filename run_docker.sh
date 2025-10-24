#!/bin/bash

echo "🐳 Docker 개발 환경 시작"
echo "================================"

# Docker Compose로 모든 서비스 시작
docker-compose -f docker-compose.dev.yml up

echo "================================"
echo "✅ Docker 개발 환경이 시작되었습니다!"
echo "🌐 백엔드: http://localhost:8000"
echo "🌐 프론트엔드: http://localhost:3000"
echo "🌐 데이터베이스: localhost:5432"
echo "================================"
