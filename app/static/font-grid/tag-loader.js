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

    async addTagToFont(fontId, tagName) {
        await this._fontApiClient.addTagToFont(fontId, tagName);
        this.invalidateFont(fontId);
    }

    invalidateFont(fontId) {
        this._tagCacheByFontId.delete(fontId);
    }

    async removeTagFromFont(fontId, tagName) {
        await this._fontApiClient.removeTagFromFont(fontId, tagName);
        this.invalidateFont(fontId);
    }
}
