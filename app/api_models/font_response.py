from pydantic import BaseModel, Field


class FontResponse(BaseModel):
    id: int = Field(
        description=(
            "Opaque runtime font handle assigned by the backend catalog. "
            "The frontend should treat this as an identifier only."
        )
    )

    family_name: str = Field(description="Font family name extracted from the font metadata name table.")

    style_name: str = Field(description="Font style name extracted from the font metadata name table.")

    full_name: str = Field(description="Full font name extracted from the font metadata name table.")
