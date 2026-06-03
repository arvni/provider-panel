import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    server: {
        host: '0.0.0.0',
        port: 5173,
        strictPort: true,
        cors: true,
        allowedHosts: true,
        hmr: {
            host: process.env.VITE_HMR_HOST || 'localhost',
            protocol: 'ws',
            clientPort: Number(process.env.VITE_HMR_CLIENT_PORT || 5173),
        },
        watch: { usePolling: true },
    },
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
});
