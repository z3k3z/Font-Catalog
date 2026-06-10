from pydantic import BaseModel, Field


class FontTagResponse(BaseModel):
    name: str = Field(description="User-visible tag name assigned to the font")


class FontTagsResponse(BaseModel):
    tags: list[FontTagResponse] = Field(description="Tags assigned to the font")
