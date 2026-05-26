from dataclasses import dataclass
from pathlib import Path

from fontTools.ttLib import TTFont

from app.discovery.font_source_reference import FontSourceReference


@dataclass(frozen=True)
class SingleFontSourceReference(FontSourceReference):
    file_path: Path

    def open_font(self) -> TTFont:
        font: TTFont = TTFont(self.file_path)

        return font

    def get_file_path(self) -> Path:
        return self.file_path

    def build_source_key(self) -> tuple[Path, int | None]:
        source_key: tuple[Path, int | None] = (
            self.file_path.resolve(),
            None,
        )

        return source_key

    def describe(self) -> str:
        description: str = str(self.file_path)

        return description
