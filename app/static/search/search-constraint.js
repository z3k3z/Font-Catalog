export class SearchConstraint {
    static Mode = {
        REQUIRE: "REQUIRE",
        EXCLUDE: "EXCLUDE",
    };

    static Kind = {
        TEXT: "TEXT",
        TAG: "TAG",
    };

    constructor(searchTerm, kind, mode) {
        this._searchTerm = searchTerm;
        this._kind = kind;
        this._mode = mode;
    }

    get searchTerm() {
        return this._searchTerm;
    }

    get mode() {
        return this._mode;
    }

    get kind() {
        return this._kind;
    }

    isTagConstraint() {
        return this._kind === SearchConstraint.Kind.TAG;
    }

    isTextConstraint() {
        return this._kind === SearchConstraint.Kind.TEXT;
    }

    isRequireConstraint() {
        return this._mode === SearchConstraint.Mode.REQUIRE;
    }

    isExcludeConstraint() {
        return this._mode === SearchConstraint.Mode.EXCLUDE;
    }
}
