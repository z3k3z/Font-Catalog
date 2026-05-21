from pathlib import Path

from app.application_configuration import ApplicationConfiguration
from app.diagnostics.probe import emit_error_probe, emit_trace_probe
from app.discovery.base_discovery_helper import (
    build_font_candidates_from_paths,
    filter_supported_font_paths,
)
from app.discovery.font_candidate import DiscoverySource, FontCandidate


class FileDiscovery:
    def __init__(
        self,
        application_configuration: ApplicationConfiguration,
    ) -> None:
        self._applicationConfiguration: ApplicationConfiguration = (
            application_configuration
        )

    def collect_font_candidates(self) -> list[FontCandidate]:
        font_candidates: list[FontCandidate] = []

        directory_font_candidates: list[FontCandidate] = (
            self._collect_font_candidates_from_directory(
                self._applicationConfiguration.windows_font_directory
            )
        )

        font_candidates.extend(directory_font_candidates)

        return font_candidates

    def _collect_font_candidates_from_directory(
        self,
        directory: Path,
    ) -> list[FontCandidate]:
        if not directory.exists():
            emit_error_probe(lambda: f"Font directory does not exist: '{directory}'.")
            return []

        directory_paths: list[Path] = list(directory.iterdir())
        font_paths: list[Path] = filter_supported_font_paths(directory_paths)

        font_candidates: list[FontCandidate] = build_font_candidates_from_paths(
            font_paths=font_paths,
            discovery_source=DiscoverySource.WINDOWS_FONT_DIRECTORY,
            discovery_detail=str(directory),
        )

        emit_trace_probe(
            lambda: (
                f"Collected {len(font_candidates)} supported font candidates "
                f"from directory '{directory}'."
            )
        )

        return font_candidates