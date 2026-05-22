from pydantic import BaseModel, Field


class FontResponse(BaseModel):
    family_name: str = Field(description="Font family name extracted from the font metadata name table.")

    style_name: str = Field(description="Font style name extracted from the font metadata name table.")

    full_name: str = Field(description="Full font name extracted from the font metadata name table.")

    file_path: str = Field(
        description=(
            "Resolved local file path used for discovery. "
            "This path is informational only; the browser does not currently load "
            "the font from this path."
        )
    )

    source: str = Field(
        description=(
            "Discovery source that produced the font candidate, such as file-system "
            "discovery or Windows registry discovery."
        )
    )
