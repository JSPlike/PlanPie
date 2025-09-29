from django.apps import AppConfig


class CalendarsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'calendars'

    def ready(self):
        # 시그널 로드
        from . import signals  # noqa: F401
