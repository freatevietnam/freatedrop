from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.urls import reverse
from django.shortcuts import redirect, render
from django.views.decorators.http import require_GET, require_POST

from drops.models import Drop
from drops.views import get_editable_cookie_drops
from .forms import LoginForm, RegistrationForm

User = get_user_model()


def wants_json_response(request):
    accept = request.headers.get("Accept", "")
    requested_with = request.headers.get("X-Requested-With", "")
    return "application/json" in accept or requested_with == "XMLHttpRequest"


def get_drop_cookie_names(request):
    return [
        cookie_name
        for cookie_name in request.COOKIES
        if cookie_name.startswith("drop_token_") or cookie_name.startswith("drop_pass_")
    ]


def claim_editable_drops_for_user(request, user):
    editable_drops, _ = get_editable_cookie_drops(request)
    for drop in editable_drops:
        if drop.user_id is None:
            drop.user = user
            drop.save(update_fields=["user", "updated_at"])


@require_GET
def register_page(request):
    if request.user.is_authenticated:
        return redirect("dashboard")
    return render(request, "users/register.html", {"form": RegistrationForm()})


@require_GET
def login_page(request):
    if request.user.is_authenticated:
        return redirect("dashboard")
    return render(request, "users/login.html", {"form": LoginForm(request=request)})


@require_POST
def register_api(request):
    form = RegistrationForm(request.POST)
    if not form.is_valid():
        if wants_json_response(request):
            return JsonResponse({"success": False, "errors": form.errors}, status=400)
        return render(request, "users/register.html", {"form": form}, status=400)

    user = User.objects.create_user(
        username=form.cleaned_data["username"],
        email=form.cleaned_data["email"],
        password=form.cleaned_data["password"],
    )
    login(request, user)
    claim_editable_drops_for_user(request, user)
    redirect_url = reverse("dashboard")
    if wants_json_response(request):
        return JsonResponse({
            "success": True,
            "user": {"username": user.username, "email": user.email},
            "redirect_url": redirect_url,
        })
    return redirect(redirect_url)


@require_POST
def login_api(request):
    form = LoginForm(request=request, data=request.POST)
    if not form.is_valid():
        if wants_json_response(request):
            return JsonResponse({"success": False, "errors": form.errors}, status=400)
        return render(request, "users/login.html", {"form": form}, status=400)

    user = form.get_user()
    login(request, user)
    claim_editable_drops_for_user(request, user)
    redirect_url = reverse("dashboard")
    if wants_json_response(request):
        return JsonResponse({
            "success": True,
            "user": {"username": user.username, "email": user.email},
            "redirect_url": redirect_url,
        })
    return redirect(redirect_url)


@require_POST
def logout_api(request):
    cookie_names = get_drop_cookie_names(request)
    logout(request)
    response = JsonResponse({"success": True, "redirect_url": "/"})
    for cookie_name in cookie_names:
        response.delete_cookie(cookie_name, path="/")
    return response


@require_POST
def logout_view(request):
    cookie_names = get_drop_cookie_names(request)
    logout(request)
    response = redirect("home")
    for cookie_name in cookie_names:
        response.delete_cookie(cookie_name, path="/")
    return response


@login_required
@require_GET
def dashboard_page(request):
    drops = request.user.drops.all()
    return render(request, "users/dashboard.html", {"drops": drops})


@login_required
@require_GET
def dashboard_api(request):
    drops = [
        {
            "drop_id": drop.drop_id,
            "title": drop.title,
            "created_at": drop.created_at.isoformat(),
            "updated_at": drop.updated_at.isoformat(),
            "short_code": drop.short_code,
            "view_url": f"/{drop.drop_id}/",
            "edit_url": f"/{drop.drop_id}/edit",
        }
        for drop in request.user.drops.all()
    ]
    return JsonResponse({"success": True, "drops": drops})
