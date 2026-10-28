"""Desktop app: run the server in a background thread and show the game in a native window."""
import socket
import threading
import time

import uvicorn
import webview

from .data import DATA_DIR
from .main import app

PORT = 8765  # fixed so the window's saved preferences (same origin) survive restarts


def pick_port():
    with socket.socket() as s:
        try:
            s.bind(("127.0.0.1", PORT))
        except OSError:
            s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def main():
    port = pick_port()
    server = uvicorn.Server(uvicorn.Config(app, host="127.0.0.1", port=port, log_level="warning"))
    thread = threading.Thread(target=server.run, daemon=True)
    thread.start()
    while not server.started and thread.is_alive():
        time.sleep(0.05)
    webview.create_window("TapeTrainer", f"http://127.0.0.1:{port}/", width=1280, height=800,
                          min_size=(360, 520), background_color="#07040f")
    webview.start(private_mode=False, storage_path=str(DATA_DIR / "webview"))
    server.should_exit = True
    thread.join(timeout=5)


if __name__ == "__main__":
    main()
