import { FontGridCardTagsView } from "./font-grid-card-tags-view.js";
import { FontGridCardView } from "./font-grid-card-view.js";

export class FontGridView {
    constructor(fontGridElement, fontCountElement, fontLoader, tagLoader, toastView) {
        this._fontGridElement = fontGridElement;
        this._fontCountElement = fontCountElement;
        this._fontLoader = fontLoader;
        this._tagLoader = tagLoader;
        this._cardTagsView = new FontGridCardTagsView(tagLoader, toastView);
        this._cardView = new FontGridCardView(fontLoader, this._cardTagsView);
        this._fontObserver = this._createFontObserver();
        this._onFontSelected = null;
        this._selectedCard = null;
        this._onFontLoadFailed = null;
    }

    renderFonts(fonts, sampleText) {
        this._fontGridElement.innerHTML = "";
        this._fontCountElement.textContent = `${fonts.length} fonts shown`;

        for (const font of fonts) {
            const card = this._cardView.build(font, sampleText, {
                onCardSelected: (selectedCard, selectedFont) => {
                    this.clearSelectedCard();
                    this._cardView.markSelected(selectedCard);
                    this._selectedCard = selectedCard;

                    if (this._onFontSelected !== null) {
                        this._onFontSelected(selectedFont);
                    }
                },
                onPreferenceSelected: async (card, font, selectedTagName, opposingTagName) => {
                    await this._cardTagsView.setExclusiveTag(
                        card._tagSummaryElement,
                        font.id,
                        selectedTagName,
                        opposingTagName,
                        font.full_name
                    );
                },
            });

            this._cardTagsView.setListeners({
                onTagsChanged: (fontId, tagNames) => {
                    const card = this._fontGridElement.querySelector(`[data-font-id="${fontId}"]`);

                    if (card !== null) {
                        this._cardView.updatePreferenceButtons(card, tagNames);
                    }
                },
            });
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
        await this._cardView.loadFontForCard(card, this._onFontLoadFailed);
        this._fontObserver.unobserve(card);
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

    clearSelectedCard() {
        if (this._selectedCard !== null) {
            this._cardView.unmarkSelected(this._selectedCard);
            this._selectedCard = null;
        }
    }
}
