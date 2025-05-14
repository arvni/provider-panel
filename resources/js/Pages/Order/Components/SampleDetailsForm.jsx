import * as React from "react";
import { useState } from "react";
import {
    Alert,
    Box,
    Button,
    Grid,
    Paper,
    Stack,
    Typography,
    Divider
} from "@mui/material";
import {
    Add,
    ErrorOutline
} from "@mui/icons-material";
import axios from "axios";
import SampleRow from "./SampleRow"; // Import the SampleRow component

/**
 * SampleDetailsForm component for managing sample information
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
                               samples,
                               onChange,
                               onSubmit,
                               sampleTypes,
                               errors,
                               user,
                               setError,
                               clearErrors,
                               disabled = false
                           }) => {
    const [validatingIds, setValidatingIds] = useState({});
    const [expandedSamples, setExpandedSamples] = useState({});

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
        const { name, value } = e.target;

        let newSamples = [...samples];
        let newValue = value;

        // Handle special case for sample_type which needs to find the full object
        if (name === "sample_type") {
            newValue = sampleTypes.find((sampleType) => sampleType.id == value);
        }

        // Update or create the sample
        if (newSamples[index]) {
            newSamples[index] = {
                ...samples[index],
                [name]: newValue
            };
        } else {
            newSamples[index] = { [name]: newValue };
        }

        onChange("samples", newSamples);
    };

    /**
     * Add a new empty sample
     */
    const addSample = () => {
        const newSamples = [...samples, {}];
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

            // Clear errors related to this sample
            const errorKeys = Object.keys(errors);
            const sampleErrorKeys = errorKeys.filter(key => key.startsWith(`samples.${index}`));
            if (sampleErrorKeys.length > 0) {
                sampleErrorKeys.forEach(key => clearErrors(key));
            }
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

        // Check for empty required fields
        let hasErrors = false;

        samples.forEach((sample, index) => {
            // Check for required sample type
            if (!sample.sample_type) {
                setError(`samples.${index}.sample_type`, 'Sample type is required');
                hasErrors = true;
            }

            // Check for required sample ID if applicable
            if (sample.sample_type?.sampleIdRequired && !sample.sampleId) {
                setError(`samples.${index}.sampleId`, 'Sample ID is required');
                hasErrors = true;
            }

            // Check for required collection date
            if (!sample.collectionDate) {
                setError(`samples.${index}.collectionDate`, 'Collection date is required');
                hasErrors = true;
            }
        });

        if (!hasErrors && Object.keys(errors).length === 0) {
            onSubmit();
        } else if (Object.keys(errors).length > 0) {
            // Find the first sample with error and expand it
            for (let i = 0; i < samples.length; i++) {
                const sampleErrorKeys = Object.keys(errors).filter(key =>
                    key.startsWith(`samples.${i}`) || key === 'samples'
                );

                if (sampleErrorKeys.length > 0) {
                    setExpandedSamples(prev => ({
                        ...prev,
                        [i]: true
                    }));
                    break;
                }
            }
        }
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
                setValidatingIds(prev => ({ ...prev, [index]: true }));

                // Clear previous errors
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
                setValidatingIds(prev => ({ ...prev, [index]: false }));
            } catch (error) {
                // Set error message
                setError(`samples.${index}.sampleId`, error.response?.data?.message || 'Invalid Sample ID');

                // Clear validating state
                setValidatingIds(prev => ({ ...prev, [index]: false }));
            }
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} id="sample-details-form">
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Typography variant="h6" fontWeight="500" sx={{ mb: 1 }}>
                        Diagnostics Analysis
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Please document all material details accurately. All fields marked with * are required.
                    </Typography>

                    {/* General samples error */}
                    {errors.samples && (
                        <Alert
                            severity="error"
                            sx={{ mb: 3 }}
                            icon={<ErrorOutline />}
                        >
                            {errors.samples}
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
                                mb: 3
                            }}
                        >
                            <Typography color="text.secondary" sx={{ mb: 2 }}>
                                No samples added yet
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={addSample}
                                disabled={disabled}
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
                                />
                            ))}

                            <Box sx={{ textAlign: 'center', mt: 2, mb: 4 }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<Add />}
                                    onClick={addSample}
                                    disabled={disabled}
                                >
                                    Add Another Sample
                                </Button>
                            </Box>

                            <Divider sx={{ my: 3 }} />
                        </>
                    )}
                </Grid>

                {/* Submit buttons */}
                <Grid item xs={12}>
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        justifyContent="flex-end"
                    >
                        <Button
                            variant="contained"
                            type="submit"
                            disabled={disabled || samples.length === 0}
                            color="primary"
                            sx={{ minWidth: 150 }}
                        >
                            {disabled ? 'Saving...' : 'Save & Continue'}
                        </Button>
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
};

export default SampleDetailsForm;
