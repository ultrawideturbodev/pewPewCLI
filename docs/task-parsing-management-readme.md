# Task Parsing and Management in pew-pew-cli

This document provides a comprehensive explanation of how pew-pew-cli parses, manages, and manipulates Markdown task lists. This is a core functionality of the tool and understanding it is essential for AI agents working on the codebase.

## Task Representation

pew-pew-cli works with task lists in Markdown format:

- Tasks are represented as Markdown checkbox items:
  - `- [ ]` for unchecked tasks
  - `- [x]` or `- [X]` for checked/completed tasks
- The current task is marked with a 👉 prefix: `👉 - [ ] Current task`
- Tasks can have context in the form of Markdown headers

## Regular Expression Patterns

The `TaskService` uses several regular expressions to identify and manipulate tasks:

```typescript
// For all tasks (checked or unchecked)
private static readonly TASK_PATTERN: RegExp = /^(?:👉\s+)?\s*-\s*\[\s*[xX\s]*\s*\]/;

// For unchecked tasks
private static readonly UNCHECKED_PATTERN: RegExp = /^(?:👉\s+)?\s*-\s*\[\s*\]/;

// For checked tasks
private static readonly CHECKED_PATTERN: RegExp = /^(?:👉\s+)?\s*-\s*\[\s*[xX]\s*\]/;

// For Markdown headers (# to ######)
private static readonly HEADER_PATTERN: RegExp = /^(#{1,6})\s+(.+)$/;

// For the 👉 prefix that marks the current task
private static readonly PEW_PREFIX: string = '👉 ';
private static readonly PEW_PREFIX_REGEX: RegExp = /^👉\s+/;
```

These patterns account for:
- Optional 👉 prefix
- Whitespace variations
- Case insensitivity for 'x' in checked tasks

## Core Task Management Functions

### Task Identification

```typescript
// Check if a line is any kind of task
public static isTask(line: string): boolean

// Check if a line is an unchecked task
public static isUncheckedTask(line: string): boolean

// Check if a line is a checked task
public static isCheckedTask(line: string): boolean
```

### Prefix Manipulation

```typescript
// Check if a line has the 👉 prefix
public static lineHasPewPrefix(line: string): boolean

// Remove the 👉 prefix from a line
public static getLineWithoutPewPrefix(line: string): string

// Add the 👉 prefix to a specific line
public static addPewPrefix(lines: string[], index: number): string[]

// Remove the 👉 prefix from a specific line
public static removePewPrefix(lines: string[], index: number): string[]
```

### Task Finding

```typescript
// Find the index of the first task with the 👉 prefix
public static findTaskWithPewPrefix(lines: string[]): number

// Find the first unchecked task
public static findFirstUncheckedTask(lines: string[]): number

// Find the next unchecked task after a given index
public static findNextUncheckedTask(lines: string[], startIndex: number): number
```

### Task Modification

```typescript
// Mark a task as complete by changing [ ] to [x]
public static markTaskComplete(line: string): string

// Uncheck all completed tasks in an array of lines
public static uncheckTasksInLines(lines: string[]): {
  modifiedLines: string[];
  resetCount: number;
}
```

## Task State Management

### Task Statistics

```typescript
// Calculate task statistics from an array of lines
public static getTaskStatsFromLines(lines: string[]): {
  total: number;
  completed: number;
  remaining: number;
}

// Format statistics into a human-readable summary
public static getSummary(stats: { total: number; completed: number; remaining: number }): string
// Example: "Total: 10 task(s) | Completed: 5 (50.0%) | Remaining: 5"
```

### Context Handling

```typescript
// Get headers preceding a task for context
public static getContextHeaders(lines: string[], taskIndex: number): string

// Determine the line range to display for a task with proper context
public static getTaskOutputRange(lines: string[], taskIndex: number): { 
  startIndex: number; 
  endIndex: number 
}
```

## Core Algorithm: Moving Between Tasks

The heart of pew-pew-cli is the `processNextTaskState` method, which implements the algorithm for:
1. Marking the current task complete
2. Finding the next task
3. Moving the 👉 pointer
4. Handling various cases (all tasks complete, no tasks, etc.)

### State Transition Workflow

The method follows this basic flow:

1. **Scan all files**
   - Find the first unchecked task across all files
   - Find any task with the 👉 prefix

2. **Handle global states**
   - If no tasks exist → `NO_TASKS`
   - If all tasks are complete → `ALL_COMPLETE`

3. **Determine what to do based on current state**
   - **Scenario: 👉 on wrong task**
     - Remove 👉 from current task
     - Add 👉 to the first unchecked task
   
   - **Scenario: No 👉 anywhere**
     - Add 👉 to the first unchecked task
   
   - **Scenario: Complete current task with 👉**
     - Remove 👉 from current task
     - Mark task as complete (change `[ ]` to `[x]`)
     - Find the next unchecked task (in same file or next file)
     - Add 👉 to the next unchecked task
   
   - **Scenario: 👉 already on correct task**
     - No file changes, just display the current task

4. **Prepare display information**
   - Task context (headers)
   - Task range (surrounding content)
   - Task statistics
   - File path

### State Machine

The task processing can be visualized as a state machine:

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│               │     │               │     │               │
│   NO_TASKS    │     │ NEXT_TASK_FOUND │     │ ALL_COMPLETE  │
│               │     │               │     │               │
└───────────────┘     └───────┬───────┘     └───────────────┘
                              │
                              │
                      ┌───────┴───────┐
                      │               │
                      │  Processing   │
                      │   Actions     │
                      │               │
                      └───────┬───────┘
                              │
                              │
                      ┌───────┴───────┐
                      │               │
                      │     ERROR     │
                      │               │
                      └───────────────┘
```

## The NextTaskResult Type

Results from processing are returned as a discriminated union type:

```typescript
export type NextTaskResult =
  | {
      status: TaskStatus.NEXT_TASK_FOUND;
      displayFilePath: string;
      displayTaskLines: string[];
      displayContextHeaders: string;
      summary: string;
      message?: string | null;
    }
  | {
      status: TaskStatus.ALL_COMPLETE;
      summary: string;
      displayFilePath?: string;
      message?: string | null;
    }
  | {
      status: TaskStatus.NO_TASKS;
      summary: string;
      message?: string | null;
    }
  | {
      status: TaskStatus.ERROR;
      message: string;
    };
```

This type:
- Uses the `status` property as a discriminator
- Provides different properties based on the status
- Ensures type safety when handling different outcomes

## File I/O Operations

The `TaskService` includes methods for file operations:

```typescript
// Read a file and split into lines
async readTaskLines(filePath: string): Promise<string[]>

// Write lines back to a file
async writeTaskLines(filePath: string, lines: string[]): Promise<void>

// Write content to a file with different modes (overwrite, append, insert)
async writeTasksContent(
  filePath: string,
  content: string,
  mode: 'overwrite' | 'append' | 'insert'
): Promise<void>

// Reset all checked tasks in a file
async resetTaskFile(filePath: string): Promise<number>
```

## Task File Summaries

The `getTaskFileSummaries` method generates information about task files:

```typescript
async getTaskFileSummaries(filePaths: string[]): Promise<TaskFileSummary[]>
```

Which returns information used for interactive selection:

```typescript
export interface TaskFileSummary {
  filePath: string;
  relativePath: string;
  summary: string;
  exists: boolean;
  error: string | null;
  disabled: boolean;
}
```

## Working with the Task Management System

### Modifying Task Parsing

If you need to change how tasks are identified or manipulated:

1. Update the relevant regex patterns at the top of `TaskService`
2. Adjust the static methods for task identification and manipulation
3. Ensure compatibility with existing task formats

### Adding Task Functionality

To add a new task-related feature:

1. Implement static utility methods for parsing/manipulating tasks
2. Add instance methods that handle file I/O if needed
3. Ensure proper error handling

### Debugging Task Operations

When debugging task-related issues:

1. Verify the regex patterns match the expected task format
2. Check file paths are resolved correctly
3. Use the TaskService static methods for programmatic inspection
4. Examine the intermediate states during processing

## Examples

### Finding and Marking a Task as Complete

```typescript
// Find the first unchecked task
const lines = await taskService.readTaskLines(filePath);
const taskIndex = TaskService.findFirstUncheckedTask(lines);

if (taskIndex !== -1) {
  // Mark it complete
  lines[taskIndex] = TaskService.markTaskComplete(lines[taskIndex]);
  await taskService.writeTaskLines(filePath, lines);
}
```

### Adding the 👉 Prefix to the Next Task

```typescript
// Find the first unchecked task
const lines = await taskService.readTaskLines(filePath);
const taskIndex = TaskService.findFirstUncheckedTask(lines);

if (taskIndex !== -1) {
  // Add the prefix
  const linesWithPrefix = TaskService.addPewPrefix(lines, taskIndex);
  await taskService.writeTaskLines(filePath, linesWithPrefix);
}
```

### Resetting Completed Tasks

```typescript
// Read all task lines
const lines = await taskService.readTaskLines(filePath);

// Uncheck all tasks
const { modifiedLines, resetCount } = TaskService.uncheckTasksInLines(lines);

// Only write back if changes were made
if (resetCount > 0) {
  await taskService.writeTaskLines(filePath, modifiedLines);
}
```

## Best Practices

1. **Use Static Methods for Parsing**: When parsing or manipulating individual lines or arrays of lines, use the static methods.

2. **Use Instance Methods for File Operations**: When reading or writing files, use the instance methods that handle file I/O.

3. **Preserve Task Prefixes**: Be careful to preserve the 👉 prefix when manipulating tasks, or explicitly remove/add it when appropriate.

4. **Respect Task Context**: When displaying tasks, use the `getContextHeaders` and `getTaskOutputRange` methods to provide proper context.

5. **Handle Errors Gracefully**: File operations can fail, so always use try/catch and provide useful error messages.

By understanding this task parsing and management system, you'll be able to effectively maintain and extend pew-pew-cli's core functionality.