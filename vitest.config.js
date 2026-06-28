import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Dedicated Vitest config so the test runner does NOT load the
// laravel-vite-plugin from vite.config.js — that plugin hard-fails in CI
// ("You should not run the Vite HMR server in CI environments").
export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./resources/js/test/setup.js'],
        include: ['resources/js/**/*.{test,spec}.{js,jsx}'],
        css: false,
        restoreMocks: true,
    },
});
