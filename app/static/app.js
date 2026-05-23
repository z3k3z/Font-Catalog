const _sampleText = "The quick brown fox 123";

let _fonts = [];
let _searchTerms = [];


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
    const response = await fetch("/api/fonts");
    _fonts = await response.json();

    registerFontFaces(_fonts);

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
    const searchableText = [
        font.family_name,
        font.style_name,
        font.full_name,
        font.source,
    ]
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

    const sample = document.createElement("div");
    sample.className = "font-sample";
    sample.textContent = _sampleText;
    sample.style.fontFamily = `"${buildFontCssFamily(font)}", sans-serif`;

    const name = document.createElement("div");
    name.className = "font-name";
    name.textContent = `${font.family_name} — ${font.style_name}`;

    card.dataset.fontId = String(font.id);
    card.appendChild(sample);
    card.appendChild(name);

    return card;
}

/*
 * Explicit font rendering
 */
function registerFontFaces(fonts) {
    const styleElement = document.createElement("style");
    styleElement.id = "fontCatalogDynamicFontFaces";

    let cssText = "";

    for (const font of fonts) {
        cssText += `
@font-face {
    font-family: "${buildFontCssFamily(font)}";
    src: url("/api/fonts/${font.id}/file");
}
`;
    }

    styleElement.textContent = cssText;
    document.head.appendChild(styleElement);
}


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