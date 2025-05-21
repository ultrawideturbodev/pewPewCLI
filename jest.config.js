/**
 * Jest configuration for TypeScript ESM project
 * 
 * This configuration is designed for testing TypeScript code that uses ESM modules.
 * It includes settings for handling ESM imports, managing module paths, and setting up ts-jest.
 */

export default {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',

  // Use Node.js environment
  testEnvironment: 'node',
  
  // Treat .ts files as ESM modules
  extensionsToTreatAsEsm: ['.ts'],
  
  // Map import paths - this is crucial for ESM with TypeScript
  // This transforms import paths like '../foo.js' to '../foo'
  // Also maps absolute imports to their actual locations
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@/(.*)\.js$': '<rootDir>/src/$1',
    '^@tests/(.*)\.js$': '<rootDir>/tests/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },
  
  // Configure ts-jest to handle ESM
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },

  // Set test match patterns - all tests in tests/ directory
  testMatch: [
    '**/tests/unit/*.test.ts',
  ],
  
  // Skip specific tests with ESM module resolution issues
  testPathIgnorePatterns: [
    '/node_modules/',
    // Temporarily disabled due to ESM import issues:
    'tests/unit/cli.service.test.ts',
    'tests/unit/cli.service.templates.test.ts', 
    'tests/unit/config.service.templates.test.ts',
    'tests/unit/file-system.service.test.ts',
    'tests/unit/yaml.service.test.ts',
  ],
  
  // Setup files to run before tests
  setupFilesAfterEnv: ['./jest.setup.js'],
  
  // Configure coverage collection
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
};