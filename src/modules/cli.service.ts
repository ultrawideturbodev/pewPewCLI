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
      // Read the task file content
      let lines = await this.taskService.readTaskLines();
      
      // Find the first unchecked task
      const firstUncheckedIndex = TaskService.findFirstUncheckedTask(lines);
      
      // Find task with [pew] prefix
      const pewIndex = TaskService.findTaskWithPewPrefix(lines);
      
      console.log(`Debug - First unchecked task index: ${firstUncheckedIndex}`);
      console.log(`Debug - [pew] prefix index: ${pewIndex}`);
      if (pewIndex !== -1) {
        console.log(`Debug - Line with [pew]: "${lines[pewIndex]}"`);
      }
      
      // Calculate initial statistics BEFORE any modifications
      const statsBefore = TaskService.getTaskStatsFromLines(lines);
      
      // [Scenario: Empty/No Tasks]
      if (lines.length === 0 || statsBefore.total === 0) {
        console.log("\n✅ No tasks found.");
        console.log(`\n${TaskService.getSummary(statsBefore)}`);
        return;
      }
      
      // [Scenario: All Tasks Complete]
      if (firstUncheckedIndex === -1) {
        // If there's a [pew] prefix, we should remove it
        if (pewIndex !== -1) {
          lines = TaskService.removePewPrefix(lines, pewIndex);
          await this.taskService.writeTaskLines(lines);
        }
        
        console.log("\n✅ All tasks complete.");
        console.log(`\n${TaskService.getSummary(statsBefore)}`);
        return;
      }
      
      // [Scenario: [pew] on Wrong Task]
      let currentPewIndex = pewIndex;
      if (pewIndex !== -1 && pewIndex !== firstUncheckedIndex) {
        console.log(`Debug - Removing [pew] from wrong task at index ${pewIndex}`);
        lines = TaskService.removePewPrefix(lines, pewIndex);
        currentPewIndex = -1; // Reset for this run
        // Continue to "Needs Prefix" scenario
      }
      
      // [Scenario: Needs [pew] Prefix]
      if (currentPewIndex === -1) {
        console.log(`Debug - Adding [pew] prefix to task at index ${firstUncheckedIndex}`);
        console.log(`Debug - Before: "${lines[firstUncheckedIndex]}"`);
        lines = TaskService.addPewPrefix(lines, firstUncheckedIndex);
        console.log(`Debug - After: "${lines[firstUncheckedIndex]}"`);
        await this.taskService.writeTaskLines(lines);
        
        // Get context for display
        const contextHeaders = TaskService.getContextHeaders(lines, firstUncheckedIndex);
        const range = TaskService.getTaskOutputRange(lines, firstUncheckedIndex);
        
        // Format header
        const taskHeader = "⭕ Current Task";
        const fullHeader = contextHeaders ? `${taskHeader} (${contextHeaders})` : taskHeader;
        
        // Display task and context
        console.log(`\n${fullHeader}`);
        console.log("═".repeat(fullHeader.length) + "\n");
        
        // Extract and print lines
        let linesToPrint = lines.slice(range.startIndex, range.endIndex);
        // Trim trailing empty lines
        while (linesToPrint.length > 0 && linesToPrint[linesToPrint.length - 1].trim() === '') {
          linesToPrint.pop();
        }
        linesToPrint.forEach(line => console.log(line));
        
        // Print summary
        console.log(`\n${TaskService.getSummary(statsBefore)}`);
        return;
      }
      
      // [Scenario: Complete Task with [pew]]
      if (currentPewIndex === firstUncheckedIndex) {
        console.log(`Debug - Completing task with [pew] at index ${firstUncheckedIndex}`);
        console.log(`Debug - Before: "${lines[firstUncheckedIndex]}"`);
        
        // Remove [pew] prefix
        lines = TaskService.removePewPrefix(lines, firstUncheckedIndex);
        console.log(`Debug - After removing prefix: "${lines[firstUncheckedIndex]}"`);
        
        // Mark task as complete
        const originalLine = lines[firstUncheckedIndex];
        const modifiedLine = TaskService.markTaskComplete(originalLine);
        lines[firstUncheckedIndex] = modifiedLine;
        console.log(`Debug - After marking complete: "${lines[firstUncheckedIndex]}"`);
        
        // Write changes to file
        await this.taskService.writeTaskLines(lines);
        
        // Confirmation message
        console.log("\n✅ Task marked as complete");
        
        // Calculate stats after completion
        const statsAfter = {
          total: statsBefore.total,
          completed: statsBefore.completed + 1,
          remaining: statsBefore.remaining - 1,
        };
        
        // Find the next unchecked task
        const nextUncheckedIndex = TaskService.findFirstUncheckedTask(lines);
        console.log(`Debug - Next unchecked task index: ${nextUncheckedIndex}`);
        
        // If there is a next task, display it with [pew] prefix
        if (nextUncheckedIndex !== -1) {
          // Add [pew] prefix to next task
          console.log(`Debug - Adding [pew] to next task: "${lines[nextUncheckedIndex]}"`);
          lines = TaskService.addPewPrefix(lines, nextUncheckedIndex);
          console.log(`Debug - After adding prefix: "${lines[nextUncheckedIndex]}"`);
          await this.taskService.writeTaskLines(lines);
          
          // Get context for display
          const contextHeaders = TaskService.getContextHeaders(lines, nextUncheckedIndex);
          const range = TaskService.getTaskOutputRange(lines, nextUncheckedIndex);
          
          // Format header
          const taskHeader = "⭕ Current Task";
          const fullHeader = contextHeaders ? `${taskHeader} (${contextHeaders})` : taskHeader;
          
          // Display task and context
          console.log(`\n${fullHeader}`);
          console.log("═".repeat(fullHeader.length) + "\n");
          
          // Extract and print lines
          let linesToPrint = lines.slice(range.startIndex, range.endIndex);
          // Trim trailing empty lines
          while (linesToPrint.length > 0 && linesToPrint[linesToPrint.length - 1].trim() === '') {
            linesToPrint.pop();
          }
          linesToPrint.forEach(line => console.log(line));
          
          // Print summary with updated stats
          console.log(`\n${TaskService.getSummary(statsAfter)}`);
        } else {
          // No more tasks
          console.log("\n✅ All tasks complete.");
          console.log(`\n${TaskService.getSummary(statsAfter)}`);
        }
        
        return;
      }
    } catch (error) {
      console.error('Error processing next task:', error);
    }
  }
} 