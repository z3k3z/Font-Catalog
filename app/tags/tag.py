from dataclasses import dataclass, field

from app.models.font_semantic_key import FontSemanticKey


@dataclass
class Tag:
    name: str
    associated_font_keys: set[FontSemanticKey] = field(default_factory=set)  # type: ignore
