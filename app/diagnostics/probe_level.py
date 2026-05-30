import logging
from enum import Enum


class ProbeLevel(Enum):
    DEBUG = logging.DEBUG
    WARNING = logging.WARNING
    ERROR = logging.ERROR

    @staticmethod
    def from_string(probe_level_text: str) -> "ProbeLevel":
        normalized_probe_level_text: str = probe_level_text.strip().upper()

        probe_level: ProbeLevel | None = _PROBE_LEVEL_BY_NAME.get(normalized_probe_level_text)

        if probe_level is None:
            return ProbeLevel.WARNING

        return probe_level

    def to_string(self) -> str:
        return self.name


_PROBE_LEVEL_BY_NAME: dict[str, "ProbeLevel"] = {
    "DEBUG": ProbeLevel.DEBUG,
    "WARNING": ProbeLevel.WARNING,
    "ERROR": ProbeLevel.ERROR,
}
