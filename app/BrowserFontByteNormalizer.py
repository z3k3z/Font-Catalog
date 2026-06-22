import logging
from io import BytesIO
from typing import cast

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
