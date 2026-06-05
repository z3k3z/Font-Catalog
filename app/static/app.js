import { FontApiClient } from "./api/font-api-client.js";
import { CardGridPresentationController } from "./card-grid-presentation/card-grid-presentation-controller.js";
import { CardSampleTextController } from "./card-sample-text/card-sample-text-controller.js";
import { _diags } from "./diagnostics/diagnostics.js";
import { FrontendDiagnosticReporter } from "./diagnostics/frontend-diagnostic-reporter.js";
import { FrontendDiagnosticSession } from "./diagnostics/frontend-diagnostic-session.js";
import { FontDetailView } from "./font-detail/font-detail-view.js";
import { FontGridView } from "./font-grid/font-grid-view.js";
import { FontLoader } from "./font-grid/font-loader.js";
import { RequiredDomElementSet } from "./foundation/required-dom-element-set.js";
import { RequiredDomElement } from "./foundation/required-dom-element.js";
import { LikedFontSet } from "./liked-fonts/liked-font-set.js";
import { LikedFontsButton } from "./liked-fonts/liked-fonts-button.js";
import { FontSearch } from "./search/font-search.js";
import { SearchChipBar } from "./search/search-chip-bar.js";

let _fonts = [];

/* locate and catalog required html elements */
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
}).elements;

/* stand up and wire-in all our modules */
const _fontApiClient = new FontApiClient("");
const _frontendDiagnosticSession = new FrontendDiagnosticSession();
const _frontendDiagnosticReporter = new FrontendDiagnosticReporter(_frontendDiagnosticSession);
_frontendDiagnosticReporter.reportSessionStarted();

const _fontLoader = new FontLoader(_fontApiClient, fontFaceStyleElement);
const _cardGridPresentationController = new CardGridPresentationController(cardGridPresentationElements);
const _fontGridView = new FontGridView(fontGridElement, fontCountElement, _fontLoader);
const _fontSearch = new FontSearch();
const _cardSampleTextController = new CardSampleTextController(cardSampleTextElements);

/* wire-in the search chip bar */
const _searchChipBar = new SearchChipBar(searchInputElement, searchChipContainerElement);
_searchChipBar.setListeners({
    onSearchConstraintAdded: (searchTerm, mode) => {
        addSearchConstraint(searchTerm, mode);
    },

    onSearchConstraintRemoved: (searchConstraint) => {
        removeSearchConstraint(searchConstraint);
    },
});
/* wire-in the font detail view */
const _fontDetailView = new FontDetailView(fontDetailElements, _fontLoader);
_fontDetailView.setListeners({
    onFontKept: (font) => {
        const wasAdded = _likedFontSet.addFont(font);

        _likedFontsButton.renderCount(_likedFontSet.getCount());

        if (wasAdded) {
            _diags.emitDebugProbe(() => `Font liked: ${font.full_name}.`);
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
function addSearchConstraint(searchTerm, mode) {
    _fontSearch.addSearchConstraint(searchTerm, mode);

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
function _applySearch() {
    const filteredFonts = _fontSearch.filterFonts(_fonts);
    const sampleText = _cardSampleTextController.getSampleText();

    _searchChipBar.renderSearchConstraints(_fontSearch.getSearchConstraints());

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
