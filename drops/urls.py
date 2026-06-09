from django.urls import path

from . import views

urlpatterns = [
    path("api/drops/create/", views.create_drop_api, name="api_create_drop"),
    path("api/drops/<str:drop_id>/", views.drop_detail_api, name="api_drop_detail"),
    path("api/drops/<str:drop_id>/access/", views.drop_password_access_api, name="api_drop_password_access"),
    path("api/drops/<str:drop_id>/shorten/", views.shorten_drop_api, name="api_shorten_drop"),
    path("s/<str:short_code>/", views.short_redirect, name="short_redirect"),
    path("<str:drop_id>/raw", views.raw_drop_view, name="raw_drop"),
    path("<str:drop_id>/edit", views.edit_drop_page, name="edit_drop"),
    path("<str:drop_id>/", views.view_drop_page, name="view_drop"),
]
