export class TagLoader {
    constructor(fontApiClient) {
        this._fontApiClient = fontApiClient;
        this._tagCacheByFontId = new Map();
    }

    async loadTagsForFont(fontId) {
        const cachedTags = this._tagCacheByFontId.get(fontId);

        if (cachedTags !== undefined) {
            return cachedTags;
        }

        const response = await this._fontApiClient.readFontTags(fontId);
        const tags = response.tags;

        this._tagCacheByFontId.set(fontId, tags);

        return tags;
    }

    invalidateFont(fontId) {
        this._tagCacheByFontId.delete(fontId);
    }
}
