from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, SocialAccount

class SocialAccountInline(admin.TabularInline):
    model = SocialAccount
    extra = 0
    readonly_fields = ('provider', 'social_id', 'created_at')

class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ('email', 'username', 'first_name', 'last_name', 'login_method', 'is_active', 'date_joined')
    list_filter = ('is_staff', 'is_active', 'is_verified', 'login_method', 'date_joined')
    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        ('개인정보', {'fields': ('first_name', 'last_name', 'phone_number', 'birth_date', 'gender')}),
        ('프로필', {'fields': ('profile_image', 'profile_image_url', 'bio')}),
        ('로그인 정보', {'fields': ('login_method',)}),
        ('권한', {'fields': ('is_staff', 'is_active', 'is_verified', 'groups', 'user_permissions')}),
        ('동의 여부', {'fields': ('is_marketing_agreed', 'is_terms_agreed', 'is_privacy_agreed')}),
        ('중요한 날짜', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2', 'login_method', 'is_staff', 'is_active')}
        ),
    )
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    inlines = [SocialAccountInline]

@admin.register(SocialAccount)
class SocialAccountAdmin(admin.ModelAdmin):
    list_display = ('user', 'provider', 'social_id', 'created_at')
    list_filter = ('provider', 'created_at')
    search_fields = ('user__email', 'user__username', 'social_id')

admin.site.register(User, CustomUserAdmin)
