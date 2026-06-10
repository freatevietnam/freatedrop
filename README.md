# Freate Drop

Share Markdown instantly — no login required.

## Features

- Publish Markdown drops with 32-char IDs
- Live preview, syntax highlighting, math rendering (KaTeX + MathJax)
- Anonymous edit/delete via encrypted cookies
- Optional password protection
- Short URLs, raw endpoint, fullview mode, print, dark mode
- Keyboard shortcuts: `F1` for help, `F` fullview, `P` print, `Ctrl+Enter` publish

## Tech stack

| Backend | Frontend |
|---|---|
| Django 6 + DRF | Tailwind CSS v4 (CDN) |
| SQLite / PostgreSQL / MariaDB | marked 18, highlight.js, KaTeX, MathJax |
| cryptography (Fernet) | DOMPurify, EasyMDE |
| whitenoise (static files) | |

## Setup

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp config/local_settings.py.example config/local_settings.py
python manage.py migrate
python manage.py runserver
```

Edit `config/local_settings.py` and set at least a `FERNET_KEY`:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Paste the output into `local_settings.py` as `FERNET_KEY`. You can also set `SECRET_KEY` and `DEBUG` there.

## Configuration

Settings live in `config/settings.py`. To override, copy the example file and uncomment what you need:

| Setting | Default | Notes |
|---|---|---|
| `SECRET_KEY` | dev-only key | **required in production** |
| `DEBUG` | `True` | set `False` in production |
| `ALLOWED_HOSTS` | `127.0.0.1, localhost` | add your domain |
| `FERNET_KEY` | auto-generated | used for edit-token encryption |
| `DATABASE_*` | SQLite (`db.sqlite3`) | switch to pg or mariadb |
| `CSRF_TRUSTED_ORIGINS` | `localhost:8000` | add production origin |
| `DROP_MAX_CHARS` | `128000` | max characters per drop |

## Production

```bash
# Create local_settings.py with production values
DEBUG=False
ALLOWED_HOSTS=["yourdomain.com"]
SECRET_KEY="..."  # generate a strong key
FERNET_KEY="..."  # python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Collect static files (served via WhiteNoise)
python manage.py collectstatic --noinput
```

## Notes

- Anonymous drops use an HttpOnly cookie (`drop_token_<drop_id>`). Logged-in users manage drops from their dashboard.
- Short URLs are generated on first click — `POST /api/drops/<id>/shorten/`.
- Dark mode is saved in `localStorage` under `freatedrop-theme`.
- Fullview exits via the floating button or `Escape`.

## Images

![demo1](assets/images/demo1.png)
![demo2](assets/images/demo2.png)
![demo3](assets/images/demo3.png)
