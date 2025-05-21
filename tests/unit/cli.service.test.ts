/**
 * CliService Unit Tests
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
  TaskService: jest.fn(),
  TaskStatus: {
    COMPLETE: 'complete',
    INCOMPLETE: 'incomplete',
    NOT_FOUND: 'not_found'
  }
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
const { TaskStatus } = await import('@/tasks/task.service');
const { ConfigService } = await import('@/io/config.service');
const { FileSystemService } = await import('@/io/file-system.service');
const { TaskService } = await import('@/tasks/task.service');
const { UserInputService } = await import('@/io/user-input.service');
const { ClipboardService } = await import('@/clipboard/clipboard.service');
const { UpdateService } = await import('@/updates/update.service');
const { LoggerService } = await import('@/core/logger.service');
const path = await import('path');

describe('CliService', () => {
  let cliService: CliService;
  let mockConfigService: any;
  let mockFileSystemService: any;
  let mockTaskService: any;
  let mockUserInputService: any;
  let mockClipboardService: any;
  let mockUpdateService: any;
  let mockLoggerService: any;
  
  beforeEach(() => {
    // Clear instance to create a clean one
    // @ts-ignore - Accessing private static field for testing
    CliService.instance = null;
    
    // Setup specific mock behaviors
    mockFileSystemService = FileSystemService as jest.MockedClass<typeof FileSystemService>;
    mockConfigService = ConfigService;
    mockTaskService = TaskService as jest.MockedClass<typeof TaskService>;
    mockUserInputService = UserInputService as jest.MockedClass<typeof UserInputService>;
    mockClipboardService = ClipboardService as jest.MockedClass<typeof ClipboardService>;
    mockUpdateService = UpdateService as jest.MockedClass<typeof UpdateService>;
    mockLoggerService = LoggerService;
    
    // Setup ConfigService mock
    mockConfigService.getInstance.mockReturnValue({
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
    });
    
    // Setup LoggerService mock
    mockLoggerService.getInstance.mockReturnValue({
      log: jest.fn(),
      success: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      header: jest.fn(),
      divider: jest.fn(),
      taskLines: jest.fn(),
    });
    
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
      const mockLogger = mockLoggerService.getInstance();
      
      await cliService.init();
      
      expect(mockLogger.divider).toHaveBeenCalled();
      expect(mockLogger.header).toHaveBeenCalledWith('Initializing pew-pew-cli');
    });
  });
  
  describe('setPath', () => {
    test('should set tasks path successfully', async () => {
      const mockConfigInstance = mockConfigService.getInstance();
      const mockLogger = mockLoggerService.getInstance();
      
      await cliService.setPath('tasks', '/new/path/to/tasks.md');
      
      expect(mockConfigInstance.setTasksPaths).toHaveBeenCalledWith(['/new/path/to/tasks.md']);
      expect(mockLogger.success).toHaveBeenCalledWith('Tasks path updated successfully');
    });
    
    test('should handle invalid field gracefully', async () => {
      const mockLogger = mockLoggerService.getInstance();
      
      await cliService.setPath('invalid', '/some/path');
      
      expect(mockLogger.error).toHaveBeenCalledWith('Invalid field: invalid');
    });
  });
  
  describe('pasteTask', () => {
    test('should paste clipboard content to tasks file with overwrite mode', async () => {
      const mockConfigInstance = mockConfigService.getInstance();
      const mockFileSystemInstance = new mockFileSystemService();
      const mockClipboardInstance = new mockClipboardService();
      const mockLogger = mockLoggerService.getInstance();
      
      // Setup mocks
      mockClipboardInstance.read.mockResolvedValue('- [ ] New task from clipboard');
      mockFileSystemInstance.writeFile.mockResolvedValue(undefined);
      
      await cliService.pasteTask('tasks', 'overwrite');
      
      expect(mockClipboardInstance.read).toHaveBeenCalled();
      expect(mockConfigInstance.getPasteTasksPath).toHaveBeenCalledWith('tasks');
      expect(mockLogger.success).toHaveBeenCalledWith('Content pasted successfully');
    });
    
    test('should handle paste append mode', async () => {
      const mockConfigInstance = mockConfigService.getInstance();
      const mockFileSystemInstance = new mockFileSystemService();
      const mockClipboardInstance = new mockClipboardService();
      const mockLogger = mockLoggerService.getInstance();
      
      // Setup mocks
      mockClipboardInstance.read.mockResolvedValue('- [ ] New task from clipboard');
      mockFileSystemInstance.readFile.mockResolvedValue('- [ ] Existing task');
      mockFileSystemInstance.writeFile.mockResolvedValue(undefined);
      
      await cliService.pasteTask('tasks', 'append');
      
      expect(mockClipboardInstance.read).toHaveBeenCalled();
      expect(mockFileSystemInstance.readFile).toHaveBeenCalled();
      expect(mockLogger.success).toHaveBeenCalledWith('Content pasted successfully');
    });
  });
  
  describe('nextTask', () => {
    test('should mark current task as complete and move to next', async () => {
      const mockTaskInstance = new mockTaskService();
      const mockLogger = mockLoggerService.getInstance();
      
      // Setup mocks
      mockTaskInstance.markCurrentTaskComplete.mockResolvedValue(TaskStatus.COMPLETE);
      
      await cliService.nextTask('tasks');
      
      expect(mockTaskInstance.markCurrentTaskComplete).toHaveBeenCalled();
      expect(mockLogger.success).toHaveBeenCalledWith('Task marked as complete');
    });
    
    test('should handle no current task found', async () => {
      const mockTaskInstance = new mockTaskService();
      const mockLogger = mockLoggerService.getInstance();
      
      // Setup mocks
      mockTaskInstance.markCurrentTaskComplete.mockResolvedValue(TaskStatus.NOT_FOUND);
      
      await cliService.nextTask('tasks');
      
      expect(mockLogger.warn).toHaveBeenCalledWith('No current task found');
    });
  });
  
  describe('resetTasks', () => {
    test('should reset completed tasks successfully', async () => {
      const mockTaskInstance = new mockTaskService();
      const mockLogger = mockLoggerService.getInstance();
      
      // Setup mocks
      mockTaskInstance.resetCompletedTasks.mockResolvedValue(3);
      
      await cliService.resetTasks('tasks');
      
      expect(mockTaskInstance.resetCompletedTasks).toHaveBeenCalled();
      expect(mockLogger.success).toHaveBeenCalledWith('3 tasks reset to incomplete');
    });
    
    test('should handle no completed tasks found', async () => {
      const mockTaskInstance = new mockTaskService();
      const mockLogger = mockLoggerService.getInstance();
      
      // Setup mocks
      mockTaskInstance.resetCompletedTasks.mockResolvedValue(0);
      
      await cliService.resetTasks('tasks');
      
      expect(mockLogger.info).toHaveBeenCalledWith('No completed tasks found to reset');
    });
  });
  
  describe('checkForUpdates', () => {
    test('should check for updates and find new version', async () => {
      const mockUpdateInstance = new mockUpdateService();
      const mockLogger = mockLoggerService.getInstance();
      
      // Setup mocks
      mockUpdateInstance.checkForUpdates.mockResolvedValue({
        hasUpdate: true,
        currentVersion: '1.0.0',
        latestVersion: '1.1.0'
      });
      
      await cliService.checkForUpdates();
      
      expect(mockUpdateInstance.checkForUpdates).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Update available: 1.0.0 → 1.1.0');
    });
    
    test('should handle no updates available', async () => {
      const mockUpdateInstance = new mockUpdateService();
      const mockLogger = mockLoggerService.getInstance();
      
      // Setup mocks
      mockUpdateInstance.checkForUpdates.mockResolvedValue({
        hasUpdate: false,
        currentVersion: '1.0.0',
        latestVersion: '1.0.0'
      });
      
      await cliService.checkForUpdates();
      
      expect(mockLogger.success).toHaveBeenCalledWith('Already using the latest version (1.0.0)');
    });
  });
});