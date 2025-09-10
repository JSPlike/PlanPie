# calendars/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import models
from django.shortcuts import get_object_or_404
from .models import Calendar, CalendarTag, CalendarMember, Event
from .serializers import (
    CalendarSerializer,
    CalendarTagSerializer,
    CalendarMemberSerializer,
    EventSerializer,
)

class CalendarViewSet(viewsets.ModelViewSet):
    """캘린더 ViewSet"""
    serializer_class = CalendarSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """사용자가 접근 가능한 캘린더만 반환"""
        user = self.request.user
        # 소유자이거나 멤버인 캘린더
        return Calendar.objects.filter(
            models.Q(owner=user) | 
            models.Q(members__user=user)
        ).distinct()
    
    def perform_create(self, serializer):
        """캘린더 생성 시 소유자 설정"""
        serializer.save(owner=self.request.user)
    
    @action(detail=False, methods=['get'])
    def check_calendars(self, request):
        """캘린더 존재 여부 확인"""
        calendars = self.get_queryset()
        owned_count = calendars.filter(owner=request.user).count()
        member_count = calendars.exclude(owner=request.user).count()
        
        return Response({
            'has_calendars': calendars.exists(),
            'owned_count': owned_count,
            'member_count': member_count,
        })
    
    @action(detail=True, methods=['get'])
    def tags(self, request, pk=None):
        """캘린더 태그 조회"""
        calendar = self.get_object()
        tags = calendar.tags.all().order_by('order')
        serializer = CalendarTagSerializer(tags, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['put'])
    def update_tags(self, request, pk=None):
        """캘린더 태그 업데이트"""
        calendar = self.get_object()
        
        # 관리자 권한 확인
        if not calendar.is_admin(request.user):
            return Response(
                {'error': '권한이 없습니다.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        tags_data = request.data.get('tags', [])
        
        for tag_data in tags_data:
            tag_id = tag_data.get('id')
            if tag_id:
                tag = CalendarTag.objects.filter(id=tag_id, calendar=calendar).first()
                if tag:
                    tag.name = tag_data.get('name', tag.name)
                    tag.color = tag_data.get('color', tag.color)
                    tag.order = tag_data.get('order', tag.order)
                    tag.save()
        
        tags = calendar.tags.all().order_by('order')
        serializer = CalendarTagSerializer(tags, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """캘린더 멤버 조회"""
        calendar = self.get_object()
        members = calendar.members.all()
        serializer = CalendarMemberSerializer(members, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def events(self, request, pk=None):
        """캘린더 이벤트 조회"""
        calendar = self.get_object()
        events = calendar.events.all()
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data)


class EventViewSet(viewsets.ModelViewSet):
    """이벤트 ViewSet"""
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """사용자가 접근 가능한 이벤트만 반환"""
        user = self.request.user
        return Event.objects.filter(
            calendar__in=Calendar.objects.filter(
                models.Q(owner=user) | 
                models.Q(members__user=user)
            )
        ).distinct()
    
    def perform_create(self, serializer):
        """이벤트 생성 시 생성자 설정"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def calendar_events(self, request):
        """특정 캘린더의 이벤트 조회"""
        calendar_id = request.query_params.get('calendar_id')
        if not calendar_id:
            return Response(
                {'error': 'calendar_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        events = self.get_queryset().filter(calendar_id=calendar_id)
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)
