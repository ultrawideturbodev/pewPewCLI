/**
 * CliService
 * 
 * Orchestrates command execution.
 * Handles parsing commands and dispatching to appropriate services.
 */
import { FileSystemService } from './file-system.service.js';
import { ConfigService } from './config.service.js';
import { UserInputService } from './user-input.service.js';
import { ClipboardService } from './clipboard.service.js';
import { TaskService } from './task.service.js';
import * as path from 'path';

export class CliService {
  private command: string;
  private subCommand: string | null;
  private args: string[];
  private flags: Record<string, any>;
  private fileSystemService: FileSystemService;
  private configService: ConfigService;
  private userInputService: UserInputService;
  private clipboardService: ClipboardService;
  private taskService: TaskService;
  
  // Singleton instance
  private static instance: CliService | null = null;
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.command = '';
    this.subCommand = null;
    this.args = [];
    this.flags = {};
    this.fileSystemService = new FileSystemService();
    this.configService = ConfigService.getInstance();
    this.userInputService = new UserInputService();
    this.clipboardService = new ClipboardService();
    this.taskService = new TaskService();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): CliService {
    if (!CliService.instance) {
      CliService.instance = new CliService();
    }
    return CliService.instance;
  }

  /**
   * Parse command string
   */
  parseCommand(input: string): void {
    // Implementation stub
  }

  /**
   * Dispatch command to appropriate service
   */
  async dispatchCommand(): Promise<void> {
    // Implementation stub
  }

  /**
   * Handle init command logic
   */
  async handleInit(flags: { force: boolean } = { force: false }): Promise<void> {
    // Get local config directory
    await this.configService.initialize();
    const localPewDir = this.configService.getLocalConfigDir();
    
    // Check if .pew exists and if we need confirmation to overwrite
    if (localPewDir && !flags.force) {
      const confirmation = await this.userInputService.askForConfirmation(
        'Overwrite existing .pew configuration?',
        false
      );
      
      if (!confirmation) {
        console.log('Initialization aborted.');
        return;
      }
    }
    
    // Ensure .pew/config directory exists
    const localPewPath = './.pew';
    const configPath = `${localPewPath}/config`;
    await this.fileSystemService.ensureDirectoryExists(configPath);
    
    // Determine task path (default or from user input)
    let taskPath = '.pew/tasks.md'; // Default
    
    if (!flags.force) {
      taskPath = await this.userInputService.askForPath(
        'Enter primary tasks file path:',
        taskPath
      );
    }
    
    // Save config
    await this.configService.setTasksPaths([taskPath], false, taskPath);
    
    // Create empty tasks file if it doesn't exist
    const taskFilePath = taskPath;
    const taskFileExists = await this.fileSystemService.pathExists(taskFilePath);
    
    if (!taskFileExists) {
      await this.fileSystemService.writeFile(taskFilePath, '');
    }
    
    console.log('pewPewCLI initialized successfully.');
  }

  /**
   * Handle set path command logic
   */
  async handleSetPath(field?: string, value?: string, flags: { global: boolean } = { global: false }): Promise<void> {
    // Get field if not provided
    let finalField = field;
    if (!finalField) {
      finalField = await this.userInputService.askForText('Enter field to set (e.g., tasks):');
    }
    
    // Validate field is 'tasks' (only supported field for now)
    if (finalField !== 'tasks') {
      console.error(`Invalid field '${finalField}' for set path. Only 'tasks' is supported.`);
      return;
    }
    
    // Get value if not provided
    let finalValue = value;
    if (!finalValue) {
      finalValue = await this.userInputService.askForPath(`Enter value for ${finalField}:`);
    }
    
    // Save to config
    await this.configService.initialize();
    await this.configService.setTasksPaths([finalValue], flags.global);
    
    console.log(`Set ${finalField} to ${finalValue} successfully in ${flags.global ? 'global' : 'local'} config.`);
  }

  /**
   * Handle paste tasks command logic
   */
  async handlePasteTasks(
    mode: 'overwrite' | 'append' | 'insert' | null = null,
    options: { path?: string } = {} // Update signature to accept options
  ): Promise<void> {
    try {
      // Read from clipboard
      const clipboardContent = await this.clipboardService.readFromClipboard();

      // Check if clipboard is empty
      if (!clipboardContent.trim()) {
        console.log('Clipboard is empty. Nothing to paste.');
        return;
      }

      // Determine the target paste path
      await this.configService.initialize();
      const overridePath = options.path;
      const configuredPastePath = await this.configService.getPasteTasksPath();
      let finalPastePath: string;

      if (overridePath) {
        const overrideExists = await this.fileSystemService.pathExists(overridePath);
        if (overrideExists) {
          finalPastePath = overridePath;
        } else {
          const useDefault = await this.userInputService.askForConfirmation(
            `Path '${overridePath}' does not exist. Paste into default '${configuredPastePath}' instead?`,
            false
          );
          if (useDefault) {
            finalPastePath = configuredPastePath;
          } else {
            console.log('Paste operation aborted.');
            return;
          }
        }
      } else {
        finalPastePath = configuredPastePath;
      }

      // Use provided mode or ask user for paste mode
      let finalMode = mode;
      if (finalMode === null) {
        finalMode = await this.userInputService.askForSelection<'overwrite' | 'append' | 'insert'>(
          'Choose paste mode:',
          ['overwrite', 'append', 'insert']
        );
      }

      // Write content to the determined tasks file
      await this.taskService.writeTasksContent(finalPastePath, clipboardContent, finalMode);

      // Success message (reflecting the final path)
      const relativeFinalPath = path.relative(process.cwd(), finalPastePath);
      console.log(`Pasted content to ${relativeFinalPath} (${finalMode}).`);
    } catch (error) {
      console.error('Error during paste tasks operation:', error);
    }
  }

  /**
   * Handle next task command logic
   */
  async handleNextTask(): Promise<void> {
    try {
      // Get all task file paths
      const filePaths = await this.configService.getAllTasksPaths();
      
      // Initialize variables to track first unchecked task and task with pew prefix
      let firstUncheckedFilePath: string | null = null;
      let firstUncheckedIndex: number = -1;
      let firstUncheckedLines: string[] | null = null;
      let pewFilePath: string | null = null;
      let pewIndex: number = -1;
      let pewLines: string[] | null = null;
      let allLinesRead: Map<string, string[]> = new Map();
      let totalTasksAcrossFiles = 0;
      let completedTasksAcrossFiles = 0;
      
      // Iterate through files to find unchecked tasks and pew prefix
      for (const filePath of filePaths) {
        try {
          // Read current file
          const currentLines = await this.taskService.readTaskLines(filePath);
          allLinesRead.set(filePath, currentLines);
          
          // Calculate stats for this file
          const fileStats = TaskService.getTaskStatsFromLines(currentLines);
          totalTasksAcrossFiles += fileStats.total;
          completedTasksAcrossFiles += fileStats.completed;
          
          // If we haven't found an unchecked task yet, check this file
          if (firstUncheckedFilePath === null) {
            const taskIndex = TaskService.findFirstUncheckedTask(currentLines);
            if (taskIndex !== -1) {
              firstUncheckedFilePath = filePath;
              firstUncheckedIndex = taskIndex;
              firstUncheckedLines = currentLines;
            }
          }
          
          // Check for pew prefix in this file
          const currentPewIndex = TaskService.findTaskWithPewPrefix(currentLines);
          if (currentPewIndex !== -1) {
            pewFilePath = filePath;
            pewIndex = currentPewIndex;
            pewLines = currentLines;
          }
        } catch (error) {
          console.error(`Error reading task file ${filePath}:`, error);
          continue; // Continue to next file on error
        }
      }
      
      // Determine display file and lines based on the overall state
      let displayFilePath: string | null = null;
      let displayIndex: number = -1;
      let displayLines: string[] | null = null;
      
      // [Scenario: Empty/No Tasks]
      if (totalTasksAcrossFiles === 0) {
        console.log("\n✅ No tasks found.");
        console.log(`\n${TaskService.getSummary({ total: 0, completed: 0, remaining: 0 })}`);
        return;
      }
      
      // [Scenario: All Tasks Complete]
      if (firstUncheckedIndex === -1) {
        // If there's a [pew] prefix, we should remove it
        if (pewIndex !== -1 && pewFilePath !== null && pewLines !== null) {
          const modifiedLines = TaskService.removePewPrefix(pewLines, pewIndex);
          await this.taskService.writeTaskLines(pewFilePath, modifiedLines);
          displayFilePath = pewFilePath;
          displayLines = modifiedLines;
        } else {
          // Use the last file if no pew prefix found
          const lastFilePath = filePaths[filePaths.length - 1];
          displayFilePath = lastFilePath;
          displayLines = allLinesRead.get(lastFilePath) || [];
        }
        
        console.log("\n✅ All tasks complete.");
        const fileStats = TaskService.getTaskStatsFromLines(displayLines);
        console.log(`\n${TaskService.getSummary(fileStats)}`);
        if (displayFilePath) {
          const relativePath = path.relative(process.cwd(), displayFilePath);
          console.log(`(File: ${relativePath})`);
        }
        return;
      }
      
      // [Scenario: [pew] on Wrong Task]
      if (pewIndex !== -1 && pewFilePath !== null && pewLines !== null && 
          (pewFilePath !== firstUncheckedFilePath || pewIndex !== firstUncheckedIndex)) {
        // Remove prefix from where it shouldn't be
        const linesWithoutOldPrefix = TaskService.removePewPrefix(pewLines, pewIndex);
        await this.taskService.writeTaskLines(pewFilePath, linesWithoutOldPrefix);
        allLinesRead.set(pewFilePath, linesWithoutOldPrefix);
        
        // Add prefix to the correct first unchecked task
        if (firstUncheckedFilePath !== null && firstUncheckedLines !== null) {
          const linesWithNewPrefix = TaskService.addPewPrefix(firstUncheckedLines, firstUncheckedIndex);
          await this.taskService.writeTaskLines(firstUncheckedFilePath, linesWithNewPrefix);
          displayFilePath = firstUncheckedFilePath;
          displayIndex = firstUncheckedIndex;
          displayLines = linesWithNewPrefix;
        }
      }
      // [Scenario: Needs [pew] Prefix]
      else if (pewIndex === -1 && firstUncheckedFilePath !== null && firstUncheckedLines !== null) {
        const modifiedLines = TaskService.addPewPrefix(firstUncheckedLines, firstUncheckedIndex);
        await this.taskService.writeTaskLines(firstUncheckedFilePath, modifiedLines);
        displayFilePath = firstUncheckedFilePath;
        displayIndex = firstUncheckedIndex;
        displayLines = modifiedLines;
      }
      // [Scenario: Complete Task with [pew]]
      else if (pewIndex !== -1 && pewFilePath !== null && pewLines !== null && 
              pewFilePath === firstUncheckedFilePath && pewIndex === firstUncheckedIndex) {
        // Remove pew prefix
        let linesNoPrefix = TaskService.removePewPrefix(pewLines, pewIndex);
        
        // Mark task as complete
        const completedLine = TaskService.markTaskComplete(linesNoPrefix[pewIndex]);
        linesNoPrefix[pewIndex] = completedLine;
        
        // Write changes back to file
        await this.taskService.writeTaskLines(pewFilePath, linesNoPrefix);
        allLinesRead.set(pewFilePath, linesNoPrefix);
        
        // Confirmation message
        console.log("\n✅ Task marked as complete");
        
        // Find next unchecked task
        let nextFilePath: string | null = null;
        let nextIndex: number = -1;
        let nextLines: string[] | null = null;
        let allNowComplete = false;
        
        // First check in the same file after the completed task
        const sameFileNextIndex = TaskService.findNextUncheckedTask(linesNoPrefix, pewIndex);
        if (sameFileNextIndex !== -1) {
          nextFilePath = pewFilePath;
          nextIndex = sameFileNextIndex;
          nextLines = linesNoPrefix;
        } else {
          // Search in subsequent files
          const currentFileIndex = filePaths.indexOf(pewFilePath);
          
          // Check files after the current one
          for (let i = currentFileIndex + 1; i < filePaths.length; i++) {
            const lines = allLinesRead.get(filePaths[i]);
            if (!lines) continue;
            
            const taskIndex = TaskService.findFirstUncheckedTask(lines);
            if (taskIndex !== -1) {
              nextFilePath = filePaths[i];
              nextIndex = taskIndex;
              nextLines = lines;
              break;
            }
          }
          
          // If not found, wrap around to the beginning
          if (nextFilePath === null) {
            for (let i = 0; i < currentFileIndex; i++) {
              const lines = allLinesRead.get(filePaths[i]);
              if (!lines) continue;
              
              const taskIndex = TaskService.findFirstUncheckedTask(lines);
              if (taskIndex !== -1) {
                nextFilePath = filePaths[i];
                nextIndex = taskIndex;
                nextLines = lines;
                break;
              }
            }
          }
        }
        
        // If we found a next task, add prefix and display it
        if (nextFilePath !== null && nextIndex !== -1 && nextLines !== null) {
          const nextLinesWithPrefix = TaskService.addPewPrefix(nextLines, nextIndex);
          await this.taskService.writeTaskLines(nextFilePath, nextLinesWithPrefix);
          displayFilePath = nextFilePath;
          displayIndex = nextIndex;
          displayLines = nextLinesWithPrefix;
        } else {
          // No more tasks
          allNowComplete = true;
          displayFilePath = pewFilePath;
          displayLines = linesNoPrefix;
          
          console.log("\n✅ All tasks complete.");
          const fileStats = TaskService.getTaskStatsFromLines(displayLines);
          console.log(`\n${TaskService.getSummary(fileStats)}`);
          if (displayFilePath) {
            const relativePath = path.relative(process.cwd(), displayFilePath);
            console.log(`(File: ${relativePath})`);
          }
          return;
        }
      }
      
      // Display the task if we have a valid path, index, and lines
      if (displayFilePath !== null && displayIndex !== -1 && displayLines !== null) {
        // Get context for display
        const contextHeaders = TaskService.getContextHeaders(displayLines, displayIndex);
        const range = TaskService.getTaskOutputRange(displayLines, displayIndex);
        
        // Format header
        const taskHeader = "⭕ Current Task";
        const fullHeader = contextHeaders ? `${taskHeader} (${contextHeaders})` : taskHeader;
        
        // Display task and context
        console.log(`\n${fullHeader}`);
        console.log("═".repeat(fullHeader.length) + "\n");
        
        // Extract and print lines
        let linesToPrint = displayLines.slice(range.startIndex, range.endIndex);
        // Trim trailing empty lines
        while (linesToPrint.length > 0 && linesToPrint[linesToPrint.length - 1].trim() === '') {
          linesToPrint.pop();
        }
        linesToPrint.forEach(line => console.log(line));
        
        // Calculate file-specific stats
        const fileStats = TaskService.getTaskStatsFromLines(displayLines);
        
        // Print summary and file path
        console.log(`\n${TaskService.getSummary(fileStats)}`);
        const relativePath = path.relative(process.cwd(), displayFilePath);
        console.log(`(File: ${relativePath})`);
      }
    } catch (error) {
      console.error('Error processing next task:', error);
    }
  }
} 