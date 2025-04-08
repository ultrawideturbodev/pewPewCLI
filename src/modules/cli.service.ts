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
    await this.configService.setTasksPaths([taskPath], false); // Always local
    
    // Create empty tasks file if it doesn't exist
    const taskFilePath = taskPath;
    const taskFileExists = await this.fileSystemService.pathExists(taskFilePath);
    
    if (!taskFileExists) {
      await this.fileSystemService.writeFile(taskFilePath, '');
    }
    
    console.log('PewPew CLI initialized successfully.');
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
  async handlePasteTasks(mode: 'overwrite' | 'append' | 'insert' | null = null): Promise<void> {
    try {
      // Read from clipboard
      const clipboardContent = await this.clipboardService.readFromClipboard();
      
      // Check if clipboard is empty
      if (!clipboardContent.trim()) {
        console.log('Clipboard is empty. Nothing to paste.');
        return;
      }
      
      // Use provided mode or ask user for paste mode
      let finalMode = mode;
      if (finalMode === null) {
        finalMode = await this.userInputService.askForSelection<'overwrite' | 'append' | 'insert'>(
          'Choose paste mode:',
          ['overwrite', 'append', 'insert']
        );
      }
      
      // Write content to tasks file
      await this.taskService.writeTasksContent(clipboardContent, finalMode);
      
      // Success message
      console.log(`Pasted content to tasks file (${finalMode}).`);
    } catch (error) {
      console.error('Error during paste tasks operation:', error);
    }
  }

  /**
   * Handle next task command logic
   */
  async handleNextTask(): Promise<void> {
    try {
      // Get the primary tasks file path
      const filePath = await this.taskService.getPrimaryTasksFilePath();
      
      // Check if file exists
      const fileExists = await this.fileSystemService.pathExists(filePath);
      if (!fileExists) {
        console.error(`Task file not found: ${filePath}`);
        return;
      }
      
      // Read the task file content
      let lines = await this.taskService.readTaskLines();
      
      // Calculate initial statistics BEFORE any modifications
      const statsBefore = TaskService.getTaskStatsFromLines(lines);
      
      // Find the first unchecked task
      const currentTaskIndex = TaskService.findFirstUncheckedTask(lines);
      
      // If there is an unchecked task, mark it complete
      if (currentTaskIndex !== -1) {
        // Get the original line
        const originalLine = lines[currentTaskIndex];
        
        // Mark it as complete
        const modifiedLine = TaskService.markTaskComplete(originalLine);
        
        // Update the array
        lines[currentTaskIndex] = modifiedLine;
        
        // Write the updated lines back to the file
        await this.taskService.writeTaskLines(lines);
        
        // Confirmation message
        console.log("\n✅ Task marked as complete");
        
        // Find the next unchecked task in the UPDATED in-memory lines
        const nextUncheckedIndex = TaskService.findFirstUncheckedTask(lines);
        
        // If there is a next task, display it
        if (nextUncheckedIndex !== -1) {
          // Calculate statsAfter based on statsBefore (one task was completed)
          const statsAfter = {
            total: statsBefore.total,
            completed: statsBefore.completed + 1,
            remaining: statsBefore.remaining - 1,
          };
          
          // Get summary using the newly calculated stats
          const summary = TaskService.getSummary(statsAfter);
          
          // Get context headers
          const contextHeaders = TaskService.getContextHeaders(lines, nextUncheckedIndex);
          
          // Get task output range
          const range = TaskService.getTaskOutputRange(lines, nextUncheckedIndex);
          
          // Determine if this is the first task
          const firstTaskIndex = TaskService.findFirstTask(lines);
          const isFirstDisplayedTask = (firstTaskIndex === nextUncheckedIndex);
          
          // Format header string
          const taskHeader = isFirstDisplayedTask ? "📋 First Task" : "⭕ Current Task";
          
          // Add context to header
          const fullHeader = contextHeaders ? `${taskHeader} (${contextHeaders})` : taskHeader;
          
          // Print header
          console.log(`\n${fullHeader}`);
          
          // Print separator
          console.log("═".repeat(fullHeader.length) + "\n");
          
          // Extract lines to print
          let linesToPrint = lines.slice(range.startIndex, range.endIndex);
          
          // Trim trailing empty lines
          while (linesToPrint.length > 0 && linesToPrint[linesToPrint.length - 1].trim() === '') {
            linesToPrint.pop();
          }
          
          // Print the lines
          linesToPrint.forEach(line => console.log(line));
          
          // Print summary
          console.log(`\n${summary}`);
        } else {
          // No more unchecked tasks - we completed the last one
          const finalStats = {
            total: statsBefore.total,
            completed: statsBefore.completed + 1,
            remaining: 0, // Since this was the last task
          };
          
          const summary = TaskService.getSummary(finalStats);
          
          console.log("\n✅ All tasks complete.");
          console.log(`\n${summary}`);
        }
      } else {
        // No unchecked tasks found initially
        // Use statsBefore for summary since nothing changed
        const summary = TaskService.getSummary(statsBefore);
        
        // Determine the appropriate message
        if (statsBefore.total === 0) {
          console.log("\n✅ No tasks found.");
        } else {
          console.log("\n✅ All tasks complete.");
        }
        
        // Display the summary
        console.log(`\n${summary}`);
      }
    } catch (error) {
      console.error('Error processing next task:', error);
    }
  }
} 