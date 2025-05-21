/**
 * LoggerService Unit Tests
 */
import { describe, test, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { LoggerService } from '@/core/logger.service.js';

// Mock the entire chalk module
jest.mock('chalk', () => {
  return {
    default: {
      green: (text) => `GREEN:${text}`,
      blue: (text) => `BLUE:${text}`,
      yellow: (text) => `YELLOW:${text}`,
      red: (text) => `RED:${text}`,
      bold: (text) => `BOLD:${text}`,
    }
  };
});

describe('LoggerService', () => {
  let loggerService: LoggerService;
  
  beforeEach(() => {
    // Clear the singleton instance for each test
    // @ts-expect-error - Accessing private static field for testing
    LoggerService.instance = null;
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'info').mockImplementation();
    
    // Get a fresh instance of the service
    loggerService = LoggerService.getInstance();
  });
  
  afterEach(() => {
    // Restore console mocks
    jest.restoreAllMocks();
  });
  
  describe('getInstance', () => {
    test('should return a singleton instance', () => {
      const instance1 = LoggerService.getInstance();
      const instance2 = LoggerService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });
  
  describe('log', () => {
    test('should log message to console', () => {
      const spy = jest.spyOn(console, 'log');
      
      loggerService.log('Test message');
      
      expect(spy).toHaveBeenCalledWith('Test message');
    });
  });
  
  describe('error', () => {
    test('should log error message to console', () => {
      const spy = jest.spyOn(console, 'error');
      
      loggerService.error('Error message');
      
      // With the mock, this should be called with RED:Error message
      expect(spy).toHaveBeenCalled();
    });
    
    test('should handle Error objects', () => {
      const spy = jest.spyOn(console, 'error');
      const error = new Error('Test error');
      
      loggerService.error('Error occurred', error);
      
      expect(spy).toHaveBeenCalled();
    });
  });
  
  describe('warn', () => {
    test('should log warning message to console', () => {
      const spy = jest.spyOn(console, 'warn');
      
      loggerService.warn('Warning message');
      
      expect(spy).toHaveBeenCalled();
    });
  });
  
  describe('info', () => {
    test('should log info message to console', () => {
      const spy = jest.spyOn(console, 'info');
      
      loggerService.info('Info message');
      
      expect(spy).toHaveBeenCalled();
    });
  });
  
  describe('success', () => {
    test('should log success message to console', () => {
      const spy = jest.spyOn(console, 'log');
      
      loggerService.success('Success message');
      
      expect(spy).toHaveBeenCalled();
    });
  });
  
  describe('header', () => {
    test('should log header message to console', () => {
      const spy = jest.spyOn(console, 'log');
      
      loggerService.header('Header message');
      
      expect(spy).toHaveBeenCalled();
    });
  });
  
  describe('divider', () => {
    test('should log divider to console', () => {
      const spy = jest.spyOn(console, 'log');
      
      loggerService.divider(10);
      
      expect(spy).toHaveBeenCalledWith('═'.repeat(10));
    });
    
    test('should use custom divider character when provided', () => {
      const spy = jest.spyOn(console, 'log');
      
      loggerService.divider(5, '-');
      
      expect(spy).toHaveBeenCalledWith('-----');
    });
  });
  
  describe('taskLines', () => {
    test('should log task lines to console', () => {
      const spy = jest.spyOn(console, 'log');
      const taskLines = ['- [ ] Task 1', '- [x] Task 2'];
      
      loggerService.taskLines(taskLines);
      
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenNthCalledWith(1, '- [ ] Task 1');
      expect(spy).toHaveBeenNthCalledWith(2, '- [x] Task 2');
    });
    
    test('should handle empty task lines array', () => {
      const spy = jest.spyOn(console, 'log');
      
      loggerService.taskLines([]);
      
      expect(spy).not.toHaveBeenCalled();
    });
  });
});