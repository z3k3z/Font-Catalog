from pydantic import BaseModel


class TagSnapshotItemResponse(BaseModel):
    name: str
    font_ids: list[str]


class TagSnapshotResponse(BaseModel):
    tags: list[TagSnapshotItemResponse]
