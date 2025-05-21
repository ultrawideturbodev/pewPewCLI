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
    mockFileSystemService = FileSystemService as jest.Mocked<typeof FileSystemService>;
    mockConfigService = ConfigService as jest.Mocked<typeof ConfigService>;
    mockTaskService = TaskService as jest.Mocked<typeof TaskService>;
    mockUserInputService = UserInputService as jest.Mocked<typeof UserInputService>;
    mockClipboardService = ClipboardService as jest.Mocked<typeof ClipboardService>;
    mockUpdateService = UpdateService as jest.Mocked<typeof UpdateService>;
    mockLoggerService = LoggerService as jest.Mocked<typeof LoggerService>;
    
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
    test('should return a singleton instance', () => {
      const instance1 = CliService.getInstance();
      const instance2 = CliService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });
  
  describe('handleInit', () => {
    test('should abort initialization if confirmation is denied', async () => {
      const localPewYamlPath = '/current/dir/pew.yaml';
      
      // Mock implementation
      (path.join as jest.Mock).mockReturnValueOnce(localPewYamlPath);
      (mockFileSystemService as any).prototype.pathExists.mockResolvedValueOnce(true);
      (mockUserInputService as any).prototype.askForConfirmation.mockResolvedValueOnce(false);
      
      await cliService.handleInit();
      
      // Check the logger was called with abort message
      expect(mockLoggerService.getInstance().log).toHaveBeenCalledWith('Initialization aborted.');
      
      // Check that other methods were not called
      expect(mockFileSystemService.prototype.writeFile).not.toHaveBeenCalled();
    });
    
    test('should proceed with initialization when force flag is true', async () => {
      const localPewYamlPath = '/current/dir/pew.yaml';
      
      // Mock path.join to return expected local pew.yaml path
      (path.join as jest.Mock).mockReturnValueOnce(localPewYamlPath);
      
      // Even if the file exists, with force=true we should not ask for confirmation
      (mockFileSystemService as any).prototype.pathExists.mockResolvedValueOnce(true);
      
      // Setup mocks for the task file path creation
      (mockConfigService.getInstance().getAllTasksPaths as jest.Mock).mockResolvedValueOnce(['/path/to/tasks.md']);
      (mockFileSystemService as any).prototype.pathExists.mockResolvedValueOnce(false); // Task file doesn't exist yet
      
      await cliService.handleInit({ force: true });
      
      // Should not have asked for confirmation
      expect(mockUserInputService.prototype.askForConfirmation).not.toHaveBeenCalled();
      
      // Should have proceeded with initialization
      expect(mockConfigService.getInstance().initialize).toHaveBeenCalled();
    });
  });
  
  describe('handleNextTask', () => {
    test('should display info message when no task files are configured', async () => {
      // Mock empty task paths
      (mockConfigService.getInstance().getAllTasksPaths as jest.Mock).mockResolvedValueOnce([]);
      
      await cliService.handleNextTask();
      
      // Should display info message
      expect(mockLoggerService.getInstance().info).toHaveBeenCalledWith(
        expect.stringContaining('No task files configured')
      );
      
      // Should not process tasks
      expect(mockTaskService.prototype.processNextTaskState).not.toHaveBeenCalled();
    });
    
    test('should display next task when found', async () => {
      // Mock task paths
      (mockConfigService.getInstance().getAllTasksPaths as jest.Mock).mockResolvedValueOnce(['/path/to/tasks.md']);
      
      // Mock task service response
      const mockNextTaskResult = {
        status: TaskStatus.NEXT_TASK_FOUND,
        displayFilePath: '/path/to/tasks.md',
        displayTaskLines: ['# Header', '- [ ] Task 1'],
        displayContextHeaders: 'Header',
        summary: 'Task summary',
      };
      
      (mockTaskService.prototype.processNextTaskState as jest.Mock).mockResolvedValueOnce(mockNextTaskResult);
      (path.relative as jest.Mock).mockReturnValueOnce('tasks.md');
      
      await cliService.handleNextTask();
      
      // Should process tasks
      expect(mockTaskService.prototype.processNextTaskState).toHaveBeenCalledWith(['/path/to/tasks.md']);
      
      // Should display task info
      expect(mockLoggerService.getInstance().header).toHaveBeenCalled();
      expect(mockLoggerService.getInstance().taskLines).toHaveBeenCalledWith(['# Header', '- [ ] Task 1']);
      expect(mockLoggerService.getInstance().log).toHaveBeenCalledWith(expect.stringContaining('Task summary'));
    });
    
    test('should display success message when all tasks are complete', async () => {
      // Mock task paths
      (mockConfigService.getInstance().getAllTasksPaths as jest.Mock).mockResolvedValueOnce(['/path/to/tasks.md']);
      
      // Mock task service response
      const mockNextTaskResult = {
        status: TaskStatus.ALL_COMPLETE,
        summary: 'All tasks complete',
        displayFilePath: '/path/to/tasks.md',
      };
      
      (mockTaskService.prototype.processNextTaskState as jest.Mock).mockResolvedValueOnce(mockNextTaskResult);
      (path.relative as jest.Mock).mockReturnValueOnce('tasks.md');
      
      await cliService.handleNextTask();
      
      // Should process tasks
      expect(mockTaskService.prototype.processNextTaskState).toHaveBeenCalledWith(['/path/to/tasks.md']);
      
      // Should display success message
      expect(mockLoggerService.getInstance().success).toHaveBeenCalledWith(expect.stringContaining('All tasks complete'));
    });
  });
  
  describe('handlePasteTasks', () => {
    test('should handle empty clipboard', async () => {
      // Mock empty clipboard
      (mockClipboardService.prototype.readFromClipboard as jest.Mock).mockResolvedValueOnce('');
      
      await cliService.handlePasteTasks();
      
      // Should log message about empty clipboard
      expect(mockLoggerService.getInstance().log).toHaveBeenCalledWith('Clipboard is empty. Nothing to paste.');
      
      // Should not write any tasks
      expect(mockTaskService.prototype.writeTasksContent).not.toHaveBeenCalled();
    });
    
    test('should prompt user for paste mode if not provided', async () => {
      // Mock clipboard with content
      (mockClipboardService.prototype.readFromClipboard as jest.Mock).mockResolvedValueOnce('- [ ] Task from clipboard');
      
      // Mock user selecting paste mode
      (mockUserInputService.prototype.askForSelection as jest.Mock).mockResolvedValueOnce('append');
      
      // Mock configured paste path
      (mockConfigService.getInstance().getPasteTasksPath as jest.Mock).mockResolvedValueOnce('/path/to/tasks.md');
      
      // Mock relative path for log message
      (path.relative as jest.Mock).mockReturnValueOnce('tasks.md');
      
      await cliService.handlePasteTasks();
      
      // Should ask for paste mode
      expect(mockUserInputService.prototype.askForSelection).toHaveBeenCalledWith(
        'Choose paste mode:',
        ['overwrite', 'append', 'insert']
      );
      
      // Should write tasks with the selected mode
      expect(mockTaskService.prototype.writeTasksContent).toHaveBeenCalledWith(
        '/path/to/tasks.md',
        '- [ ] Task from clipboard',
        'append'
      );
      
      // Should log success message
      expect(mockLoggerService.getInstance().success).toHaveBeenCalled();
    });
  });
});