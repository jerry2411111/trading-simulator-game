"""FastAPI app: key setup routes, the game WebSocket and the static frontend."""
import asyncio
import contextlib
import logging
from pathlib import Path

import httpx
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from . import keys
from .data import Alpaca
from .game import Game

log = logging.getLogger(__name__)
WEB_DIR = Path(__file__).resolve().parent.parent / "web"
sockets: set[WebSocket] = set()


async def broadcast(msg):
    for ws in list(sockets):
        try:
            await ws.send_json(msg)
        except Exception:
            sockets.discard(ws)


game = Game(broadcast)


@contextlib.asynccontextmanager
async def lifespan(app):
    try:
        await game.set_client(await keys.active_client())
    except httpx.HTTPError:
        log.warning("Could not reach Alpaca to check the .env key")
    clock = asyncio.create_task(game.run())
    yield
    clock.cancel()
    await game.set_client(None)


app = FastAPI(lifespan=lifespan)


class KeyIn(BaseModel):
    key_id: str
    secret: str


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
