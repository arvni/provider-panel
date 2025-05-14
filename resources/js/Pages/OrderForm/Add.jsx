import { useEffect, useState } from "react";
import { router, useForm } from "@inertiajs/react";
import {
    Alert,
    Box,
    LinearProgress,
    Paper,
    Typography
} from "@mui/material";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Form from "./Components/Form";
import { Description } from "@mui/icons-material";

/**
 * Add Order Form component
 * Allows creation of new order forms
 *
 * @param {Object} props Component props
 * @returns {JSX.Element} Rendered component
 */
const Add = (props) => {
    // Initialize form state with default values
    const { data, setData, post, processing, errors: formErrors } = useForm({
        name: "",
        formData: [],
        file: null
    });

    // Local state for error handling
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formSubmitted, setFormSubmitted] = useState(false);

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

        post(route('admin.orderForms.store'), {
            onSuccess: () => {
                // Success handling if needed
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
        if (data.name || data.formData.length > 0 || data.file) {
            if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
                router.visit(route('admin.orderForms.index'));
            }
        } else {
            router.visit(route('admin.orderForms.index'));
        }
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
                <Typography variant="h5" component="h1" gutterBottom fontWeight={500}>
                    Create New Order Form
                </Typography>

                <Typography variant="body2" color="text.secondary" paragraph>
                    Create a new order form template with custom fields. This form will be available for patients to fill out when ordering tests.
                </Typography>

                {/* Error alert */}
                {formSubmitted && Object.keys(errors).length > 0 && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        Please correct the errors below before submitting.
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
                />
            </Paper>
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
        title: "Add New Form",
        link: null,
        icon: null
    }
];

// Set layout wrapper
Add.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={breadCrumbs}
    />
);

export default Add;
