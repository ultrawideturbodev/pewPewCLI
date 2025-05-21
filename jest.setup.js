/**
 * Jest setup file
 * 
 * This file runs before each test suite and configures the test environment.
 */

// Make jest available globally - use CommonJS for setup files
const { jest } = require('@jest/globals');

// Configure the global jest object
globalThis.jest = jest;

// Set default timeout for tests (10 seconds)
jest.setTimeout(10000);