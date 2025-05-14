import React, { useState } from "react";
import {
    FormControl,
    FormHelperText,
    IconButton,
    InputAdornment,
    InputLabel,
    OutlinedInput,
    Box,
    Typography,
    Tooltip,
    useTheme,
    Fade
} from "@mui/material";
import { Visibility, VisibilityOff, LockOutlined } from "@mui/icons-material";

/**
 * Enhanced password field component with visibility toggle and password strength indicator
 *
 * @param {string} name - Field name
 * @param {string} helperText - Helper text or error message
 * @param {string} label - Field label
 * @param {boolean} error - Whether field has an error
 * @param {boolean} fullWidth - Whether field should take full width
 * @param {boolean} required - Whether field is required
 * @param {React.ReactNode} startAdornment - Custom start adornment
 * @param showStrength
 * @param value
 * @param {Object} props - Additional props to pass to OutlinedInput
 */
const PasswordField = ({
                           name,
                           helperText,
                           label = "",
                           error = false,
                           fullWidth = true,
                           required = false,
                           startAdornment,
                           showStrength = false,
                           value,
                           ...props
                       }) => {
    const theme = useTheme();
    const [showPassword, setShowPassword] = useState(false);
    const [focused, setFocused] = useState(false);

    // Toggle password visibility with toggle button
    const handleTogglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    // Calculate password strength if needed
    const getPasswordStrength = (password) => {
        if (!password) return 0;

        let strength = 0;

        // Length check
        if (password.length >= 8) strength += 1;

        // Character variety checks
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[a-z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;

        return strength;
    };

    // Get strength text and color
    const getStrengthInfo = (strength) => {
        switch (strength) {
            case 0:
            case 1:
                return { text: "Weak", color: "#f44336" };
            case 2:
            case 3:
                return { text: "Medium", color: "#ff9800" };
            case 4:
                return { text: "Strong", color: "#4caf50" };
            case 5:
                return { text: "Very Strong", color: "#2e7d32" };
            default:
                return { text: "", color: "transparent" };
        }
    };

    const passwordStrength = showStrength && value ? getPasswordStrength(value) : 0;
    const strengthInfo = getStrengthInfo(passwordStrength);

    return (
        <FormControl
            variant="outlined"
            fullWidth={fullWidth}
            sx={{ width: "100%" }}
            required={required}
            error={error}
        >
            <InputLabel
                htmlFor={`${name}-field-id`}
                error={error}
                sx={{
                    '&.Mui-focused': {
                        color: error ? theme.palette.error.main : theme.palette.primary.main
                    }
                }}
            >
                {label}
            </InputLabel>

            <OutlinedInput
                name={name}
                id={`${name}-field-id`}
                label={label}
                value={value}
                error={error}
                startAdornment={startAdornment || (
                    <InputAdornment position="start">
                        <LockOutlined
                            fontSize="small"
                            color={error ? "error" : "action"}
                        />
                    </InputAdornment>
                )}
                endAdornment={
                    <InputAdornment position="end">
                        <Tooltip
                            title={showPassword ? "Hide password" : "Show password"}
                            arrow
                            placement="top"
                        >
                            <IconButton
                                aria-label="toggle password visibility"
                                onClick={handleTogglePasswordVisibility}
                                edge="end"
                                sx={{
                                    color: theme.palette.text.secondary,
                                    '&:hover': {
                                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                    }
                                }}
                            >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </Tooltip>
                    </InputAdornment>
                }
                type={showPassword ? 'text' : 'password'}
                required={required}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                sx={{
                    borderRadius: 1.5,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                        boxShadow: error ? 'none' : '0 2px 8px rgba(0,0,0,0.08)'
                    },
                    '&.Mui-focused': {
                        boxShadow: error ? 'none' : '0 2px 10px rgba(0,0,0,0.1)'
                    }
                }}
                {...props}
            />

            {showStrength && value && focused ? (
                <Box sx={{ mt: 1, mb: helperText ? 0 : 1 }}>
                    <Fade in={true}>
                        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ display: 'flex', flex: 1, gap: 0.5 }}>
                                {[1, 2, 3, 4, 5].map((level) => (
                                    <Box
                                        key={level}
                                        sx={{
                                            height: 4,
                                            flex: 1,
                                            borderRadius: 1,
                                            bgcolor: level <= passwordStrength ? strengthInfo.color : 'rgba(0, 0, 0, 0.1)',
                                            transition: 'background-color 0.3s ease'
                                        }}
                                    />
                                ))}
                            </Box>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: strengthInfo.color,
                                    fontWeight: 500,
                                    minWidth: 80,
                                    textAlign: 'right'
                                }}
                            >
                                {strengthInfo.text}
                            </Typography>
                        </Box>
                    </Fade>
                </Box>
            ) : null}

            {helperText && (
                <FormHelperText
                    error={error}
                    sx={{
                        mt: 0.5,
                        fontSize: '0.75rem',
                        lineHeight: 1.2,
                        transition: 'color 0.3s ease'
                    }}
                >
                    {helperText}
                </FormHelperText>
            )}
        </FormControl>
    );
};

export default PasswordField;
