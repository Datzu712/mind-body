const { defineConfig } = require('eslint/config');
const base = require('../../eslint.config.js');

module.exports = defineConfig([
    {
        files: ['**/*.ts', '**/*.tsx'],
        extends: [base],
        languageOptions: {
            parserOptions: {
                project: true,
                tsconfigRootDir: __dirname,
            },
        },
    },
]);
