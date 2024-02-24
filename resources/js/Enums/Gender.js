const Gender = (function () {
    const genders = {
        "0": "Female",
        "1": "Male",
        "-1": "Unknown",
    };
    return {
        get: function (code) {
            return genders[code];
        }
    };
})();

export default Gender;
