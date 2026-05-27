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
}
