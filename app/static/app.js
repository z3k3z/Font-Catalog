import { FontApiClient } from "./font-api-client.js";
import { FontGridView } from "./font-grid-view.js";
import { FontLoader } from "./font-loader.js";

let _fonts = [];
let _searchTerms = [];
const _fontApiClient = new FontApiClient("");
const _fontLoader = new FontLoader(_fontApiClient);
const fontGridElement = _getRequiredElementById("fontGrid");
const fontCountElement = _getRequiredElementById("fontCount");
const _fontGridView = new FontGridView(fontGridElement, fontCountElement, _fontLoader);

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

    applySearch();
}

/*
 * Search state management
 */
function addSearchTerm(rawSearchTerm) {
    const searchTerm = rawSearchTerm.trim();

    if (searchTerm === "") {
        return;
    }

    const normalizedSearchTerm = searchTerm.toLowerCase();

    if (!_searchTerms.includes(normalizedSearchTerm)) {
        _searchTerms.push(normalizedSearchTerm);
    }

    document.getElementById("searchInput").value = "";

    applySearch();
}

function removeSearchTerm(searchTerm) {
    _searchTerms = _searchTerms.filter((existingSearchTerm) => {
        return existingSearchTerm !== searchTerm;
    });

    applySearch();
}

/*
 * Search application
 */
function applySearch() {
    const filteredFonts = _fonts.filter((font) => {
        return fontMatchesAllSearchTerms(font);
    });

    renderSearchChips();
    _fontGridView.renderFonts(filteredFonts);
}

function fontMatchesAllSearchTerms(font) {
    const searchableText = buildSearchableText(font);

    for (const searchTerm of _searchTerms) {
        if (!searchableText.includes(searchTerm)) {
            return false;
        }
    }

    return true;
}

function buildSearchableText(font) {
    const searchableText = [font.family_name, font.style_name, font.full_name, font.source]
        .join(" ")
        .toLowerCase();

    return searchableText;
}

/*
 * Search chip rendering
 */
function renderSearchChips() {
    const chipContainer = document.getElementById("searchChipContainer");

    chipContainer.innerHTML = "";

    for (const searchTerm of _searchTerms) {
        const chip = document.createElement("span");
        chip.className = "search-chip";

        const label = document.createElement("span");
        label.textContent = searchTerm;

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "×";

        removeButton.addEventListener("click", () => {
            removeSearchTerm(searchTerm);
        });

        chip.appendChild(label);
        chip.appendChild(removeButton);
        chipContainer.appendChild(chip);
    }
}

/*
 * Event wiring
 */
document.getElementById("searchInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        addSearchTerm(event.target.value);
    }
});

function _getRequiredElementById(elementId) {
    const element = document.getElementById(elementId);

    if (element === null) {
        throw new Error(`Unable to locate required element '${elementId}'.`);
    }

    return element;
}
