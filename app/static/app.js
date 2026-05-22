const _sampleText = "The quick brown fox 123";
let _fonts = [];

async function loadFonts() {
    const response = await fetch("/api/fonts");
    _fonts = await response.json();

    renderFonts(_fonts);
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

function filterFonts(searchText) {
    const normalizedSearchText = searchText.trim().toLowerCase();

    if (normalizedSearchText === "") {
        renderFonts(_fonts);
        return;
    }

    const filteredFonts = _fonts.filter((font) => {
        const searchableText = `${font.family_name} ${font.style_name} ${font.full_name}`.toLowerCase();

        return searchableText.includes(normalizedSearchText);
    });

    renderFonts(filteredFonts);
}

document.getElementById("searchInput").addEventListener("input", (event) => {
    filterFonts(event.target.value);
});

loadFonts();