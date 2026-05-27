import { FontApiClient } from "./font-api-client.js";
import { FontGridView } from "./font-grid-view.js";
import { FontLoader } from "./font-loader.js";
import { FontSearch } from "./font-search.js";
import { SearchChipBar } from "./search-chip-bar.js";

let _fonts = [];

const fontGridElement = _getRequiredElementById("fontGrid");
const fontCountElement = _getRequiredElementById("fontCount");
const fontFaceStyleElement = _getRequiredElementById("fontCatalogDynamicFontFaces");
const searchInputElement = _getRequiredElementById("searchInput");
const searchChipContainerElement = _getRequiredElementById("searchChipContainer");

const _fontApiClient = new FontApiClient("");
const _fontLoader = new FontLoader(_fontApiClient, fontFaceStyleElement);
const _fontGridView = new FontGridView(fontGridElement, fontCountElement, _fontLoader);
const _fontSearch = new FontSearch();
const _searchChipBar = new SearchChipBar(searchInputElement, searchChipContainerElement);
_searchChipBar.setListeners({
    onSearchConstraintAdded: (searchTerm, mode) => {
        addSearchConstraint(searchTerm, mode);
    },

    onSearchConstraintRemoved: (searchConstraint) => {
        removeSearchConstraint(searchConstraint);
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

    _searchChipBar.renderSearchConstraints(_fontSearch.getSearchConstraints());

    _fontGridView.renderFonts(filteredFonts);
}

function _getRequiredElementById(elementId) {
    const element = document.getElementById(elementId);

    if (element === null) {
        throw new Error(`Unable to locate required element '${elementId}'.`);
    }

    return element;
}
