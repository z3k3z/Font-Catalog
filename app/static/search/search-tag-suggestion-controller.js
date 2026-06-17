import { SuggestionDecorator } from "../foundation/suggestion-decorator.js";
import { TagSuggestionProvider } from "../tags/tag-suggestion-provider.js";
import { SearchConstraint } from "./search-constraint.js";

export class SearchTagSuggestionController {
    constructor(searchInputElement, fontSearch, tagLoader) {
        this._searchInputElement = searchInputElement;
        this._fontSearch = fontSearch;
        this._tagSuggestionProvider = new TagSuggestionProvider(tagLoader);
        this._suggestionContainerElement = document.createElement("div");
        this._suggestionDecorator = null;
    }

    attach() {
        this._suggestionContainerElement.className = "search-input-suggestion-container hidden";
        this._searchInputElement.parentElement.appendChild(this._suggestionContainerElement);

        this._suggestionDecorator = new SuggestionDecorator({
            inputElement: this._searchInputElement,
            suggestionContainerElement: this._suggestionContainerElement,
            loadSuggestions: async (inputText) => await this._loadSuggestions(inputText),
            getSuggestionText: (tagName) =>
                `${this._getTagSearchPrefix(this._searchInputElement.value)}${tagName}`,
            onSuggestionAccepted: (tagName) => {
                const prefix = this._getTagSearchPrefix(this._searchInputElement.value);
                this._searchInputElement.value = `${prefix}${tagName}`;
                this._searchInputElement.focus();
            },
        });

        this._suggestionDecorator.attach();
    }

    hideSuggestions() {
        if (this._suggestionDecorator !== null) {
            this._suggestionDecorator.hideSuggestions();
        }
    }

    async _loadSuggestions(inputText) {
        const prefix = this._getTagSearchPrefix(inputText);

        if (prefix === "") {
            return [];
        }

        const tagSearchText = inputText.slice(prefix.length);

        if (tagSearchText.length === 0) {
            return [];
        }

        const existingTagNames = this._getExistingTagConstraintNames(prefix);
        const suggestions = await this._tagSuggestionProvider.loadSuggestions(tagSearchText);

        return suggestions.filter((tagName) => !existingTagNames.has(tagName));
    }

    _getTagSearchPrefix(inputText) {
        if (inputText.startsWith("-#")) {
            return "-#";
        }

        if (inputText.startsWith("#")) {
            return "#";
        }

        return "";
    }

    _getExistingTagConstraintNames(prefix) {
        const targetMode = prefix === "-#" ? SearchConstraint.Mode.EXCLUDE : SearchConstraint.Mode.REQUIRE;

        return new Set(
            this._fontSearch.searchConstraints
                .filter((constraint) => constraint.isTagConstraint())
                .filter((constraint) => constraint.mode === targetMode)
                .map((constraint) => constraint.searchTerm)
        );
    }
}
