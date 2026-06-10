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

handler404 = "django.views.defaults.page_not_found"
handler500 = "django.views.defaults.server_error"
handler403 = "django.views.defaults.permission_denied"
handler400 = "django.views.defaults.bad_request"
