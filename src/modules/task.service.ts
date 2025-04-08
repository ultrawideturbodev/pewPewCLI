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
  private tasksFilePath: string;
  private configService: ConfigService;
  private fileSystemService: FileSystemService;

  constructor() {
    this.tasksFilePath = '';
    this.configService = ConfigService.getInstance();
    this.fileSystemService = new FileSystemService();
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
  getTaskStats(tasks: Array<{ text: string; isComplete: boolean }>): { total: number; completed: number; remaining: number; percentComplete: number } {
    // Implementation stub
    return {
      total: 0,
      completed: 0,
      remaining: 0,
      percentComplete: 0
    };
  }
} 