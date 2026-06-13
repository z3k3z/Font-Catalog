export class ToastView {
    constructor(toastRootElement) {
        this._toastRootElement = toastRootElement;
    }

    showUndoToast(message, undoLabel, onUndo) {
        const toastElement = document.createElement("div");
        toastElement.className = "toast";

        const messageElement = document.createElement("span");
        messageElement.className = "toast-message";
        messageElement.textContent = message;

        const undoButton = document.createElement("button");
        undoButton.className = "toast-undo-button";
        undoButton.type = "button";
        undoButton.textContent = undoLabel;

        let dismissed = false;

        const dismiss = () => {
            if (dismissed) {
                return;
            }

            dismissed = true;
            toastElement.classList.add("toast--dismissed");

            window.setTimeout(() => {
                toastElement.remove();
            }, 240);
        };

        const timeoutId = window.setTimeout(() => {
            dismiss();
        }, 6000);

        undoButton.addEventListener("click", async (event) => {
            event.stopPropagation();

            window.clearTimeout(timeoutId);
            await onUndo();
            dismiss();
        });

        toastElement.appendChild(messageElement);
        toastElement.appendChild(undoButton);
        this._toastRootElement.appendChild(toastElement);

        window.setTimeout(() => {
            toastElement.classList.add("toast--visible");
        }, 0);
    }
}
