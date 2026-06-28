import React, { useEffect, useState } from "react";
import { Head, router } from "@inertiajs/react";
import {
    Alert,
    Box,
    Divider,
    Fade,
    InputAdornment,
    Paper,
    Typography,
    Link as MuiLink,
} from "@mui/material";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import PinIcon from "@mui/icons-material/Pin";
import { motion } from "framer-motion";
import GuestLayout from "@/Layouts/GuestLayout";
import { useSubmitForm } from "@/Services/api";
import LoadingButton from "@/Components/LoadingButton.jsx";
import { TextField } from "@mui/material";

const RESEND_COOLDOWN = 60; // seconds, mirrors config('two_factor.resend_throttle')

const TwoFactorChallenge = ({ email, status }) => {
    const [showStatus, setShowStatus] = useState(Boolean(status));
    const [cooldown, setCooldown] = useState(0);
    const [resending, setResending] = useState(false);

    const { data, setData, submit, processing, errors, clearErrors } = useSubmitForm(
        { code: "" },
        route("two-factor.verify")
    );

    useEffect(() => {
        setShowStatus(Boolean(status));
    }, [status]);

    // Countdown timer for the resend button.
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    const handleSubmit = (e) => {
        e.preventDefault();
        clearErrors();
        submit();
    };

    const handleChange = (e) => {
        // Only digits, capped at 6 characters.
        const value = e.target.value.replace(/\D/g, "").slice(0, 6);
        setData("code", value);
    };

    const handleResend = () => {
        if (cooldown > 0 || resending) return;
        setResending(true);
        router.post(
            route("two-factor.resend"),
            {},
            {
                preserveScroll: true,
                onSuccess: () => setCooldown(RESEND_COOLDOWN),
                onFinish: () => setResending(false),
            }
        );
    };

    const pageVariants = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
    };

    return (
        <GuestLayout>
            <Head title="Two-Factor Verification" />

            <Box
                component={motion.div}
                initial="initial"
                animate="animate"
                variants={pageVariants}
                sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 3 }}
            >
                {status && showStatus && (
                    <Fade in={showStatus}>
                        <Alert
                            severity="success"
                            onClose={() => setShowStatus(false)}
                            sx={{ borderRadius: 2, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}
                        >
                            {status}
                        </Alert>
                    </Fade>
                )}

                <Box
                    component={Paper}
                    elevation={0}
                    sx={{
                        p: { xs: 2, sm: 3 },
                        borderRadius: 2,
                        bgcolor: "background.paper",
                        border: "1px solid",
                        borderColor: "divider",
                    }}
                >
                    <Box
                        sx={{
                            mb: 3,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            textAlign: "center",
                        }}
                    >
                        <ShieldOutlinedIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography
                            variant="h5"
                            sx={{ fontWeight: 600, color: "primary.main", mb: 1 }}
                        >
                            Two-Factor Verification
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            We sent a 6-digit code to{" "}
                            <Box component="span" sx={{ fontWeight: 600 }}>
                                {email}
                            </Box>
                            . Enter it below to finish signing in.
                        </Typography>
                        <Divider sx={{ mt: 2, width: "100%" }} />
                    </Box>

                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
                    >
                        <TextField
                            name="code"
                            value={data.code}
                            onChange={handleChange}
                            label="Verification Code"
                            autoComplete="one-time-code"
                            autoFocus
                            required
                            fullWidth
                            inputProps={{ inputMode: "numeric", pattern: "[0-9]*", maxLength: 6 }}
                            helperText={errors.code ?? ""}
                            error={Object.prototype.hasOwnProperty.call(errors, "code")}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PinIcon color="action" />
                                    </InputAdornment>
                                ),
                                sx: { letterSpacing: "0.4em", fontWeight: 600 },
                            }}
                        />

                        <LoadingButton
                            loading={processing}
                            type="submit"
                            variant="contained"
                            fullWidth
                            size="large"
                            disabled={data.code.length !== 6}
                            sx={{
                                borderRadius: 1.5,
                                textTransform: "none",
                                fontWeight: 600,
                                fontSize: "1rem",
                                py: 1.2,
                            }}
                        >
                            Verify &amp; Continue
                        </LoadingButton>

                        <Box sx={{ textAlign: "center" }}>
                            <Typography variant="body2" color="text.secondary" component="span">
                                Didn&apos;t get a code?{" "}
                            </Typography>
                            {cooldown > 0 ? (
                                <Typography variant="body2" color="text.disabled" component="span">
                                    Resend in {cooldown}s
                                </Typography>
                            ) : (
                                <MuiLink
                                    component="button"
                                    type="button"
                                    onClick={handleResend}
                                    underline="hover"
                                    sx={{ fontWeight: 500, cursor: "pointer" }}
                                >
                                    Resend code
                                </MuiLink>
                            )}
                        </Box>
                    </Box>
                </Box>

                <Box sx={{ mt: 2, textAlign: "center", opacity: 0.8 }}>
                    <Typography variant="caption" color="text.secondary">
                        powered by Bion Genetic Lab
                    </Typography>
                </Box>
            </Box>
        </GuestLayout>
    );
};

export default TwoFactorChallenge;
