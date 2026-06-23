import time

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from app.diagnostics.probe import ProbeLevel, emit_error_probe


class HttpRequestProbeMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        started_at = time.perf_counter()

        response = await call_next(request)

        if request.url.path.startswith("/api/"):
            elapsed_ms = (time.perf_counter() - started_at) * 1000

            emit_error_probe(
                ProbeLevel.DEBUG,
                lambda: (
                    f"HTTP {request.method} {request.url.path} "
                    f"-> {response.status_code} "
                    f"({elapsed_ms:.1f} ms)"
                ),
            )

        return response
