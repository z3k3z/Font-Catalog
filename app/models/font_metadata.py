from dataclasses import dataclass


@dataclass(frozen=True)
class FontMetadata:
    family_name: str = ""
    style_name: str = ""
    full_name: str = ""
    postscript_name: str = ""
    typographic_family_name: str = ""
    typographic_subfamily_name: str = ""
    version: str = ""
    manufacturer: str = ""
    designer: str = ""
    description: str = ""
    copyright: str = ""
    trademark: str = ""
    glyph_count: int = 0
