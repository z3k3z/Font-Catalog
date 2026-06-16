export class TagSnapshot {
    constructor(tags) {
        this._fontIdsByTagName = new Map();

        for (const tag of tags) {
            this._fontIdsByTagName.set(tag.name, new Set(tag.font_ids));
        }
    }

    hasFontForTag(fontId, tagName) {
        const fontIds = this._fontIdsByTagName.get(tagName);

        if (fontIds === undefined) {
            return false;
        }

        return fontIds.has(String(fontId));
    }
}
