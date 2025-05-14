import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Alert, Box, Typography, Fade, Paper, Divider } from "@mui/material";
import { motion } from "framer-motion";
import GuestLayout from "@/Layouts/GuestLayout";
import LoginForm from "@/Components/LoginForm";

const Login = ({ status, siteKey }) => {
    const [showStatus, setShowStatus] = useState(Boolean(status));

    // Auto-hide the status alert after 5 seconds
    useEffect(() => {
        if (status) {
            const timer = setTimeout(() => {
                setShowStatus(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    // Animation variants
    const pageVariants = {
        initial: { opacity: 0, y: 20 },
        animate: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: "easeOut"
            }
        }
    };

    const alertVariants = {
        initial: { opacity: 0, y: -10, scale: 0.95 },
        animate: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.4,
                ease: "easeOut"
            }
        },
        exit: {
            opacity: 0,
            y: -10,
            scale: 0.95,
            transition: {
                duration: 0.3
            }
        }
    };

    return (
        <GuestLayout>
            <Head title="Login" />

            <Box
                component={motion.div}
                initial="initial"
                animate="animate"
                variants={pageVariants}
                sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3
                }}
            >
                <Typography
                    variant="h5"
                    sx={{
                        mb: 1,
                        fontWeight: 600,
                        color: 'primary.dark',
                        display: { xs: 'block', md: 'none' },
                        textAlign: 'center'
                    }}
                >
                    Welcome Back
                </Typography>

                {status && showStatus && (
                    <Fade in={showStatus}>
                        <Box component={motion.div} variants={alertVariants}>
                            <Alert
                                severity="success"
                                sx={{
                                    borderRadius: 2,
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                                    '& .MuiAlert-icon': {
                                        alignItems: 'center'
                                    }
                                }}
                                onClose={() => setShowStatus(false)}
                            >
                                {status}
                            </Alert>
                        </Box>
                    </Fade>
                )}

                <Box
                    component={Paper}
                    elevation={0}
                    sx={{
                        p: { xs: 2, sm: 3 },
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider'
                    }}
                >
                    <Box sx={{ mb: 3, display: { xs: 'none', md: 'block' } }}>
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 600,
                                color: 'primary.main',
                                mb: 1
                            }}
                        >
                            Welcome Back
                        </Typography>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            Please enter your credentials to access your account
                        </Typography>
                        <Divider sx={{ mt: 2 }} />
                    </Box>

                    <LoginForm siteKey={siteKey} />
                </Box>

                <Box
                    sx={{
                        mt: 2,
                        textAlign: 'center',
                        opacity: 0.8
                    }}
                >
                    <Typography
                        variant="caption"
                        color="text.secondary"
                    >
                        powered by Bion Genetic Lab
                    </Typography>
                </Box>
            </Box>
        </GuestLayout>
    );
};

export default Login;
