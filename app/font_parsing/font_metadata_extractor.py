from dataclasses import dataclass
from typing import Any

from fontTools.ttLib import TTFont

from app.diagnostics.probe import ProbeLevel, emit_error_probe
from app.models.font_metadata import FontMetadata


@dataclass(frozen=True)
class FontNameMetadataDefinition:
    field_name: str
    name_id: int
    display_name: str


@dataclass(frozen=True)
class PlatformLanguageKey:
    platform_id: int
    language_id: int


type NameValue = str
type NameRecordLookup = dict[PlatformLanguageKey, NameValue]


class NameRecordResult:
    _value: NameValue
    _has_value: bool

    def __init__(self, value: NameValue | None) -> None:
        self._has_value = False
        if value is not None:
            self._value = value
            self._has_value = True

    def hasValue(self) -> bool:
        return self._has_value

    def value(self) -> NameValue:
        return self._value


class FontMetadataExtractor:
    # OpenType name table IDs used here:
    # 0  = Copyright
    # 5  = Version
    # 6  = PostScript name
    # 7  = Trademark
    # 8  = Manufacturer
    # 9  = Designer
    # 10 = Description
    # 16 = Typographic family
    # 17 = Typographic subfamily
    _NAME_DEFINITIONS: tuple[FontNameMetadataDefinition, ...] = (
        FontNameMetadataDefinition("family_name", 1, "Family name"),
        FontNameMetadataDefinition("style_name", 2, "Style name"),
        FontNameMetadataDefinition("full_name", 4, "Full font name"),
        FontNameMetadataDefinition("postscript_name", 6, "PostScript name"),
        FontNameMetadataDefinition("typographic_family_name", 16, "Typographic family name"),
        FontNameMetadataDefinition("typographic_subfamily_name", 17, "Typographic subfamily name"),
        FontNameMetadataDefinition("version", 5, "Version"),
        FontNameMetadataDefinition("manufacturer", 8, "Manufacturer"),
        FontNameMetadataDefinition("designer", 9, "Designer"),
        FontNameMetadataDefinition("description", 10, "Description"),
        FontNameMetadataDefinition("copyright", 0, "Copyright"),
        FontNameMetadataDefinition("trademark", 7, "Trademark"),
    )

    # OpenType platform/encoding/language preference.
    # Prefer Windows Unicode English records, then Macintosh English,
    # then any decodable matching record.
    _WINDOWS_PLATFORM_ID: int = 3
    _MACINTOSH_PLATFORM_ID: int = 1
    _WINDOWS_ENGLISH_LANGUAGE_ID: int = 0x0409
    _MACINTOSH_ENGLISH_LANGUAGE_ID: int = 0

    def extract(self, font: TTFont) -> FontMetadata:
        name_values: dict[str, str] = {}

        for definition in FontMetadataExtractor._NAME_DEFINITIONS:
            name_values[definition.field_name] = self._read_name(
                font,
                definition,
            )

        metadata: FontMetadata = FontMetadata(
            family_name=name_values.get("family_name", ""),
            style_name=name_values.get("style_name", ""),
            full_name=name_values.get("full_name", ""),
            postscript_name=name_values.get("postscript_name", ""),
            typographic_family_name=name_values.get("typographic_family_name", ""),
            typographic_subfamily_name=name_values.get("typographic_subfamily_name", ""),
            version=name_values.get("version", ""),
            manufacturer=name_values.get("manufacturer", ""),
            designer=name_values.get("designer", ""),
            description=name_values.get("description", ""),
            copyright=name_values.get("copyright", ""),
            trademark=name_values.get("trademark", ""),
            glyph_count=self._read_glyph_count(font),
        )

        return metadata

    def _read_name(self, font: TTFont, definition: FontNameMetadataDefinition) -> str:

        nameRecordLookup: NameRecordLookup = self._buildNameRecordLookup(font, definition)

        result: NameRecordResult = self._read_preferred_name_value(nameRecordLookup, definition)
        if not result.hasValue():
            emit_error_probe(
                ProbeLevel.DEBUG,
                lambda: (
                    "Font metadata had no decodable value."
                    f"field={definition.display_name!r} "
                    f"name_id={definition.name_id} "
                    f"record_count={len(nameRecordLookup)}"
                ),
            )
            return ""

        return result.value()

    def _buildNameRecordLookup(
        self, font: TTFont, definition: FontNameMetadataDefinition
    ) -> NameRecordLookup:
        nameTable: Any | None = font.get("name")

        nameRecordLookup: NameRecordLookup = {}

        if nameTable is not None:
            for nameRecord in nameTable.names:
                if nameRecord.nameID == definition.name_id:
                    self._insert_name_record_value(
                        nameRecordLookup=nameRecordLookup, nameRecord=nameRecord, definition=definition
                    )
        else:
            emit_error_probe(
                ProbeLevel.WARNING,
                lambda: (
                    "Font metadata extraction skipped because the font has no name table. "
                    f"field={definition.display_name!r} "
                    f"name_id={definition.name_id}"
                ),
            )

        return nameRecordLookup

    def _insert_name_record_value(
        self, nameRecordLookup: NameRecordLookup, nameRecord: Any, definition: FontNameMetadataDefinition
    ) -> None:
        decoded_value: str = self._decode_name_record(nameRecord)

        if len(decoded_value) > 0:
            platformLanguageKey: PlatformLanguageKey = PlatformLanguageKey(
                platform_id=nameRecord.platformID,
                language_id=nameRecord.langID,
            )
            if platformLanguageKey not in nameRecordLookup:
                nameRecordLookup[platformLanguageKey] = decoded_value
            else:
                emit_error_probe(
                    ProbeLevel.DEBUG,
                    lambda: (
                        "Skipping duplicate font metadata record."
                        f"field={definition.display_name!r} "
                        f"name_id={definition.name_id} "
                        f"platform_id={nameRecord.platformID} "
                        f"language_id={nameRecord.langID}"
                        f"value={decoded_value}"
                    ),
                )
        return

    def _read_preferred_name_value(
        self, nameRecordLookup: NameRecordLookup, definition: FontNameMetadataDefinition
    ) -> NameRecordResult:
        selected_mode: str | None = None
        result: NameRecordResult = self._read_windows_english_name_value(nameRecordLookup)
        if not result.hasValue():
            selected_mode = "Macintosh English fallback"
            result = self._read_macintosh_english_name_value(nameRecordLookup)
        if not result.hasValue():
            selected_mode = "first decodable fallback"
            result = self._read_first_available_value(nameRecordLookup)

        if result.hasValue() and selected_mode is not None:
            emit_error_probe(
                ProbeLevel.DEBUG,
                lambda: (
                    f"Font metadata used {selected_mode}. "
                    f"field={definition.display_name!r} "
                    f"name_id={definition.name_id}"
                ),
            )
        return result

    def _lookup_value(
        self, nameRecordLookup: NameRecordLookup, platform_ID: int, language_ID: int
    ) -> NameRecordResult:

        key: PlatformLanguageKey = PlatformLanguageKey(
            platform_id=platform_ID,
            language_id=language_ID,
        )
        return NameRecordResult(value=nameRecordLookup.get(key))

    def _read_windows_english_name_value(self, nameRecordLookup: NameRecordLookup) -> NameRecordResult:
        return self._lookup_value(
            nameRecordLookup=nameRecordLookup,
            platform_ID=FontMetadataExtractor._WINDOWS_PLATFORM_ID,
            language_ID=FontMetadataExtractor._WINDOWS_ENGLISH_LANGUAGE_ID,
        )

    def _read_macintosh_english_name_value(self, nameRecordLookup: NameRecordLookup) -> NameRecordResult:
        return self._lookup_value(
            nameRecordLookup=nameRecordLookup,
            platform_ID=FontMetadataExtractor._MACINTOSH_PLATFORM_ID,
            language_ID=FontMetadataExtractor._MACINTOSH_ENGLISH_LANGUAGE_ID,
        )

    def _read_first_available_value(self, nameRecordLookup: NameRecordLookup) -> NameRecordResult:
        return NameRecordResult(
            value=next(
                iter(nameRecordLookup.values()),
                None,
            )
        )

    def _decode_name_record(self, name_record: Any) -> str:
        try:
            decoded_value: str = name_record.toUnicode().strip()

            return decoded_value

        except UnicodeDecodeError as exception:
            emit_error_probe(
                ProbeLevel.WARNING,
                lambda: (
                    "Font metadata name record failed Unicode decoding. "
                    f"name_id={name_record.nameID} "
                    f"platform_id={name_record.platformID} "
                    f"platform_encoding_id={name_record.platEncID} "
                    f"language_id={name_record.langID} "
                    f"reason={exception}"
                ),
            )

            return ""

    def _read_glyph_count(self, font: TTFont) -> int:
        try:
            glyph_order: list[str] = font.getGlyphOrder()
            glyph_count: int = len(glyph_order)

            if glyph_count == 0:
                emit_error_probe(ProbeLevel.DEBUG, lambda: "Font metadata glyph count resolved to zero.")

            return glyph_count

        except Exception as exception:
            emit_error_probe(
                ProbeLevel.WARNING,
                lambda: ("Font metadata could not read glyph count. " f"reason={exception}"),
            )

            return 0
