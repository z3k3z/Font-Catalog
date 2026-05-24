import { _diags } from "./diagnostics.js";

export class FontLoader {
    constructor(fontApiClient) {
        this._fontApiClient = fontApiClient;
        this._styleElementId = this._createStyleElement();
        this._loadedFontIds = new Set();
    }

    ensureFontFaceRegistered(font) {
        if (this._loadedFontIds.has(font.id)) {
            return;
        }

        this._registerFontFace(font);
        this._loadedFontIds.add(font.id);

        _diags.emitDebugProbe(() => `Registered font face for font id ${font.id}: ${font.full_name}.`);
    }

    buildFontCssFamily(font) {
        const fontCssFamily = `FontCatalog_${font.id}`;

        return fontCssFamily;
    }

    _createStyleElement() {
        const styleElement = document.createElement("style");
        styleElement.id = "fontCatalogDynamicFontFaces";
        document.head.appendChild(styleElement);

        return styleElement.id;
    }

    _registerFontFace(font) {
        const styleElement = document.getElementById(this._styleElementId);

        if (styleElement === null) {
            _diags.emitErrorProbe(
                () => `Unable to locate font-face style element '${this._styleElementId}'.`
            );

            return;
        }

        const fontFileUrl = this._fontApiClient.buildFontFileUrl(font.id);

        const cssText = `
@font-face {
    font-family: "${this.buildFontCssFamily(font)}";
    src: url("${fontFileUrl}");
}
`;

        styleElement.appendChild(document.createTextNode(cssText));
    }
}
