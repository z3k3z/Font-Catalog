from dataclasses import dataclass
from enum import Enum
from pathlib import Path


class DiscoverySource(Enum):
    WINDOWS_FONT_DIRECTORY = "WINDOWS_FONT_DIRECTORY"
    WINDOWS_MACHINE_REGISTRY = "WINDOWS_MACHINE_REGISTRY"
    WINDOWS_USER_REGISTRY = "WINDOWS_USER_REGISTRY"


@dataclass(frozen=True)
class FontCandidate:
    file_path: Path
    discovery_source: DiscoverySource
    discovery_detail: str
