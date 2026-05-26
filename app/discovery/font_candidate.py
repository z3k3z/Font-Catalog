from dataclasses import dataclass
from enum import Enum

from app.discovery.font_source_reference import FontSourceReference


class DiscoverySource(Enum):
    WINDOWS_FONT_DIRECTORY = "WINDOWS_FONT_DIRECTORY"
    WINDOWS_MACHINE_REGISTRY = "WINDOWS_MACHINE_REGISTRY"
    WINDOWS_USER_REGISTRY = "WINDOWS_USER_REGISTRY"


@dataclass(frozen=True)
class FontCandidate:
    source_reference: FontSourceReference
    discovery_source: DiscoverySource
    discovery_detail: str
