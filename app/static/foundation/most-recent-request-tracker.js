export class MostRecentRequestTracker {
    constructor() {
        this._currentRequestId = 0;
    }

    start() {
        this._currentRequestId += 1;
        return new MostRecentRequest(this, this._currentRequestId);
    }

    isCurrent(requestId) {
        return requestId === this._currentRequestId;
    }
}

class MostRecentRequest {
    constructor(tracker, requestId) {
        this._tracker = tracker;
        this._requestId = requestId;
    }

    isCurrent() {
        return this._tracker.isCurrent(this._requestId);
    }
}
