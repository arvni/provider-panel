import React, { useState } from "react";
import {
    Alert,
    Paper,
    Box,
    Typography,
    Button,
    Divider,
    IconButton,
    useTheme,
    alpha,
    Backdrop,
    CircularProgress,
    Tooltip,
    Card,
    CardContent,
} from "@mui/material";
import TestMethodForm from "./Components/TestMethodForm";
import { useSubmitForm } from "@/Services/api";
import { testMethodValidate } from "@/Services/validate";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    Add as AddIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Help as HelpIcon
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Enhanced Add Order component with improved UI and user flow
 */
const Add = ({ auth, tests = [] }) => {
    const theme = useTheme();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    // Form state management
    const {
        data,
        setData,
        submit,
        errors,
        setError,
        clearErrors,
        processing
    } = useSubmitForm({
        patient: undefined,
        status: undefined,
        step: undefined,
        tests: tests,
        files: [],
        orderForms: [],
        samples: [{}]
    }, route("orders.store"));

    // Handle form field changes
    const handleChange = (key, value) => {
        setData(key, value);
        // Clear related errors when a field changes
        if (errors[key]) {
            clearErrors(key);
        }
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        clearErrors();
        setIsSubmitting(true);

        if (testMethodValidate(data, setError)) {
            submit({
                onSuccess: () => {
                    setIsSubmitting(false);
                },
                onError: () => {
                    setIsSubmitting(false);
                }
            });
        } else {
            setIsSubmitting(false);
        }
    };

    // Handle cancel button
    const handleCancel = () => {
        window.history.back();
    };

    // Toggle help information
    const toggleHelp = () => {
        setShowHelp(!showHelp);
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                when: "beforeChildren",
                staggerChildren: 0.1,
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.4 }
        }
    };

    return (
        <AuthenticatedLayout
            auth={auth}
            breadcrumbs={[
                {
                    title: "Orders",
                    link: route("orders.index"),
                    icon: null
                },
                {
                    title: "New Order",
                    link: "",
                    icon: null
                }
            ]}
        >
            <Box
                component={motion.div}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                sx={{ width: "100%" }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2, sm: 3 },
                        mt: 2,
                        mb: 4,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: theme.palette.divider,
                    }}
                >
                    {/* Header Section */}
                    <Box
                        component={motion.div}
                        variants={itemVariants}
                        sx={{
                            mb: 4,
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            justifyContent: 'space-between',
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            gap: 2
                        }}
                    >
                        <Box>
                            <Typography
                                variant="h5"
                                fontWeight={700}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    mb: 0.5
                                }}
                            >
                                <AddIcon color="primary" />
                                Create New Order
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Step 1: Select the test method(s) for this order
                            </Typography>
                        </Box>

                        <Box>
                            <Tooltip title="Get Help">
                                <IconButton
                                    onClick={toggleHelp}
                                    color={showHelp ? "primary" : "default"}
                                    sx={{
                                        mr: 1,
                                        border: '1px solid',
                                        borderColor: showHelp ? theme.palette.primary.main : theme.palette.divider
                                    }}
                                >
                                    <HelpIcon />
                                </IconButton>
                            </Tooltip>

                            <Button
                                variant="outlined"
                                color="inherit"
                                startIcon={<CancelIcon />}
                                onClick={handleCancel}
                                sx={{
                                    mr: 1,
                                    borderRadius: 1,
                                    textTransform: 'none'
                                }}
                            >
                                Cancel
                            </Button>
                        </Box>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    {/* Help Box */}
                    <AnimatePresence>
                        {showHelp && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Card
                                    variant="outlined"
                                    sx={{
                                        mb: 3,
                                        borderColor: alpha(theme.palette.info.main, 0.5),
                                        backgroundColor: alpha(theme.palette.info.main, 0.05)
                                    }}
                                >
                                    <CardContent>
                                        <Typography
                                            variant="subtitle1"
                                            fontWeight={600}
                                            color="info.main"
                                            sx={{ mb: 1 }}
                                        >
                                            How to Create a New Order
                                        </Typography>
                                        <Typography variant="body2" paragraph>
                                            Creating a new order involves three simple steps:
                                        </Typography>
                                        <Box component="ol" sx={{ ml: 2, mb: 0 }}>
                                            <Box component="li" sx={{ mb: 1 }}>
                                                <Typography variant="body2">
                                                    <strong>Select Test Method(s)</strong> - Choose one or more tests from the available options.
                                                </Typography>
                                            </Box>
                                            <Box component="li" sx={{ mb: 1 }}>
                                                <Typography variant="body2">
                                                    <strong>Enter Patient Information</strong> - Provide the patient's details needed for the tests.
                                                </Typography>
                                            </Box>
                                            <Box component="li">
                                                <Typography variant="body2">
                                                    <strong>Add Sample Information</strong> - Specify details about the sample(s) being sent for testing.
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Error Messages */}
                    <AnimatePresence>
                        {errors.tests && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Alert
                                    severity="error"
                                    sx={{
                                        mb: 3,
                                        borderRadius: 1,
                                        '& .MuiAlert-icon': {
                                            alignItems: 'center'
                                        }
                                    }}
                                    onClose={() => clearErrors('tests')}
                                >
                                    {errors.test_method || "Please select at least one test method"}
                                </Alert>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Form Content */}
                    <Box
                        component={motion.div}
                        variants={itemVariants}
                        sx={{ mb: 3 }}
                    >
                        <TestMethodForm
                            tests={data.tests}
                            onChange={handleChange}
                            onSubmit={handleSubmit}
                        />
                    </Box>

                    {/* Form Actions */}
                    <Box
                        component={motion.div}
                        variants={itemVariants}
                        sx={{
                            mt: 4,
                            pt: 3,
                            borderTop: '1px solid',
                            borderColor: theme.palette.divider,
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 2
                        }}
                    >
                        <Button
                            variant="outlined"
                            color="inherit"
                            startIcon={<CancelIcon />}
                            onClick={handleCancel}
                            disabled={isSubmitting || processing}
                            sx={{
                                borderRadius: 1,
                                textTransform: 'none'
                            }}
                        >
                            Cancel
                        </Button>

                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={isSubmitting || processing ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                            onClick={handleSubmit}
                            disabled={isSubmitting || processing}
                            sx={{
                                borderRadius: 1,
                                textTransform: 'none',
                                boxShadow: 'none',
                                '&:hover': {
                                    boxShadow: theme.shadows[2]
                                }
                            }}
                        >
                            {isSubmitting || processing ? 'Saving...' : 'Continue to Patient Information'}
                        </Button>
                    </Box>
                </Paper>
            </Box>

            {/* Loading Backdrop */}
            <Backdrop
                sx={{
                    color: '#fff',
                    zIndex: theme.zIndex.drawer + 1,
                    backdropFilter: 'blur(4px)'
                }}
                open={isSubmitting || processing}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
        </AuthenticatedLayout>
    );
};

export default Add;
