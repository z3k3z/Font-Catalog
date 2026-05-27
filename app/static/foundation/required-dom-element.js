export class RequiredDomElement {
    constructor(elementId) {
        this._elementId = elementId;
        this._element = document.getElementById(elementId);

        if (this._element === null) {
            throw new Error(`Unable to locate required element '${elementId}'.`);
        }
    }

    get element() {
        return this._element;
    }
}
