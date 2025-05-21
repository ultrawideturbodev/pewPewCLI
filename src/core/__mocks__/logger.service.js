/**
 * Mock for LoggerService
 */

const mockLoggerInstance = {
  log: jest.fn(),
  success: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  header: jest.fn(),
  divider: jest.fn(),
  taskLines: jest.fn(),
};

export const LoggerService = {
  getInstance: jest.fn(() => mockLoggerInstance),
  instance: mockLoggerInstance,
};