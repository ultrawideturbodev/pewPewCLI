/**
 * YamlService Unit Tests
 */
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { YamlService } from '@/io/yaml.service.js';

// Mock the required dependencies
jest.mock('@/core/logger.service', () => ({
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
}));

describe('YamlService', () => {
  let yamlService: YamlService;
  let mockFileSystemService: any;
  
  beforeEach(() => {
    // Create a mock FileSystemService
    mockFileSystemService = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
      pathExists: jest.fn(),
      ensureDirectoryExists: jest.fn(),
      createDirectory: jest.fn(),
      getHomeDirectory: jest.fn(),
      resolvePath: jest.fn(),
      joinPath: jest.fn()
    };
    
    // Create an instance of YamlService with the mock FileSystemService
    yamlService = new YamlService(mockFileSystemService);
  });
  
  describe('parseYaml', () => {
    test('should parse a valid YAML string into an object', () => {
      const yamlString = 'key: value\narray:\n  - item1\n  - item2';
      const expected = { key: 'value', array: ['item1', 'item2'] };
      
      const result = yamlService.parseYaml(yamlString);
      
      expect(result).toEqual(expected);
    });
    
    test('should return an empty object for empty input', () => {
      const result1 = yamlService.parseYaml('');
      const result2 = yamlService.parseYaml('   ');
      
      expect(result1).toEqual({});
      expect(result2).toEqual({});
    });
    
    test('should return an empty object for invalid YAML input', () => {
      const result = yamlService.parseYaml('{invalid: yaml: content}');
      
      expect(result).toEqual({});
    });
  });
  
  describe('serializeToYaml', () => {
    test('should serialize an object to YAML string', () => {
      const data = { key: 'value', array: ['item1', 'item2'] };
      
      const result = yamlService.serializeToYaml(data);
      
      // We can't directly compare the strings as the exact formatting might vary
      // Instead, we'll parse the result back to verify it contains the expected data
      expect(yamlService.parseYaml(result)).toEqual(data);
    });
    
    test('should handle null/undefined input gracefully', () => {
      const result1 = yamlService.serializeToYaml(null);
      const result2 = yamlService.serializeToYaml(undefined);
      
      expect(result1).toBeTruthy(); // Should return a string, not empty
      expect(result2).toBeTruthy(); // Should return a string, not empty
    });
  });
  
  describe('readYamlFile', () => {
    test('should read and parse a YAML file', async () => {
      const filePath = '/path/to/config.yaml';
      const fileContent = 'key: value\narray:\n  - item1\n  - item2';
      const expectedObject = { key: 'value', array: ['item1', 'item2'] };
      
      mockFileSystemService.pathExists.mockResolvedValueOnce(true);
      mockFileSystemService.readFile.mockResolvedValueOnce(fileContent);
      
      const result = await yamlService.readYamlFile(filePath);
      
      expect(mockFileSystemService.pathExists).toHaveBeenCalledWith(filePath);
      expect(mockFileSystemService.readFile).toHaveBeenCalledWith(filePath);
      expect(result).toEqual(expectedObject);
    });
    
    test('should return an empty object if file does not exist', async () => {
      const filePath = '/path/to/nonexistent.yaml';
      
      mockFileSystemService.pathExists.mockResolvedValueOnce(false);
      
      const result = await yamlService.readYamlFile(filePath);
      
      expect(mockFileSystemService.pathExists).toHaveBeenCalledWith(filePath);
      expect(mockFileSystemService.readFile).not.toHaveBeenCalled();
      expect(result).toEqual({});
    });
    
    test('should return an empty object if reading file fails', async () => {
      const filePath = '/path/to/config.yaml';
      
      mockFileSystemService.pathExists.mockResolvedValueOnce(true);
      mockFileSystemService.readFile.mockRejectedValueOnce(new Error('Read error'));
      
      const result = await yamlService.readYamlFile(filePath);
      
      expect(mockFileSystemService.pathExists).toHaveBeenCalledWith(filePath);
      expect(mockFileSystemService.readFile).toHaveBeenCalledWith(filePath);
      expect(result).toEqual({});
    });
  });
  
  describe('writeYamlFile', () => {
    test('should serialize and write data to a YAML file', async () => {
      const filePath = '/path/to/config.yaml';
      const data = { key: 'value', array: ['item1', 'item2'] };
      
      // Spy on the serializeToYaml method
      jest.spyOn(yamlService, 'serializeToYaml').mockReturnValueOnce('serialized yaml content');
      
      await yamlService.writeYamlFile(filePath, data);
      
      expect(yamlService.serializeToYaml).toHaveBeenCalledWith(data);
      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(filePath, 'serialized yaml content');
    });
    
    test('should throw error if writing file fails', async () => {
      const filePath = '/path/to/config.yaml';
      const data = { key: 'value' };
      
      jest.spyOn(yamlService, 'serializeToYaml').mockReturnValueOnce('serialized yaml content');
      mockFileSystemService.writeFile.mockRejectedValueOnce(new Error('Write error'));
      
      await expect(yamlService.writeYamlFile(filePath, data)).rejects.toThrow();
      
      expect(yamlService.serializeToYaml).toHaveBeenCalledWith(data);
      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(filePath, 'serialized yaml content');
    });
  });
});