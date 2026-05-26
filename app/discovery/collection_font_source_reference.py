from dataclasses import dataclass
from io import BytesIO
from pathlib import Path

from fontTools.ttLib import TTFont

from app.discovery.font_source_reference import FontSourceReference


@dataclass(frozen=True)
class CollectionFontSourceReference(FontSourceReference):
    file_path: Path
    font_number: int

    def open_font(self) -> TTFont:
        font: TTFont = TTFont(
            self.file_path,
            fontNumber=self.font_number,
        )

        return font

    def get_file_path(self) -> Path:
        return self.file_path

    def build_source_key(self) -> tuple[Path, int | None]:
        source_key: tuple[Path, int | None] = (
            self.file_path.resolve(),
            self.font_number,
        )

        return source_key

    def describe(self) -> str:
        description: str = f"{self.file_path}#{self.font_number}"

        return description

    def get_font_bytes(self) -> bytes:
        font: TTFont = self.open_font()

        buffer: BytesIO = BytesIO()
        font.save(buffer)

        font_bytes: bytes = buffer.getvalue()

        return font_bytes
