import React, { useState, useEffect } from "react";
import { useSubmitForm } from "@/Services/api";
import EditLayout from "../EditLayout";
import SampleDetailsForm from "../Components/SampleDetailsForm";
import { Box, Alert, Typography } from "@mui/material";
import { sampleDetailsValidate, formatSampleData, resetSampleFormErrors } from "@/Services/validate";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Enhanced SampleDetails component with validation integration
 *
 * @param {Object} props Component props
 * @param {Object} props.auth Authentication information
 * @param {Object} props.order Order data
 * @param {string|number} props.step Current step in the process
 * @param {Array} props.sampleTypes Available sample types
 * @returns {JSX.Element} Rendered component
 */
const SampleDetails = ({ auth, order, step, sampleTypes }) => {
    // Initialize form with existing samples or an empty sample
    const initialData = {
        ...order,
        samples: order.samples.length ? order.samples : [
            {
                sample_type: null,
                sampleId: "",
                collectionDate: "",
                notes: ""
            }
        ],
        _method: "put"
    };

    // State for success message
    const [showSuccess, setShowSuccess] = useState(false);

    // Use the form submission hook
    const {
        data,
        setData,
        submit,
        errors,
        setError,
        clearErrors,
        processing,
    } = useSubmitForm(
        initialData,
        route("orders.update", { order: order.id, step })
    );

    // Effect to scroll to the first error message if there are any
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            const firstErrorKey = Object.keys(errors)[0];
            let elementId;

            // Handle different error formats
            if (firstErrorKey.includes('[')) {
                // Handle bracket notation format like samples[0].type
                const match = firstErrorKey.match(/^([^[]+)\[(\d+)\]\.(.+)$/);
                if (match) {
                    elementId = `field-${match[1]}.${match[2]}`;
                }
            } else if (firstErrorKey.includes('.')) {
                // Handle dot notation format like samples.0.type
                elementId = `field-${firstErrorKey.split('.')[0]}.${firstErrorKey.split('.')[1]}`;
            } else {
                elementId = `field-${firstErrorKey}`;
            }

            const element = document.getElementById(elementId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [errors]);

    /**
     * Updates form data when fields change
     * @param {string} key Field name
     * @param {any} value Field value
     */
    const handleChange = (key, value) => {
        setData(previousData => ({ ...previousData, [key]: value }));

        // Clear the specific error when the field is changed
        if (errors[key]) {
            clearErrors(key);
        }

        // For nested fields in samples array, clear those errors too
        if (key === 'samples') {
            // Clear all sample-related errors
            Object.keys(errors).forEach(errorKey => {
                if (errorKey.startsWith('samples[') || errorKey.startsWith('samples.')) {
                    clearErrors(errorKey);
                }
            });
        }

        // Hide success message when form changes
        if (showSuccess) {
            setShowSuccess(false);
        }
    };

    /**
     * Handle form submission with validation
     */
    const handleSubmit = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // Reset all form errors
        resetSampleFormErrors(data, clearErrors);

        // Validate the sample data
        if (sampleDetailsValidate(data, setError)) {

            // Submit form
            submit({
                onSuccess: () => {
                    // Show success message
                    setShowSuccess(true);

                    // Auto-hide success message after 3 seconds
                    setTimeout(() => {
                        setShowSuccess(false);
                    }, 3000);
                }
            });
        }
    };

    return (
        <EditLayout
            step={step}
            auth={auth}
            id={order.id}
            onSubmit={handleSubmit}
            isSubmitting={processing}
        >
            {/* Success message */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Alert
                            severity="success"
                            sx={{
                                mb: 3,
                                borderRadius: 2,
                                '& .MuiAlert-icon': {
                                    alignItems: 'center'
                                }
                            }}
                            onClose={() => setShowSuccess(false)}
                        >
                            Sample details saved successfully.
                        </Alert>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Render the actual form component */}
            <SampleDetailsForm
                samples={data.samples}
                onChange={handleChange}
                onSubmit={handleSubmit}
                sampleTypes={sampleTypes}
                errors={errors}
                user={auth.user.id}
                setError={setError}
                clearErrors={clearErrors}
                disabled={processing}
            />
        </EditLayout>
    );
};

export default SampleDetails;
