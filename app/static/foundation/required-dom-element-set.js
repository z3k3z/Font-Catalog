import { RequiredDomElement } from "./required-dom-element.js";

export class RequiredDomElementSet {
    constructor(elementIdsByKey) {
        this.elements = {};

        for (const [key, elementId] of Object.entries(elementIdsByKey)) {
            const requiredElement = new RequiredDomElement(elementId);
            this.elements[key] = requiredElement.element;
        }
    }
}
