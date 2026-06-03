export class CardSampleTextController {
    constructor(elements) {
        this._elements = elements;
        this._onSampleTextChanged = null;

        this._configureEvents();
    }

    setListeners(listeners) {
        this._onSampleTextChanged = listeners.onSampleTextChanged ?? null;
    }

    getSampleText() {
        const sampleText = this._elements.input.value;

        return sampleText;
    }

    _configureEvents() {
        this._elements.input.addEventListener("input", () => {
            if (this._onSampleTextChanged !== null) {
                this._onSampleTextChanged(this.getSampleText());
            }
        });
    }
}
