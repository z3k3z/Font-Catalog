export class CardGridPresentationController {
    static CardSize = Object.freeze({
        SMALL: "small",
        MEDIUM: "medium",
        LARGE: "large",
        HUGE: "huge",
    });

    constructor(elements) {
        this._elements = elements;
        this._cardSize = CardGridPresentationController.CardSize.MEDIUM;
        this._onCardSizeChanged = null;

        this._configureEvents();
        this._render();
    }

    setListeners(listeners) {
        this._onCardSizeChanged = listeners.onCardSizeChanged ?? null;
    }

    getCardSize() {
        return this._cardSize;
    }

    _configureEvents() {
        this._elements.smallButton.addEventListener("click", () => {
            this._setCardSize(CardGridPresentationController.CardSize.SMALL);
        });

        this._elements.mediumButton.addEventListener("click", () => {
            this._setCardSize(CardGridPresentationController.CardSize.MEDIUM);
        });

        this._elements.largeButton.addEventListener("click", () => {
            this._setCardSize(CardGridPresentationController.CardSize.LARGE);
        });

        this._elements.hugeButton.addEventListener("click", () => {
            this._setCardSize(CardGridPresentationController.CardSize.HUGE);
        });
    }

    _setCardSize(cardSize) {
        if (this._cardSize === cardSize) {
            return;
        }

        this._cardSize = cardSize;
        this._render();

        if (this._onCardSizeChanged !== null) {
            this._onCardSizeChanged(cardSize);
        }
    }

    _render() {
        this._elements.smallButton.classList.toggle(
            "card-grid-size-button--selected",
            this._cardSize === CardGridPresentationController.CardSize.SMALL
        );

        this._elements.mediumButton.classList.toggle(
            "card-grid-size-button--selected",
            this._cardSize === CardGridPresentationController.CardSize.MEDIUM
        );

        this._elements.largeButton.classList.toggle(
            "card-grid-size-button--selected",
            this._cardSize === CardGridPresentationController.CardSize.LARGE
        );

        this._elements.hugeButton.classList.toggle(
            "card-grid-size-button--selected",
            this._cardSize === CardGridPresentationController.CardSize.HUGE
        );
    }
}
