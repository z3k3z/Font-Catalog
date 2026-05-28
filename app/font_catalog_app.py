from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Response
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api_models.font_response import FontResponse
from app.application_configuration import ApplicationConfiguration
from app.discovery.local_discovery import LocalDiscovery
from app.foundation.runtime_paths import get_static_root_path
from app.models.font_info import FontInfo
from catalog.font_catalog import CatalogFontRecord, FontCatalog


class FontCatalogApp:
    def __init__(self, application_configuration: ApplicationConfiguration) -> None:
        self._applicationConfiguration: ApplicationConfiguration = application_configuration
        self._fontCatalog: FontCatalog = FontCatalog()
        self._staticRootPath: Path = get_static_root_path()

    def create_fastapi_app(self) -> FastAPI:
        lifespan = self._create_lifespan_handler()

        fastapi_app: FastAPI = FastAPI(
            title="Font Catalog",
            lifespan=lifespan,
        )

        fastapi_app.mount(
            "/static",
            StaticFiles(directory=self._staticRootPath),
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

            # discover the fonts on this machine
            font_infos: list[FontInfo] = localDiscovery.discover_fonts()

            # build our catalog
            self._fontCatalog.load_fonts(font_infos)

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
            response_model=list[FontResponse],
            summary="List discovered fonts",
            description=(
                "Returns the current in-memory set of unique fonts discovered during "
                "application startup. Results are deduplicated by semantic font identity. "
                "The current UI renders fonts by family name using browser/system font "
                "resolution, not by explicitly loading the returned file path."
            ),
            response_description="List of discovered font records.",
        )

        fastapi_app.add_api_route(
            path="/api/fonts/{font_id}/file",
            endpoint=self._read_font_file,
            methods=["GET"],
            summary="Return exact font file",
            description=(
                "Returns the physical font file associated with the backend catalog "
                "font id. The font id is an opaque runtime handle assigned by the "
                "catalog. The frontend uses this endpoint as the source for generated "
                "@font-face rules so samples render with the exact discovered font file."
            ),
            response_class=FileResponse,
            responses={
                200: {
                    "description": "The requested font file.",
                    "content": {
                        "font/ttf": {},
                        "font/otf": {},
                        "application/octet-stream": {},
                    },
                },
                404: {
                    "description": "No catalog font record exists for the supplied font id.",
                },
            },
        )

    def _read_index(self) -> FileResponse:
        index_path: Path = self._staticRootPath / "index.html"
        response: FileResponse = FileResponse(index_path)

        return response

    def _read_fonts(self) -> list[FontResponse]:
        response: list[FontResponse] = []

        records: list[CatalogFontRecord] = self._fontCatalog.get_records()

        for record in records:
            font_info: FontInfo = record.font_info

            response.append(
                FontResponse(
                    id=record.font_id,
                    family_name=font_info.family_name,
                    style_name=font_info.style_name,
                    full_name=font_info.full_name,
                )
            )

        return response

    def _read_font_file(self, font_id: int) -> Response:
        record: CatalogFontRecord | None = self._fontCatalog.get_record_by_id(font_id)

        if record is None:
            raise HTTPException(status_code=404, detail="Font id not found.")

        font_bytes: bytes = record.font_info.font_candidate.source_reference.get_font_bytes()

        response: Response = Response(
            content=font_bytes,
            media_type="font/ttf",
            headers={
                "Cache-Control": "public, max-age=3600",
                "Content-Disposition": f'inline; filename="font-{font_id}.ttf"',
            },
        )

        return response
