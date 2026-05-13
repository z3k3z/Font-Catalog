from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.discovery.local_discovery import discover_fonts
from app.models.font_info import FontInfo


class FontCatalogApp:
    def __init__(self) -> None:
        self._discoveredFonts: list[FontInfo] = []

    def create_fastapi_app(self) -> FastAPI:
        lifespan = self._create_lifespan_handler()

        fastapi_app: FastAPI = FastAPI(
            title="Font Catalog",
            lifespan=lifespan,
        )

        self._configure_routes(fastapi_app)

        return fastapi_app

    def _create_lifespan_handler(self):
        @asynccontextmanager
        async def lifespan(
            _: FastAPI,
        ) -> AsyncIterator[None]:
            self._discoveredFonts = discover_fonts()

            yield

        return lifespan

    def _configure_routes(self, fastapi_app: FastAPI) -> None:
      fastapi_app.add_api_route(
         path="/",
         endpoint=self._read_root,
         methods=["GET"],
      )

    def _read_root(self) -> dict[str, str | int]:
      response: dict[str, str | int] = {
         "status": "Font Catalog is running",
         "discovered_font_count": len(self._discoveredFonts),
      }

      return response
