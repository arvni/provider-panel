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

// Base theme — color mode is managed per-session in AuthenticatedLayout
let theme = createTheme({
    cssVariables: { colorSchemeSelector: 'data-mui-color-scheme' },
    colorSchemes: {
        light: {
            palette: {
                primary: { main: '#2a3990', light: '#5561c1', dark: '#001762' },
                secondary: { main: '#42a5f5', light: '#80d6ff', dark: '#0077c2' },
                background: { default: '#f5f7fa', paper: '#ffffff' },
                text: { primary: '#212121', secondary: '#757575' },
            },
        },
        dark: {
            palette: {
                primary: { main: '#5561c1', light: '#8490f5', dark: '#2a3990' },
                background: { default: '#121212', paper: '#1e1e1e' },
            },
        },
    },
    typography: {
        fontFamily: [
            "Montserrat", "-apple-system", "BlinkMacSystemFont",
            "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif",
        ].join(','),
        h1: { fontWeight: 700 },
        h2: { fontWeight: 600 },
        h3: { fontWeight: 600 },
        h4: { fontWeight: 600 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
        button: { fontWeight: 600, textTransform: 'none' },
    },
    shape: { borderRadius: 8 },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    boxShadow: 'none',
                    '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.1)' },
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: { boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: { marginBottom: '16px' },
            },
        },
    },
});

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
