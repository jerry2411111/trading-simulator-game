"""Desktop app: run the server in a background thread and show the game in a native window."""
import socket
import sys
import threading
import time

import uvicorn
import webview

from . import main as server
from .data import DATA_DIR

PORT = 8765  # fixed so the window's saved preferences (same origin) survive restarts


def pick_port():
    with socket.socket() as s:
        try:
            s.bind(("127.0.0.1", PORT))
        except OSError:
            s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def main():
    if sys.stdout is None:  # the packaged windowed build has no console: write output to data/log.txt
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        sys.stdout = sys.stderr = open(DATA_DIR / "log.txt", "w", encoding="utf-8", buffering=1)
    port = pick_port()
    uv = uvicorn.Server(uvicorn.Config(server.app, host="127.0.0.1", port=port, log_level="warning"))
    thread = threading.Thread(target=uv.run, daemon=True)
    thread.start()
    while not uv.started and thread.is_alive():
        time.sleep(0.05)
    window = webview.create_window("Trading Simulator Game", f"http://127.0.0.1:{port}/", width=1280, height=800,
                                   min_size=(360, 520), background_color="#07040f")
    server.exit_hook = window.destroy  # "Exit game" in the settings menu closes the window
    webview.start(private_mode=False, storage_path=str(DATA_DIR / "webview"))
    uv.should_exit = True  # the server autosaves on shutdown
    thread.join(timeout=5)


if __name__ == "__main__":
    main()
