/**
 * CliService Templates Unit Tests
 * 
 * Tests specifically for templates functionality in CliService (pew init template example)
 */
import { describe, test, expect, beforeEach, jest, afterEach } from '@jest/globals';

// Mock all dependencies using ESM approach
await jest.unstable_mockModule('@/io/file-system.service', () => ({
  FileSystemService: jest.fn()
}));

await jest.unstable_mockModule('@/io/config.service', () => ({
  ConfigService: {
    getInstance: jest.fn()
  }
}));

await jest.unstable_mockModule('@/io/user-input.service', () => ({
  UserInputService: jest.fn()
}));

await jest.unstable_mockModule('@/clipboard/clipboard.service', () => ({
  ClipboardService: jest.fn()
}));

await jest.unstable_mockModule('@/tasks/task.service', () => ({
  TaskService: jest.fn()
}));

await jest.unstable_mockModule('@/updates/update.service', () => ({
  UpdateService: jest.fn()
}));

await jest.unstable_mockModule('@/core/logger.service', () => ({
  LoggerService: {
    getInstance: jest.fn()
  }
}));

await jest.unstable_mockModule('@/io/yaml.service', () => ({
  YamlService: jest.fn()
}));

await jest.unstable_mockModule('path', () => ({
  resolve: jest.fn(),
  join: jest.fn(),
  dirname: jest.fn(),
}));

// Import modules after mocking
const { CliService } = await import('@/core/cli.service');
const { createMockFileSystemService, createMockLoggerService, createMockConfigService, createMockUserInputService, mockFixtures } = await import('@tests/mocks/service-factory');
const { ConfigService } = await import('@/io/config.service');
const { YamlService } = await import('@/io/yaml.service');
const { FileSystemService } = await import('@/io/file-system.service');
const { UserInputService } = await import('@/io/user-input.service');
const { ClipboardService } = await import('@/clipboard/clipboard.service');
const { TaskService } = await import('@/tasks/task.service');
const { UpdateService } = await import('@/updates/update.service');
const path = await import('path');

describe('CliService Templates', () => {
  let cliService: CliService;
  let mockFileSystemService: any;
  let mockConfigService: any;
  let mockLoggerService: any;
  let mockYamlService: any;
  let mockUserInputService: any;
  
  beforeEach(() => {
    // Clear the CliService singleton instance
    // @ts-ignore - Accessing private static field for testing
    CliService.instance = null;
    
    // Setup specific mock behaviors
    mockFileSystemService = createMockFileSystemService();
    mockConfigService = createMockConfigService();
    mockLoggerService = createMockLoggerService();
    mockUserInputService = createMockUserInputService();
    
    // Mock FileSystemService constructor
    (FileSystemService as jest.MockedClass<typeof FileSystemService>).mockImplementation(() => mockFileSystemService);
    
    // Mock ConfigService singleton
    (ConfigService.getInstance as jest.Mock).mockReturnValue(mockConfigService);
    
    // Mock LoggerService singleton
    const { LoggerService } = require('@/core/logger.service');
    LoggerService.getInstance.mockReturnValue(mockLoggerService);
    
    // Mock YamlService
    mockYamlService = {
      readYamlFile: jest.fn(),
      writeYamlFile: jest.fn(),
      parseYaml: jest.fn(),
      serializeYaml: jest.fn(),
    };
    (YamlService as jest.MockedClass<typeof YamlService>).mockImplementation(() => mockYamlService);
    
    // Mock other services
    (UserInputService as jest.MockedClass<typeof UserInputService>).mockImplementation(() => mockUserInputService);
    (ClipboardService as jest.MockedClass<typeof ClipboardService>).mockImplementation(() => ({ read: jest.fn(), write: jest.fn() }));
    (TaskService as jest.MockedClass<typeof TaskService>).mockImplementation(() => ({ markCurrentTaskComplete: jest.fn() }));
    (UpdateService as jest.MockedClass<typeof UpdateService>).mockImplementation(() => ({ checkForUpdates: jest.fn() }));
    
    // Mock path functions
    (path.resolve as jest.Mock).mockImplementation((...paths) => paths.join('/'));
    (path.join as jest.Mock).mockImplementation((...paths) => paths.join('/'));
    (path.dirname as jest.Mock).mockImplementation((p) => p.split('/').slice(0, -1).join('/') || '/');
    
    // Get an instance of CliService with mocked dependencies  
    cliService = CliService.getInstance();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('init with template example', () => {
    test('should create default template configuration in pew.yaml', async () => {
      // Mock file system to simulate no existing pew.yaml
      mockFileSystemService.pathExists.mockResolvedValue(false);
      mockFileSystemService.writeFile.mockResolvedValue(undefined);
      
      await cliService.init();
      
      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        'pew.yaml',
        expect.stringContaining('templates:')
      );
      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        'pew.yaml',
        expect.stringContaining('component:')
      );
      expect(mockLoggerService.success).toHaveBeenCalledWith('pew-pew-cli initialized successfully!');
    });
    
    test('should not overwrite existing pew.yaml during init', async () => {
      // Mock file system to simulate existing pew.yaml
      mockFileSystemService.pathExists.mockResolvedValue(true);
      
      await cliService.init();
      
      expect(mockFileSystemService.writeFile).not.toHaveBeenCalled();
      expect(mockLoggerService.success).toHaveBeenCalledWith('pew-pew-cli initialized successfully!');
    });
  });
  
  describe('template-related path operations', () => {
    test('should handle template examples in init correctly', async () => {
      // Mock file system operations
      mockFileSystemService.pathExists.mockResolvedValue(false);
      mockFileSystemService.writeFile.mockResolvedValue(undefined);
      
      await cliService.init();
      
      // Verify the template configuration was written
      const writtenContent = mockFileSystemService.writeFile.mock.calls[0][1];
      expect(writtenContent).toContain('templates:');
      expect(writtenContent).toContain('variables:');
      expect(writtenContent).toContain('replacements:');
      expect(writtenContent).toContain('files:');
    });
  });
});