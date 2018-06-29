class ContextManager {
    _current;

    get current() {
        return this._current;
    }

    set current(value) {
        this._current = value;
    }
}

export default ContextManager;
