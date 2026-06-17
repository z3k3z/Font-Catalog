export class TagSuggestionProvider {
    constructor(tagLoader) {
        this._tagLoader = tagLoader;
    }

    async loadSuggestions(inputText) {
        const normalizedInputText = inputText.trim().toLocaleLowerCase();
        const allTags = await this._tagLoader.loadAllTags();

        return allTags
            .map((tag) => tag.name)
            .filter((tagName) => tagName.trim().toLocaleLowerCase().includes(normalizedInputText))
            .sort((left, right) => {
                const leftScore = this._scoreSuggestion(normalizedInputText, left.toLocaleLowerCase());
                const rightScore = this._scoreSuggestion(normalizedInputText, right.toLocaleLowerCase());

                if (leftScore !== rightScore) {
                    return leftScore - rightScore;
                }

                return left.localeCompare(right);
            })
            .slice(0, 6);
    }

    _scoreSuggestion(inputText, tagName) {
        if (tagName === inputText) {
            return 0;
        }

        if (tagName.startsWith(inputText)) {
            return 100 + tagName.length - inputText.length;
        }

        const position = tagName.indexOf(inputText);

        if (position >= 0) {
            return 1000 + position;
        }

        return Number.MAX_SAFE_INTEGER;
    }
}
