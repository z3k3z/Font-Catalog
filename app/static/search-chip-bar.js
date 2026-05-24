export class SearchChipBar {
    constructor(searchInputElement, chipContainerElement) {
        this._searchInputElement = searchInputElement;
        this._chipContainerElement = chipContainerElement;

        this._onSearchTermAdded = null;
        this._onSearchTermRemoved = null;

        this._configureEvents();
    }

    setListeners(listeners) {
        this._onSearchTermAdded = listeners.onSearchTermAdded ?? null;
        this._onSearchTermRemoved = listeners.onSearchTermRemoved ?? null;
    }

    clearSearchInput() {
        this._searchInputElement.value = "";
    }

    renderSearchTerms(searchTerms) {
        this._chipContainerElement.innerHTML = "";

        for (const searchTerm of searchTerms) {
            const chip = this._buildChip(searchTerm);
            this._chipContainerElement.appendChild(chip);
        }
    }

    _configureEvents() {
        this._searchInputElement.addEventListener("keydown", (event) => {
            if (event.key !== "Enter") {
                return;
            }

            if (this._onSearchTermAdded !== null) {
                this._onSearchTermAdded(event.target.value);
            }
        });
    }

    _buildChip(searchTerm) {
        const chip = document.createElement("span");
        chip.className = "search-chip";

        const label = document.createElement("span");
        label.textContent = searchTerm;

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "×";

        removeButton.addEventListener("click", () => {
            if (this._onSearchTermRemoved !== null) {
                this._onSearchTermRemoved(searchTerm);
            }
        });

        chip.appendChild(label);
        chip.appendChild(removeButton);

        return chip;
    }
}
