import * as React from "react";
import {
    Grid,
    Typography,
    Box,
    Card,
    CardContent,
    CardHeader,
    IconButton,
    Tooltip,
    Chip,
    Alert,
    Collapse,
    Badge,
    LinearProgress,
    useTheme,
    alpha
} from "@mui/material";
import FormField from "@/Components/FormField";
import FileUploader from "@/Components/FileUploader";
import {
    Help as HelpIcon,
    ExpandMore as ExpandMoreIcon,
    Assignment as AssignmentIcon,
    CloudUpload as CloudUploadIcon,
    MedicalServices as MedicalIcon,
    Info as InfoIcon,
    CheckCircle as CheckCircleIcon,
    Description as DescriptionIcon
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { calculateFormCompletion } from "@/Services/validate";

/**
 * Enhanced ClinicalDetailsForm with FormField integration and improved validation
 */
const ClinicalDetailsForm = (props) => {
    const theme = useTheme();
    const [showHelp, setShowHelp] = React.useState(false);
    const [expandedForms, setExpandedForms] = React.useState({});
    const [formCompletion, setFormCompletion] = React.useState({});

    // Calculate completion for each form on mount and when data changes
    React.useEffect(() => {
        calculateFormCompletionStatus();
    }, [props.orderForms]);

    // Handle field value changes
    const handleChange = (orderFormId, elId, type) => (e, v) => {
        let newForms = [...props.orderForms];
        let formIndex = props.orderForms.findIndex(item => item.id === orderFormId);
        let elIndex = props.orderForms[formIndex].formData.findIndex(item => item.id === elId);

        // Handle different field types appropriately
        if (formIndex !== -1 && elIndex !== -1) {
            // For checkbox and switch, use the second parameter (checked status)
            if (type === "checkbox" || type === "switch") {
                newForms[formIndex].formData[elIndex].value = v;
            }
            // For select fields, use event.target.value
            else if (type === "select" || type === "radio") {
                newForms[formIndex].formData[elIndex].value = e.target.value;
            }
            // For selectSearch, use the actual value
            else if (type === "selectSearch") {
                newForms[formIndex].formData[elIndex].value = v;
            }
            // For standard text inputs
            else {
                newForms[formIndex].formData[elIndex].value = e.target.value;
            }

            props.onChange("orderForms", newForms);
        }
    };

    // Toggle help information
    const toggleHelp = () => {
        setShowHelp(!showHelp);
    };

    // Toggle form expansion
    const toggleFormExpansion = (formId) => () => {
        setExpandedForms(prev => ({
            ...prev,
            [formId]: !prev[formId]
        }));
    };

    // Calculate completion percentage for each form
    const calculateFormCompletionStatus = () => {
        const completion = {};

        props.orderForms.forEach(form => {
            completion[form.id] = calculateFormCompletion(form);
        });

        setFormCompletion(completion);
    };

    // Get overall completion percentage
    const getOverallCompletion = () => {
        const formCompletionValues = Object.values(formCompletion);
        if (formCompletionValues.length === 0) return 0;

        const totalCompletion = formCompletionValues.reduce((acc, val) => acc + val, 0);
        return Math.round(totalCompletion / formCompletionValues.length);
    };

    // Animations
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

    // Count total number of files
    const filesCount = props.files?.length || 0;

    return (
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
                            icon={<InfoIcon />}
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
                                Clinical Details Guidelines
                            </Typography>
                            <Typography variant="body2" paragraph>
                                Please provide as much clinical information as possible to ensure accurate test interpretation.
                            </Typography>
                            <Box component="ul" sx={{ m: 0, pl: 2, mb: 0 }}>
                                <Box component="li" sx={{ mb: 0.5 }}>
                                    <Typography variant="body2">
                                        <strong>Required fields:</strong> Fields marked with an asterisk (*) must be completed
                                    </Typography>
                                </Box>
                                <Box component="li" sx={{ mb: 0.5 }}>
                                    <Typography variant="body2">
                                        <strong>Medical records:</strong> Upload relevant medical records in PDF, JPG, or PNG format
                                    </Typography>
                                </Box>
                                <Box component="li">
                                    <Typography variant="body2">
                                        <strong>Previous tests:</strong> Include any previous test results that may be relevant
                                    </Typography>
                                </Box>
                            </Box>
                        </Alert>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Progress Summary */}
            <Box
                component={motion.div}
                variants={itemVariants}
                sx={{
                    mb: 3,
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 2
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MedicalIcon color="primary" />
                    <Typography variant="h5" fontWeight={600}>
                        Clinical Details
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

                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        width: { xs: '100%', sm: 'auto' }
                    }}
                >
                    <Box sx={{ flexGrow: 1, mr: 1, minWidth: { xs: 0, sm: 200 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                                Overall Completion
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                                {getOverallCompletion()}%
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={getOverallCompletion()}
                            color={getOverallCompletion() === 100 ? "success" : "primary"}
                            sx={{
                                height: 8,
                                borderRadius: 4
                            }}
                        />
                    </Box>

                    <Badge
                        badgeContent={filesCount}
                        color="primary"
                        max={99}
                        sx={{
                            '& .MuiBadge-badge': {
                                fontSize: '0.75rem',
                                height: 20,
                                minWidth: 20
                            }
                        }}
                    >
                        <Chip
                            icon={<DescriptionIcon />}
                            label="Files Attached"
                            color={filesCount > 0 ? "primary" : "default"}
                            variant={filesCount > 0 ? "filled" : "outlined"}
                            sx={{ fontWeight: 500 }}
                        />
                    </Badge>
                </Box>
            </Box>

            <Box component="form" onSubmit={props.onSubmit}>
                <Grid container spacing={3}>
                    {/* Forms Section */}
                    {props.orderForms.map((orderForm, formIndex) => (
                        <Grid
                            item
                            xs={12}
                            key={`form-${orderForm.id}`}
                            component={motion.div}
                            variants={itemVariants}
                        >
                            <Card
                                elevation={0}
                                sx={{
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: theme.palette.divider,
                                    overflow: 'hidden',
                                    transition: 'all 0.3s ease-in-out',
                                    '&:hover': {
                                        boxShadow: theme.shadows[2]
                                    }
                                }}
                            >
                                <CardHeader
                                    title={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <AssignmentIcon color="primary" />
                                            <Typography variant="h6" fontWeight={600}>
                                                {orderForm.name} Form
                                            </Typography>
                                        </Box>
                                    }
                                    action={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {formCompletion[orderForm.id] === 100 ? (
                                                <Chip
                                                    icon={<CheckCircleIcon />}
                                                    label="Complete"
                                                    color="success"
                                                    size="small"
                                                    sx={{ fontWeight: 500 }}
                                                />
                                            ) : (
                                                <Chip
                                                    label={`${formCompletion[orderForm.id]}% Complete`}
                                                    color="primary"
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontWeight: 500 }}
                                                />
                                            )}

                                            {orderForm.formData.length > 0 && (
                                                <IconButton
                                                    onClick={toggleFormExpansion(orderForm.id)}
                                                    aria-expanded={expandedForms[orderForm.id]}
                                                    aria-label="show more"
                                                    size="small"
                                                >
                                                    <ExpandMoreIcon
                                                        sx={{
                                                            transform: expandedForms[orderForm.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                                                            transition: 'transform 0.3s'
                                                        }}
                                                    />
                                                </IconButton>
                                            )}
                                        </Box>
                                    }
                                    sx={{
                                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                                        borderBottom: '1px solid',
                                        borderColor: theme.palette.divider,
                                        py: 1.5
                                    }}
                                />

                                <Collapse in={expandedForms[orderForm.id] !== false}>
                                    <CardContent sx={{ p: 3 }}>
                                        {orderForm.formData.length > 0 ? (
                                            <Grid container spacing={2}>
                                                {orderForm.formData.map((el, fieldIndex) => (
                                                    <Grid
                                                        item
                                                        xs={12}
                                                        sm={el.type === 'textarea' ? 12 : 6}
                                                        key={el.id}
                                                    >
                                                        <FormField
                                                            field={{
                                                                type: el.type,
                                                                name: `field-${el.id}`,
                                                                label: el.label,
                                                                value: el.value,
                                                                required: el.required,
                                                                disabled: el.disabled,
                                                                placeholder: el.placeholder,
                                                                helpText: el.description,
                                                                options: el.options,
                                                                rows: el.type === 'textarea' ? 4 : undefined,
                                                                min: el.min,
                                                                max: el.max,
                                                                step: el.step,
                                                                // Additional props specific to certain field types
                                                                ...el.props
                                                            }}
                                                            onchange={handleChange(orderForm.id, el.id, el.type)}
                                                            errors={props.errors}
                                                            errorPath={`orderForms[${formIndex}].formData[${fieldIndex}].value`}
                                                            size="medium"
                                                        />
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        ) : (
                                            <Typography color="text.secondary" textAlign="center">
                                                No form fields available
                                            </Typography>
                                        )}

                                        {/* Form-level errors */}
                                        {props.errors && props.errors[`orderForms[${formIndex}].hasErrors`] && (
                                            <Alert
                                                severity="error"
                                                sx={{ mt: 2 }}
                                            >
                                                {props.errors[`orderForms[${formIndex}].hasErrors`]}
                                            </Alert>
                                        )}
                                    </CardContent>
                                </Collapse>
                            </Card>
                        </Grid>
                    ))}

                    {/* File Upload Section */}
                    <Grid
                        item
                        xs={12}
                        component={motion.div}
                        variants={itemVariants}
                    >
                        <Card
                            elevation={0}
                            sx={{
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: theme.palette.divider,
                                overflow: 'hidden'
                            }}
                        >
                            <CardHeader
                                title={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CloudUploadIcon color="primary" />
                                        <Typography variant="h6" fontWeight={600}>
                                            Medical Records & Test Results
                                        </Typography>
                                    </Box>
                                }
                                sx={{
                                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                                    borderBottom: '1px solid',
                                    borderColor: theme.palette.divider,
                                    py: 1.5
                                }}
                            />

                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    Upload any relevant medical records, previous test results, or clinical documents that may assist in the interpretation of the tests.
                                </Typography>

                                <FileUploader
                                    title="Medical Records"
                                    onChange={props.onFileChanged}
                                    defaultValues={props.files}
                                    name="files"
                                />

                                {/* File errors */}
                                {props.errors && props.errors.files && (
                                    <Alert
                                        severity="error"
                                        sx={{ mt: 2 }}
                                    >
                                        {props.errors.files}
                                    </Alert>
                                )}

                                {/* Individual file errors */}
                                {props.errors &&
                                    props.files &&
                                    props.files.map((file, index) => (
                                        props.errors[`files[${index}]`] && (
                                            <Alert
                                                key={`file-error-${index}`}
                                                severity="error"
                                                sx={{ mt: 1 }}
                                            >
                                                {props.errors[`files[${index}]`]}
                                            </Alert>
                                        )
                                    ))
                                }
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};

export default ClinicalDetailsForm;
