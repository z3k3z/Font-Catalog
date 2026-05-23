const _sampleText = "The quick brown fox 123";

let _fonts = [];
let _searchTerms = [];

async function loadFonts() {
    const response = await fetch("/api/fonts");
    _fonts = await response.json();

    applySearch();
}

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

function renderFonts(fonts) {
    const fontGrid = document.getElementById("fontGrid");
    const fontCount = document.getElementById("fontCount");

    fontGrid.innerHTML = "";
    fontCount.textContent = `${fonts.length} fonts shown`;

    for (const font of fonts) {
        const card = document.createElement("article");
        card.className = "font-card";

        const sample = document.createElement("div");
        sample.className = "font-sample";
        sample.textContent = _sampleText;
        sample.style.fontFamily = `"${font.family_name}", sans-serif`;

        const name = document.createElement("div");
        name.className = "font-name";
        name.textContent = `${font.family_name} — ${font.style_name}`;

        card.appendChild(sample);
        card.appendChild(name);
        fontGrid.appendChild(card);
    }
}

document.getElementById("searchInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        addSearchTerm(event.target.value);
    }
});

loadFonts();