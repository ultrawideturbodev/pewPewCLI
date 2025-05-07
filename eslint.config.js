import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default [
  // Config for JavaScript files
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    ignores: ['dist/**', 'node_modules/**'],
    ...eslint.configs.recommended,
    rules: {
      'no-console': 'off',
      'no-undef': 'off', // More lenient for JS files
    },
  },
  // Config for TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: [
      'dist/**', 
      'node_modules/**'
    ],
    ...tseslint.configs.recommended[0],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'warn', // Changed to warning
      '@typescript-eslint/no-unused-vars': 'warn', // Changed to warning
      'no-case-declarations': 'warn', // Changed to warning
    },
  },
  // Config specific for test files
  {
    files: ['tests/**/*.ts', 'tests/**/*.js'],
    ...eslint.configs.recommended,
    rules: {
      'no-undef': 'off',
    },
  },
  prettierConfig,
]; 