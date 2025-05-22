import React, { useState } from "react";
import { useSubmitForm } from "@/Services/api";
import PatientDetailsForm from "../Components/PatientDetailsForm";
import EditLayout from "../EditLayout";
import { patientDetailsValidate } from "@/Services/validate";
import {
    Alert,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import PatientList  from "../Components/PatientList.jsx";

/**
 * Enhanced PatientDetails component with improved layout and user experience
 */
const PatientDetails = ({ auth, order, step, genders }) => {
    // Form state management
    const {
        data,
        setData,
        submit,
        errors,
        setError,
        clearErrors,
        processing
    } = useSubmitForm(
        { ...order.patient, _method: "put" },
        route("orders.update", { order: order.id, step })
    );

    const [openPatientList, setOpenPatientList] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Handle field changes
    const handleChange = (key, value) => {
        setData(previousData => ({ ...previousData, [key]: value }));

        // Clear error for this field
        if (errors[key]) {
            clearErrors(key);
        }

        // Hide success message when form changes
        if (showSuccess) {
            setShowSuccess(false);
        }
    };

    // Submit form with validation
    const handleSubmit = () => {
        clearErrors();

        if (patientDetailsValidate(data, setError)) {
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
        console.log(errors);
    };

    // Patient list dialog handlers
    const handlePatientListOpen = () => {
        setOpenPatientList(true);
    };

    const handlePatientListClose = () => {
        setOpenPatientList(false);
    };

    // Handle patient selection from list
    const handlePatientSelect = (patient) => {
        setData({ ...patient, _method: "put" });
        handlePatientListClose();

        // Show success message
        setShowSuccess(true);
        setTimeout(() => {
            setShowSuccess(false);
        }, 3000);
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
                            Patient information saved successfully.
                        </Alert>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Patient details form */}
            <PatientDetailsForm
                patient={data}
                genders={genders}
                onChange={handleChange}
                onSubmit={handleSubmit}
                errors={errors}
                handlePatientListOpen={handlePatientListOpen}
            />

            {/* Patient list dialog */}
            <PatientList
                open={openPatientList}
                onClose={handlePatientListClose}
                onSelect={handlePatientSelect}
            />
        </EditLayout>
    );
};

export default PatientDetails;
