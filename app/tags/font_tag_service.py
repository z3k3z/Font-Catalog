from app.models.font_semantic_key import FontSemanticKey
from app.tags.font_tag_repository import FontTagRepository
from app.tags.font_tag_store import FontTagStore
from app.tags.tag import Tag
from app.tags.tag_document import TagFontDocument


class FontTagService:
    def __init__(self, store: FontTagStore) -> None:
        self._store = store
        self._repository: FontTagRepository = self._store.load().repository

    def add_tag_to_font(self, tag_name: str, font_key: FontSemanticKey) -> None:
        self._repository.add_font_to_tag(tag_name=tag_name, font_key=font_key)
        self._save()

    def _save(self) -> None:
        self._store.save(TagFontDocument(repository=self._repository))

    def get_tags_for_font(self, font_key: FontSemanticKey) -> list[Tag]:
        return self._repository.get_tags_for_font(font_key)

    def remove_tag_from_font(self, tag_name: str, font_key: FontSemanticKey) -> None:
        self._repository.remove_font_from_tag(tag_name=tag_name, font_key=font_key)
        self._save()
