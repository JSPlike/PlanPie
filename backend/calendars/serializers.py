from rest_framework import serializers
from .models import Calendar, CalendarMember, Event, CalendarInvitation, CalendarTag
from accounts.serializers import UserSerializer

class CalendarTagSerializer(serializers.ModelSerializer):
    """캘린더 태그 시리얼라이저"""
    class Meta:
        model = CalendarTag
        fields = [
            'id', 'calendar', 'name', 'color', 'order', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'calendar', 'created_at', 'updated_at']

class CalendarMemberSerializer(serializers.ModelSerializer):
    """캘린더 멤버 시리얼라이저"""
    user = UserSerializer(read_only=True)
    user_email = serializers.EmailField(write_only=True, required=False)
    
    class Meta:
        model = CalendarMember
        fields = ['id', 'user', 'user_email', 'role', 'joined_at']
        read_only_fields = ['id', 'user', 'joined_at']


class CalendarSerializer(serializers.ModelSerializer):
    """캘린더 시리얼라이저"""
    owner = UserSerializer(read_only=True)
    members = CalendarMemberSerializer(many=True, read_only=True)
    tags = CalendarTagSerializer(many=True, read_only=True)
    member_count = serializers.SerializerMethodField()
    event_count = serializers.SerializerMethodField()
    share_url = serializers.SerializerMethodField()
    is_admin = serializers.SerializerMethodField()
    can_leave = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()

    class Meta:
        model = Calendar
        fields = [
            'id', 'name', 'description', 'calendar_type', 
            'image', 'color', 'owner',
            'members', 'tags', 'member_count', 'event_count', 
            'share_url', 'share_token', 
            'is_admin', 'can_leave', 'can_delete',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'owner', 'share_token', 'created_at', 'updated_at']

    def get_member_count(self, obj):
        """멤버 수 (소유자 포함)"""
        return 1 + obj.members.count()

    def get_event_count(self, obj):
        """일정 수"""
        return obj.events.count()

    def get_share_url(self, obj):
        """공유 URL"""
        return obj.get_share_url()

    def get_is_admin(self, obj):
        """현재 사용자가 관리자인지"""
        request = self.context.get('request')
        if request and request.user:
            return obj.is_admin(request.user)
        return False

    def get_can_leave(self, obj):
        """현재 사용자가 나갈 수 있는지"""
        request = self.context.get('request')
        if request and request.user:
            return obj.can_leave(request.user)
        return False

    def get_can_delete(self, obj):
        """현재 사용자가 삭제할 수 있는지"""
        request = self.context.get('request')
        if request and request.user:
            return obj.can_delete(request.user)
        return False


class CalendarInvitationSerializer(serializers.ModelSerializer):
    """캘린더 초대 시리얼라이저"""
    calendar = CalendarSerializer(read_only=True)
    inviter = UserSerializer(read_only=True)
    
    class Meta:
        model = CalendarInvitation
        fields = [
            'id', 'calendar', 'inviter', 'invitee_email', 
            'role', 'status', 'message', 
            'invitation_token', 'expires_at',
            'created_at', 'responded_at'
        ]
        read_only_fields = [
            'id', 'calendar', 'inviter', 'status', 
            'invitation_token', 'created_at', 'responded_at'
        ]


class SendInvitationSerializer(serializers.Serializer):
    """초대 발송 시리얼라이저"""
    emails = serializers.ListField(
        child=serializers.EmailField(),
        min_length=1,
        max_length=10,
        help_text="초대할 이메일 목록"
    )
    role = serializers.ChoiceField(
        choices=CalendarMember.ROLE_CHOICES,
        default='member',
        help_text="부여할 역할"
    )
    message = serializers.CharField(
        required=False, 
        allow_blank=True,
        help_text="초대 메시지"
    )


class EventSerializer(serializers.ModelSerializer):
    """일정 시리얼라이저"""
    created_by = UserSerializer(read_only=True)
    calendar_name = serializers.CharField(source='calendar.name', read_only=True)
    tag = CalendarTagSerializer(read_only=True)
    tag_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    color = serializers.ReadOnlyField()
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id', 'calendar', 'calendar_name', 
            'title', 'description', 'location',
            'tag', 'tag_id', 'color',
            'start_date', 'end_date', 'all_day',
            'created_by', 'can_edit', 'can_delete',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'color', 'created_at', 'updated_at']

    def validate_tag_id(self, value):
        """태그가 해당 캘린더의 태그인지 확인"""
        if value:
            calendar_id = self.initial_data.get('calendar')
            if not CalendarTag.objects.filter(
                id=value,
                calendar_id=calendar_id
            ).exists():
                raise serializers.ValidationError("유효하지 않은 태그입니다.")
        return value

    def get_can_edit(self, obj):
        """현재 사용자가 수정할 수 있는지"""
        request = self.context.get('request')
        if request and request.user:
            return obj.can_edit(request.user)
        return False

    def get_can_delete(self, obj):
        """현재 사용자가 삭제할 수 있는지"""
        request = self.context.get('request')
        if request and request.user:
            return obj.can_delete(request.user)
        return False

    def validate(self, data):
        """캘린더 멤버인지 확인"""
        request = self.context.get('request')
        if request and request.user:
            calendar = data.get('calendar') or self.instance.calendar if self.instance else None
            if calendar and not calendar.can_edit_event(request.user):
                raise serializers.ValidationError("이 캘린더에 일정을 추가/수정할 권한이 없습니다.")
        
        # 시작 시간과 종료 시간 검증
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError("종료 시간은 시작 시간 이후여야 합니다.")
        
        return data

    def create(self, validated_data):
        """일정 생성"""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class CreateEventSerializer(serializers.ModelSerializer):
    """일정 생성 전용 시리얼라이저"""
    class Meta:
        model = Event
        fields = [
            'calendar', 'title', 'description', 'location',
            'start_date', 'end_date', 'all_day', 'color'
        ]

    def validate(self, data):
        """권한 및 데이터 검증"""
        request = self.context.get('request')
        if request and request.user:
            calendar = data.get('calendar')
            if not calendar.can_edit_event(request.user):
                raise serializers.ValidationError("이 캘린더에 일정을 추가할 권한이 없습니다.")
        
        # 시작 시간과 종료 시간 검증
        if data['start_date'] > data['end_date']:
            raise serializers.ValidationError("종료 시간은 시작 시간 이후여야 합니다.")
        
        return data

    def create(self, validated_data):
        """일정 생성"""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class UpdateEventSerializer(serializers.ModelSerializer):
    """일정 수정 전용 시리얼라이저"""
    class Meta:
        model = Event
        fields = [
            'title', 'description', 'location',
            'start_date', 'end_date', 'all_day', 'color'
        ]

    def validate(self, data):
        """권한 및 데이터 검증"""
        request = self.context.get('request')
        if request and request.user and self.instance:
            if not self.instance.can_edit(request.user):
                raise serializers.ValidationError("이 일정을 수정할 권한이 없습니다.")
        
        # 시작 시간과 종료 시간 검증
        start_date = data.get('start_date', self.instance.start_date if self.instance else None)
        end_date = data.get('end_date', self.instance.end_date if self.instance else None)
        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError("종료 시간은 시작 시간 이후여야 합니다.")
        
        return data

class UpdateTagsSerializer(serializers.Serializer):
    """태그 일괄 업데이트 시리얼라이저"""
    tags = serializers.ListField(
        child=serializers.DictField(),
        help_text="태그 업데이트 정보 목록"
    )
    
    def validate_tags(self, value):
        for tag_info in value:
            if 'id' not in tag_info:
                raise serializers.ValidationError("각 태그는 id를 포함해야 합니다.")
            if 'name' not in tag_info:
                raise serializers.ValidationError("각 태그는 name을 포함해야 합니다.")
        return value

class AcceptInvitationSerializer(serializers.Serializer):
    """초대 수락 시리얼라이저"""
    token = serializers.CharField(required=True, help_text="초대 토큰")


class ChangeRoleSerializer(serializers.Serializer):
    """멤버 역할 변경 시리얼라이저"""
    user_id = serializers.UUIDField(required=True, help_text="사용자 ID")
    role = serializers.ChoiceField(
        choices=CalendarMember.ROLE_CHOICES,
        required=True,
        help_text="새 역할"
    )


class CalendarStatsSerializer(serializers.Serializer):
    """캘린더 통계 시리얼라이저"""
    total_events = serializers.IntegerField()
    upcoming_events = serializers.IntegerField()
    past_events = serializers.IntegerField()
    total_members = serializers.IntegerField()
    admins = serializers.IntegerField()
    members = serializers.IntegerField()
