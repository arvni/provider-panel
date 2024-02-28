const ConsanguineousParents = (function () {
    const genders = {
        "0": "No",
        "1": "Yes",
        "-1": "Unknown",
    };
    return {
        get: function (code) {
            return genders[code];
        }
    };
})();

export default ConsanguineousParents;
