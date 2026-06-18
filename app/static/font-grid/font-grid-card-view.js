import { _diags } from "../diagnostics/diagnostics.js";

export class FontGridCardView {
    constructor(fontLoader, cardTagsView) {
        this._fontLoader = fontLoader;
        this._cardTagsView = cardTagsView;
    }

    build(font, sampleText, listeners) {
        const card = document.createElement("article");
        card.className = "font-card";
        card.dataset.fontId = String(font.id);
        card._fontRecord = font;

        const sample = this._buildSample(font, sampleText);
        const sampleRegion = document.createElement("div");
        sampleRegion.className = "font-card-sample-region";
        sampleRegion.appendChild(sample);

        const footer = document.createElement("div");
        footer.className = "font-card-footer";

        const name = document.createElement("div");
        name.className = "font-name";
        name.textContent = `${font.id} — ${font.full_name}`;

        const tagSummaryElement = this._cardTagsView.build(font.id);
        card._tagSummaryElement = tagSummaryElement;
        const preferenceActions = document.createElement("div");
        preferenceActions.className = "font-card-preference-actions";

        const LIKEY_TAG_NAME = "Likey";
        const NO_LIKEY_TAG_NAME = "No-Likey";
        card._likeyButton = this._buildPreferenceButton("font-card-likey-button", "🥰", "Likey");
        card._noLikeyButton = this._buildPreferenceButton("font-card-no-likey-button", "🤮", "No-Likey");

        preferenceActions.appendChild(card._likeyButton);
        preferenceActions.appendChild(card._noLikeyButton);

        footer.appendChild(name);
        footer.appendChild(preferenceActions);
        footer.appendChild(tagSummaryElement);

        card.appendChild(sampleRegion);
        card.appendChild(footer);

        card.addEventListener("click", () => {
            if (this.isFontLoadFailed(card)) {
                return;
            }

            listeners.onCardSelected(card, font);
        });

        card._likeyButton.addEventListener("click", async (event) => {
            event.stopPropagation();
            await listeners.onPreferenceSelected(card, font, LIKEY_TAG_NAME, NO_LIKEY_TAG_NAME, "❤️");
        });

        card._noLikeyButton.addEventListener("click", async (event) => {
            event.stopPropagation();
            await listeners.onPreferenceSelected(card, font, NO_LIKEY_TAG_NAME, LIKEY_TAG_NAME, "💩");
        });

        return card;
    }

    async loadFontForCard(card, onFontLoadFailed) {
        const font = card._fontRecord;

        if (font === undefined) {
            _diags.emitWarningProbe(() => "Visible font card did not have an associated font record.");
            return;
        }

        const loadedSuccessfully = await this._fontLoader.loadFont(font);

        if (loadedSuccessfully) {
            this.applyLoadedFontToCard(card, font);
            return;
        }

        this.markFontLoadFailed(card);

        if (onFontLoadFailed !== null) {
            onFontLoadFailed(font, "Font failed to load in browser.");
        }
    }

    applyLoadedFontToCard(card, font) {
        const sample = card.querySelector(".font-sample");

        if (sample === null) {
            _diags.emitWarningProbe(
                () => `Font card for font id ${font.id} did not contain a sample element.`
            );
            return;
        }

        sample.style.fontFamily = `"${this._fontLoader.buildFontCssFamily(font)}", sans-serif`;
    }

    markSelected(card) {
        card.classList.add("font-card--selected");
    }

    unmarkSelected(card) {
        card.classList.remove("font-card--selected");
    }

    markFontLoadFailed(card) {
        card.classList.add("font-card--load-failed");
    }

    isFontLoadFailed(card) {
        return card.classList.contains("font-card--load-failed");
    }

    updatePreferenceButtons(card, tagNames) {
        const likeyButton = card._likeyButton;
        const noLikeyButton = card._noLikeyButton;

        if (likeyButton === undefined || noLikeyButton === undefined) {
            return;
        }

        likeyButton.classList.toggle("is-selected", tagNames.includes("Likey"));
        noLikeyButton.classList.toggle("is-selected", tagNames.includes("No-Likey"));
    }

    removeCardWithFade(card, onRemoved) {
        card.classList.add("font-card--removing");

        window.setTimeout(() => {
            card.remove();

            if (onRemoved !== undefined) {
                onRemoved();
            }
        }, 200);
    }

    _buildSample(font, sampleText) {
        const sample = document.createElement("div");
        sample.className = "font-sample";
        sample.textContent = sampleText;

        if (this._fontLoader.hasFontFaceRegistered(font)) {
            sample.style.fontFamily = `"${this._fontLoader.buildFontCssFamily(font)}", sans-serif`;
        } else {
            sample.style.fontFamily = "system-ui, sans-serif";
        }

        return sample;
    }

    _buildPreferenceButton(className, text, title) {
        const button = document.createElement("button");
        button.className = `font-card-preference-button ${className}`;
        button.type = "button";
        button.textContent = text;
        button.title = title;

        button.addEventListener("click", (event) => {
            event.stopPropagation();
        });

        return button;
    }
}
