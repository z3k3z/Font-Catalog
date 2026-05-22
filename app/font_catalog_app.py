from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.application_configuration import ApplicationConfiguration
from app.discovery.local_discovery import LocalDiscovery
from app.models.font_info import FontInfo


class FontCatalogApp:
    def __init__(self, application_configuration: ApplicationConfiguration) -> None:
        self._applicationConfiguration: ApplicationConfiguration = application_configuration
        self._discoveredFonts: list[FontInfo] = []
        self._staticDirectory: Path = Path("app/static")

    def create_fastapi_app(self) -> FastAPI:
        lifespan = self._create_lifespan_handler()

        fastapi_app: FastAPI = FastAPI(
            title="Font Catalog",
            lifespan=lifespan,
        )

        fastapi_app.mount(
            "/static",
            StaticFiles(directory=self._staticDirectory),
            name="static",
        )

        self._configure_routes(fastapi_app)

        return fastapi_app

    def _create_lifespan_handler(self):
        @asynccontextmanager
        async def lifespan(
            _: FastAPI,
        ) -> AsyncIterator[None]:
            localDiscovery = LocalDiscovery(self._applicationConfiguration)
            self._discoveredFonts = localDiscovery.discover_fonts()

            yield

        return lifespan

    def _configure_routes(self, fastapi_app: FastAPI) -> None:
        fastapi_app.add_api_route(
            path="/",
            endpoint=self._read_index,
            methods=["GET"],
        )

        fastapi_app.add_api_route(
            path="/api/fonts",
            endpoint=self._read_fonts,
            methods=["GET"],
        )

    def _read_index(self) -> FileResponse:
        index_path: Path = self._staticDirectory / "index.html"
        response: FileResponse = FileResponse(index_path)

        return response

    def _read_fonts(self) -> list[dict[str, str]]:
        response: list[dict[str, str]] = []

        for font_info in self._discoveredFonts:
            response.append(
                {
                    "family_name": font_info.family_name,
                    "style_name": font_info.style_name,
                    "full_name": font_info.full_name,
                    "file_path": str(font_info.font_candidate.file_path),
                    "source": font_info.font_candidate.discovery_source.value,
                }
            )

        return response
