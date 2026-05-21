from dataclasses import dataclass
from app.discovery.font_candidate import FontCandidate


@dataclass(frozen=True)
class FontInfo:
    family_name: str
    style_name: str
    full_name: str
    font_candidate: FontCandidate
