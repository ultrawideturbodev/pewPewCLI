import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default [
  // Ignore dist directory globally
  {
    ignores: ['dist/**', 'node_modules/**', '*.d.ts'],
  },
  // Config for JavaScript files
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    ...eslint.configs.recommended,
    rules: {
      'no-console': 'off',
      'no-undef': 'off', // More lenient for JS files
    },
  },
  // Config for TypeScript files
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      ...config.rules,
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'warn', // Changed to warning
      '@typescript-eslint/no-unused-vars': 'warn', // Changed to warning
      'no-case-declarations': 'warn', // Changed to warning
    },
  })),
  // Config specific for test files
  {
    files: ['tests/**/*.ts', 'tests/**/*.js'],
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': 'warn', // Allow unused vars in tests
    },
  },
  prettierConfig,
];