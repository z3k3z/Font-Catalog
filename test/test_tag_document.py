from app.models.font_semantic_key import FontSemanticKey
from app.tags.font_tag_repository import FontTagRepository
from app.tags.tag import Tag
from app.tags.tag_document import TagFontDocument


def _build_font_key(value: str) -> FontSemanticKey:
    return FontSemanticKey.fromString(value)


def _build_repository() -> FontTagRepository:
    return FontTagRepository()


def _round_trip(repository: FontTagRepository) -> FontTagRepository:
    source_document: TagFontDocument = TagFontDocument(repository=repository)
    json_text: str = source_document.to_json()
    target_document: TagFontDocument = TagFontDocument.from_json(json_text)
    return target_document.repository


def _tag_names(repository: FontTagRepository) -> list[str]:
    return [tag.name for tag in repository.list_tags()]


def _find_required_tag(repository: FontTagRepository, name: str) -> Tag:
    for tag in repository.list_tags():
        if tag.name == name:
            return tag

    raise AssertionError(f"Expected tag was not found: {name}")


def test_empty_document_round_trips() -> None:
    repository: FontTagRepository = _build_repository()

    restored_repository: FontTagRepository = _round_trip(repository)

    assert restored_repository.list_tags() == []


def test_single_empty_tag_round_trips() -> None:
    repository: FontTagRepository = _build_repository()
    repository.create_tag("Favorite")

    restored_repository: FontTagRepository = _round_trip(repository)

    assert _tag_names(restored_repository) == ["Favorite"]
    assert _find_required_tag(restored_repository, "Favorite").associated_font_keys == set()


def test_single_tag_with_single_font_round_trips() -> None:
    repository: FontTagRepository = _build_repository()
    font_key: FontSemanticKey = _build_font_key("family|style|full")

    repository.add_font_to_tag("Favorite", font_key)

    restored_repository: FontTagRepository = _round_trip(repository)

    assert _tag_names(restored_repository) == ["Favorite"]
    assert _find_required_tag(restored_repository, "Favorite").associated_font_keys == {font_key}


def test_single_tag_with_multiple_fonts_round_trips() -> None:
    repository: FontTagRepository = _build_repository()
    font_key_a: FontSemanticKey = _build_font_key("family-a|style-a|full-a")
    font_key_b: FontSemanticKey = _build_font_key("family-b|style-b|full-b")

    repository.add_font_to_tag("Favorite", font_key_a)
    repository.add_font_to_tag("Favorite", font_key_b)

    restored_repository: FontTagRepository = _round_trip(repository)

    assert _find_required_tag(restored_repository, "Favorite").associated_font_keys == {
        font_key_a,
        font_key_b,
    }


def test_multiple_tags_round_trip() -> None:
    repository: FontTagRepository = _build_repository()

    repository.create_tag("Empty Tag")
    repository.add_font_to_tag("Favorite", _build_font_key("family-a|style-a|full-a"))
    repository.add_font_to_tag("Church Bulletin", _build_font_key("family-b|style-b|full-b"))

    restored_repository: FontTagRepository = _round_trip(repository)

    assert _tag_names(restored_repository) == ["Church Bulletin", "Empty Tag", "Favorite"]


def test_font_associated_with_multiple_tags_round_trips() -> None:
    repository: FontTagRepository = _build_repository()
    font_key: FontSemanticKey = _build_font_key("family|style|full")

    repository.add_font_to_tag("Favorite", font_key)
    repository.add_font_to_tag("Church Bulletin", font_key)

    restored_repository: FontTagRepository = _round_trip(repository)

    assert _find_required_tag(restored_repository, "Favorite").associated_font_keys == {font_key}
    assert _find_required_tag(restored_repository, "Church Bulletin").associated_font_keys == {font_key}


def test_tag_name_mixed_case_and_spaces_round_trips() -> None:
    repository: FontTagRepository = _build_repository()
    font_key: FontSemanticKey = _build_font_key("family|style|full")

    repository.add_font_to_tag("Church Bulletin", font_key)

    restored_repository: FontTagRepository = _round_trip(repository)

    assert _tag_names(restored_repository) == ["Church Bulletin"]


def test_round_trip_preserves_repository_query_behavior() -> None:
    repository: FontTagRepository = _build_repository()
    font_key: FontSemanticKey = _build_font_key("family|style|full")

    repository.add_font_to_tag("Favorite", font_key)
    repository.add_font_to_tag("Church Bulletin", font_key)
    repository.create_tag("Unused")

    restored_repository: FontTagRepository = _round_trip(repository)

    tags_for_font: list[Tag] = restored_repository.get_tags_for_font(font_key)

    assert [tag.name for tag in tags_for_font] == ["Church Bulletin", "Favorite"]


def test_round_trip_result_can_be_serialized_again() -> None:
    repository: FontTagRepository = _build_repository()

    repository.create_tag("Empty Tag")
    repository.add_font_to_tag("Favorite", _build_font_key("family|style|full"))

    first_json_text: str = TagFontDocument(repository=repository).to_json()
    restored_document: TagFontDocument = TagFontDocument.from_json(first_json_text)
    second_json_text: str = restored_document.to_json()
    second_document: TagFontDocument = TagFontDocument.from_json(second_json_text)

    assert _tag_names(second_document.repository) == ["Empty Tag", "Favorite"]
    assert _find_required_tag(second_document.repository, "Favorite").associated_font_keys == {
        _build_font_key("family|style|full")
    }
