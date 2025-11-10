#!/bin/bash

# PlanPie 개발 서버 실행 스크립트
# 백엔드(Django)와 프론트엔드(React) 서버를 동시에 실행합니다.

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 스크립트 위치 확인
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 현재 로컬 IP 주소 감지
get_local_ip() {
    # macOS/Linux에서 로컬 IP 주소 가져오기
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
    else
        # Linux
        LOCAL_IP=$(hostname -I | awk '{print $1}')
    fi
    
    # IP를 찾지 못한 경우 기본값
    if [ -z "$LOCAL_IP" ]; then
        LOCAL_IP="localhost"
    fi
    
    echo "$LOCAL_IP"
}

LOCAL_IP=$(get_local_ip)

# 기존 프로세스 정리
echo -e "${YELLOW}기존 프로세스 정리 중...${NC}"
pkill -f "manage.py runserver" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true
sleep 2

# 포트 확인
if lsof -ti:8000 >/dev/null 2>&1; then
    echo -e "${YELLOW}포트 8000이 사용 중입니다. 기존 프로세스를 종료합니다...${NC}"
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

if lsof -ti:3000 >/dev/null 2>&1; then
    echo -e "${YELLOW}포트 3000이 사용 중입니다. 기존 프로세스를 종료합니다...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}PlanPie 개발 서버 시작${NC}"
echo -e "${GREEN}========================================${NC}"

# 백엔드 서버 실행
echo -e "${BLUE}백엔드 서버 시작 중...${NC}"
cd backend

# 가상환경 활성화 (있는 경우)
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d "../venv" ]; then
    source ../venv/bin/activate
fi

python manage.py runserver 0.0.0.0:8000 > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}백엔드 서버 시작됨 (PID: $BACKEND_PID)${NC}"
echo -e "${YELLOW}백엔드 로그: logs/backend.log${NC}"

# 프론트엔드 서버 실행
echo -e "${BLUE}프론트엔드 서버 시작 중...${NC}"
cd ../web
# React 개발 서버를 네트워크에서 접근 가능하도록 설정
DANGEROUSLY_DISABLE_HOST_CHECK=true HOST=0.0.0.0 PORT=3000 npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}프론트엔드 서버 시작됨 (PID: $FRONTEND_PID)${NC}"
echo -e "${YELLOW}프론트엔드 로그: logs/frontend.log${NC}"

# 로그 디렉토리 생성
mkdir -p ../logs

# PID 파일 저장
echo $BACKEND_PID > ../logs/backend.pid
echo $FRONTEND_PID > ../logs/frontend.pid

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}서버 실행 완료!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${BLUE}백엔드: http://localhost:8000${NC}"
echo -e "${BLUE}프론트엔드: http://localhost:3000${NC}"
echo ""
echo -e "${GREEN}핸드폰에서 접속:${NC}"
echo -e "${BLUE}  http://${LOCAL_IP}:3000${NC}"
echo -e "${YELLOW}현재 로컬 IP: ${LOCAL_IP}${NC}"
echo ""
echo -e "${YELLOW}⚠️  같은 와이파이에 연결되어 있어야 합니다!${NC}"
echo ""
echo -e "${YELLOW}서버를 중지하려면: ./stop_dev.sh${NC}"
echo -e "${YELLOW}또는 PID 파일을 확인하여 kill 명령 사용${NC}"
echo ""

# 프로세스 종료 핸들러
cleanup() {
    echo ""
    echo -e "${YELLOW}서버 종료 중...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    rm -f ../logs/backend.pid ../logs/frontend.pid
    echo -e "${GREEN}서버 종료 완료${NC}"
    exit 0
}

# SIGINT (Ctrl+C) 핸들러 등록
trap cleanup SIGINT SIGTERM

# 서버가 실행 중인지 확인
echo -e "${BLUE}서버 상태 확인 중...${NC}"
sleep 3

if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✓ 백엔드 서버 실행 중${NC}"
else
    echo -e "${YELLOW}⚠ 백엔드 서버 시작 실패 (로그 확인: logs/backend.log)${NC}"
fi

if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✓ 프론트엔드 서버 실행 중${NC}"
else
    echo -e "${YELLOW}⚠ 프론트엔드 서버 시작 실패 (로그 확인: logs/frontend.log)${NC}"
fi

echo ""
echo -e "${YELLOW}서버를 종료하려면 Ctrl+C를 누르세요${NC}"
echo ""

# 서버가 종료될 때까지 대기
wait

