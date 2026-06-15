from pydantic import BaseModel


class TagResponse(BaseModel):
    name: str


class TagsResponse(BaseModel):
    tags: list[TagResponse]
