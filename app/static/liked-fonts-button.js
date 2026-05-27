export class LikedFontsButton {
    constructor(elements) {
        this._elements = elements;

        this._onClicked = null;

        this._configureEvents();
    }

    setListeners(listeners) {
        this._onClicked = listeners.onClicked ?? null;
    }

    renderCount(count) {
        this._elements.count.textContent = String(count);
    }

    _configureEvents() {
        this._elements.button.addEventListener("click", () => {
            if (this._onClicked !== null) {
                this._onClicked();
            }
        });
    }
}
