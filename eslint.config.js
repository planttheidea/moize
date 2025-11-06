import eslint from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tsEslint from 'typescript-eslint';
import eslintImportPlugin from 'eslint-plugin-import';
import eslintReactPlugin from 'eslint-plugin-react';

export default defineConfig([
    globalIgnores([
        '**/!(src|dev)/**/*', // Ignore everything in all directories except src
        '**/!(src|dev)', // Ignore all directories except src
        '!src/**/*', // Don't ignore anything in src directory
        '!dev/**/*', // Don't ignore anything in dev directory
    ]),
    eslint.configs.recommended,
    tsEslint.configs.strictTypeChecked,
    tsEslint.configs.stylisticTypeChecked,
    eslintImportPlugin.flatConfigs.recommended,
    eslintImportPlugin.flatConfigs.typescript,
    eslintReactPlugin.configs.flat.recommended,
    eslintReactPlugin.configs.flat['jsx-runtime'],
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            'prefer-rest-params': 'off',

            'import/consistent-type-specifier-style': [
                'error',
                'prefer-top-level',
            ],
            'import/enforce-node-protocol-usage': ['error', 'always'],
            'import/first': 'error',
            'import/newline-after-import': 'error',
            'import/no-default-export': 'error',
            'import/no-empty-named-blocks': 'error',
            'import/no-unresolved': 'off',
            'import/order': [
                'error',
                {
                    'newlines-between': 'never',
                },
            ],
            'import/no-absolute-path': 'error',
            'import/no-self-import': 'error',

            '@typescript-eslint/array-type': [
                'error',
                { default: 'array-simple' },
            ],
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unsafe-return': 'off',
            '@typescript-eslint/no-unused-expressions': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
            '@typescript-eslint/prefer-for-of': 'off',
            '@typescript-eslint/prefer-nullish-coalescing': 'off',
            '@typescript-eslint/prefer-optional-chain': 'off',
            '@typescript-eslint/restrict-plus-operands': 'off',
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },
]);
