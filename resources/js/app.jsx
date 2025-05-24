import './bootstrap';
import React from "react";
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createTheme, ThemeProvider, responsiveFontSizes } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { SnackbarProvider } from "notistack";
import { SWRConfig } from "swr";
import LoadingBar from 'react-top-loading-bar';
import {swrConfig} from "@/Layouts/Components/Notification/lib/swrConfig.js";

// Create a responsive theme with consistent branding colors
let theme = createTheme({
    palette: {
        primary: {
            main: '#2a3990', // Professional blue for brand consistency
            light: '#5561c1',
            dark: '#001762',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#42a5f5', // Complementary blue
            light: '#80d6ff',
            dark: '#0077c2',
            contrastText: '#ffffff',
        },
        background: {
            default: '#f5f7fa',
            paper: '#ffffff',
        },
        error: {
            main: '#d32f2f',
        },
        warning: {
            main: '#f57c00',
        },
        info: {
            main: '#0288d1',
        },
        success: {
            main: '#388e3c',
        },
        text: {
            primary: '#212121',
            secondary: '#757575',
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
        h1: {
            fontWeight: 700,
        },
        h2: {
            fontWeight: 600,
        },
        h3: {
            fontWeight: 600,
        },
        h4: {
            fontWeight: 600,
        },
        h5: {
            fontWeight: 600,
        },
        h6: {
            fontWeight: 600,
        },
        button: {
            fontWeight: 600,
            textTransform: 'none', // More modern approach without all-caps buttons
        },
    },
    shape: {
        borderRadius: 8, // Consistent border radius throughout the app
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                },
                elevation1: {
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    overflow: 'hidden',
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                    },
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    marginBottom: '16px',
                },
            },
        },
    },
});

// Make typography responsive across different screen sizes
theme = responsiveFontSizes(theme);

const appName = import.meta.env.VITE_APP_NAME || 'Bion Genetic Lab';

// Snackbar configuration
const snackbarConfig = {
    maxSnack: 3,
    autoHideDuration: 5000,
    preventDuplicate: true,
    anchorOrigin: {
        vertical: 'bottom',
        horizontal: 'right',
    },
    variant: 'default',
};

// Progress bar component for better loading experience
const Progress = ({ isAnimating }) => {
    const progressRef = React.useRef(null);

    React.useEffect(() => {
        if (isAnimating) {
            progressRef.current?.continuousStart();
        } else {
            progressRef.current?.complete();
        }
    }, [isAnimating]);

    return (
        <LoadingBar
            color={theme.palette.primary.main}
            ref={progressRef}
            shadow={true}
            height={3}
        />
    );
};

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ThemeProvider theme={theme}>
                <CssBaseline /> {/* Reset CSS for consistent styling */}
                <SnackbarProvider {...snackbarConfig}>
                    <SWRConfig value={swrConfig}>
                        <Progress isAnimating={props.initialPage?.props?.isLoading} />
                        <App {...props} />
                    </SWRConfig>
                </SnackbarProvider>
            </ThemeProvider>
        );
    },
    progress: {
        color: '#2a3990', // Match primary color
        showSpinner: true,
    },
});
