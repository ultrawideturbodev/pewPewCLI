/**
 * CliService Templates Unit Tests
 * 
 * Tests specifically for templates functionality in CliService (pew init template example)
 */
import { describe, test, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { CliService } from '@/core/cli.service.js';
import { ConfigService } from '@/io/config.service.js';
import { YamlService } from '@/io/yaml.service.js';
import { FileSystemService } from '@/io/file-system.service.js';
import { UserInputService } from '@/io/user-input.service.js';
import { ClipboardService } from '@/clipboard/clipboard.service.js';
import { TaskService } from '@/tasks/task.service.js';
import { UpdateService } from '@/updates/update.service.js';
import * as path from 'path';

// Mock all dependencies
jest.mock('@/io/file-system.service.js');
jest.mock('@/io/config.service.js');
jest.mock('@/io/user-input.service.js');
jest.mock('@/clipboard/clipboard.service.js');
jest.mock('@/tasks/task.service.js');
jest.mock('@/updates/update.service.js');
jest.mock('@/core/logger.service.js');
jest.mock('@/io/yaml.service.js');
jest.mock('path');

describe('CliService Templates', () => {
  let cliService: CliService;
  let mockFileSystemService: any;
  let mockConfigService: any;
  let mockLoggerService: any;
  let mockYamlService: any;
  let mockUserInputService: any;
  
  beforeEach(() => {
    // Clear the CliService singleton instance
    // @ts-expect-error - Accessing private static field for testing
    CliService.instance = null;
    
    // Setup FileSystemService mock
    mockFileSystemService = {
      readFile: jest.fn().mockResolvedValue(''),
      writeFile: jest.fn().mockResolvedValue(undefined),
      pathExists: jest.fn().mockResolvedValue(true),
      ensureDirectoryExists: jest.fn().mockResolvedValue(undefined),
      createDirectory: jest.fn().mockResolvedValue(undefined),
      getHomeDirectory: jest.fn().mockReturnValue('/mock/home'),
      resolvePath: jest.fn().mockImplementation((...paths) => paths.join('/')),
      joinPath: jest.fn().mockImplementation((...paths) => paths.join('/')),
    };
    (FileSystemService as jest.MockedClass<typeof FileSystemService>).mockImplementation(() => mockFileSystemService);
    
    // Setup ConfigService mock
    mockConfigService = {
      initialize: jest.fn().mockResolvedValue(undefined),
      getTasksPaths: jest.fn().mockResolvedValue(['/path/to/tasks.md']),
      getAllTasksPaths: jest.fn().mockResolvedValue(['/path/to/tasks.md']),
      setTasksPaths: jest.fn().mockResolvedValue(undefined),
      getProjectRootPath: jest.fn().mockReturnValue('/mock/project'),
      getLocalPewYamlPath: jest.fn().mockReturnValue('/mock/project/pew.yaml'),
      getGlobalPewYamlPath: jest.fn().mockReturnValue('/mock/home/.pew/pew.yaml'),
      getPasteTasksPath: jest.fn().mockResolvedValue('/mock/project/tasks.md'),
      getGlobalUpdateValue: jest.fn().mockResolvedValue(0),
      setGlobalUpdateValue: jest.fn().mockResolvedValue(undefined),
      getGlobalConfigDataInternal: jest.fn().mockReturnValue({ tasks: { all: ['tasks.md'] } }),
    };
    (ConfigService.getInstance as jest.Mock).mockReturnValue(mockConfigService);
    
    // Setup LoggerService mock
    mockLoggerService = {
      log: jest.fn(),
      success: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      header: jest.fn(),
      divider: jest.fn(),
      taskLines: jest.fn(),
    };
    const { LoggerService } = require('@/core/logger.service.js');
    LoggerService.getInstance.mockReturnValue(mockLoggerService);
    
    // Setup YamlService mock
    mockYamlService = {
      readYamlFile: jest.fn(),
      writeYamlFile: jest.fn(),
      parseYaml: jest.fn(),
      serializeToYaml: jest.fn(),
    };
    (YamlService as jest.MockedClass<typeof YamlService>).mockImplementation(() => mockYamlService);
    
    // Setup UserInputService mock
    mockUserInputService = {
      askForText: jest.fn().mockResolvedValue('mock-input'),
      askForConfirmation: jest.fn().mockResolvedValue(true),
      askForSelection: jest.fn().mockResolvedValue('option1'),
      askForMultipleSelections: jest.fn().mockResolvedValue(['option1', 'option2']),
    };
    (UserInputService as jest.MockedClass<typeof UserInputService>).mockImplementation(() => mockUserInputService);
    
    // Mock other services
    (ClipboardService as jest.MockedClass<typeof ClipboardService>).mockImplementation(() => ({ 
      readFromClipboard: jest.fn(), 
      writeToClipboard: jest.fn() 
    }));
    (TaskService as jest.MockedClass<typeof TaskService>).mockImplementation(() => ({ 
      markCurrentTaskComplete: jest.fn() 
    }));
    (UpdateService as jest.MockedClass<typeof UpdateService>).mockImplementation(() => ({ 
      checkForUpdates: jest.fn() 
    }));
    
    // Mock path functions
    jest.mocked(path.resolve).mockImplementation((...paths) => paths.join('/'));
    jest.mocked(path.join).mockImplementation((...paths) => paths.join('/'));
    jest.mocked(path.dirname).mockImplementation((p) => p.split('/').slice(0, -1).join('/') || '/');
    
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