import { SearchConstraint } from "./search-constraint.js";

export class FontSearch {
    constructor(tagLoader) {
        this._tagLoader = tagLoader;
        this._searchConstraints = [];
    }

    addSearchConstraint(rawSearchTerm, kind, mode) {
        const normalizedSearchTerm = this._normalizeSearchTerm(rawSearchTerm, kind);

        if (normalizedSearchTerm.length === 0) {
            return;
        }

        const alreadyExists = this._searchConstraints.some((constraint) => {
            return constraint.searchTerm === normalizedSearchTerm && constraint.mode === mode;
        });

        if (alreadyExists) {
            return;
        }

        const searchConstraint = new SearchConstraint(normalizedSearchTerm, kind, mode);

        this._searchConstraints.push(searchConstraint);
    }

    _normalizeSearchTerm(rawSearchTerm, kind) {
        if (SearchConstraint.Kind.TEXT == kind) {
            return rawSearchTerm.trim().toLowerCase();
        }
        return rawSearchTerm.trim();
    }

    removeSearchConstraint(searchConstraintToRemove) {
        this._searchConstraints = this._searchConstraints.filter((constraint) => {
            return constraint !== searchConstraintToRemove;
        });
    }

    get searchConstraints() {
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
        return (
            this.fontSatisfiesEveryTextConstraint(font) &&
            this.fontSatisfiesEveryTagConstraint(font, tagSnapshot)
        );
    }

    fontSatisfiesEveryTextConstraint(font) {
        const searchableText = this._buildSearchableText(font);

        return this._searchConstraints
            .filter((constraint) => !constraint.isTagConstraint())
            .every((constraint) => this._fontMatchesTextConstraint(searchableText, constraint));
    }

    fontSatisfiesEveryTagConstraint(font, tagSnapshot) {
        return this._searchConstraints
            .filter((constraint) => constraint.isTagConstraint())
            .every((constraint) => this._fontMatchesTagConstraint(font, constraint, tagSnapshot));
    }

    fontSatisfiesEveryTagConstraintFromTagNames(tagNames) {
        const tagNameSet = new Set(tagNames);

        return this._searchConstraints
            .filter((constraint) => constraint.isTagConstraint())
            .every((constraint) => this._tagNamesMatchTagConstraint(tagNameSet, constraint));
    }

    _fontMatchesTextConstraint(searchableText, constraint) {
        const matches = searchableText.includes(constraint.searchTerm);
        return this._evaluateConstraintMatch(matches, constraint);
    }

    _fontMatchesTagConstraint(font, constraint, tagSnapshot) {
        const matches = tagSnapshot.hasFontForTag(font.id, constraint.searchTerm);

        return this._evaluateConstraintMatch(matches, constraint);
    }

    _tagNamesMatchTagConstraint(tagNameSet, constraint) {
        const matches = tagNameSet.has(constraint.searchTerm);

        return this._evaluateConstraintMatch(matches, constraint);
    }

    _evaluateConstraintMatch(matches, constraint) {
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
