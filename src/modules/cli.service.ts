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
import { UpdateService } from './update.service.js';
import * as path from 'path';

/**
 * @class CliService
 * @description Orchestrates command execution for the pew CLI.
 * Parses commands, manages service instances, and dispatches execution to appropriate handler methods.
 * Implemented as a lazy singleton.
 */
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
  private updateService: UpdateService;
  
  // Singleton instance
  private static instance: CliService | null = null;
  
  /**
   * Private constructor to enforce singleton pattern.
   * Initializes required service instances.
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
    this.taskService = new TaskService(this.configService, this.fileSystemService);
    this.updateService = new UpdateService(this.fileSystemService, this.configService);
  }
  
  /**
   * Gets the singleton instance of CliService.
   * Creates the instance if it doesn't exist.
   * @returns {CliService} The singleton instance.
   */
  public static getInstance(): CliService {
    if (!CliService.instance) {
      CliService.instance = new CliService();
    }
    return CliService.instance;
  }

  /**
   * Handles the initialization logic for the pew CLI in the current directory.
   * Creates necessary configuration files and directories (.pew/).
   * Prompts user for confirmation and task file path unless --force is used.
   * Creates an empty task file if it doesn't exist.
   * Runs a background update check after initialization.
   *
   * @param {{ force: boolean }} [flags={ force: false }] - Flags passed to the init command.
   * @param {boolean} flags.force - If true, overwrites existing config without prompting.
   * @returns {Promise<void>} A promise that resolves when initialization is complete or aborted.
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
      taskPath = await this.userInputService.askForText(
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

    // Run background update check
    try {
      await this.updateService.runUpdateCheckAndNotify();
    } catch (updateError: any) {
      // Log warning but don't fail the init command
      console.warn(`Background update check failed: ${updateError.message}`);
    }
  }

  /**
   * Handles setting configuration paths (currently only 'tasks').
   * Prompts the user for the field and value if not provided.
   * Saves the path to either local or global configuration based on the --global flag.
   *
   * @param {string} [field] - The configuration field to set (e.g., 'tasks').
   * @param {string} [value] - The path value to set.
   * @param {{ global: boolean }} [flags={ global: false }] - Flags passed to the set path command.
   * @param {boolean} flags.global - If true, sets the path in the global config.
   * @returns {Promise<void>} A promise that resolves when the path is set.
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
      finalValue = await this.userInputService.askForText(`Enter value for ${finalField}:`);
    }

    // Add check for undefined finalValue after prompt
    if (typeof finalValue !== 'string' || finalValue.trim() === '') {
      console.error(`Invalid value provided for ${finalField}. Aborting.`);
      return;
    }
    
    // Save to config
    await this.configService.initialize();
    await this.configService.setTasksPaths([finalValue], flags.global);
    
    console.log(`Set ${finalField} to ${finalValue} successfully in ${flags.global ? 'global' : 'local'} config.`);
  }

  /**
   * Handles pasting tasks from the clipboard into a specified or default task file.
   * Reads clipboard content, determines the target file path (handling overrides and non-existent paths),
   * prompts the user for the paste mode (overwrite, append, insert) if not provided,
   * and writes the content using the TaskService.
   * Runs a background update check after pasting.
   *
   * @param {('overwrite' | 'append' | 'insert' | null)} [mode=null] - The paste mode to use.
   * @param {{ path?: string }} [options={}] - Options for the paste command.
   * @param {string} [options.path] - An optional specific file path to paste into, overriding the default/configured path.
   * @returns {Promise<void>} A promise that resolves when the paste operation is complete or aborted.
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

      // Run background update check
      try {
        await this.updateService.runUpdateCheckAndNotify();
      } catch (updateError: any) {
        // Log warning but don't fail the paste command
        console.warn(`Background update check failed: ${updateError.message}`);
      }
    } catch (error) {
      console.error('Error during paste tasks operation:', error);
    }
  }

  /**
   * Handles the logic for displaying and advancing the current task.
   * Reads all configured task files, identifies the next incomplete task, and manages the `[pew]` prefix.
   * If a task with `[pew]` is complete, it marks it done (`[x]`), removes the prefix, and adds the prefix to the next incomplete task.
   * If no task has `[pew]`, it adds it to the first incomplete task found.
   * Displays the current task with context headers and a summary.
   * Handles cases for no tasks, all tasks completed, and errors during file processing.
   *
   * @returns {Promise<void>} A promise that resolves when the next task logic is processed and displayed.
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

  /**
   * Handles resetting tasks in specified task files.
   * Retrieves configured task files, checks for their existence, and prompts the user to select which files to reset.
   * For selected files, it calls TaskService.resetTaskFile to uncheck completed tasks (`[x] -> [ ]`) and remove the `[pew]` prefix.
   * Reports the number of tasks reset in each file and provides a summary.
   *
   * @returns {Promise<void>} A promise that resolves when the reset operation is complete, potentially exiting the process on error.
   */
  public async handleResetTasks(): Promise<void> {
    try {
      // Initialize ConfigService if not already done (assuming it might be)
      await this.configService.initialize();

      // Get configured task file paths
      const configuredPaths = await this.configService.getAllTasksPaths();
      if (!configuredPaths || configuredPaths.length === 0) {
        console.log('ℹ️ No task files configured. Use `pew set path --field tasks --value <path>`.');
        return;
      }

      // Filter paths, check existence
      const existingPaths: string[] = [];
      const ignoredPaths: string[] = [];

      for (const configPath of configuredPaths) {
        if (await this.fileSystemService.pathExists(configPath)) {
          existingPaths.push(configPath);
        } else {
          ignoredPaths.push(configPath);
        }
      }

      // Notify user about ignored paths
      if (ignoredPaths.length > 0) {
        const relativeIgnored = ignoredPaths.map(p => path.relative(process.cwd(), p));
        console.warn(`⚠️ Ignored non-existent task file(s): ${relativeIgnored.join(', ')}`);
      }

      // Check if any valid files remain
      if (existingPaths.length === 0) {
        console.log('ℹ️ No existing task files found in configuration. Nothing to reset.');
        return; // Exit gracefully
      }

      // Dynamically prepare choices with task summaries
      const choicePromises = existingPaths.map(async (filePath) => {
        const relativePath = path.relative(process.cwd(), filePath);
        try {
          const lines = await this.taskService.readTaskLines(filePath);
          const stats = TaskService.getTaskStatsFromLines(lines);
          const summary = TaskService.getSummary(stats); // Reuse existing summary logic
          const displayName = `${relativePath} (${summary})`;
          return { name: displayName, value: filePath, checked: true }; // Default color, default indicator
        } catch (readError: any) {
          console.warn(`⚠️ Could not read file ${relativePath} to generate summary: ${readError.message}`);
          const errorName = `${relativePath} (Error reading file)`;
          // Return a disabled choice for files that couldn't be read
          return { name: errorName, value: filePath, checked: false, disabled: 'Error reading file' };
        }
      });

      const promptChoices = await Promise.all(choicePromises);

      // Filter out disabled choices for the active selection logic, 
      // though inquirer should handle displaying them correctly.
      const enabledChoices = promptChoices.filter(choice => !choice.disabled);

      // Check if there are any enabled choices left
      if (enabledChoices.length === 0) {
        console.log('ℹ️ No readable task files found or all encountered errors during summary generation.');
        return;
      }

      let selectedPaths: string[] = [];
      try {
        // Use a simple prompt message now
        const promptMessage = 'Select task files to reset:';
        selectedPaths = await this.userInputService.askForMultipleSelections(
          promptMessage,
          promptChoices // Pass the full choices array (including disabled ones) to inquirer
        );
      } catch (error) {
        // Assuming cancellation throws an error or returns a specific signal
        // Depending on UserInputService implementation, adjust error handling
        console.log('\nℹ️ Operation aborted by user.');
        return; // Exit gracefully on cancellation
      }

      // Handle reset execution
      if (selectedPaths.length === 0) {
        console.log('ℹ️ No files selected for reset. 0 files reset.');
      } else {
        console.log(`\nAttempting to reset tasks in ${selectedPaths.length} selected file(s)...`);
        let successCount = 0;
        let errorCount = 0;
        let totalActualResets = 0; // Track total resets

        for (const filePath of selectedPaths) {
          const relativePath = path.relative(process.cwd(), filePath);
          try {
            // Call the TaskService method and get the count of resets for this file
            const countForFile = await this.taskService.resetTaskFile(filePath);
            totalActualResets += countForFile; // Add to total
            console.log(`   Resetting tasks in ${relativePath}... Done (${countForFile} tasks reset).`);
            successCount++;
          } catch (error: any) {
            console.error(`❌ Error resetting file ${relativePath}: ${error.message}`);
            errorCount++;
            // Decide whether to continue or stop on error - continuing for now
          }
        }

        // Final summary message
        if (errorCount === 0) {
          console.log(`\n✅ Successfully reset ${totalActualResets} tasks in ${successCount} file(s).`);
        } else {
          console.log(`\n⚠️ Completed reset with ${errorCount} error(s). Successfully reset ${totalActualResets} tasks in ${successCount} of ${selectedPaths.length} selected file(s).`);
        }
      }

      // Optionally, ensure clean exit (though not strictly necessary if no errors)
      // process.exit(0); 

    } catch (error) {
      console.error('❌ Error during reset tasks operation:', error);
      process.exit(1); // Exit with error code
    }
  }

  /**
   * Handles the explicit update check command.
   * Calls the UpdateService to check for new versions and perform an update if available.
   * Exits the process with appropriate codes based on the update result (success, failure, no update needed).
   *
   * @returns {Promise<void>} A promise that resolves when the update check is complete, although the process typically exits before resolution.
   */
  public async handleUpdate(): Promise<void> {
    try {
      const result = await this.updateService.performUpdate();
      if (!result.success && result.error) {
        // Error is already logged by performUpdate
        process.exit(1); // Exit with error code
      }
      // Exit cleanly on success or no update needed
      process.exit(0);
    } catch (error) {
      // Catch any unexpected errors during the update handling itself
      console.error('An unexpected error occurred during the update command:', error);
      process.exit(1);
    }
  }
} 