from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.models import User
from django.db import models


class Drop(models.Model):
    drop_id = models.CharField(max_length=32, unique=True, db_index=True)
    content = models.TextField()
    edit_token = models.TextField()
    access_password = models.CharField(max_length=256, blank=True, default="")
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="drops",
    )
    short_code = models.CharField(max_length=8, unique=True, db_index=True, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.drop_id

    @property
    def title(self) -> str:
        first_line = next((line.strip() for line in self.content.splitlines() if line.strip()), "Untitled Drop")
        return first_line[:80]

    @property
    def cookie_name(self) -> str:
        return f"drop_token_{self.drop_id}"

    @property
    def password_cookie_name(self) -> str:
        return f"drop_pass_{self.drop_id}"

    @property
    def has_password(self) -> bool:
        return bool(self.access_password)

    def set_access_password(self, raw_password: str) -> None:
        self.access_password = make_password(raw_password)

    def clear_access_password(self) -> None:
        self.access_password = ""

    def check_access_password(self, raw_password: str) -> bool:
        if not self.access_password:
            return True
        if not raw_password:
            return False
        return check_password(raw_password, self.access_password)
