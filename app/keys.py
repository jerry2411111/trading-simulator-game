"""Alpaca key: read from .env or data/keys.json, validate (SIP/IEX detection), save, forget. Never logged."""
import json
import os
from datetime import date, timedelta

import httpx
import pandas as pd

from .data import DATA_DIR, Alpaca, AuthError

KEYS_PATH = DATA_DIR / "keys.json"
ENV_PATH = DATA_DIR.parent / ".env"


def _read():
    try:
        return json.loads(KEYS_PATH.read_text())
    except (OSError, ValueError):
        return {}


def _write(data):
    if not data:
        KEYS_PATH.unlink(missing_ok=True)
        return
    KEYS_PATH.parent.mkdir(parents=True, exist_ok=True)
    tmp = KEYS_PATH.with_suffix(".tmp")
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)  # owner-only where the OS supports it
    with os.fdopen(fd, "w") as f:
        json.dump(data, f)
    tmp.replace(KEYS_PATH)


def _env_key():
    """ALPACA_KEY_ID / ALPACA_SECRET from the environment, or else from a local .env file."""
    values = dict(os.environ)
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text().splitlines():
            name, sep, value = line.partition("=")
            if sep and not name.strip().startswith("#"):
                values.setdefault(name.strip(), value.strip().strip("\"'"))
    if values.get("ALPACA_KEY_ID") and values.get("ALPACA_SECRET"):
        return values["ALPACA_KEY_ID"], values["ALPACA_SECRET"]
    return None


async def detect_feed(key_id, secret):
    """'sip' or 'iex' if the key works, None if Alpaca rejects it."""
    client = Alpaca(key_id, secret, "iex")
    end = pd.Timestamp(date.today() - timedelta(days=3), tz="UTC")
    start = end - pd.Timedelta(days=7)
    try:
        await client.bars(["SPY"], "1Day", start, end)
        client.feed = "sip"
        try:
            await client.bars(["SPY"], "1Day", start, end)
            return "sip"
        except (AuthError, httpx.HTTPStatusError):
            return "iex"
    except AuthError:
        return None
    finally:
        await client.aclose()


async def active_client():
    """Client for the saved key, else for a .env key (its feed is detected here), else None."""
    saved = _read().get("alpaca")
    if saved:
        return Alpaca(saved["key_id"], saved["secret"], saved["feed"])
    env = _env_key()
    if env and (feed := await detect_feed(*env)):
        return Alpaca(*env, feed)
    return None


def save_alpaca(key_id, secret, feed):
    data = _read()
    data["alpaca"] = {"key_id": key_id, "secret": secret, "feed": feed}
    _write(data)


def forget_alpaca():
    data = _read()
    data.pop("alpaca", None)
    _write(data)


def load_ai():
    return _read().get("ai")


def save_ai(settings):
    """AI trader settings; the API key is included only if the player ticked "Remember"."""
    data = _read()
    data["ai"] = settings
    _write(data)
