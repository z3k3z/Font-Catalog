from app.models.font_semantic_key import FontSemanticKey
from app.tags.font_tag_repository import FontTagRepository
from app.tags.tag import Tag


def _build_font_key(family_name: str, style: str = "", full_name: str = "") -> FontSemanticKey:
    return FontSemanticKey(family_name, style, full_name)


def test_create_tag_creates_tag() -> None:
    repository: FontTagRepository = FontTagRepository()

    tag: Tag = repository.create_tag("Favorite")

    assert tag.name == "Favorite"
    assert tag.associated_font_keys == set()
    assert len(repository.list_tags()) == 1


def test_create_tag_trims_name() -> None:
    repository: FontTagRepository = FontTagRepository()

    tag: Tag = repository.create_tag("  Favorite  ")

    assert tag.name == "Favorite"


def test_create_tag_returns_existing_tag_for_case_insensitive_match() -> None:
    repository: FontTagRepository = FontTagRepository()

    original_tag: Tag = repository.create_tag("Favorite")
    matching_tag: Tag = repository.create_tag("favorite")

    assert matching_tag is original_tag
    assert len(repository.list_tags()) == 1


def test_create_tag_rejects_empty_name() -> None:
    repository: FontTagRepository = FontTagRepository()

    try:
        repository.create_tag("   ")
    except ValueError:
        return

    raise AssertionError("Expected ValueError for empty tag name")


def test_delete_tag_removes_tag() -> None:
    repository: FontTagRepository = FontTagRepository()

    repository.create_tag("Favorite")
    repository.delete_tag("Favorite")

    assert repository.list_tags() == []


def test_delete_tag_ignores_missing_tag() -> None:
    repository: FontTagRepository = FontTagRepository()

    repository.delete_tag("Missing")

    assert repository.list_tags() == []


def test_add_font_to_tag_creates_tag_when_missing() -> None:
    repository: FontTagRepository = FontTagRepository()
    font_key: FontSemanticKey = _build_font_key("font-a")

    tag: Tag = repository.add_font_to_tag("Favorite", font_key)

    assert tag.name == "Favorite"
    assert tag.associated_font_keys == {font_key}


def test_add_font_to_existing_tag_adds_association() -> None:
    repository: FontTagRepository = FontTagRepository()
    font_key: FontSemanticKey = _build_font_key("font-a")

    repository.create_tag("Favorite")
    tag: Tag = repository.add_font_to_tag("Favorite", font_key)

    assert tag.associated_font_keys == {font_key}


def test_add_font_to_tag_is_idempotent() -> None:
    repository: FontTagRepository = FontTagRepository()
    font_key: FontSemanticKey = _build_font_key("font-a")

    repository.add_font_to_tag("Favorite", font_key)
    tag: Tag = repository.add_font_to_tag("Favorite", font_key)

    assert tag.associated_font_keys == {font_key}


def test_remove_font_from_tag_removes_association() -> None:
    repository: FontTagRepository = FontTagRepository()
    font_key: FontSemanticKey = _build_font_key("font-a")

    repository.add_font_to_tag("Favorite", font_key)
    repository.remove_font_from_tag("Favorite", font_key)

    tag: Tag = repository.list_tags()[0]

    assert tag.name == "Favorite"
    assert tag.associated_font_keys == set()


def test_remove_font_from_tag_preserves_empty_tag() -> None:
    repository: FontTagRepository = FontTagRepository()
    font_key: FontSemanticKey = _build_font_key("font-a")

    repository.add_font_to_tag("Favorite", font_key)
    repository.remove_font_from_tag("Favorite", font_key)

    assert len(repository.list_tags()) == 1
    assert repository.list_tags()[0].name == "Favorite"


def test_remove_font_from_missing_tag_does_nothing() -> None:
    repository: FontTagRepository = FontTagRepository()
    font_key: FontSemanticKey = _build_font_key("font-a")

    repository.remove_font_from_tag("Missing", font_key)

    assert repository.list_tags() == []


def test_get_tags_for_font_returns_associated_tags() -> None:
    repository: FontTagRepository = FontTagRepository()
    font_key: FontSemanticKey = _build_font_key("font-a")

    repository.add_font_to_tag("Favorite", font_key)
    repository.add_font_to_tag("Church Bulletin", font_key)
    repository.create_tag("Unused")

    tags: list[Tag] = repository.get_tags_for_font(font_key)

    assert [tag.name for tag in tags] == ["Church Bulletin", "Favorite"]


def test_get_tags_for_font_returns_empty_list_when_no_tags_match() -> None:
    repository: FontTagRepository = FontTagRepository()
    font_key: FontSemanticKey = _build_font_key("font-a")

    repository.create_tag("Favorite")

    assert repository.get_tags_for_font(font_key) == []


def test_rename_tag_changes_display_name() -> None:
    repository: FontTagRepository = FontTagRepository()

    repository.create_tag("Favorite")
    renamed_tag: Tag = repository.rename_tag(existing_name="Favorite", new_name="Favorites")

    assert renamed_tag.name == "Favorites"
    assert [tag.name for tag in repository.list_tags()] == ["Favorites"]


def test_rename_tag_preserves_associations() -> None:
    repository: FontTagRepository = FontTagRepository()
    font_key: FontSemanticKey = _build_font_key("font-a")

    repository.add_font_to_tag("Favorite", font_key)
    renamed_tag: Tag = repository.rename_tag(existing_name="Favorite", new_name="Favorites")

    assert renamed_tag.name == "Favorites"
    assert renamed_tag.associated_font_keys == {font_key}


def test_rename_tag_merges_when_target_exists() -> None:
    repository: FontTagRepository = FontTagRepository()
    font_key_a: FontSemanticKey = _build_font_key("font-a")
    font_key_b: FontSemanticKey = _build_font_key("font-b")

    repository.add_font_to_tag("Favorite", font_key_a)
    repository.add_font_to_tag("Favorites", font_key_b)

    merged_tag: Tag = repository.rename_tag(existing_name="Favorites", new_name="Favorite")

    assert merged_tag.name == "Favorite"
    assert merged_tag.associated_font_keys == {font_key_a, font_key_b}
    assert [tag.name for tag in repository.list_tags()] == ["Favorite"]


def test_add_font_to_tag_uses_case_insensitive_existing_tag() -> None:
    repository: FontTagRepository = FontTagRepository()
    font_key_a: FontSemanticKey = _build_font_key("font-a")
    font_key_b: FontSemanticKey = _build_font_key("font-b")

    repository.add_font_to_tag("Favorite", font_key_a)
    repository.add_font_to_tag("favorite", font_key_b)

    assert len(repository.list_tags()) == 1
    assert repository.list_tags()[0].name == "Favorite"
    assert repository.list_tags()[0].associated_font_keys == {font_key_a, font_key_b}


def test_rename_missing_tag_raises_value_error() -> None:
    repository: FontTagRepository = FontTagRepository()

    try:
        repository.rename_tag(existing_name="Missing", new_name="Favorite")
    except ValueError:
        return

    raise AssertionError("Expected ValueError for missing source tag")
