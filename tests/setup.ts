/**
 * Jest setup file
 * 
 * This file is used to set up the testing environment before tests are run.
 */

// Set up Jest globals
import { jest } from '@jest/globals';

// Make jest available globally using a simple type assertion
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).jest = jest;