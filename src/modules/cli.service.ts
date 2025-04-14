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
import { TaskStatus, NextTaskResult, TaskFileSummary } from './task.service.js';
import { LoggerService } from './logger.service.js';
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
  private logger: LoggerService;
  
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
    this.logger = LoggerService.getInstance();
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
        this.logger.log('Initialization aborted.');
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
    
    this.logger.success('pewPewCLI initialized successfully.');

    // Run background update check
    try {
      await this.updateService.runUpdateCheckAndNotify();
    } catch (updateError: any) {
      // Log warning but don't fail the init command
      this.logger.warn(`Background update check failed: ${updateError.message}`);
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
      this.logger.error(`Invalid field '${finalField}' for set path. Only 'tasks' is supported.`);
      return;
    }
    
    // Get value if not provided
    let finalValue = value;
    if (!finalValue) {
      finalValue = await this.userInputService.askForText(`Enter value for ${finalField}:`);
    }

    // Add check for undefined finalValue after prompt
    if (typeof finalValue !== 'string' || finalValue.trim() === '') {
      this.logger.error(`Invalid value provided for ${finalField}. Aborting.`);
      return;
    }
    
    // Save to config
    await this.configService.initialize();
    await this.configService.setTasksPaths([finalValue], flags.global);
    
    this.logger.success(`Set ${finalField} to ${finalValue} successfully in ${flags.global ? 'global' : 'local'} config.`);
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
    options: { path?: string } = {}
  ): Promise<void> {
    try {
      // Read from clipboard
      const clipboardContent = await this.clipboardService.readFromClipboard();

      // Check if clipboard is empty
      if (!clipboardContent.trim()) {
        this.logger.log('Clipboard is empty. Nothing to paste.');
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
            this.logger.log('Paste operation aborted.');
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
      this.logger.success(`Pasted content to ${relativeFinalPath} (${finalMode}).`);

      // Run background update check
      try {
        await this.updateService.runUpdateCheckAndNotify();
      } catch (updateError: any) {
        // Log warning but don't fail the paste command
        this.logger.warn(`Background update check failed: ${updateError.message}`);
      }
    } catch (error) {
      this.logger.error('Error during paste tasks operation:', error);
    }
  }

  /**
   * Handles the logic for displaying and advancing the current task.
   * Delegates core state processing and file updates to TaskService.processNextTaskState.
   * Formats and displays the outcome (next task, all complete, no tasks, error).
   *
   * @returns {Promise<void>} A promise that resolves when the next task logic is processed and displayed.
   */
  async handleNextTask(): Promise<void> {
    try {
      await this.configService.initialize();
      const filePaths = await this.configService.getAllTasksPaths();

      if (!filePaths || filePaths.length === 0) {
        this.logger.info('\nℹ️ No task files configured. Use `pew set path --field tasks --value <path>`.');
        return;
      }

      // Delegate core logic to TaskService
      const result: NextTaskResult = await this.taskService.processNextTaskState(filePaths);

      // Display results based on the status returned by TaskService
      if (result.message) {
        this.logger.log(`\n${result.message}`);
      }

      switch (result.status) {
        case TaskStatus.NEXT_TASK_FOUND:
          const taskHeader = "⭕ Current Task";
          const fullHeader = result.displayContextHeaders 
            ? `${taskHeader} (${result.displayContextHeaders})` 
            : taskHeader;
          
          this.logger.header(`\n${fullHeader}`);
          this.logger.divider(fullHeader.length);
          this.logger.taskLines(result.displayTaskLines);
          this.logger.log(`\n${result.summary}`);
          const relativePath = path.relative(process.cwd(), result.displayFilePath);
          this.logger.log(`(File: ${relativePath})`);
          break;

        case TaskStatus.ALL_COMPLETE:
          this.logger.success("\n✅ All tasks complete.");
          this.logger.log(`\n${result.summary}`);
          if (result.displayFilePath) {
            const relativeCompPath = path.relative(process.cwd(), result.displayFilePath);
            this.logger.log(`(File: ${relativeCompPath})`);
          }
          break;

        case TaskStatus.NO_TASKS:
          this.logger.success("\n✅ No tasks found.");
          this.logger.log(`\n${result.summary}`);
          break;

        case TaskStatus.ERROR:
          this.logger.error(`\n❌ Error processing next task: ${result.message}`);
          break;
          
        default:
           this.logger.error('\n❌ Unexpected error processing next task.');
      }

    } catch (error: any) {
      this.logger.error(`Error in handleNextTask: ${error.message}`, error);
    }
  }

  /**
   * Handles resetting tasks in specified task files.
   * Retrieves configured task files, gets summaries using TaskService,
   * prompts the user to select which files to reset, and calls TaskService.resetTaskFile for selected files.
   * Reports the number of tasks reset in each file and provides a summary.
   *
   * @returns {Promise<void>} A promise that resolves when the reset operation is complete, potentially exiting the process on error.
   */
  public async handleResetTasks(): Promise<void> {
    try {
      await this.configService.initialize();
      const configuredPaths = await this.configService.getAllTasksPaths();

      if (!configuredPaths || configuredPaths.length === 0) {
        this.logger.info('ℹ️ No task files configured. Use `pew set path --field tasks --value <path>`.');
        return;
      }

      // Get summaries and existence status from TaskService
      const fileSummaries: TaskFileSummary[] = await this.taskService.getTaskFileSummaries(configuredPaths);

      const existingPaths = fileSummaries.filter(s => s.exists && !s.disabled).map(s => s.filePath);
      const ignoredPaths = fileSummaries.filter(s => !s.exists).map(s => s.relativePath);
      const errorPaths = fileSummaries.filter(s => s.exists && s.disabled).map(s => s.relativePath);

      // Notify user about ignored/error paths
      if (ignoredPaths.length > 0) {
        this.logger.warn(`⚠️ Ignored non-existent task file(s): ${ignoredPaths.join(', ')}`);
      }
      if (errorPaths.length > 0) {
          this.logger.warn(`⚠️ Could not read or process file(s): ${errorPaths.join(', ')}`);
      }

      // Check if any valid files remain
      if (existingPaths.length === 0) {
        this.logger.info('ℹ️ No existing and readable task files found in configuration. Nothing to reset.');
        return;
      }

      // Prepare choices for inquirer, using summaries and disabled status
      const promptChoices = fileSummaries.map(summary => ({
          name: `${summary.relativePath} (${summary.summary})`,
          value: summary.filePath,
          checked: !summary.disabled,
          disabled: summary.disabled ? `(${summary.error || 'Error'})` : false,
      }));

      let selectedPaths: string[] = [];
      try {
        selectedPaths = await this.userInputService.askForMultipleSelections(
          'Select task files to reset:',
          promptChoices
        );
      } catch (error) {
        this.logger.info('\nℹ️ Operation aborted by user.');
        return;
      }

      // Handle reset execution
      if (selectedPaths.length === 0) {
        this.logger.info('ℹ️ No files selected for reset.');
      } else {
        this.logger.log(`\nAttempting to reset tasks in ${selectedPaths.length} selected file(s)...`);
        let successCount = 0;
        let errorCount = 0;
        let totalActualResets = 0;

        for (const filePath of selectedPaths) {
          const relativePath = path.relative(process.cwd(), filePath);
          try {
            const countForFile = await this.taskService.resetTaskFile(filePath);
            totalActualResets += countForFile;
            this.logger.log(`   Resetting tasks in ${relativePath}... Done (${countForFile} tasks reset).`);
            successCount++;
          } catch (error: any) {
            this.logger.error(`❌ Error resetting file ${relativePath}: ${error.message}`, error);
            errorCount++;
          }
        }

        // Final summary message
        if (errorCount === 0) {
          this.logger.success(`\n✅ Successfully reset ${totalActualResets} tasks in ${successCount} file(s).`);
        } else {
          this.logger.warn(`\n⚠️ Completed reset with ${errorCount} error(s). Successfully reset ${totalActualResets} tasks in ${successCount} of ${selectedPaths.length} selected file(s).`);
        }
      }

    } catch (error) {
      this.logger.error('❌ Error during reset tasks operation:', error);
      process.exit(1);
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
        process.exit(1);
      }
      process.exit(0);
    } catch (error) {
      this.logger.error('An unexpected error occurred during the update command:', error);
      process.exit(1);
    }
  }
} 