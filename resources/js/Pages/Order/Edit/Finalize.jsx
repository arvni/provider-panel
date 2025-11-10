import React, {useState} from "react";
import {useSubmitForm} from "@/Services/api";
import EditLayout from "@/Pages/Order/EditLayout";
import {
    Alert,
    Box,
    Button,
    Chip,
    Collapse,
    Divider,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
    useTheme,
    alpha
} from "@mui/material";
import {
    CheckCircle,
    ExpandMore,
    ExpandLess,
    Person,
    ScienceOutlined,
    Assignment,
    MedicalServices,
    EventNote,
    Send,
    Download,
    Help as HelpIcon,
    DoneAll as DoneAllIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    FileCopy as FileCopyIcon,
    Download as DownloadIcon
} from "@mui/icons-material";
import {motion, AnimatePresence} from "framer-motion";

/**
 * Enhanced Finalize component for reviewing and submitting orders
 *
 * @param {Object} props Component props
 * @param {Object} props.auth Authentication information
 * @param {Object} props.order Order data
 * @param {string|number} props.step Current step in the process
 * @param {Array} props.patients All patients in the order
 * @returns {JSX.Element} Rendered component
 */
const Finalize = ({auth, order, step, patients = []}) => {
    const theme = useTheme();

    // State for expanded sections
    const [expandedSections, setExpandedSections] = useState({
        tests: true,
        patient: true,
        allPatients: patients.length > 1,  // Expand if multiple patients
        patientTestAssignment: true,
        samples: true,
        forms: true,
        consent: true
    });

    const [showHelp, setShowHelp] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Setup form with existing data
    const {
        data,
        submit,
        errors,
        setError,
        clearErrors,
        processing
    } = useSubmitForm(
        {...order, _method: "put", status: "requested"},
        route("orders.update", {order: order.id, step})
    );

    /**
     * Process consent data to handle both array and object formats
     * Same logic as Show.jsx component
     */
    const processConsentData = (consents) => {
        if (!consents) return {restConsents: [], consentForm: null};

        let consentForm, restConsents;
        if (Array.isArray(consents)) {
            restConsents = consents;
            consentForm = null;
        } else {
            consentForm = consents.consentForm;
            restConsents = Object.keys(consents)
                .filter(item => item !== "consentForm")
                .map(item => consents?.[item])
                .filter(Boolean); // Remove any null/undefined values
        }

        return {restConsents, consentForm};
    };

    // Process consent data
    const {restConsents, consentForm} = processConsentData(data.consents);

    /**
     * Handle form submission with validation
     */
    const handleSubmit = () => {
        // Confirm submission
        if (window.confirm("Are you sure you want to finalize this order? After submission, certain details cannot be modified.")) {
            // Reset all previous errors
            Object.keys(errors).forEach(key => clearErrors(key));

            // Create processed data with normalized consent structure
            const processedData = {
                ...data,
                consents: restConsents,
                consentForm: consentForm
            };

            // Validate the entire order with processed data
            if (validateFullOrderWithProcessedConsents(processedData, setError)) {

                // Submit the order
                submit({
                    onSuccess: () => {
                        // Show success message
                        setShowSuccess(true);

                        // Redirect to order confirmation page after successful submission (optional)
                        setTimeout(() => {
                            window.location.href = route("orders.index");
                        }, 5000);
                    }
                });
            } else {
                // Expand sections with errors for better visibility
                const sectionsWithErrors = {
                    tests: Object.keys(errors).some(key => key.startsWith('tests')),
                    patient: Object.keys(errors).some(key => key.startsWith('patient')),
                    samples: Object.keys(errors).some(key => key.startsWith('samples')),
                    forms: Object.keys(errors).some(key => key.startsWith('orderForms')),
                    consent: Object.keys(errors).some(key => key.startsWith('consents'))
                };

                setExpandedSections(prev => ({
                    ...prev,
                    ...Object.entries(sectionsWithErrors)
                        .filter(([_, hasError]) => hasError)
                        .reduce((acc, [section]) => ({...acc, [section]: true}), {})
                }));
            }
        }
    };

    /**
     * Enhanced validation function that works with processed consent data
     */
    const validateFullOrderWithProcessedConsents = (processedData, setError) => {
        let isValid = true;

        // 1. Tests validation
        if (!processedData.tests || !Array.isArray(processedData.tests) || processedData.tests.length === 0) {
            setError('tests', 'At least one test must be selected');
            isValid = false;
        }

        // 2. Patient details validation
        if (!processedData.patient) {
            setError('patient', 'Patient information is required');
            isValid = false;
        } else {
            const requiredPatientFields = [
                {field: 'fullName', message: 'Patient name is required'},
                {field: 'dateOfBirth', message: 'Date of birth is required'},
                {field: 'gender', message: 'Gender is required'}
            ];

            requiredPatientFields.forEach(({field, message}) => {
                if (!processedData.patient[field]) {
                    setError(`patient.${field}`, message);
                    isValid = false;
                }
            });
        }

        // 3. Clinical details validation
        if (!processedData.orderForms || !Array.isArray(processedData.orderForms)) {
            setError('orderForms', 'Clinical details are required');
            isValid = processedData.orderForms.length === 0;
        } else {
            processedData.orderForms.forEach((form, formIndex) => {
                if (form.formData && Array.isArray(form.formData)) {
                    form.formData.forEach((field, fieldIndex) => {
                        if (field.required && (!field.value && field.value !== 0 && field.value !== false) && field.type !== "description") {
                            setError(`orderForms[${formIndex}].formData[${fieldIndex}].value`,
                                `${field.label || 'This field'} is required`);
                            setError(`orderForms[${formIndex}].hasErrors`,
                                'This form has required fields that need to be completed');
                            isValid = field.type !== "description";
                        }
                    });
                }
            });
        }

        // 4. Sample details validation
        if (!processedData.samples || !Array.isArray(processedData.samples) || processedData.samples.length === 0) {
            setError('samples', 'At least one sample is required');
            isValid = false;
        }

        // 5. Consent validation - using processed consent data
        if (processedData.consents && processedData.consents.length > 0) {
            processedData.consents.forEach((consent, index) => {
                if (consent.title && !consent.value) {
                    setError(`consents[${index}].value`, 'You must agree to this consent item to proceed');
                    isValid = false;
                }
            });
        } else {
            setError('consents', 'Consent information is required');
            isValid = false;
        }

        return isValid;
    };

    /**
     * Toggle section expansion
     *
     * @param {string} section Section identifier
     */
    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    /**
     * Toggle help information
     */
    const toggleHelp = () => {
        setShowHelp(!showHelp);
    };

    /**
     * Format date string for better display
     *
     * @param {string} dateString Date string to format
     * @returns {string} Formatted date
     */
    const formatDate = (dateString) => {
        if (!dateString) return "Not specified";

        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }).format(date);
        } catch (e) {
            return dateString;
        }
    };

    /**
     * Create PDF download of order summary
     */
    const downloadSummary = () => {
        window.print();
        // In a real application, you would implement proper PDF generation
    };

    /**
     * Check if a section has any errors
     *
     * @param {string} section Section name
     * @returns {boolean} True if section has errors
     */
    const hasSectionErrors = (section) => {
        const errorKeyMappings = {
            tests: 'tests',
            patient: 'patient',
            samples: 'samples',
            forms: 'orderForms',
            consent: 'consents'
        };

        const errorPrefix = errorKeyMappings[section];
        return errorPrefix && Object.keys(errors).some(key => key.startsWith(errorPrefix));
    };

    /**
     * Get section status - Updated to work with processed consent data
     *
     * @param {string} section Section name
     * @returns {Object} Status object with color and label
     */
    const getSectionStatus = (section) => {
        if (hasSectionErrors(section)) {
            return {color: 'error', label: 'Errors', icon: <ErrorIcon fontSize="small"/>};
        }

        // Define completion criteria for each section
        switch (section) {
            case 'tests':
                return data.tests && data.tests.length > 0
                    ? {color: 'success', label: 'Complete', icon: <CheckCircle fontSize="small"/>}
                    : {color: 'warning', label: 'Incomplete', icon: <WarningIcon fontSize="small"/>};

            case 'patient':
                const patientComplete = data.patient && data.patient.fullName &&
                    data.patient.dateOfBirth && data.patient.gender;
                return patientComplete
                    ? {color: 'success', label: 'Complete', icon: <CheckCircle fontSize="small"/>}
                    : {color: 'warning', label: 'Incomplete', icon: <WarningIcon fontSize="small"/>};

            case 'samples':
                const samplesComplete = data.samples && data.samples.length > 0 &&
                    data.samples.every(sample => sample.sample_type && sample.collectionDate);
                return samplesComplete
                    ? {color: 'success', label: 'Complete', icon: <CheckCircle fontSize="small"/>}
                    : {color: 'warning', label: 'Incomplete', icon: <WarningIcon fontSize="small"/>};

            case 'forms':
                const formsComplete = data.orderForms && data.orderForms.length > 0;
                return formsComplete
                    ? {color: 'success', label: 'Complete', icon: <CheckCircle fontSize="small"/>}
                    : {color: 'warning', label: 'Incomplete', icon: <WarningIcon fontSize="small"/>};

            case 'consent':
                // Use processed consent data
                if (!restConsents || restConsents.length === 0) {
                    return {color: 'warning', label: 'Incomplete', icon: <WarningIcon fontSize="small"/>};
                }

                const allAgreed = restConsents.every(consent => !!consent.value);
                return allAgreed
                    ? {color: 'success', label: 'Complete', icon: <CheckCircle fontSize="small"/>}
                    : {color: 'warning', label: 'Incomplete', icon: <WarningIcon fontSize="small"/>};

            default:
                return {color: 'info', label: 'Unknown', icon: null};
        }
    };

    // Animation variants
    const containerVariants = {
        hidden: {opacity: 0},
        visible: {
            opacity: 1,
            transition: {
                when: "beforeChildren",
                staggerChildren: 0.1,
            }
        }
    };

    const itemVariants = {
        hidden: {y: 20, opacity: 0},
        visible: {
            y: 0,
            opacity: 1,
            transition: {duration: 0.4}
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
                sx={{width: '100%'}}
            >
                {/* Help section */}
                <AnimatePresence>
                    {showHelp && (
                        <motion.div
                            initial={{opacity: 0, height: 0}}
                            animate={{opacity: 1, height: 'auto'}}
                            exit={{opacity: 0, height: 0}}
                            transition={{duration: 0.3}}
                        >
                            <Alert
                                severity="info"
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
                                    Order Finalization Guidelines
                                </Typography>
                                <Typography variant="body2" paragraph>
                                    Please review all information carefully before submitting your order.
                                </Typography>
                                <Box component="ul" sx={{m: 0, pl: 2, mb: 0}}>
                                    <Box component="li" sx={{mb: 0.5}}>
                                        <Typography variant="body2">
                                            <strong>Review all sections:</strong> Ensure all patient and sample
                                            information is correct
                                        </Typography>
                                    </Box>
                                    <Box component="li" sx={{mb: 0.5}}>
                                        <Typography variant="body2">
                                            <strong>Submission:</strong> Once submitted, certain details cannot be
                                            modified
                                        </Typography>
                                    </Box>
                                    <Box component="li">
                                        <Typography variant="body2">
                                            <strong>Confirmation:</strong> You'll receive a confirmation email after
                                            submission
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
                            initial={{opacity: 0, y: -20}}
                            animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0, y: -20}}
                            transition={{duration: 0.3}}
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
                            >
                                <Typography variant="subtitle2" fontWeight={600}>
                                    Order Successfully Submitted!
                                </Typography>
                                <Typography variant="body2">
                                    Your order has been successfully submitted. We'll begin processing it right away.
                                    You will be redirected to the orders list in a few seconds.
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
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                        <DoneAllIcon color="primary"/>
                        <Typography variant="h5" fontWeight={600}>
                            Order Summary
                        </Typography>

                        <Tooltip title="Show help">
                            <IconButton
                                size="small"
                                onClick={toggleHelp}
                                color={showHelp ? "primary" : "default"}
                            >
                                <HelpIcon/>
                            </IconButton>
                        </Tooltip>
                    </Box>

                    <Chip
                        label={`Order ID: ${data.id}`}
                        color="primary"
                        variant="outlined"
                        sx={{fontWeight: 500}}
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
                        border: '1px solid',
                        borderColor: theme.palette.primary.lighter || theme.palette.primary.light
                    }}
                >
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                        Ready to Finalize Your Order
                    </Typography>

                    <Typography variant="body2" paragraph>
                        Please review all information below carefully. To finalize your order, click the "Submit Order"
                        button at the bottom of the page.
                    </Typography>

                    <Typography variant="body2">
                        After submission, you'll receive a confirmation email with your order details. If you need to
                        make changes, please do so before submitting.
                    </Typography>
                </Paper>

                {/* Tests Section */}
                <Paper
                    component={motion.div}
                    variants={itemVariants}
                    elevation={0}
                    sx={{
                        mb: 3,
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: hasSectionErrors('tests') ? theme.palette.error.main : theme.palette.divider,
                        ...(hasSectionErrors('tests') && {
                            boxShadow: `0 0 0 1px ${theme.palette.error.main}`
                        })
                    }}
                >
                    <Box
                        sx={{
                            p: 2,
                            bgcolor: hasSectionErrors('tests')
                                ? alpha(theme.palette.error.main, 0.1)
                                : alpha(theme.palette.primary.main, 0.8),
                            color: theme.palette.primary.contrastText,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer'
                        }}
                        onClick={() => toggleSection('tests')}
                    >
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                            <MedicalServices/>
                            <Typography variant="h6" fontWeight={600}>
                                Requested Tests
                            </Typography>
                            <Chip
                                label={getSectionStatus('tests').label}
                                color={getSectionStatus('tests').color}
                                size="small"
                                icon={getSectionStatus('tests').icon}
                                sx={{ml: 1, fontWeight: 500}}
                            />
                        </Box>

                        {expandedSections.tests ? <ExpandLess/> : <ExpandMore/>}
                    </Box>

                    <Collapse in={expandedSections.tests}>
                        <Box sx={{p: 3}}>
                            {errors.tests && (
                                <Alert
                                    severity="error"
                                    sx={{mb: 3, borderRadius: 1}}
                                >
                                    {errors.tests}
                                </Alert>
                            )}

                            {data.tests && data.tests.length > 0 ? (
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell width="5%">#</TableCell>
                                                <TableCell>Test Name</TableCell>
                                                <TableCell width="20%">Test Code</TableCell>
                                                <TableCell width="20%">Turnaround Time</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {data.tests.map((test, index) => (
                                                <TableRow key={`test-${index}`}>
                                                    <TableCell>{index + 1}</TableCell>
                                                    <TableCell>
                                                        <Typography fontWeight="500">
                                                            {test.name}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>{test.code || 'N/A'}</TableCell>
                                                    <TableCell>{test.turnaroundTime || 'N/A'}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Alert severity="warning">
                                    No tests have been selected. Please select at least one test.
                                </Alert>
                            )}

                            <Box sx={{mt: 2, textAlign: 'right'}}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    component="a"
                                    href={route("orders.edit", {order: order.id, step: "test method"})}
                                    sx={{
                                        borderRadius: 2,
                                        textTransform: 'none'
                                    }}
                                >
                                    Edit Tests
                                </Button>
                            </Box>
                        </Box>
                    </Collapse>
                </Paper>

                {/* Patient Details Section */}
                <Paper
                    component={motion.div}
                    variants={itemVariants}
                    elevation={0}
                    sx={{
                        mb: 3,
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: hasSectionErrors('patient') ? theme.palette.error.main : theme.palette.divider,
                        ...(hasSectionErrors('patient') && {
                            boxShadow: `0 0 0 1px ${theme.palette.error.main}`
                        })
                    }}
                >
                    <Box
                        sx={{
                            p: 2,
                            bgcolor: hasSectionErrors('patient')
                                ? alpha(theme.palette.error.main, 0.1)
                                : alpha(theme.palette.info.main, 0.8),
                            color: theme.palette.info.contrastText,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer'
                        }}
                        onClick={() => toggleSection('patient')}
                    >
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                            <Person/>
                            <Typography variant="h6" fontWeight={600}>
                                Patient Details
                            </Typography>
                            <Chip
                                label={getSectionStatus('patient').label}
                                color={getSectionStatus('patient').color}
                                size="small"
                                icon={getSectionStatus('patient').icon}
                                sx={{ml: 1, fontWeight: 500}}
                            />
                        </Box>

                        {expandedSections.patient ? <ExpandLess/> : <ExpandMore/>}
                    </Box>

                    <Collapse in={expandedSections.patient}>
                        <Box sx={{p: 3}}>
                            {errors.patient && (
                                <Alert
                                    severity="error"
                                    sx={{mb: 3, borderRadius: 1}}
                                >
                                    {errors.patient}
                                </Alert>
                            )}

                            {data.patient ? (
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <List dense>
                                            <ListItem>
                                                <ListItemIcon>
                                                    <Person color="info"/>
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary="Full Name"
                                                    secondary={data.patient?.fullName || "Not specified"}
                                                    primaryTypographyProps={{variant: 'body2', color: 'text.secondary'}}
                                                    secondaryTypographyProps={{
                                                        variant: 'body1',
                                                        fontWeight: '500',
                                                        color: errors['patient.fullName'] ? 'error.main' : 'text.primary'
                                                    }}
                                                />
                                            </ListItem>
                                            {errors['patient.fullName'] && (
                                                <Typography variant="caption" color="error" sx={{pl: 9}}>
                                                    {errors['patient.fullName']}
                                                </Typography>
                                            )}

                                            <Divider component="li" variant="inset"/>

                                            <ListItem>
                                                <ListItemIcon>
                                                    <EventNote color="info"/>
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary="Date of Birth"
                                                    secondary={formatDate(data.patient?.dateOfBirth)}
                                                    primaryTypographyProps={{variant: 'body2', color: 'text.secondary'}}
                                                    secondaryTypographyProps={{
                                                        variant: 'body1',
                                                        color: errors['patient.dateOfBirth'] ? 'error.main' : 'text.primary'
                                                    }}
                                                />
                                            </ListItem>
                                            {errors['patient.dateOfBirth'] && (
                                                <Typography variant="caption" color="error" sx={{pl: 9}}>
                                                    {errors['patient.dateOfBirth']}
                                                </Typography>
                                            )}

                                            <Divider component="li" variant="inset"/>

                                            <ListItem>
                                                <ListItemIcon>
                                                    <Assignment color="info"/>
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary="Reference ID"
                                                    secondary={data.patient?.reference_id || "Not specified"}
                                                    primaryTypographyProps={{variant: 'body2', color: 'text.secondary'}}
                                                    secondaryTypographyProps={{variant: 'body1'}}
                                                />
                                            </ListItem>

                                            <Divider component="li" variant="inset"/>

                                            <ListItem>
                                                <ListItemIcon>
                                                    <Person color="info"/>
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary="Gender"
                                                    secondary={(data.patient?.gender * 1) ? "Male" : "Female"}
                                                    primaryTypographyProps={{variant: 'body2', color: 'text.secondary'}}
                                                    secondaryTypographyProps={{
                                                        variant: 'body1',
                                                        color: errors['patient.gender'] ? 'error.main' : 'text.primary'
                                                    }}
                                                />
                                            </ListItem>
                                            {errors['patient.gender'] && (
                                                <Typography variant="caption" color="error" sx={{pl: 9}}>
                                                    {errors['patient.gender']}
                                                </Typography>
                                            )}

                                            <Divider component="li" variant="inset"/>

                                            <ListItem>
                                                <ListItemIcon>
                                                    <MedicalServices color="info"/>
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary="Consanguineous Parents"
                                                    secondary={data.patient?.consanguineousParents ? "Yes" : "No"}
                                                    primaryTypographyProps={{variant: 'body2', color: 'text.secondary'}}
                                                    secondaryTypographyProps={{
                                                        variant: 'body1',
                                                        color: errors['patient.consanguineousParents'] ? 'error.main' : 'text.primary'
                                                    }}
                                                />
                                            </ListItem>
                                            {errors['patient.consanguineousParents'] && (
                                                <Typography variant="caption" color="error" sx={{pl: 9}}>
                                                    {errors['patient.consanguineousParents']}
                                                </Typography>
                                            )}
                                        </List>
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Contact Information
                                        </Typography>

                                        <List dense>
                                            <ListItem>
                                                <ListItemText
                                                    primary="Email"
                                                    secondary={data?.patient?.contact?.email || "Not specified"}
                                                    primaryTypographyProps={{variant: 'body2', color: 'text.secondary'}}
                                                    secondaryTypographyProps={{variant: 'body1'}}
                                                />
                                            </ListItem>

                                            <Divider component="li"/>

                                            <ListItem>
                                                <ListItemText
                                                    primary="Phone"
                                                    secondary={data?.patient?.contact?.phone || "Not specified"}
                                                    primaryTypographyProps={{variant: 'body2', color: 'text.secondary'}}
                                                    secondaryTypographyProps={{variant: 'body1'}}
                                                />
                                            </ListItem>

                                            <Divider component="li"/>

                                            <ListItem>
                                                <ListItemText
                                                    primary="Address"
                                                    secondary={`${data?.patient?.contact?.address || ""}
                                   ${data?.patient?.contact?.city ? ", " + data?.patient?.contact?.city : ""}
                                   ${data?.patient?.contact?.state ? ", " + data?.patient?.contact?.state : ""}
                                   ${data?.patient?.contact?.country?.label ? ", " + data?.patient?.contact?.country?.label : ""}`}
                                                    primaryTypographyProps={{variant: 'body2', color: 'text.secondary'}}
                                                    secondaryTypographyProps={{variant: 'body1'}}
                                                />
                                            </ListItem>
                                        </List>
                                    </Grid>
                                </Grid>
                            ) : (
                                <Alert severity="warning">
                                    Patient information is missing. Please complete the Patient Details section.
                                </Alert>
                            )}

                            <Box sx={{mt: 2, textAlign: 'right'}}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    component="a"
                                    href={route("orders.edit", {order: order.id, step: "patient details"})}
                                    sx={{
                                        borderRadius: 2,
                                        textTransform: 'none'
                                    }}
                                >
                                    Edit Patient Details
                                </Button>
                            </Box>
                        </Box>
                    </Collapse>
                </Paper>

                {/* All Patients Section (if multiple patients) */}
                {patients.length > 1 && (
                    <Paper
                        component={motion.div}
                        variants={itemVariants}
                        elevation={0}
                        sx={{
                            mb: 3,
                            borderRadius: 2,
                            overflow: 'hidden',
                            border: '1px solid',
                            borderColor: theme.palette.divider
                        }}
                    >
                        <Box
                            sx={{
                                p: 2,
                                bgcolor: alpha(theme.palette.secondary.main, 0.8),
                                color: theme.palette.secondary.contrastText,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer'
                            }}
                            onClick={() => toggleSection('allPatients')}
                        >
                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                <Person/>
                                <Typography variant="h6" fontWeight={600}>
                                    All Patients ({patients.length})
                                </Typography>
                                <Chip
                                    label="Multiple Patients"
                                    color="info"
                                    size="small"
                                    sx={{ml: 1, fontWeight: 500}}
                                />
                            </Box>

                            {expandedSections.allPatients ? <ExpandLess/> : <ExpandMore/>}
                        </Box>

                        <Collapse in={expandedSections.allPatients}>
                            <Box sx={{p: 3}}>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>#</TableCell>
                                                <TableCell>Full Name</TableCell>
                                                <TableCell>Date of Birth</TableCell>
                                                <TableCell>Gender</TableCell>
                                                <TableCell>Status</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {patients.map((patient, index) => (
                                                <TableRow key={patient.id}>
                                                    <TableCell>{index + 1}</TableCell>
                                                    <TableCell>
                                                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                                            <Typography fontWeight={patient.id === order.main_patient_id ? 600 : 400}>
                                                                {patient.fullName || patient.full_name}
                                                            </Typography>
                                                            {patient.id === order.main_patient_id && (
                                                                <Chip
                                                                    label="Main Patient"
                                                                    size="small"
                                                                    color="primary"
                                                                    variant="outlined"
                                                                />
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>{formatDate(patient.dateOfBirth)}</TableCell>
                                                    <TableCell>{(patient.gender * 1) ? "Male" : "Female"}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label="Active"
                                                            size="small"
                                                            color="success"
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                <Box sx={{mt: 2, textAlign: 'right'}}>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        component="a"
                                        href={route("orders.edit", {order: order.id, step: "patient details"})}
                                        sx={{
                                            borderRadius: 2,
                                            textTransform: 'none'
                                        }}
                                    >
                                        Edit Patients
                                    </Button>
                                </Box>
                            </Box>
                        </Collapse>
                    </Paper>
                )}

                {/* Patient-Test Assignment Section */}
                {patients.length > 0 && order.order_items && order.order_items.length > 0 && (
                    <Paper
                        component={motion.div}
                        variants={itemVariants}
                        elevation={0}
                        sx={{
                            mb: 3,
                            borderRadius: 2,
                            overflow: 'hidden',
                            border: '1px solid',
                            borderColor: theme.palette.divider
                        }}
                    >
                        <Box
                            sx={{
                                p: 2,
                                bgcolor: alpha(theme.palette.info.main, 0.8),
                                color: theme.palette.info.contrastText,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer'
                            }}
                            onClick={() => toggleSection('patientTestAssignment')}
                        >
                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                <MedicalServices/>
                                <Typography variant="h6" fontWeight={600}>
                                    Patient-Test Assignments
                                </Typography>
                            </Box>

                            {expandedSections.patientTestAssignment ? <ExpandLess/> : <ExpandMore/>}
                        </Box>

                        <Collapse in={expandedSections.patientTestAssignment}>
                            <Box sx={{p: 3}}>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Test Name</TableCell>
                                                <TableCell>Assigned Patients</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {order.order_items.map((orderItem, index) => (
                                                <TableRow key={orderItem.id || index}>
                                                    <TableCell>
                                                        <Typography fontWeight={500}>
                                                            {orderItem.test?.name || orderItem.Test?.name || "Unknown Test"}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1}}>
                                                            {orderItem.patients && orderItem.patients.length > 0 ? (
                                                                orderItem.patients.map((patient) => (
                                                                    <Chip
                                                                        key={patient.id}
                                                                        label={patient.fullName || patient.full_name}
                                                                        size="small"
                                                                        color={patient.id === order.main_patient_id ? "primary" : "default"}
                                                                        variant={patient.id === order.main_patient_id ? "filled" : "outlined"}
                                                                    />
                                                                ))
                                                            ) : (
                                                                <Typography variant="body2" color="text.secondary">
                                                                    No patients assigned
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                <Box sx={{mt: 2, textAlign: 'right'}}>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        component="a"
                                        href={route("orders.edit", {order: order.id, step: "patient test assignment"})}
                                        sx={{
                                            borderRadius: 2,
                                            textTransform: 'none'
                                        }}
                                    >
                                        Edit Assignments
                                    </Button>
                                </Box>
                            </Box>
                        </Collapse>
                    </Paper>
                )}

                {/* Sample Details Section */}
                <Paper
                    component={motion.div}
                    variants={itemVariants}
                    elevation={0}
                    sx={{
                        mb: 3,
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: hasSectionErrors('samples') ? theme.palette.error.main : theme.palette.divider,
                        ...(hasSectionErrors('samples') && {
                            boxShadow: `0 0 0 1px ${theme.palette.error.main}`
                        })
                    }}
                >
                    <Box
                        sx={{
                            p: 2,
                            bgcolor: hasSectionErrors('samples')
                                ? alpha(theme.palette.error.main, 0.1)
                                : alpha(theme.palette.success.main, 0.8),
                            color: theme.palette.success.contrastText,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer'
                        }}
                        onClick={() => toggleSection('samples')}
                    >
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                            <ScienceOutlined/>
                            <Typography variant="h6" fontWeight={600}>
                                Sample Materials
                            </Typography>
                            <Chip
                                label={getSectionStatus('samples').label}
                                color={getSectionStatus('samples').color}
                                size="small"
                                icon={getSectionStatus('samples').icon}
                                sx={{ml: 1, fontWeight: 500}}
                            />
                        </Box>

                        {expandedSections.samples ? <ExpandLess/> : <ExpandMore/>}
                    </Box>

                    <Collapse in={expandedSections.samples}>
                        <Box sx={{p: 3}}>
                            {errors.samples && (
                                <Alert
                                    severity="error"
                                    sx={{mb: 3, borderRadius: 1}}
                                >
                                    {errors.samples}
                                </Alert>
                            )}

                            {data.samples && data.samples.length > 0 ? (
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>#</TableCell>
                                                <TableCell>Sample Type</TableCell>
                                                <TableCell>Sample ID</TableCell>
                                                <TableCell>Patient</TableCell>
                                                <TableCell>Test</TableCell>
                                                <TableCell>Collection Date</TableCell>
                                                <TableCell>Expiration Date</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {data.samples?.map((sample, index) => (
                                                <TableRow
                                                    key={`sample-${index}`}
                                                    sx={{
                                                        bgcolor: Object.keys(errors).some(key =>
                                                            key.startsWith(`samples[${index}]`) ||
                                                            key.startsWith(`samples.${index}`))
                                                            ? alpha(theme.palette.error.main, 0.05)
                                                            : 'transparent'
                                                    }}
                                                >
                                                    <TableCell>{index + 1}</TableCell>
                                                    <TableCell>
                                                        <Typography
                                                            color={Object.keys(errors).some(key =>
                                                                key.includes(`samples[${index}].sample_type`) ||
                                                                key.includes(`samples.${index}.sample_type`))
                                                                ? 'error.main'
                                                                : 'text.primary'
                                                            }
                                                        >
                                                            {sample.sample_type?.name || "Not specified"}
                                                        </Typography>
                                                        {Object.keys(errors).some(key =>
                                                            key.includes(`samples[${index}].sample_type`) ||
                                                            key.includes(`samples.${index}.sample_type`)) && (
                                                            <Typography variant="caption" color="error">
                                                                {errors[`samples[${index}].sample_type`] || errors[`samples.${index}.sample_type`]}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography
                                                            color={Object.keys(errors).some(key =>
                                                                key.includes(`samples[${index}].sampleId`) ||
                                                                key.includes(`samples.${index}.sampleId`))
                                                                ? 'error.main'
                                                                : 'text.primary'
                                                            }
                                                        >
                                                            {sample.sampleId || "Not specified"}
                                                        </Typography>
                                                        {Object.keys(errors).some(key =>
                                                            key.includes(`samples[${index}].sampleId`) ||
                                                            key.includes(`samples.${index}.sampleId`)) && (
                                                            <Typography variant="caption" color="error">
                                                                {errors[`samples[${index}].sampleId`] || errors[`samples.${index}.sampleId`]}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {sample.patient?.fullName || sample.patient?.full_name || "-"}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {sample.order_item?.test?.name || sample.order_item?.Test?.name || "-"}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography
                                                            color={Object.keys(errors).some(key =>
                                                                key.includes(`samples[${index}].collectionDate`) ||
                                                                key.includes(`samples.${index}.collectionDate`))
                                                                ? 'error.main'
                                                                : 'text.primary'
                                                            }
                                                        >
                                                            {formatDate(sample.collectionDate)}
                                                        </Typography>
                                                        {Object.keys(errors).some(key =>
                                                            key.includes(`samples[${index}].collectionDate`) ||
                                                            key.includes(`samples.${index}.collectionDate`)) && (
                                                            <Typography variant="caption" color="error">
                                                                {errors[`samples[${index}].collectionDate`] || errors[`samples.${index}.collectionDate`]}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>{sample?.material ? formatDate(sample.material.expireDate) : "Not specified"}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Alert severity="warning">
                                    No samples have been added. Please add at least one sample.
                                </Alert>
                            )}

                            <Box sx={{mt: 2, textAlign: 'right'}}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    component="a"
                                    href={route("orders.edit", {order: order.id, step: "sample details"})}
                                    sx={{
                                        borderRadius: 2,
                                        textTransform: 'none'
                                    }}
                                >
                                    Edit Samples
                                </Button>
                            </Box>
                        </Box>
                    </Collapse>
                </Paper>

                {/* Clinical Details / Forms Section */}
                <Paper
                    component={motion.div}
                    variants={itemVariants}
                    elevation={0}
                    sx={{
                        mb: 3,
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: hasSectionErrors('forms') ? theme.palette.error.main : theme.palette.divider,
                        ...(hasSectionErrors('forms') && {
                            boxShadow: `0 0 0 1px ${theme.palette.error.main}`
                        })
                    }}
                >
                    <Box
                        sx={{
                            p: 2,
                            bgcolor: hasSectionErrors('forms')
                                ? alpha(theme.palette.error.main, 0.1)
                                : alpha(theme.palette.warning.main, 0.8),
                            color: theme.palette.warning.contrastText,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer'
                        }}
                        onClick={() => toggleSection('forms')}
                    >
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                            <Assignment/>
                            <Typography variant="h6" fontWeight={600}>
                                Clinical Details
                            </Typography>
                            <Chip
                                label={getSectionStatus('forms').label}
                                color={getSectionStatus('forms').color}
                                size="small"
                                icon={getSectionStatus('forms').icon}
                                sx={{ml: 1, fontWeight: 500}}
                            />
                        </Box>

                        {expandedSections.forms ? <ExpandLess/> : <ExpandMore/>}
                    </Box>

                    <Collapse in={expandedSections.forms}>
                        <Box sx={{p: 3}}>
                            {errors.orderForms && (
                                <Alert
                                    severity="error"
                                    sx={{mb: 3, borderRadius: 1}}
                                >
                                    {errors.orderForms}
                                </Alert>
                            )}

                            {data.orderForms && data.orderForms.length > 0 ? (
                                <Grid container spacing={3}>
                                    {data.orderForms.map((orderForm, formIndex) => (
                                        <Grid item xs={12} md={6} key={orderForm.id || formIndex}>
                                            <Paper
                                                variant="outlined"
                                                sx={{
                                                    p: 2,
                                                    height: '100%',
                                                    borderRadius: 1,
                                                    bgcolor: errors[`orderForms[${formIndex}].hasErrors`]
                                                        ? alpha(theme.palette.error.main, 0.05)
                                                        : 'transparent',
                                                    borderColor: errors[`orderForms[${formIndex}].hasErrors`]
                                                        ? theme.palette.error.main
                                                        : theme.palette.divider
                                                }}
                                            >
                                                <Typography
                                                    variant="subtitle2"
                                                    color={errors[`orderForms[${formIndex}].hasErrors`] ? "error" : "text.secondary"}
                                                    gutterBottom
                                                    fontWeight={600}
                                                >
                                                    {orderForm.name || `Form ${formIndex + 1}`}
                                                </Typography>

                                                {errors[`orderForms[${formIndex}].hasErrors`] && (
                                                    <Typography variant="caption" color="error"
                                                                sx={{display: 'block', mb: 1}}>
                                                        {errors[`orderForms[${formIndex}].hasErrors`]}
                                                    </Typography>
                                                )}

                                                <List dense>
                                                    {orderForm.formData && orderForm.formData.map((item, itemIndex) => (
                                                        <React.Fragment key={`form-${formIndex}-item-${itemIndex}`}>
                                                            {itemIndex > 0 && <Divider component="li"/>}
                                                            <ListItem>
                                                                <ListItemText
                                                                    primary={item.label}
                                                                    secondary={item.value || "Not specified"}
                                                                    primaryTypographyProps={{
                                                                        variant: 'body2',
                                                                        color: errors[`orderForms[${formIndex}].formData[${itemIndex}].value`]
                                                                            ? 'error.main'
                                                                            : 'text.secondary'
                                                                    }}
                                                                    secondaryTypographyProps={{
                                                                        variant: 'body1',
                                                                        color: errors[`orderForms[${formIndex}].formData[${itemIndex}].value`]
                                                                            ? 'error.main'
                                                                            : 'text.primary'
                                                                    }}
                                                                />
                                                            </ListItem>
                                                            {errors[`orderForms[${formIndex}].formData[${itemIndex}].value`] && (
                                                                <Typography variant="caption" color="error"
                                                                            sx={{ml: 2}}>
                                                                    {errors[`orderForms[${formIndex}].formData[${itemIndex}].value`]}
                                                                </Typography>
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </List>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            ) : (
                                <Alert severity="warning">
                                    Clinical information is missing. Please complete the Clinical Details section.
                                </Alert>
                            )}

                            {/* Clinical Details Files Section */}
                            {data.files && data.files.length > 0 && (
                                <Box sx={{mt: 3}}>
                                    <Typography
                                        variant="subtitle2"
                                        fontWeight={600}
                                        sx={{mb: 2, display: 'flex', alignItems: 'center', gap: 1}}
                                    >
                                        <FileCopyIcon fontSize="small" color="primary"/>
                                        Uploaded Files ({data.files.length})
                                    </Typography>

                                    <Grid container spacing={2}>
                                        {data.files.map((file, index) => (
                                            <Grid item xs={12} sm={6} md={4} key={index}>
                                                <Box sx={{
                                                    p: 2,
                                                    borderRadius: 1,
                                                    border: '1px solid',
                                                    borderColor: alpha(theme.palette.primary.main, 0.2),
                                                    backgroundColor: alpha(theme.palette.primary.main, 0.03),
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1.5,
                                                    transition: 'all 0.2s',
                                                    '&:hover': {
                                                        borderColor: theme.palette.primary.main,
                                                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                                    }
                                                }}>
                                                    <FileCopyIcon color="primary" sx={{fontSize: 28}}/>
                                                    <Box sx={{flex: 1, minWidth: 0}}>
                                                        <Typography
                                                            variant="body2"
                                                            fontWeight={500}
                                                            sx={{
                                                                mb: 0.5,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            File {index + 1}
                                                        </Typography>
                                                        <Button
                                                            href={"/files/" + file}
                                                            target="_blank"
                                                            variant="text"
                                                            size="small"
                                                            startIcon={<DownloadIcon/>}
                                                            sx={{
                                                                textTransform: 'none',
                                                                fontSize: '0.75rem',
                                                                p: 0,
                                                                minWidth: 0
                                                            }}
                                                        >
                                                            <span style={{
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                                display: 'block',
                                                                maxWidth: '180px'
                                                            }}>
                                                                {file.split('/').pop()}
                                                            </span>
                                                        </Button>
                                                    </Box>
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Box>
                            )}

                            <Box sx={{mt: 2, textAlign: 'right'}}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    component="a"
                                    href={route("orders.edit", {order: order.id, step: "clinical details"})}
                                    sx={{
                                        borderRadius: 2,
                                        textTransform: 'none'
                                    }}
                                >
                                    Edit Clinical Details
                                </Button>
                            </Box>
                        </Box>
                    </Collapse>
                </Paper>

                {/* Consent Section - Updated to use processed consent data */}
                <Paper
                    component={motion.div}
                    variants={itemVariants}
                    elevation={0}
                    sx={{
                        mb: 4,
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: hasSectionErrors('consent') ? theme.palette.error.main : theme.palette.divider,
                        ...(hasSectionErrors('consent') && {
                            boxShadow: `0 0 0 1px ${theme.palette.error.main}`
                        })
                    }}
                >
                    <Box
                        sx={{
                            p: 2,
                            bgcolor: hasSectionErrors('consent')
                                ? alpha(theme.palette.error.main, 0.1)
                                : alpha(theme.palette.primary.main, 0.7),
                            color: theme.palette.primary.contrastText,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer'
                        }}
                        onClick={() => toggleSection('consent')}
                    >
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                            <Assignment/>
                            <Typography variant="h6" fontWeight={600}>
                                Consent Information
                            </Typography>
                            <Chip
                                label={getSectionStatus('consent').label}
                                color={getSectionStatus('consent').color}
                                size="small"
                                icon={getSectionStatus('consent').icon}
                                sx={{ml: 1, fontWeight: 500}}
                            />
                        </Box>

                        {expandedSections.consent ? <ExpandLess/> : <ExpandMore/>}
                    </Box>

                    <Collapse in={expandedSections.consent}>
                        <Box sx={{p: 3}}>
                            {errors.consents && (
                                <Alert
                                    severity="error"
                                    sx={{mb: 3, borderRadius: 1}}
                                >
                                    {errors.consents}
                                </Alert>
                            )}

                            {/* Display processed consent data */}
                            {restConsents && restConsents.length > 0 ? (
                                <List>
                                    {restConsents.map((consent, index) => (
                                        <React.Fragment key={`consent-${index}`}>
                                            {index > 0 && <Divider/>}
                                            <ListItem
                                                sx={{
                                                    py: 2,
                                                    bgcolor: errors[`consents[${index}].value`]
                                                        ? alpha(theme.palette.error.main, 0.05)
                                                        : 'transparent'
                                                }}
                                            >
                                                <ListItemIcon>
                                                    {consent.value ? (
                                                        <CheckCircle color="success"/>
                                                    ) : (
                                                        <ErrorIcon color="error"/>
                                                    )}
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={consent.title}
                                                    secondary={consent.description}
                                                    primaryTypographyProps={{
                                                        variant: 'body1',
                                                        fontWeight: 500,
                                                        color: errors[`consents[${index}].value`] ? 'error.main' : 'text.primary'
                                                    }}
                                                    secondaryTypographyProps={{
                                                        variant: 'body2',
                                                        color: errors[`consents[${index}].value`] ? 'error.main' : 'text.secondary'
                                                    }}
                                                />

                                                <Chip
                                                    label={consent.value ? "Agreed" : "Not Agreed"}
                                                    color={consent.value ? "success" : "error"}
                                                    size="small"
                                                    sx={{fontWeight: 500}}
                                                />
                                            </ListItem>
                                            {errors[`consents[${index}].value`] && (
                                                <Typography variant="caption" color="error"
                                                            sx={{ml: 9, display: 'block', mt: -1, mb: 1}}>
                                                    {errors[`consents[${index}].value`]}
                                                </Typography>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </List>
                            ) : (
                                <Alert severity="warning">
                                    Consent information is missing. Please complete the Consent Form section.
                                </Alert>
                            )}

                            {/* Display consent form files if available */}
                            {consentForm && consentForm.length > 0 && (
                                <Box sx={{mt: 3}}>
                                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                        Consent Form Files
                                    </Typography>
                                    <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1}}>
                                        {consentForm.map((file, index) => (
                                            <Button
                                                key={index}
                                                href={`/files/${file}`}
                                                target="_blank"
                                                variant="outlined"
                                                size="small"
                                                startIcon={<Download/>}
                                                sx={{
                                                    borderRadius: 1,
                                                    textTransform: 'none'
                                                }}
                                            >
                                                Form {index + 1}
                                            </Button>
                                        ))}
                                    </Box>
                                </Box>
                            )}

                            <Box sx={{mt: 2, textAlign: 'right'}}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    component="a"
                                    href={route("orders.edit", {order: order.id, step: "consent form"})}
                                    sx={{
                                        borderRadius: 2,
                                        textTransform: 'none'
                                    }}
                                >
                                    Edit Consent Form
                                </Button>
                            </Box>
                        </Box>
                    </Collapse>
                </Paper>

                {/* Action Buttons */}
                <Box
                    component={motion.div}
                    variants={itemVariants}
                    sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 2,
                        mb: 2
                    }}
                >
                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        startIcon={<Send/>}
                        onClick={handleSubmit}
                        disabled={processing}
                        sx={{
                            borderRadius: 2,
                            px: 4,
                            textTransform: 'none',
                            boxShadow: 'none',
                            '&:hover': {
                                boxShadow: theme.shadows[2]
                            }
                        }}
                    >
                        {processing ? 'Processing...' : 'Submit Order'}
                    </Button>
                </Box>

                {/* Validation message */}
                {Object.keys(errors).length > 0 && (
                    <Alert
                        severity="warning"
                        sx={{
                            mb: 3,
                            borderRadius: 2
                        }}
                    >
                        <Typography variant="subtitle2" fontWeight={600}>
                            Please Correct the Following Issues
                        </Typography>
                        <Typography variant="body2">
                            There are validation errors in your order. Please review the sections marked with errors and
                            make the necessary corrections before submitting.
                        </Typography>
                    </Alert>
                )}
            </Box>
        </EditLayout>
    );
};

export default Finalize;
