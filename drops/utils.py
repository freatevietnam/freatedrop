import secrets
import string
import time

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings

ALPHANUMERIC = string.ascii_letters + string.digits
DROP_ID_LENGTH = 32
SHORT_CODE_LENGTH = 8
PASSWORD_ACCESS_TTL_SECONDS = 3 * 60 * 60
ALLOWED_PASSWORD_SPECIALS = r"!@#$%^&*()_+-=[]{}|;:'\",.<>/?`~\\"
ALLOWED_PASSWORD_CHARACTERS = set(string.ascii_letters + string.digits + ALLOWED_PASSWORD_SPECIALS)


def generate_random_string(length: int) -> str:
    return "".join(secrets.choice(ALPHANUMERIC) for _ in range(length))


def generate_drop_id() -> str:
    return generate_random_string(DROP_ID_LENGTH)


def generate_edit_token() -> str:
    return secrets.token_urlsafe(32)


def generate_short_code() -> str:
    return generate_random_string(SHORT_CODE_LENGTH)


def is_valid_drop_password(password: str) -> bool:
    return bool(password) and all(character in ALLOWED_PASSWORD_CHARACTERS for character in password)


def get_fernet() -> Fernet:
    key = settings.FERNET_KEY
    if isinstance(key, str):
        key = key.encode()
    return Fernet(key)


def encrypt_token(token: str) -> str:
    return get_fernet().encrypt(token.encode()).decode()


def decrypt_token(encrypted_token: str) -> str | None:
    try:
        return get_fernet().decrypt(encrypted_token.encode()).decode()
    except InvalidToken:
        return None


def create_password_access_token(drop_id: str, password_hash: str) -> str:
    payload = f"{drop_id}:{password_hash}:{int(time.time())}"
    return encrypt_token(payload)


def validate_password_access_token(token: str, drop_id: str, password_hash: str, ttl_seconds: int = PASSWORD_ACCESS_TTL_SECONDS) -> bool:
    payload = decrypt_token(token)
    if not payload:
        return False

    try:
        token_drop_id, token_password_hash, issued_at = payload.split(":", 2)
        issued_at_int = int(issued_at)
    except (ValueError, TypeError):
        return False

    if token_drop_id != drop_id or token_password_hash != password_hash:
        return False

    return (int(time.time()) - issued_at_int) <= ttl_seconds
