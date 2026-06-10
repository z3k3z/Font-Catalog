import { _diags } from "../diagnostics/diagnostics.js";

export class FontGridView {
    constructor(fontGridElement, fontCountElement, fontLoader, tagLoader) {
        this._fontGridElement = fontGridElement;
        this._fontCountElement = fontCountElement;
        this._fontLoader = fontLoader;
        this._tagLoader = tagLoader;
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
            this._loadTagsForCard(card);
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

    async _loadTagsForCard(card) {
        const font = card._fontRecord;
        const tagSummaryElement = card.querySelector(".font-card-tag-summary");

        if (font === undefined) {
            _diags.emitWarningProbe(() => "Visible font card did not have an associated font record.");
        } else if (tagSummaryElement == undefined) {
            _diags.emitWarningProbe(() => "Visible font card did not have a tagSummaryElement.");
        } else {
            try {
                const tags = await this._tagLoader.loadTagsForFont(font.id);
                const tagNames = tags.map((tag) => tag.name);

                this._updateCardTagSummary(tagSummaryElement, tagNames);
            } catch (error) {
                _diags.emitErrorProbe(() => `Failed to hydrate card tags: ${error}`);
            }
        }
    }

    _updateCardTagSummary(tagSummaryElement, tagNames) {
        const tagCountElement = tagSummaryElement.querySelector(".font-card-tag-count");

        if (tagCountElement === null) {
            _diags.emitWarningProbe(() => "Font card tag summary did not contain a tag count element.");
        } else if (tagNames.length === 0) {
            tagSummaryElement.classList.remove("has-tags");
            tagSummaryElement.title = "No tags assigned";
            tagCountElement.textContent = "";
        } else {
            tagSummaryElement.classList.add("has-tags");
            tagSummaryElement.title = tagNames.join("\n");
            tagCountElement.textContent = `${tagNames.length}`;
        }
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

        const sample = document.createElement("div");
        sample.className = "font-sample";
        sample.textContent = sampleText;
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

        const tagSummaryElement = document.createElement("button");
        tagSummaryElement.className = "font-card-tag-summary";
        tagSummaryElement.type = "button";
        tagSummaryElement.title = "No tags assigned";

        const tagIconElement = document.createElement("span");
        tagIconElement.className = "font-card-tag-icon";
        tagIconElement.textContent = "🏷";

        const tagCountElement = document.createElement("span");
        tagCountElement.className = "font-card-tag-count";

        tagSummaryElement.appendChild(tagIconElement);
        tagSummaryElement.appendChild(tagCountElement);
        card.appendChild(tagSummaryElement);

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
