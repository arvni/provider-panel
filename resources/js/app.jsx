import './bootstrap';

import {createRoot} from 'react-dom/client';
import {createInertiaApp} from '@inertiajs/react';
import {resolvePageComponent} from 'laravel-vite-plugin/inertia-helpers';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {SnackbarProvider} from "notistack";
import {fetcher} from "@/Services/api";
import React from "react";
import {SWRConfig} from "swr";

const defaultTheme = createTheme({
    typography: {
        fontFamily: [
            "Montserrat",
            "Tofu"
        ].join(','),
    },
});

const appName = import.meta.env.VITE_APP_NAME || 'Bion';


createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({el, App, props}) {
        const root = createRoot(el);
        root.render(<ThemeProvider theme={defaultTheme}>
            <SnackbarProvider maxSnack={3}>
                <SWRConfig value={{
                    refreshInterval: 10000,
                    fetcher
                }}>
                    <App {...props} />
                </SWRConfig>
            </SnackbarProvider>
        </ThemeProvider>);
    },
    progress: {
        color: '#4B5563',
    },
});
