import { FontApiClient } from "./api/font-api-client.js";
import { CardGridPresentationController } from "./card-grid-presentation/card-grid-presentation-controller.js";
import { CardSampleTextController } from "./card-sample-text/card-sample-text-controller.js";
import { _diags } from "./diagnostics/diagnostics.js";
import { FrontendDiagnosticReporter } from "./diagnostics/frontend-diagnostic-reporter.js";
import { FrontendDiagnosticSession } from "./diagnostics/frontend-diagnostic-session.js";
import { FontDetailView } from "./font-detail/font-detail-view.js";
import { FontGridView } from "./font-grid/font-grid-view.js";
import { FontLoader } from "./font-grid/font-loader.js";
import { TagLoader } from "./font-grid/tag-loader.js";
import { RequiredDomElementSet } from "./foundation/required-dom-element-set.js";
import { RequiredDomElement } from "./foundation/required-dom-element.js";
import { SuggestionDecorator } from "./foundation/suggestion-decorator.js";
import { LikedFontSet } from "./liked-fonts/liked-font-set.js";
import { LikedFontsButton } from "./liked-fonts/liked-fonts-button.js";
import { FontSearch } from "./search/font-search.js";
import { SearchChipBar } from "./search/search-chip-bar.js";
import { SearchConstraint } from "./search/search-constraint.js";
import { TagSuggestionProvider } from "./tags/tag-suggestion-provider.js";
import { ToastView } from "./toast/toast-view.js";

let _fonts = [];

/* locate and catalog required html elements */
const toastRootElement = new RequiredDomElement("toast-root").element;
const fontGridElement = new RequiredDomElement("fontGrid").element;
const fontCountElement = new RequiredDomElement("fontCount").element;
const fontFaceStyleElement = new RequiredDomElement("fontCatalogDynamicFontFaces").element;
const searchInputElement = new RequiredDomElement("searchInput").element;
const searchChipContainerElement = new RequiredDomElement("searchChipContainer").element;
const fontDetailElements = new RequiredDomElementSet({
    panel: "fontDetailPanel",
    title: "fontDetailTitle",
    subtitle: "fontDetailSubtitle",
    closeButton: "fontDetailCloseButton",
    sampleInput: "fontDetailSampleInput",
    sizeInput: "fontDetailSizeInput",
    sample: "fontDetailSample",
    glyphSet: "fontDetailGlyphSet",
    keepButton: "fontDetailKeepButton",
    cancelButton: "fontDetailCancelButton",
    sizeValue: "fontDetailSizeValue",
    darkPreviewButton: "fontDetailDarkPreviewButton",
    lightPreviewButton: "fontDetailLightPreviewButton",
}).elements;
const cardSampleTextElements = new RequiredDomElementSet({
    input: "cardSampleTextInput",
}).elements;
const cardGridPresentationElements = new RequiredDomElementSet({
    smallButton: "cardGridSizeSmallButton",
    mediumButton: "cardGridSizeMediumButton",
    largeButton: "cardGridSizeLargeButton",
    hugeButton: "cardGridSizeHugeButton",
}).elements;

/* stand up and wire-in all our modules */
const _toastView = new ToastView(toastRootElement);
const _fontApiClient = new FontApiClient("");
const _frontendDiagnosticSession = new FrontendDiagnosticSession();
const _frontendDiagnosticReporter = new FrontendDiagnosticReporter(_frontendDiagnosticSession);
_frontendDiagnosticReporter.reportSessionStarted();

const _fontLoader = new FontLoader(_fontApiClient, fontFaceStyleElement);
const _tagLoader = new TagLoader(_fontApiClient);
const _cardGridPresentationController = new CardGridPresentationController(cardGridPresentationElements);
const _fontGridView = new FontGridView(
    fontGridElement,
    fontCountElement,
    _fontLoader,
    _tagLoader,
    _toastView
);
const _fontSearch = new FontSearch(_tagLoader);
const _cardSampleTextController = new CardSampleTextController(cardSampleTextElements);

/* wire-in the search chip bar */
const _searchChipBar = new SearchChipBar(searchInputElement, searchChipContainerElement);
_searchChipBar.setListeners({
    onSearchConstraintAdded: (searchTerm, kind, mode) => {
        addSearchConstraint(searchTerm, kind, mode);
    },

    onSearchConstraintRemoved: (searchConstraint) => {
        removeSearchConstraint(searchConstraint);
    },
});

/* wire-in the tag-related search suggestions */
const _tagSuggestionProvider = new TagSuggestionProvider(_tagLoader);
const _searchSuggestionContainer = document.createElement("div");
_searchSuggestionContainer.className = "search-input-suggestion-container hidden";
searchInputElement.parentElement.appendChild(_searchSuggestionContainer);
const getTagSearchPrefix = (inputText) => {
    if (inputText.startsWith("-#")) {
        return "-#";
    }

    if (inputText.startsWith("#")) {
        return "#";
    }

    return "";
};
const getExistingTagConstraintNames = (prefix) => {
    const targetMode = prefix === "-#" ? SearchConstraint.Mode.EXCLUDE : SearchConstraint.Mode.REQUIRE;

    return new Set(
        _fontSearch.searchConstraints
            .filter((constraint) => constraint.isTagConstraint())
            .filter((constraint) => constraint.mode === targetMode)
            .map((constraint) => constraint.searchTerm)
    );
};
const _searchSuggestionDecorator = new SuggestionDecorator({
    inputElement: searchInputElement,
    suggestionContainerElement: _searchSuggestionContainer,

    loadSuggestions: async (inputText) => {
        const prefix = getTagSearchPrefix(inputText);

        if (prefix === "") {
            return [];
        }

        const tagSearchText = inputText.slice(prefix.length);

        if (tagSearchText.length === 0) {
            return [];
        }

        const existingTagNames = getExistingTagConstraintNames(prefix);
        const suggestions = await _tagSuggestionProvider.loadSuggestions(tagSearchText);

        return suggestions.filter((tagName) => !existingTagNames.has(tagName));
    },

    getSuggestionText: (tagName) => `${getTagSearchPrefix(searchInputElement.value)}${tagName}`,

    onSuggestionAccepted: (tagName) => {
        const prefix = getTagSearchPrefix(searchInputElement.value);

        searchInputElement.value = `${prefix}${tagName}`;
        searchInputElement.focus();
    },
});
_searchSuggestionDecorator.attach();

/* wire-in the font detail view */
const _fontDetailView = new FontDetailView(fontDetailElements, _fontLoader);
_fontDetailView.setListeners({
    onFontKept: (font) => {
        const wasAdded = _likedFontSet.addFont(font);

        _likedFontsButton.renderCount(_likedFontSet.getCount());

        if (wasAdded) {
            _diags.emitDebugProbe(() => `Font liked: ${font.full_name}.`);
            const url = `/api/fonts/${font.id}/tags`;
            _diags.emitDebugProbe(() => `Target url: ${url}`);
            fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    tag_name: "Liked",
                }),
            });
        } else {
            _diags.emitDebugProbe(() => `Font already liked: ${font.full_name}.`);
        }
        _fontDetailView.close();
    },

    onClosed: () => {
        _fontGridView.clearSelectedCard();
        _diags.emitDebugProbe(() => "Font detail view closed.");
    },
});

/* hook the card selection to the font detail panel */
_fontGridView.setListeners({
    onFontSelected: (font) => {
        const sampleText = _cardSampleTextController.getSampleText();

        _fontDetailView.open(font, sampleText);
    },

    onFontLoadFailed: (font, message) => {
        _frontendDiagnosticReporter.reportWarningEvent({
            eventType: "font_load_failed",
            subjectKey: `font:${font.id}`,
            variantKey: normalizeDiagnosticVariantKey(message),
            message,
        });
    },
});

/* card sample text */
_cardSampleTextController.setListeners({
    onSampleTextChanged: () => {
        _applySearch();
    },
});

/* liked fonts */
const _likedFontSet = new LikedFontSet();
const likedFontsButtonElements = new RequiredDomElementSet({
    button: "likedFontsButton",
    count: "likedFontsCount",
}).elements;
const _likedFontsButton = new LikedFontsButton(likedFontsButtonElements);
_likedFontsButton.setListeners({
    onClicked: () => {
        _diags.emitDebugProbe(() => `Liked fonts subsystem requested. Count: ${_likedFontSet.getCount()}.`);
    },
});

/* card-size buttons */
_fontGridView.setCardSize(_cardGridPresentationController.getCardSize());
_cardGridPresentationController.setListeners({
    onCardSizeChanged: (cardSize) => {
        _fontGridView.setCardSize(cardSize);
    },
});

/*
 * Application entry point.
 *
 * The current UI intentionally loads the full font metadata set once,
 * stores it in browser memory, then filters/renders locally.
 */
loadFonts();

/*
 * Initial data load
 */
async function loadFonts() {
    _fonts = await _fontApiClient.getFonts();

    _applySearch();
}

/*
 * Search bar listeners
 */
function addSearchConstraint(searchTerm, kind, mode) {
    _fontSearch.addSearchConstraint(searchTerm, kind, mode);
    _searchSuggestionDecorator.hideSuggestions();
    _searchChipBar.clearSearchInput();

    _applySearch();
}

function removeSearchConstraint(searchConstraint) {
    _fontSearch.removeSearchConstraint(searchConstraint);

    _applySearch();
}

/*
 * Search support
 */
async function _applySearch() {
    const filteredFonts = await _fontSearch.filterFonts(_fonts);
    const sampleText = _cardSampleTextController.getSampleText();

    _searchChipBar.renderSearchConstraints(_fontSearch.searchConstraints);

    _fontGridView.renderFonts(filteredFonts, sampleText);
}

/*
 * Diagnostics helper
 */
function normalizeDiagnosticVariantKey(message) {
    const normalizedKey = message
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, "_")
        .replaceAll(/^_+|_+$/g, "");

    return normalizedKey;
}
