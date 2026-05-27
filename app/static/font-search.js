import { SearchConstraint } from "./search-constraint.js";

export class FontSearch {
    constructor() {
        this._searchConstraints = [];
    }

    addSearchConstraint(rawSearchTerm, mode) {
        const normalizedSearchTerm = rawSearchTerm.trim().toLowerCase();

        if (normalizedSearchTerm.length === 0) {
            return;
        }

        const alreadyExists = this._searchConstraints.some((constraint) => {
            return constraint.searchTerm === normalizedSearchTerm && constraint.mode === mode;
        });

        if (alreadyExists) {
            return;
        }

        const searchConstraint = new SearchConstraint(normalizedSearchTerm, mode);

        this._searchConstraints.push(searchConstraint);
    }

    removeSearchConstraint(searchConstraintToRemove) {
        this._searchConstraints = this._searchConstraints.filter((constraint) => {
            return constraint !== searchConstraintToRemove;
        });
    }

    getSearchConstraints() {
        return this._searchConstraints;
    }

    filterFonts(fonts) {
        const filteredFonts = fonts.filter((font) => {
            return this._fontMatchesAllSearchConstraints(font);
        });

        return filteredFonts;
    }

    _fontMatchesAllSearchConstraints(font) {
        const searchableText = this._buildSearchableText(font);

        const satisfiesConstraints = this._searchConstraints.every((constraint) => {
            const matches = searchableText.includes(constraint.searchTerm);

            if (constraint.isRequireConstraint()) {
                return matches;
            }

            if (constraint.isExcludeConstraint()) {
                return !matches;
            }

            return true;
        });

        return satisfiesConstraints;
    }

    _buildSearchableText(font) {
        const searchableText = [font.family_name, font.style_name, font.full_name].join(" ").toLowerCase();

        return searchableText;
    }
}
