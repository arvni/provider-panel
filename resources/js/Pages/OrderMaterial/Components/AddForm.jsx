import * as React from "react";
import { useState } from "react";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
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
    OutlinedInput,
    Select,
    Slide,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import {
    Close as CloseIcon,
    Info as InfoIcon,
    Science as ScienceIcon,
    ShoppingCart as ShoppingCartIcon,
    Add as AddIcon,
    Remove as RemoveIcon
} from "@mui/icons-material";

/**
 * Dialog transition animation
 */
const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

/**
 * AddForm component for ordering new materials
 *
 * @param {Object} props Component props
 * @param {Object} props.values Form values
 * @param {Function} props.setValues Update form values
 * @param {Function} props.submit Submit form handler
 * @param {boolean} props.open Dialog open state
 * @param {Function} props.setOpen Update dialog open state
 * @param {string} props.title Dialog title
 * @param {boolean} props.loading Loading state
 * @param {Function} props.reset Reset form handler
 * @param {Array} props.sampleTypes Available sample types
 * @returns {JSX.Element} Rendered component
 */
const AddForm = ({
                     values,
                     setValues,
                     submit,
                     open,
                     setOpen,
                     title,
                     loading,
                     reset,
                     sampleTypes,
                     errors = {}
                 }) => {
    // Local form validation state
    const [validationErrors, setValidationErrors] = useState({});

    /**
     * Handle input change
     *
     * @param {Event} e Event object
     */
    const handleChange = (e) => {
        const { name, value } = e.target;

        // Clear validation error when field changes
        if (validationErrors[name]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }

        setValues(prevState => ({
            ...prevState,
            [name]: name === "amount" ? (parseInt(value) || 0) : value
        }));
    };

    /**
     * Increment or decrement quantity
     *
     * @param {number} amount Amount to change by
     */
    const adjustQuantity = (amount) => {
        const currentValue = parseInt(values.amount) || 0;
        const newValue = Math.max(1, Math.min(100, currentValue + amount));

        setValues(prevState => ({
            ...prevState,
            amount: newValue
        }));
    };

    /**
     * Close dialog and reset form
     */
    const handleClose = () => {
        setOpen(false);
        reset();
        setValidationErrors({});
    };

    /**
     * Validate form before submission
     *
     * @returns {boolean} True if form is valid
     */
    const validateForm = () => {
        const errors = {};

        if (!values.sample_type) {
            errors.sample_type = "Please select a sample type";
        }

        if (!values.amount) {
            errors.amount = "Please enter a quantity";
        } else if (values.amount < 1) {
            errors.amount = "Quantity must be at least 1";
        } else if (values.amount > 100) {
            errors.amount = "Quantity cannot exceed 100";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    /**
     * Handle form submission with validation
     */
    const handleSubmit = () => {
        if (validateForm()) {
            submit();
        }
    };

    // Show dialog only when open and not in loading state
    return (
        <Dialog
            open={open}
            onClose={loading ? undefined : handleClose}
            maxWidth="sm"
            fullWidth
            TransitionComponent={Transition}
            PaperProps={{
                elevation: 5,
                sx: { borderRadius: 2 }
            }}
        >
            {/* Dialog title with close button */}
            <DialogTitle
                sx={{
                    pb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShoppingCartIcon color="primary" />
                    <Typography variant="h6">{title}</Typography>
                </Box>

                {!loading && (
                    <IconButton
                        edge="end"
                        color="inherit"
                        onClick={handleClose}
                        aria-label="close"
                    >
                        <CloseIcon />
                    </IconButton>
                )}
            </DialogTitle>

            <Divider />

            {/* Dialog content */}
            <DialogContent sx={{ pt: 3, pb: 2 }}>
                {/* Info message */}
                <Alert
                    severity="info"
                    icon={<InfoIcon />}
                    sx={{ mb: 3 }}
                >
                    Order the materials you need for diagnostic tests. Please specify the sample type and quantity required.
                </Alert>

                <Grid container spacing={3}>
                    {/* Sample Type Selection */}
                    <Grid item xs={12}>
                        <FormControl
                            fullWidth
                            variant="outlined"
                            error={!!validationErrors.sample_type}
                            disabled={loading}
                        >
                            <InputLabel id="sample-type-label">Sample Type *</InputLabel>
                            <Select
                                labelId="sample-type-label"
                                id="sample-type"
                                name="sample_type"
                                value={values?.sample_type || ""}
                                onChange={handleChange}
                                label="Sample Type *"
                                startAdornment={
                                    <InputAdornment position="start">
                                        <ScienceIcon color="primary" />
                                    </InputAdornment>
                                }
                            >
                                {sampleTypes?.map(sampleType => (
                                    <MenuItem value={sampleType.id} key={sampleType?.id}>
                                        {sampleType?.name}
                                    </MenuItem>
                                ))}
                            </Select>

                            {validationErrors.sample_type && (
                                <FormHelperText error>
                                    {validationErrors.sample_type}
                                </FormHelperText>
                            )}
                        </FormControl>
                    </Grid>

                    {/* Quantity Input */}
                    <Grid item xs={12}>
                        <FormControl
                            fullWidth
                            variant="outlined"
                            error={!!validationErrors.amount}
                            disabled={loading}
                        >
                            <InputLabel htmlFor="quantity-input">Quantity *</InputLabel>
                            <OutlinedInput
                                id="quantity-input"
                                label="Quantity *"
                                name="amount"
                                type="number"
                                value={values.amount || ""}
                                onChange={handleChange}
                                inputProps={{
                                    min: 1,
                                    max: 100,
                                    step: 1
                                }}
                                startAdornment={
                                    <InputAdornment position="start">
                                        <IconButton
                                            onClick={() => adjustQuantity(-1)}
                                            edge="start"
                                            disabled={values.amount <= 1 || loading}
                                            size="small"
                                        >
                                            <RemoveIcon fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                }
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => adjustQuantity(1)}
                                            edge="end"
                                            disabled={values.amount >= 100 || loading}
                                            size="small"
                                        >
                                            <AddIcon fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                }
                            />

                            {validationErrors.amount ? (
                                <FormHelperText error>
                                    {validationErrors.amount}
                                </FormHelperText>
                            ) : (
                                <FormHelperText>
                                    Enter the quantity needed (1-100)
                                </FormHelperText>
                            )}
                        </FormControl>
                    </Grid>

                    {/* Additional Information - can be expanded with more fields if needed */}
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            name="notes"
                            label="Additional Notes"
                            multiline
                            rows={2}
                            placeholder="Enter any special instructions or notes about this order"
                            value={values.notes || ""}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </Grid>
                </Grid>
            </DialogContent>

            <Divider />

            {/* Dialog actions */}
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Stack direction="row" spacing={2} sx={{ width: '100%', justifyContent: 'flex-end' }}>
                    <Button
                        onClick={handleClose}
                        variant="outlined"
                        disabled={loading}
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <ShoppingCartIcon />}
                    >
                        {loading ? "Submitting..." : "Place Order"}
                    </Button>
                </Stack>
            </DialogActions>
        </Dialog>
    );
};

export default AddForm;
