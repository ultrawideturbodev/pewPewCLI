/**
 * YamlService Unit Tests
 */
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { YamlService } from '@/io/yaml.service.js';

// Mock the logger service 
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
  let mockFileSystemService: {
    readFile: jest.Mock;
    writeFile: jest.Mock;
    pathExists: jest.Mock;
    ensureDirectoryExists: jest.Mock;
    createDirectory: jest.Mock;
    getHomeDirectory: jest.Mock;
    resolvePath: jest.Mock;
    joinPath: jest.Mock;
  };
  
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
    test('should parse valid YAML content', () => {
      const yamlContent = `
        name: test
        value: 123
        nested:
          key: value
      `;
      
      const result = yamlService.parseYaml(yamlContent);
      
      expect(result).toEqual({
        name: 'test',
        value: 123,
        nested: {
          key: 'value'
        }
      });
    });
    
    test('should handle empty YAML content', () => {
      const result = yamlService.parseYaml('');
      expect(result).toEqual({});
    });
    
    test('should handle invalid YAML and return empty object', () => {
      const invalidYaml = `
        invalid: yaml: content:
        - misaligned
      `;
      
      const result = yamlService.parseYaml(invalidYaml);
      expect(result).toEqual({});
    });
  });
  
  describe('serializeToYaml', () => {
    test('should serialize object to YAML string', () => {
      const data = {
        name: 'test',
        value: 123,
        nested: {
          key: 'value'
        }
      };
      
      const result = yamlService.serializeToYaml(data);
      
      expect(result).toContain('name: test');
      expect(result).toContain('value: 123');
      expect(result).toContain('nested:');
      expect(result).toContain('  key: value');
    });
    
    test('should handle null/undefined input', () => {
      const nullResult = yamlService.serializeToYaml(null);
      const undefinedResult = yamlService.serializeToYaml(undefined);
      
      expect(nullResult).toContain('{}');
      expect(undefinedResult).toContain('{}');
    });
  });
  
  describe('readYamlFile', () => {
    test('should read and parse YAML file', async () => {
      const yamlContent = 'name: test\nvalue: 123';
      mockFileSystemService.pathExists.mockResolvedValueOnce(true);
      mockFileSystemService.readFile.mockResolvedValueOnce(yamlContent);
      
      const result = await yamlService.readYamlFile('/path/to/file.yaml');
      
      expect(mockFileSystemService.pathExists).toHaveBeenCalledWith('/path/to/file.yaml');
      expect(mockFileSystemService.readFile).toHaveBeenCalledWith('/path/to/file.yaml');
      expect(result).toEqual({
        name: 'test',
        value: 123
      });
    });
    
    test('should return empty object when file does not exist', async () => {
      mockFileSystemService.pathExists.mockResolvedValueOnce(false);
      
      const result = await yamlService.readYamlFile('/path/to/empty.yaml');
      
      expect(result).toEqual({});
    });
    
    test('should return empty object when file reading fails', async () => {
      const error = new Error('File read error');
      mockFileSystemService.pathExists.mockResolvedValueOnce(true);
      mockFileSystemService.readFile.mockRejectedValueOnce(error);
      
      const result = await yamlService.readYamlFile('/path/to/file.yaml');
      
      expect(result).toEqual({});
    });
  });
  
  describe('writeYamlFile', () => {
    test('should serialize and write YAML to file', async () => {
      const data = { name: 'test', value: 123 };
      mockFileSystemService.writeFile.mockResolvedValueOnce(undefined);
      
      await yamlService.writeYamlFile('/path/to/file.yaml', data);
      
      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        '/path/to/file.yaml',
        expect.stringContaining('name: test')
      );
    });
    
    test('should throw error when file writing fails', async () => {
      const data = { name: 'test' };
      const error = new Error('Write error');
      mockFileSystemService.writeFile.mockRejectedValueOnce(error);
      
      await expect(yamlService.writeYamlFile('/path/to/file.yaml', data)).rejects.toThrow('Write error');
    });
  });
});