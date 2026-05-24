export class FontSearch {
    constructor() {
        this._searchTerms = [];
    }

    addSearchTerm(rawSearchTerm) {
        const searchTerm = rawSearchTerm.trim().toLowerCase();

        if (searchTerm === "") {
            return;
        }

        if (!this._searchTerms.includes(searchTerm)) {
            this._searchTerms.push(searchTerm);
        }
    }

    removeSearchTerm(searchTerm) {
        this._searchTerms = this._searchTerms.filter((existingSearchTerm) => {
            return existingSearchTerm !== searchTerm;
        });
    }

    getSearchTerms() {
        const searchTerms = [...this._searchTerms];

        return searchTerms;
    }

    filterFonts(fonts) {
        const filteredFonts = fonts.filter((font) => {
            return this._fontMatchesAllSearchTerms(font);
        });

        return filteredFonts;
    }

    _fontMatchesAllSearchTerms(font) {
        const searchableText = this._buildSearchableText(font);

        for (const searchTerm of this._searchTerms) {
            if (!searchableText.includes(searchTerm)) {
                return false;
            }
        }

        return true;
    }

    _buildSearchableText(font) {
        const searchableText = [font.family_name, font.style_name, font.full_name, font.source]
            .join(" ")
            .toLowerCase();

        return searchableText;
    }
}
