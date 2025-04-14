/**
 * Jest setup file
 * 
 * This file is used to set up the testing environment before tests are run.
 */

// Set up Jest globals
import { jest } from '@jest/globals';

// Make jest available globally
(global as any).jest = jest;