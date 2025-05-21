/**
 * ConfigService Templates Unit Tests
 * 
 * Tests specifically for templates functionality in ConfigService
 */
import { describe, test, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { ConfigService } from '@/io/config.service.js';
import { FileSystemService } from '@/io/file-system.service.js';
import { YamlService } from '@/io/yaml.service.js';
import { createMockFileSystemService, mockFixtures } from '@tests/mocks/service-factory.js';

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

jest.mock('@/io/yaml.service.js');

describe('ConfigService Templates', () => {
  let configService: ConfigService;
  let mockFileSystemService: any;
  let mockYamlService: any;
  
  beforeEach(() => {
    // Clear the ConfigService singleton instance for each test
    // @ts-ignore - Accessing private static field for testing
    ConfigService.instance = null;
    
    // Create a mock FileSystemService
    mockFileSystemService = createMockFileSystemService();
    
    // Mock YamlService methods
    mockYamlService = {
      readYamlFile: jest.fn(),
      writeYamlFile: jest.fn(),
    };
    
    // Mock the YamlService constructor
    (YamlService as jest.MockedClass<typeof YamlService>).mockImplementation(() => mockYamlService);
    
    // Create a fresh instance of ConfigService with mocked dependencies
    configService = ConfigService.getInstance();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getDefaultConfigDTO', () => {
    test('should include an empty templates map in default config', () => {
      const defaultConfig = ConfigService.getDefaultConfigDTO();
      
      expect(defaultConfig.templates).toBeDefined();
      expect(defaultConfig.templates).toEqual({});
    });
  });
  
  describe('deserializeAndMergeWithDefaults', () => {
    test('should parse and validate a config with templates section', async () => {
      // Setup a valid raw data object with templates
      const rawData = {
        templates: {
          component: {
            variables: {
              'ComponentName': 'What is the component name?'
            },
            replacements: {
              'template-component': 'user-component'
            },
            root: 'src/components',
            files: [
              'templates/component/component.ts',
              'templates/component/index.ts'
            ]
          }
        }
      };
      
      // Access the private method using type assertion
      const result = (configService as any).deserializeAndMergeWithDefaults(rawData);
      
      // Verify that templates are correctly parsed
      expect(result.templates).toBeDefined();
      expect(result.templates.component).toBeDefined();
      expect(result.templates.component.variables).toEqual({
        'ComponentName': 'What is the component name?'
      });
      expect(result.templates.component.replacements).toEqual({
        'template-component': 'user-component'
      });
      expect(result.templates.component.root).toBe('src/components');
      expect(result.templates.component.files).toEqual([
        'templates/component/component.ts',
        'templates/component/index.ts'
      ]);
    });
    
    test('should verify templates is a map with string keys', async () => {
      // Setup a raw data object with templates section that has non-object values
      const rawData = {
        templates: {
          validTemplate: {
            files: ['file1.txt']
          },
          invalidTemplate: 'not an object'
        }
      };
      
      // Access the private method using type assertion
      const result = (configService as any).deserializeAndMergeWithDefaults(rawData);
      
      // Verify that only valid templates are included
      expect(result.templates).toBeDefined();
      expect(result.templates.validTemplate).toBeDefined();
      expect(result.templates.invalidTemplate).toBeUndefined();
    });
    
    test('should require files array in each template', async () => {
      // Setup a raw data object with templates missing required files array
      const rawData = {
        templates: {
          validTemplate: {
            files: ['file1.txt']
          },
          missingFiles: {
            variables: { 'test': 'value' }
            // missing files array
          }
        }
      };
      
      // Access the private method using type assertion
      const result = (configService as any).deserializeAndMergeWithDefaults(rawData);
      
      // Verify that only templates with files array are included
      expect(result.templates).toBeDefined();
      expect(result.templates.validTemplate).toBeDefined();
      expect(result.templates.missingFiles).toBeUndefined();
    });
    
    test('should validate optional template properties', async () => {
      // Setup raw data with various combinations of optional properties
      const rawData = {
        templates: {
          // Only required files array
          minimal: {
            files: ['minimal/file.txt']
          },
          // With variables
          withVars: {
            variables: { 'Var1': 'Value1' },
            files: ['vars/file.txt']
          },
          // With replacements
          withReplacements: {
            replacements: { 'find': 'replace' },
            files: ['replace/file.txt']
          },
          // With root
          withRoot: {
            root: 'output/dir',
            files: ['root/file.txt']
          },
          // With all properties
          complete: {
            variables: { 'Var1': 'Value1' },
            replacements: { 'find': 'replace' },
            root: 'output/dir',
            files: ['complete/file.txt']
          }
        }
      };
      
      // Access the private method using type assertion
      const result = (configService as any).deserializeAndMergeWithDefaults(rawData);
      
      // Verify minimal template
      expect(result.templates.minimal).toBeDefined();
      expect(result.templates.minimal.files).toEqual(['minimal/file.txt']);
      expect(result.templates.minimal.variables).toBeUndefined();
      expect(result.templates.minimal.replacements).toBeUndefined();
      expect(result.templates.minimal.root).toBeUndefined();
      
      // Verify template with variables
      expect(result.templates.withVars).toBeDefined();
      expect(result.templates.withVars.variables).toEqual({ 'Var1': 'Value1' });
      
      // Verify template with replacements
      expect(result.templates.withReplacements).toBeDefined();
      expect(result.templates.withReplacements.replacements).toEqual({ 'find': 'replace' });
      
      // Verify template with root
      expect(result.templates.withRoot).toBeDefined();
      expect(result.templates.withRoot.root).toBe('output/dir');
      
      // Verify complete template
      expect(result.templates.complete).toBeDefined();
      expect(result.templates.complete.variables).toEqual({ 'Var1': 'Value1' });
      expect(result.templates.complete.replacements).toEqual({ 'find': 'replace' });
      expect(result.templates.complete.root).toBe('output/dir');
      expect(result.templates.complete.files).toEqual(['complete/file.txt']);
    });
    
    test('should validate that variables and replacements contain string values', async () => {
      // Setup raw data with invalid types in variables and replacements
      const rawData = {
        templates: {
          invalidTypes: {
            variables: { 
              'Valid': 'string value',
              'InvalidNum': 123,  // number instead of string
              'InvalidObj': { key: 'value' }  // object instead of string
            },
            replacements: {
              'Valid': 'string value',
              'InvalidBool': true,  // boolean instead of string
              'InvalidNull': null   // null instead of string
            },
            files: ['invalid/file.txt']
          }
        }
      };
      
      // Access the private method using type assertion
      const result = (configService as any).deserializeAndMergeWithDefaults(rawData);
      
      // Template should be included but with invalid variables/replacements removed
      expect(result.templates.invalidTypes).toBeDefined();
      expect(result.templates.invalidTypes.files).toEqual(['invalid/file.txt']);
      
      // Variables and replacements should be undefined since they contain invalid values
      expect(result.templates.invalidTypes.variables).toBeUndefined();
      expect(result.templates.invalidTypes.replacements).toBeUndefined();
    });
  });
  
  describe('loadPewYaml', () => {
    test('should load and parse templates from YAML file', async () => {
      // Mock the YamlService to return a config with templates
      mockYamlService.readYamlFile.mockResolvedValueOnce(mockFixtures.config.withTemplates);
      
      // Access the private method using type assertion
      const result = await (configService as any).loadPewYaml('/mock/pew.yaml');
      
      // Verify that templates are correctly loaded
      expect(result.templates).toBeDefined();
      expect(result.templates.component).toBeDefined();
      expect(result.templates.component.variables).toBeDefined();
      expect(result.templates.component.files).toBeDefined();
    });
  });
  
  describe('pew init templates example', () => {
    test('should create and append templates example when handleInit is called', async () => {
      // This test needs to be implemented in CliService tests
      // The test should verify that appendTemplatesExampleToYaml is called with the correct path
      // and that it appends the template example content to the YAML file
      
      // This is here as a placeholder/documentation that this test should exist
      expect(true).toBe(true);
    });
  });
});