import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    FormHelperText,
    Grid,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Slide,
    Stack,
    TextField,
    Typography,
    Alert,
    Chip
} from "@mui/material";
import {
    Save,
    Cancel,
    Schedule,
    LocalShipping,
    Notes,
    Close,
    MoreVert,
    AccessTime,
    Receipt,
    CheckCircle,
    Event
} from "@mui/icons-material";

/**
 * Slide transition for dialog
 */
const SlideTransition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

/**
 * Available statuses for collect requests
 */
const collectRequestStatuses = [
    {
        label: "Requested",
        value: "requested",
        color: "warning",
        icon: <Receipt fontSize="small" />,
        description: "Collection has been requested but not yet scheduled"
    },
    {
        label: "Scheduled",
        value: "scheduled",
        color: "info",
        icon: <Schedule fontSize="small" />,
        description: "Collection has been scheduled for pickup"
    },
    {
        label: "Picked up",
        value: "picked up",
        color: "secondary",
        icon: <LocalShipping fontSize="small" />,
        description: "Samples have been picked up and are in transit"
    },
    {
        label: "Received",
        value: "received",
        color: "success",
        icon: <CheckCircle fontSize="small" />,
        description: "Samples have been received at the lab"
    },
];

/**
 * Collection Request Form component
 * Dialog for editing collection request details
 *
 * @param {Object} props Component props
 * @param {Object} props.values Form values
 * @param {Function} props.setValues Update form values function
 * @param {Function} props.cancel Cancel handler
 * @param {Function} props.submit Submit handler
 * @param {Object} props.errors Validation errors
 * @param {boolean} props.open Dialog open state
 * @param {Object} props.defaultValue Default values
 * @param {boolean} props.processing Loading state
 * @returns {JSX.Element} Rendered component
 */
const Form = ({
                  values,
                  setValues,
                  cancel,
                  submit,
                  errors = {},
                  open,
                  defaultValue,
                  processing = false
              }) => {
    // State for status description
    const [statusDescription, setStatusDescription] = useState("");

    /**
     * Handle input change
     *
     * @param {Object} e Change event
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues(prevValues => ({ ...prevValues, [name]: value }));

        // Update status description when status changes
        if (name === 'status') {
            updateStatusDescription(value);
        }
    };

    /**
     * Update status description based on selected status
     *
     * @param {string} status Status value
     */
    const updateStatusDescription = (status) => {
        const statusObject = collectRequestStatuses.find(s => s.value === status);
        setStatusDescription(statusObject?.description || "");
    };

    /**
     * Get color for status
     *
     * @param {string} status Status value
     * @returns {string} Color name
     */
    const getStatusColor = (status) => {
        const statusObject = collectRequestStatuses.find(s => s.value === status);
        return statusObject?.color || "default";
    };

    /**
     * Get icon for status
     *
     * @param {string} status Status value
     * @returns {JSX.Element} Icon element
     */
    const getStatusIcon = (status) => {
        const statusObject = collectRequestStatuses.find(s => s.value === status);
        return statusObject?.icon || <MoreVert fontSize="small" />;
    };

    /**
     * Check if a field has an error
     *
     * @param {string} field Field name
     * @returns {boolean} True if field has an error
     */
    const hasError = (field) => {
        return Object.keys(errors).includes(field);
    };

    /**
     * Get error message for a field
     *
     * @param {string} field Field name
     * @returns {string} Error message or empty string
     */
    const getErrorMessage = (field) => {
        return errors[field] || "";
    };

    /**
     * Handle dialog close
     */
    const handleClose = () => {
        // Confirm before closing if changes were made
        if (JSON.stringify(values) !== JSON.stringify(defaultValue)) {
            if (window.confirm("Are you sure you want to cancel? Any unsaved changes will be lost.")) {
                cancel();
            }
        } else {
            cancel();
        }
    };

    // Initialize status description when component mounts or values change
    useEffect(() => {
        if (values.status) {
            updateStatusDescription(values.status);
        }
    }, [values.status]);

    return (
        <Dialog
            open={open}
            onClose={processing ? undefined : handleClose}
            fullWidth
            maxWidth="md"
            TransitionComponent={SlideTransition}
            PaperProps={{
                elevation: 5,
                sx: { borderRadius: 2 }
            }}
        >
            {/* Dialog title */}
            <DialogTitle sx={{
                pb: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalShipping color="primary" />
                    <Typography variant="h6">
                        Edit Collection Details
                    </Typography>
                </Box>

                <IconButton
                    edge="end"
                    color="inherit"
                    onClick={handleClose}
                    disabled={processing}
                    aria-label="close"
                >
                    <Close />
                </IconButton>
            </DialogTitle>

            <Divider />

            {/* Dialog content */}
            <DialogContent sx={{ pt: 3 }}>
                {/* Disable editing message */}
                {defaultValue.status === "received" && (
                    <Alert
                        severity="info"
                        sx={{ mb: 3 }}
                    >
                        This collection request has been marked as received and cannot be modified.
                    </Alert>
                )}

                <Grid container spacing={3}>
                    {/* Status field */}
                    <Grid item xs={12}>
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 2,
                                borderColor: getStatusColor(values.status),
                                bgcolor: `${getStatusColor(values.status)}.lightest`,
                            }}
                        >
                            <Stack spacing={2}>
                                <FormControl
                                    fullWidth
                                    disabled={defaultValue.status === "received" || processing}
                                >
                                    <InputLabel id="status-label">Status</InputLabel>
                                    <Select
                                        labelId="status-label"
                                        id="status"
                                        name="status"
                                        value={values.status || ''}
                                        onChange={handleChange}
                                        label="Status"
                                        renderValue={(selected) => (
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                {getStatusIcon(selected)}
                                                <Typography>
                                                    {collectRequestStatuses.find(s => s.value === selected)?.label || selected}
                                                </Typography>
                                                <Chip
                                                    label={selected}
                                                    size="small"
                                                    color={getStatusColor(selected)}
                                                    sx={{ ml: 1, textTransform: 'capitalize' }}
                                                />
                                            </Stack>
                                        )}
                                        startAdornment={
                                            <InputAdornment position="start">
                                                {getStatusIcon(values.status)}
                                            </InputAdornment>
                                        }
                                    >
                                        {collectRequestStatuses.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    {option.icon}
                                                    <Typography>{option.label}</Typography>
                                                </Stack>
                                            </MenuItem>
                                        ))}
                                    </Select>

                                    {statusDescription && (
                                        <FormHelperText>
                                            {statusDescription}
                                        </FormHelperText>
                                    )}
                                </FormControl>
                            </Stack>
                        </Paper>
                    </Grid>

                    {/* Scheduled date field */}
                    {values.status === "scheduled" && (
                        <Grid item xs={12} md={6}>
                            <TextField
                                error={hasError('scheduleDate')}
                                helperText={getErrorMessage('scheduleDate') || "Select the scheduled collection date and time"}
                                fullWidth
                                type="datetime-local"
                                label="Schedule Date & Time"
                                name="scheduleDate"
                                value={values.scheduleDate || ''}
                                onChange={handleChange}
                                disabled={processing}
                                required
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Event color="info" />
                                        </InputAdornment>
                                    ),
                                }}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </Grid>
                    )}

                    {/* Pickup date field */}
                    {values.status === "picked up" && (
                        <Grid item xs={12} md={6}>
                            <TextField
                                error={hasError('pickupDate')}
                                helperText={getErrorMessage('pickupDate') || "Select the actual pickup date and time"}
                                fullWidth
                                type="datetime-local"
                                label="Pickup Date & Time"
                                name="pickupDate"
                                value={values.pickupDate || ''}
                                onChange={handleChange}
                                disabled={processing}
                                required
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <AccessTime color="secondary" />
                                        </InputAdornment>
                                    ),
                                }}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </Grid>
                    )}

                    {/* Status details field */}
                    {values.status !== "received" && (
                        <Grid item xs={12}>
                            <TextField
                                error={hasError(`${values.status}Details`)}
                                helperText={
                                    getErrorMessage(`${values.status}Details`) ||
                                    `Additional information about the ${values.status} status`
                                }
                                fullWidth
                                multiline
                                rows={4}
                                label={`${collectRequestStatuses.find(s => s.value === values.status)?.label || ''} Details`}
                                name={`${values.status}Details`}
                                value={values[`${values.status}Details`] || ''}
                                onChange={handleChange}
                                disabled={processing}
                                placeholder={`Enter any relevant information about this ${values.status} status...`}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                                            <Notes color={getStatusColor(values.status)} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                    )}
                </Grid>
            </DialogContent>

            <Divider />

            {/* Dialog actions */}
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button
                    onClick={handleClose}
                    startIcon={<Cancel />}
                    disabled={processing}
                >
                    Cancel
                </Button>

                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Save />}
                    onClick={submit}
                    disabled={defaultValue.status === "received" || processing}
                >
                    {processing ? "Saving..." : "Update Status"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default Form;
