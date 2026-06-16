from dataclasses import dataclass

from app.models.font_info import FontInfo
from app.models.font_semantic_key import FontSemanticKey


@dataclass(frozen=True)
class CatalogFontRecord:
    font_id: int
    font_info: FontInfo


class FontCatalog:
    def __init__(self) -> None:
        self._nextFontId: int = 1
        self._records: list[CatalogFontRecord] = []
        self._indexById: dict[int, CatalogFontRecord] = {}
        self._indexOfKeyToId: dict[str, int] = {}

    def load_fonts(self, font_infos: list[FontInfo]) -> None:
        self._records = []
        self._indexById = {}
        self._indexOfKeyToId = {}
        self._nextFontId = 1

        for font_info in font_infos:
            self._add_font(font_info)

    def get_records(self) -> list[CatalogFontRecord]:
        records: list[CatalogFontRecord] = list(self._records)

        return records

    def get_record_by_id(self, font_id: int) -> CatalogFontRecord | None:
        record: CatalogFontRecord | None = self._indexById.get(font_id)

        return record

    def get_record_by_key(self, font_key_as_str: str) -> CatalogFontRecord | None:
        record: CatalogFontRecord | None = None
        id: int | None = self._indexOfKeyToId.get(font_key_as_str)
        if id is not None:
            record: CatalogFontRecord | None = self._indexById.get(id)

        return record

    def __len__(self) -> int:
        length: int = len(self._records)

        return length

    def _add_font(self, font_info: FontInfo) -> None:
        font_id: int = self._nextFontId
        self._nextFontId += 1

        record: CatalogFontRecord = CatalogFontRecord(
            font_id=font_id,
            font_info=font_info,
        )

        self._records.append(record)
        self._indexById[font_id] = record
        self._indexOfKeyToId[FontSemanticKey.from_font_info(font_info).asString()] = font_id
