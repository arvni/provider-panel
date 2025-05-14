import * as React from "react";
import {
    Button,
    Grid,
    Stack,
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
import RenderFormField from "@/Components/RenderFormField";
import FileUploader from "@/Components/FileUploader";
import {
    Save as SaveIcon,
    NavigateNext as NavigateNextIcon,
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

/**
 * Enhanced ClinicalDetailsForm with improved layout and better UX
 */
const ClinicalDetailsForm = (props) => {
    const theme = useTheme();
    const [showHelp, setShowHelp] = React.useState(false);
    const [expandedForms, setExpandedForms] = React.useState({});
    const [formCompletion, setFormCompletion] = React.useState({});

    // Calculate completion for each form on mount and when data changes
    React.useEffect(() => {
        calculateFormCompletion();
    }, [props.orderForms]);

    // Handle field value changes
    const handleChange = (orderFormId, elId, type) => (e, v) => {
        let newForms = [...props.orderForms];
        let formIndex = props.orderForms.findIndex(item => item.id === orderFormId);
        let elIndex = props.orderForms[formIndex].formData.findIndex(item => item.id === elId);

        // Handle different field types appropriately
        if (formIndex !== -1 && elIndex !== -1) {
            newForms[formIndex].formData[elIndex].value = type === "checkbox" ? v : e.target.value;
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
    const calculateFormCompletion = () => {
        const completion = {};

        props.orderForms.forEach(form => {
            const totalFields = form.formData.length;
            if (totalFields === 0) {
                completion[form.id] = 100;
                return;
            }

            const filledFields = form.formData.filter(field => {
                // Check if field has a value that's not empty
                if (field.value === null || field.value === undefined) return false;
                return !(typeof field.value === 'string' && field.value.trim() === '');

            }).length;

            completion[form.id] = Math.round((filledFields / totalFields) * 100);
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
                    {props.orderForms.map((orderForm) => (
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
                                                {orderForm.formData.map((el, i) => (
                                                    <Grid item xs={12} sm={el.type === 'textarea' ? 12 : 6} key={el.id}>
                                                        <RenderFormField
                                                            field={el}
                                                            onchange={handleChange(orderForm.id, el.id, el.type)}
                                                            defaultValue={el.value ?? null}
                                                        />
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        ) : (
                                            <Typography color="text.secondary" textAlign="center">
                                                No form fields available
                                            </Typography>
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
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Submit Button */}
                    <Grid
                        item
                        xs={12}
                        component={motion.div}
                        variants={itemVariants}
                        sx={{ mt: 2 }}
                    >
                        <Stack
                            direction="row"
                            justifyContent="flex-end"
                            spacing={2}
                        >
                            <Button
                                variant="contained"
                                color="primary"
                                type="submit"
                                startIcon={<SaveIcon />}
                                endIcon={<NavigateNextIcon />}
                                sx={{
                                    borderRadius: 1.5,
                                    textTransform: 'none',
                                    py: 1.5,
                                    px: 3,
                                    boxShadow: 'none',
                                    '&:hover': {
                                        boxShadow: theme.shadows[2]
                                    }
                                }}
                            >
                                Save & Continue
                            </Button>
                        </Stack>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};

export default ClinicalDetailsForm;
