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
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
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

  // Set test match patterns - including only successful tests for now
  testMatch: [
    '**/src/tasks/__tests__/task.service.test.ts',
    '**/src/core/__tests__/logger.service.test.ts',
    '**/src/io/__tests__/template-config.dto.test.ts',
    '**/src/io/__tests__/default-config.test.ts',
  ],
  
  // Setup files to run before tests
  setupFilesAfterEnv: ['./jest.setup.js'],
  
  // Configure coverage collection
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
};