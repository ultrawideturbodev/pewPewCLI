/**
 * CliService Unit Tests
 */
import { describe, test, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { CliService } from '@/core/cli.service.js';
import { TaskStatus } from '@/tasks/task.service.js';

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

// Import the mocked modules to set behaviors
import { ConfigService } from '@/io/config.service.js';
import { FileSystemService } from '@/io/file-system.service.js';
import { TaskService } from '@/tasks/task.service.js';
import { UserInputService } from '@/io/user-input.service.js';
import { ClipboardService } from '@/clipboard/clipboard.service.js';
import { UpdateService } from '@/updates/update.service.js';
import { LoggerService } from '@/core/logger.service.js';
import * as path from 'path';

describe('CliService', () => {
  let cliService: CliService;
  let mockConfigService: any;
  let mockFileSystemService: any;
  let mockLoggerService: any;
  let mockUserInputService: any;
  let mockClipboardService: any;
  let mockTaskService: any;
  let mockUpdateService: any;
  
  beforeEach(() => {
    // Clear instance to create a clean one
    // @ts-expect-error - Accessing private static field for testing
    CliService.instance = null;
    
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
    (LoggerService.getInstance as jest.Mock).mockReturnValue(mockLoggerService);
    
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
    
    // Setup UserInputService mock
    mockUserInputService = {
      askForText: jest.fn().mockResolvedValue('mock-input'),
      askForConfirmation: jest.fn().mockResolvedValue(true),
      askForSelection: jest.fn().mockResolvedValue('option1'),
      askForMultipleSelections: jest.fn().mockResolvedValue(['option1', 'option2']),
    };
    (UserInputService as jest.MockedClass<typeof UserInputService>).mockImplementation(() => mockUserInputService);
    
    // Setup ClipboardService mock
    mockClipboardService = {
      readFromClipboard: jest.fn().mockResolvedValue('mock-clipboard-content'),
      writeToClipboard: jest.fn().mockResolvedValue(undefined),
    };
    (ClipboardService as jest.MockedClass<typeof ClipboardService>).mockImplementation(() => mockClipboardService);
    
    // Setup TaskService mock
    mockTaskService = {
      markCurrentTaskComplete: jest.fn(),
      resetCompletedTasks: jest.fn(),
    };
    (TaskService as jest.MockedClass<typeof TaskService>).mockImplementation(() => mockTaskService);
    
    // Setup UpdateService mock
    mockUpdateService = {
      checkForUpdates: jest.fn(),
    };
    (UpdateService as jest.MockedClass<typeof UpdateService>).mockImplementation(() => mockUpdateService);
    
    // Mock path methods
    jest.mocked(path.resolve).mockImplementation((...paths) => paths.join('/'));
    jest.mocked(path.join).mockImplementation((...paths) => paths.join('/'));
    jest.mocked(path.dirname).mockImplementation((p) => p.split('/').slice(0, -1).join('/') || '/');
    
    // Get an instance of CliService with mocked dependencies
    cliService = CliService.getInstance();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getInstance', () => {
    test('should return singleton instance', () => {
      const instance1 = CliService.getInstance();
      const instance2 = CliService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });
  
  describe('init', () => {
    test('should initialize pew-pew-cli successfully', async () => {
      await cliService.init();
      
      expect(mockLoggerService.divider).toHaveBeenCalled();
      expect(mockLoggerService.header).toHaveBeenCalledWith('Initializing pew-pew-cli');
    });
  });
  
  describe('setPath', () => {
    test('should set tasks path successfully', async () => {
      await cliService.setPath('tasks', '/new/path/to/tasks.md');
      
      expect(mockConfigService.setTasksPaths).toHaveBeenCalledWith(['/new/path/to/tasks.md']);
      expect(mockLoggerService.success).toHaveBeenCalledWith('Tasks path updated successfully');
    });
    
    test('should handle invalid field gracefully', async () => {
      await cliService.setPath('invalid', '/some/path');
      
      expect(mockLoggerService.error).toHaveBeenCalledWith('Invalid field: invalid');
    });
  });
  
  describe('pasteTask', () => {
    test('should paste clipboard content to tasks file with overwrite mode', async () => {
      // Setup mocks
      mockClipboardService.readFromClipboard.mockResolvedValue('- [ ] New task from clipboard');
      mockFileSystemService.writeFile.mockResolvedValue(undefined);
      
      await cliService.pasteTask('tasks', 'overwrite');
      
      expect(mockClipboardService.readFromClipboard).toHaveBeenCalled();
      expect(mockConfigService.getPasteTasksPath).toHaveBeenCalledWith('tasks');
      expect(mockLoggerService.success).toHaveBeenCalledWith('Content pasted successfully');
    });
    
    test('should handle paste append mode', async () => {
      // Setup mocks
      mockClipboardService.readFromClipboard.mockResolvedValue('- [ ] New task from clipboard');
      mockFileSystemService.readFile.mockResolvedValue('- [ ] Existing task');
      mockFileSystemService.writeFile.mockResolvedValue(undefined);
      
      await cliService.pasteTask('tasks', 'append');
      
      expect(mockClipboardService.readFromClipboard).toHaveBeenCalled();
      expect(mockFileSystemService.readFile).toHaveBeenCalled();
      expect(mockLoggerService.success).toHaveBeenCalledWith('Content pasted successfully');
    });
  });
  
  describe('nextTask', () => {
    test('should mark current task as complete and move to next', async () => {
      // Setup mocks
      mockTaskService.markCurrentTaskComplete.mockResolvedValue(TaskStatus.COMPLETE);
      
      await cliService.nextTask('tasks');
      
      expect(mockTaskService.markCurrentTaskComplete).toHaveBeenCalled();
      expect(mockLoggerService.success).toHaveBeenCalledWith('Task marked as complete');
    });
    
    test('should handle no current task found', async () => {
      // Setup mocks
      mockTaskService.markCurrentTaskComplete.mockResolvedValue(TaskStatus.NOT_FOUND);
      
      await cliService.nextTask('tasks');
      
      expect(mockLoggerService.warn).toHaveBeenCalledWith('No current task found');
    });
  });
  
  describe('resetTasks', () => {
    test('should reset completed tasks successfully', async () => {
      // Setup mocks
      mockTaskService.resetCompletedTasks.mockResolvedValue(3);
      
      await cliService.resetTasks('tasks');
      
      expect(mockTaskService.resetCompletedTasks).toHaveBeenCalled();
      expect(mockLoggerService.success).toHaveBeenCalledWith('3 tasks reset to incomplete');
    });
    
    test('should handle no completed tasks found', async () => {
      // Setup mocks
      mockTaskService.resetCompletedTasks.mockResolvedValue(0);
      
      await cliService.resetTasks('tasks');
      
      expect(mockLoggerService.info).toHaveBeenCalledWith('No completed tasks found to reset');
    });
  });
  
  describe('checkForUpdates', () => {
    test('should check for updates and find new version', async () => {
      // Setup mocks
      mockUpdateService.checkForUpdates.mockResolvedValue({
        hasUpdate: true,
        currentVersion: '1.0.0',
        latestVersion: '1.1.0'
      });
      
      await cliService.checkForUpdates();
      
      expect(mockUpdateService.checkForUpdates).toHaveBeenCalled();
      expect(mockLoggerService.info).toHaveBeenCalledWith('Update available: 1.0.0 → 1.1.0');
    });
    
    test('should handle no updates available', async () => {
      // Setup mocks
      mockUpdateService.checkForUpdates.mockResolvedValue({
        hasUpdate: false,
        currentVersion: '1.0.0',
        latestVersion: '1.0.0'
      });
      
      await cliService.checkForUpdates();
      
      expect(mockLoggerService.success).toHaveBeenCalledWith('Already using the latest version (1.0.0)');
    });
  });
});