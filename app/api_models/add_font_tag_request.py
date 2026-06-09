from pydantic import BaseModel


class AddFontTagRequest(BaseModel):
    tag_name: str
