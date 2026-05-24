import { _diags } from "./diagnostics.js";
import { FontApiClient } from "./font-api-client.js";

const _sampleText = "The quick brown fox 123";

let _fonts = [];
let _searchTerms = [];
let _fontObserver = null;
const _loadedFontIds = new Set();
const _fontApiClient = new FontApiClient("");

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

    configureFontObserver();
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
 * Font Observer
 */
function configureFontObserver() {
    _fontObserver = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    loadFontForCard(entry.target);
                }
            }
        },
        {
            root: null,
            rootMargin: "300px",
            threshold: 0.01,
        }
    );
}

/*
 * Font Lazy Loading
 */
function loadFontForCard(card) {
    const fontIdText = card.dataset.fontId;

    if (fontIdText === undefined) {
        return;
    }

    const font = findFontById(fontIdText);

    if (font === null) {
        return;
    }

    ensureFontFaceRegistered(font);
    applyLoadedFontToCard(card, font);
}

function findFontById(fontIdText) {
    const fontId = Number(fontIdText);

    for (const font of _fonts) {
        if (font.id === fontId) {
            return font;
        }
    }

    return null;
}

function ensureFontFaceRegistered(font) {
    if (_loadedFontIds.has(font.id)) {
        return;
    }

    registerFontFace(font);
    _loadedFontIds.add(font.id);
}

function registerFontFace(font) {
    const styleElement = document.getElementById("fontCatalogDynamicFontFaces");

    const cssText = `
    @font-face {
        font-family: "${buildFontCssFamily(font)}";
        src: url(${_fontApiClient.buildFontFileUrl(font.id)});
        }
        `;

    _diags.emitDebugProbe(() => `Loading font metadata for font ${font.id}`);
    styleElement.appendChild(document.createTextNode(cssText));
}

function applyLoadedFontToCard(card, font) {
    const sample = card.querySelector(".font-sample");

    if (sample === null) {
        return;
    }

    sample.style.fontFamily = `"${buildFontCssFamily(font)}", sans-serif`;
}

/*
 * Search application
 */
function applySearch() {
    const filteredFonts = _fonts.filter((font) => {
        return fontMatchesAllSearchTerms(font);
    });

    renderSearchChips();
    renderFonts(filteredFonts);
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
 * Font card rendering
 */
function renderFonts(fonts) {
    const fontGrid = document.getElementById("fontGrid");
    const fontCount = document.getElementById("fontCount");

    fontGrid.innerHTML = "";
    fontCount.textContent = `${fonts.length} fonts shown`;

    for (const font of fonts) {
        const card = buildFontCard(font);
        fontGrid.appendChild(card);
    }
}

function buildFontCard(font) {
    const card = document.createElement("article");
    card.className = "font-card";
    card.dataset.fontId = String(font.id);

    const sample = document.createElement("div");
    sample.className = "font-sample";
    sample.textContent = _sampleText;
    sample.style.fontFamily = "system-ui, sans-serif";

    const name = document.createElement("div");
    name.className = "font-name";
    name.textContent = `${font.family_name} — ${font.style_name}`;

    card.appendChild(sample);
    card.appendChild(name);

    if (_fontObserver !== null) {
        _fontObserver.observe(card);
    }

    return card;
}

/*
 * Explicit font rendering
 */
function buildFontCssFamily(font) {
    const fontCssFamily = `FontCatalog_${font.id}`;

    return fontCssFamily;
}

/*
 * Event wiring
 */
document.getElementById("searchInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        addSearchTerm(event.target.value);
    }
});
