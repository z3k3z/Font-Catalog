import { _diags } from "../diagnostics/diagnostics.js";
import { FontGridCardTagsView } from "./font-grid-card-tags-view.js";

export class FontGridView {
    constructor(fontGridElement, fontCountElement, fontLoader, tagLoader, toastView) {
        this._fontGridElement = fontGridElement;
        this._fontCountElement = fontCountElement;
        this._fontLoader = fontLoader;
        this._tagLoader = tagLoader;
        this._cardTagsView = new FontGridCardTagsView(tagLoader, toastView);
        this._fontObserver = this._createFontObserver();
        this._onFontSelected = null;
        this._selectedCard = null;
        this._onFontLoadFailed = null;
    }

    renderFonts(fonts, sampleText) {
        this._fontGridElement.innerHTML = "";
        this._fontCountElement.textContent = `${fonts.length} fonts shown`;

        for (const font of fonts) {
            const card = this._buildFontCard(font, sampleText);
            this._cardTagsView.loadTags(font.id, card._tagSummaryElement);
            this._fontGridElement.appendChild(card);
            this._fontObserver.observe(card);
        }
    }

    setCardSize(cardSize) {
        this._fontGridElement.classList.remove(
            "font-grid--small",
            "font-grid--medium",
            "font-grid--large",
            "font-grid--huge"
        );

        this._fontGridElement.classList.add(`font-grid--${cardSize}`);
    }

    setListeners(listeners) {
        this._onFontSelected = listeners.onFontSelected ?? null;
        this._onFontLoadFailed = listeners.onFontLoadFailed ?? null;
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

                if (this._onFontLoadFailed !== null) {
                    this._onFontLoadFailed(font, "Font failed to load in browser.");
                }
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

    _buildFontCard(font, sampleText) {
        const card = document.createElement("article");
        card.className = "font-card";
        card.dataset.fontId = String(font.id);
        card._fontRecord = font;

        const sampleElement = document.createElement("div");
        sampleElement.className = "font-sample";
        sampleElement.textContent = sampleText;
        if (this._fontLoader.hasFontFaceRegistered(font)) {
            sampleElement.style.fontFamily = `"${this._fontLoader.buildFontCssFamily(font)}", sans-serif`;
        } else {
            sampleElement.style.fontFamily = "system-ui, sans-serif";
        }

        const nameElement = document.createElement("div");
        nameElement.className = "font-name";
        nameElement.textContent = `${font.id} — ${font.full_name}`;

        card._tagSummaryElement = this._cardTagsView.build(font.id);
        this._placeCardElements(card, sampleElement, nameElement);

        card._tagSummaryElement.addEventListener("click", (event) => {
            event.stopPropagation();
        });

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

    _placeCardElements(card, sampleElement, nameElement) {
        const sampleRegion = document.createElement("div");
        sampleRegion.className = "font-card-sample-region";
        sampleRegion.appendChild(sampleElement);

        const footer = document.createElement("div");
        footer.className = "font-card-footer";

        footer.appendChild(nameElement);
        footer.appendChild(card._tagSummaryElement);

        card.appendChild(sampleRegion);
        card.appendChild(footer);
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
