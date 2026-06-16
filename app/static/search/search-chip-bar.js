import { SearchConstraint } from "./search-constraint.js";

export class SearchChipBar {
    constructor(searchInputElement, chipContainerElement) {
        this._searchInputElement = searchInputElement;
        this._chipContainerElement = chipContainerElement;

        this._onSearchConstraintAdded = null;
        this._onSearchConstraintRemoved = null;

        this._configureEvents();
    }

    setListeners(listeners) {
        this._onSearchConstraintAdded = listeners.onSearchConstraintAdded ?? null;
        this._onSearchConstraintRemoved = listeners.onSearchConstraintRemoved ?? null;
    }

    clearSearchInput() {
        this._searchInputElement.value = "";
    }

    renderSearchConstraints(searchTerms) {
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

            if (this._onSearchConstraintAdded !== null) {
                let mode = SearchConstraint.Mode.REQUIRE;
                let kind = SearchConstraint.Kind.TEXT;
                let searchTerm = event.target.value.trim();

                if (searchTerm.startsWith("-")) {
                    mode = SearchConstraint.Mode.EXCLUDE;
                    searchTerm = searchTerm.slice(1).trim();
                }
                if (searchTerm.startsWith("#")) {
                    kind = SearchConstraint.Kind.TAG;
                    searchTerm = searchTerm.slice(1).trim();
                }
                this._onSearchConstraintAdded(searchTerm, kind, mode);
            }
        });
    }

    _buildChip(searchConstraint) {
        const chip = document.createElement("span");
        chip.className = "search-chip";

        const label = document.createElement("span");
        label.textContent = searchConstraint.isExcludeConstraint()
            ? `Hide: ${searchConstraint.searchTerm}`
            : `Show: ${searchConstraint.searchTerm}`;

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "×";

        removeButton.addEventListener("click", () => {
            if (this._onSearchConstraintRemoved !== null) {
                this._onSearchConstraintRemoved(searchConstraint);
            }
        });

        if (searchConstraint.isExcludeConstraint()) {
            chip.classList.add("search-chip--exclude");
        }

        chip.appendChild(label);
        chip.appendChild(removeButton);

        return chip;
    }
}
