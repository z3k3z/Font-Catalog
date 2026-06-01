import { _diags } from "./diagnostics.js";

export class FrontendDiagnosticReporter {
    constructor(session) {
        this._session = session;
        this._reportedVariantKeys = new Set();
        this._suppressedCountByVariantKey = new Map();
        this._summaryThreshold = 10;
    }

    static ProbeLevel = Object.freeze({
        DEBUG: "DEBUG",
        WARNING: "WARNING",
        ERROR: "ERROR",
    });

    async reportSessionStarted() {
        await this._postEvent(FrontendDiagnosticReporter.ProbeLevel.DEBUG, {
            eventType: "frontend_session_started",
            subjectKey: "session",
            variantKey: "started",
            message: "Frontend diagnostic session started.",
            occurrenceCount: 1,
        });
    }

    async reportDebugEvent(event) {
        await this._reportEvent(
            FrontendDiagnosticReporter.ProbeLevel.DEBUG,
            this._addFrontendCallSite(event)
        );
    }

    async reportWarningEvent(event) {
        await this._reportEvent(
            FrontendDiagnosticReporter.ProbeLevel.WARNING,
            this._addFrontendCallSite(event)
        );
    }

    async reportErrorEvent(event) {
        await this._reportEvent(
            FrontendDiagnosticReporter.ProbeLevel.ERROR,
            this._addFrontendCallSite(event)
        );
    }

    async _reportEvent(probeLevel, event) {
        const dedupeKey = this._buildDedupeKey(event);

        if (!this._reportedVariantKeys.has(dedupeKey)) {
            this._reportedVariantKeys.add(dedupeKey);

            await this._postEvent(probeLevel, {
                eventType: event.eventType,
                subjectKey: event.subjectKey,
                variantKey: event.variantKey,
                message: event.message,
                callSite: event.callSite ?? "",
                occurrenceCount: 1,
            });

            return;
        }

        this._incrementSuppressedCount(dedupeKey);

        if (this._shouldEmitSummary(dedupeKey)) {
            await this._postEvent(probeLevel, {
                eventType: `${event.eventType}_summary`,
                subjectKey: event.subjectKey,
                variantKey: event.variantKey,
                message: `Suppressed repeated frontend diagnostic event: ${event.message}`,
                callSite: event.callSite ?? "",
                occurrenceCount: this._getSuppressedCount(dedupeKey),
                callSite: event.callSite,
            });

            this._suppressedCountByVariantKey.set(dedupeKey, 0);
        }
    }

    _addFrontendCallSite(event) {
        const callSite = this._captureFrontendCallSite();

        return {
            ...event,
            callSite,
        };
    }

    _captureFrontendCallSite() {
        const error = new Error();
        const stack = error.stack ?? "";

        const stackLines = stack
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

        const callSite = stackLines.length >= 5 ? stackLines[4] : "unknown";

        return callSite;
    }

    _buildDedupeKey(event) {
        const dedupeKey = `${event.eventType}:${event.subjectKey}:${event.variantKey}`;

        return dedupeKey;
    }

    _incrementSuppressedCount(dedupeKey) {
        const currentCount = this._getSuppressedCount(dedupeKey);
        this._suppressedCountByVariantKey.set(dedupeKey, currentCount + 1);
    }

    _shouldEmitSummary(dedupeKey) {
        const shouldEmitSummary = this._getSuppressedCount(dedupeKey) >= this._summaryThreshold;

        return shouldEmitSummary;
    }

    _getSuppressedCount(dedupeKey) {
        const suppressedCount = this._suppressedCountByVariantKey.get(dedupeKey) ?? 0;

        return suppressedCount;
    }

    async _postEvent(probeLevel, event) {
        try {
            const body = JSON.stringify({
                session_id: this._session.sessionId,
                session_started_at_utc: this._session.startedAtUtc,
                event_type: event.eventType,
                subject_key: event.subjectKey,
                variant_key: event.variantKey,
                message: event.message,
                occurrence_count: event.occurrenceCount,
                frontend_call_site: event.callSite ?? "",
                user_agent: this._session.userAgent,
                page_url: this._session.pageUrl,
                probe_level: probeLevel,
            });
            const response = await fetch("/api/diagnostics/frontend", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: body,
            });

            if (!response.ok) {
                _diags.emitWarningProbe(
                    () =>
                        `Frontend diagnostic event was not accepted. ` +
                        `Status: ${response.status} ${response.statusText}.`
                );
            }
        } catch (error) {
            _diags.emitWarningProbe(() => `Exception while reporting frontend diagnostic event: ${error}`);
        }
    }
}
