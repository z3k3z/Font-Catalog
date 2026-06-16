export class SearchConstraint {
    static Mode = {
        REQUIRE: "REQUIRE",
        EXCLUDE: "EXCLUDE",
    };

    constructor(searchTerm, mode) {
        this._searchTerm = searchTerm;
        this._mode = mode;
    }

    get searchTerm() {
        return this._searchTerm;
    }

    get mode() {
        return this._mode;
    }

    isRequireConstraint() {
        return this._mode === SearchConstraint.Mode.REQUIRE;
    }

    isExcludeConstraint() {
        return this._mode === SearchConstraint.Mode.EXCLUDE;
    }

    isTagConstraint() {
        return this._searchTerm.startsWith("#") && this._searchTerm.length > 1;
    }

    getTagName() {
        if (this.isTagConstraint()) {
            return this._searchTerm.slice(1);
        }
        return "";
    }
}
