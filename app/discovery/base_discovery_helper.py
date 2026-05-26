from pathlib import Path

from app.discovery.font_candidate import DiscoverySource, FontCandidate
from app.discovery.font_source_reference import FontSourceReference
from app.discovery.font_source_reference_builder import FontSourceReferenceBuilder

_SUPPORTED_EXTENSIONS: tuple[str, ...] = (
    ".ttf",
    ".otf",
    ".ttc",
)


class BaseDiscoveryHelper:
    def filter_supported_font_paths(self, paths: list[Path]) -> list[Path]:
        font_paths: list[Path] = []

        for path in paths:
            if self.is_supported_font_file(path):
                font_paths.append(path)

        return font_paths

    def is_supported_font_file(self, path: Path) -> bool:
        is_supported_file: bool = path.is_file() and path.suffix.lower() in _SUPPORTED_EXTENSIONS

        return is_supported_file

    def build_font_candidates_from_paths(
        self,
        font_paths: list[Path],
        discovery_source: DiscoverySource,
        discovery_detail: str,
    ) -> list[FontCandidate]:
        font_candidates: list[FontCandidate] = []

        for font_path in font_paths:
            source_references: list[FontSourceReference] = (
                FontSourceReferenceBuilder.build_source_references_from_path(font_path)
            )

            for source_reference in source_references:
                font_candidate: FontCandidate = FontCandidate(
                    source_reference=source_reference,
                    discovery_source=discovery_source,
                    discovery_detail=discovery_detail,
                )

                font_candidates.append(font_candidate)

        return font_candidates
