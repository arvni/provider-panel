import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Alert,
    Divider,
    Chip,
    Button,
    CircularProgress,
    Paper,
    Card,
    CardContent,
    useTheme,
    alpha,
    Collapse,
    IconButton
} from "@mui/material";
import TestMethodForm from "../Components/TestMethodForm";
import { useSubmitForm } from "@/Services/api";
import EditLayout from "../EditLayout";
import {
    Science as ScienceIcon,
    CheckCircle as CheckCircleIcon,
    ErrorOutline as ErrorIcon,
    Save as SaveIcon,
    Close as CloseIcon,
    Info as InfoIcon
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Enhanced TestMethod component for the order editing process
 */
const TestMethod = ({ auth, order, step }) => {
    const theme = useTheme();
    const [showTips, setShowTips] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);

    // Form state management
    const {
        data,
        setData,
        submit,
        errors,
        clearErrors,
        processing
    } = useSubmitForm({ ...order, _method: "put" }, route("orders.update", { order: order.id, step }));

    // Handle form field changes
    const handleChange = (key, value) => {
        setData(previousData => ({ ...previousData, [key]: value }));

        // Clear any existing errors for this field
        if (errors[key]) {
            clearErrors(key);
        }

        // Reset success message when user makes changes
        setSavedSuccess(false);
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsSubmitting(true);

        submit({
            onSuccess: () => {
                setIsSubmitting(false);
                setSavedSuccess(true);

                // Clear success message after a few seconds
                setTimeout(() => {
                    setSavedSuccess(false);
                }, 5000);
            },
            onError: () => {
                setIsSubmitting(false);
            }
        });
    };

    // Hide success message when user navigates away
    useEffect(() => {
        return () => {
            setSavedSuccess(false);
        };
    }, []);

    // Toggle help tips visibility
    const toggleTips = () => {
        setShowTips(!showTips);
    };

    // Animation variants
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.4 }
        }
    };

    return (
        <EditLayout
            step={step}
            auth={auth}
            id={order.id}
        >
            <Box
                component="form"
                id="current-step-form"
                onSubmit={handleSubmit}
                sx={{ width: "100%" }}
            >
                {/* Success message */}
                <AnimatePresence>
                    {savedSuccess && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Alert
                                severity="success"
                                icon={<CheckCircleIcon fontSize="inherit" />}
                                sx={{
                                    mb: 3,
                                    borderRadius: 1,
                                    '& .MuiAlert-icon': {
                                        alignItems: 'center'
                                    }
                                }}
                                onClose={() => setSavedSuccess(false)}
                            >
                                Test methods have been successfully saved.
                            </Alert>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Error message */}
                <AnimatePresence>
                    {errors.tests && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Alert
                                severity="error"
                                icon={<ErrorIcon fontSize="inherit" />}
                                sx={{
                                    mb: 3,
                                    borderRadius: 1,
                                    '& .MuiAlert-icon': {
                                        alignItems: 'center'
                                    }
                                }}
                                onClose={() => clearErrors('tests')}
                            >
                                {errors.tests || "Please select at least one test method"}
                            </Alert>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Help tips */}
                <Collapse in={showTips}>
                    <Card
                        variant="outlined"
                        sx={{
                            mb: 3,
                            borderColor: alpha(theme.palette.info.main, 0.3),
                            backgroundColor: alpha(theme.palette.info.main, 0.05)
                        }}
                    >
                        <CardContent sx={{ position: 'relative', pb: 2 }}>
                            <IconButton
                                aria-label="close"
                                onClick={toggleTips}
                                size="small"
                                sx={{
                                    position: 'absolute',
                                    right: 8,
                                    top: 8,
                                    color: theme.palette.grey[500],
                                }}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>

                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                                <InfoIcon color="info" sx={{ mt: 0.5 }} />
                                <Typography variant="subtitle1" fontWeight={600} color="info.main">
                                    How to Select Test Methods
                                </Typography>
                            </Box>

                            <Typography variant="body2" color="text.secondary" paragraph>
                                Select one or more tests from the available options below. The selected tests will determine what information needs to be collected in the following steps.
                            </Typography>

                            <Box component="ul" sx={{ m: 0, pl: 3 }}>
                                <Box component="li" sx={{ mb: 0.5 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Check the boxes next to the tests you want to perform
                                    </Typography>
                                </Box>
                                <Box component="li" sx={{ mb: 0.5 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Some tests may require additional information in later steps
                                    </Typography>
                                </Box>
                                <Box component="li">
                                    <Typography variant="body2" color="text.secondary">
                                        Remember to save your changes before proceeding to the next step
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Collapse>

                {/* Current selections summary */}
                {data.tests && data.tests.length > 0 && (
                    <Box
                        component={motion.div}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        sx={{ mb: 3 }}
                    >
                        <Typography
                            variant="subtitle1"
                            fontWeight={600}
                            sx={{
                                mb: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}
                        >
                            <ScienceIcon fontSize="small" color="primary" />
                            Currently Selected Tests
                        </Typography>

                        <Box
                            sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 1,
                                p: 2,
                                borderRadius: 1,
                                bgcolor: alpha(theme.palette.primary.main, 0.05),
                                border: '1px solid',
                                borderColor: alpha(theme.palette.primary.main, 0.1)
                            }}
                        >
                            {data.tests.map((test, index) => (
                                <Chip
                                    key={test.id || index}
                                    label={test.name}
                                    color="primary"
                                    variant="outlined"
                                    icon={<ScienceIcon fontSize="small" />}
                                    sx={{
                                        fontWeight: 500,
                                        borderRadius: 1
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>
                )}

                {/* Test selection form */}
                <Box
                    component={motion.div}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: theme.palette.divider,
                            backgroundColor: theme.palette.background.paper
                        }}
                    >
                        <TestMethodForm
                            tests={data.tests}
                            onChange={handleChange}
                            onSubmit={handleSubmit}
                        />

                        <Divider sx={{ my: 3 }} />

                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                alignItems: 'center',
                                gap: 2
                            }}
                        >
                            <Button
                                variant="outlined"
                                color="inherit"
                                onClick={toggleTips}
                                sx={{
                                    borderRadius: 1,
                                    textTransform: 'none'
                                }}
                            >
                                {showTips ? 'Hide Tips' : 'Show Tips'}
                            </Button>

                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                disabled={isSubmitting || processing}
                                startIcon={isSubmitting || processing ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                sx={{
                                    borderRadius: 1,
                                    textTransform: 'none',
                                    boxShadow: 'none',
                                    '&:hover': {
                                        boxShadow: theme.shadows[2]
                                    }
                                }}
                            >
                                {isSubmitting || processing ? 'Saving...' : 'Save Test Methods'}
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            </Box>
        </EditLayout>
    );
};

export default TestMethod;
