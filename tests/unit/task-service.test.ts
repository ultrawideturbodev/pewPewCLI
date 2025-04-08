/**
 * Task Service Unit Tests
 * 
 * Tests for the TaskService parsing utilities implemented in Milestone 1.
 */
import { TaskService } from '../../src/modules/task.service.js';

describe('TaskService Parsing Utilities', () => {
  describe('Basic Checkers', () => {
    test('isTask should identify task lines correctly', () => {
      // Should identify checked and unchecked tasks
      expect(TaskService.isTask('- [ ] This is an unchecked task')).toBe(true);
      expect(TaskService.isTask('- [x] This is a checked task')).toBe(true);
      expect(TaskService.isTask('  - [ ] Indented task')).toBe(true);
      expect(TaskService.isTask('  - [x] Indented checked task')).toBe(true);
      
      // Should not identify non-task lines
      expect(TaskService.isTask('This is not a task')).toBe(false);
      expect(TaskService.isTask('# Header')).toBe(false);
      expect(TaskService.isTask('- This is a list item without checkbox')).toBe(false);
    });
    
    test('isUncheckedTask should identify unchecked tasks only', () => {
      // Should identify unchecked tasks
      expect(TaskService.isUncheckedTask('- [ ] This is an unchecked task')).toBe(true);
      expect(TaskService.isUncheckedTask('  - [ ] Indented unchecked task')).toBe(true);
      
      // Should not identify checked tasks or non-tasks
      expect(TaskService.isUncheckedTask('- [x] This is a checked task')).toBe(false);
      expect(TaskService.isUncheckedTask('This is not a task')).toBe(false);
      expect(TaskService.isUncheckedTask('# Header')).toBe(false);
    });
    
    test('isCheckedTask should identify checked tasks only', () => {
      // Should identify checked tasks
      expect(TaskService.isCheckedTask('- [x] This is a checked task')).toBe(true);
      expect(TaskService.isCheckedTask('- [X] This is also a checked task')).toBe(true);
      expect(TaskService.isCheckedTask('  - [x] Indented checked task')).toBe(true);
      
      // Should not identify unchecked tasks or non-tasks
      expect(TaskService.isCheckedTask('- [ ] This is an unchecked task')).toBe(false);
      expect(TaskService.isCheckedTask('This is not a task')).toBe(false);
      expect(TaskService.isCheckedTask('# Header')).toBe(false);
    });
    
    test('isHeader should identify headers correctly', () => {
      // Should identify different header levels
      expect(TaskService.isHeader('# Level 1 header')).toBe(true);
      expect(TaskService.isHeader('## Level 2 header')).toBe(true);
      expect(TaskService.isHeader('### Level 3 header')).toBe(true);
      expect(TaskService.isHeader('###### Level 6 header')).toBe(true);
      
      // Should not identify non-headers
      expect(TaskService.isHeader('This is not a header')).toBe(false);
      expect(TaskService.isHeader('- [ ] Task')).toBe(false);
      expect(TaskService.isHeader('#This is not a header (no space)')).toBe(false);
    });
  });
  
  describe('Task Finding', () => {
    const mockTaskLines = [
      '# Header 1',
      'Some description',
      '- [x] Completed task 1',
      '- [ ] Uncompleted task 1',
      '## Header 2',
      '- [x] Completed task 2',
      '- [ ] Uncompleted task 2',
      'Some more text'
    ];
    
    test('findFirstUncheckedTask should find the first unchecked task', () => {
      const index = TaskService.findFirstUncheckedTask(mockTaskLines);
      expect(index).toBe(3); // '- [ ] Uncompleted task 1'
    });
    
    test('findNextUncheckedTask should find the next unchecked task after a given index', () => {
      const index = TaskService.findNextUncheckedTask(mockTaskLines, 3);
      expect(index).toBe(6); // '- [ ] Uncompleted task 2'
      
      // Should return -1 if no more unchecked tasks
      const noMoreTasksIndex = TaskService.findNextUncheckedTask(mockTaskLines, 6);
      expect(noMoreTasksIndex).toBe(-1);
    });
    
    test('findFirstTask should find the first task (checked or unchecked)', () => {
      const index = TaskService.findFirstTask(mockTaskLines);
      expect(index).toBe(2); // '- [x] Completed task 1'
    });
    
    test('Task finding methods should return -1 when no matching task is found', () => {
      const emptyLines: string[] = [];
      const noTasks = ['# Header', 'Plain text', 'More text'];
      
      expect(TaskService.findFirstUncheckedTask(emptyLines)).toBe(-1);
      expect(TaskService.findNextUncheckedTask(emptyLines, 0)).toBe(-1);
      expect(TaskService.findFirstTask(emptyLines)).toBe(-1);
      
      expect(TaskService.findFirstUncheckedTask(noTasks)).toBe(-1);
      expect(TaskService.findNextUncheckedTask(noTasks, 0)).toBe(-1);
      expect(TaskService.findFirstTask(noTasks)).toBe(-1);
    });
  });
});

describe('Task Statistics and Summary', () => {
  const mockTaskLines = [
    '# Header 1',
    'Some description',
    '- [x] Completed task 1',
    '- [ ] Uncompleted task 1',
    '## Header 2',
    '- [x] Completed task 2',
    '- [ ] Uncompleted task 2',
    'Some more text'
  ];
  
  test('getTaskStats should correctly count tasks', () => {
    const stats = TaskService.getTaskStats(mockTaskLines);
    
    expect(stats.total).toBe(4);
    expect(stats.completed).toBe(2);
    expect(stats.remaining).toBe(2);
  });
  
  test('getTaskStats should handle empty input', () => {
    const stats = TaskService.getTaskStats([]);
    
    expect(stats.total).toBe(0);
    expect(stats.completed).toBe(0);
    expect(stats.remaining).toBe(0);
  });
  
  test('getTaskStats should handle input with no tasks', () => {
    const noTaskLines = [
      '# Header 1',
      'Some description',
      'Some more text'
    ];
    
    const stats = TaskService.getTaskStats(noTaskLines);
    
    expect(stats.total).toBe(0);
    expect(stats.completed).toBe(0);
    expect(stats.remaining).toBe(0);
  });
  
  test('getSummary should format statistics correctly', () => {
    const stats = { total: 10, completed: 7, remaining: 3 };
    const summary = TaskService.getSummary(stats);
    
    expect(summary).toBe('Total: 10 task(s) | Completed: 7 (70.0%) | Remaining: 3');
  });
  
  test('getSummary should handle zero tasks gracefully', () => {
    const stats = { total: 0, completed: 0, remaining: 0 };
    const summary = TaskService.getSummary(stats);
    
    expect(summary).toBe('Total: 0 task(s) | Completed: 0 (0.0%) | Remaining: 0');
  });
  
  test('getSummary should handle 100% completion correctly', () => {
    const stats = { total: 5, completed: 5, remaining: 0 };
    const summary = TaskService.getSummary(stats);
    
    expect(summary).toBe('Total: 5 task(s) | Completed: 5 (100.0%) | Remaining: 0');
  });
}); 