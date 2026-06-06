from collections.abc import Iterator
from dataclasses import dataclass
from pathlib import Path

from app.discovery.font_source_reference import FontSourceReference
from app.models.font_info import FontInfo
from app.models.font_semantic_key import FontSemanticKey


@dataclass
class FontInfoCollection:
    _fontInfos: list[FontInfo]
    _keyedIndex: dict[FontSemanticKey, FontInfo]
    _fontInfosBySourceKey: dict[tuple[Path, int | None], list[FontInfo]]

    def __init__(self) -> None:
        self._fontInfos = []
        self._keyedIndex = {}
        self._fontInfosBySourceKey = {}

    def insert(self, font_info: FontInfo) -> bool:
        key: FontSemanticKey = FontSemanticKey.from_font_info(font_info)

        fInserted: bool = False

        if key not in self._keyedIndex:
            self._fontInfos.append(font_info)
            self._keyedIndex[key] = font_info
            source_key: tuple[Path, int | None] = (
                font_info.font_candidate.source_reference.build_source_key()
            )

            if source_key not in self._fontInfosBySourceKey:
                self._fontInfosBySourceKey[source_key] = []

            self._fontInfosBySourceKey[source_key].append(font_info)

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
        key: FontSemanticKey = FontSemanticKey.from_font_info(font_info)
        fContains: bool = key in self._keyedIndex

        return fContains

    def contains_source_reference(
        self,
        source_reference: FontSourceReference,
    ) -> bool:
        source_key: tuple[Path, int | None] = source_reference.build_source_key()
        fContains: bool = source_key in self._fontInfosBySourceKey

        return fContains

    def get(self, font_info: FontInfo) -> FontInfo | None:
        key: FontSemanticKey = FontSemanticKey.from_font_info(font_info)
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
