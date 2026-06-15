export class TagLoader {
    constructor(fontApiClient) {
        this._fontApiClient = fontApiClient;
        this._tagCacheByFontId = new Map();
        this._allTags = undefined;
        this._allTagsPromise = undefined;
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
        this.invalidateAllTags();
    }

    invalidateFont(fontId) {
        this._tagCacheByFontId.delete(fontId);
    }

    async removeTagFromFont(fontId, tagName) {
        await this._fontApiClient.removeTagFromFont(fontId, tagName);
        this.invalidateFont(fontId);
    }

    async loadAllTags() {
        if (this._allTags !== undefined) {
            return this._allTags;
        }

        if (this._allTagsPromise !== undefined) {
            return await this._allTagsPromise;
        }

        this._allTagsPromise = this._loadAllTagsFromApi();

        try {
            this._allTags = await this._allTagsPromise;
            return this._allTags;
        } finally {
            this._allTagsPromise = undefined;
        }
    }

    invalidateAllTags() {
        this._allTags = undefined;
        this._allTagsPromise = undefined;
    }

    async _loadAllTagsFromApi() {
        const response = await this._fontApiClient.readTags();
        return response.tags;
    }
}
