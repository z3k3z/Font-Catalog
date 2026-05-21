from pathlib import Path

from app.diagnostics.probe import emit_error_probe, emit_trace_probe
from app.discovery.base_discovery_helper import (
    build_font_candidates_from_paths,
    filter_supported_font_paths,
)
from app.discovery.font_candidate import DiscoverySource, FontCandidate


_FONT_DIRECTORIES: tuple[Path, ...] = (
    Path("C:/Windows/Fonts"),
)


def collect_file_font_candidates() -> list[FontCandidate]:
    font_candidates: list[FontCandidate] = []

    for directory in _FONT_DIRECTORIES:
        directory_font_candidates: list[FontCandidate] = (
            _collect_font_candidates_from_directory(directory)
        )

        font_candidates.extend(directory_font_candidates)

    return font_candidates


def _collect_font_candidates_from_directory(
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