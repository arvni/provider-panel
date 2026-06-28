/**
 * Pure validation for the order Finalize step. Extracted from Finalize.jsx so
 * the (non-trivial) rules can be unit-tested without rendering the page.
 *
 * Mirrors the original `validateFullOrderWithProcessedConsents`: it records
 * field errors via the supplied `setError(key, message)` callback and returns
 * whether the order is valid overall.
 *
 * @param {Object} processedData Order data with consents already normalized.
 * @param {(key: string, message: string) => void} setError
 * @returns {boolean} true when the order passes validation.
 */
export function validateFullOrder(processedData, setError) {
    let isValid = true;

    // 1. Tests
    if (!processedData.tests || !Array.isArray(processedData.tests) || processedData.tests.length === 0) {
        setError("tests", "At least one test must be selected");
        isValid = false;
    }

    // 2. Patient details
    if (!processedData.patient) {
        setError("patient", "Patient information is required");
        isValid = false;
    } else {
        const requiredPatientFields = [
            { field: "fullName", message: "Patient name is required" },
            { field: "dateOfBirth", message: "Date of birth is required" },
            { field: "gender", message: "Gender is required" },
        ];

        requiredPatientFields.forEach(({ field, message }) => {
            if (!processedData.patient[field]) {
                setError(`patient.${field}`, message);
                isValid = false;
            }
        });
    }

    // 3. Clinical details
    if (!processedData.orderForms || !Array.isArray(processedData.orderForms)) {
        setError("orderForms", "Clinical details are required");
        isValid = processedData.orderForms.length === 0;
    } else {
        processedData.orderForms.forEach((form, formIndex) => {
            if (form.formData && Array.isArray(form.formData)) {
                form.formData.forEach((field, fieldIndex) => {
                    if (
                        field.required &&
                        !field.value &&
                        field.value !== 0 &&
                        field.value !== false &&
                        field.type !== "description"
                    ) {
                        setError(
                            `orderForms[${formIndex}].formData[${fieldIndex}].value`,
                            `${field.label || "This field"} is required`,
                        );
                        setError(
                            `orderForms[${formIndex}].hasErrors`,
                            "This form has required fields that need to be completed",
                        );
                        isValid = field.type !== "description";
                    }
                });
            }
        });
    }

    // 4. Sample details
    if (!processedData.samples || !Array.isArray(processedData.samples) || processedData.samples.length === 0) {
        setError("samples", "At least one sample is required");
        isValid = false;
    }

    // 5. Consent (already-normalized data)
    if (processedData.consents && processedData.consents.length > 0) {
        processedData.consents.forEach((consent, index) => {
            if (consent.title && !consent.value) {
                setError(`consents[${index}].value`, "You must agree to this consent item to proceed");
                isValid = false;
            }
        });
    } else {
        setError("consents", "Consent information is required");
        isValid = false;
    }

    return isValid;
}
