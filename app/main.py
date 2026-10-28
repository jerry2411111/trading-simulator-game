"""FastAPI app: key setup, saved games and AI settings routes, the game WebSocket and the static frontend."""
import asyncio
import contextlib
import logging
from pathlib import Path

import httpx
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from . import keys, saves
from .agent import AgentConfig
from .data import Alpaca
from .game import Game

log = logging.getLogger(__name__)
WEB_DIR = Path(__file__).resolve().parent.parent / "web"
sockets: set[WebSocket] = set()
exit_hook = None  # set by the desktop launcher: closes its window


async def broadcast(msg):
    for ws in list(sockets):
        try:
            await ws.send_json(msg)
        except Exception:
            sockets.discard(ws)


game = Game(broadcast)


@contextlib.asynccontextmanager
async def lifespan(app):
    if ai := keys.load_ai():
        game.agent = AgentConfig(**{k: v for k, v in ai.items() if k in AgentConfig.__dataclass_fields__})
    if state := saves.load_autosave():
        try:
            game.restore(state)
        except (KeyError, TypeError, ValueError):
            log.warning("Ignoring an unreadable data/state.json")
    try:
        await game.set_client(await keys.active_client())
    except httpx.HTTPError:
        log.warning("Could not reach Alpaca to check the .env key")
    clock = asyncio.create_task(game.run())
    yield
    clock.cancel()
    game.autosave()
    await game.set_client(None)


app = FastAPI(lifespan=lifespan)


class KeyIn(BaseModel):
    key_id: str
    secret: str


class SaveIn(BaseModel):
    name: str


@app.get("/api/keys")
def key_status():
    return {"configured": game.client is not None, "feed": game.client and game.client.feed}


@app.post("/api/keys")
async def connect(body: KeyIn):
    key_id, secret = body.key_id.strip(), body.secret.strip()
    try:
        feed = await keys.detect_feed(key_id, secret)
    except httpx.HTTPError:
        return JSONResponse({"ok": False, "message": "Couldn't reach Alpaca. Check your internet connection "
                                                     "and try again."}, 502)
    if not feed:
        return JSONResponse({"ok": False, "message": "That key didn't work. Check you copied the Paper key "
                                                     "and secret, with no spaces."}, 400)
    keys.save_alpaca(key_id, secret, feed)
    await game.set_client(Alpaca(key_id, secret, feed))
    return {"ok": True, "feed": feed}


@app.delete("/api/keys")
async def forget_key():
    keys.forget_alpaca()
    await game.set_client(None)
    return key_status()


@app.get("/api/saves")
async def list_saves():
    return saves.list_saves()


@app.post("/api/saves")
async def save_game(body: SaveIn):
    if game.s is None:
        return JSONResponse({"ok": False, "message": "Start a game first."}, 400)
    saves.save(body.name.strip()[:40] or "Saved game", game.to_dict())
    return {"ok": True}


@app.post("/api/saves/{sid}/load")
async def load_game(sid: str):
    try:
        data = saves.load(sid)
    except KeyError:
        data = None
    if data is None:
        return JSONResponse({"ok": False, "message": "That save is gone."}, 404)
    game.restore(data)
    game.autosave()
    await game.push_snapshot()
    return {"ok": True}


@app.delete("/api/saves/{sid}")
async def delete_save(sid: str):
    with contextlib.suppress(KeyError):
        saves.delete(sid)
    return {"ok": True}


@app.get("/api/ai")
async def ai_settings():
    return {**game.agent.public(), "standard_prompt": AgentConfig.prompt}


@app.post("/api/ai")
async def update_ai(body: dict):
    try:
        game.configure_ai(body)
    except (TypeError, ValueError):
        return JSONResponse({"ok": False, "message": "Check the AI settings: interval and max order must be numbers."}, 400)
    keys.save_ai(game.agent.stored())
    await game.push_snapshot()
    return {"ok": True, **game.agent.public()}


@app.post("/api/exit")
async def exit_game():
    game.autosave()
    if exit_hook:
        exit_hook()
    return {"ok": True, "closing": exit_hook is not None}


@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    sockets.add(ws)
    try:
        await ws.send_json(game.snapshot())
        while True:
            await game.command(await ws.receive_json())
    except WebSocketDisconnect:
        pass
    finally:
        sockets.discard(ws)


app.mount("/", StaticFiles(directory=WEB_DIR, html=True), name="web")
