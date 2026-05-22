from collections.abc import Callable, Iterator
from dataclasses import dataclass
from pathlib import Path

from app.models.font_info import FontInfo

FontInfoKeyBuilder = Callable[[FontInfo], tuple[str, str, str]]


@dataclass
class FontInfoCollection:
    _keyBuilder: FontInfoKeyBuilder
    _fontInfos: list[FontInfo]
    _keyedIndex: dict[tuple[str, str, str], FontInfo]
    _pathIndex: dict[Path, list[FontInfo]]  # one or more

    def __init__(self, key_builder: FontInfoKeyBuilder) -> None:
        self._keyBuilder = key_builder
        self._fontInfos = []
        self._keyedIndex = {}
        self._pathIndex = {}

    def insert(self, font_info: FontInfo) -> bool:
        key: tuple[str, str, str] = self._keyBuilder(font_info)

        fInserted: bool = False

        if key not in self._keyedIndex:
            self._fontInfos.append(font_info)
            self._keyedIndex[key] = font_info
            pathKey: Path = self._build_path_key(font_info.font_candidate.file_path)
            if not pathKey in self._pathIndex:
                self._pathIndex[pathKey] = []
            self._pathIndex[pathKey].append(font_info)

            fInserted = True

        return fInserted

    def _build_path_key(self, path: Path) -> Path:
        path_key: Path = path.resolve().absolute()

        return path_key

    def insert_all(self, font_infos: list[FontInfo]) -> int:
        count: int = 0
        for font_info in font_infos:
            if self.insert(font_info):
                count += 1
        return count

    def contains(self, font_info: FontInfo) -> bool:
        key: tuple[str, str, str] = self._keyBuilder(font_info)
        fContains: bool = key in self._keyedIndex

        return fContains

    def contains_path(self, path: Path) -> bool:
        fContains: bool = self._build_path_key(path) in self._pathIndex

        return fContains

    def get(self, font_info: FontInfo) -> FontInfo | None:
        key: tuple[str, str, str] = self._keyBuilder(font_info)
        existingFontInfo: FontInfo | None = self._keyedIndex.get(key)

        return existingFontInfo

    def __iter__(self) -> Iterator[FontInfo]:
        iterator: Iterator[FontInfo] = iter(self._fontInfos)

        return iterator

    def __len__(self) -> int:
        length: int = len(self._fontInfos)

        return length

    def to_list(self) -> list[FontInfo]:
        fontInfos: list[FontInfo] = list(self._fontInfos)

        return fontInfos
