import { _diags } from "../diagnostics/diagnostics.js";
import { SuggestionDecorator } from "../foundation/suggestion-decorator.js";

export class FontGridCardTagsView {
    constructor(tagLoader, toastView) {
        this._tagLoader = tagLoader;
        this._toastView = toastView;
        this._onTagsChanged = null;
        this._openTagSummaryElement = null;

        document.addEventListener("click", () => {
            this._closeOpenPopover();
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                this._closeOpenPopover();
            }
        });
    }

    build(fontId) {
        const tagSummaryElement = document.createElement("button");
        tagSummaryElement.className = "font-card-tag-summary";
        tagSummaryElement.type = "button";
        tagSummaryElement.title = "No tags assigned";
        tagSummaryElement.removeAttribute("title");

        const tagIconElement = document.createElement("span");
        tagIconElement.className = "font-card-tag-icon";
        tagIconElement.textContent = "🏷";

        const tagCountElement = document.createElement("span");
        tagCountElement.className = "font-card-tag-count";

        const tagPopoverElement = document.createElement("div");
        tagPopoverElement.className = "font-card-tag-popover";

        tagSummaryElement.appendChild(tagIconElement);
        tagSummaryElement.appendChild(tagCountElement);
        tagSummaryElement.appendChild(tagPopoverElement);

        tagSummaryElement.addEventListener("click", (event) => {
            event.stopPropagation();
            this._togglePopover(tagSummaryElement);
        });

        tagPopoverElement.addEventListener("click", (event) => {
            event.stopPropagation();
        });

        this._updateTagSummary(tagSummaryElement, fontId, []);

        return tagSummaryElement;
    }

    setListeners(listeners) {
        this._onTagsChanged = listeners.onTagsChanged ?? null;
    }

    async loadTags(fontId, tagSummaryElement) {
        try {
            const tags = await this._tagLoader.loadTagsForFont(fontId);
            const tagNames = tags.map((tag) => tag.name);
            this._updateTagSummary(tagSummaryElement, fontId, tagNames);
            this._notifyTagsChanged(fontId, tagNames);
            return tagNames;
        } catch (error) {
            _diags.emitErrorProbe(() => `Failed to hydrate card tags: ${error}`);
            return [];
        }
    }

    _notifyTagsChanged(fontId, tagNames) {
        if (this._onTagsChanged !== null) {
            this._onTagsChanged(fontId, tagNames);
        }
    }

    async setExclusiveTag(tagSummaryElement, fontId, selectedTagName, opposingTagName, fontName, icon) {
        await this._tagLoader.addTagToFont(fontId, selectedTagName);
        await this._tagLoader.removeTagFromFont(fontId, opposingTagName);
        const tagNames = await this._refreshTags(tagSummaryElement, fontId);

        this._toastView.showToastWithTrailIcon(`You ${selectedTagName} ${fontName}!`, 1800, icon);
        return tagNames;
    }

    _updateTagSummary(tagSummaryElement, fontId, tagNames) {
        const tagCountElement = tagSummaryElement.querySelector(".font-card-tag-count");
        const tagPopoverElement = tagSummaryElement.querySelector(".font-card-tag-popover");

        if (tagCountElement === null || tagPopoverElement === null) {
            _diags.emitWarningProbe(() => "Font card tag summary did not contain expected child elements.");
            return;
        }

        tagSummaryElement.removeAttribute("title");
        if (tagNames.length === 0) {
            tagSummaryElement.classList.remove("has-tags");
            tagCountElement.textContent = "";
        } else {
            tagSummaryElement.classList.add("has-tags");
            tagCountElement.textContent = `${tagNames.length}`;
        }

        this._renderPopover(tagPopoverElement, tagSummaryElement, fontId, tagNames);
    }

    _renderPopover(tagPopoverElement, tagSummaryElement, fontId, tagNames) {
        tagPopoverElement.innerHTML = "";

        const tagChipContainer = document.createElement("div");
        tagChipContainer.className = "font-card-tag-chip-container";

        if (tagNames.length === 0) {
            const emptyChip = document.createElement("span");
            emptyChip.className = "font-card-tag-chip font-card-tag-chip--empty";
            emptyChip.textContent = "(none assigned)";
            tagChipContainer.appendChild(emptyChip);
        } else {
            const sortedTagNames = [...tagNames].sort((a, b) => a.localeCompare(b));

            for (const tagName of sortedTagNames) {
                tagChipContainer.appendChild(this._buildTagChip(tagSummaryElement, fontId, tagName));
            }
        }

        tagPopoverElement.appendChild(tagChipContainer);
        tagPopoverElement.appendChild(this._buildAddEditor(tagSummaryElement, fontId, tagNames));
    }
    _togglePopover(tagSummaryElement) {
        if (this._openTagSummaryElement === tagSummaryElement) {
            this._closeOpenPopover();
            return;
        }

        this._closeOpenPopover();
        this._openPopover(tagSummaryElement);
    }

    _openPopover(tagSummaryElement) {
        tagSummaryElement.classList.add("font-card-tag-summary--open");
        this._openTagSummaryElement = tagSummaryElement;

        const inputElement = tagSummaryElement.querySelector(".font-card-tag-add-input");

        if (inputElement !== null) {
            inputElement.focus();
        }
    }

    _closeOpenPopover() {
        if (this._openTagSummaryElement === null) {
            return;
        }

        this._openTagSummaryElement.classList.remove("font-card-tag-summary--open");
        this._openTagSummaryElement = null;
    }

    _buildTagChip(tagSummaryElement, fontId, tagName) {
        const tagChip = document.createElement("span");
        tagChip.className = "font-card-tag-chip";

        const tagNameElement = document.createElement("span");
        tagNameElement.textContent = tagName;

        const removeButton = document.createElement("button");
        removeButton.className = "font-card-tag-chip-remove";
        removeButton.type = "button";
        removeButton.textContent = "×";
        removeButton.title = `Remove ${tagName}`;

        removeButton.addEventListener("click", async (event) => {
            event.stopPropagation();
            await this._removeTag(tagSummaryElement, fontId, tagName);
        });

        tagChip.appendChild(tagNameElement);
        tagChip.appendChild(removeButton);

        return tagChip;
    }

    _scoreSuggestion(inputText, tagName) {
        const candidate = tagName;

        if (candidate === inputText) {
            return 0;
        }

        if (candidate.startsWith(inputText)) {
            return 100 + (candidate.length - inputText.length);
        }

        const position = candidate.indexOf(inputText);

        if (position >= 0) {
            return 1000 + position;
        }

        return Number.MAX_SAFE_INTEGER;
    }

    _buildAddEditor(tagSummaryElement, fontId, assignedTagNames) {
        const addTagEditorElement = document.createElement("div");
        addTagEditorElement.className = "font-card-tag-add-editor";

        const addTagInputElement = document.createElement("input");
        addTagInputElement.className = "font-card-tag-add-input";
        addTagInputElement.type = "text";
        addTagInputElement.placeholder = "Tag name";

        const suggestionContainer = document.createElement("div");
        suggestionContainer.className = "font-card-tag-suggestion-container hidden";

        const addTagCommitButton = document.createElement("button");
        addTagCommitButton.className = "font-card-tag-add-commit-button";
        addTagCommitButton.type = "button";
        addTagCommitButton.textContent = "Add";
        addTagCommitButton.disabled = true;

        const updateAddButtonState = () => {
            addTagCommitButton.disabled = addTagInputElement.value.trim() === "";
        };

        const hideSuggestions = () => {
            suggestionContainer.innerHTML = "";
            suggestionContainer.classList.add("hidden");
        };

        const commitTagAdd = async () => {
            const tagName = addTagInputElement.value.trim();

            if (tagName === "") {
                return;
            }

            hideSuggestions();
            await this._addTag(tagSummaryElement, fontId, tagName);

            const newInputElement = tagSummaryElement.querySelector(".font-card-tag-add-input");

            if (newInputElement !== null) {
                newInputElement.focus();
            }
        };

        const suggestionDecorator = new SuggestionDecorator({
            inputElement: addTagInputElement,
            suggestionContainerElement: suggestionContainer,
            loadSuggestions: async (inputText) =>
                await this._loadTagSuggestions(inputText, assignedTagNames),
            getSuggestionText: (tagName) => tagName,
            onSuggestionAccepted: (tagName) => {
                addTagInputElement.value = tagName;
                updateAddButtonState();
            },
        });

        suggestionDecorator.attach();

        addTagInputElement.addEventListener("input", () => {
            updateAddButtonState();
        });

        addTagInputElement.addEventListener("keydown", async (event) => {
            if (event.key === "Enter") {
                event.stopPropagation();
                await commitTagAdd();
            }
        });

        addTagCommitButton.addEventListener("click", async (event) => {
            event.stopPropagation();
            await commitTagAdd();
        });

        addTagEditorElement.appendChild(addTagInputElement);
        addTagEditorElement.appendChild(addTagCommitButton);

        const wrapper = document.createElement("div");
        wrapper.className = "font-card-tag-add-wrapper";
        wrapper.appendChild(addTagEditorElement);
        wrapper.appendChild(suggestionContainer);

        return wrapper;
    }

    async _addTag(tagSummaryElement, fontId, tagName) {
        await this._tagLoader.addTagToFont(fontId, tagName);
        await this._refreshTags(tagSummaryElement, fontId);
    }

    async _removeTag(tagSummaryElement, fontId, tagName) {
        await this._tagLoader.removeTagFromFont(fontId, tagName);
        await this._refreshTags(tagSummaryElement, fontId);

        this._toastView.showUndoToast(`Removed tag "${tagName}"`, "Undo", async () => {
            await this._tagLoader.addTagToFont(fontId, tagName);
            await this._refreshTags(tagSummaryElement, fontId);
        });
    }

    async _refreshTags(tagSummaryElement, fontId) {
        this._tagLoader.invalidateFont(fontId);

        const tags = await this._tagLoader.loadTagsForFont(fontId);
        return await this.loadTags(fontId, tagSummaryElement);
    }

    async _loadTagSuggestions(inputText, assignedTagNames) {
        const normalizedInputText = inputText.trim().toLocaleLowerCase();
        const allTags = await this._tagLoader.loadAllTags();

        const assignedKeys = new Set(assignedTagNames.map((tagName) => tagName.trim().toLocaleLowerCase()));

        return allTags
            .map((tag) => tag.name)
            .filter((tagName) => !assignedKeys.has(tagName.trim().toLocaleLowerCase()))
            .filter((tagName) => tagName.trim().toLocaleLowerCase().includes(normalizedInputText))
            .sort((left, right) => {
                const leftScore = this._scoreSuggestion(inputText, left);
                const rightScore = this._scoreSuggestion(inputText, right);

                if (leftScore !== rightScore) {
                    return leftScore - rightScore;
                }

                return left.localeCompare(right);
            })
            .slice(0, 6);
    }
}
