import { defineConfig } from 'eslint/config';
import base from '../../eslint.config.js';

export default defineConfig([
    {
        files: ['**/*.ts', '**/*.tsx'],
        extends: [base],
        languageOptions: {
            parserOptions: {
                project: ['./tsconfig.json', './tsconfig.node.json'],
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
]);
