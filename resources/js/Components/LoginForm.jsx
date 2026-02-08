import React, { useEffect, useRef, useState } from "react";
import { Link } from "@inertiajs/react";
import {
    Box,
    Checkbox,
    FormControlLabel,
    FormHelperText,
    TextField,
    Typography,
    InputAdornment,
    useTheme,
    useMediaQuery,
    Fade
} from "@mui/material";
import EmailIcon from '@mui/icons-material/Email';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { motion } from "framer-motion";
import { loginFormValidator } from "@/Services/validate";
import { useSubmitForm } from "@/Services/api";
import PasswordField from "@/Components/PasswordField";
import LoadingButton from "@/Components/LoadingButton.jsx";

const LoginForm = ({ siteKey }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const turnstileWidgetRef = useRef(null);
    const [widgetId, setWidgetId] = useState(null);

    const {
        data,
        setData,
        submit,
        processing,
        errors,
        setError,
        clearErrors,
        reset
    } = useSubmitForm({
        email: "",
        password: "",
        remember: false,
        "cf-turnstile-response": ""
    }, route("login"));

    useEffect(() => {
        // Load Cloudflare Turnstile script
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onloadTurnstileCallback';
        script.async = true;
        script.defer = true;

        // Define the callback function that will be called when Turnstile is loaded
        window.onloadTurnstileCallback = function () {
            if (turnstileWidgetRef.current) {
                const widgetId = window.turnstile.render(turnstileWidgetRef.current, {
                    sitekey: siteKey,
                    theme: 'light',
                    callback: function (token) {
                        formChange("cf-turnstile-response", token);
                    },
                    'expired-callback': function () {
                        formChange("cf-turnstile-response", "");
                    },
                    'error-callback': function () {
                        formChange("cf-turnstile-response", "");
                    }
                });
                setWidgetId(widgetId);
            }
        };

        document.body.appendChild(script);

        return () => {
            // Cleanup
            if (script.parentNode) {
                document.body.removeChild(script);
            }
            // Reset the widget if it exists
            if (window.turnstile && widgetId) {
                window.turnstile.remove(widgetId);
            }
            delete window.onloadTurnstileCallback;
        };
    }, [siteKey]);

    useEffect(() => {
        return () => {
            reset("password", "cf-turnstile-response");
        };
    }, [processing]);

    const resetTurnstile = () => {
        if (window.turnstile && widgetId) {
            window.turnstile.reset(widgetId);
        }
        formChange("cf-turnstile-response", "");
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        clearErrors();

        if (loginFormValidator(data, setError)) {
            submit({
                onError: () => {
                    resetTurnstile();
                }
            });
        } else {
            resetTurnstile();
        }
    };

    const handleChange = (e) => formChange(e.target.name, e.target.value);
    const formChange = (key, value) => setData(previousData => ({
        ...previousData,
        [key]: value
    }));

    const handleRememberChange = (e, value) => formChange("remember", value);

    // Animation variants
    const formVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            }
        }
    };

    const itemVariants = {
        hidden: { y: 10, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.4 } }
    };

    return (
        <Box
            component={motion.form}
            variants={formVariants}
            initial="hidden"
            animate="visible"
            onSubmit={handleSubmit}
            sx={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 2.5
            }}
        >
            <Box
                component={motion.div}
                variants={itemVariants}
                sx={{ width: "100%" }}
            >
                <TextField
                    onChange={handleChange}
                    name="email"
                    value={data.email}
                    helperText={errors.email ?? ""}
                    error={errors.hasOwnProperty("email")}
                    type="email"
                    label="Email Address"
                    autoComplete="username"
                    required
                    inputProps={{ inputMode: "email" }}
                    fullWidth
                    variant="outlined"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <EmailIcon color="action" />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5,
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                            },
                            '&.Mui-focused': {
                                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                            }
                        }
                    }}
                />
            </Box>

            <Box
                component={motion.div}
                variants={itemVariants}
                sx={{ width: "100%" }}
            >
                <PasswordField
                    name="password"
                    value={data.password}
                    helperText={errors.password ?? ""}
                    error={errors.hasOwnProperty("password")}
                    label="Password"
                    autoComplete="current-password"
                    required
                    onChange={handleChange}
                    fullWidth
                    startAdornment={
                        <InputAdornment position="start">
                            <VpnKeyIcon color="action" />
                        </InputAdornment>
                    }
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5,
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                            },
                            '&.Mui-focused': {
                                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                            }
                        }
                    }}
                />
            </Box>

            {siteKey && (
                <Box
                    component={motion.div}
                    variants={itemVariants}
                    sx={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        mt: 1,
                        mb: 1
                    }}
                >
                    <Box
                        ref={turnstileWidgetRef}
                        sx={{
                            transform: isMobile ? 'scale(0.85)' : 'scale(1)',
                            transformOrigin: 'left',
                            minHeight: '65px', // Ensures space for the widget
                            width: '100%'
                        }}
                    />
                    {errors["cf-turnstile-response"] && (
                        <Fade in={!!errors["cf-turnstile-response"]}>
                            <FormHelperText
                                error={true}
                                sx={{
                                    textAlign: 'center',
                                    mt: 1,
                                    fontSize: '0.75rem'
                                }}
                            >
                                {errors["cf-turnstile-response"]}
                            </FormHelperText>
                        </Fade>
                    )}
                </Box>
            )}

            <Box
                component={motion.div}
                variants={itemVariants}
                sx={{
                    width: "100%",
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    justifyContent: "space-between",
                    alignItems: isMobile ? "flex-start" : "center",
                    gap: 1
                }}
            >
                <FormControlLabel
                    onChange={handleRememberChange}
                    control={
                        <Checkbox
                            defaultChecked={data.remember}
                            name="remember"
                            size="small"
                            sx={{
                                color: theme.palette.primary.main,
                                '&.Mui-checked': {
                                    color: theme.palette.primary.main,
                                },
                            }}
                        />
                    }
                    label={
                        <Typography variant="body2" color="text.secondary">
                            Remember me
                        </Typography>
                    }
                    sx={{ marginRight: 0 }}
                />

                <Link
                    href={route("password.request")}
                    style={{
                        textDecoration: "none",
                        fontFamily: theme.typography.fontFamily,
                        color: theme.palette.primary.main,
                        fontWeight: 500,
                        fontSize: '0.875rem',
                        transition: 'color 0.2s',
                        ':hover': {
                            color: theme.palette.primary.dark,
                        }
                    }}
                >
                    Forgot Password?
                </Link>
            </Box>

            <Box
                component={motion.div}
                variants={itemVariants}
                sx={{
                    width: "100%",
                    mt: 1
                }}
            >
                <LoadingButton
                    loading={processing}
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    sx={{
                        borderRadius: 1.5,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '1rem',
                        py: 1.2,
                        boxShadow: '0 4px 12px rgba(42, 57, 144, 0.2)',
                        transition: 'all 0.3s',
                        '&:hover': {
                            boxShadow: '0 6px 16px rgba(42, 57, 144, 0.35)',
                            transform: 'translateY(-2px)'
                        }
                    }}
                >
                    Sign In
                </LoadingButton>
            </Box>
        </Box>
    );
};

export default LoginForm;
