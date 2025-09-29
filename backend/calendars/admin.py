from django.contrib import admin
from .models import Calendar, CalendarTag, CalendarMember, Event


class CalendarTagInline(admin.TabularInline):
    model = CalendarTag
    extra = 0
    fields = ("name", "color", "order", "created_at", "updated_at")
    readonly_fields = ("created_at", "updated_at")


@admin.register(Calendar)
class CalendarAdmin(admin.ModelAdmin):
    list_display = ("name", "calendar_type", "owner", "created_at", "updated_at")
    list_filter = ("calendar_type", "created_at")
    search_fields = ("name", "description", "owner__email")
    inlines = [CalendarTagInline]


@admin.register(CalendarTag)
class CalendarTagAdmin(admin.ModelAdmin):
    list_display = ("name", "calendar", "color", "order", "created_at", "updated_at")
    list_filter = ("calendar",)
    search_fields = ("name",)


@admin.register(CalendarMember)
class CalendarMemberAdmin(admin.ModelAdmin):
    list_display = ("calendar", "user", "role", "joined_at")
    list_filter = ("role",)
    search_fields = ("calendar__name", "user__email")


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "calendar", "start_date", "end_date", "all_day")
    list_filter = ("calendar", "all_day")
    search_fields = ("title", "calendar__name")
