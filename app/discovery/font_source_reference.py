from abc import ABC, abstractmethod
from pathlib import Path

from fontTools.ttLib import TTFont


class FontSourceReference(ABC):
    @abstractmethod
    def open_font(self) -> TTFont:
        raise NotImplementedError

    @abstractmethod
    def get_file_path(self) -> Path:
        raise NotImplementedError

    @abstractmethod
    def build_source_key(self) -> tuple[Path, int | None]:
        raise NotImplementedError

    @abstractmethod
    def describe(self) -> str:
        raise NotImplementedError

    @abstractmethod
    def get_font_bytes(self) -> bytes:
        raise NotImplementedError
