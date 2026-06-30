import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default [
    {
        ignores: ['public/build/**', 'vendor/**', 'node_modules/**', 'bootstrap/ssr/**'],
    },
    js.configs.recommended,
    // Swap in the TypeScript parser for the incrementally migrated .ts/.tsx files
    // (see IMPROVEMENT_PLAN.md item 11) so ESLint can read type annotations. The
    // shared rule block below applies to JS and TS alike; `tsc --noEmit`
    // (npm run typecheck) does the actual type checking.
    {
        files: ['resources/js/**/*.{ts,tsx}'],
        languageOptions: {
            parser: tseslint.parser,
        },
    },
    {
        files: ['resources/js/**/*.{js,jsx,ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.es2022,
                route: 'readonly',
                axios: 'readonly',
            },
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
        },
        plugins: {
            react,
            'react-hooks': reactHooks,
        },
        settings: {
            react: { version: 'detect' },
        },
        rules: {
            ...react.configs.flat.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

            // High-value bug-catchers — kept as errors (CI gates on these).
            'react/jsx-key': 'error',
            'no-case-declarations': 'error',
            'no-empty': 'error',

            // Stylistic / experimental rules — downgraded to warnings to clean up
            // incrementally. See IMPROVEMENT_PLAN.md item 3 follow-ups.
            'react/no-children-prop': 'warn',
            'react/no-unescaped-entities': 'warn',
            'no-prototype-builtins': 'warn',
            'react-hooks/exhaustive-deps': 'warn',
            'react-hooks/set-state-in-effect': 'warn',
            'react-hooks/immutability': 'warn',
            'react-hooks/static-components': 'warn',
            'react-hooks/purity': 'warn',
            'react-hooks/rules-of-hooks': 'warn',
        },
    },
    // TS-only rule overrides (applied after the shared block). The base
    // no-unused-vars misfires on type-only references; tsconfig's
    // noUnusedLocals/noUnusedParameters covers unused detection for TS instead.
    {
        files: ['resources/js/**/*.{ts,tsx}'],
        rules: {
            'no-unused-vars': 'off',
        },
    },
    prettier,
];
