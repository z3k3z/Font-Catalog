import { _diags } from "../diagnostics/diagnostics.js";

export class FontApiClient {
    constructor(baseUrl) {
        this._baseUrl = baseUrl;
    }

    async getFonts() {
        try {
            _diags.emitDebugProbe(() => "Requesting font metadata from backend.");

            const response = await fetch(`${this._baseUrl}/api/fonts`);

            if (!response.ok) {
                _diags.emitErrorProbe(
                    () =>
                        `Failed to load font metadata. ` +
                        `Status: ${response.status} ${response.statusText}.`
                );

                return [];
            }

            const fonts = await response.json();

            _diags.emitDebugProbe(() => `Received ${fonts.length} font metadata records.`);

            return fonts;
        } catch (error) {
            _diags.emitErrorProbe(() => `Exception while loading font metadata: ${error}`);

            return [];
        }
    }

    buildFontFileUrl(fontId) {
        const fontFileUrl = `${this._baseUrl}/api/fonts/${fontId}/file`;

        return fontFileUrl;
    }

    async readFontTags(fontId) {
        const response = await fetch(`/api/fonts/${fontId}/tags`);

        if (!response.ok) {
            throw new Error(`Failed to read font tags for ${fontId}: ${response.status}`);
        }

        return await response.json();
    }

    async addTagToFont(fontId, tagName) {
        const response = await fetch(`/api/fonts/${fontId}/tags`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tag_name: tagName }),
        });

        if (!response.ok) {
            throw new Error(`Failed to add tag '${tagName}' to font ${fontId}: ${response.status}`);
        }
    }

    async removeTagFromFont(fontId, tagName) {
        const encodedTagName = encodeURIComponent(tagName);
        const response = await fetch(`/api/fonts/${fontId}/tags/${encodedTagName}`, { method: "DELETE" });

        if (!response.ok) {
            throw new Error(`Failed to remove tag '${tagName}' from font ${fontId}: ${response.status}`);
        }
    }
}
