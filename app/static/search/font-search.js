import { SearchConstraint } from "./search-constraint.js";

export class FontSearch {
    constructor(tagLoader) {
        this._tagLoader = tagLoader;
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

    async filterFonts(fonts) {
        const tagSnapshot = await this._tagLoader.loadTagSnapshot();
        const filteredFonts = fonts.filter((font) => {
            return this._fontMatchesAllSearchConstraints(font, tagSnapshot);
        });

        return filteredFonts;
    }

    _fontMatchesAllSearchConstraints(font, tagSnapshot) {
        const searchableText = this._buildSearchableText(font);

        return this._searchConstraints.every((constraint) => {
            if (constraint.isTagConstraint()) {
                return this._fontMatchesTagConstraint(font, constraint, tagSnapshot);
            }

            return this._fontMatchesTextConstraint(searchableText, constraint);
        });
    }

    _fontMatchesTextConstraint(searchableText, constraint) {
        const matches = searchableText.includes(constraint.searchTerm);

        if (constraint.isRequireConstraint()) {
            return matches;
        }

        if (constraint.isExcludeConstraint()) {
            return !matches;
        }

        return true;
    }

    _fontMatchesTagConstraint(font, constraint, tagSnapshot) {
        const matches = tagSnapshot.hasFontForTag(font.id, constraint.getTagName());

        if (constraint.isRequireConstraint()) {
            return matches;
        }

        if (constraint.isExcludeConstraint()) {
            return !matches;
        }

        return true;
    }

    _buildSearchableText(font) {
        const searchableText = [font.family_name, font.style_name, font.full_name].join(" ").toLowerCase();

        return searchableText;
    }
}
