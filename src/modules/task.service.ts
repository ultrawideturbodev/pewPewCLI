/**
 * TaskService
 * 
 * Manages task file operations (reading, writing, parsing).
 * Handles finding tasks, marking them as complete, and maintaining statistics.
 */
import { ConfigService } from './config.service.js';
import { FileSystemService } from './file-system.service.js';
import * as path from 'path';

/**
 * @class TaskService
 * @description Provides services for interacting with Markdown-based task files.
 * Includes parsing lines, manipulating task status ([ ], [x], 👉), calculating statistics,
 * reading/writing task files, and managing task context (headers, display ranges).
 */
export class TaskService {
  // Static regex patterns for task identification
  private static readonly TASK_PATTERN: RegExp = /^(?:👉\s+)?\s*-\s*\[\s*[xX\s]*\s*\]/;
  private static readonly UNCHECKED_PATTERN: RegExp = /^(?:👉\s+)?\s*-\s*\[\s*\]/;
  private static readonly CHECKED_PATTERN: RegExp = /^(?:👉\s+)?\s*-\s*\[\s*[xX]\s*\]/;
  private static readonly HEADER_PATTERN: RegExp = /^(#{1,6})\s+(.+)$/;
  
  // Constants for [pew] prefix
  private static readonly PEW_PREFIX: string = "👉 ";
  private static readonly PEW_PREFIX_REGEX: RegExp = /^👉\s+/;

  private configService: ConfigService;
  private fileSystemService: FileSystemService;

  /**
   * Constructor for TaskService.
   * @param {ConfigService} configService - Instance of ConfigService.
   * @param {FileSystemService} fileSystemService - Instance of FileSystemService.
   */
  constructor(configService: ConfigService, fileSystemService: FileSystemService) {
    this.configService = configService;
    this.fileSystemService = fileSystemService;
  }

  /**
   * Checks if a line represents a Markdown task item (checked or unchecked).
   * Accounts for optional `👉` prefix.
   * @param {string} line - The line to check.
   * @returns {boolean} True if the line matches the task pattern, false otherwise.
   */
  public static isTask(line: string): boolean {
    return this.TASK_PATTERN.test(line);
  }

  /**
   * Checks if a line represents an unchecked Markdown task item (`- [ ]`).
   * Accounts for optional `👉` prefix.
   * @param {string} line - The line to check.
   * @returns {boolean} True if the line matches the unchecked task pattern, false otherwise.
   */
  public static isUncheckedTask(line: string): boolean {
    return this.UNCHECKED_PATTERN.test(line);
  }

  /**
   * Checks if a line represents a checked Markdown task item (`- [x]` or `- [X]`).
   * Accounts for optional `👉` prefix.
   * @param {string} line - The line to check.
   * @returns {boolean} True if the line matches the checked task pattern, false otherwise.
   */
  public static isCheckedTask(line: string): boolean {
    return this.CHECKED_PATTERN.test(line);
  }

  /**
   * Checks if a line represents a Markdown header (`#` to `######`).
   * @param {string} line - The line to check.
   * @returns {boolean} True if the line matches the header pattern, false otherwise.
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
      return match[1].length;
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
   * Checks if a line contains the `👉 ` prefix used to indicate the current task.
   * @param {string} line - The line to check.
   * @returns {boolean} True if the line starts with the prefix, false otherwise.
   */
  public static lineHasPewPrefix(line: string): boolean {
    return this.PEW_PREFIX_REGEX.test(line);
  }

  /**
   * Removes the `👉 ` prefix from a line if it exists.
   * @param {string} line - The line to process.
   * @returns {string} The line without the prefix.
   */
  public static getLineWithoutPewPrefix(line: string): string {
    return line.replace(this.PEW_PREFIX_REGEX, '');
  }

  /**
   * Finds the index of the first task line containing the `👉 ` prefix.
   * @param {string[]} lines - An array of lines to search.
   * @returns {number} The 0-based index of the line with the prefix, or -1 if not found.
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
   * Adds the `👉 ` prefix to the line at the specified index, if it doesn't already have it.
   * @param {string[]} lines - The array of lines.
   * @param {number} index - The index of the line to modify.
   * @returns {string[]} A new array with the modified line.
   */
  public static addPewPrefix(lines: string[], index: number): string[] {
    if (index < 0 || index >= lines.length) {
      return [...lines];
    }
    
    const newLines = [...lines];
    
    if (!this.lineHasPewPrefix(newLines[index])) {
      newLines[index] = this.PEW_PREFIX + newLines[index];
    }
    
    return newLines;
  }

  /**
   * Removes the `👉 ` prefix from the line at the specified index, if it exists.
   * @param {string[]} lines - The array of lines.
   * @param {number} index - The index of the line to modify.
   * @returns {string[]} A new array with the modified line.
   */
  public static removePewPrefix(lines: string[], index: number): string[] {
    if (index < 0 || index >= lines.length) {
      return [...lines];
    }
    
    const newLines = [...lines];
    
    if (this.lineHasPewPrefix(newLines[index])) {
      newLines[index] = this.getLineWithoutPewPrefix(newLines[index]);
    }
    
    return newLines;
  }

  /**
   * Finds the index of the first unchecked task (`- [ ]`) in an array of lines.
   * @param {string[]} lines - The array of lines to search.
   * @returns {number} The 0-based index of the first unchecked task, or -1 if none found.
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
   * Finds the index of the next unchecked task (`- [ ]`) after a given starting index.
   * @param {string[]} lines - The array of lines to search.
   * @param {number} startIndex - The index to start searching after.
   * @returns {number} The 0-based index of the next unchecked task, or -1 if none found.
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
   * Finds the index of the first task (checked or unchecked) in an array of lines.
   * @param {string[]} lines - The array of lines to search.
   * @returns {number} The 0-based index of the first task, or -1 if none found.
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
   * Writes content to a task file, supporting different modes.
   * Ensures the target directory exists before writing.
   * Processes content by replacing escaped newlines (`\n`) with actual newlines.
   *
   * @param {string} filePath - The absolute path to the target task file.
   * @param {string} content - The content to write.
   * @param {('overwrite' | 'append' | 'insert')} mode - The writing mode:
   *   - `overwrite`: Replaces the entire file content.
   *   - `append`: Adds the content to the end of the file.
   *   - `insert`: Adds the content to the beginning of the file.
   * @returns {Promise<void>} A promise that resolves when writing is complete.
   * @throws {Error} If writing to the file fails.
   */
  async writeTasksContent(filePath: string, content: string, mode: 'overwrite' | 'append' | 'insert'): Promise<void> {
    try {
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
        } else {
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
   * Calculates statistics (total, completed, remaining) based on task lines.
   * Iterates through lines, identifying tasks and their completion status.
   * @param {string[]} lines - An array of lines from a task file.
   * @returns {{ total: number, completed: number, remaining: number }} An object containing the task counts.
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
   * Generates a formatted summary string from task statistics.
   * Example: "Total: 10 task(s) | Completed: 5 (50.0%) | Remaining: 5"
   * @param {{ total: number, completed: number, remaining: number }} stats - The statistics object.
   * @returns {string} A formatted summary string.
   */
  public static getSummary(stats: { total: number, completed: number, remaining: number }): string {
    const { total, completed, remaining } = stats;
    const completionPercentage = total > 0 ? (completed / total * 100) : 0;
    
    return `Total: ${total} task(s) | Completed: ${completed} (${completionPercentage.toFixed(1)}%) | Remaining: ${remaining}`;
  }

  /**
   * Finds the nearest preceding Markdown headers (up to two levels) for context.
   * Searches backwards from the task index.
   * @param {string[]} lines - The array of lines from the task file.
   * @param {number} taskIndex - The 0-based index of the task line.
   * @returns {string} A formatted string of the context headers (e.g., "Header 1 - Subheader A"), or an empty string if no headers found.
   */
  public static getContextHeaders(lines: string[], taskIndex: number): string {
    if (taskIndex < 0 || taskIndex >= lines.length) {
      return '';
    }

    const headers: string[] = [];
    
    for (let i = taskIndex - 1; i >= 0; i--) {
      if (this.isHeader(lines[i])) {
        const match = this.HEADER_PATTERN.exec(lines[i]);
        if (match && match[2]) {
          const headerText = match[2].trim();
          headers.unshift(headerText);
          
          if (headers.length === 2) {
            break;
          }
        }
      }
    }
    
    return headers.join(' - ');
  }

  /**
   * Determines the line range to display for a specific task, including its context.
   * Finds the nearest preceding header and the next task or header of the same/higher level.
   * @param {string[]} lines - The array of lines from the task file.
   * @param {number} taskIndex - The 0-based index of the task line.
   * @returns {{ startIndex: number, endIndex: number }} An object containing the 0-based start and end indices (exclusive) for the display range.
   */
  public static getTaskOutputRange(lines: string[], taskIndex: number): { startIndex: number, endIndex: number } {
    if (taskIndex < 0 || taskIndex >= lines.length) {
      return { startIndex: 0, endIndex: 0 };
    }

    let governingLevel = 0;
    for (let i = taskIndex - 1; i >= 0; i--) {
      const headerLevel = this.getLineHeaderLevel(lines[i]);
      if (headerLevel > 0) {
        governingLevel = headerLevel;
        break;
      }
    }

    let startIndex = 0;
    for (let i = taskIndex - 1; i >= 0; i--) {
      if (this.isHeader(lines[i])) {
        startIndex = i;
        break;
      }
    }

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
   * Marks an unchecked task line as complete by changing `[ ]` to `[x]`.
   * Preserves indentation and the optional `👉` prefix.
   * Does nothing if the line is not an unchecked task.
   * @param {string} line - The task line to modify.
   * @returns {string} The modified line with the task marked as complete, or the original line if no change was needed.
   */
  public static markTaskComplete(line: string): string {
    if (!this.isUncheckedTask(line)) {
      return line;
    }
    
    const hasPewPrefix = this.lineHasPewPrefix(line);
    
    const lineWithoutPrefix = hasPewPrefix ? this.getLineWithoutPewPrefix(line) : line;
    
    const modifiedLineWithoutPrefix = lineWithoutPrefix.replace(/-\s*\[\s*\]/, (match) => match.replace('[ ]', '[x]'));
    
    return hasPewPrefix ? this.PEW_PREFIX + modifiedLineWithoutPrefix : modifiedLineWithoutPrefix;
  }

  /**
   * Writes an array of lines to a specified file path, overwriting existing content.
   * Ensures the directory exists before writing.
   * Joins lines with newline characters.
   * @param {string} filePath - The absolute path to the target file.
   * @param {string[]} lines - An array of strings representing the lines to write.
   * @returns {Promise<void>} A promise that resolves when the file has been written.
   * @throws {Error} If writing to the file fails.
   */
  async writeTaskLines(filePath: string, lines: string[]): Promise<void> {
    try {
      const content = lines.join('\n');
      
      const dirPath = path.dirname(filePath);
      await this.fileSystemService.ensureDirectoryExists(dirPath);
      
      await this.fileSystemService.writeFile(filePath, content);
    } catch (error) {
      console.error('Error writing task lines:', error);
      throw error;
    }
  }
  
  /**
   * Unchecks all completed tasks (`- [x]` or `- [X]`) within an array of lines.
   * Preserves indentation and prefixes.
   * @param {string[]} lines - The array of lines to process.
   * @returns {{ modifiedLines: string[]; resetCount: number }} An object containing the modified array of lines and the number of tasks that were reset.
   */
  public static uncheckTasksInLines(lines: string[]): { modifiedLines: string[]; resetCount: number } {
    let resetCount = 0;
    // Regex to capture: 
    // 1: Leading whitespace and '- [' 
    // 2: The closing ']' and the rest of the line (after the [x])
    const checkedPattern = /^(\s*-\s*\[)[xX](\].*)$/i;
    
    const modifiedLines = lines.map(line => {
      const replacedLine = line.replace(checkedPattern, `$1 $2`); // Reconstruct with group 1 (prefix) and group 2 (suffix)
      if (replacedLine !== line) { // Check if a replacement actually occurred
        resetCount++;
      }
      return replacedLine;
    });

    return { modifiedLines, resetCount };
  }

  /**
   * Reads the content of a file and returns it as an array of lines.
   * Throws an error if the file doesn't exist or cannot be read.
   * @param {string} filePath - The absolute path to the file.
   * @returns {Promise<string[]>} A promise that resolves with an array of strings, each representing a line.
   * @throws {Error} If the file is not found or reading fails.
   */
  async readTaskLines(filePath: string): Promise<string[]> {
    try {
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

  /**
   * Resets all completed tasks (`- [x]`) in a specified file back to incomplete (`- [ ]`).
   * Reads the file, processes lines using `uncheckTasksInLines`, and writes back if changes were made.
   * @param {string} filePath - The absolute path to the task file.
   * @returns {Promise<number>} A promise that resolves with the number of tasks that were reset in the file.
   * @throws {Error} If reading or writing the file fails.
   */
  public async resetTaskFile(filePath: string): Promise<number> {
    // Read the original lines from the file
    const originalLines = await this.readTaskLines(filePath);

    // Get the modified lines and the count of tasks reset
    const { modifiedLines, resetCount } = TaskService.uncheckTasksInLines(originalLines);

    // Write the modified lines back to the file only if changes were made
    // Although writing the same content is often harmless, this avoids unnecessary I/O
    if (resetCount > 0) {
      await this.writeTaskLines(filePath, modifiedLines);
    }

    // Return the count of reset tasks
    return resetCount;
  }
} 