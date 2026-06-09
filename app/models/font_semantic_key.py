from dataclasses import dataclass

from app.models.font_info import FontInfo


@dataclass(frozen=True)
class FontSemanticKey:
    family_name: str
    style_name: str
    full_name: str

    def asString(self) -> str:
        return "|".join(
            [
                self.family_name,
                self.style_name,
                self.full_name,
            ]
        )

    @staticmethod
    def fromString(value: str) -> "FontSemanticKey":
        parts: list[str] = value.split("|")

        if len(parts) != 3:
            raise ValueError(f"Invalid FontSemanticKey string representation: '{value}'")

        return FontSemanticKey(
            family_name=parts[0],
            style_name=parts[1],
            full_name=parts[2],
        )

    @staticmethod
    def from_font_info(font_info: FontInfo) -> "FontSemanticKey":
        return FontSemanticKey(
            family_name=font_info.family_name.strip().casefold(),
            style_name=font_info.style_name.strip().casefold(),
            full_name=font_info.full_name.strip().casefold(),
        )
