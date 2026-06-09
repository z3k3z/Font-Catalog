import json
from dataclasses import dataclass, field
from enum import IntEnum
from typing import Any, cast

from app.models.font_semantic_key import FontSemanticKey
from app.tags.font_tag_repository import FontTagRepository
from app.tags.tag import Tag


class TagFontDocumentVersion(IntEnum):
    VERSION_1 = 1
    CURRENT_VERSION = VERSION_1


@dataclass
class TagFontDocument:
    version: TagFontDocumentVersion = TagFontDocumentVersion.CURRENT_VERSION
    repository: FontTagRepository = field(default_factory=FontTagRepository)

    @staticmethod
    def create_empty() -> TagFontDocument:
        return TagFontDocument()

    def to_json(self) -> str:
        tags: list[Tag] = self.repository.list_tags()
        payload: dict[str, object] = {
            "version": int(self.version),
            "tags": [
                {
                    "name": tag.name,
                    "associated_font_keys": [
                        font_key.asString()
                        for font_key in sorted(tag.associated_font_keys, key=lambda key: key.asString())
                    ],
                }
                for tag in tags
            ],
        }
        return json.dumps(payload, indent=4, sort_keys=True)

    @staticmethod
    def from_json(json_text: str) -> TagFontDocument:
        payload: dict[str, Any] = json.loads(json_text)

        version: int = int(payload.get("version", 1))

        if version == TagFontDocumentVersion.VERSION_1:
            return TagFontDocument._from_v1(payload)

        raise ValueError(f"Unsupported tag document version: {version}")

    @staticmethod
    def _from_v1(payload: dict[str, Any]) -> TagFontDocument:
        repo: FontTagRepository = FontTagRepository()
        tags: list[Tag] = TagFontDocument._read_tags(payload=payload)
        for tag in tags:
            repo.create_tag(name=tag.name)
            for key in tag.associated_font_keys:
                repo.add_font_to_tag(tag_name=tag.name, font_key=key)

        return TagFontDocument(repository=repo)

    @staticmethod
    def _read_tags(payload: dict[str, Any]) -> list[Tag]:
        raw_tags: object = payload.get("tags", [])

        if not isinstance(raw_tags, list):
            raise ValueError("Tag font document tags must be a list")
        validated_tags: list[object] = cast(list[object], raw_tags)

        tags: list[Tag] = []

        for raw_tag in validated_tags:
            tags.append(TagFontDocument._read_tag(raw_tag))

        return tags

    @staticmethod
    def _read_tag(raw_tag: object) -> Tag:
        if not isinstance(raw_tag, dict):
            raise ValueError("Tag entry must be a JSON object")
        validated_tag: dict[str, object] = cast(dict[str, object], raw_tag)

        raw_name: object = validated_tag.get("name")
        raw_font_keys: object = validated_tag.get("associated_font_keys", [])

        if not isinstance(raw_name, str):
            raise ValueError("Tag name must be a string")

        if not isinstance(raw_font_keys, list):
            raise ValueError("Tag associated_font_keys must be a list")
        validated_font_keys: list[str] = cast(list[str], raw_font_keys)

        associated_font_keys: set[FontSemanticKey] = set()

        for raw_font_key in validated_font_keys:
            associated_font_keys.add(FontSemanticKey.fromString(raw_font_key))

        return Tag(name=raw_name, associated_font_keys=associated_font_keys)
