export class MostRecentValueCache {
    constructor(loader) {
        this._loader = loader;
        this._value = undefined;
        this._promise = undefined;
    }

    async get() {
        if (this._value !== undefined) {
            return this._value;
        }

        if (this._promise !== undefined) {
            return await this._promise;
        }

        this._promise = this._loader();

        try {
            this._value = await this._promise;
            return this._value;
        } finally {
            this._promise = undefined;
        }
    }

    invalidate() {
        this._value = undefined;
        this._promise = undefined;
    }
}
