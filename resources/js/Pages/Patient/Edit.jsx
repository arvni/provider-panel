import React, { useState } from "react";
import { useSubmitForm } from "@/Services/api";
import PatientDetailsForm from "@/Pages/Order/Components/PatientDetailsForm";
import {
    Alert,
    Box,
    Button,
    Typography,
    Card,
    CardContent,
    Paper,
    useTheme,
    Stack,
    Divider,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from "@mui/material";
import {
    Save as SaveIcon,
    ArrowBack as BackIcon,
    Delete as DeleteIcon,
    Warning as WarningIcon,
} from "@mui/icons-material";
import ClientLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { router } from "@inertiajs/react";

/**
 * Patient Edit component
 */
const Edit = ({ patient, canDelete, deleteReason, genders }) => {
    const theme = useTheme();
    const [showSuccess, setShowSuccess] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
        {
            ...patient,
            _method: "put"
        },
        route("patients.update", patient.id)
    );

    // Handle field changes
    const handleChange = (key, value) => {
        setData(key, value);
        if (errors[key]) {
            clearErrors(key);
        }
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();

        submit({
            onSuccess: () => {
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
            }
        });
    };

    // Handle back navigation
    const handleBack = () => {
        router.get(route("patients.index"));
    };

    // Handle delete
    const handleDelete = () => {
        router.delete(route("patients.destroy", patient.id), {
            onSuccess: () => {
                router.get(route("patients.index"));
            }
        });
    };

    return (
        <ClientLayout>
            <PageHeader
                title="Edit Patient"
                action={
                    <Button
                        variant="outlined"
                        startIcon={<BackIcon />}
                        onClick={handleBack}
                    >
                        Back to Patients
                    </Button>
                }
            />

            <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
                {showSuccess && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        Patient updated successfully!
                    </Alert>
                )}

                <Paper
                    sx={{
                        p: 3,
                        borderRadius: 2,
                        boxShadow: theme.shadows[2],
                    }}
                >
                    <form onSubmit={handleSubmit}>
                        <Stack spacing={3}>
                            <Box>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                    Patient Information
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Update patient details below
                                </Typography>
                                <Divider />
                            </Box>

                            <PatientDetailsForm
                                patient={data}
                                onChange={handleChange}
                                errors={errors}
                                isAdditional={false}
                                patientIndex={0}
                                genders={genders}
                            />

                            <Divider />

                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between">
                                <Box>
                                    {!canDelete && (
                                        <Chip
                                            icon={<WarningIcon />}
                                            label={deleteReason}
                                            color="warning"
                                            variant="outlined"
                                        />
                                    )}
                                </Box>

                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    {canDelete && (
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            startIcon={<DeleteIcon />}
                                            onClick={() => setDeleteDialogOpen(true)}
                                        >
                                            Delete Patient
                                        </Button>
                                    )}

                                    <Button
                                        type="submit"
                                        variant="contained"
                                        startIcon={<SaveIcon />}
                                        disabled={processing}
                                        sx={{
                                            minWidth: 150,
                                            background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
                                        }}
                                    >
                                        {processing ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </Stack>
                            </Stack>
                        </Stack>
                    </form>
                </Paper>

                {/* Patient Stats */}
                <Paper
                    sx={{
                        p: 3,
                        mt: 2,
                        borderRadius: 2,
                        boxShadow: theme.shadows[2],
                    }}
                >
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        Patient Statistics
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <Stack direction="row" spacing={4}>
                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                Orders as Main Patient
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                                {patient.orders?.length || 0}
                            </Typography>
                        </Box>

                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                Tests Involved
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.info.main }}>
                                {patient.order_items?.length || 0}
                            </Typography>
                        </Box>

                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                Related Patients
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.secondary.main }}>
                                {patient.related_patients?.length || 0}
                            </Typography>
                        </Box>
                    </Stack>
                </Paper>
            </Box>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Delete Patient</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this patient? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDelete}
                        color="error"
                        variant="contained"
                        autoFocus
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </ClientLayout>
    );
};

export default Edit;
