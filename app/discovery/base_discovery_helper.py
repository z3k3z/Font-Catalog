from pathlib import Path

from app.discovery.font_candidate import DiscoverySource, FontCandidate
from app.discovery.single_font_source_reference import SingleFontSourceReference

_SUPPORTED_EXTENSIONS: tuple[str, ...] = (
    ".ttf",
    ".otf",
    ".ttc",
)


def filter_supported_font_paths(paths: list[Path]) -> list[Path]:
    font_paths: list[Path] = []

    for path in paths:
        if is_supported_font_file(path):
            font_paths.append(path)

    return font_paths


def is_supported_font_file(path: Path) -> bool:
    is_supported_file: bool = path.is_file() and path.suffix.lower() in _SUPPORTED_EXTENSIONS

    return is_supported_file


def build_font_candidates_from_paths(
    font_paths: list[Path],
    discovery_source: DiscoverySource,
    discovery_detail: str,
) -> list[FontCandidate]:
    font_candidates: list[FontCandidate] = []

    for font_path in font_paths:
        font_candidate: FontCandidate = FontCandidate(
            source_reference=SingleFontSourceReference(font_path),
            discovery_source=discovery_source,
            discovery_detail=discovery_detail,
        )

        font_candidates.append(font_candidate)

    return font_candidates
