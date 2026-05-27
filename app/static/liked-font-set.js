export class LikedFontSet {
    constructor() {
        this._fontById = new Map();
    }

    addFont(font) {
        const wasAdded = !this._fontById.has(font.id);

        if (wasAdded) {
            this._fontById.set(font.id, font);
        }

        return wasAdded;
    }

    getCount() {
        return this._fontById.size;
    }

    getFonts() {
        const fonts = Array.from(this._fontById.values());

        return fonts;
    }
}
