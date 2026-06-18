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

    showSimpleToast(message, durationMs = 1800) {
        const toastElement = document.createElement("div");
        toastElement.className = "toast";

        const messageElement = document.createElement("span");
        messageElement.className = "toast-message";
        messageElement.textContent = message;

        toastElement.appendChild(messageElement);
        this._toastRootElement.appendChild(toastElement);

        const dismiss = () => {
            toastElement.classList.add("toast--dismissed");

            window.setTimeout(() => {
                toastElement.remove();
            }, 240);
        };

        window.setTimeout(dismiss, durationMs);
    }

    showToastWithTrailIcon(message, durationMs = 1800, trailIcon) {
        const toastShellElement = document.createElement("div");
        toastShellElement.className = "toast-shell";

        const trailElement = document.createElement("div");
        trailElement.className = "toast-trail";

        const toastElement = document.createElement("div");
        toastElement.className = "toast";

        const messageElement = document.createElement("span");
        messageElement.className = "toast-message";
        messageElement.textContent = message;

        toastElement.appendChild(messageElement);
        toastShellElement.appendChild(trailElement);
        toastShellElement.appendChild(toastElement);
        this._toastRootElement.appendChild(toastShellElement);

        const dismiss = () => {
            this._populateTrail(trailElement, toastElement, trailIcon);

            toastElement.classList.add("toast--dismissed");

            window.setTimeout(() => {
                toastShellElement.remove();
            }, 700);
        };

        window.setTimeout(dismiss, durationMs);
    }

    _populateTrail(trailElement, toastElement, trailIcon) {
        trailElement.innerHTML = "";

        const toastWidth = toastElement.getBoundingClientRect().width;
        const iconSpacing = 22;
        const iconCount = Math.max(1, Math.floor(toastWidth / iconSpacing));

        for (let index = 0; index < iconCount; index += 1) {
            const iconElement = document.createElement("span");
            iconElement.className = "toast-trail-icon";
            iconElement.textContent = trailIcon;
            iconElement.style.left = `${index * iconSpacing}px`;
            iconElement.style.animationDelay = `${index * 42}ms`;

            trailElement.appendChild(iconElement);
        }
    }
}
