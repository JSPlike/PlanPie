from rest_framework import serializers
from .models import Calendar, CalendarShare, Event, EventAttendee, CalendarInvitation
from accounts.serializers import UserSerializer

class CalendarSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    shares = serializers.SerializerMethodField()
    event_count = serializers.SerializerMethodField()
    share_url = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = Calendar
        fields = [
            'id', 'name', 'description', 'calendar_type', 
            'image', 'icon', 'color', 'owner', 'is_public',
            'shares', 'event_count', 'share_url', 'share_token',
            'is_owner', 'can_edit', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'owner', 'share_token', 'created_at', 'updated_at']

    def get_shares(self, obj):
        shares = obj.shares.all()
        return CalendarShareSerializer(shares, many=True).data

    def get_event_count(self, obj):
        return obj.events.count()

    def get_share_url(self, obj):
        return obj.get_share_url()

    def get_is_owner(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.owner == request.user
        return False

    def get_can_edit(self, obj):
        request = self.context.get('request')
        if request and request.user:
            if obj.owner == request.user:
                return True
            share = obj.shares.filter(user=request.user).first()
            if share:
                return share.permission in ['edit', 'admin']
        return False


class CalendarInvitationSerializer(serializers.ModelSerializer):
    calendar = CalendarSerializer(read_only=True)
    inviter = UserSerializer(read_only=True)
    
    class Meta:
        model = CalendarInvitation
        fields = [
            'id', 'calendar', 'inviter', 'invitee_email', 
            'permission', 'status', 'message', 
            'created_at', 'expires_at'
        ]
        read_only_fields = ['id', 'calendar', 'inviter', 'status', 'created_at']


class SendInvitationSerializer(serializers.Serializer):
    emails = serializers.ListField(
        child=serializers.EmailField(),
        min_length=1,
        max_length=10
    )
    permission = serializers.ChoiceField(choices=CalendarShare.PERMISSION_CHOICES)
    message = serializers.CharField(required=False, allow_blank=True)
