/**
 * YamlService Unit Tests
 */
import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock the logger service using ESM approach
await jest.unstable_mockModule('@/core/logger.service', () => ({
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

// Import modules after mocking
const { YamlService } = await import('@/io/yaml.service');

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
      expect(result).toBeNull();
    });
    
    test('should handle invalid YAML and throw error', () => {
      const invalidYaml = `
        invalid: yaml: content:
        - misaligned
      `;
      
      expect(() => yamlService.parseYaml(invalidYaml)).toThrow();
    });
  });
  
  describe('serializeYaml', () => {
    test('should serialize object to YAML string', () => {
      const data = {
        name: 'test',
        value: 123,
        nested: {
          key: 'value'
        }
      };
      
      const result = yamlService.serializeYaml(data);
      
      expect(result).toContain('name: test');
      expect(result).toContain('value: 123');
      expect(result).toContain('nested:');
      expect(result).toContain('  key: value');
    });
    
    test('should handle null/undefined input', () => {
      expect(yamlService.serializeYaml(null)).toBe('null\n');
      expect(yamlService.serializeYaml(undefined)).toBe('undefined\n');
    });
  });
  
  describe('readYamlFile', () => {
    test('should read and parse YAML file', async () => {
      const yamlContent = 'name: test\nvalue: 123';
      mockFileSystemService.readFile.mockResolvedValueOnce(yamlContent);
      
      const result = await yamlService.readYamlFile('/path/to/file.yaml');
      
      expect(mockFileSystemService.readFile).toHaveBeenCalledWith('/path/to/file.yaml');
      expect(result).toEqual({
        name: 'test',
        value: 123
      });
    });
    
    test('should return null when file is empty', async () => {
      mockFileSystemService.readFile.mockResolvedValueOnce('');
      
      const result = await yamlService.readYamlFile('/path/to/empty.yaml');
      
      expect(result).toBeNull();
    });
    
    test('should throw error when file reading fails', async () => {
      const error = new Error('File read error');
      mockFileSystemService.readFile.mockRejectedValueOnce(error);
      
      await expect(yamlService.readYamlFile('/path/to/file.yaml')).rejects.toThrow('File read error');
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
  
  describe('yamlFileExists', () => {
    test('should return true when YAML file exists', async () => {
      mockFileSystemService.pathExists.mockResolvedValueOnce(true);
      
      const result = await yamlService.yamlFileExists('/path/to/file.yaml');
      
      expect(mockFileSystemService.pathExists).toHaveBeenCalledWith('/path/to/file.yaml');
      expect(result).toBe(true);
    });
    
    test('should return false when YAML file does not exist', async () => {
      mockFileSystemService.pathExists.mockResolvedValueOnce(false);
      
      const result = await yamlService.yamlFileExists('/path/to/nonexistent.yaml');
      
      expect(result).toBe(false);
    });
  });
});