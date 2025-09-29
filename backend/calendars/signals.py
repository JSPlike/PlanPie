from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Calendar, CalendarTag, DEFAULT_TAG_COLORS, DEFAULT_TAG_NAMES


@receiver(post_save, sender=Calendar)
def create_default_tags_after_calendar_saved(sender, instance: Calendar, created: bool, **kwargs):
    """캘린더가 처음 생성될 때 기본 태그 10개를 생성한다.
    트랜잭션 커밋 이후 실행하여 누락을 방지한다.
    """
    if not created:
        return

    def _create_tags():
        # 이미 태그가 있으면 중복 생성하지 않음
        if CalendarTag.objects.filter(calendar=instance).exists():
            return
        names = DEFAULT_TAG_NAMES
        colors = DEFAULT_TAG_COLORS
        count = min(len(names), len(colors))
        CalendarTag.objects.bulk_create([
            CalendarTag(
                calendar=instance,
                name=names[index],
                color=colors[index],
                order=index,
            )
            for index in range(count)
        ])

    # 트랜잭션 커밋 후 실행
    transaction.on_commit(_create_tags)


