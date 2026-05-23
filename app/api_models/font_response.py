from pydantic import BaseModel, Field


class FontResponse(BaseModel):
    id: int = Field(
        description=(
            "Opaque runtime font handle assigned by the backend catalog. "
            "The frontend should treat this as an identifier only and should "
            "not infer font identity semantics from its value."
        )
    )

    family_name: str = Field(description="Font family name extracted from the font metadata name table.")

    style_name: str = Field(description="Font style name extracted from the font metadata name table.")

    full_name: str = Field(description="Full font name extracted from the font metadata name table.")

    file_path: str = Field(
        description=(
            "Resolved local file path used for discovery. Informational only; "
            "frontend font rendering should use catalog font endpoints rather "
            "than directly using this path."
        )
    )

    source: str = Field(description="Discovery source that produced the originating font candidate.")
