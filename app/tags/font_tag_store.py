from pathlib import Path

from app.tags.tag_document import TagFontDocument


class FontTagStore:
    def __init__(self, file_path: Path) -> None:
        self._file_path = file_path

    def load(self) -> TagFontDocument:
        if not self._file_path.exists():
            return TagFontDocument.create_empty()

        json_text: str = self._file_path.read_text(encoding="utf-8")

        return TagFontDocument.from_json(json_text)

    def save(self, document: TagFontDocument) -> None:
        self._file_path.parent.mkdir(parents=True, exist_ok=True)

        self._file_path.write_text(document.to_json(), encoding="utf-8")
