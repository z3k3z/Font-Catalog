from app.models.font_semantic_key import FontSemanticKey
from app.tags.tag import Tag


class TagResult:
    _value: Tag
    _has_value: bool

    def __init__(self, value: Tag | None) -> None:
        self._has_value = False
        if value is not None:
            self._value = value
            self._has_value = True

    def hasValue(self) -> bool:
        return self._has_value

    def value(self) -> Tag:
        return self._value


class TagRepositoryKey:
    _name: str

    def __init__(self, common_name: str) -> None:
        self._name = common_name

    def getRepoKey(self) -> str:
        key: str = self._name.strip().casefold()
        if key == "":
            raise ValueError("Tag name cannot be empty")

        return key

    def getTagName(self) -> str:
        return self._name.strip()


class FontTagRepository:
    def __init__(self) -> None:
        # a dictionary of tags, keyed from the name of the tag, normalized.  Each Tag holds the font keys assigned to it
        self._tags: dict[str, Tag] = {}

    def create_tag(self, name: str) -> Tag:
        return self._find_or_insert_tag(name)

    def _find_or_insert_tag(self, name: str) -> Tag:
        repoKey: TagRepositoryKey = TagRepositoryKey(name)
        result: TagResult = self._find_tag(repoKey=repoKey)

        # do we already have it?
        if result.hasValue():
            return result.value()

        # nope, create it
        return self._insert_tag(repoKey=repoKey)

    def _find_tag(self, repoKey: TagRepositoryKey) -> TagResult:
        return TagResult(self._tags.get(repoKey.getRepoKey()))

    def _insert_tag(self, repoKey: TagRepositoryKey) -> Tag:
        tag: Tag = Tag(name=repoKey.getTagName())
        self._tags[repoKey.getRepoKey()] = tag
        return tag

    def delete_tag(self, name: str) -> None:
        repoKey: TagRepositoryKey = TagRepositoryKey(name)
        self._tags.pop(repoKey.getRepoKey(), None)

    def add_font_to_tag(self, tag_name: str, font_key: FontSemanticKey) -> Tag:
        tag: Tag = self.create_tag(tag_name)
        tag.associated_font_keys.add(font_key)

        return tag

    def remove_font_from_tag(self, tag_name: str, font_key: FontSemanticKey) -> None:
        result: TagResult = self._find_tag(TagRepositoryKey(tag_name))
        if result.hasValue():
            result.value().associated_font_keys.discard(font_key)

        return

    def list_tags(self) -> list[Tag]:
        return sorted(self._tags.values(), key=lambda tag: tag.name.casefold())

    def get_tags_for_font(self, font_key: FontSemanticKey) -> list[Tag]:
        tags: list[Tag] = []

        # for each tag, check if it has a link to the given font
        for tag in self.list_tags():
            if font_key in tag.associated_font_keys:
                tags.append(tag)

        return tags

    def rename_tag(self, existing_name: str, new_name: str) -> Tag:
        # if new name exits, we will merge into it
        result: TagResult = self._find_tag(repoKey=TagRepositoryKey(new_name))
        if result.hasValue():
            return self._merge_into_tag(existing_name=existing_name, target_tag=result.value())

        return self._rename_tag(existing_name=existing_name, new_name=new_name)

    def _merge_into_tag(self, existing_name: str, target_tag: Tag) -> Tag:
        result: TagResult = self._find_tag(repoKey=TagRepositoryKey(existing_name))
        if not result.hasValue():
            raise ValueError(f"existing tag:{existing_name} does not exist.")

        # copy all associated fonts over to the target
        target_tag.associated_font_keys.update(result.value().associated_font_keys)

        # remove the existing tag
        self.delete_tag(existing_name)

        return target_tag

    def _rename_tag(self, existing_name: str, new_name: str) -> Tag:
        # create a new tag with the updated name
        target_tag: Tag = self._insert_tag(repoKey=TagRepositoryKey(new_name))

        # merge the old into the new
        return self._merge_into_tag(existing_name=existing_name, target_tag=target_tag)
