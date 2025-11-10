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


/**
 * Central validation service for medical order forms
 * Contains validation functions for all steps in the order process
 */

/**
 * Validates the patient details form data
 * @param {Object} data - The patient form data
 * @param {Function} setError - Function to set error messages for specific fields
 * @returns {Boolean} - True if validation passes, false otherwise
 */
export const patientDetailsValidate = (data, setError) => {
    let isValid = true;

    // Helper function to check if field is empty
    const isEmpty = (value) => {
        return value === null || value === undefined || value.toString().trim() === '';
    };

    // Helper function to validate email format
    const isValidEmail = (email) => {
        if (!email) return true; // Email is optional
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Helper function to validate date format
    const isValidDate = (dateString) => {
        if (!dateString) return false;
        const date = new Date(dateString);
        return !isNaN(date.getTime());
    };

    // Helper function to validate phone number
    const isValidPhone = (phone) => {
        if (!phone) return true; // Phone is optional
        // Basic validation for international format: +CountryCode followed by digits
        const phoneRegex = /^\+\d{1,4}[0-9\-\s]{6,}$/;
        return phoneRegex.test(phone);
    };

    // ID Number or Reference ID validation - at least one is required
    const hasIdNumber = !isEmpty(data.id_no);
    const hasReferenceId = !isEmpty(data.reference_id);

    if (!hasIdNumber && !hasReferenceId) {
        setError('id_no', 'Either ID Number or Reference ID is required');
        setError('reference_id', 'Either ID Number or Reference ID is required');
        isValid = false;
    }

    // Required fields validation
    if (isEmpty(data.fullName)) {
        setError('fullName', 'Patient name is required');
        isValid = false;
    } else if (data.fullName.length < 3) {
        setError('fullName', 'Patient name must be at least 3 characters');
        isValid = false;
    }

    if (isEmpty(data.gender)) {
        setError('gender', 'Gender is required');
        isValid = false;
    }

    if (isEmpty(data.dateOfBirth)) {
        setError('dateOfBirth', 'Date of birth is required');
        isValid = false;
    } else if (!isValidDate(data.dateOfBirth)) {
        setError('dateOfBirth', 'Please enter a valid date of birth');
        isValid = false;
    } else {
        // Check if date is in the future
        const dob = new Date(data.dateOfBirth);
        const today = new Date();
        if (dob > today) {
            setError('dateOfBirth', 'Date of birth cannot be in the future');
            isValid = false;
        }
    }

    if (isEmpty(data.consanguineousParents)) {
        setError('consanguineousParents', 'This field is required');
        isValid = false;
    }

    if (!data.nationality || !data.nationality.code) {
        setError('nationality.code', 'Nationality is required');
        isValid = false;
    }

    // Optional fields validation (only if they have values)
    if (data.contact) {
        if (data.contact.email && !isValidEmail(data.contact.email)) {
            setError('contact.email', 'Please enter a valid email address');
            isValid = false;
        }

        if (data.contact.phone && !isValidPhone(data.contact.phone)) {
            setError('contact.phone', 'Please enter a valid phone number with country code');
            isValid = false;
        }
    }

    return isValid;
};
/**
 * Validates the clinical details form data
 * @param {Object} data - The clinical form data containing orderForms array
 * @param {Function} setError - Function to set error messages for specific fields
 * @returns {Boolean} - True if validation passes, false otherwise
 */
export const clinicalDetailsValidate = (data, setError) => {
    let isValid = true;

    // Helper function to check if field is empty
    const isEmpty = (value) => {
        return value === null || value === undefined ||
            (typeof value === 'string' && value.trim() === '');
    };

    // Process each form in the order
    if (!data.orderForms || !Array.isArray(data.orderForms)) {
        setError('orderForms', 'Required clinical details forms are missing');
        return false;
    }

    // Validate each form and its fields
    data.orderForms.forEach((form, formIndex) => {
        if (!form.formData || !Array.isArray(form.formData)) {
            setError(`orderForms[${formIndex}].formData`, 'Form data is missing');
            isValid = false;
            return;
        }

        // Check each field in the form
        form.formData.forEach((field, fieldIndex) => {
            // Skip validation for non-required fields
            if (!field.required) return;

            if (isEmpty(field.value) && field.type!=="description") {
                // Create a path to the specific field for error tracking
                const errorPath = `orderForms[${formIndex}].formData[${fieldIndex}].value`;
                setError(errorPath, `${field.label || 'This field'} is required`);

                // Set an error on the form level for visibility
                setError(`orderForms[${formIndex}].hasErrors`, 'This form has required fields that need to be completed');

                isValid = false;
            }
        });
    });
    // File validation
    if (data.files && Array.isArray(data.files)) {
        data.files.forEach((file, index) => {
            // Skip validation for existing file paths (strings)
            if (typeof file === 'string') {
                if (file.trim() === '') {
                    isValid = false;
                }
                return; // Already uploaded files are valid
            }

            // Only validate new File objects
            if (file instanceof File) {
                // Check if file has valid extension
                const acceptedFileTypes = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
                const fileExtension = file.name.split('.').pop().toLowerCase();

                if (!acceptedFileTypes.includes(fileExtension)) {
                    setError(`files[${index}]`, `File "${file.name}" is not an accepted file type. Please upload only PDF, JPG, PNG, DOC, or DOCX files.`);
                    isValid = false;
                }

                // Check file size (max 10MB)
                const maxSize = 10 * 1024 * 1024; // 10MB in bytes
                if (file.size > maxSize) {
                    setError(`files[${index}]`, `File "${file.name}" exceeds the maximum allowed size of 10MB.`);
                    isValid = false;
                }
            }
        });
    }

    return isValid;
};

/**
 * Validates the sample details form data
 * @param {Object} data - The sample details form data
 * @param {Function} setError - Function to set error messages for specific fields
 * @returns {Boolean} - True if validation passes, false otherwise
 */
export const sampleDetailsValidate = (data, setError) => {
    let isValid = true;

    // Sample validation implementation - update based on your actual schema
    if (!data.samples || !Array.isArray(data.samples) || data.samples.length === 0) {
        setError('samples', 'At least one sample is required');
        isValid = false;
    } else {
        // Validate each sample
        data.samples.forEach((sample, index) => {
            if (!sample.sample_type) {
                setError(`samples[${index}].sample_type`, 'Sample type is required');
                isValid = false;
            }

            if (!sample.collectionDate) {
                setError(`samples[${index}].collectionDate`, 'Collection date is required');
                isValid = false;
            } else {
                // Validate date format
                const date = new Date(sample.collectionDate);
                if (isNaN(date.getTime())) {
                    setError(`samples[${index}].collectionDate`, 'Please enter a valid collection date');
                    isValid = false;
                } else {
                    // Ensure collection date is not in the future
                    const today = new Date();
                    if (date > today) {
                        setError(`samples[${index}].collectionDate`, 'Collection date cannot be in the future');
                        isValid = false;
                    }
                }
            }

            // Validate collection method if required
            if (sample.requiresCollectionMethod && !sample.collectionMethod) {
                setError(`samples[${index}].collectionMethod`, 'Collection method is required for this sample type');
                isValid = false;
            }

            // Validate quantity/volume if required
            if (sample.requiresQuantity && (!sample.quantity || sample.quantity <= 0)) {
                setError(`samples[${index}].quantity`, 'Please enter a valid quantity');
                isValid = false;
            }
        });
    }

    return isValid;
};

/**
 * Validates the consent form data
 * @param {Object} data - The consent form data
 * @param {Function} setError - Function to set error messages for specific fields
 * @returns {Boolean} - True if validation passes, false otherwise
 */
/**
 * Validates the consent form data
 * @param {Object} data - The consent form data
 * @param {Function} setError - Function to set error messages for specific fields
 * @returns {Boolean} - True if validation passes, false otherwise
 */
export const consentFormValidate = (data, setError) => {
    let isValid = true;

    // Check if consent forms exist
    if (!data.consents || !Array.isArray(data.consents) || data.consents.length === 0) {
        setError('consents', 'Consent information is required');
        return false;
    }

    // Validate each consent item
    data.consents.forEach((consent, index) => {
        // Check if consent is acknowledged/signed
        if (!consent.value) {
            setError(`consents[${index}].value`, 'You must agree to this consent item to proceed');
            isValid = false;
        }
    });

    // File validation (if present but not required)
    if (data.consentForm && Array.isArray(data.consentForm) && data.consentForm.length > 0) {
        data.consentForm.forEach((file, index) => {
            // Skip validation for existing file paths (strings)
            if (typeof file === 'string') {
                return; // Already uploaded files are valid
            }

            // Only validate new File objects
            if (file instanceof File) {
                // Check if file has valid extension
                const acceptedFileTypes = ['pdf', 'jpg', 'jpeg', 'png'];
                const fileExtension = file.name.split('.').pop().toLowerCase();

                if (!acceptedFileTypes.includes(fileExtension)) {
                    setError('consentForm', `File "${file.name}" is not an accepted file type. Please upload only PDF, JPG, or PNG files.`);
                    isValid = false;
                }

                // Check file size (max 10MB)
                const maxSize = 10 * 1024 * 1024; // 10MB in bytes
                if (file.size > maxSize) {
                    setError('consentForm', `File "${file.name}" exceeds the maximum allowed size of 10MB.`);
                    isValid = false;
                }
            }
        });
    }

    return isValid;
};

/**
 * Formats consent data before submission
 * @param {Object} data - The consent form data
 * @returns {Object} - Formatted consent data
 */
export const formatConsentData = (data) => {
    // Create a copy of the data to avoid mutating the original
    const formattedData = JSON.parse(JSON.stringify(data));

    // Make sure all consent values are booleans
    if (formattedData.consents && Array.isArray(formattedData.consents)) {
        formattedData.consents = formattedData.consents.map(consent => ({
            ...consent,
            value: !!consent.value // Convert to boolean
        }));
    }

    return formattedData;
};

/**
 * Reset consent form errors
 * @param {Object} data - The consent form data
 * @param {Function} clearErrors - Function to clear errors
 */
export const resetConsentFormErrors = (data, clearErrors) => {
    // Clear global errors
    clearErrors('consents');
    clearErrors('consentForm');

    // Clear specific consent errors
    if (data.consents && Array.isArray(data.consents)) {
        data.consents.forEach((_, index) => {
            clearErrors(`consents[${index}].value`);
        });
    }
};

/**
 * Final validation before order submission
 * @param {Object} data - The complete order data
 * @param {Function} setError - Function to set error messages
 * @returns {Boolean} - True if everything is valid
 */
export const finalizeOrderValidate = (data, setError) => {
    let isValid = true;

    // Check if all required sections are completed

    // 1. Test method validation
    if (!data.tests || !Array.isArray(data.tests) || data.tests.length === 0) {
        setError('tests', 'At least one test must be selected');
        isValid = false;
    }

    // 2. Patient details validation
    if (!data.patient) {
        setError('patient', 'Patient information is required');
        isValid = false;
    } else {
        // Perform a simplified validation to ensure required fields exist
        const patientValid = ['fullName', 'dateOfBirth', 'gender', 'nationality'].every(
            field => data.patient[field] && (typeof data.patient[field] !== 'string' || data.patient[field].trim() !== '')
        );

        if (!patientValid) {
            setError('patient', 'Patient information is incomplete');
            isValid = false;
        }
    }

    // 3. Clinical details validation
    if (!data.orderForms || !Array.isArray(data.orderForms)) {
        setError('orderForms', 'Clinical details are required');
        isValid = false;
    } else {
        // Check if all required fields in forms are filled
        const hasRequiredEmptyFields = data.orderForms.some(form =>
            form.formData && Array.isArray(form.formData) &&
            form.formData.some(field =>
                field.required &&
                (field.value === null || field.value === undefined ||
                    (typeof field.value === 'string' && field.value.trim() === ''))
            )
        );

        if (hasRequiredEmptyFields) {
            setError('orderForms', 'Clinical details forms have incomplete required fields');
            isValid = false;
        }
    }

    // 4. Sample details validation
    if (!data.samples || !Array.isArray(data.samples) || data.samples.length === 0) {
        setError('samples', 'At least one sample is required');
        isValid = false;
    }

    // 5. Consent form validation
    if (!data.consentForms || !Array.isArray(data.consentForms)) {
        setError('consentForms', 'Consent forms are required');
        isValid = false;
    } else {
        // Check if all consent forms are acknowledged
        const allConsentsAcknowledged = data.consentForms.every(form => form.acknowledged);

        if (!allConsentsAcknowledged) {
            setError('consentForms', 'All consent forms must be acknowledged');
            isValid = false;
        }
    }

    return isValid;
};

/**
 * Formats clinical data before submission
 * @param {Object} data - The clinical form data
 * @returns {Object} - Formatted clinical data
 */
export const formatClinicalData = (data) => {
    // Create a deep copy of the data to avoid mutating the original
    const formattedData = JSON.parse(JSON.stringify(data));

    // Process forms and their fields
    if (formattedData.orderForms && Array.isArray(formattedData.orderForms)) {
        formattedData.orderForms.forEach(form => {
            if (form.formData && Array.isArray(form.formData)) {
                form.formData.forEach(field => {
                    // Trim string values
                    if (typeof field.value === 'string') {
                        field.value = field.value.trim();
                    }

                    // Convert string representations of numbers to actual numbers if needed
                    if (field.type === 'number' && field.value !== null && field.value !== '') {
                        field.value = Number(field.value);
                    }

                    // Format dates if needed
                    if (field.type === 'date' && field.value) {
                        // Ensure consistent date format (ISO format)
                        const date = new Date(field.value);
                        if (!isNaN(date.getTime())) {
                            field.value = date.toISOString().split('T')[0];
                        }
                    }

                    // Convert checkbox values to boolean if needed
                    if (field.type === 'checkbox' && field.value !== null) {
                        field.value = !!field.value;
                    }
                });
            }
        });
    }

    return formattedData;
};

/**
 * Formats patient data before submission
 * @param {Object} data - The patient form data
 * @returns {Object} - Formatted patient data
 */
export const formatPatientData = (data) => {
    // Create a copy of the data to avoid mutating the original
    const formattedData = { ...data };

    // Trim string values
    Object.keys(formattedData).forEach(key => {
        if (typeof formattedData[key] === 'string') {
            formattedData[key] = formattedData[key].trim();
        }
    });

    // Format date if needed
    if (formattedData.dateOfBirth) {
        // Ensure consistent date format (ISO format)
        const date = new Date(formattedData.dateOfBirth);
        if (!isNaN(date.getTime())) {
            formattedData.dateOfBirth = date.toISOString().split('T')[0];
        }
    }

    // Ensure consanguineousParents is stored as a number or string as expected by the API
    if (formattedData.consanguineousParents !== undefined) {
        formattedData.consanguineousParents = formattedData.consanguineousParents.toString();
    }

    return formattedData;
};

/**
 * Reset patient form errors
 * @param {Function} clearErrors - Function to clear errors
 */
export const resetPatientFormErrors = (clearErrors) => {
    [
        'fullName',
        'gender',
        'dateOfBirth',
        'consanguineousParents',
        'nationality.code',
        'contact.email',
        'contact.phone'
    ].forEach(field => clearErrors(field));
};

/**
 * Reset clinical form errors
 * @param {Object} data - The clinical form data
 * @param {Function} clearErrors - Function to clear errors
 */
export const resetClinicalFormErrors = (data, clearErrors) => {
    // Clear global errors
    clearErrors('orderForms');
    clearErrors('files');

    // Clear specific form errors
    if (data.orderForms && Array.isArray(data.orderForms)) {
        data.orderForms.forEach((form, formIndex) => {
            clearErrors(`orderForms[${formIndex}].hasErrors`);

            if (form.formData && Array.isArray(form.formData)) {
                form.formData.forEach((field, fieldIndex) => {
                    clearErrors(`orderForms[${formIndex}].formData[${fieldIndex}].value`);
                });
            }
        });
    }

    // Clear file errors
    if (data.files && Array.isArray(data.files)) {
        data.files.forEach((_, index) => {
            clearErrors(`files[${index}]`);
        });
    }
};

/**
 * Check if a particular form has any required fields that are empty
 * @param {Object} form - The form object
 * @returns {Boolean} - True if form has incomplete required fields
 */
export const hasIncompleteRequiredFields = (form) => {
    if (!form.formData || !Array.isArray(form.formData)) {
        return false;
    }

    return form.formData.some(field =>
        field.required &&
        (field.value === null || field.value === undefined ||
            (typeof field.value === 'string' && field.value.trim() === ''))
    );
};

/**
 * Calculate completion percentage for a form
 * @param {Object} form - The form object
 * @returns {Number} - Percentage of completed fields
 */
export const calculateFormCompletion = (form) => {
    if (!form.formData || !Array.isArray(form.formData) || form.formData.length === 0) {
        return 100;
    }

    const totalFields = form.formData.length;
    const filledFields = form.formData.filter(field => {
        if (field.value === null || field.value === undefined) return field.type==="description";
        return !(typeof field.value === 'string' && field.value.trim() === '') || field.type==="description";
    }).length;

    return Math.round((filledFields / totalFields) * 100);
};

/**
 * Formats sample data before submission
 * @param {Object} data - The sample form data
 * @returns {Object} - Formatted sample data
 */
export const formatSampleData = (data) => {
    // Create a deep copy of the data to avoid mutating the original
    const formattedData = JSON.parse(JSON.stringify(data));

    // Process each sample
    if (formattedData.samples && Array.isArray(formattedData.samples)) {
        formattedData.samples.forEach(sample => {
            // Trim string values
            Object.keys(sample).forEach(key => {
                if (typeof sample[key] === 'string') {
                    sample[key] = sample[key].trim();
                }
            });

            // Format dates if needed
            if (sample.collectionDate) {
                const date = new Date(sample.collectionDate);
                if (!isNaN(date.getTime())) {
                    sample.collectionDate = date.toISOString().split('T')[0];
                }
            }

            // Format time if provided
            if (sample.collectionTime) {
                // Optional - Add time formatting logic here if needed
                // For example, ensuring consistent 24-hour format
            }

            // Convert numeric fields if needed
            if (sample.quantity && !isNaN(sample.quantity)) {
                // Optional - Format quantity as needed
                // For example, convert to a number if it's numeric
            }
        });
    }

    return formattedData;
};

/**
 * Reset sample form errors
 * @param {Object} data - The sample form data
 * @param {Function} clearErrors - Function to clear errors
 */
export const resetSampleFormErrors = (data, clearErrors) => {
    // Clear global errors
    clearErrors('samples');

    // Clear both bracket notation and dot notation errors for compatibility
    if (data.samples && Array.isArray(data.samples)) {
        data.samples.forEach((_, index) => {
            // Clear bracket notation errors
            clearErrors(`samples[${index}].sample_type`);
            clearErrors(`samples[${index}].sampleId`);
            clearErrors(`samples[${index}].collectionDate`);
            clearErrors(`samples[${index}].notes`);
            clearErrors(`samples[${index}].hasErrors`);
            clearErrors(`samples[${index}]`);

            // Clear dot notation errors for backward compatibility
            clearErrors(`samples.${index}.sample_type`);
            clearErrors(`samples.${index}.sampleId`);
            clearErrors(`samples.${index}.collectionDate`);
            clearErrors(`samples.${index}.notes`);
            clearErrors(`samples.${index}.hasErrors`);
            clearErrors(`samples.${index}`);
        });
    }
};

/**
 * Comprehensive validation for the complete order before final submission
 * @param {Object} data - The complete order data
 * @param {Function} setError - Function to set error messages
 * @returns {Boolean} - True if all validations pass
 */
export const validateFullOrder = (data, setError) => {
    let isValid = true;

    // 1. Tests validation
    if (!data.tests || !Array.isArray(data.tests) || data.tests.length === 0) {
        setError('tests', 'At least one test must be selected');
        isValid = false;
    } else {
        // Check if each test has required fields
        data.tests.forEach((test, index) => {
            if (!test.id && !test.name) {
                setError(`tests[${index}]`, 'Test information is incomplete');
                isValid = false;
            }
        });
    }

    // 2. Patient details validation
    if (!data.patient) {
        setError('patient', 'Patient information is required');
        isValid = false;
    } else {
        // Check required patient fields
        const requiredPatientFields = [
            { field: 'fullName', message: 'Patient name is required' },
            { field: 'dateOfBirth', message: 'Date of birth is required' },
            { field: 'gender', message: 'Gender is required' }
        ];

        requiredPatientFields.forEach(({ field, message }) => {
            if (!data.patient[field]) {
                setError(`patient.${field}`, message);
                isValid = false;
            }
        });

        // Check nationality
        if (!data.patient.nationality || !data.patient.nationality.code) {
            setError('patient.nationality.code', 'Nationality is required');
            isValid = false;
        }

        // Check consanguineous parents
        if (data.patient.consanguineousParents === undefined ||
            data.patient.consanguineousParents === null) {
            setError('patient.consanguineousParents', 'This field is required');
            isValid = false;
        }

        // Validate email format if provided
        if (data.patient.contact && data.patient.contact.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.patient.contact.email)) {
                setError('patient.contact.email', 'Please enter a valid email address');
                isValid = false;
            }
        }

        // Validate phone format if provided
        if (data.patient.contact && data.patient.contact.phone) {
            const phoneRegex = /^\+\d{1,4}[0-9\-\s]{6,}$/;
            if (!phoneRegex.test(data.patient.contact.phone)) {
                setError('patient.contact.phone', 'Please enter a valid phone number with country code');
                isValid = false;
            }
        }
    }

    // 3. Clinical details validation
    if (!data.orderForms || !Array.isArray(data.orderForms) || data.orderForms.length === 0) {
        setError('orderForms', 'Clinical details are required');
        isValid = false;
    } else {
        // Check for required fields in each form
        data.orderForms.forEach((form, formIndex) => {
            if (!form.formData || !Array.isArray(form.formData)) {
                setError(`orderForms[${formIndex}].formData`, 'Form data is missing');
                isValid = false;
                return;
            }

            // Check required fields in this form
            form.formData.forEach((field, fieldIndex) => {
                if (field.required && (!field.value && field.value !== 0 && field.value !== false)) {
                    setError(`orderForms[${formIndex}].formData[${fieldIndex}].value`,
                        `${field.label || 'This field'} is required`);

                    // Set form-level error for visibility
                    setError(`orderForms[${formIndex}].hasErrors`,
                        'This form has required fields that need to be completed');

                    isValid = false;
                }
            });
        });
    }

    // 4. Sample details validation
    if (!data.samples || !Array.isArray(data.samples) || data.samples.length === 0) {
        setError('samples', 'At least one sample is required');
        isValid = false;
    } else {
        // Validate each sample
        data.samples.forEach((sample, index) => {
            // Check for required sample type
            if (!sample.sample_type) {
                setError(`samples[${index}].sample_type`, 'Sample type is required');
                isValid = false;
            }

            // Check for required sample ID if this type requires it
            if (sample.sample_type?.sampleIdRequired && !sample.sampleId) {
                setError(`samples[${index}].sampleId`, 'Sample ID is required for this sample type');
                isValid = false;
            }

            // Check for required collection date
            if (!sample.collectionDate) {
                setError(`samples[${index}].collectionDate`, 'Collection date is required');
                isValid = false;
            } else {
                // Validate date format and logic
                const collectionDate = new Date(sample.collectionDate);
                if (isNaN(collectionDate.getTime())) {
                    setError(`samples[${index}].collectionDate`, 'Invalid date format');
                    isValid = false;
                } else {
                    // Check if date is in the future
                    const today = new Date();
                    if (collectionDate > today) {
                        setError(`samples[${index}].collectionDate`, 'Collection date cannot be in the future');
                        isValid = false;
                    }
                }
            }

            // Set sample-level error if any field in this sample has errors
            if (!isValid) {
                setError(`samples[${index}].hasErrors`, 'This sample has errors that need to be fixed');
            }
        });
    }

    // 5. Consent validation
    if (!data.consents || !Array.isArray(data.consents) || data.consents.length === 0) {
        // Only set error if consents is expected but missing
        // Check if we have any consent items that should be validated
        const hasConsentItems = data.consents && Array.isArray(data.consents) && data.consents.some(consent =>
            consent.title || consent.description
        );

        if (hasConsentItems) {
            setError('consents', 'Consent agreements are required');
            isValid = false;
        }
    } else {
        // Only validate consents that have title/description (actual consent items)
        const consentItems = data.consents.filter(consent => consent.title || consent.description);

        // Check that all consents are agreed to
        consentItems.forEach((consent, index) => {
            console.log(consent);
            if (consent.title && consent.value !== true) {
                setError(`consents[${index}].value`, 'You must agree to this consent item to proceed');
                isValid = false;
            }
        });
    }

    // 6. File validation (if any uploaded files)
    // Check for any file arrays in the data object
    ['files', 'consentForm'].forEach(fileField => {
        if (data[fileField] && Array.isArray(data[fileField]) && data[fileField].length > 0) {
            // Validate each file
            data[fileField].forEach((file, index) => {
                if (typeof file ==='string' && file.length > 0) {
                    return
                }
                // Check file type
                const acceptedFileTypes = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
                const fileExtension = file.name.split('.').pop().toLowerCase();

                if (!acceptedFileTypes.includes(fileExtension)) {
                    setError(`${fileField}[${index}]`,
                        `File "${file.name}" is not an accepted file type. Please upload only PDF, JPG, PNG, DOC, or DOCX files.`);
                    isValid = false;
                }

                // Check file size (max 10MB)
                const maxSize = 10 * 1024 * 1024; // 10MB
                if (file.size > maxSize) {
                    setError(`${fileField}[${index}]`,
                        `File "${file.name}" exceeds the maximum allowed size of 10MB.`);
                    isValid = false;
                }
            });
        }
    });

    return isValid;
};

/**
 * Comprehensive formatting for the complete order data before submission
 * @param {Object} data - The complete order data
 * @returns {Object} - Formatted order data ready for submission
 */
export const formatOrderData = (data) => {
    // Create a deep copy to avoid mutating the original data
    const formattedData = JSON.parse(JSON.stringify(data));

    // 1. Format tests data
    if (formattedData.tests && Array.isArray(formattedData.tests)) {
        formattedData.tests = formattedData.tests.map(test => {
            // Ensure test IDs are properly formatted (e.g., as numbers if needed)
            if (test.id && !isNaN(test.id)) {
                test.id = Number(test.id);
            }
            return test;
        });
    }

    // 2. Format patient data
    if (formattedData.patient) {
        // Trim string values
        Object.keys(formattedData.patient).forEach(key => {
            if (typeof formattedData.patient[key] === 'string') {
                formattedData.patient[key] = formattedData.patient[key].trim();
            }
        });

        // Format date of birth
        if (formattedData.patient.dateOfBirth) {
            const dob = new Date(formattedData.patient.dateOfBirth);
            if (!isNaN(dob.getTime())) {
                formattedData.patient.dateOfBirth = dob.toISOString().split('T')[0]; // YYYY-MM-DD
            }
        }

        // Format consanguineousParents as expected by the API (string or number)
        if (formattedData.patient.consanguineousParents !== undefined) {
            formattedData.patient.consanguineousParents =
                formattedData.patient.consanguineousParents.toString();
        }

        // Format contact information
        if (formattedData.patient.contact) {
            Object.keys(formattedData.patient.contact).forEach(key => {
                if (typeof formattedData.patient.contact[key] === 'string') {
                    formattedData.patient.contact[key] = formattedData.patient.contact[key].trim();
                }
            });
        }
    }

    // 3. Format clinical forms data
    if (formattedData.orderForms && Array.isArray(formattedData.orderForms)) {
        formattedData.orderForms.forEach(form => {
            if (form.formData && Array.isArray(form.formData)) {
                form.formData.forEach(field => {
                    // Trim string values
                    if (typeof field.value === 'string') {
                        field.value = field.value.trim();
                    }

                    // Convert numeric strings to numbers
                    if (field.type === 'number' && field.value !== null && field.value !== '') {
                        field.value = Number(field.value);
                    }

                    // Format dates
                    if (field.type === 'date' && field.value) {
                        const date = new Date(field.value);
                        if (!isNaN(date.getTime())) {
                            field.value = date.toISOString().split('T')[0]; // YYYY-MM-DD
                        }
                    }

                    // Ensure boolean values for checkboxes
                    if (field.type === 'checkbox' || field.type === 'switch') {
                        field.value = !!field.value; // Convert to boolean
                    }
                });
            }
        });
    }

    // 4. Format sample data
    if (formattedData.samples && Array.isArray(formattedData.samples)) {
        formattedData.samples.forEach(sample => {
            // Trim string values
            Object.keys(sample).forEach(key => {
                if (typeof sample[key] === 'string') {
                    sample[key] = sample[key].trim();
                }
            });

            // Format collection date
            if (sample.collectionDate) {
                const date = new Date(sample.collectionDate);
                if (!isNaN(date.getTime())) {
                    sample.collectionDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
                }
            }

            // Ensure sample IDs are in the correct format
            if (sample.sampleId && !isNaN(sample.sampleId) && typeof sample.sampleId !== 'number') {
                // If the API expects numeric sample IDs, convert string to number
                sample.sampleId = Number(sample.sampleId);
            }

            // If sample has a sample_type that's just an ID, ensure it's properly formatted
            if (sample.sample_type && typeof sample.sample_type === 'string' && !isNaN(sample.sample_type)) {
                sample.sample_type = Number(sample.sample_type);
            }
        });
    }

    // 5. Format consent data
    if (formattedData.consents && Array.isArray(formattedData.consents)) {
        formattedData.consents = formattedData.consents.map(consent => ({
            ...consent,
            value: !!consent.value // Ensure boolean values
        }));
    }

    // 6. Additional order status or metadata
    if (formattedData.status) {
        formattedData.status = formattedData.status.trim().toLowerCase();
    }

    // 7. Set submission timestamp
    formattedData.submittedAt = new Date().toISOString();

    // Remove any temporary properties used for UI purposes but not needed for API
    delete formattedData.validationError;
    delete formattedData.tempData;

    return formattedData;
};
