/**
 * FileSystemService Unit Tests
 */
import { describe, test, expect, beforeEach, jest, afterEach } from '@jest/globals';

// Mock fs, path, and os modules
jest.mock('fs/promises');
jest.mock('path');
jest.mock('os');

// Import fs, path, and os modules after mocking
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Mock the logger service 
jest.mock('../../core/logger.service', () => {
  return {
    LoggerService: {
      getInstance: jest.fn(() => ({
        log: jest.fn(),
        success: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        header: jest.fn(),
        divider: jest.fn(),
        taskLines: jest.fn()
      }))
    }
  };
});

// Import the class under test
import { FileSystemService } from '../file-system.service.js';
import { LoggerService } from '../../core/logger.service.js';

describe('FileSystemService', () => {
  let fileSystemService: FileSystemService;
  let mockReadFile: jest.Mock;
  let mockWriteFile: jest.Mock;
  let mockAccess: jest.Mock;
  let mockMkdir: jest.Mock;
  let mockLogger: any;
  
  beforeEach(() => {
    // Set up mock implementations
    mockReadFile = jest.fn().mockResolvedValue('file content');
    mockWriteFile = jest.fn().mockResolvedValue(undefined);
    mockAccess = jest.fn().mockResolvedValue(undefined);
    mockMkdir = jest.fn().mockResolvedValue(undefined);
    
    // Apply mocks to imported modules
    (fs.readFile as unknown) = mockReadFile;
    (fs.writeFile as unknown) = mockWriteFile;
    (fs.access as unknown) = mockAccess;
    (fs.mkdir as unknown) = mockMkdir;
    
    // Mock path and os methods
    (path.resolve as jest.Mock).mockImplementation((...paths) => paths.join('/'));
    (path.join as jest.Mock).mockImplementation((...paths) => paths.join('/'));
    (path.dirname as jest.Mock).mockImplementation((p) => p.split('/').slice(0, -1).join('/') || '/');
    (os.homedir as jest.Mock).mockReturnValue('/home/user');
    
    // Get logger mock
    mockLogger = LoggerService.getInstance();
    
    // Create a fresh instance for testing
    fileSystemService = new FileSystemService();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('readFile', () => {
    test('should read file content', async () => {
      mockReadFile.mockResolvedValueOnce('test content');
      
      const result = await fileSystemService.readFile('/path/to/file.txt');
      
      expect(mockReadFile).toHaveBeenCalledWith('/path/to/file.txt', 'utf-8');
      expect(result).toBe('test content');
    });
    
    test('should throw error when reading fails', async () => {
      const error = new Error('Read error');
      mockReadFile.mockRejectedValueOnce(error);
      
      await expect(fileSystemService.readFile('/path/to/file.txt')).rejects.toThrow();
      
      expect(mockReadFile).toHaveBeenCalledWith('/path/to/file.txt', 'utf-8');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
  
  describe('writeFile', () => {
    test('should write content to file', async () => {
      await fileSystemService.writeFile('/path/to/file.txt', 'test content');
      
      expect(mockWriteFile).toHaveBeenCalledWith('/path/to/file.txt', 'test content', 'utf-8');
    });
    
    test('should throw error when writing fails', async () => {
      const error = new Error('Write error');
      mockWriteFile.mockRejectedValueOnce(error);
      
      await expect(fileSystemService.writeFile('/path/to/file.txt', 'test content')).rejects.toThrow();
      
      expect(mockWriteFile).toHaveBeenCalledWith('/path/to/file.txt', 'test content', 'utf-8');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
  
  describe('pathExists', () => {
    test('should return true when path exists', async () => {
      mockAccess.mockResolvedValueOnce(undefined);
      
      const result = await fileSystemService.pathExists('/path/to/file.txt');
      
      expect(mockAccess).toHaveBeenCalledWith('/path/to/file.txt');
      expect(result).toBe(true);
    });
    
    test('should return false when path does not exist', async () => {
      mockAccess.mockRejectedValueOnce(new Error('ENOENT'));
      
      const result = await fileSystemService.pathExists('/path/to/nonexistent.txt');
      
      expect(mockAccess).toHaveBeenCalledWith('/path/to/nonexistent.txt');
      expect(result).toBe(false);
    });
  });
  
  describe('createDirectory', () => {
    test('should create directory with recursive option', async () => {
      await fileSystemService.createDirectory('/path/to/dir');
      
      expect(mockMkdir).toHaveBeenCalledWith('/path/to/dir', { recursive: true });
    });
    
    test('should throw error when directory creation fails', async () => {
      const error = new Error('Directory creation error');
      mockMkdir.mockRejectedValueOnce(error);
      
      await expect(fileSystemService.createDirectory('/path/to/dir')).rejects.toThrow();
      
      expect(mockMkdir).toHaveBeenCalledWith('/path/to/dir', { recursive: true });
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
  
  describe('getHomeDirectory', () => {
    test('should return the user home directory', () => {
      (os.homedir as jest.Mock).mockReturnValueOnce('/home/testuser');
      
      const result = fileSystemService.getHomeDirectory();
      
      expect(os.homedir).toHaveBeenCalled();
      expect(result).toBe('/home/testuser');
    });
  });
  
  describe('resolvePath', () => {
    test('should resolve paths to absolute path', () => {
      (path.resolve as jest.Mock).mockReturnValueOnce('/absolute/path/to/file.txt');
      
      const result = fileSystemService.resolvePath('path', 'to', 'file.txt');
      
      expect(path.resolve).toHaveBeenCalledWith('path', 'to', 'file.txt');
      expect(result).toBe('/absolute/path/to/file.txt');
    });
  });
  
  describe('joinPath', () => {
    test('should join path segments', () => {
      (path.join as jest.Mock).mockReturnValueOnce('/joined/path/to/file.txt');
      
      const result = fileSystemService.joinPath('/joined', 'path', 'to', 'file.txt');
      
      expect(path.join).toHaveBeenCalledWith('/joined', 'path', 'to', 'file.txt');
      expect(result).toBe('/joined/path/to/file.txt');
    });
  });
  
  describe('ensureDirectoryExists', () => {
    test('should create directory if it does not exist', async () => {
      // Mock pathExists to return false (directory does not exist)
      jest.spyOn(fileSystemService, 'pathExists').mockResolvedValueOnce(false);
      // Mock createDirectory
      jest.spyOn(fileSystemService, 'createDirectory').mockResolvedValueOnce();
      
      await fileSystemService.ensureDirectoryExists('/path/to/dir');
      
      expect(fileSystemService.pathExists).toHaveBeenCalledWith('/path/to/dir');
      expect(fileSystemService.createDirectory).toHaveBeenCalledWith('/path/to/dir');
    });
    
    test('should not create directory if it already exists', async () => {
      // Mock pathExists to return true (directory exists)
      jest.spyOn(fileSystemService, 'pathExists').mockResolvedValueOnce(true);
      // Mock createDirectory
      jest.spyOn(fileSystemService, 'createDirectory').mockResolvedValueOnce();
      
      await fileSystemService.ensureDirectoryExists('/path/to/dir');
      
      expect(fileSystemService.pathExists).toHaveBeenCalledWith('/path/to/dir');
      expect(fileSystemService.createDirectory).not.toHaveBeenCalled();
    });
  });
});