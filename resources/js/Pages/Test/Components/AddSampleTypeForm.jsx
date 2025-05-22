import React, { useState, useEffect } from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControlLabel,
    Grid,
    IconButton,
    InputAdornment,
    Paper,
    Stack,
    Switch,
    TextField,
    Typography,
    Slide,
    Box
} from "@mui/material";
import {
    Save,
    Cancel,
    Science,
    Description,
    CheckCircle,
    Close
} from "@mui/icons-material";
import SelectSearch from "@/Components/SelectSearch";

/**
 * Slide transition for dialog
 */
const SlideTransition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

/**
 * AddSampleTypeForm component
 * Dialog for adding or editing sample types
 *
 * @param {Object} props Component props
 * @param {Object} props.data Sample type data
 * @param {Function} props.setData Update sample type data
 * @param {boolean} props.open Dialog open state
 * @param {Function} props.onClose Close dialog handler
 * @param {Function} props.onSubmit Submit handler
 * @param {boolean} props.disabled Whether form is disabled
 * @returns {JSX.Element} Rendered component
 */
const AddSampleTypeForm = ({
                               data,
                               setData,
                               open,
                               onClose,
                               onSubmit,
                               disabled = false
                           }) => {
    // Validation errors state
    const [errors, setErrors] = useState({});

    /**
     * Handle input change
     *
     * @param {Event} e Change event
     */
    const handleChange = (e) => {
        // Clear error for this field if it exists
        if (errors[e.target.name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[e.target.name];
                return newErrors;
            });
        }

        setData(e.target.name, e.target.value);
    };

    /**
     * Handle switch toggle
     *
     * @param {Event} e Change event
     * @param {boolean} v New value
     */
    const handleSwitchChanged = (e, v) => {
        setData(e.target.name, v);
    };

    /**
     * Validate and submit form
     */
    const handleSubmit = () => {
        if (validateForm()) {
            onSubmit();
        }
    };

    /**
     * Validate form fields
     *
     * @returns {boolean} True if form is valid
     */
    const validateForm = () => {
        clearErrors();
        let isValid = true;

        // Validate sample type
        if (!data?.sample_type?.id) {
            isValid = false;
            addError("sample_type", "Please select a sample type");
        }

        // Validate description
        if (!data.description) {
            isValid = false;
            addError("description", "Please enter a description");
        }

        return isValid;
    };

    /**
     * Clear all errors
     */
    const clearErrors = () => {
        setErrors({});
    };

    /**
     * Add validation error
     *
     * @param {string} key Field key
     * @param {string} error Error message
     */
    const addError = (key, error) => {
        setErrors(prev => ({
            ...prev,
            [key]: error
        }));
    };

    /**
     * Close dialog and clear errors
     */
    const handleClose = () => {
        // Ask for confirmation if there are changes
        if (data.sample_type?.id || data.description) {
            if (window.confirm("Are you sure you want to close without saving your changes?")) {
                clearErrors();
                onClose();
            }
        } else {
            clearErrors();
            onClose();
        }
    };

    // Clear errors when dialog opens
    useEffect(() => {
        if (open) {
            clearErrors();
        }
    }, [open]);

    return (
        <Dialog
            open={open}
            onClose={disabled ? undefined : handleClose}
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
                    <Science color="success" />
                    <Typography variant="h6">
                        {data.id && data.sample_type?.id ? 'Edit Sample Type' : 'Add New Sample Type'}
                    </Typography>
                </Box>

                <IconButton
                    edge="end"
                    color="inherit"
                    onClick={handleClose}
                    disabled={disabled}
                    aria-label="close"
                >
                    <Close />
                </IconButton>
            </DialogTitle>

            <Divider />

            {/* Dialog content */}
            <DialogContent sx={{ py: 3 }}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                        Add a sample type that can be used for this test. You can mark this as the default sample type.
                    </Typography>
                </Box>

                <Grid container spacing={3}>
                    {/* Sample Type Select */}
                    <Grid item xs={12} md={6}>
                        <SelectSearch
                            name="sample_type"
                            value={data.sample_type}
                            url={route("api.sampleTypes.list")}
                            label="Sample Type"
                            onchange={handleChange}
                            helperText={errors?.sample_type || "Select the type of sample that can be used for this test"}
                            error={!!errors?.sample_type}
                            required
                            disabled={disabled}
                            startIcon={<Science color="success" />}
                        />
                    </Grid>

                    {/* Default Switch */}
                    <Grid item xs={12} md={6}>
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                bgcolor: data.is_default ? 'success.lightest' : 'background.paper',
                                borderColor: data.is_default ? 'success.light' : 'divider',
                            }}
                        >
                            <Stack direction="row" spacing={1} alignItems="center">
                                <CheckCircle color={data.is_default ? "success" : "disabled"} />
                                <Stack spacing={0}>
                                    <Typography variant="subtitle2">Default Sample Type</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        This will be the recommended sample type
                                    </Typography>
                                </Stack>
                            </Stack>

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={!!data.is_default}
                                        onChange={handleSwitchChanged}
                                        disabled={disabled}
                                        color="success"
                                    />
                                }
                                label=""
                                labelPlacement="start"
                                name="is_default"
                            />
                        </Paper>
                    </Grid>

                    {/* Description TextField */}
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            name="description"
                            value={data.description || ''}
                            onChange={handleChange}
                            label="Description"
                            placeholder="Provide details about this sample type, including any special handling instructions"
                            error={!!errors?.description}
                            helperText={errors?.description || "Explain how this sample type should be handled"}
                            disabled={disabled}
                            required
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                                        <Description color="primary" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                </Grid>
            </DialogContent>

            <Divider />

            {/* Dialog actions */}
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button
                    onClick={handleClose}
                    startIcon={<Cancel />}
                    disabled={disabled}
                >
                    Cancel
                </Button>

                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Save />}
                    onClick={handleSubmit}
                    disabled={disabled}
                >
                    {data.id && data.sample_type?.id ? 'Update Sample Type' : 'Add Sample Type'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddSampleTypeForm;
