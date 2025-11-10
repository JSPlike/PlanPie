#!/bin/bash

# PlanPie 개발 서버 종료 스크립트

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 스크립트 위치 확인
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${YELLOW}PlanPie 개발 서버 종료 중...${NC}"

# PID 파일에서 프로세스 ID 읽기
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if ps -p $BACKEND_PID > /dev/null; then
        echo -e "${GREEN}백엔드 서버 종료 중 (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID 2>/dev/null
        sleep 1
        if ps -p $BACKEND_PID > /dev/null; then
            kill -9 $BACKEND_PID 2>/dev/null
        fi
        echo -e "${GREEN}✓ 백엔드 서버 종료됨${NC}"
    else
        echo -e "${YELLOW}백엔드 서버가 실행 중이 아닙니다${NC}"
    fi
    rm -f logs/backend.pid
else
    echo -e "${YELLOW}백엔드 PID 파일을 찾을 수 없습니다${NC}"
fi

if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null; then
        echo -e "${GREEN}프론트엔드 서버 종료 중 (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID 2>/dev/null
        sleep 1
        # React 개발 서버는 자식 프로세스도 종료해야 함
        pkill -P $FRONTEND_PID 2>/dev/null
        if ps -p $FRONTEND_PID > /dev/null; then
            kill -9 $FRONTEND_PID 2>/dev/null
        fi
        echo -e "${GREEN}✓ 프론트엔드 서버 종료됨${NC}"
    else
        echo -e "${YELLOW}프론트엔드 서버가 실행 중이 아닙니다${NC}"
    fi
    rm -f logs/frontend.pid
else
    echo -e "${YELLOW}프론트엔드 PID 파일을 찾을 수 없습니다${NC}"
fi

# 남아있는 프로세스 확인 및 종료
REMAINING_BACKEND=$(ps aux | grep "manage.py runserver" | grep -v grep | awk '{print $2}')
if [ ! -z "$REMAINING_BACKEND" ]; then
    echo -e "${RED}남아있는 백엔드 프로세스 종료 중...${NC}"
    echo $REMAINING_BACKEND | xargs kill 2>/dev/null
fi

REMAINING_FRONTEND=$(ps aux | grep "react-scripts start" | grep -v grep | awk '{print $2}')
if [ ! -z "$REMAINING_FRONTEND" ]; then
    echo -e "${RED}남아있는 프론트엔드 프로세스 종료 중...${NC}"
    echo $REMAINING_FRONTEND | xargs kill 2>/dev/null
fi

echo -e "${GREEN}서버 종료 완료!${NC}"

