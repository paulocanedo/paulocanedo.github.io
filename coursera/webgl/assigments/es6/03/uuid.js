let uuid = (() => {
    let control = -1;

    return {
        get last() { return control; },
        get new() { return ++control; }
    }
})();
