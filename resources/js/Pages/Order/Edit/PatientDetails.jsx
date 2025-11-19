import React, { useState } from "react";
import { useSubmitForm } from "@/Services/api";
import PatientDetailsForm from "../Components/PatientDetailsForm";
import EditLayout from "../EditLayout";
import { patientDetailsValidate } from "@/Services/validate";
import {
    Alert,
    Box,
    Button,
    Typography,
    IconButton,
    Card,
    CardContent,
    Chip,
    useTheme,
    alpha,
    Divider
} from "@mui/material";
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Person as PersonIcon
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import PatientList  from "../Components/PatientList.jsx";

/**
 * Enhanced PatientDetails component with multiple patients support
 */
const PatientDetails = ({ auth, order, step, genders }) => {
    const theme = useTheme();

    // Initialize patients array - support both existing multiple patients and single patient
    const initialPatients = order.patient_ids && order.patient_ids.length > 0
        ? (order.patients || [order.patient])
        : [order.patient || {
            fullName: "",
            nationality: null,
            dateOfBirth: "",
            gender: "",
            consanguineousParents: "",
            contact: null,
            isFetus: false,
            reference_id: "",
            id_no: "",
            relations: []
        }];

    // State for multiple patients
    const [patients, setPatients] = useState(initialPatients);
    const [openPatientList, setOpenPatientList] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [selectedPatientIndex, setSelectedPatientIndex] = useState(null);

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
        { patients, _method: "put" },
        route("orders.update", { order: order.id, step })
    );

    // Update data when patients change
    React.useEffect(() => {
        setData({ patients, _method: "put" });
    }, [patients]);

    // Handle field changes for a specific patient
    const handleChange = (patientIndex, key, value) => {
        const updatedPatients = [...patients];
        updatedPatients[patientIndex] = {
            ...updatedPatients[patientIndex],
            [key]: value
        };
        setPatients(updatedPatients);

        // Clear error for this field
        if (errors[`patients.${patientIndex}.${key}`]) {
            clearErrors(`patients.${patientIndex}.${key}`);
        }

        // Hide success message when form changes
        if (showSuccess) {
            setShowSuccess(false);
        }
    };

    // Add new patient
    const handleAddPatient = () => {
        setPatients([...patients, {
            fullName: "",
            nationality: null,
            dateOfBirth: "",
            gender: "",
            consanguineousParents: "",
            contact: null,
            isFetus: false,
            reference_id: "",
            id_no: "",
            relations: []
        }]);
    };

    // Remove patient (except first one)
    const handleRemovePatient = (index) => {
        if (patients.length > 1) {
            setPatients(patients.filter((_, i) => i !== index));
        }
    };

    // Submit form with validation
    const handleSubmit = () => {
        clearErrors();

        // Validate all patients
        let isValid = true;
        patients.forEach((patient, index) => {
            if (!patientDetailsValidate(patient, (key, message) => {
                setError(`patients.${index}.${key}`, message);
                isValid = false;
            })) {
                isValid = false;
            }
        });

        if (isValid) {
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

    // Patient list dialog handlers
    const handlePatientListOpen = (patientIndex) => {
        setSelectedPatientIndex(patientIndex);
        setOpenPatientList(true);
    };

    const handlePatientListClose = () => {
        setOpenPatientList(false);
        setSelectedPatientIndex(null);
    };

    // Handle patient selection from list
    const handlePatientSelect = (patient) => {
        if (selectedPatientIndex !== null) {
            const updatedPatients = [...patients];
            updatedPatients[selectedPatientIndex] = { ...patient };
            setPatients(updatedPatients);
        }
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

            {/* Info Alert */}
            {patients.length > 1 && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    You have {patients.length} patients in this order. The first patient is the main patient.
                </Alert>
            )}

            {/* Render each patient form */}
            <Box>
                {patients.map((patient, index) => (
                    <Card
                        key={index}
                        component={motion.div}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        sx={{
                            mb: 3,
                            border: '2px solid',
                            borderColor: index === 0 ? 'primary.main' : 'divider',
                            borderRadius: 2,
                            overflow: 'visible'
                        }}
                    >
                        {/* Patient Card Header */}
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                px: 3,
                                py: 2,
                                bgcolor: index === 0
                                    ? alpha(theme.palette.primary.main, 0.08)
                                    : alpha(theme.palette.grey[500], 0.05),
                                borderBottom: '1px solid',
                                borderColor: 'divider'
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <PersonIcon color={index === 0 ? "primary" : "action"} />
                                <Typography variant="h6" fontWeight={600}>
                                    {index === 0 ? 'Main Patient' : `Additional Patient ${index}`}
                                </Typography>
                                {index === 0 && (
                                    <Chip
                                        label="Primary"
                                        size="small"
                                        color="primary"
                                        sx={{ fontWeight: 600 }}
                                    />
                                )}
                            </Box>

                            {index > 0 && (
                                <IconButton
                                    onClick={() => handleRemovePatient(index)}
                                    color="error"
                                    size="small"
                                    sx={{
                                        '&:hover': {
                                            bgcolor: alpha(theme.palette.error.main, 0.1)
                                        }
                                    }}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            )}
                        </Box>

                        {/* Patient Form */}
                        <CardContent sx={{ p: 0 }}>
                            <PatientDetailsForm
                                patient={patient}
                                patientIndex={index}
                                isAdditional={index > 0}
                                genders={genders}
                                onChange={(key, value) => handleChange(index, key, value)}
                                onSubmit={handleSubmit}
                                errors={Object.keys(errors)
                                    .filter(key => key.startsWith(`patients.${index}.`))
                                    .reduce((obj, key) => {
                                        const newKey = key.replace(`patients.${index}.`, '');
                                        obj[newKey] = errors[key];
                                        return obj;
                                    }, {})}
                                handlePatientListOpen={() => handlePatientListOpen(index)}
                            />
                        </CardContent>
                    </Card>
                ))}

                {/* Add Another Patient Button */}
                <Button
                    variant="outlined"
                    size="large"
                    startIcon={<AddIcon />}
                    onClick={handleAddPatient}
                    fullWidth
                    sx={{
                        py: 1.5,
                        borderRadius: 2,
                        borderStyle: 'dashed',
                        borderWidth: 2,
                        textTransform: 'none',
                        fontSize: '1rem',
                        fontWeight: 600,
                        '&:hover': {
                            borderStyle: 'dashed',
                            borderWidth: 2,
                            bgcolor: alpha(theme.palette.primary.main, 0.04)
                        }
                    }}
                >
                    Add Another Patient
                </Button>
            </Box>

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
