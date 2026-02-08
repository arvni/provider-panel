import * as React from "react";
import {useState} from "react";
import {
    Alert,
    Box,
    Button,
    Grid,
    Paper,
    Typography,
    IconButton,
    Tooltip
} from "@mui/material";
import {
    Add,
    ErrorOutline,
    Science as ScienceIcon,
    Info as InfoIcon,
    Help as HelpIcon,
} from "@mui/icons-material";
import axios from "axios";
import SampleRow from "./SampleRow"; // Import the SampleRow component
import {motion, AnimatePresence} from "framer-motion";

/**
 * Enhanced SampleDetailsForm component with improved validation
 *
 * @param {Object} props Component props
 * @param {Array} props.samples Sample data array
 * @param {Function} props.onChange Handler for form changes
 * @param {Function} props.onSubmit Form submission handler
 * @param {Array} props.sampleTypes Available sample types
 * @param {Object} props.errors Form validation errors
 * @param {string|number} props.user Current user ID
 * @param {Function} props.setError Function to set form errors
 * @param {Function} props.clearErrors Function to clear form errors
 * @param {boolean} props.disabled Whether the form is disabled during submission
 * @returns {JSX.Element} Rendered component
 */
const SampleDetailsForm = ({
                               samples = [],
                               onChange,
                               onSubmit,
                               sampleTypes = [],
                               errors = {},
                               user,
                               setError,
                               clearErrors,
                               disabled = false,
                               patients = [],
                               orderItems = []
                           }) => {
    const [validatingIds, setValidatingIds] = useState({});
    const [expandedSamples, setExpandedSamples] = useState({});
    const [showHelp, setShowHelp] = useState(false);

    // Toggle help information
    const toggleHelp = () => {
        setShowHelp(!showHelp);
    };

    /**
     * Toggle the expansion state of a sample
     *
     * @param {number} index Sample index
     */
    const toggleSampleExpansion = (index) => {
        setExpandedSamples(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    /**
     * Handle input changes for a specific sample
     *
     * @param {number} index Sample index
     * @returns {Function} Change handler
     */
    const handleChange = (index) => (e) => {
        const {name, value} = e.target;

        let newSamples = [...samples];
        let newValue = value;
        let newExtraUpdate = [];
        // Handle special case for sample_type which needs to find the full object
        if (name === "sample_type") {
            newValue = sampleTypes.find((sampleType) => sampleType.id == value);
            newExtraUpdate["sampleId"] = "";
        }

        // Update or create the sample
        if (newSamples[index]) {
            newSamples[index] = {
                ...samples[index],
                ...newExtraUpdate,
                [name]: newValue
            };
        } else {
            newSamples[index] = {[name]: newValue};
        }

        onChange("samples", newSamples);

        // Clear specific error when a field is updated
        if (name) {
            // Handle both error formats: samples[0].field and samples.0.field
            clearErrors(`samples[${index}].${name}`);
            clearErrors(`samples.${index}.${name}`);
        }
    };

    /**
     * Add a new empty sample
     */
    const addSample = () => {
        const newSample = {
            sample_type: null,
            sampleId: "",
            collectionDate: "",
            pooling: false,
            notes: ""
        };

        const newSamples = [...samples, newSample];
        onChange("samples", newSamples);

        // Auto-expand the newly added sample
        setTimeout(() => {
            setExpandedSamples(prev => ({
                ...prev,
                [newSamples.length - 1]: true
            }));
        }, 100);
    };

    /**
     * Delete a sample at specified index
     *
     * @param {number} index Sample index
     * @returns {Function} Click handler
     */
    const deleteSample = (index) => () => {
        // Ask for confirmation before deleting
        if (window.confirm("Are you sure you want to remove this sample?")) {
            const newSamples = [...samples];
            newSamples.splice(index, 1);
            onChange("samples", newSamples);

            // Clear errors related to this sample - handle both error formats
            Object.keys(errors).forEach(key => {
                if (key.startsWith(`samples[${index}]`) || key.startsWith(`samples.${index}`)) {
                    clearErrors(key);
                }
            });
        }
    };

    /**
     * Handle form submission
     *
     * @param {Event} e Form event
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        e.stopPropagation();

        onSubmit(e);
    };

    /**
     * Validate sample ID against the API
     *
     * @param {string|number} id Sample ID
     * @param {number} index Sample index
     * @returns {Function} Blur handler
     */
    const checkSampleId = (id, index) => async (e) => {
        // If the field is required, validate it
        if (e.target.required && e.target.value) {
            try {
                // Set validating state
                setValidatingIds(prev => ({...prev, [index]: true}));

                // Clear previous errors - handle both error formats
                clearErrors(`samples[${index}].sampleId`);
                clearErrors(`samples.${index}.sampleId`);

                // Build URL params
                const params = new URLSearchParams({
                    id: id || '',
                    sampleId: e.target.value,
                    user: user || ''
                }).toString();

                // Call API to validate
                const response = await axios.get(`${route("api.check_materials")}?${params}`);

                // Validation successful
                console.log(response.data);

                // Clear validating state
                setValidatingIds(prev => ({...prev, [index]: false}));
            } catch (error) {
                // Set error message - use the bracket format for consistency with validation service
                setError(`samples[${index}].sampleId`, error.response?.data?.message || 'Invalid Sample ID');

                // Clear validating state
                setValidatingIds(prev => ({...prev, [index]: false}));
            }
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
        <Box
            component={motion.div}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            sx={{mt: 2}}
        >
            {/* Help information */}
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
                            icon={<InfoIcon/>}
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
                                Sample Details Guidelines
                            </Typography>
                            <Typography variant="body2" paragraph>
                                Please provide detailed information about each sample being submitted.
                            </Typography>
                            <Box component="ul" sx={{m: 0, pl: 2, mb: 0}}>
                                <Box component="li" sx={{mb: 0.5}}>
                                    <Typography variant="body2">
                                        <strong>Sample Type:</strong> Select the type of sample being submitted
                                    </Typography>
                                </Box>
                                <Box component="li" sx={{mb: 0.5}}>
                                    <Typography variant="body2">
                                        <strong>Sample ID:</strong> Provide a unique identifier for each sample
                                    </Typography>
                                </Box>
                                <Box component="li">
                                    <Typography variant="body2">
                                        <strong>Collection Date:</strong> When the sample was collected
                                    </Typography>
                                </Box>
                            </Box>
                        </Alert>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header with title and info button */}
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
                    <ScienceIcon color="primary"/>
                    <Typography variant="h5" fontWeight={600}>
                        Sample Details
                    </Typography>
                </Box>

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

            <Box component="form" onSubmit={handleSubmit} id="sample-details-form">
                <Grid container spacing={3}>
                    <Grid
                        item
                        xs={12}
                        component={motion.div}
                        variants={itemVariants}
                    >
                        <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
                            Please document all material details accurately. All fields marked with * are required.
                        </Typography>

                        {/* General samples error */}
                        {(errors.samples || errors['samples']) && (
                            <Alert
                                severity="error"
                                sx={{
                                    mb: 3,
                                    borderRadius: 2
                                }}
                                icon={<ErrorOutline/>}
                            >
                                {errors.samples || errors['samples']}
                            </Alert>
                        )}

                        {/* No samples message */}
                        {samples.length === 0 && (
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 3,
                                    textAlign: 'center',
                                    borderStyle: 'dashed',
                                    borderWidth: 1,
                                    borderColor: 'divider',
                                    mb: 3,
                                    borderRadius: 2
                                }}
                            >
                                <Typography color="text.secondary" sx={{mb: 2}}>
                                    No samples added yet
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<Add/>}
                                    onClick={addSample}
                                    disabled={disabled}
                                    sx={{
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        py: 1,
                                        px: 3
                                    }}
                                >
                                    Add First Sample
                                </Button>
                            </Paper>
                        )}

                        {/* Sample list using SampleRow component for each sample */}
                        {samples.length > 0 && (
                            <>
                                {samples.map((sample, index) => (
                                    <SampleRow
                                        key={`sample-${index}`}
                                        sample={sample}
                                        index={index}
                                        handleChange={handleChange}
                                        checkSampleId={checkSampleId}
                                        deleteSample={deleteSample}
                                        errors={errors}
                                        sampleTypes={sampleTypes}
                                        validatingIds={validatingIds}
                                        isExpanded={expandedSamples[index]}
                                        toggleExpand={() => toggleSampleExpansion(index)}
                                        disabled={disabled}
                                        patients={patients}
                                        orderItems={orderItems}
                                    />
                                ))}

                                <Box
                                    sx={{
                                        textAlign: 'center',
                                        mt: 3,
                                        mb: 3
                                    }}
                                    component={motion.div}
                                    variants={itemVariants}
                                >
                                    <Button
                                        variant="outlined"
                                        startIcon={<Add/>}
                                        onClick={addSample}
                                        disabled={disabled}
                                        sx={{
                                            borderRadius: 2,
                                            textTransform: 'none',
                                            py: 1,
                                            px: 3
                                        }}
                                    >
                                        Add Another Sample
                                    </Button>
                                </Box>
                            </>
                        )}
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};

export default SampleDetailsForm;
