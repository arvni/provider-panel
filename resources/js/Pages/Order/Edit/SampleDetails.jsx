import React, { useEffect } from "react";
import { useSubmitForm } from "@/Services/api";
import EditLayout from "../EditLayout";
import SampleDetailsForm from "../Components/SampleDetailsForm";
import { Box, Paper, Typography, Button, LinearProgress, Alert } from "@mui/material";
import { Save, ArrowForward } from "@mui/icons-material";

/**
 * SampleDetails component for managing sample information in an order
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
        samples: order.samples.length ? order.samples : [{}],
        _method: "put"
    };

    // Use the form submission hook
    const {
        data,
        setData,
        submit,
        errors,
        setError,
        clearErrors,
        processing,
        recentlySuccessful,
    } = useSubmitForm(
        initialData,
        route("orders.update", { order: order.id, step })
    );

    // Effect to scroll to the first error message if there are any
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            const firstErrorKey = Object.keys(errors)[0];
            const element = document.getElementById(`field-${firstErrorKey}`);
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
    };

    /**
     * Handle form submission with validation
     */
    const handleSubmit = () => {
        // Basic validation before submission
        let hasValidationErrors = false;

        // Check if samples exist and have required fields
        if (!data.samples || data.samples.length === 0) {
            setError('samples', 'At least one sample is required');
            hasValidationErrors = true;
        } else {
            // Validate each sample if needed
            // Additional validation can be added here
        }

        if (!hasValidationErrors) {
            submit();
        }
    };

    /**
     * Save as draft functionality
     */
    const saveAsDraft = () => {
        setData(previousData => ({ ...previousData, status: 'draft' }));
        submit();
    };

    return (
        <EditLayout step={step} auth={auth} id={order.id}>
            <Paper
                elevation={0}
                variant="outlined"
                sx={{
                    p: 3,
                    mb: 2,
                    borderRadius: 2,
                    position: 'relative'
                }}
            >
                {/* Show loading indicator during form submission */}
                {processing && (
                    <LinearProgress
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            borderTopLeftRadius: 8,
                            borderTopRightRadius: 8
                        }}
                    />
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" component="h1" fontWeight="500">
                        Sample Details
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontStyle: 'italic' }}
                    >
                        Order ID: {order.id}
                    </Typography>
                </Box>

                {/* Success message */}
                {recentlySuccessful && (
                    <Alert
                        severity="success"
                        sx={{ mb: 3 }}
                    >
                        Sample details have been successfully saved.
                    </Alert>
                )}

                {/* General error message if any */}
                {errors.general && (
                    <Alert
                        severity="error"
                        sx={{ mb: 3 }}
                    >
                        {errors.general}
                    </Alert>
                )}

                {/* Render the actual form component */}
                <SampleDetailsForm
                    samples={data.samples ?? [{}]}
                    onChange={handleChange}
                    onSubmit={handleSubmit}
                    sampleTypes={sampleTypes}
                    errors={errors}
                    user={auth.user.id}
                    setError={setError}
                    clearErrors={clearErrors}
                    disabled={processing}
                />

                {/* Action buttons */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mt: 4,
                        pt: 3,
                        borderTop: '1px solid',
                        borderColor: 'divider'
                    }}
                >
                    <Button
                        variant="outlined"
                        startIcon={<Save />}
                        onClick={saveAsDraft}
                        disabled={processing}
                    >
                        Save as Draft
                    </Button>

                    <Button
                        variant="contained"
                        endIcon={<ArrowForward />}
                        onClick={handleSubmit}
                        disabled={processing}
                        color="primary"
                    >
                        Save and Continue
                    </Button>
                </Box>
            </Paper>
        </EditLayout>
    );
};

export default SampleDetails;
