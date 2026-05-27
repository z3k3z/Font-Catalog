import { _diags } from "./diagnostics.js";

export class FontDetailView {
    constructor(elements, fontLoader) {
        this._elements = elements;
        this._fontLoader = fontLoader;
        this._selectedFont = null;

        this._onFontKept = null;
        this._onClosed = null;

        this._configureEvents();
        this._isLightPreview = false;
    }

    setListeners(listeners) {
        this._onFontKept = listeners.onFontKept ?? null;
        this._onClosed = listeners.onClosed ?? null;
    }

    async open(font) {
        this._selectedFont = font;

        _diags.emitDebugProbe(() => `Opening detail view for font id ${font.id}.`);

        const loadedSuccessfully = await this._fontLoader.loadFont(font);

        if (!loadedSuccessfully) {
            _diags.emitWarningProbe(
                () => `Unable to open detail view because font id ${font.id} failed to load.`
            );

            return;
        }

        this._render(font);
        this._elements.panel.classList.remove("font-detail-panel--closed");
    }

    close() {
        this._elements.panel.classList.add("font-detail-panel--closed");
        this._selectedFont = null;

        if (this._onClosed !== null) {
            this._onClosed();
        }
    }

    _configureEvents() {
        this._elements.closeButton.addEventListener("click", () => {
            this.close();
        });

        this._elements.cancelButton.addEventListener("click", () => {
            this.close();
        });

        this._elements.keepButton.addEventListener("click", () => {
            if (this._selectedFont !== null && this._onFontKept !== null) {
                this._onFontKept(this._selectedFont);
            }

            this.close();
        });

        this._elements.sampleInput.addEventListener("input", () => {
            this._renderSample();
        });

        this._elements.sizeInput.addEventListener("input", () => {
            this._renderSizeValue();
            this._renderSample();
            this._renderGlyphSet();
        });

        this._elements.darkPreviewButton.addEventListener("click", () => {
            this._setLightPreview(false);
        });

        this._elements.lightPreviewButton.addEventListener("click", () => {
            this._setLightPreview(true);
        });
    }

    _render(font) {
        this._elements.title.textContent = font.full_name;
        this._elements.subtitle.textContent = `${font.family_name} — ${font.style_name}`;

        this._renderSizeValue();
        this._renderSample();
        this._renderGlyphSet();
        this._renderPreviewPolarity();
        this._renderPreviewModeButtons();
    }

    _renderPreviewPolarity() {
        this._setPreviewPolarity(this._elements.sample, this._isLightPreview);
        this._setPreviewPolarity(this._elements.glyphSet, this._isLightPreview);
    }

    _renderPreviewModeButtons() {
        this._elements.darkPreviewButton.classList.toggle(
            "font-detail-preview-mode-button--selected",
            !this._isLightPreview
        );

        this._elements.lightPreviewButton.classList.toggle(
            "font-detail-preview-mode-button--selected",
            this._isLightPreview
        );
    }

    _setPreviewPolarity(element, isLightPreview) {
        if (isLightPreview) {
            element.classList.add("font-detail-preview--light");
        } else {
            element.classList.remove("font-detail-preview--light");
        }
    }

    _setLightPreview(isLightPreview) {
        this._isLightPreview = isLightPreview;

        this._renderPreviewPolarity();
        this._renderPreviewModeButtons();
    }

    _renderSizeValue() {
        const fontSize = this._getSelectedPointSize();

        this._elements.sizeValue.textContent = `${fontSize}px`;
    }

    _renderSample() {
        if (this._selectedFont === null) {
            return;
        }

        const sampleText = this._elements.sampleInput.value;
        const fontSize = this._getSelectedPointSize();
        const fontCssFamily = this._fontLoader.buildFontCssFamily(this._selectedFont);

        this._elements.sample.textContent = sampleText;
        this._elements.sample.style.fontFamily = `"${fontCssFamily}", sans-serif`;
        this._elements.sample.style.fontSize = `${fontSize}px`;
    }

    _renderGlyphSet() {
        if (this._selectedFont === null) {
            return;
        }

        const fontSize = this._getSelectedPointSize();
        const fontCssFamily = this._fontLoader.buildFontCssFamily(this._selectedFont);

        this._elements.glyphSet.innerHTML = "";

        for (const glyphLine of this._buildDefaultGlyphSetLines()) {
            const lineElement = document.createElement("div");
            lineElement.className = "font-detail-glyph-line";
            lineElement.textContent = glyphLine;
            lineElement.style.fontFamily = `"${fontCssFamily}", sans-serif`;
            lineElement.style.fontSize = `${Math.max(18, Math.floor(fontSize * 0.7))}px`;

            this._elements.glyphSet.appendChild(lineElement);
        }
    }

    _getSelectedPointSize() {
        const fontSize = Number(this._elements.sizeInput.value);

        return fontSize;
    }

    _buildDefaultGlyphSetLines() {
        const glyphSetLines = [
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
            "abcdefghijklmnopqrstuvwxyz",
            "0123456789",
            ".,;:!?\"'`~^¨",
            "()[]{}<>/\\|+-=*_%#@&$¢£€¥",
            "ÁÉÍÓÚÜÑáéíóúüñ",
            "ÆŒØÐÞßæœøðþ",
        ];

        return glyphSetLines;
    }
}
