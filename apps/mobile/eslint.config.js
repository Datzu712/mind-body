const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
//const expoConfig = require('eslint-config-expo/flat');
const base = require('../../eslint.config.js');

module.exports = defineConfig([
    {
        files: ['**/*.tsx', '**/*.ts'],
        extends: [base, tseslint.configs.disableTypeChecked],
        languageOptions: {
            parserOptions: {
                project: false,
                tsconfigRootDir: __dirname,
            },
        },
        rules: {
            '@typescript-eslint/no-require-imports': 'off',
        },
    },
    //expoConfig,
]);
