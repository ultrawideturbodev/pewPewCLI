/**
 * Test Helpers
 * 
 * Utility functions and helpers for tests
 */

import { jest } from '@jest/globals';

/**
 * Generates random task content for testing
 */
export function generateRandomTaskContent(taskCount = 5, completedCount = 2) {
  const tasks = [];
  
  // Add a header
  tasks.push('# Random Tasks');
  tasks.push('');
  
  // Generate random tasks
  for (let i = 0; i < taskCount; i++) {
    const isCompleted = i < completedCount;
    const taskStatus = isCompleted ? '[x]' : '[ ]';
    tasks.push(`- ${taskStatus} Random task ${i + 1}`);
  }
  
  return tasks.join('\n');
}

/**
 * Mocks process.cwd() to return a specific directory
 */
export function mockCurrentWorkingDirectory(directory: string) {
  const originalCwd = process.cwd;
  jest.spyOn(process, 'cwd').mockReturnValue(directory);
  
  return () => {
    process.cwd = originalCwd;
  };
}

/**
 * Creates a mock process.argv array
 */
export function createMockArgv(command: string, args: string[] = [], flags: Record<string, string | boolean> = {}) {
  const argv = ['node', 'pew', command, ...args];
  
  Object.entries(flags).forEach(([flag, value]) => {
    if (typeof value === 'boolean') {
      if (value) {
        argv.push(`--${flag}`);
      }
    } else {
      argv.push(`--${flag}`, value);
    }
  });
  
  return argv;
}

/**
 * Creates a spy for console methods
 */
export function spyOnConsole() {
  return {
    log: jest.spyOn(console, 'log').mockImplementation(),
    info: jest.spyOn(console, 'info').mockImplementation(),
    warn: jest.spyOn(console, 'warn').mockImplementation(),
    error: jest.spyOn(console, 'error').mockImplementation(),
  };
}

/**
 * Creates a mock implementation of fs.promises
 */
export function createMockFsPromises() {
  const files: Record<string, string> = {};
  const directories: string[] = [];
  
  return {
    readFile: jest.fn().mockImplementation((path: string) => {
      if (files[path]) {
        return Promise.resolve(files[path]);
      }
      return Promise.reject(new Error(`ENOENT: no such file or directory, open '${path}'`));
    }),
    writeFile: jest.fn().mockImplementation((path: string, content: string) => {
      files[path] = content;
      return Promise.resolve();
    }),
    access: jest.fn().mockImplementation((path: string) => {
      if (files[path] || directories.includes(path)) {
        return Promise.resolve();
      }
      return Promise.reject(new Error(`ENOENT: no such file or directory, access '${path}'`));
    }),
    mkdir: jest.fn().mockImplementation((path: string) => {
      directories.push(path);
      return Promise.resolve();
    }),
    // Add more methods as needed
    
    // Helper to set initial file state for tests
    _setFiles: (newFiles: Record<string, string>) => {
      Object.assign(files, newFiles);
    },
    _setDirectories: (newDirectories: string[]) => {
      directories.push(...newDirectories);
    },
    _reset: () => {
      Object.keys(files).forEach(key => delete files[key]);
      directories.length = 0;
    },
  };
}