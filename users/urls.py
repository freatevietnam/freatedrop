from django.urls import path

from . import views

urlpatterns = [
    path("register/", views.register_page, name="register"),
    path("login/", views.login_page, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("dashboard/", views.dashboard_page, name="dashboard"),
    path("api/auth/register/", views.register_api, name="api_register"),
    path("api/auth/login/", views.login_api, name="api_login"),
    path("api/auth/logout/", views.logout_api, name="api_logout"),
    path("api/dashboard/", views.dashboard_api, name="api_dashboard"),
]
