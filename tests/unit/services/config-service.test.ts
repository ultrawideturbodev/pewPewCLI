/**
 * Config Service Unit Tests
 * 
 * Tests for the ConfigService template configuration handling.
 */
import { ConfigService } from '../../../src/io/config.service.js';
import { YamlService } from '../../../src/io/yaml.service.js';
import { FileSystemService } from '../../../src/io/file-system.service.js';
import { LoggerService } from '../../../src/core/logger.service.js';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies
jest.mock('../../../src/io/file-system.service.js');
jest.mock('../../../src/io/yaml.service.js');
jest.mock('../../../src/core/logger.service.js');

describe('ConfigService Template Configuration', () => {
  let configService;
  let mockFileSystemService;
  let mockYamlService;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock implementations
    mockFileSystemService = new FileSystemService();
    mockYamlService = new YamlService(mockFileSystemService);
    
    // Mock required methods
    mockFileSystemService.getHomeDirectory = jest.fn().mockReturnValue('/mock/home');
    mockFileSystemService.joinPath = jest.fn().mockImplementation((...paths) => paths.join('/'));
    
    // Use instance directly for tests - the singleton isn't suitable for isolated tests
    // @ts-ignore - we're using private constructor for testing
    configService = new ConfigService(mockFileSystemService);
    
    // Expose the private method for testing
    // @ts-ignore - accessing private method for testing
    configService.deserializeAndMergeWithDefaults = ConfigService.prototype.deserializeAndMergeWithDefaults.bind(configService);
  });
  
  describe('Default Configuration', () => {
    test('getDefaultConfigDTO should include empty templates map', () => {
      const defaultConfig = ConfigService.getDefaultConfigDTO();
      
      expect(defaultConfig.templates).toBeDefined();
      expect(defaultConfig.templates).toEqual({});
    });
  });
  
  describe('Template Configuration Parsing', () => {
    test('deserializeAndMergeWithDefaults should handle empty templates object', () => {
      const rawData = {
        templates: {}
      };
      
      const result = configService.deserializeAndMergeWithDefaults(rawData);
      
      expect(result.templates).toBeDefined();
      expect(result.templates).toEqual({});
    });
    
    test('deserializeAndMergeWithDefaults should parse valid template configuration', () => {
      const rawData = {
        templates: {
          component: {
            variables: {
              ComponentName: 'Button',
              StyleType: 'css'
            },
            replacements: {
              '__COMPONENT__': '${ComponentName}',
              '__STYLE_EXT__': '${StyleType}'
            },
            root: 'src/components/${ComponentName}',
            files: [
              'templates/component/__COMPONENT__.tsx',
              'templates/component/__COMPONENT__.__STYLE_EXT__',
              'templates/component/index.ts'
            ]
          }
        }
      };
      
      const result = configService.deserializeAndMergeWithDefaults(rawData);
      
      expect(result.templates).toBeDefined();
      expect(result.templates.component).toBeDefined();
      expect(result.templates.component.variables).toEqual({
        ComponentName: 'Button',
        StyleType: 'css'
      });
      expect(result.templates.component.replacements).toEqual({
        '__COMPONENT__': '${ComponentName}',
        '__STYLE_EXT__': '${StyleType}'
      });
      expect(result.templates.component.root).toBe('src/components/${ComponentName}');
      expect(result.templates.component.files).toEqual([
        'templates/component/__COMPONENT__.tsx',
        'templates/component/__COMPONENT__.__STYLE_EXT__',
        'templates/component/index.ts'
      ]);
    });
    
    test('deserializeAndMergeWithDefaults should handle template without optional fields', () => {
      const rawData = {
        templates: {
          minimal: {
            files: ['templates/minimal/file.txt']
          }
        }
      };
      
      const result = configService.deserializeAndMergeWithDefaults(rawData);
      
      expect(result.templates.minimal).toBeDefined();
      expect(result.templates.minimal.files).toEqual(['templates/minimal/file.txt']);
      expect(result.templates.minimal.variables).toBeUndefined();
      expect(result.templates.minimal.replacements).toBeUndefined();
      expect(result.templates.minimal.root).toBeUndefined();
    });
    
    test('deserializeAndMergeWithDefaults should ignore template without required files field', () => {
      const rawData = {
        templates: {
          invalid: {
            variables: { test: 'value' },
            root: 'src/test'
            // Missing required 'files' field
          }
        }
      };
      
      const result = configService.deserializeAndMergeWithDefaults(rawData);
      
      expect(result.templates.invalid).toBeUndefined();
    });
    
    test('deserializeAndMergeWithDefaults should ignore non-string values in variables', () => {
      const rawData = {
        templates: {
          component: {
            variables: {
              ValidVar: 'string-value',
              InvalidVar: 123, // Non-string value
              AnotherValid: 'valid'
            },
            files: ['templates/component/file.txt']
          }
        }
      };
      
      const result = configService.deserializeAndMergeWithDefaults(rawData);
      
      expect(result.templates.component).toBeDefined();
      expect(result.templates.component.variables).toBeUndefined(); // Should be undefined as there's an invalid variable
    });
    
    test('deserializeAndMergeWithDefaults should ignore non-string values in replacements', () => {
      const rawData = {
        templates: {
          component: {
            replacements: {
              'ValidKey': 'string-value',
              'InvalidKey': 123, // Non-string value
              'AnotherValid': 'valid'
            },
            files: ['templates/component/file.txt']
          }
        }
      };
      
      const result = configService.deserializeAndMergeWithDefaults(rawData);
      
      expect(result.templates.component).toBeDefined();
      expect(result.templates.component.replacements).toBeUndefined(); // Should be undefined as there's an invalid replacement
    });
    
    test('deserializeAndMergeWithDefaults should ignore non-string root value', () => {
      const rawData = {
        templates: {
          component: {
            root: 123, // Non-string value
            files: ['templates/component/file.txt']
          }
        }
      };
      
      const result = configService.deserializeAndMergeWithDefaults(rawData);
      
      expect(result.templates.component).toBeDefined();
      expect(result.templates.component.files).toEqual(['templates/component/file.txt']);
      expect(result.templates.component.root).toBeUndefined();
    });
  });
  
  describe('Multiple Template Handling', () => {
    test('deserializeAndMergeWithDefaults should handle multiple templates', () => {
      const rawData = {
        templates: {
          component: {
            variables: { ComponentName: 'Button' },
            files: ['templates/component/file.txt']
          },
          utility: {
            variables: { UtilName: 'format' },
            files: ['templates/utility/file.txt']
          },
          model: {
            files: ['templates/model/file.txt']
          }
        }
      };
      
      const result = configService.deserializeAndMergeWithDefaults(rawData);
      
      expect(Object.keys(result.templates)).toHaveLength(3);
      expect(result.templates.component).toBeDefined();
      expect(result.templates.utility).toBeDefined();
      expect(result.templates.model).toBeDefined();
    });
    
    test('deserializeAndMergeWithDefaults should filter out invalid templates while keeping valid ones', () => {
      const rawData = {
        templates: {
          valid: {
            files: ['templates/valid/file.txt']
          },
          invalid1: 'not an object',
          invalid2: {
            // Missing files field
            variables: { test: 'value' }
          },
          alsoValid: {
            variables: { test: 'value' },
            files: ['templates/also-valid/file.txt']
          }
        }
      };
      
      const result = configService.deserializeAndMergeWithDefaults(rawData);
      
      expect(Object.keys(result.templates)).toHaveLength(2);
      expect(result.templates.valid).toBeDefined();
      expect(result.templates.alsoValid).toBeDefined();
      expect(result.templates.invalid1).toBeUndefined();
      expect(result.templates.invalid2).toBeUndefined();
    });
  });
});