import json
from dataclasses import asdict, dataclass, field
from enum import IntEnum
from typing import Any


class TagFontDocumentVersion(IntEnum):
    VERSION_1 = 1
    CURRENT_VERSION = VERSION_1


@dataclass
class PersistedTag:
    name: str
    associated_font_keys: list[str] = field(default_factory=list[str])


@dataclass
class TagFontDocument:
    version: TagFontDocumentVersion = TagFontDocumentVersion.CURRENT_VERSION
    tags: list[PersistedTag] = field(default_factory=list[PersistedTag])

    @staticmethod
    def create_empty() -> TagFontDocument:
        return TagFontDocument()

    def to_json(self) -> str:
        return json.dumps(asdict(self), indent=4, sort_keys=True)

    @staticmethod
    def from_json(json_text: str) -> TagFontDocument:
        payload: dict[str, Any] = json.loads(json_text)

        version: int = int(payload.get("version", 1))

        if version == TagFontDocumentVersion.VERSION_1:
            return TagFontDocument._from_v1(payload)

        raise ValueError(f"Unsupported tag document version: {version}")

    @staticmethod
    def _from_v1(payload: dict[str, Any]) -> TagFontDocument:
        raw_tags: Any = payload.get("tags", [])
        if not isinstance(raw_tags, list):
            raise ValueError("Expected tags to be a list")

        tag_payloads: list[Any] = raw_tags  # type: ignore

        tags: list[PersistedTag] = []

        for tag_payload in tag_payloads:
            if not isinstance(tag_payload, dict):
                raise ValueError("Expected tag entry to be an object")

            raw_font_keys: Any = tag_payload.get("associated_font_keys", [])  # type: ignore

            if not isinstance(raw_font_keys, list):
                raise ValueError("Expected associated_font_keys to be a list")

            associated_font_keys: list[str] = [str(font_key) for font_key in raw_font_keys]  # type: ignore

            tags.append(
                PersistedTag(
                    name=str(tag_payload.get("name")),  # type: ignore
                    associated_font_keys=associated_font_keys,
                )
            )

        return TagFontDocument(tags=tags)
