export class FrontendDiagnostics {
    static ProbeLevel = class {
        constructor(rank, text) {
            this._rank = rank;
            this._text = text;
        }

        isEnabled(minimumProbeLevel) {
            return this._rank >= minimumProbeLevel._rank;
        }

        toString() {
            return this._text;
        }
    };

    static DEBUG = new FrontendDiagnostics.ProbeLevel(10, "DEBUG");
    static WARNING = new FrontendDiagnostics.ProbeLevel("WARNING");
    static ERROR = new FrontendDiagnostics.ProbeLevel(40, "ERROR");

    constructor(minimumProbeLevel) {
        this._minimumProbeLevel = minimumProbeLevel;
    }

    emitDebugProbe(messageProvider) {
        if (FrontendDiagnostics.DEBUG.isEnabled(this._minimumProbeLevel)) {
            this._emitProbe(FrontendDiagnostics.DEBUG, messageProvider);
        }
    }

    emitWarningProbe(messageProvider) {
        if (FrontendDiagnostics.WARNING.isEnabled(this._minimumProbeLevel)) {
            this._emitProbe(FrontendDiagnostics.WARNING, messageProvider);
        }
    }

    emitErrorProbe(messageProvider) {
        if (FrontendDiagnostics.ERROR.isEnabled(this._minimumProbeLevel)) {
            this._emitProbe(FrontendDiagnostics.ERROR, messageProvider);
        }
    }

    _emitProbe(probeLevel, messageProvider) {
        const message = messageProvider();
        const timestamp = this._buildTimestamp();
        const formattedMessage = `${timestamp} FRONTEND ${probeLevel}: ${message}`;

        switch (probeLevel) {
            case FrontendDiagnostics.ERROR:
                console.error(formattedMessage);
                break;

            case FrontendDiagnostics.WARNING:
                console.warn(formattedMessage);
                break;

            case FrontendDiagnostics.DEBUG:
                console.debug(formattedMessage);
                break;

            default:
                console.log(formattedMessage);
                break;
        }
    }

    _buildTimestamp() {
        const now = new Date();

        return (
            `${String(now.getFullYear()).slice(2)}-` +
            `${String(now.getMonth() + 1).padStart(2, "0")}-` +
            `${String(now.getDate()).padStart(2, "0")} T ` +
            `${String(now.getHours()).padStart(2, "0")}:` +
            `${String(now.getMinutes()).padStart(2, "0")}:` +
            `${String(now.getSeconds()).padStart(2, "0")}`
        );
    }
}

export const _diags = new FrontendDiagnostics(FrontendDiagnostics.DEBUG);
