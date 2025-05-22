import React, { useState } from "react";
import { useSubmitForm } from "@/Services/api";
import EditLayout from "@/Pages/Order/EditLayout";
import ClinicalDetailsForm from "../Components/ClinicalDetailsForm";
import { clinicalDetailsValidate, formatClinicalData, resetClinicalFormErrors } from "@/Services/validate";
import { Alert } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";

const ClinicalDetails = ({ auth, order, step, forms = [] }) => {
    const {
        data,
        setData,
        submit,
        errors,
        setError,
        clearErrors,
        processing
    } = useSubmitForm(
        { ...order, _method: "put" },
        route("orders.update", { order: order.id, step })
    );

    const [showSuccess, setShowSuccess] = useState(false);

    // Handle field changes
    const handleChange = (key, value) => {
        setData(previousData => ({ ...previousData, [key]: value }));

        // Clear error for this field if it exists
        if (errors[key]) {
            clearErrors(key);
        }

        // Hide success message when form changes
        if (showSuccess) {
            setShowSuccess(false);
        }
    };

    // Handle file changes
    const handleFileChange = (name, files) => {
        setData(name, files);

        // Clear errors related to files
        if (errors[name]) {
            clearErrors(name);
        }

        // Hide success message when files change
        if (showSuccess) {
            setShowSuccess(false);
        }
    };

    // Submit form with validation
    const handleSubmit = (e) => {
        // Reset all form errors
        resetClinicalFormErrors(data, clearErrors);

        // Validate form data
        if (clinicalDetailsValidate(data, setError)) {
            // Format data before submission
            const formattedData = formatClinicalData(data);

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
            auth={auth}
            step={step}
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
                            sx={{ mb: 3, borderRadius: 2 }}
                            onClose={() => setShowSuccess(false)}
                        >
                            Clinical information saved successfully.
                        </Alert>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Clinical details form */}
            <ClinicalDetailsForm
                orderForms={data.orderForms || []}
                files={data.files}
                onChange={handleChange}
                onSubmit={handleSubmit}
                id={order.id}
                errors={errors}
                onFileChanged={handleFileChange}
            />
        </EditLayout>
    );
};

export default ClinicalDetails;
