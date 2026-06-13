from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Response
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api_models.add_font_tag_request import AddFontTagRequest
from app.api_models.font_response import FontResponse
from app.api_models.font_tag_response import FontTagResponse, FontTagsResponse
from app.api_models.frontend_diagnostic_event import FrontendDiagnosticEvent
from app.application_configuration import ApplicationConfiguration
from app.diagnostics.probe import ProbeLevel, emit_error_probe
from app.discovery.local_discovery import LocalDiscovery
from app.foundation.build_info import read_build_info
from app.foundation.runtime_paths import get_static_root_path
from app.models.font_info import FontInfo
from app.models.font_semantic_key import FontSemanticKey
from app.tags.font_tag_service import FontTagService
from app.tags.font_tag_store import FontTagStore
from app.tags.tag import Tag
from catalog.font_catalog import CatalogFontRecord, FontCatalog

_FRONTEND_DIAGNOSTIC_PREFIX: str = "[FRONTEND]"


class FontCatalogApp:
    def __init__(self, application_configuration: ApplicationConfiguration) -> None:
        self._applicationConfiguration: ApplicationConfiguration = application_configuration
        self._fontCatalog: FontCatalog = FontCatalog()
        self._staticRootPath: Path = get_static_root_path()
        self._fontTagService: FontTagService = FontTagService(
            FontTagStore(file_path=Path("./data/tags.json"))
        )

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

        fastapi_app.add_api_route(
            path="/api/about",
            endpoint=self._read_about,
            methods=["GET"],
            summary="Return application build information",
            description=(
                "Returns application identity and build metadata generated during "
                "the desktop packaging process. Development builds return default "
                "development metadata."
            ),
        )

        fastapi_app.add_api_route(
            path="/api/diagnostics/frontend",
            endpoint=self._receive_frontend_diagnostic_event,
            methods=["POST"],
            summary="Receive frontend diagnostic event",
            description=(
                "Receives selected frontend diagnostic events and records them through "
                "the backend probe system. Frontend events are deduplicated before being "
                "sent; the backend records what it receives."
            ),
        )

        fastapi_app.add_api_route(
            path="/api/fonts/{font_id}/tags",
            endpoint=self._add_font_tag,
            methods=["POST"],
            summary="Assign a tag to a font",
            description=("Associate a tag to the identified font."),
        )

        fastapi_app.add_api_route(
            path="/api/fonts/{font_id}/tags", endpoint=self._read_font_tags, methods=["GET"]
        )

        fastapi_app.add_api_route(
            path="/api/fonts/{font_id}/tags/{tag_name}", endpoint=self._remove_font_tag, methods=["DELETE"]
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

    def _read_about(self) -> dict[str, object]:
        about_info: dict[str, object] = read_build_info()

        return about_info

    def _receive_frontend_diagnostic_event(
        self,
        event: FrontendDiagnosticEvent,
    ) -> dict[str, str]:
        probe_level: ProbeLevel = ProbeLevel.from_string(event.probe_level)
        emit_error_probe(
            probe_level,
            lambda: (
                f"{_FRONTEND_DIAGNOSTIC_PREFIX} "
                f"session_id={event.session_id} "
                f"started_utc={event.session_started_at_utc} "
                f"event_type={event.event_type} "
                f"subject={event.subject_key} "
                f"variant={event.variant_key} "
                f"count={event.occurrence_count} "
                f"message={event.message!r}"
                f"frontend_call_site={event.frontend_call_site!r} "
            ),
        )

        return {"status": "accepted"}

    def _add_font_tag(self, font_id: int, request: AddFontTagRequest) -> dict[str, str]:
        font_record: CatalogFontRecord | None = self._fontCatalog.get_record_by_id(font_id)
        if font_record is None:
            raise HTTPException(status_code=404, detail="Font id not found.")

        font_key: FontSemanticKey = FontSemanticKey.from_font_info(font_record.font_info)

        self._fontTagService.add_tag_to_font(tag_name=request.tag_name, font_key=font_key)

        return {"status": "ok"}

    def _read_font_tags(self, font_id: int) -> FontTagsResponse:
        font_record: CatalogFontRecord | None = self._fontCatalog.get_record_by_id(font_id)
        if font_record is None:
            raise HTTPException(status_code=404, detail="Font id not found.")

        font_key: FontSemanticKey = FontSemanticKey.from_font_info(font_record.font_info)

        tags: list[Tag] = self._fontTagService.get_tags_for_font(font_key=font_key)

        return FontTagsResponse(tags=[FontTagResponse(name=tag.name) for tag in tags])

    def _remove_font_tag(self, font_id: int, tag_name: str) -> dict[str, str]:
        font_record: CatalogFontRecord | None = self._fontCatalog.get_record_by_id(font_id)
        if font_record is None:
            raise HTTPException(status_code=404, detail="Font id not found.")

        font_key: FontSemanticKey = FontSemanticKey.from_font_info(font_record.font_info)

        self._fontTagService.remove_tag_from_font(tag_name=tag_name, font_key=font_key)

        return {"status": "ok"}
