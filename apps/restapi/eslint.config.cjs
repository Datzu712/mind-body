const { defineConfig } = require('eslint/config');
const base = require('../../eslint.config.js');

module.exports = defineConfig([
    {
        files: ['**/*.ts'],
        extends: [base],
        languageOptions: {
            parserOptions: {
                project: ['./tsconfig.json'],
                tsconfigRootDir: __dirname,
            },
        },
    },
]);
