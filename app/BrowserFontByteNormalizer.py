import logging
from io import BytesIO
from typing import Any, cast

from fontTools.misc.loggingTools import CapturingLogHandler
from fontTools.ttLib import TTFont

from app.diagnostics.probe import ProbeLevel, emit_error_probe

"""
Purpose:
    Normalize legacy/non-compliant fonts into a form
    accepted by Chromium's OpenType Sanitizer (OTS).

Motivation:
    Some Windows-renderable fonts contain malformed
    table-directory structures that are tolerated by
    Windows but rejected by modern browsers.
"""


class BrowserFontByteNormalizer:
    def __init__(self, font_id: int) -> None:
        self._fontId: int = font_id

    def normalize(self, font_bytes: bytes) -> bytes:
        source_stream = BytesIO(font_bytes)
        normalized_stream = BytesIO()

        font = TTFont(source_stream)
        removed_count: int = self.normalize_cmap(font)
        if removed_count > 0:
            emit_error_probe(
                ProbeLevel.WARNING,
                lambda: (f"Font[{self._fontId}] had {removed_count} invalid cmap mappings removed."),
            )

        logger = logging.getLogger("fontTools")
        with CapturingLogHandler(logger, level=logging.WARNING) as captured_logs:
            font.save(normalized_stream)

        records = cast(list[logging.LogRecord], captured_logs.records)  # type: ignore
        for record in records:
            # route to your probe system instead of raw terminal output
            emit_error_probe(
                ProbeLevel.WARNING,
                lambda: (f"Font[{self._fontId}] normalization warning: {record.getMessage()})"),
            )

        return normalized_stream.getvalue()

    from fontTools.ttLib import TTFont

    def normalize_cmap(self, font: TTFont) -> int:
        glyph_names = set(font.getGlyphOrder())
        cmap_table = cast(Any, font["cmap"])

        removed_mapping_count = 0

        # Accessing cmap_table.tables and subtable.cmap forces FontTools
        # to decompile/materialize cmap subtables so save() re-compiles them.
        for subtable in cmap_table.tables:
            if not subtable.isUnicode():
                continue

            invalid_codepoints: list[int] = []

            for codepoint, glyph_name in subtable.cmap.items():
                if glyph_name not in glyph_names:
                    invalid_codepoints.append(codepoint)

            for codepoint in invalid_codepoints:
                del subtable.cmap[codepoint]
                removed_mapping_count += 1

        return removed_mapping_count
