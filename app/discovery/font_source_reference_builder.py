from pathlib import Path
from typing import Any, cast

from fontTools.ttLib import TTCollection, TTFont

from app.diagnostics.probe import ProbeLevel, emit_error_probe
from app.discovery.collection_font_source_reference import CollectionFontSourceReference
from app.discovery.font_source_reference import FontSourceReference
from app.discovery.single_font_source_reference import SingleFontSourceReference


class FontSourceReferenceBuilder:
    @classmethod
    def build_source_references_from_path(
        cls,
        font_path: Path,
    ) -> list[FontSourceReference]:
        result: list[FontSourceReference] = []

        if font_path.suffix.lower() == ".ttc":
            result = cls._build_collection_source_references(font_path)

        else:
            result = cls._build_single_source_reference(font_path)

        return result

    @classmethod
    def _build_single_source_reference(
        cls,
        font_path: Path,
    ) -> list[FontSourceReference]:
        source_reference: FontSourceReference = SingleFontSourceReference(font_path)

        source_references: list[FontSourceReference] = [source_reference]

        return source_references

    @classmethod
    def _build_collection_source_references(
        cls,
        font_path: Path,
    ) -> list[FontSourceReference]:
        source_references: list[FontSourceReference] = []

        try:
            font_collection: TTCollection = TTCollection(font_path)
            # font_collection is not completely typed, therefore we inspect for the expected fonts attribute
            unknown_fonts: Any = getattr(font_collection, "fonts")
            if unknown_fonts is None:
                raise RuntimeError(
                    f"TTCollection did not expose expected 'fonts' attribute for '{font_path}'."
                )
            fonts: list[TTFont] = cast(list[TTFont], unknown_fonts)
            font_count: int = len(fonts)

            for font_number in range(font_count):
                source_reference: FontSourceReference = CollectionFontSourceReference(
                    file_path=font_path,
                    font_number=font_number,
                )

                source_references.append(source_reference)

        except Exception as exception:
            emit_error_probe(
                ProbeLevel.ERROR,
                lambda: (f"Failed to enumerate font collection '{font_path}'. " f"Reason: {exception}"),
            )

        return source_references
