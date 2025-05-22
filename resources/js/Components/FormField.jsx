import * as React from "react";
import {
    Checkbox,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
    FormHelperText,
    Box,
    Tooltip,
    InputAdornment,
    Switch,
    Radio,
    RadioGroup,
    FormLabel,
    useTheme,
    alpha
} from "@mui/material";
import {
    Description as DescriptionIcon,
    TextFields as TextFieldsIcon,
    Numbers as NumbersIcon,
    CalendarToday as CalendarIcon,
    Email as EmailIcon,
    Info as InfoIcon,
    Help as HelpIcon
} from "@mui/icons-material";
import PasswordField from "./PasswordField";
import SelectSearch from "./SelectSearch";

/**
 * Enhanced FormField component with improved validation and error handling
 *
 * @param {Object} props - Component props
 * @param {Object} props.field - Field configuration object
 * @param {string} props.size - Field size (small, medium, large)
 * @param {function} props.onchange - Change handler function
 * @param {Object} props.errors - Error messages object
 * @param {string} props.errorPath - Custom error path for complex forms
 * @returns {JSX.Element}
 */
const FormField = ({
                       field: { type, ...rest },
                       size = "medium",
                       onchange,
                       errors = {},
                       errorPath
                   }) => {
    const theme = useTheme();
    const [focused, setFocused] = React.useState(false);

    // Determine the error path for this field
    const fieldErrorPath = errorPath || rest.name;

    // Get nested error using path notation (e.g. 'orderForms[0].formData[2].value')
    const getNestedError = (path) => {
        if (!path || !errors) return null;

        // Handle simple path
        if (errors[path]) return errors[path];

        // Handle complex path with brackets
        if (path.includes('[')) {
            try {
                // Create a function to access nested property using bracket notation
                const getNestedValue = (obj, path) => {
                    // Convert path with brackets to an array of keys
                    // e.g. 'orderForms[0].formData[2].value' becomes ['orderForms', '0', 'formData', '2', 'value']
                    const keys = path.replace(/\[/g, '.').replace(/]/g, '').split('.');
                    return keys.reduce((o, k) => (o || {})[k], obj);
                };

                return getNestedValue(errors, path);
            } catch (e) {
                console.error('Error parsing error path:', e);
                return null;
            }
        }

        return null;
    };

    // Determine if field has an error
    const errorMessage = getNestedError(fieldErrorPath);
    const hasError = !!errorMessage;

    // Determine if field is required
    const isRequired = rest.required || false;

    // Handle focus states
    const handleFocus = () => setFocused(true);
    const handleBlur = () => setFocused(false);

    // Get appropriate icon for field type
    const getFieldIcon = () => {
        switch (type) {
            case "text":
                return <TextFieldsIcon color="action" fontSize="small" />;
            case "number":
                return <NumbersIcon color="action" fontSize="small" />;
            case "date":
                return <CalendarIcon color="action" fontSize="small" />;
            case "email":
                return <EmailIcon color="action" fontSize="small" />;
            case "description":
                return <DescriptionIcon color="action" fontSize="small" />;
            default:
                return null;
        }
    };

    // Common props for text-based fields
    const commonTextFieldProps = {
        ...rest,
        size,
        fullWidth: true,
        onChange: onchange,
        error: hasError,
        helperText: errorMessage,
        required: isRequired,
        InputProps: {
            ...rest.InputProps,
            startAdornment: rest.startAdornment || getFieldIcon() ? (
                <InputAdornment position="start">
                    {rest.startAdornment || getFieldIcon()}
                </InputAdornment>
            ) : undefined,
            endAdornment: rest.helpText ? (
                <InputAdornment position="end">
                    <Tooltip title={rest.helpText}>
                        <HelpIcon color="action" fontSize="small" />
                    </Tooltip>
                </InputAdornment>
            ) : rest.endAdornment,
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
        },
        sx: {
            mb: rest.noMargin ? 0 : 1,
            ...rest.sx
        },
        onFocus: handleFocus,
        onBlur: handleBlur
    };

    // Render different field types
    switch (type) {
        case "textarea":
            return (
                <TextField
                    {...commonTextFieldProps}
                    multiline
                    rows={rest.rows || 4}
                    placeholder={rest.placeholder || `Enter ${rest.label}`}
                    InputProps={{
                        ...commonTextFieldProps.InputProps,
                        sx: {
                            ...commonTextFieldProps.InputProps.sx,
                            fontFamily: "'Roboto', sans-serif",
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: hasError ? theme.palette.error.main : undefined
                            }
                        }
                    }}
                />
            );

        case "text":
        case "email":
        case "number":
            return (
                <TextField
                    {...commonTextFieldProps}
                    type={type}
                    placeholder={rest.placeholder || `Enter ${rest.label}`}
                    InputProps={{
                        ...commonTextFieldProps.InputProps,
                        inputProps: {
                            ...rest.inputProps,
                            type,
                            min: type === "number" ? rest.min : undefined,
                            max: type === "number" ? rest.max : undefined,
                            step: type === "number" ? rest.step : undefined
                        }
                    }}
                />
            );

        case "date":
            return (
                <TextField
                    {...commonTextFieldProps}
                    type="date"
                    InputLabelProps={{
                        shrink: true,
                    }}
                    inputProps={{
                        min: rest.min,
                        max: rest.max,
                    }}
                    sx={{
                        ...commonTextFieldProps.sx,
                        width: rest.width || "100%"
                    }}
                />
            );

        case "password":
            return (
                <PasswordField
                    {...rest}
                    size={size}
                    onChange={onchange}
                    fullWidth
                    error={hasError}
                    helperText={errorMessage}
                    required={isRequired}
                    sx={{
                        mb: rest.noMargin ? 0 : 1,
                        ...rest.sx
                    }}
                />
            );

        case "description":
            return (
                <Box
                    sx={{
                        p: 2,
                        mb: rest.noMargin ? 0 : 2,
                        borderRadius: 1.5,
                        backgroundColor: alpha(theme.palette.info.main, 0.05),
                        border: '1px solid',
                        borderColor: alpha(theme.palette.info.main, 0.1),
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1
                    }}
                >
                    <InfoIcon
                        color="info"
                        fontSize="small"
                        sx={{ mt: 0.3 }}
                    />
                    <Typography variant="body2" color="text.primary">
                        {rest.value || rest.label}
                    </Typography>
                </Box>
            );

        case "checkbox":
            return (
                <Box sx={{ mb: rest.noMargin ? 0 : 1 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={Boolean(rest.value)}
                                onChange={(e) => onchange(e, e.target.checked)}
                                name={rest.name}
                                size={size}
                                color={hasError ? "error" : "primary"}
                            />
                        }
                        label={
                            <Typography
                                variant="body2"
                                color={hasError ? "error" : "text.primary"}
                            >
                                {rest.label}
                                {isRequired && <span style={{ color: theme.palette.error.main }}> *</span>}
                            </Typography>
                        }
                    />
                    {hasError && (
                        <FormHelperText error>
                            {errorMessage}
                        </FormHelperText>
                    )}
                </Box>
            );

        case "selectSearch":
            return (
                <Box sx={{ mb: rest.noMargin ? 0 : 1 }}>
                    <SelectSearch
                        onchange={onchange}
                        url={rest?.url ?? ""}
                        {...rest}
                        size={size}
                        error={hasError}
                        helpText={errorMessage}
                    />
                    {hasError && (
                        <FormHelperText error>
                            {errorMessage}
                        </FormHelperText>
                    )}
                </Box>
            );

        case "select":
            return (
                <FormControl
                    fullWidth
                    size={size}
                    error={hasError}
                    sx={{
                        mb: rest.noMargin ? 0 : 1,
                        ...rest.sx
                    }}
                    required={isRequired}
                >
                    <InputLabel id={`${rest.name}-select-label`}>
                        {rest.label}
                    </InputLabel>
                    <Select
                        labelId={`${rest.name}-select-label`}
                        id={`${rest.name}-select`}
                        {...rest}
                        onChange={onchange}
                        size={size}
                        sx={{
                            borderRadius: 1.5,
                            '& .MuiSelect-select': {
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }
                        }}
                        startAdornment={rest.startAdornment && (
                            <InputAdornment position="start">
                                {rest.startAdornment}
                            </InputAdornment>
                        )}
                    >
                        {rest.placeholder && (
                            <MenuItem value="" disabled>
                                <Typography color="text.secondary">
                                    {rest.placeholder}
                                </Typography>
                            </MenuItem>
                        )}
                        {rest.options ? rest.options.map((option, index) => (
                            <MenuItem
                                value={typeof option === "string" ? option : option.value}
                                key={index}
                                sx={{
                                    minHeight: 'auto',
                                    py: 1.5
                                }}
                            >
                                {typeof option === "string" ? (
                                    option
                                ) : (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {option.icon && (
                                            <Box component="span" sx={{ display: 'inline-flex' }}>
                                                {option.icon}
                                            </Box>
                                        )}
                                        <Typography>
                                            {option.label}
                                        </Typography>
                                    </Box>
                                )}
                            </MenuItem>
                        )) : null}
                    </Select>
                    {(errorMessage || rest.helperText) && (
                        <FormHelperText error={hasError}>
                            {errorMessage || rest.helperText}
                        </FormHelperText>
                    )}
                </FormControl>
            );

        case "radio":
            return (
                <FormControl
                    component="fieldset"
                    error={hasError}
                    required={isRequired}
                    sx={{
                        mb: rest.noMargin ? 0 : 1,
                        ...rest.sx
                    }}
                >
                    <FormLabel component="legend">
                        {rest.label}
                        {isRequired && <span style={{ color: theme.palette.error.main }}> *</span>}
                    </FormLabel>
                    <RadioGroup
                        aria-label={rest.label}
                        name={rest.name}
                        value={rest.value || ""}
                        onChange={onchange}
                        row={rest.row || false}
                    >
                        {rest.options?.map((option, index) => (
                            <FormControlLabel
                                key={index}
                                value={typeof option === "string" ? option : option.value}
                                control={<Radio size={size} />}
                                label={
                                    <Typography variant="body2">
                                        {typeof option === "string" ? option : option.label}
                                    </Typography>
                                }
                            />
                        ))}
                    </RadioGroup>
                    {hasError && (
                        <FormHelperText error>
                            {errorMessage}
                        </FormHelperText>
                    )}
                </FormControl>
            );

        case "switch":
            return (
                <Box sx={{ mb: rest.noMargin ? 0 : 1 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={Boolean(rest.value)}
                                onChange={(e) => onchange(e, e.target.checked)}
                                name={rest.name}
                                size={size}
                                color={hasError ? "error" : "primary"}
                            />
                        }
                        label={
                            <Typography
                                variant="body2"
                                color={hasError ? "error" : "text.primary"}
                            >
                                {rest.label}
                                {isRequired && <span style={{ color: theme.palette.error.main }}> *</span>}
                            </Typography>
                        }
                    />
                    {hasError && (
                        <FormHelperText error>
                            {errorMessage}
                        </FormHelperText>
                    )}
                </Box>
            );

        default:
            return (
                <Typography color="error">
                    Unknown field type: {type}
                </Typography>
            );
    }
};

export default FormField;
