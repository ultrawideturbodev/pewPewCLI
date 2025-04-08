/**
 * TaskService
 * 
 * Manages task file operations (reading, writing, parsing).
 * Handles finding tasks, marking them as complete, and maintaining statistics.
 */
import { ConfigService } from './config.service.js';
import { FileSystemService } from './file-system.service.js';
import * as path from 'path';

export class TaskService {
  // Static regex patterns for task identification
  private static readonly TASK_PATTERN: RegExp = /^(?:👉\s+)?\s*-\s*\[\s*[xX\s]*\s*\]/;
  private static readonly UNCHECKED_PATTERN: RegExp = /^(?:👉\s+)?\s*-\s*\[\s*\]/;
  private static readonly CHECKED_PATTERN: RegExp = /^(?:👉\s+)?\s*-\s*\[\s*[xX]\s*\]/;
  private static readonly HEADER_PATTERN: RegExp = /^(#{1,6})\s+(.+)$/;
  
  // Constants for [pew] prefix
  private static readonly PEW_PREFIX: string = "👉 ";
  private static readonly PEW_PREFIX_REGEX: RegExp = /^👉\s+/;

  private tasksFilePath: string;
  private configService: ConfigService;
  private fileSystemService: FileSystemService;

  constructor() {
    this.tasksFilePath = '';
    this.configService = ConfigService.getInstance();
    this.fileSystemService = new FileSystemService();
  }

  /**
   * Check if a line is a task (checked or unchecked)
   */
  public static isTask(line: string): boolean {
    return this.TASK_PATTERN.test(line);
  }

  /**
   * Check if a line is an unchecked task
   */
  public static isUncheckedTask(line: string): boolean {
    return this.UNCHECKED_PATTERN.test(line);
  }

  /**
   * Check if a line is a checked task
   */
  public static isCheckedTask(line: string): boolean {
    return this.CHECKED_PATTERN.test(line);
  }

  /**
   * Check if a line is a header
   */
  public static isHeader(line: string): boolean {
    return this.HEADER_PATTERN.test(line);
  }

  /**
   * Get the header level (1-6) for a line if it's a header, 0 otherwise
   */
  private static getLineHeaderLevel(line: string): number {
    if (!this.isHeader(line)) {
      return 0;
    }
    
    const match = this.HEADER_PATTERN.exec(line);
    if (match && match[1]) {
      return match[1].length; // Return the number of # characters
    }
    
    return 0;
  }

  /**
   * Check if a line is either a task or a header
   */
  private static isTaskOrHeader(line: string): boolean {
    return this.isTask(line) || this.isHeader(line);
  }

  /**
   * Check if a line has the [pew] prefix
   */
  public static lineHasPewPrefix(line: string): boolean {
    return this.PEW_PREFIX_REGEX.test(line);
  }

  /**
   * Get line content without the [pew] prefix if it exists
   */
  public static getLineWithoutPewPrefix(line: string): string {
    return line.replace(this.PEW_PREFIX_REGEX, '');
  }

  /**
   * Find task with [pew] prefix in the given lines
   * Returns the index of the first task with [pew] prefix, or -1 if none found
   */
  public static findTaskWithPewPrefix(lines: string[]): number {
    for (let i = 0; i < lines.length; i++) {
      if (this.lineHasPewPrefix(lines[i])) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Add [pew] prefix to a specific line
   * Returns a new array with the modified line
   */
  public static addPewPrefix(lines: string[], index: number): string[] {
    if (index < 0 || index >= lines.length) {
      return [...lines]; // Return copy of original if index is invalid
    }
    
    const newLines = [...lines]; // Create a copy of the array
    
    // Only add prefix if it doesn't already exist
    if (!this.lineHasPewPrefix(newLines[index])) {
      newLines[index] = this.PEW_PREFIX + newLines[index];
    }
    
    return newLines;
  }

  /**
   * Remove [pew] prefix from a specific line
   * Returns a new array with the modified line
   */
  public static removePewPrefix(lines: string[], index: number): string[] {
    if (index < 0 || index >= lines.length) {
      return [...lines]; // Return copy of original if index is invalid
    }
    
    const newLines = [...lines]; // Create a copy of the array
    
    // Only remove if prefix exists
    if (this.lineHasPewPrefix(newLines[index])) {
      newLines[index] = this.getLineWithoutPewPrefix(newLines[index]);
    }
    
    return newLines;
  }

  /**
   * Find the first unchecked task in the given lines
   */
  public static findFirstUncheckedTask(lines: string[]): number {
    for (let i = 0; i < lines.length; i++) {
      if (this.isUncheckedTask(lines[i])) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Find the next unchecked task after the given start index
   */
  public static findNextUncheckedTask(lines: string[], startIndex: number): number {
    for (let i = startIndex + 1; i < lines.length; i++) {
      if (this.isUncheckedTask(lines[i])) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Find the first task (checked or unchecked) in the given lines
   */
  public static findFirstTask(lines: string[]): number {
    for (let i = 0; i < lines.length; i++) {
      if (this.isTask(lines[i])) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Get primary tasks file path from configuration
   */
  async getPrimaryTasksFilePath(): Promise<string> {
    await this.configService.initialize();
    const tasksPaths = await this.configService.getTasksPaths(false);
    
    if (!tasksPaths || tasksPaths.length === 0) {
      return './.pew/tasks.md'; // Default path if none found
    }
    
    return tasksPaths[0]; // Return the first path as primary
  }

  /**
   * Write content to tasks file with specified mode
   */
  async writeTasksContent(content: string, mode: 'overwrite' | 'append' | 'insert'): Promise<void> {
    try {
      // Get the tasks file path from config
      const filePath = await this.getPrimaryTasksFilePath();
      
      // Process content - replace escaped newlines with actual newlines
      const processedContent = content.replace(/\\n/g, '\n');
      
      // Ensure directory exists
      const dirPath = path.dirname(filePath);
      await this.fileSystemService.ensureDirectoryExists(dirPath);
      
      // Check if file exists
      const fileExists = await this.fileSystemService.pathExists(filePath);
      
      // Handle overwrite mode
      if (mode === 'overwrite') {
        // In overwrite mode, simply write the processed content to the file
        await this.fileSystemService.writeFile(filePath, processedContent);
      }
      // Handle append and insert modes
      else if (mode === 'append' || mode === 'insert') {
        // Get existing content if file exists
        let existingContent = '';
        if (fileExists) {
          existingContent = await this.fileSystemService.readFile(filePath);
        }
        
        // Determine final content based on mode
        let finalContent = '';
        if (mode === 'append') {
          // For append mode, add content to the end
          finalContent = existingContent ? `${existingContent}\n${processedContent}` : processedContent;
        } else { // insert mode
          // For insert mode, add content to the beginning
          finalContent = existingContent ? `${processedContent}\n${existingContent}` : processedContent;
        }
        
        // Write the final content to the file
        await this.fileSystemService.writeFile(filePath, finalContent);
      }
    } catch (error) {
      console.error('Error writing tasks content:', error);
      throw error;
    }
  }

  /**
   * Read tasks from file
   */
  async readTasks(): Promise<string[]> {
    // Implementation stub
    return [];
  }

  /**
   * Write tasks to file
   */
  async writeTasks(tasks: string[]): Promise<void> {
    // Implementation stub
  }

  /**
   * Parse task lines to determine completion status
   */
  parseTasks(taskLines: string[]): { completed: number; total: number; tasks: Array<{ text: string; isComplete: boolean }> } {
    // Implementation stub
    return {
      completed: 0,
      total: 0,
      tasks: []
    };
  }

  /**
   * Find the next uncompleted task
   */
  findNextTask(tasks: Array<{ text: string; isComplete: boolean }>): { text: string; index: number } | null {
    // Implementation stub
    return null;
  }

  /**
   * Mark a task as complete
   */
  markTaskComplete(tasks: string[], index: number): string[] {
    // Implementation stub
    return tasks;
  }

  /**
   * Add content to tasks file
   */
  async addContentToTasksFile(content: string, mode: 'overwrite' | 'append' | 'insert'): Promise<void> {
    // Implementation stub
  }

  /**
   * Get task statistics
   */
  public static getTaskStats(tasks: Array<{ text: string; isComplete: boolean }>): { total: number; completed: number; remaining: number; percentComplete: number } {
    // Implementation stub
    return {
      total: 0,
      completed: 0,
      remaining: 0,
      percentComplete: 0
    };
  }

  /**
   * Get task statistics from lines
   * 
   * Takes an array of lines and returns statistics about the tasks in them
   * (total count, completed count, remaining count)
   */
  public static getTaskStatsFromLines(lines: string[]): { total: number, completed: number, remaining: number } {
    let completedTasks = 0;
    let remainingTasks = 0;
    
    for (const line of lines) {
      if (this.isTask(line)) {
        if (this.isCheckedTask(line)) {
          completedTasks++;
        } else {
          remainingTasks++;
        }
      }
    }
    
    const totalTasks = completedTasks + remainingTasks;
    
    return {
      total: totalTasks,
      completed: completedTasks,
      remaining: remainingTasks
    };
  }

  /**
   * Generate a formatted summary string from task statistics
   * 
   * Takes a task statistics object and returns a formatted string
   * showing total, completed (with percentage), and remaining tasks
   */
  public static getSummary(stats: { total: number, completed: number, remaining: number }): string {
    const { total, completed, remaining } = stats;
    const completionPercentage = total > 0 ? (completed / total * 100) : 0;
    
    return `Total: ${total} task(s) | Completed: ${completed} (${completionPercentage.toFixed(1)}%) | Remaining: ${remaining}`;
  }

  /**
   * Get context headers for a task
   * 
   * Takes an array of lines and a task index, searches backwards for up to two header lines,
   * and returns them formatted as a single string (e.g., "Header 1 - Header 2")
   */
  public static getContextHeaders(lines: string[], taskIndex: number): string {
    if (taskIndex < 0 || taskIndex >= lines.length) {
      return '';
    }

    const headers: string[] = [];
    
    // Search backwards from the task index
    for (let i = taskIndex - 1; i >= 0; i--) {
      if (this.isHeader(lines[i])) {
        // Extract the header text using HEADER_PATTERN
        const match = this.HEADER_PATTERN.exec(lines[i]);
        if (match && match[2]) {
          const headerText = match[2].trim();
          // Add header to the beginning of the array to maintain correct order
          headers.unshift(headerText);
          
          // Stop if we've found 2 headers
          if (headers.length === 2) {
            break;
          }
        }
      }
    }
    
    // Join headers with " - " and return
    return headers.join(' - ');
  }

  /**
   * Determine the output range for displaying a task
   * 
   * Takes an array of lines and a task index, determines the start and end line indices
   * for displaying the task (including context, sub-tasks, descriptions).
   * Returns an object with startIndex and endIndex.
   */
  public static getTaskOutputRange(lines: string[], taskIndex: number): { startIndex: number, endIndex: number } {
    // Handle invalid task index
    if (taskIndex < 0 || taskIndex >= lines.length) {
      return { startIndex: 0, endIndex: 0 };
    }

    // Find the governing header level for the task
    let governingLevel = 0;
    for (let i = taskIndex - 1; i >= 0; i--) {
      const headerLevel = this.getLineHeaderLevel(lines[i]);
      if (headerLevel > 0) {
        governingLevel = headerLevel;
        break;
      }
    }

    // Find startIndex by scanning backwards for a header
    let startIndex = 0;
    for (let i = taskIndex - 1; i >= 0; i--) {
      if (this.isHeader(lines[i])) {
        startIndex = i;
        break;
      }
    }

    // Find endIndex by scanning forwards for a task or a header with level <= governingLevel
    let endIndex = lines.length;
    for (let i = taskIndex + 1; i < lines.length; i++) {
      if (this.isTask(lines[i]) || 
          (this.isHeader(lines[i]) && this.getLineHeaderLevel(lines[i]) <= governingLevel)) {
        endIndex = i;
        break;
      }
    }

    return { startIndex, endIndex };
  }

  /**
   * Mark a task as complete
   * 
   * Takes a task line string, finds the unchecked task marker (- [ ]),
   * and replaces it with the checked marker (- [x]), preserving indentation,
   * surrounding text, and the [pew] prefix if present.
   */
  public static markTaskComplete(line: string): string {
    if (!this.isUncheckedTask(line)) {
      return line;
    }
    
    // Check if line has [pew] prefix
    const hasPewPrefix = this.lineHasPewPrefix(line);
    
    // Get line without prefix if it exists
    const lineWithoutPrefix = hasPewPrefix ? this.getLineWithoutPewPrefix(line) : line;
    
    // Replace the unchecked marker with checked marker
    const modifiedLineWithoutPrefix = lineWithoutPrefix.replace(/-\s*\[\s*\]/, (match) => match.replace('[ ]', '[x]'));
    
    // Return line with prefix if it had one
    return hasPewPrefix ? this.PEW_PREFIX + modifiedLineWithoutPrefix : modifiedLineWithoutPrefix;
  }

  /**
   * Write an array of lines to the task file
   * 
   * Takes an array of strings (lines) and writes them to the primary tasks file,
   * overwriting the existing content.
   */
  async writeTaskLines(lines: string[]): Promise<void> {
    try {
      // Get the tasks file path
      const filePath = await this.getPrimaryTasksFilePath();
      
      // Join the lines with newlines
      const content = lines.join('\n');
      
      // Ensure directory exists
      const dirPath = path.dirname(filePath);
      await this.fileSystemService.ensureDirectoryExists(dirPath);
      
      // Write the content to the file
      await this.fileSystemService.writeFile(filePath, content);
    } catch (error) {
      console.error('Error writing task lines:', error);
      throw error;
    }
  }
  
  /**
   * Read task lines from the primary tasks file
   * 
   * Reads the primary task file and returns its content as an array of lines.
   */
  async readTaskLines(): Promise<string[]> {
    try {
      // Get the tasks file path
      const filePath = await this.getPrimaryTasksFilePath();
      
      // Check if file exists
      const fileExists = await this.fileSystemService.pathExists(filePath);
      if (!fileExists) {
        throw new Error(`Task file not found: ${filePath}`);
      }
      
      // Read the file content
      const content = await this.fileSystemService.readFile(filePath);
      
      // Split into lines
      return content.split('\n');
    } catch (error) {
      console.error('Error reading task lines:', error);
      throw error;
    }
  }
} 