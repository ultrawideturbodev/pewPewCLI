/**
 * TaskService Unit Tests
 */
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { TaskService, TaskStatus } from '@/tasks/task.service.js';
import { createMockFileSystemService, createMockConfigService, mockFixtures } from '@tests/mocks/service-factory.js';

describe('TaskService', () => {
  let fileSystemService: any;
  let configService: any;
  let taskService: TaskService;

  beforeEach(() => {
    fileSystemService = createMockFileSystemService();
    configService = createMockConfigService();
    taskService = new TaskService(configService, fileSystemService);
  });

  describe('isTask', () => {
    test('should identify task lines correctly', () => {
      // Tasks with different formats
      expect(TaskService.isTask('- [ ] This is an unchecked task')).toBe(true);
      expect(TaskService.isTask('- [x] This is a checked task')).toBe(true);
      expect(TaskService.isTask('  - [ ] Indented task')).toBe(true);
      expect(TaskService.isTask('👉 - [ ] Current task')).toBe(true);
      
      // Non-task lines
      expect(TaskService.isTask('This is not a task')).toBe(false);
      expect(TaskService.isTask('# Header')).toBe(false);
      expect(TaskService.isTask('- This is a list item without checkbox')).toBe(false);
    });
  });

  describe('isUncheckedTask', () => {
    test('should identify unchecked tasks only', () => {
      // Unchecked tasks
      expect(TaskService.isUncheckedTask('- [ ] This is an unchecked task')).toBe(true);
      expect(TaskService.isUncheckedTask('  - [ ] Indented unchecked task')).toBe(true);
      expect(TaskService.isUncheckedTask('👉 - [ ] Current unchecked task')).toBe(true);
      
      // Checked tasks or non-tasks
      expect(TaskService.isUncheckedTask('- [x] This is a checked task')).toBe(false);
      expect(TaskService.isUncheckedTask('This is not a task')).toBe(false);
      expect(TaskService.isUncheckedTask('# Header')).toBe(false);
    });
  });

  describe('isCheckedTask', () => {
    test('should identify checked tasks only', () => {
      // Checked tasks
      expect(TaskService.isCheckedTask('- [x] This is a checked task')).toBe(true);
      expect(TaskService.isCheckedTask('- [X] This is also a checked task')).toBe(true);
      expect(TaskService.isCheckedTask('  - [x] Indented checked task')).toBe(true);
      expect(TaskService.isCheckedTask('👉 - [x] Current checked task')).toBe(true);
      
      // Unchecked tasks or non-tasks
      expect(TaskService.isCheckedTask('- [ ] This is an unchecked task')).toBe(false);
      expect(TaskService.isCheckedTask('This is not a task')).toBe(false);
      expect(TaskService.isCheckedTask('# Header')).toBe(false);
    });
  });

  describe('isHeader', () => {
    test('should identify headers correctly', () => {
      // Headers with different levels
      expect(TaskService.isHeader('# Level 1 header')).toBe(true);
      expect(TaskService.isHeader('## Level 2 header')).toBe(true);
      expect(TaskService.isHeader('### Level 3 header')).toBe(true);
      expect(TaskService.isHeader('###### Level 6 header')).toBe(true);
      
      // Non-headers
      expect(TaskService.isHeader('This is not a header')).toBe(false);
      expect(TaskService.isHeader('- [ ] Task')).toBe(false);
      expect(TaskService.isHeader('#This is not a header (no space)')).toBe(false);
    });
  });

  describe('findFirstUncheckedTask', () => {
    test('should find the first unchecked task', () => {
      const lines = [
        '# Header',
        '- [x] Completed task',
        '- [ ] Unchecked task 1',
        '- [ ] Unchecked task 2',
      ];
      
      expect(TaskService.findFirstUncheckedTask(lines)).toBe(2);
    });
    
    test('should return -1 if no unchecked tasks exist', () => {
      const lines = [
        '# Header',
        '- [x] Completed task 1',
        '- [x] Completed task 2',
      ];
      
      expect(TaskService.findFirstUncheckedTask(lines)).toBe(-1);
    });
  });

  describe('getTaskStatsFromLines', () => {
    test('should calculate task statistics correctly', () => {
      const lines = [
        '# Header',
        '- [x] Completed task 1',
        '- [x] Completed task 2',
        '- [ ] Unchecked task 1',
        '- [ ] Unchecked task 2',
        '- [ ] Unchecked task 3',
      ];
      
      const stats = TaskService.getTaskStatsFromLines(lines);
      expect(stats.total).toBe(5);
      expect(stats.completed).toBe(2);
      expect(stats.remaining).toBe(3);
    });
    
    test('should handle empty input', () => {
      const stats = TaskService.getTaskStatsFromLines([]);
      expect(stats.total).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.remaining).toBe(0);
    });
  });

  describe('writeTaskLines', () => {
    test('should write task lines to a file', async () => {
      const filePath = '/mock/path/tasks.md';
      const lines = ['# Tasks', '- [ ] Task 1', '- [ ] Task 2'];
      
      await taskService.writeTaskLines(filePath, lines);
      
      expect(fileSystemService.ensureDirectoryExists).toHaveBeenCalledWith('/mock/path');
      expect(fileSystemService.writeFile).toHaveBeenCalledWith(filePath, '# Tasks\n- [ ] Task 1\n- [ ] Task 2');
    });
  });

  describe('readTaskLines', () => {
    test('should read task lines from a file', async () => {
      const filePath = '/mock/path/tasks.md';
      const fileContent = '# Tasks\n- [ ] Task 1\n- [ ] Task 2';
      
      fileSystemService.readFile.mockResolvedValueOnce(fileContent);
      
      const lines = await taskService.readTaskLines(filePath);
      
      expect(fileSystemService.pathExists).toHaveBeenCalledWith(filePath);
      expect(fileSystemService.readFile).toHaveBeenCalledWith(filePath);
      expect(lines).toEqual(['# Tasks', '- [ ] Task 1', '- [ ] Task 2']);
    });
    
    test('should throw an error if the file does not exist', async () => {
      const filePath = '/mock/path/nonexistent.md';
      
      fileSystemService.pathExists.mockResolvedValueOnce(false);
      
      await expect(taskService.readTaskLines(filePath)).rejects.toThrow(`Task file not found: ${filePath}`);
    });
  });

  describe('resetTaskFile', () => {
    test('should reset all completed tasks in a file', async () => {
      const filePath = '/mock/path/tasks.md';
      const fileContent = '# Tasks\n- [x] Task 1\n- [ ] Task 2\n- [x] Task 3';
      const expectedContent = '# Tasks\n- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3';
      
      fileSystemService.readFile.mockResolvedValueOnce(fileContent);
      
      const resetCount = await taskService.resetTaskFile(filePath);
      
      expect(resetCount).toBe(2);
      expect(fileSystemService.writeFile).toHaveBeenCalledWith(filePath, expectedContent);
    });
    
    test('should not write to the file if no tasks were reset', async () => {
      const filePath = '/mock/path/tasks.md';
      const fileContent = '# Tasks\n- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3';
      
      fileSystemService.readFile.mockResolvedValueOnce(fileContent);
      
      const resetCount = await taskService.resetTaskFile(filePath);
      
      expect(resetCount).toBe(0);
      expect(fileSystemService.writeFile).not.toHaveBeenCalled();
    });
  });
});