from dataclasses import dataclass

from app.discovery.font_candidate import FontCandidate
from app.models.font_metadata import FontMetadata


@dataclass(frozen=True)
class FontInfo:
    family_name: str
    style_name: str
    full_name: str
    metadata: FontMetadata
    font_candidate: FontCandidate
