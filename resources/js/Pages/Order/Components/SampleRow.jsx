import React from "react";
import {
    Box,
    Grid,
    IconButton,
    TextField,
    Paper,
    InputAdornment,
    Tooltip,
    Typography,
    CircularProgress,
    Fade,
    Collapse,
    Stack
} from "@mui/material";
import MenuItem from "@mui/material/MenuItem";
import {
    Delete,
    Science,
    Badge,
    CalendarMonth,
    CheckCircle,
    Error as ErrorIcon,
    ExpandMore,
    ExpandLess,
    NoteAlt
} from "@mui/icons-material";

/**
 * SampleRow component for rendering a single sample in the form
 *
 * @param {Object} props Component props
 * @param {Object} props.sample Sample data
 * @param {number} props.index Sample index in array
 * @param {Function} props.handleChange Handler for field changes
 * @param {Function} props.checkSampleId Handler for sample ID validation
 * @param {Function} props.deleteSample Handler for deleting a sample
 * @param {Object} props.errors Validation errors
 * @param {Array} props.sampleTypes Available sample types
 * @param {Object} props.validatingIds Map of sample indices being validated
 * @param {boolean} props.isExpanded Whether the sample details are expanded
 * @param {Function} props.toggleExpand Function to toggle expansion
 * @param {boolean} props.disabled Whether the inputs are disabled
 * @returns {JSX.Element} Rendered component
 */
const SampleRow = ({
                       sample,
                       index,
                       handleChange,
                       checkSampleId,
                       deleteSample,
                       errors,
                       sampleTypes,
                       validatingIds = {},
                       isExpanded = false,
                       toggleExpand,
                       disabled = false
                   }) => {
    /**
     * Check if a field has an error
     *
     * @param {string} field Field name
     * @returns {boolean} True if field has an error
     */
    const hasError = (field) => {
        const errorKey = `samples.${index}.${field}`;
        return !!errors[errorKey];
    };

    /**
     * Get error message for a field
     *
     * @param {string} field Field name
     * @returns {string} Error message or empty string
     */
    const getErrorMessage = (field) => {
        const errorKey = `samples.${index}.${field}`;
        return errors[errorKey] || '';
    };

    /**
     * Handle deletion with confirmation
     *
     * @param {Event} e Click event
     */
    const handleDelete = (e) => {
        e.stopPropagation();
        deleteSample(index)();
    };

    // Determine if the sample has any errors
    const hasErrors = hasError('sample_type') || hasError('sampleId') || hasError('collectionDate');

    return (
        <Paper
            variant="outlined"
            sx={{
                mb: 2,
                borderRadius: 1,
                overflow: 'hidden',
                borderColor: hasErrors ? 'error.main' : 'divider',
                transition: 'all 0.2s ease'
            }}
            id={`field-samples.${index}`}
        >
            {/* Sample header - always visible */}
            <Box
                sx={{
                    p: 2,
                    bgcolor: isExpanded ? 'primary.light' : 'grey.100',
                    color: isExpanded ? 'primary.contrastText' : 'text.primary',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    '&:hover': {
                        bgcolor: isExpanded ? 'primary.main' : 'grey.200',
                    },
                    transition: 'background-color 0.2s'
                }}
                onClick={toggleExpand}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isExpanded ? <ExpandLess /> : <ExpandMore />}
                    <Typography variant="subtitle1" fontWeight="500">
                        Sample #{index + 1}
                        {sample?.sample_type?.name && ` - ${sample.sample_type.name}`}
                    </Typography>

                    {hasErrors && (
                        <Tooltip title="This sample has errors that need attention">
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                                <ErrorIcon color="error" fontSize="small" />
                            </Box>
                        </Tooltip>
                    )}
                </Box>

                <Stack direction="row" spacing={1}>
                    {/* Additional actions can be added here */}
                    <IconButton
                        size="small"
                        color="inherit"
                        onClick={handleDelete}
                        disabled={disabled}
                        aria-label="Delete sample"
                    >
                        <Delete />
                    </IconButton>
                </Stack>
            </Box>

            {/* Sample fields - expandable */}
            <Collapse in={isExpanded} timeout="auto">
                <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
                    <Grid container spacing={3}>
                        {/* Sample Type */}
                        <Grid item xs={12} md={4}>
                            <TextField
                                select
                                fullWidth
                                onChange={(e) => handleChange(index)(e)}
                                name="sample_type"
                                value={sample?.sample_type?.id || ''}
                                label="Sample Type"
                                required
                                error={hasError('sample_type')}
                                helperText={getErrorMessage('sample_type')}
                                disabled={disabled}
                                id={`field-samples.${index}.sample_type`}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Science color="primary" />
                                        </InputAdornment>
                                    ),
                                }}
                            >
                                {sampleTypes?.map(sampleType => (
                                    <MenuItem value={sampleType.id} key={sampleType.id}>
                                        {sampleType.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        {/* Sample ID */}
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                onChange={(e) => handleChange(index)(e)}
                                value={sample?.sampleId || ''}
                                name="sampleId"
                                label="Sample ID"
                                onBlur={(e) => checkSampleId(sample.id, index)(e)}
                                error={hasError('sampleId')}
                                helperText={getErrorMessage('sampleId')}
                                required={sample?.sample_type?.sampleIdRequired}
                                disabled={disabled || validatingIds[index]}
                                id={`field-samples.${index}.sampleId`}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Badge color="primary" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: validatingIds[index] ? (
                                        <InputAdornment position="end">
                                            <CircularProgress size={20} />
                                        </InputAdornment>
                                    ) : sample?.sampleId && !hasError('sampleId') ? (
                                        <InputAdornment position="end">
                                            <Fade in={true}>
                                                <CheckCircle color="success" fontSize="small" />
                                            </Fade>
                                        </InputAdornment>
                                    ) : null
                                }}
                            />
                        </Grid>

                        {/* Collection Date */}
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                onChange={(e) => handleChange(index)(e)}
                                type="date"
                                name="collectionDate"
                                value={sample?.collectionDate || ''}
                                label="Collection Date"
                                required
                                error={hasError('collectionDate')}
                                helperText={getErrorMessage('collectionDate')}
                                disabled={disabled}
                                id={`field-samples.${index}.collectionDate`}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <CalendarMonth color="primary" />
                                        </InputAdornment>
                                    ),
                                }}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </Grid>

                        {/* Optional Notes Field */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                onChange={(e) => handleChange(index)(e)}
                                value={sample?.notes || ''}
                                name="notes"
                                label="Additional Notes"
                                placeholder="Enter any additional information about this sample"
                                disabled={disabled}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <NoteAlt color="primary" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </Collapse>
        </Paper>
    );
};

export default SampleRow;
