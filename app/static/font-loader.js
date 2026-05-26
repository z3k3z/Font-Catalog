import { _diags } from "./diagnostics.js";

export class FontLoader {
    constructor(fontApiClient, fontFaceStyleElement) {
        this._fontApiClient = fontApiClient;
        this._fontFaceStyleElement = fontFaceStyleElement;
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
        const fontFileUrl = this._fontApiClient.buildFontFileUrl(font.id);

        const cssText = `
@font-face {
    font-family: "${this.buildFontCssFamily(font)}";
    src: url("${fontFileUrl}");
    font-style: normal;
    font-weight: 400;
}
`;

        this._fontFaceStyleElement.appendChild(document.createTextNode(cssText));
    }
}
