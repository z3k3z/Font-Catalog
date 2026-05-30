export class FrontendDiagnosticSession {
    constructor() {
        this._sessionId = crypto.randomUUID();
        this._startedAtUtc = new Date().toISOString();
        this._userAgent = navigator.userAgent;
        this._pageUrl = window.location.href;
    }

    get sessionId() {
        return this._sessionId;
    }

    get startedAtUtc() {
        return this._startedAtUtc;
    }

    get userAgent() {
        return this._userAgent;
    }

    get pageUrl() {
        return this._pageUrl;
    }
}
