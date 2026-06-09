from django.contrib import admin
from django.urls import include, path

from drops.views import editor_page, home_page

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", home_page, name="home"),
    path("editor/", editor_page, name="editor"),
    path("new/", editor_page, name="new_drop"),
    path("", include("users.urls")),
    path("", include("drops.urls")),
]
