/**
 * Jest configuration for TypeScript ESM project
 * 
 * This configuration is designed for testing TypeScript code that uses ESM modules
 * with proper ESM module mocking support.
 */

export default {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest/presets/default-esm',

  // Use Node.js environment
  testEnvironment: 'node',
  
  // Treat .ts files as ESM modules
  extensionsToTreatAsEsm: ['.ts'],
  
  // Map import paths - this is crucial for ESM with TypeScript
  // Handle both .js extensions (which TypeScript outputs) and direct imports
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },
  
  // Configure ts-jest using the new transform syntax
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
    }],
  },

  // Set test match patterns - all tests in tests/ directory
  testMatch: [
    '**/tests/unit/*.test.ts',
  ],
  
  // Ignore node_modules and examples
  testPathIgnorePatterns: [
    '/node_modules/',
    '/examples/',
  ],
  
  // Setup files to run before tests
  setupFilesAfterEnv: ['./jest.setup.js'],
  
  // Configure coverage collection
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
};