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
    Stack,
    useTheme
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
import { motion } from "framer-motion";

/**
 * Enhanced SampleRow component with improved validation handling
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
 * @param {Array} props.patients Available patients
 * @param {Array} props.orderItems Available order items (tests)
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
                       disabled = false,
                       patients = [],
                       orderItems = []
                   }) => {
    const theme = useTheme();

    /**
     * Check if a field has an error
     * Handles both error formats: samples[0].field and samples.0.field
     *
     * @param {string} field Field name
     * @returns {boolean} True if field has an error
     */
    const hasError = (field) => {
        const bracketErrorKey = `samples[${index}].${field}`;
        const dotErrorKey = `samples.${index}.${field}`;
        return !!errors[bracketErrorKey] || !!errors[dotErrorKey];
    };

    /**
     * Get error message for a field
     * Handles both error formats: samples[0].field and samples.0.field
     *
     * @param {string} field Field name
     * @returns {string} Error message or empty string
     */
    const getErrorMessage = (field) => {
        const bracketErrorKey = `samples[${index}].${field}`;
        const dotErrorKey = `samples.${index}.${field}`;
        return errors[bracketErrorKey] || errors[dotErrorKey] || '';
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

    // Animation for content appearance
    const contentVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 0.3 }
        }
    };

    return (
        <Paper
            variant="outlined"
            sx={{
                mb: 2,
                borderRadius: 2,
                overflow: 'hidden',
                borderColor: hasErrors ? 'error.main' : 'divider',
                transition: 'all 0.2s ease',
                ...(hasErrors && {
                    boxShadow: `0 0 0 1px ${theme.palette.error.main}`
                })
            }}
            id={`field-samples.${index}`}
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
        >
            {/* Sample header - always visible */}
            <Box
                sx={{
                    p: 2,
                    bgcolor: isExpanded
                        ? hasErrors
                            ? theme.palette.error.light
                            : theme.palette.primary.light
                        : hasErrors
                            ? theme.palette.error.lighter || '#FFEBEE'
                            : 'grey.100',
                    color: isExpanded ? 'primary.contrastText' : 'text.primary',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    '&:hover': {
                        bgcolor: isExpanded
                            ? hasErrors
                                ? theme.palette.error.main
                                : theme.palette.primary.main
                            : hasErrors
                                ? theme.palette.error.light
                                : 'grey.200',
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
                <Box
                    sx={{ p: 3, bgcolor: 'background.paper' }}
                    component={motion.div}
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                >
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
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 1.5,
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': {
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                        },
                                        '&.Mui-focused': {
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        }
                                    }
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
                                    ) : null,
                                    sx: {
                                        borderRadius: 1.5,
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': {
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                        },
                                        '&.Mui-focused': {
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        }
                                    }
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 1.5,
                                    }
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
                                    sx: {
                                        borderRadius: 1.5,
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': {
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                        },
                                        '&.Mui-focused': {
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        }
                                    }
                                }}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 1.5,
                                    }
                                }}
                            />
                        </Grid>

                        {/* Test Selection (if order items available) */}
                        {orderItems.length > 0 && (
                            <Grid item xs={12} md={6}>
                                <TextField
                                    select
                                    fullWidth
                                    onChange={(e) => handleChange(index)(e)}
                                    name="order_item_id"
                                    value={sample?.order_item_id || ''}
                                    label="Test (Optional)"
                                    disabled={disabled}
                                    helperText="Select which test this sample is for"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Science color="primary" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 1.5,
                                        }
                                    }}
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    {orderItems.map(orderItem => (
                                        <MenuItem value={orderItem.id} key={orderItem.id}>
                                            {orderItem.test?.name || orderItem.Test?.name || 'Unknown Test'}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                        )}

                        {/* Patient Selection (filtered by selected test) */}
                        {patients.length > 0 && (
                            <Grid item xs={12} md={6}>
                                <TextField
                                    select
                                    fullWidth
                                    onChange={(e) => handleChange(index)(e)}
                                    name="patient_id"
                                    value={sample?.patient_id || ''}
                                    label="Patient (Optional)"
                                    disabled={disabled || !sample?.order_item_id}
                                    helperText={
                                        !sample?.order_item_id
                                            ? "Please select a test first"
                                            : "Select which patient this sample belongs to (filtered by test)"
                                    }
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Science color="primary" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 1.5,
                                        }
                                    }}
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    {(() => {
                                        // Filter patients based on selected test
                                        if (sample?.order_item_id) {
                                            const selectedOrderItem = orderItems.find(item => item.id === sample.order_item_id);
                                            if (selectedOrderItem && selectedOrderItem.patients && selectedOrderItem.patients.length > 0) {
                                                // Show only patients assigned to this test
                                                return selectedOrderItem.patients.map(patient => (
                                                    <MenuItem value={patient.id} key={patient.id}>
                                                        {patient.fullName || patient.full_name}
                                                        {selectedOrderItem.patients.find(p => p.id === patient.id && p.pivot?.is_main) && ' (Main)'}
                                                    </MenuItem>
                                                ));
                                            }
                                        }
                                        // If no test selected or no patients for that test, show all patients
                                        return patients.map(patient => (
                                            <MenuItem value={patient.id} key={patient.id}>
                                                {patient.fullName || patient.full_name}
                                            </MenuItem>
                                        ));
                                    })()}
                                </TextField>
                            </Grid>
                        )}

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
                                    sx: {
                                        borderRadius: 1.5,
                                        fontFamily: "'Roboto', sans-serif",
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': {
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                        },
                                        '&.Mui-focused': {
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        }
                                    }
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 1.5,
                                    }
                                }}
                            />
                        </Grid>
                    </Grid>

                    {/* Sample-level errors (for errors that don't belong to a specific field) */}
                    {(hasError('hasErrors') || errors[`samples[${index}]`] || errors[`samples.${index}`]) && (
                        <Fade in={true}>
                            <Box sx={{ mt: 2 }}>
                                <Typography
                                    color="error"
                                    variant="body2"
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        p: 1,
                                        bgcolor: theme.palette.error.lighter || '#FFEBEE',
                                        borderRadius: 1
                                    }}
                                >
                                    <ErrorIcon fontSize="small" />
                                    {getErrorMessage('hasErrors') || errors[`samples[${index}]`] || errors[`samples.${index}`]}
                                </Typography>
                            </Box>
                        </Fade>
                    )}
                </Box>
            </Collapse>
        </Paper>
    );
};

export default SampleRow;
