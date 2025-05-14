import React, { useEffect, useState, useMemo } from 'react';
import { Head, usePage, useRemember } from "@inertiajs/react";
import {
    createTheme,
    ThemeProvider,
    alpha,
} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import Paper from "@mui/material/Paper";
import {
    Backdrop,
    CircularProgress,
    Snackbar,
    Alert,
    Fade,
    IconButton,
    Tooltip,
    Zoom,
    useMediaQuery,
} from "@mui/material";
import Drawer from './Components/Drawer';
import Copyright from './Components/Copyright';
import Header from './Components/Header';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import BrightnessAutoIcon from '@mui/icons-material/BrightnessAuto';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { motion, AnimatePresence } from 'framer-motion';

export default function Authenticated({ auth, breadcrumbs, children, title }) {
    const [open, setOpen] = useRemember(true, 'sidebar-open');
    const [loading, setLoading] = useState(false);
    const [scrollPosition, setScrollPosition] = useState(0);
    const [colorMode, setColorMode] = useRemember('light', 'color-mode');
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const { flash } = usePage().props;

    // Create a theme based on color mode
    const theme = useMemo(() =>
            createTheme({
                palette: {
                    mode: colorMode === 'auto' ? (prefersDarkMode ? 'dark' : 'light') : colorMode,
                    primary: {
                        main: '#2a3990', // Professional blue
                    },
                    secondary: {
                        main: '#42a5f5',
                    },
                    background: {
                        default: colorMode === 'dark' ? '#121212' : '#f5f7fa',
                        paper: colorMode === 'dark' ? '#1e1e1e' : '#ffffff',
                    },
                },
                typography: {
                    fontFamily: [
                        "Montserrat",
                        "-apple-system",
                        "BlinkMacSystemFont",
                        "Segoe UI",
                        "Roboto",
                        "Helvetica Neue",
                        "Arial",
                        "sans-serif",
                    ].join(','),
                },
                shape: {
                    borderRadius: 8,
                },
                components: {
                    MuiPaper: {
                        styleOverrides: {
                            root: {
                                transition: 'box-shadow 0.3s ease, background-color 0.3s ease',
                            },
                        },
                    },
                    MuiAppBar: {
                        styleOverrides: {
                            root: {
                                boxShadow: colorMode === 'dark'
                                    ? '0 2px 8px rgba(0,0,0,0.5)'
                                    : '0 1px 4px rgba(0,0,0,0.1)',
                            },
                        },
                    },
                },
            }),
        [colorMode, prefersDarkMode]);

    // Inertia loading events
    useEffect(() => {
        const handleStart = () => setLoading(true);
        const handleFinish = () => {
            setLoading(false);

            // Show flash messages as notifications
            if (flash && flash.message) {
                showNotification(flash.message, flash.type || 'info');
            }
        };

        document.addEventListener('inertia:start', handleStart);
        document.addEventListener('inertia:finish', handleFinish);

        return () => {
            document.removeEventListener('inertia:start', handleStart);
            document.removeEventListener('inertia:finish', handleFinish);
        };
    }, [flash]);

    // Scroll position tracking
    useEffect(() => {
        const handleScroll = () => {
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                const position = mainContent.scrollTop;
                setScrollPosition(position);
                setShowScrollTop(position > 200);
            }
        };

        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.addEventListener('scroll', handleScroll);
            return () => mainContent.removeEventListener('scroll', handleScroll);
        }
    }, []);

    // Toggle drawer
    const toggleDrawer = () => {
        setOpen(!open);
    };

    // Toggle dark/light mode
    const toggleColorMode = () => {
        setColorMode(prevMode => {
            if (prevMode === 'light') return 'dark';
            if (prevMode === 'dark') return 'auto';
            return 'light';
        });
    };

    // Show notification
    const showNotification = (message, severity = 'info') => {
        setNotification({ open: true, message, severity });
    };

    // Scroll to top handler
    const scrollToTop = () => {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    };

    // Get color mode icon
    const getColorModeIcon = () => {
        if (colorMode === 'auto') return <BrightnessAutoIcon />;
        if (colorMode === 'dark') return <Brightness4Icon />;
        return <Brightness7Icon />;
    };

    // Get color mode tooltip text
    const getColorModeTooltip = () => {
        if (colorMode === 'auto') return 'Using system preference';
        if (colorMode === 'dark') return 'Dark mode';
        return 'Light mode';
    };

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
                <CssBaseline />
                {title && <Head title={title} />}

                <Header
                    breadcrumbs={breadcrumbs}
                    toggleDrawer={toggleDrawer}
                    auth={auth}
                    open={open}
                    colorMode={colorMode}
                    toggleColorMode={toggleColorMode}
                />

                <Drawer
                    open={open}
                    toggleDrawer={toggleDrawer}
                    auth={auth}
                    colorMode={colorMode}
                />

                <Box
                    component="main"
                    id="main-content"
                    sx={{
                        backgroundColor: (theme) => theme.palette.background.default,
                        flexGrow: 1,
                        height: '100vh',
                        overflow: 'auto',
                        transition: 'background-color 0.3s ease',
                        scrollBehavior: 'smooth',
                        position: 'relative',
                    }}
                >
                    <Toolbar />

                    <Container
                        sx={{
                            mt: { xs: 2, sm: 3, md: 4 },
                            mb: { xs: 2, sm: 3, md: 4 },
                            px: { xs: 2, sm: 3, md: 4 }
                        }}
                        maxWidth={false}
                        component={motion.div}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <Paper
                            elevation={colorMode === 'dark' ? 4 : 2}
                            sx={{
                                p: { xs: 2, sm: 3, md: 5 },
                                borderRadius: "1rem",
                                boxShadow: colorMode === 'dark'
                                    ? '0 6px 16px rgba(0,0,0,0.6)'
                                    : '0 4px 20px rgba(0,0,0,0.08)',
                                overflow: 'hidden',
                                position: 'relative',
                                '&:hover': {
                                    boxShadow: colorMode === 'dark'
                                        ? '0 8px 24px rgba(0,0,0,0.7)'
                                        : '0 8px 32px rgba(0,0,0,0.12)'
                                }
                            }}
                            component={motion.div}
                            layout
                        >
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={title || 'content'}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {children}
                                </motion.div>
                            </AnimatePresence>
                        </Paper>

                        <Copyright
                            sx={{
                                pt: 4,
                                opacity: 0.8,
                                textAlign: 'center',
                                color: theme.palette.text.secondary
                            }}
                        />
                    </Container>

                    {/* Floating action buttons */}
                    <Box
                        sx={{
                            position: 'fixed',
                            bottom: 24,
                            right: 24,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                            zIndex: 1000,
                        }}
                    >
                        {/* Color mode toggle */}
                        <Tooltip
                            title={getColorModeTooltip()}
                            placement="left"
                            TransitionComponent={Zoom}
                        >
                            <IconButton
                                color="primary"
                                onClick={toggleColorMode}
                                sx={{
                                    backgroundColor: theme.palette.background.paper,
                                    boxShadow: theme.shadows[4],
                                    '&:hover': {
                                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                    }
                                }}
                                size="medium"
                            >
                                {getColorModeIcon()}
                            </IconButton>
                        </Tooltip>

                        {/* Scroll to top button */}
                        <Fade in={showScrollTop}>
                            <Tooltip
                                title="Scroll to top"
                                placement="left"
                                TransitionComponent={Zoom}
                            >
                                <IconButton
                                    color="primary"
                                    onClick={scrollToTop}
                                    sx={{
                                        backgroundColor: theme.palette.background.paper,
                                        boxShadow: theme.shadows[4],
                                        '&:hover': {
                                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                        }
                                    }}
                                    size="medium"
                                >
                                    <ArrowUpwardIcon />
                                </IconButton>
                            </Tooltip>
                        </Fade>
                    </Box>
                </Box>
            </Box>

            {/* Loading overlay */}
            <Backdrop
                open={loading}
                sx={{
                    zIndex: theme.zIndex.modal + 1,
                    color: '#fff',
                    backgroundColor: alpha(theme.palette.background.paper, 0.7),
                    backdropFilter: 'blur(4px)'
                }}
            >
                <CircularProgress
                    color="primary"
                    size={60}
                    thickness={4}
                />
            </Backdrop>

            {/* Notification snackbar */}
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={() => setNotification({ ...notification, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                TransitionComponent={Fade}
            >
                <Alert
                    onClose={() => setNotification({ ...notification, open: false })}
                    severity={notification.severity}
                    variant="filled"
                    sx={{ width: '100%', boxShadow: theme.shadows[6] }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </ThemeProvider>
    );
}
