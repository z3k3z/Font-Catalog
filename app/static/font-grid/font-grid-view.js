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

                this._updateCardTagSummary(tagSummaryElement, tagNames, font);
            } catch (error) {
                _diags.emitErrorProbe(() => `Failed to hydrate card tags: ${error}`);
            }
        }
    }

    _updateCardTagSummary(tagSummaryElement, tagNames, font) {
        const tagCountElement = tagSummaryElement.querySelector(".font-card-tag-count");
        const tagPopoverElement = tagSummaryElement.querySelector(".font-card-tag-popover");

        if (tagCountElement === null || tagPopoverElement === null) {
            _diags.emitWarningProbe(() => "Font card tag summary did not contain expected child elements.");
            return;
        }

        if (tagNames.length === 0) {
            tagSummaryElement.classList.remove("has-tags");
            tagSummaryElement.title = "";
            tagCountElement.textContent = "";
            tagPopoverElement.textContent = "No tags assigned";
            return;
        }

        const sortedTagNames = [...tagNames].sort((a, b) => a.localeCompare(b));

        tagSummaryElement.classList.add("has-tags");
        tagSummaryElement.title = "";
        tagCountElement.textContent = `${sortedTagNames.length}`;
        tagPopoverElement.innerHTML = "";

        const titleElement = document.createElement("div");
        titleElement.className = "font-card-tag-popover-title";

        const titleTextElement = document.createElement("span");
        titleTextElement.textContent = "Tags";

        const addTagButton = document.createElement("button");
        addTagButton.className = "font-card-tag-add-button";
        addTagButton.type = "button";
        addTagButton.textContent = "+";
        addTagButton.title = "Add tag";

        titleElement.appendChild(titleTextElement);
        titleElement.appendChild(addTagButton);
        tagPopoverElement.appendChild(titleElement);

        for (const tagName of sortedTagNames) {
            const tagElement = document.createElement("div");
            tagElement.className = "font-card-tag-popover-item";
            tagElement.textContent = tagName;
            tagPopoverElement.appendChild(tagElement);
        }

        const addTagEditorElement = document.createElement("div");
        addTagEditorElement.className = "font-card-tag-add-editor hidden";

        const addTagInputElement = document.createElement("input");
        addTagInputElement.className = "font-card-tag-add-input";
        addTagInputElement.type = "text";
        addTagInputElement.placeholder = "Tag name";

        const addTagCommitButton = document.createElement("button");
        addTagCommitButton.className = "font-card-tag-add-commit-button";
        addTagCommitButton.type = "button";
        addTagCommitButton.textContent = "Add";

        addTagEditorElement.appendChild(addTagInputElement);
        addTagEditorElement.appendChild(addTagCommitButton);
        tagPopoverElement.appendChild(addTagEditorElement);

        addTagButton.addEventListener("click", (event) => {
            event.stopPropagation();

            addTagEditorElement.classList.remove("hidden");
            addTagInputElement.focus();
        });

        const commitTagAdd = async () => {
            const tagName = addTagInputElement.value.trim();

            if (tagName === "") {
                return;
            }

            await this._tagLoader.addTagToFont(font.id, tagName);
            this._tagLoader.invalidateFont(font.id);

            const tags = await this._tagLoader.loadTagsForFont(font.id);
            const tagNames = tags.map((tag) => tag.name);

            this._updateCardTagSummary(tagSummaryElement, tagNames);

            addTagInputElement.value = "";
            addTagEditorElement.classList.add("hidden");
        };

        addTagCommitButton.addEventListener("click", async (event) => {
            event.stopPropagation();
            await commitTagAdd();
        });

        addTagInputElement.addEventListener("keydown", async (event) => {
            if (event.key === "Enter") {
                event.stopPropagation();
                await commitTagAdd();
            }
        });
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

        const tagSummaryElement = document.createElement("button");
        tagSummaryElement.className = "font-card-tag-summary";
        tagSummaryElement.type = "button";
        tagSummaryElement.title = "No tags assigned";

        const tagPopoverElement = document.createElement("div");
        tagPopoverElement.className = "font-card-tag-popover";
        tagPopoverElement.textContent = "No tags assigned";

        const tagPopoverZoneElement = document.createElement("div");
        tagPopoverZoneElement.className = "font-card-tag-popover-zone";

        const tagIconElement = document.createElement("span");
        tagIconElement.className = "font-card-tag-icon";
        tagIconElement.textContent = "🏷";

        const tagCountElement = document.createElement("span");
        tagCountElement.className = "font-card-tag-count";

        this._placeCardElements(
            card,
            sampleElement,
            nameElement,
            tagSummaryElement,
            tagPopoverZoneElement,
            tagPopoverElement,
            tagIconElement,
            tagCountElement
        );

        tagPopoverZoneElement.addEventListener("click", (event) => {
            event.stopPropagation();
        });

        tagSummaryElement.addEventListener("click", (event) => {
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

    _placeCardElements(
        card,
        sampleElement,
        nameElement,
        tagSummaryElement,
        tagPopoverZoneElement,
        tagPopoverElement,
        tagIconElement,
        tagCountElement
    ) {
        const sampleRegion = document.createElement("div");
        sampleRegion.className = "font-card-sample-region";
        sampleRegion.appendChild(sampleElement);

        const footer = document.createElement("div");
        footer.className = "font-card-footer";

        footer.appendChild(nameElement);

        tagSummaryElement.appendChild(tagIconElement);
        tagSummaryElement.appendChild(tagCountElement);
        tagSummaryElement.appendChild(tagPopoverZoneElement);
        tagPopoverZoneElement.appendChild(tagPopoverElement);
        footer.appendChild(tagSummaryElement);

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
