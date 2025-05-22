import React, { useState } from "react";
import { useSubmitForm } from "@/Services/api";
import EditLayout from "@/Pages/Order/EditLayout";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Checkbox,
    Chip,
    Collapse,
    Divider,
    FormControlLabel,
    Grid,
    IconButton,
    Paper,
    Tooltip,
    Typography,
    useTheme,
    alpha
} from "@mui/material";
import {
    Check,
    ExpandMore,
    ExpandLess,
    InfoOutlined,
    Help as HelpIcon,
    Description as DescriptionIcon
} from "@mui/icons-material";
import FileUploader from "@/Components/FileUploader.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { consentFormValidate, formatConsentData, resetConsentFormErrors } from "@/Services/validate";

/**
 * Enhanced ConsentForm component with improved validation and UI
 *
 * @param {Object} props Component props
 * @param {Object} props.auth Authentication information
 * @param {Object} props.order Order data containing consent information
 * @param {string|number} props.step Current step in the process
 * @param {Array} props.consents Available consent options
 * @returns {JSX.Element} Rendered component
 */
const ConsentForm = ({
                         auth,
                         order: {
                             consents: { consentForm, ...restConsents },
                             ...restOrder
                         },
                         step,
                         consents
                     }) => {
    const theme = useTheme();

    // State for expanded sections
    const [expandedInfo, setExpandedInfo] = useState(true);
    const [showHelp, setShowHelp] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Setup form with existing data or defaults
    const {
        data,
        setData,
        submit,
        processing,
        errors,
        setError,
        clearErrors,
    } = useSubmitForm({
        ...restOrder,
        consents: [...(!Object.keys(restConsents).length ? (consents) : []), ...(Object.values(restConsents))],
        _method: "put",
        consentForm
    }, route("orders.update", { order: restOrder.id, step }));

    /**
     * Update form data for a specific field
     *
     * @param {string} key Field name
     * @param {any} value Field value
     */
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

    /**
     * Handle form submission with validation
     *
     * @param {Event} e Form event
     */
    const handleSubmit = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        // Reset all form errors
        resetConsentFormErrors(data, clearErrors);

        // Validate form data
        if (consentFormValidate(data, setError)) {
            // Format data before submission

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

    /**
     * Handle file uploads
     *
     * @param {string} name Field name
     * @param {Array} files File array
     */
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

    /**
     * Update a specific consent value
     *
     * @param {number} index Consent index
     * @returns {Function} Change handler
     */
    const handleConsentChange = (index) => (e, value) => {
        const consents = [...data.consents];
        consents[index] = {
            ...consents[index],
            value: value
        };
        handleChange("consents", consents);

        // Clear errors related to this consent
        clearErrors(`consents[${index}].value`);
        clearErrors(`consents[${index}]`);
    };

    /**
     * Check if all consents are agreed to
     *
     * @returns {boolean} True if all consents are checked
     */
    const allConsentsChecked = () => {
        return data.consents.every(consent => consent.value === true);
    };

    /**
     * Toggle the info section expansion
     */
    const toggleInfo = () => {
        setExpandedInfo(!expandedInfo);
    };

    /**
     * Toggle help information
     */
    const toggleHelp = () => {
        setShowHelp(!showHelp);
    };

    // Count how many consents are checked
    const checkedConsentsCount = data.consents.filter(consent => consent.value).length;
    const totalConsentsCount = data.consents.length;
    const consentProgress = totalConsentsCount > 0 ? (checkedConsentsCount / totalConsentsCount) * 100 : 0;

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
        <EditLayout
            auth={auth}
            step={step}
            id={restOrder.id}
            onSubmit={handleSubmit}
            isSubmitting={processing}
        >
            <Box
                component={motion.div}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                sx={{ width: '100%' }}
            >
                {/* Help section */}
                <AnimatePresence>
                    {showHelp && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Alert
                                severity="info"
                                icon={<InfoOutlined />}
                                sx={{
                                    mb: 3,
                                    borderRadius: 2,
                                    '& .MuiAlert-icon': {
                                        alignItems: 'center'
                                    }
                                }}
                                onClose={toggleHelp}
                            >
                                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                    Consent Form Guidelines
                                </Typography>
                                <Typography variant="body2" paragraph>
                                    Please read all consent items carefully before proceeding.
                                </Typography>
                                <Box component="ul" sx={{ m: 0, pl: 2, mb: 0 }}>
                                    <Box component="li" sx={{ mb: 0.5 }}>
                                        <Typography variant="body2">
                                            <strong>Required items:</strong> All consent items must be checked to proceed
                                        </Typography>
                                    </Box>
                                    <Box component="li" sx={{ mb: 0.5 }}>
                                        <Typography variant="body2">
                                            <strong>Uploads:</strong> You may upload a signed physical consent form if required
                                        </Typography>
                                    </Box>
                                    <Box component="li">
                                        <Typography variant="body2">
                                            <strong>Questions:</strong> Contact our support team if you have any questions
                                        </Typography>
                                    </Box>
                                </Box>
                            </Alert>
                        </motion.div>
                    )}
                </AnimatePresence>

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
                                Your consent information has been successfully saved.
                            </Alert>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Global error messages */}
                <AnimatePresence>
                    {errors.consents && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Alert
                                severity="error"
                                sx={{
                                    mb: 3,
                                    borderRadius: 2,
                                    '& .MuiAlert-icon': {
                                        alignItems: 'center'
                                    }
                                }}
                                onClose={() => clearErrors('consents')}
                            >
                                <Typography variant="subtitle2" fontWeight={600}>
                                    {errors.consents}
                                </Typography>
                            </Alert>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header section */}
                <Box
                    component={motion.div}
                    variants={itemVariants}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 3
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DescriptionIcon color="primary" />
                        <Typography variant="h5" fontWeight={600}>
                            Consent Form
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

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontStyle: 'italic' }}
                    >
                        Order ID: {restOrder.id}
                    </Typography>
                </Box>

                {/* Progress indicator */}
                <Box
                    component={motion.div}
                    variants={itemVariants}
                    sx={{ mb: 3 }}
                >
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: theme.palette.divider,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body2">
                                Consent progress:
                            </Typography>
                            <Chip
                                label={`${checkedConsentsCount} of ${totalConsentsCount} consents`}
                                color={allConsentsChecked() ? "success" : "primary"}
                                size="small"
                                icon={allConsentsChecked() ? <Check /> : undefined}
                                sx={{ fontWeight: 500 }}
                            />
                        </Box>

                        <Box sx={{ width: '50%' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">
                                    {consentProgress < 100 ? 'In progress' : 'Complete'}
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    {Math.round(consentProgress)}%
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    height: 8,
                                    width: '100%',
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    borderRadius: 4,
                                    overflow: 'hidden'
                                }}
                            >
                                <Box
                                    sx={{
                                        height: '100%',
                                        width: `${consentProgress}%`,
                                        bgcolor: allConsentsChecked() ? "success.main" : "primary.main",
                                        transition: 'width 0.5s ease-in-out, background-color 0.5s ease-in-out'
                                    }}
                                />
                            </Box>
                        </Box>
                    </Paper>
                </Box>

                {/* Info section */}
                <Box
                    component={motion.div}
                    variants={itemVariants}
                    sx={{ mb: 3 }}
                >
                    <Paper
                        elevation={0}
                        sx={{
                            overflow: 'hidden',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: theme.palette.primary.lighter || theme.palette.primary.light,
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <Box
                            sx={{
                                p: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                bgcolor: alpha(theme.palette.primary.main, 0.8),
                                color: theme.palette.primary.contrastText,
                                cursor: 'pointer'
                            }}
                            onClick={toggleInfo}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <InfoOutlined />
                                <Typography variant="subtitle1" fontWeight={600}>
                                    Important Information
                                </Typography>
                            </Box>

                            {expandedInfo ? <ExpandLess /> : <ExpandMore />}
                        </Box>

                        <Collapse in={expandedInfo}>
                            <Box sx={{ p: 3 }}>
                                <Typography variant="body1" paragraph>
                                    Please read each consent item carefully before checking the box. By checking a box, you indicate that you understand and agree to the stated terms.
                                </Typography>

                                <Typography variant="body1" paragraph>
                                    All items must be agreed to before proceeding to the next step. If you have any questions about any consent item, please contact our support team.
                                </Typography>
                            </Box>
                        </Collapse>
                    </Paper>
                </Box>

                {/* Consent checkboxes */}
                <Grid
                    container
                    spacing={3}
                    component={motion.div}
                    variants={itemVariants}
                >
                    <Grid item xs={12}>
                        <Paper
                            elevation={0}
                            sx={{
                                borderRadius: 2,
                                overflow: 'hidden',
                                border: '1px solid',
                                borderColor: errors.consents ? theme.palette.error.main : theme.palette.divider,
                                ...(errors.consents && {
                                    boxShadow: `0 0 0 1px ${theme.palette.error.main}`
                                })
                            }}
                        >
                            <Box
                                sx={{
                                    p: 2,
                                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                                    borderBottom: '1px solid',
                                    borderColor: theme.palette.divider
                                }}
                            >
                                <Typography variant="h6" fontWeight={600}>
                                    Consent Items
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Please read and check all items below
                                </Typography>
                            </Box>

                            <Box component="ul" sx={{ p: 0, m: 0, listStyle: 'none' }}>
                                {data.consents.map((consent, index) => (
                                    <React.Fragment key={`consent-${index}`}>
                                        {index > 0 && <Divider component="li" />}
                                        <Box
                                            component="li"
                                            sx={{
                                                py: 2,
                                                px: 3,
                                                '&:hover': {
                                                    bgcolor: alpha(theme.palette.action.hover, 0.5)
                                                },
                                                transition: 'background-color 0.2s',
                                                ...(errors[`consents[${index}].value`] && {
                                                    bgcolor: alpha(theme.palette.error.main, 0.05),
                                                    '&:hover': {
                                                        bgcolor: alpha(theme.palette.error.main, 0.08)
                                                    }
                                                })
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                                <Avatar
                                                    sx={{
                                                        bgcolor: consent.value ? 'success.main' : errors[`consents[${index}].value`] ? 'error.main' : 'grey.400',
                                                        transition: 'background-color 0.3s ease',
                                                        width: 40,
                                                        height: 40
                                                    }}
                                                >
                                                    {consent.value ? <Check /> : index + 1}
                                                </Avatar>

                                                <Box sx={{ flexGrow: 1 }}>
                                                    <Typography
                                                        variant="body1"
                                                        fontWeight={500}
                                                        color={errors[`consents[${index}].value`] ? 'error.main' : 'text.primary'}
                                                    >
                                                        {consent.title}
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        color={errors[`consents[${index}].value`] ? 'error.main' : 'text.secondary'}
                                                        sx={{ mt: 0.5 }}
                                                    >
                                                        {consent.description}
                                                    </Typography>

                                                    {/* Show error message if present */}
                                                    {errors[`consents[${index}].value`] && (
                                                        <Typography
                                                            variant="caption"
                                                            color="error.main"
                                                            sx={{
                                                                display: 'block',
                                                                mt: 1
                                                            }}
                                                        >
                                                            {errors[`consents[${index}].value`]}
                                                        </Typography>
                                                    )}
                                                </Box>

                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={consent.value || false}
                                                            onChange={handleConsentChange(index)}
                                                            disabled={processing}
                                                            color={errors[`consents[${index}].value`] ? "error" : "primary"}
                                                            required
                                                        />
                                                    }
                                                    label="I agree"
                                                    sx={{ ml: 2 }}
                                                />
                                            </Box>
                                        </Box>
                                    </React.Fragment>
                                ))}
                            </Box>
                        </Paper>
                    </Grid>

                    {/* File uploader */}
                    <Grid item xs={12}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: errors.consentForm ? theme.palette.error.main : theme.palette.divider,
                                ...(errors.consentForm && {
                                    boxShadow: `0 0 0 1px ${theme.palette.error.main}`
                                })
                            }}
                        >
                            <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                                Upload Signed Consent Form
                            </Typography>

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                If you have a physically signed consent form, please upload it here. Acceptable formats include PDF, JPG, and PNG.
                            </Typography>

                            <FileUploader
                                title="Drag consent form here or click to upload"
                                onChange={handleFileChange}
                                defaultValues={[...(data?.consentForm ?? [])]}
                                name="consentForm"
                                description="Upload your signed consent form (optional)"
                                maxFiles={3}
                                error={!!errors.consentForm}
                                errorMessage={errors.consentForm}
                            />
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </EditLayout>
    );
};

export default ConsentForm;
