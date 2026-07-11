const { defineConfig } = require('eslint/config');
const eslintConfigPrettier = require('eslint-config-prettier/flat');
const tseslint = require('typescript-eslint');
const eslintPrettier = require('eslint-plugin-prettier');

module.exports = defineConfig([
    ...tseslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    eslintConfigPrettier,
    {
        files: ['**/*.ts', '**/*.tsx'],
        plugins: {
            prettier: eslintPrettier,
        },
        rules: {
            'prettier/prettier': 'error',
            'arrow-body-style': ['error', 'as-needed'],
            'prefer-arrow-callback': 'error',
        },
    },
    {
        files: ['**/*.ts'],
        languageOptions: {
            parserOptions: {
                project: ['./tsconfig.base.json'],
                tsconfigRootDir: __dirname,
            },
        },
        rules: {
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unsafe-argument': 'error',
            '@typescript-eslint/no-unsafe-assignment': 'error',
            '@typescript-eslint/no-unsafe-call': 'error',
            '@typescript-eslint/no-unsafe-member-access': 'error',
            '@typescript-eslint/await-thenable': 'error',
            '@typescript-eslint/no-misused-promises': 'error',
            '@typescript-eslint/promise-function-async': 'warn',
            '@typescript-eslint/prefer-nullish-coalescing': 'warn',
            'no-console': ['error', { allow: ['warn', 'error'] }],
            '@typescript-eslint/no-magic-numbers': 'off',
            '@typescript-eslint/no-extraneous-class': 'off',
            '@typescript-eslint/class-methods-use-this': 'off',
            '@typescript-eslint/prefer-destructuring': 'off',
            'no-console': 'off',
        },
    },
    {
        ignores: [
            '**/dist',
            '**/*.mjs',
            '**/*.js',
            'dist/**',
            '**/out-tsc',
            '**/generated',
            '**/gen',
            '**/__tests__/**',
            '**/?(*.)+(spec|test).[jt]s?(x)',
            'old/**',
            '**/apps/dashboard/**',
        ],
    },
]);
