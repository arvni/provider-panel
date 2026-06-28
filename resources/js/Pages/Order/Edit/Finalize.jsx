import React, { useState } from "react";
import { useSubmitForm } from "@/Services/api";
import EditLayout from "@/Pages/Order/EditLayout";
import {
    Alert,
    Box,
    Button,
    Chip,
    IconButton,
    Paper,
    Tooltip,
    Typography,
    useTheme,
    alpha,
} from "@mui/material";
import {
    CheckCircle,
    Send,
    Help as HelpIcon,
    DoneAll as DoneAllIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { processConsentData } from "@/Pages/Order/Components/orderDisplay";
import { containerVariants, itemVariants } from "@/Pages/Order/Components/orderMotion";
import { validateFullOrder } from "@/Pages/Order/Components/finalizeValidation";
import FinalizeAlerts from "@/Pages/Order/Components/Finalize/FinalizeAlerts";
import TestsSection from "@/Pages/Order/Components/Finalize/TestsSection";
import PatientDetailsSection from "@/Pages/Order/Components/Finalize/PatientDetailsSection";
import AllPatientsSection from "@/Pages/Order/Components/Finalize/AllPatientsSection";
import PatientTestAssignmentSection from "@/Pages/Order/Components/Finalize/PatientTestAssignmentSection";
import SampleDetailsSection from "@/Pages/Order/Components/Finalize/SampleDetailsSection";
import ClinicalDetailsSection from "@/Pages/Order/Components/Finalize/ClinicalDetailsSection";
import ConsentSection from "@/Pages/Order/Components/Finalize/ConsentSection";
import ConfirmSubmitDialog from "@/Pages/Order/Components/Finalize/ConfirmSubmitDialog";

/**
 * Finalize page for reviewing and submitting an order. This component owns the
 * form state, validation and submission flow; each review section is rendered
 * by a focused component in Components/Finalize/*.
 *
 * @param {Object} props
 * @param {Object} props.auth Authentication information
 * @param {Object} props.order Order data
 * @param {string|number} props.step Current step in the process
 * @param {Array} props.patients All patients in the order
 */
const Finalize = ({ auth, order, step, patients = [] }) => {
    const theme = useTheme();

    // State for expanded sections
    const [expandedSections, setExpandedSections] = useState({
        tests: true,
        patient: true,
        allPatients: patients.length > 1, // Expand if multiple patients
        patientTestAssignment: true,
        samples: true,
        forms: true,
        consent: true,
    });

    const [showHelp, setShowHelp] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    // Setup form with existing data
    const { data, submit, errors, setError, clearErrors, processing } = useSubmitForm(
        { ...order, _method: "put", status: "requested" },
        route("orders.update", { order: order.id, step })
    );

    // Normalize consent data (shared with Show.jsx)
    const { restConsents, consentForm } = processConsentData(data.consents);

    /**
     * Handle form submission with validation
     */
    const handleSubmit = () => {
        // Show confirmation dialog
        setShowConfirmDialog(true);
    };

    /**
     * Handle confirmed submission
     */
    const handleConfirmedSubmit = () => {
        // Close dialog
        setShowConfirmDialog(false);

        // Reset all previous errors
        Object.keys(errors).forEach((key) => clearErrors(key));

        // Create processed data with normalized consent structure
        const processedData = {
            ...data,
            consents: restConsents,
            consentForm: consentForm,
        };

        // Validate the entire order with processed data
        if (validateFullOrder(processedData, setError)) {
            // Submit the order
            submit({
                onSuccess: () => {
                    // Show success message
                    setShowSuccess(true);

                    // Redirect to order confirmation page after successful submission (optional)
                    setTimeout(() => {
                        window.location.href = route("orders.index");
                    }, 5000);
                },
            });
        } else {
            // Expand sections with errors for better visibility
            const sectionsWithErrors = {
                tests: Object.keys(errors).some((key) => key.startsWith("tests")),
                patient: Object.keys(errors).some((key) => key.startsWith("patient")),
                samples: Object.keys(errors).some((key) => key.startsWith("samples")),
                forms: Object.keys(errors).some((key) => key.startsWith("orderForms")),
                consent: Object.keys(errors).some((key) => key.startsWith("consents")),
            };

            setExpandedSections((prev) => ({
                ...prev,
                ...Object.entries(sectionsWithErrors)
                    .filter(([_, hasError]) => hasError)
                    .reduce((acc, [section]) => ({ ...acc, [section]: true }), {}),
            }));
        }
    };

    /**
     * Toggle section expansion
     */
    const toggleSection = (section) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    /**
     * Toggle help information
     */
    const toggleHelp = () => {
        setShowHelp(!showHelp);
    };

    /**
     * Check if a section has any errors
     */
    const hasSectionErrors = (section) => {
        const errorKeyMappings = {
            tests: "tests",
            patient: "patient",
            samples: "samples",
            forms: "orderForms",
            consent: "consents",
        };

        const errorPrefix = errorKeyMappings[section];
        return errorPrefix && Object.keys(errors).some((key) => key.startsWith(errorPrefix));
    };

    /**
     * Get section status - works with processed consent data
     */
    const getSectionStatus = (section) => {
        if (hasSectionErrors(section)) {
            return { color: "error", label: "Errors", icon: <ErrorIcon fontSize="small" /> };
        }

        // Define completion criteria for each section
        switch (section) {
            case "tests":
                return data.tests && data.tests.length > 0
                    ? {
                          color: "success",
                          label: "Complete",
                          icon: <CheckCircle fontSize="small" />,
                      }
                    : {
                          color: "warning",
                          label: "Incomplete",
                          icon: <WarningIcon fontSize="small" />,
                      };

            case "patient": {
                const patientComplete =
                    data.patient &&
                    data.patient.fullName &&
                    data.patient.dateOfBirth &&
                    data.patient.gender;
                return patientComplete
                    ? {
                          color: "success",
                          label: "Complete",
                          icon: <CheckCircle fontSize="small" />,
                      }
                    : {
                          color: "warning",
                          label: "Incomplete",
                          icon: <WarningIcon fontSize="small" />,
                      };
            }

            case "samples": {
                const samplesComplete =
                    data.samples &&
                    data.samples.length > 0 &&
                    data.samples.every((sample) => sample.sample_type && sample.collectionDate);
                return samplesComplete
                    ? {
                          color: "success",
                          label: "Complete",
                          icon: <CheckCircle fontSize="small" />,
                      }
                    : {
                          color: "warning",
                          label: "Incomplete",
                          icon: <WarningIcon fontSize="small" />,
                      };
            }

            case "forms": {
                const formsComplete = data.orderForms && data.orderForms.length > 0;
                return formsComplete
                    ? {
                          color: "success",
                          label: "Complete",
                          icon: <CheckCircle fontSize="small" />,
                      }
                    : {
                          color: "warning",
                          label: "Incomplete",
                          icon: <WarningIcon fontSize="small" />,
                      };
            }

            case "consent": {
                // Use processed consent data
                if (!restConsents || restConsents.length === 0) {
                    return {
                        color: "warning",
                        label: "Incomplete",
                        icon: <WarningIcon fontSize="small" />,
                    };
                }

                const allAgreed = restConsents.every((consent) => !!consent.value);
                return allAgreed
                    ? {
                          color: "success",
                          label: "Complete",
                          icon: <CheckCircle fontSize="small" />,
                      }
                    : {
                          color: "warning",
                          label: "Incomplete",
                          icon: <WarningIcon fontSize="small" />,
                      };
            }

            default:
                return { color: "info", label: "Unknown", icon: null };
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
            <Box
                component={motion.div}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                sx={{ width: "100%" }}
            >
                <FinalizeAlerts
                    showHelp={showHelp}
                    onCloseHelp={toggleHelp}
                    showSuccess={showSuccess}
                />

                {/* Header section */}
                <Box
                    component={motion.div}
                    variants={itemVariants}
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 3,
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <DoneAllIcon color="primary" />
                        <Typography variant="h5" fontWeight={600}>
                            Order Summary
                        </Typography>

                        <Tooltip title="Show help">
                            <IconButton
                                size="small"
                                onClick={toggleHelp}
                                color={showHelp ? "primary" : "default"}
                            >
                                <HelpIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    <Chip
                        label={`Order ID: ${data.id}`}
                        color="primary"
                        variant="outlined"
                        sx={{ fontWeight: 500 }}
                    />
                </Box>

                {/* Order submission instructions */}
                <Paper
                    component={motion.div}
                    variants={itemVariants}
                    elevation={0}
                    sx={{
                        p: 3,
                        mb: 4,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: theme.palette.primary.lighter || theme.palette.primary.light,
                    }}
                >
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                        Ready to Finalize Your Order
                    </Typography>

                    <Typography variant="body2" paragraph>
                        Please review all information below carefully. To finalize your order, click
                        the &quot;Submit Order&quot; button at the bottom of the page.
                    </Typography>

                    <Typography variant="body2">
                        After submission, you&apos;ll receive a confirmation email with your order
                        details. If you need to make changes, please do so before submitting.
                    </Typography>
                </Paper>

                <TestsSection
                    data={data}
                    errors={errors}
                    expanded={expandedSections.tests}
                    onToggle={() => toggleSection("tests")}
                    status={getSectionStatus("tests")}
                    hasError={hasSectionErrors("tests")}
                    orderId={order.id}
                />

                <PatientDetailsSection
                    data={data}
                    errors={errors}
                    expanded={expandedSections.patient}
                    onToggle={() => toggleSection("patient")}
                    status={getSectionStatus("patient")}
                    hasError={hasSectionErrors("patient")}
                    orderId={order.id}
                />

                {patients.length > 1 && (
                    <AllPatientsSection
                        patients={patients}
                        mainPatientId={order.main_patient_id}
                        expanded={expandedSections.allPatients}
                        onToggle={() => toggleSection("allPatients")}
                        orderId={order.id}
                    />
                )}

                {patients.length > 0 && order.order_items && order.order_items.length > 0 && (
                    <PatientTestAssignmentSection
                        orderItems={order.order_items}
                        mainPatientId={order.main_patient_id}
                        expanded={expandedSections.patientTestAssignment}
                        onToggle={() => toggleSection("patientTestAssignment")}
                        orderId={order.id}
                    />
                )}

                <SampleDetailsSection
                    data={data}
                    errors={errors}
                    expanded={expandedSections.samples}
                    onToggle={() => toggleSection("samples")}
                    status={getSectionStatus("samples")}
                    hasError={hasSectionErrors("samples")}
                    orderId={order.id}
                />

                <ClinicalDetailsSection
                    data={data}
                    errors={errors}
                    expanded={expandedSections.forms}
                    onToggle={() => toggleSection("forms")}
                    status={getSectionStatus("forms")}
                    hasError={hasSectionErrors("forms")}
                    orderId={order.id}
                />

                <ConsentSection
                    restConsents={restConsents}
                    consentForm={consentForm}
                    errors={errors}
                    expanded={expandedSections.consent}
                    onToggle={() => toggleSection("consent")}
                    status={getSectionStatus("consent")}
                    hasError={hasSectionErrors("consent")}
                    orderId={order.id}
                />

                {/* Action Buttons */}
                <Box
                    component={motion.div}
                    variants={itemVariants}
                    sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 2,
                        mb: 2,
                    }}
                >
                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        startIcon={<Send />}
                        onClick={handleSubmit}
                        disabled={processing}
                        sx={{
                            borderRadius: 2,
                            px: 4,
                            textTransform: "none",
                            boxShadow: "none",
                            "&:hover": {
                                boxShadow: theme.shadows[2],
                            },
                        }}
                    >
                        {processing ? "Processing..." : "Submit Order"}
                    </Button>
                </Box>

                {/* Validation message */}
                {Object.keys(errors).length > 0 && (
                    <Alert
                        severity="warning"
                        sx={{
                            mb: 3,
                            borderRadius: 2,
                        }}
                    >
                        <Typography variant="subtitle2" fontWeight={600}>
                            Please Correct the Following Issues
                        </Typography>
                        <Typography variant="body2">
                            There are validation errors in your order. Please review the sections
                            marked with errors and make the necessary corrections before submitting.
                        </Typography>
                    </Alert>
                )}
            </Box>

            <ConfirmSubmitDialog
                open={showConfirmDialog}
                onClose={() => setShowConfirmDialog(false)}
                onConfirm={handleConfirmedSubmit}
                processing={processing}
                orderId={data.id}
            />
        </EditLayout>
    );
};

export default Finalize;
