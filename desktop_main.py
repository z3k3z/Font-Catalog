import threading
import time
import webbrowser

import uvicorn

from app.main import app

_HOST: str = "127.0.0.1"
_PORT: int = 38473
_STARTUP_DELAY_SECONDS: float = 2.0


def main() -> None:
    server_thread: threading.Thread = threading.Thread(
        target=_run_server,
        daemon=True,
    )

    server_thread.start()

    time.sleep(_STARTUP_DELAY_SECONDS)

    webbrowser.open(f"http://{_HOST}:{_PORT}")

    server_thread.join()


def _run_server() -> None:
    uvicorn.run(
        app,
        host=_HOST,
        port=_PORT,
        log_level="info",
    )


if __name__ == "__main__":
    main()
