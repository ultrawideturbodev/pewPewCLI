/**
 * Jest setup file
 * 
 * This file runs before each test suite and configures the test environment.
 */

// Make jest available globally
import { jest } from '@jest/globals';

// Extend expect with additional matchers if needed
// import 'jest-extended';

// Configure the global jest object
globalThis.jest = jest;

// Set default timeout for tests (10 seconds)
jest.setTimeout(10000);