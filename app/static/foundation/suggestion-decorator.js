import { MostRecentRequestTracker } from "../foundation/most-recent-request-tracker.js";

export class SuggestionDecorator {
    constructor(dependencies) {
        this._inputElement = dependencies.inputElement;
        this._suggestionContainerElement = dependencies.suggestionContainerElement;
        this._loadSuggestions = dependencies.loadSuggestions;
        this._getSuggestionText = dependencies.getSuggestionText;
        this._onSuggestionAccepted = dependencies.onSuggestionAccepted;
        this._requestTracker = new MostRecentRequestTracker();
    }

    attach() {
        this._inputElement.addEventListener("input", () => {
            this.updateSuggestions();
        });
    }

    async updateSuggestions() {
        const request = this._requestTracker.start();
        const inputText = this._inputElement.value.trim();

        this.hideSuggestions();

        if (inputText === "") {
            return;
        }

        const suggestions = await this._loadSuggestions(inputText);

        if (!request.isCurrent()) {
            return;
        }

        if (inputText !== this._inputElement.value.trim()) {
            return;
        }

        this._renderSuggestions(suggestions);
    }

    hideSuggestions() {
        this._suggestionContainerElement.innerHTML = "";
        this._suggestionContainerElement.classList.add("hidden");
    }

    _renderSuggestions(suggestions) {
        this._suggestionContainerElement.innerHTML = "";

        if (suggestions.length === 0) {
            this.hideSuggestions();
            return;
        }

        for (const suggestion of suggestions) {
            const suggestionButton = document.createElement("button");
            suggestionButton.className = "suggestion-decorator-item";
            suggestionButton.type = "button";
            suggestionButton.textContent = this._getSuggestionText(suggestion);
            suggestionButton.tabIndex = 0;

            suggestionButton.addEventListener("click", (event) => {
                event.stopPropagation();
                this._acceptSuggestion(suggestion);
            });

            suggestionButton.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    event.stopPropagation();
                    this._acceptSuggestion(suggestion);
                }
            });

            this._suggestionContainerElement.appendChild(suggestionButton);
        }

        this._suggestionContainerElement.classList.remove("hidden");
    }

    _acceptSuggestion(suggestion) {
        this._onSuggestionAccepted(suggestion);
        this.hideSuggestions();
        this._inputElement.focus();
    }
}
