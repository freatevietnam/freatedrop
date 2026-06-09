from django.contrib import admin
from .models import Drop


@admin.register(Drop)
class DropAdmin(admin.ModelAdmin):
    list_display = ("drop_id", "short_code", "user", "created_at", "updated_at")
    search_fields = ("drop_id", "short_code", "user__username")
    list_filter = ("created_at", "updated_at")
    ordering = ("-created_at",)
