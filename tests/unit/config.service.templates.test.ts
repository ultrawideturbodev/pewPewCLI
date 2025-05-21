/**
 * ConfigService Templates Unit Tests
 * 
 * Tests specifically for templates functionality in ConfigService
 */
import { describe, test, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { ConfigService } from '@/io/config.service.js';
import { FileSystemService } from '@/io/file-system.service.js';
import { YamlService } from '@/io/yaml.service.js';
import { createMockFileSystemService, createMockLoggerService, mockFixtures } from '@tests/mocks/service-factory.js';

// Mock the required dependencies
jest.mock('@/core/logger.service.js', () => ({
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
  let mockFileSystemService: ReturnType<typeof createMockFileSystemService>;
  let mockYamlService: { readYamlFile: jest.Mock; writeYamlFile: jest.Mock };
  
  beforeEach(() => {
    // Clear the ConfigService singleton instance for each test
    // @ts-expect-error - Accessing private static field for testing
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
    
    // Create a ConfigService instance with the mocked dependencies
    configService = new ConfigService(mockFileSystemService, mockYamlService);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getTemplates', () => {
    test('should return templates from local config when available', async () => {
      // Configure mocks for local config with templates
      mockFileSystemService.pathExists.mockResolvedValueOnce(true);
      mockYamlService.readYamlFile.mockResolvedValueOnce(mockFixtures.localConfigWithTemplates);
      
      const templates = await configService.getTemplates();
      
      expect(mockFileSystemService.pathExists).toHaveBeenCalledWith('pew.yaml');
      expect(mockYamlService.readYamlFile).toHaveBeenCalledWith('pew.yaml');
      expect(templates).toEqual(mockFixtures.localConfigWithTemplates.templates);
    });
    
    test('should return templates from global config when local config has no templates', async () => {
      // Configure mocks for local config without templates but global config with templates
      mockFileSystemService.pathExists
        .mockResolvedValueOnce(true)  // Local pew.yaml exists
        .mockResolvedValueOnce(true); // Global ~/.pew/pew.yaml exists
        
      mockYamlService.readYamlFile
        .mockResolvedValueOnce(mockFixtures.localConfigWithoutTemplates)  // Local config
        .mockResolvedValueOnce(mockFixtures.globalConfigWithTemplates);   // Global config
      
      mockFileSystemService.getHomeDirectory.mockReturnValue('/home/user');
      mockFileSystemService.joinPath.mockReturnValue('/home/user/.pew/pew.yaml');
      
      const templates = await configService.getTemplates();
      
      expect(templates).toEqual(mockFixtures.globalConfigWithTemplates.templates);
    });
    
    test('should return empty object when no templates found', async () => {
      // Configure mocks for no config files found
      mockFileSystemService.pathExists.mockResolvedValue(false);
      
      const templates = await configService.getTemplates();
      
      expect(templates).toEqual({});
    });
    
    test('should return empty object when config files exist but have no templates', async () => {
      // Configure mocks for config files without templates
      mockFileSystemService.pathExists
        .mockResolvedValueOnce(true)   // Local pew.yaml exists
        .mockResolvedValueOnce(true);  // Global ~/.pew/pew.yaml exists
        
      mockYamlService.readYamlFile
        .mockResolvedValueOnce(mockFixtures.localConfigWithoutTemplates)  // Local config
        .mockResolvedValueOnce(mockFixtures.globalConfigWithoutTemplates); // Global config
      
      mockFileSystemService.getHomeDirectory.mockReturnValue('/home/user');
      mockFileSystemService.joinPath.mockReturnValue('/home/user/.pew/pew.yaml');
      
      const templates = await configService.getTemplates();
      
      expect(templates).toEqual({});
    });
  });
  
  describe('getTemplate', () => {
    test('should return specific template when it exists', async () => {
      // Configure mocks for local config with templates
      mockFileSystemService.pathExists.mockResolvedValueOnce(true);
      mockYamlService.readYamlFile.mockResolvedValueOnce(mockFixtures.localConfigWithTemplates);
      
      const template = await configService.getTemplate('component');
      
      expect(template).toEqual(mockFixtures.localConfigWithTemplates.templates.component);
    });
    
    test('should return undefined when template does not exist', async () => {
      // Configure mocks for local config with templates but not the requested one
      mockFileSystemService.pathExists.mockResolvedValueOnce(true);
      mockYamlService.readYamlFile.mockResolvedValueOnce(mockFixtures.localConfigWithTemplates);
      
      const template = await configService.getTemplate('nonexistent');
      
      expect(template).toBeUndefined();
    });
    
    test('should return undefined when no templates exist', async () => {
      // Configure mocks for no config files found
      mockFileSystemService.pathExists.mockResolvedValue(false);
      
      const template = await configService.getTemplate('component');
      
      expect(template).toBeUndefined();
    });
  });
  
  describe('getTemplateNames', () => {
    test('should return list of template names when templates exist', async () => {
      // Configure mocks for local config with templates
      mockFileSystemService.pathExists.mockResolvedValueOnce(true);
      mockYamlService.readYamlFile.mockResolvedValueOnce(mockFixtures.localConfigWithTemplates);
      
      const templateNames = await configService.getTemplateNames();
      
      expect(templateNames).toEqual(['component', 'service']);
    });
    
    test('should return empty array when no templates exist', async () => {
      // Configure mocks for no config files found
      mockFileSystemService.pathExists.mockResolvedValue(false);
      
      const templateNames = await configService.getTemplateNames();
      
      expect(templateNames).toEqual([]);
    });
  });
  
  describe('hasTemplates', () => {
    test('should return true when templates exist', async () => {
      // Configure mocks for local config with templates
      mockFileSystemService.pathExists.mockResolvedValueOnce(true);
      mockYamlService.readYamlFile.mockResolvedValueOnce(mockFixtures.localConfigWithTemplates);
      
      const hasTemplates = await configService.hasTemplates();
      
      expect(hasTemplates).toBe(true);
    });
    
    test('should return false when no templates exist', async () => {
      // Configure mocks for no config files found
      mockFileSystemService.pathExists.mockResolvedValue(false);
      
      const hasTemplates = await configService.hasTemplates();
      
      expect(hasTemplates).toBe(false);
    });
  });
});