import json

from django.http import Http404, HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_http_methods, require_POST

from .models import Drop
from .utils import (
    PASSWORD_ACCESS_TTL_SECONDS,
    create_password_access_token,
    decrypt_token,
    encrypt_token,
    generate_drop_id,
    generate_edit_token,
    generate_short_code,
    is_valid_drop_password,
    validate_password_access_token,
)


PASSWORD_RULES_MESSAGE = (
    "Password may contain only uppercase letters, lowercase letters, numbers, and special characters."
)


def is_valid_drop_id(value: str) -> bool:
    return len(value) == 32 and value.isalnum()


def get_drop_or_404(drop_id: str) -> Drop:
    if not is_valid_drop_id(drop_id):
        raise Http404("Drop not found")
    return get_object_or_404(Drop, drop_id=drop_id)


def user_can_manage_drop(request, drop: Drop) -> bool:
    if request.user.is_authenticated and drop.user_id == request.user.id:
        return True

    cookie_token = request.COOKIES.get(drop.cookie_name)
    if not cookie_token:
        return False

    stored_token = decrypt_token(drop.edit_token)
    return bool(stored_token and stored_token == cookie_token)


def user_has_valid_password_cookie(request, drop: Drop) -> bool:
    password_cookie = request.COOKIES.get(drop.password_cookie_name)
    return bool(
        password_cookie
        and validate_password_access_token(password_cookie, drop.drop_id, drop.access_password)
    )


def user_can_access_drop(request, drop: Drop) -> bool:
    if not drop.has_password or user_can_manage_drop(request, drop):
        return True

    return user_has_valid_password_cookie(request, drop)


def get_editable_cookie_drops(request):
    editable_drops = []
    stale_cookie_names = []

    for cookie_name, cookie_value in request.COOKIES.items():
        if not cookie_name.startswith("drop_token_"):
            continue

        drop_id = cookie_name.removeprefix("drop_token_")
        if not is_valid_drop_id(drop_id):
            stale_cookie_names.append(cookie_name)
            continue

        drop = Drop.objects.filter(drop_id=drop_id).first()
        if not drop:
            stale_cookie_names.append(cookie_name)
            continue

        if drop.user_id and not request.user.is_authenticated:
            stale_cookie_names.append(cookie_name)
            continue

        if request.user.is_authenticated and drop.user_id == request.user.id:
            stale_cookie_names.append(cookie_name)
            continue

        stored_token = decrypt_token(drop.edit_token)
        if not stored_token or stored_token != cookie_value:
            stale_cookie_names.append(cookie_name)
            continue

        editable_drops.append(drop)

    return editable_drops, stale_cookie_names


def attach_cookie_cleanup(response, stale_cookie_names):
    for cookie_name in stale_cookie_names:
        response.delete_cookie(cookie_name, path="/")
    return response


def create_unique_drop_id() -> str:
    while True:
        drop_id = generate_drop_id()
        if not Drop.objects.filter(drop_id=drop_id).exists():
            return drop_id


def create_unique_short_code() -> str:
    while True:
        short_code = generate_short_code()
        if not Drop.objects.filter(short_code=short_code).exists():
            return short_code


def normalize_optional_password(value: str | None) -> str:
    return (value or "").strip()


def set_drop_password_cookie(response, drop: Drop, password: str):
    response.set_cookie(
        drop.password_cookie_name,
        create_password_access_token(drop.drop_id, drop.access_password),
        max_age=PASSWORD_ACCESS_TTL_SECONDS,
        httponly=True,
        samesite="Lax",
        path="/",
    )


def clear_drop_password_cookie(response, drop: Drop):
    response.delete_cookie(drop.password_cookie_name, path="/")


def get_password_from_request(request) -> str:
    return normalize_optional_password(request.GET.get("password") or request.POST.get("password"))


@ensure_csrf_cookie
@require_GET
def home_page(request):
    editable_cookie_drops, stale_cookie_names = get_editable_cookie_drops(request)
    editable_drops = list(editable_cookie_drops)

    if request.user.is_authenticated:
        owned_drop_ids = {drop.id for drop in editable_drops}
        for drop in request.user.drops.all():
            if drop.id not in owned_drop_ids:
                editable_drops.append(drop)

    editable_drops.sort(key=lambda drop: drop.updated_at, reverse=True)
    response = render(request, "drops/home.html", {"editable_drops": editable_drops})
    return attach_cookie_cleanup(response, stale_cookie_names)


@ensure_csrf_cookie
@require_GET
def editor_page(request):
    return render(request, "drops/editor.html", {"page_mode": "create"})


@ensure_csrf_cookie
@require_GET
def edit_drop_page(request, drop_id: str):
    drop = get_drop_or_404(drop_id)
    can_edit = user_can_manage_drop(request, drop)
    _, stale_cookie_names = get_editable_cookie_drops(request)
    response = render(
        request,
        "drops/editor.html",
        {
            "page_mode": "edit",
            "drop": drop,
            "can_edit": can_edit,
        },
    )
    return attach_cookie_cleanup(response, stale_cookie_names)


@ensure_csrf_cookie
@require_GET
def view_drop_page(request, drop_id: str):
    drop = get_drop_or_404(drop_id)
    can_edit = user_can_manage_drop(request, drop)
    can_access = user_can_access_drop(request, drop)
    _, stale_cookie_names = get_editable_cookie_drops(request)

    if not can_access and not can_edit:
        password = get_password_from_request(request)
        if password and drop.check_access_password(password):
            response = redirect(f"/{drop.drop_id}/")
            set_drop_password_cookie(response, drop, password)
            return attach_cookie_cleanup(response, stale_cookie_names)

    response = render(
        request,
        "drops/view_drop.html",
        {"drop": drop, "can_edit": can_edit, "can_access": can_access},
    )

    if drop.has_password and not can_access and not can_edit:
        clear_drop_password_cookie(response, drop)

    return attach_cookie_cleanup(response, stale_cookie_names)


@require_POST
def create_drop_api(request):
    content = (request.POST.get("content") or "").strip()
    password = normalize_optional_password(request.POST.get("password"))
    if not content:
        return JsonResponse({"success": False, "error": "Markdown content is required."}, status=400)
    if password and not is_valid_drop_password(password):
        return JsonResponse({"success": False, "error": PASSWORD_RULES_MESSAGE}, status=400)

    drop_id = create_unique_drop_id()
    edit_token = generate_edit_token()
    encrypted_token = encrypt_token(edit_token)
    short_code = create_unique_short_code()

    drop = Drop(
        drop_id=drop_id,
        content=content,
        edit_token=encrypted_token,
        short_code=short_code,
        user=request.user if request.user.is_authenticated else None,
    )
    if password:
        drop.set_access_password(password)
    drop.save()

    response = JsonResponse(
        {
            "success": True,
            "drop_id": drop.drop_id,
            "view_url": f"/{drop.drop_id}/",
            "short_url": request.build_absolute_uri(f"/s/{drop.short_code}/"),
        }
    )
    response.set_cookie(
        drop.cookie_name,
        edit_token,
        max_age=365 * 24 * 60 * 60,
        httponly=True,
        samesite="Lax",
        path="/",
    )
    if password:
        set_drop_password_cookie(response, drop, password)
    return response


@require_http_methods(["GET", "PUT", "DELETE"])
def drop_detail_api(request, drop_id: str):
    drop = get_drop_or_404(drop_id)
    can_manage = user_can_manage_drop(request, drop)
    can_access = user_can_access_drop(request, drop)

    if request.method == "GET":
        if not can_access:
            response = JsonResponse(
                {
                    "success": False,
                    "requires_password": True,
                    "error": "This drop is password protected.",
                    "drop": {
                        "drop_id": drop.drop_id,
                        "can_edit": can_manage,
                        "has_password": drop.has_password,
                    },
                },
                status=403,
            )
            if drop.has_password and not can_manage:
                clear_drop_password_cookie(response, drop)
            _, stale_cookie_names = get_editable_cookie_drops(request)
            return attach_cookie_cleanup(response, stale_cookie_names)

        response = JsonResponse(
            {
                "success": True,
                "drop": {
                    "drop_id": drop.drop_id,
                    "content": drop.content,
                    "title": drop.title,
                    "created_at": drop.created_at.isoformat(),
                    "updated_at": drop.updated_at.isoformat(),
                    "short_code": drop.short_code,
                    "short_url": request.build_absolute_uri(f"/s/{drop.short_code}/") if drop.short_code else None,
                    "can_edit": can_manage,
                    "raw_url": f"/{drop.drop_id}/raw",
                    "has_password": drop.has_password,
                },
            }
        )
        _, stale_cookie_names = get_editable_cookie_drops(request)
        return attach_cookie_cleanup(response, stale_cookie_names)

    if not can_manage:
        return JsonResponse({"success": False, "error": "Forbidden"}, status=403)

    if request.method == "PUT":
        payload = json.loads(request.body or "{}")
        content = (payload.get("content") or "").strip()
        password_enabled = bool(payload.get("password_enabled"))
        password = normalize_optional_password(payload.get("password"))
        if not content:
            return JsonResponse({"success": False, "error": "Markdown content is required."}, status=400)
        if password_enabled and not password and not drop.has_password:
            return JsonResponse({"success": False, "error": "Password is required when protection is enabled."}, status=400)
        if password and not is_valid_drop_password(password):
            return JsonResponse({"success": False, "error": PASSWORD_RULES_MESSAGE}, status=400)

        drop.content = content
        if password_enabled:
            if password:
                drop.set_access_password(password)
        else:
            drop.clear_access_password()
        drop.save(update_fields=["content", "access_password", "updated_at"])

        response = JsonResponse(
            {
                "success": True,
                "drop_id": drop.drop_id,
                "view_url": f"/{drop.drop_id}/",
                "has_password": drop.has_password,
            }
        )
        if not drop.has_password:
            clear_drop_password_cookie(response, drop)
        return response

    response = JsonResponse({"success": True, "redirect_url": "/"})
    response.delete_cookie(drop.cookie_name, path="/")
    clear_drop_password_cookie(response, drop)
    drop.delete()
    return response


@require_POST
def drop_password_access_api(request, drop_id: str):
    drop = get_drop_or_404(drop_id)
    if not drop.has_password:
        return JsonResponse({"success": True, "redirect_url": f"/{drop.drop_id}/"})

    password = get_password_from_request(request)
    if not drop.check_access_password(password):
        return JsonResponse({"success": False, "error": "Incorrect password."}, status=403)

    response = JsonResponse({"success": True, "redirect_url": f"/{drop.drop_id}/"})
    set_drop_password_cookie(response, drop, password)
    return response


@require_POST
def shorten_drop_api(request, drop_id: str):
    drop = get_drop_or_404(drop_id)
    if not drop.short_code:
        drop.short_code = create_unique_short_code()
        drop.save(update_fields=["short_code", "updated_at"])

    short_path = f"/s/{drop.short_code}/"
    return JsonResponse(
        {
            "success": True,
            "short_code": drop.short_code,
            "short_url": request.build_absolute_uri(short_path),
        }
    )


@require_GET
def raw_drop_view(request, drop_id: str):
    drop = get_drop_or_404(drop_id)
    if user_can_access_drop(request, drop):
        return HttpResponse(drop.content, content_type="text/plain; charset=utf-8")

    password = get_password_from_request(request)
    if password and drop.check_access_password(password):
        response = HttpResponse(drop.content, content_type="text/plain; charset=utf-8")
        set_drop_password_cookie(response, drop, password)
        return response

    response = HttpResponse("Password required.", status=403, content_type="text/plain; charset=utf-8")
    if drop.has_password and not user_can_manage_drop(request, drop):
        clear_drop_password_cookie(response, drop)
    return response


@require_GET
def short_redirect(request, short_code: str):
    drop = get_object_or_404(Drop, short_code=short_code)
    return redirect(f"/{drop.drop_id}/")
