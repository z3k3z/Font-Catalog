from dataclasses import dataclass

from app.models.font_info import FontInfo


@dataclass(frozen=True)
class FontSemanticKey:
    family_name: str
    style_name: str
    full_name: str

    @staticmethod
    def from_font_info(font_info: FontInfo) -> "FontSemanticKey":
        return FontSemanticKey(
            family_name=font_info.family_name.strip().casefold(),
            style_name=font_info.style_name.strip().casefold(),
            full_name=font_info.full_name.strip().casefold(),
        )
