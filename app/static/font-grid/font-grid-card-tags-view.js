import { _diags } from "../diagnostics/diagnostics.js";

export class FontGridCardTagsView {
    constructor(tagLoader, toastView) {
        this._tagLoader = tagLoader;
        this._toastView = toastView;
    }

    build(fontId) {
        const tagSummaryElement = document.createElement("button");
        tagSummaryElement.className = "font-card-tag-summary";
        tagSummaryElement.type = "button";
        tagSummaryElement.title = "No tags assigned";

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
        });

        this._updateTagSummary(tagSummaryElement, fontId, []);

        return tagSummaryElement;
    }

    async loadTags(fontId, tagSummaryElement) {
        try {
            const tags = await this._tagLoader.loadTagsForFont(fontId);
            const tagNames = tags.map((tag) => tag.name);
            this._updateTagSummary(tagSummaryElement, fontId, tagNames);
        } catch (error) {
            _diags.emitErrorProbe(() => `Failed to hydrate card tags: ${error}`);
        }
    }

    _updateTagSummary(tagSummaryElement, fontId, tagNames) {
        const tagCountElement = tagSummaryElement.querySelector(".font-card-tag-count");
        const tagPopoverElement = tagSummaryElement.querySelector(".font-card-tag-popover");

        if (tagCountElement === null || tagPopoverElement === null) {
            _diags.emitWarningProbe(() => "Font card tag summary did not contain expected child elements.");
            return;
        }

        if (tagNames.length === 0) {
            tagSummaryElement.classList.remove("has-tags");
            tagSummaryElement.title = "No tags assigned";
            tagCountElement.textContent = "";
        } else {
            tagSummaryElement.classList.add("has-tags");
            tagSummaryElement.title = tagNames.join("\n");
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
        tagPopoverElement.appendChild(this._buildAddEditor(tagSummaryElement, fontId));
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

    _buildAddEditor(tagSummaryElement, fontId) {
        const addTagEditorElement = document.createElement("div");
        addTagEditorElement.className = "font-card-tag-add-editor";

        const addTagInputElement = document.createElement("input");
        addTagInputElement.className = "font-card-tag-add-input";
        addTagInputElement.type = "text";
        addTagInputElement.placeholder = "Tag name";

        const addTagCommitButton = document.createElement("button");
        addTagCommitButton.className = "font-card-tag-add-commit-button";
        addTagCommitButton.type = "button";
        addTagCommitButton.textContent = "Add";
        addTagCommitButton.disabled = true;

        const updateAddButtonState = () => {
            addTagCommitButton.disabled = addTagInputElement.value.trim() === "";
        };

        const commitTagAdd = async () => {
            const tagName = addTagInputElement.value.trim();

            if (tagName === "") {
                return;
            }

            await this._addTag(tagSummaryElement, fontId, tagName);

            addTagInputElement.value = "";
            updateAddButtonState();
        };

        addTagInputElement.addEventListener("input", updateAddButtonState);

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

        return addTagEditorElement;
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
        const tagNames = tags.map((tag) => tag.name);

        this._updateTagSummary(tagSummaryElement, fontId, tagNames);
    }
}
