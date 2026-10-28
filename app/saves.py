"""Saved games: data/state.json (autosave, restored at startup) and named saves in data/saves/."""
import json
import re
import time
import uuid

from .data import DATA_DIR

STATE = DATA_DIR / "state.json"
SAVES = DATA_DIR / "saves"
SAVE_ID = re.compile(r"^[0-9a-f]{8}$")


def _write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(data))
    tmp.replace(path)


def _read(path):
    try:
        return json.loads(path.read_text())
    except (OSError, ValueError):
        return None


def _path(sid):
    if not SAVE_ID.match(sid or ""):
        raise KeyError(sid)
    return SAVES / f"{sid}.json"


def autosave(data):
    _write(STATE, data)


def load_autosave():
    return _read(STATE)


def save(name, data):
    sid = uuid.uuid4().hex[:8]
    _write(_path(sid), {**data, "name": name, "saved_at": time.time()})
    return sid


def load(sid):
    return _read(_path(sid))


def delete(sid):
    _path(sid).unlink(missing_ok=True)


def list_saves():
    items = [(p.stem, _read(p)) for p in SAVES.glob("*.json")]
    rows = [{"id": sid, "name": d["name"], "saved_at": d["saved_at"], **d["summary"]} for sid, d in items if d]
    return sorted(rows, key=lambda r: r["saved_at"], reverse=True)


def session_ids():
    """Cache folders still referenced by the autosave or a named save."""
    docs = [_read(STATE), *(_read(p) for p in SAVES.glob("*.json"))]
    return {d["session"]["id"] for d in docs if d and d.get("session")}
