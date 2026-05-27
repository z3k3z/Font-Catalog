import { _diags } from "../diagnostics/diagnostics.js";

export class FontGridView {
    constructor(fontGridElement, fontCountElement, fontLoader) {
        this._fontGridElement = fontGridElement;
        this._fontCountElement = fontCountElement;
        this._fontLoader = fontLoader;
        this._fontObserver = this._createFontObserver();
        this._onFontSelected = null;
        this._selectedCard = null;
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

    setListeners(listeners) {
        this._onFontSelected = listeners.onFontSelected ?? null;
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
                this._markCardFontLoadFailed(card);
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
        card.addEventListener("click", () => {
            if (this._isCardFontLoadFailed(card)) {
                return;
            }

            this.clearSelectedCard();
            this._markCardSelected(card);
            this._selectedCard = card;

            if (this._onFontSelected !== null) {
                this._onFontSelected(font);
            }
        });
        return card;
    }

    _markCardFontLoadFailed(card) {
        card.classList.add("font-card--load-failed");
    }

    _isCardFontLoadFailed(card) {
        const isCardFontLoadFailed = card.classList.contains("font-card--load-failed");

        return isCardFontLoadFailed;
    }

    clearSelectedCard() {
        if (this._selectedCard !== null) {
            this._unmarkCardSelected(this._selectedCard);
            this._selectedCard = null;
        }
    }

    _markCardSelected(card) {
        card.classList.add("font-card--selected");
    }

    _unmarkCardSelected(card) {
        card.classList.remove("font-card--selected");
    }
}
