from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class FontInfo:
    family_name: str
    style_name: str
    full_name: str
    file_path: Path