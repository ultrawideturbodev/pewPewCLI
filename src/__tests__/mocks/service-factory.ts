/**
 * Test Service Factory
 * 
 * This factory creates mock instances of services for testing.
 * It provides consistent mocks across all tests and simplifies test setup.
 */

import { jest } from '@jest/globals';
import { FileSystemService } from '../../io/file-system.service.js';
import { ConfigService } from '../../io/config.service.js';
import { LoggerService } from '../../core/logger.service.js';
import { YamlService } from '../../io/yaml.service.js';
import { UserInputService } from '../../io/user-input.service.js';
import { ClipboardService } from '../../clipboard/clipboard.service.js';
import { TaskService } from '../../tasks/task.service.js';
import { UpdateService } from '../../updates/update.service.js';

/**
 * Creates a mock FileSystemService
 */
export function createMockFileSystemService() {
  return {
    readFile: jest.fn().mockResolvedValue(''),
    writeFile: jest.fn().mockResolvedValue(undefined),
    pathExists: jest.fn().mockResolvedValue(true),
    ensureDirectoryExists: jest.fn().mockResolvedValue(undefined),
    createDirectory: jest.fn().mockResolvedValue(undefined),
    getHomeDirectory: jest.fn().mockReturnValue('/mock/home'),
    resolvePath: jest.fn().mockImplementation((...paths) => paths.join('/')),
    joinPath: jest.fn().mockImplementation((...paths) => paths.join('/')),
  } as unknown as FileSystemService;
}

/**
 * Creates a mock LoggerService
 */
export function createMockLoggerService() {
  const mockLoggerService = {
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    success: jest.fn(),
    header: jest.fn(),
    divider: jest.fn(),
    taskLines: jest.fn(),
    getInstance: jest.fn().mockReturnThis(),
  };
  
  // Replace the singleton getInstance method
  jest.spyOn(LoggerService, 'getInstance').mockReturnValue(mockLoggerService as unknown as LoggerService);
  
  return mockLoggerService;
}

/**
 * Creates a mock ConfigService
 */
export function createMockConfigService() {
  const mockConfigService = {
    initialize: jest.fn().mockResolvedValue(undefined),
    getTasksPaths: jest.fn().mockResolvedValue(['mock/tasks.md']),
    getAllTasksPaths: jest.fn().mockResolvedValue(['mock/tasks.md']),
    setTasksPaths: jest.fn().mockResolvedValue(undefined),
    getProjectRootPath: jest.fn().mockReturnValue('/mock/project'),
    getLocalPewYamlPath: jest.fn().mockReturnValue('/mock/project/pew.yaml'),
    getGlobalPewYamlPath: jest.fn().mockReturnValue('/mock/home/.pew/pew.yaml'),
    getPasteTasksPath: jest.fn().mockResolvedValue('/mock/project/tasks.md'),
    getGlobalUpdateValue: jest.fn().mockResolvedValue(0),
    setGlobalUpdateValue: jest.fn().mockResolvedValue(undefined),
    getGlobalConfigDataInternal: jest.fn().mockReturnValue({ tasks: { all: ['tasks.md'] } }),
    getInstance: jest.fn().mockReturnThis(),
  };
  
  // Replace the singleton getInstance method
  jest.spyOn(ConfigService, 'getInstance').mockReturnValue(mockConfigService as unknown as ConfigService);
  
  return mockConfigService;
}

/**
 * Creates a mock YamlService
 */
export function createMockYamlService() {
  return {
    readYamlFile: jest.fn().mockResolvedValue({}),
    writeYamlFile: jest.fn().mockResolvedValue(undefined),
  } as unknown as YamlService;
}

/**
 * Creates a mock UserInputService
 */
export function createMockUserInputService() {
  return {
    askForText: jest.fn().mockResolvedValue('mock-input'),
    askForConfirmation: jest.fn().mockResolvedValue(true),
    askForSelection: jest.fn().mockResolvedValue('option1'),
    askForMultipleSelections: jest.fn().mockResolvedValue(['option1', 'option2']),
  } as unknown as UserInputService;
}

/**
 * Creates a mock ClipboardService
 */
export function createMockClipboardService() {
  return {
    readFromClipboard: jest.fn().mockResolvedValue('mock-clipboard-content'),
    writeToClipboard: jest.fn().mockResolvedValue(undefined),
  } as unknown as ClipboardService;
}

/**
 * Creates all required mock services for testing
 */
export function createMockServices() {
  const fileSystemService = createMockFileSystemService();
  const loggerService = createMockLoggerService();
  const configService = createMockConfigService();
  const yamlService = createMockYamlService();
  const userInputService = createMockUserInputService();
  const clipboardService = createMockClipboardService();
  const taskService = new TaskService(configService, fileSystemService);
  const updateService = new UpdateService(fileSystemService, configService);
  
  return {
    fileSystemService,
    loggerService,
    configService,
    yamlService,
    userInputService,
    clipboardService,
    taskService,
    updateService,
  };
}

/**
 * Creates mock fixtures for testing (example task content)
 */
export const mockFixtures = {
  tasks: {
    emptyFile: '',
    singleTask: '- [ ] Task 1',
    multipleTasks: [
      '# Tasks',
      '- [ ] Task 1',
      '- [ ] Task 2',
      '- [x] Completed task',
    ].join('\n'),
    currentTask: [
      '# Tasks',
      '👉 - [ ] Current task',
      '- [ ] Task 2',
      '- [x] Completed task',
    ].join('\n'),
  },
  config: {
    empty: {},
    basic: {
      tasks: {
        all: ['tasks.md'],
        primary: 'tasks.md',
        paste: 'tasks.md',
      },
    },
    withTemplates: {
      tasks: {
        all: ['tasks.md'],
        primary: 'tasks.md',
        paste: 'tasks.md',
      },
      templates: {
        component: {
          variables: {
            'ComponentName': 'What is the component name?',
          },
          replacements: {
            'template-component': 'user-component',
          },
          root: 'src/components',
          files: [
            'templates/component/component.ts',
            'templates/component/index.ts',
          ],
        },
      },
    },
  },
};