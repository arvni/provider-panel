import validator from 'validator';


export const loginFormValidator = (data, onerror) => {
    let output = true;
    if (!validator.isEmail(data.email) || validator.isEmpty(data.email)) {
        output = false;
        onerror("email", "Please Enter a Valid Email");
    }
    if (validator.isEmpty(data.password) || data.password.length < 6) {
        output = false;
        onerror("password", "Please Enter a Correct Password with at least 6 character");
    }
    // if (validator.isEmpty(data.captcha)) {
    //     output = false;
    //     onerror("captcha", "Please Check the Captcha");
    // }
    return output;
}

export const changePasswordValidator = (data, onerror, user) => {
    let output = true;
    if (!user && data.current_password.length < 8) {
        output = false;
        onerror("current_password", "Please Enter Correct Current Password");
    }
    if (data.password.length < 8 || data.password === data.current_password) {
        output = false;
        onerror("password", "Please Enter Correct New Password at lease 8 character");
    }
    if (data.password !== data.password_confirmation) {
        output = false;
        onerror("password_confirmation", "New Password and Password Confirmation isn't the same");
    }
    return output;
}

export const forgetPasswordValidator = (data, onerror) => {
    let output = true;
    if (!validator.isEmail(data.email)) {
        output = false;
        onerror("email", "Please Enter Valid Email");
    }
    if (validator.isEmpty(data.captcha)) {
        output = false;
        onerror("captcha", "Please check the google captcha");
    }
    return output;
}


export const resetPasswordValidator = (data, onerror) => {
    let output = true;
    if (!validator.isEmail(data.email) || validator.isEmpty(data.email)) {
        output = false;
        onerror("email", "The link was corrupted");
    }
    if (data.password.length < 8) {
        output = false;
        onerror("password", "Please Enter Correct New Password at lease 8 character");
    }
    if (data.password !== data.password_confirmation) {
        output = false;
        onerror("password_confirmation", "New Password and Password Confirmation isn't the same");
    }
    return output;
}

export const storeOrderMaterialValidator = (data, onError) => {

    let output = true;
    if (validator.isEmpty(data.material ?? "")) {
        onError("material", "Please select Material");
        output = false;
    }
    if (data.quantity) {
        if (data.quantity < 1 && data.quantity > 500) {
            onError("material", "Please enter the quantity in range of 1 to 500");
            output = false;
        }
    } else {
        onError("material", "Please enter the quantity that you need");
        output = false;
    }

    return output
}

export const storeSampleTypeValidator = (data, onError) => {
    let output = true;
    if (validator.isEmpty(data.name)) {
        onError("name", "Please Enter Name");
        output = false;
    }
    return output
}

export const storeSymptomGroupValidator = (data, onError) => {
    let output = true;
    if (validator.isEmpty(data.name)) {
        onError("name", "Please Enter Name");
        output = false;
    }
    return output
}

export const storeSymptomValidator = (data, onError) => {
    let output = true;
    if (validator.isEmpty(data.name)) {
        onError("name", "Please Enter Name");
        output = false;
    }
    return output
}
export const storeConsentGroupValidator = (data, onError) => {
    let output = true;
    if (validator.isEmpty(data.title)) {
        onError("title", "Please Enter Name");
        output = false;
    }
    return output
}

export const storeDiseaseGroupValidator = (data, onError) => {
    let output = true;
    if (validator.isEmpty(data.name)) {
        onError("name", "Please Enter Name");
        output = false;
    }
    return output
}
export const storeTestValidator = (data, onError) => {
    let output = true;
    if (data.name.length < 3) {
        output = false;
        onError("name", "please enter a name with at least 3 character");
    }
    if (data.shortName.length < 3) {
        output = false;
        onError("shortName", "please enter a name with at least 3 character");
    }
    if (data.code.length < 3) {
        output = false;
        onError("code", "please enter a name with at least 3 character");
    }

    return output;

}


//// order store and update

export const patientDetailsValidate = (data, onError) => {
    let output = true;
    if (data?.consanguineousParents === null) {
        output = false;
        onError("consanguineousParents", "Please that parents are consanguineous ")
    }
    if (validator.isEmpty(data?.fullName ?? "")) {
        output = false;
        onError("fullName", "Please enter patient name")
    }
    if (!["0", "-1", "1", 0, 1, -1].includes(data.gender ?? "")) {
        output = false;
        onError("gender", "Please select patient gender")
    }
    if (!validator.isDate(data.dateOfBirth ?? "")) {

        output = false;
        onError("dateOfBirth", "Please select patient date of birth")
    }
    return output;
}
export const testMethodValidate = (data, onError) => {
    let output = true;
    if (data.tests.length < 1) {
        output = false
        onError("test_method", "Please choose at least one test")
    }
    return output
}

export const checkPassword = (data, currentNeeded, setError) => {
    let res = true;
    if (!data.current && currentNeeded) {
        setError("current", "Please Enter Current Password");
        res = false;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})/.test(data.password)) {
        setError("password", "Password must has at least one lowercase letter, one uppercase letter, one digit, one special character, and is at least eight characters long")
        res = false;
    }
    if (data.password !== data.password_confirmation) {
        setError("password_confirmation", "password and password Confirmation are not the Same");
        res = false;
    }
    return res;
}
