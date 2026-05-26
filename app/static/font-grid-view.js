import { _diags } from "./diagnostics.js";

export class FontGridView {
    constructor(fontGridElement, fontCountElement, fontLoader) {
        this._fontGridElement = fontGridElement;
        this._fontCountElement = fontCountElement;
        this._fontLoader = fontLoader;
        this._fontObserver = this._createFontObserver();
    }

    renderFonts(fonts) {
        this._fontGridElement.innerHTML = "";
        this._fontCountElement.textContent = `${fonts.length} fonts shown`;

        for (const font of fonts) {
            const card = this._buildFontCard(font);
            this._fontGridElement.appendChild(card);
            this._fontObserver.observe(card);
        }
    }

    _createFontObserver() {
        const fontObserver = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        this._loadFontForCard(entry.target);
                    }
                }
            },
            {
                root: null,
                rootMargin: "300px",
                threshold: 0.01,
            }
        );

        return fontObserver;
    }

    async _loadFontForCard(card) {
        const font = card._fontRecord;

        if (font === undefined) {
            _diags.emitWarningProbe(() => "Visible font card did not have an associated font record.");
        } else {
            const loadedSuccessfully = await this._fontLoader.loadFont(font);

            if (loadedSuccessfully) {
                this._applyLoadedFontToCard(card, font);
            } else {
                card.classList.add("font-card--load-failed");
            }
        }
        this._fontObserver.unobserve(card);
    }

    _applyLoadedFontToCard(card, font) {
        const sample = card.querySelector(".font-sample");

        if (sample === null) {
            _diags.emitWarningProbe(
                () => `Font card for font id ${font.id} did not contain a sample element.`
            );

            return;
        }

        sample.style.fontFamily = `"${this._fontLoader.buildFontCssFamily(font)}", sans-serif`;
    }

    _buildFontCard(font) {
        const card = document.createElement("article");
        card.className = "font-card";
        card.dataset.fontId = String(font.id);
        card._fontRecord = font;

        const sample = document.createElement("div");
        sample.className = "font-sample";
        sample.textContent = "The quick brown fox 123";
        if (this._fontLoader.hasFontFaceRegistered(font)) {
            sample.style.fontFamily = `"${this._fontLoader.buildFontCssFamily(font)}", sans-serif`;
        } else {
            sample.style.fontFamily = "system-ui, sans-serif";
        }

        const name = document.createElement("div");
        name.className = "font-name";
        name.textContent = `${font.id} — ${font.full_name}`;

        card.appendChild(sample);
        card.appendChild(name);

        return card;
    }
}
