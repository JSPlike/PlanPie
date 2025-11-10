# calendars/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'calendars', views.CalendarViewSet, basename='calendar')
router.register(r'events', views.EventViewSet, basename='event')

app_name = 'calendars'

urlpatterns = [
    
    
    # 캘린더 관련 추가 엔드포인트
    path('api/calendars/check_calendars/', 
         views.CalendarViewSet.as_view({'get': 'check_calendars'}), 
         name='check-calendars'),
    
    path('api/calendars/<uuid:pk>/stats/', 
         views.CalendarViewSet.as_view({'get': 'stats'}), 
         name='calendar-stats'),
    
    path('api/calendars/<uuid:pk>/leave/', 
         views.CalendarViewSet.as_view({'post': 'leave'}), 
         name='calendar-leave'),
    
    # 태그 관련
    path('api/calendars/<uuid:pk>/tags/', 
         views.CalendarViewSet.as_view({'get': 'tags', 'put': 'update_tags'}), 
         name='calendar-tags'),
    
    path('api/calendars/<uuid:pk>/tags/reset/', 
         views.CalendarViewSet.as_view({'post': 'reset_tags'}), 
         name='calendar-tags-reset'),
    
    # 멤버 관련
    path('api/calendars/<uuid:pk>/members/', 
         views.CalendarViewSet.as_view({'get': 'members'}), 
         name='calendar-members'),
    
    path('api/calendars/<uuid:pk>/members/<int:user_id>/', 
         views.CalendarViewSet.as_view({'delete': 'remove_member'}), 
         name='calendar-remove-member'),
    
    path('api/calendars/<uuid:pk>/change_role/', 
         views.CalendarViewSet.as_view({'post': 'change_role'}), 
         name='calendar-change-role'),
    
    # 초대 관련
    path('api/calendars/<uuid:pk>/invite/', 
         views.CalendarViewSet.as_view({'post': 'invite'}), 
         name='calendar-invite'),
    
    path('api/calendars/<uuid:pk>/invitations/', 
         views.CalendarViewSet.as_view({'get': 'invitations'}), 
         name='calendar-invitations'),
    
    path('api/calendars/<uuid:pk>/invitations/<uuid:invitation_id>/', 
         views.CalendarViewSet.as_view({'delete': 'cancel_invitation'}), 
         name='calendar-cancel-invitation'),


    #path('api/calendars/invitations/received/', views.InvitationViewSet.as_view({'get': 'received'}), name='invitations-received'),
    
    #path('api/calendars/invitations/accept/', views.InvitationViewSet.as_view({'post': 'accept'}), name='invitation-accept'),
    
    #path('api/calendars/invitations/decline/', views.InvitationViewSet.as_view({'post': 'decline'}), name='invitation-decline'),

    # 공유 링크 관련
    path('api/calendars/<uuid:pk>/share_link/', 
         views.CalendarViewSet.as_view({'get': 'share_link'}), 
         name='calendar-share-link'),
    
    path('api/calendars/<uuid:pk>/generate_share_link/', 
         views.CalendarViewSet.as_view({'post': 'generate_share_link'}), 
         name='calendar-generate-share-link'),
    
    path('api/calendars/share/', 
         views.CalendarViewSet.as_view({'get': 'get_by_share_token'}), 
         name='calendar-get-by-share-token'),
    
    path('api/calendars/join/', 
         views.CalendarViewSet.as_view({'post': 'join_by_link'}), 
         name='calendar-join'),
    
    # 이벤트 관련
    path('api/calendars/<uuid:calendar_id>/events/', 
         views.EventViewSet.as_view({'get': 'calendar_events'}), 
         name='calendar-events'),


    # Router URLs
    path('api/', include(router.urls)),     
]