import { useEffect, useState } from "react";
import { router, useForm } from "@inertiajs/react";
import {
    Alert,
    Box,
    LinearProgress,
    Paper,
    Snackbar,
    Typography
} from "@mui/material";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Form from "./Components/Form";
import { Description, Edit as EditIcon } from "@mui/icons-material";

/**
 * Edit Order Form component
 * Allows editing existing order forms
 *
 * @param {Object} props Component props
 * @returns {JSX.Element} Rendered component
 */
const Edit = (props) => {
    // Initialize form with existing data
    const { data, setData, post, processing, errors: formErrors } = useForm({
        ...props.orderForm,
        _method: "put"
    });

    // Local state for error handling and notifications
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    // Update errors from props
    useEffect(() => {
        if (Object.keys(props.errors).length) {
            setErrors(props.errors);
            setIsSubmitting(false);
        }
    }, [props.errors]);

    /**
     * Handle form submission
     */
    const handleSubmit = () => {
        setIsSubmitting(true);
        setFormSubmitted(true);

        post(route('admin.orderForms.update', props.orderForm.id), {
            onSuccess: () => {
                setSuccessMessage("Order form updated successfully");
                setTimeout(() => {
                    setSuccessMessage("");
                }, 3000);
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            }
        });
    };

    /**
     * Handle form cancellation
     */
    const handleCancel = () => {
        // Show confirmation if form has been modified
        const hasChanges = JSON.stringify(data) !== JSON.stringify(props.orderForm);

        if (hasChanges) {
            if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
                router.visit(route('admin.orderForms.index'));
            }
        } else {
            router.visit(route('admin.orderForms.index'));
        }
    };

    /**
     * Close success notification
     */
    const handleCloseSuccessMessage = () => {
        setSuccessMessage("");
    };

    return (
        <Box sx={{
            position: 'relative',
            maxWidth: 1200,
            mx: 'auto',
            pt: 2
        }}>
            {/* Loading indicator */}
            {processing && (
                <LinearProgress
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        borderTopLeftRadius: 4,
                        borderTopRightRadius: 4,
                        zIndex: 1
                    }}
                />
            )}

            <Paper
                elevation={0}
                variant="outlined"
                sx={{
                    p: 3,
                    borderRadius: 2,
                    mb: 4
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                    <Box>
                        <Typography variant="h5" component="h1" gutterBottom fontWeight={500}>
                            Edit Order Form
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                            Update form name, fields, and associated template file
                        </Typography>
                    </Box>

                    <Box sx={{
                        px: 2,
                        py: 1,
                        bgcolor: 'info.lightest',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'info.light'
                    }}>
                        <Typography variant="body2" fontWeight={500} color="info.dark">
                            Form ID: {props.orderForm.id}
                        </Typography>
                    </Box>
                </Box>

                {/* Error alert */}
                {formSubmitted && Object.keys(errors).length > 0 && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        Please correct the errors below before saving.
                    </Alert>
                )}

                {/* Form component */}
                <Form
                    values={data}
                    errors={errors}
                    setValues={setData}
                    submit={handleSubmit}
                    cancel={handleCancel}
                    processing={isSubmitting}
                    edit={true}
                />
            </Paper>

            {/* Success notification */}
            <Snackbar
                open={!!successMessage}
                autoHideDuration={3000}
                onClose={handleCloseSuccessMessage}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleCloseSuccessMessage}
                    severity="success"
                    variant="filled"
                    elevation={6}
                >
                    {successMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

// Breadcrumbs for the layout
const breadCrumbs = [
    {
        title: "Order Forms",
        link: "/admin/orderForms",
        icon: <Description fontSize="small" />
    },
    {
        title: "Edit Form",
        link: null,
        icon: <EditIcon fontSize="small" />
    }
];

// Set layout wrapper
Edit.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={breadCrumbs}
    />
);

export default Edit;
