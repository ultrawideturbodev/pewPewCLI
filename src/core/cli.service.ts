/**
 * CliService
 *
 * Orchestrates command execution.
 * Handles parsing commands and dispatching to appropriate services.
 */
import { FileSystemService } from '../io/file-system.service.js';
import { ConfigService } from '../io/config.service.js';
import { UserInputService } from '../io/user-input.service.js';
import { ClipboardService } from '../clipboard/clipboard.service.js';
import { TaskService } from '../tasks/task.service.js';
import { UpdateService } from '../updates/update.service.js';
import { TaskStatus, NextTaskResult, TaskFileSummary } from '../tasks/task.service.js';
import { LoggerService } from './logger.service.js';
import { YamlService } from '../io/yaml.service.js';
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
  private flags: Record<string, unknown>;
  private fileSystemService: FileSystemService;
  private configService: ConfigService;
  private userInputService: UserInputService;
  private clipboardService: ClipboardService;
  private taskService: TaskService;
  private updateService: UpdateService;
  private logger: LoggerService;

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
   * Creates a pew.yaml configuration file in the current directory.
   * Prompts user for confirmation if pew.yaml already exists (unless --force is used).
   * Copies the global pew.yaml configuration if it exists, otherwise uses defaults.
   * Creates an empty task file if it doesn't exist.
   * Runs a background update check after initialization.
   *
   * @param {{ force: boolean }} [flags={ force: false }] - Flags passed to the init command.
   * @param {boolean} flags.force - If true, overwrites existing config without prompting.
   * @returns {Promise<void>} A promise that resolves when initialization is complete or aborted.
   */
  async handleInit(flags: { force: boolean } = { force: false }): Promise<void> {
    // Ensure we initialize the ConfigService to load any global configuration
    await this.configService.initialize();

    // Define the local pew.yaml path in the current directory
    const localPewYamlPath = path.join(process.cwd(), 'pew.yaml');

    // Check if pew.yaml already exists, and prompt for confirmation if not using --force
    if (!flags.force && (await this.fileSystemService.pathExists(localPewYamlPath))) {
      const confirmation = await this.userInputService.askForConfirmation(
        'Overwrite existing pew.yaml configuration?',
        false
      );

      if (!confirmation) {
        this.logger.log('Initialization aborted.');
        return;
      }
    }

    // Determine the initial configuration to use
    // Use global config if it exists, otherwise use defaults
    const globalConfig = this.configService.getGlobalConfigDataInternal();
    const initialConfig = globalConfig
      ? JSON.parse(JSON.stringify(globalConfig)) // Deep copy of global config
      : ConfigService.getDefaultConfigDTO();

    // Get a reference to the YamlService from ConfigService
    const yamlService = new YamlService(this.fileSystemService);

    // Create the directory if needed (though it's in the current directory, so it should exist)
    await this.fileSystemService.ensureDirectoryExists(path.dirname(localPewYamlPath));

    // Write the initial configuration to a new pew.yaml file
    await yamlService.writeYamlFile(localPewYamlPath, initialConfig);
    
    // Add a commented-out templates example to the pew.yaml file
    await this.appendTemplatesExampleToYaml(localPewYamlPath);
    
    this.logger.log(`Created pew.yaml in ${process.cwd()}`);

    // Get the default task path from the config we just wrote
    let defaultTaskPath = 'tasks.md';
    if (initialConfig.tasks?.primary) {
      defaultTaskPath = initialConfig.tasks.primary;
    }

    // Prompt user for the primary task file path (unless using --force)
    let taskPath = defaultTaskPath;
    if (!flags.force) {
      taskPath = await this.userInputService.askForText(
        'Enter primary tasks file path:',
        defaultTaskPath
      );
    }

    // Update the configuration with the user's chosen task path
    await this.configService.setTasksPaths([taskPath], false, taskPath);

    // Create the task file if it doesn't exist
    const allTaskPaths = await this.configService.getAllTasksPaths();
    const resolvedTaskFilePath = allTaskPaths[0]; // The first one is the primary path
    const taskFileExists = await this.fileSystemService.pathExists(resolvedTaskFilePath);

    if (!taskFileExists) {
      await this.fileSystemService.writeFile(resolvedTaskFilePath, '');
      this.logger.log(`Created empty task file at ${resolvedTaskFilePath}`);
    }

    this.logger.success('pewPewCLI initialized successfully with pew.yaml.');

    // Run a background update check
    try {
      await this.updateService.runUpdateCheckAndNotify();
    } catch (updateError: unknown) {
      this.logger.warn(
        `Background update check failed: ${updateError instanceof Error ? updateError.message : String(updateError)}`
      );
    }
  }

  /**
   * Handles setting configuration paths (currently only 'tasks').
   * Prompts the user for the field and value if not provided.
   * Saves the path to either local or global pew.yaml configuration based on the --global flag.
   * When setting 'tasks', it updates tasks.all, tasks.primary, and tasks.paste in the configuration.
   *
   * @param {string} [field] - The configuration field to set (e.g., 'tasks').
   * @param {string} [value] - The path value to set.
   * @param {{ global: boolean }} [flags={ global: false }] - Flags passed to the set path command.
   * @param {boolean} flags.global - If true, sets the path in the global pew.yaml, otherwise in the local pew.yaml.
   * @returns {Promise<void>} A promise that resolves when the path is set.
   */
  async handleSetPath(
    field?: string,
    value?: string,
    flags: { global: boolean } = { global: false }
  ): Promise<void> {
    let finalField = field;
    if (!finalField) {
      finalField = await this.userInputService.askForText('Enter field to set (e.g., tasks):');
    }

    if (finalField !== 'tasks') {
      this.logger.error(`Invalid field '${finalField}' for set path. Only 'tasks' is supported.`);
      return;
    }

    let finalValue = value;
    if (!finalValue) {
      finalValue = await this.userInputService.askForText(`Enter value for ${finalField}:`);
    }

    if (typeof finalValue !== 'string' || finalValue.trim() === '') {
      this.logger.error(`Invalid value provided for ${finalField}. Aborting.`);
      return;
    }

    await this.configService.initialize();
    await this.configService.setTasksPaths([finalValue], flags.global);

    this.logger.success(
      `Set ${finalField} to ${finalValue} successfully in ${flags.global ? 'global' : 'local'} pew.yaml.`
    );
  }

  /**
   * Handles pasting tasks from the clipboard into a specified or default task file.
   * Reads clipboard content, determines the target file path (handling overrides and non-existent paths),
   * prompts the user for the paste mode (overwrite, append, insert) if not provided,
   * and writes the content using the TaskService.
   * Uses the PasteTasksPath from pew.yaml configuration.
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
      const clipboardContent = await this.clipboardService.readFromClipboard();

      if (!clipboardContent.trim()) {
        this.logger.log('Clipboard is empty. Nothing to paste.');
        return;
      }

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

      let finalMode = mode;
      if (finalMode === null) {
        finalMode = await this.userInputService.askForSelection<'overwrite' | 'append' | 'insert'>(
          'Choose paste mode:',
          ['overwrite', 'append', 'insert']
        );
      }

      await this.taskService.writeTasksContent(finalPastePath, clipboardContent, finalMode);

      const relativeFinalPath = path.relative(process.cwd(), finalPastePath);
      this.logger.success(`Pasted content to ${relativeFinalPath} (${finalMode}).`);

      try {
        await this.updateService.runUpdateCheckAndNotify();
      } catch (updateError: unknown) {
        this.logger.warn(
          `Background update check failed: ${updateError instanceof Error ? updateError.message : String(updateError)}`
        );
      }
    } catch (error) {
      this.logger.error('Error during paste tasks operation:', error);
    }
  }

  /**
   * Handles the logic for displaying and advancing the current task.
   * Delegates core state processing and file updates to TaskService.processNextTaskState.
   * Formats and displays the outcome (next task, all complete, no tasks, error).
   * Uses task file paths from pew.yaml configuration.
   *
   * @returns {Promise<void>} A promise that resolves when the next task logic is processed and displayed.
   */
  async handleNextTask(): Promise<void> {
    try {
      await this.configService.initialize();
      const filePaths = await this.configService.getAllTasksPaths();

      if (!filePaths || filePaths.length === 0) {
        this.logger.info(
          '\nℹ️ No task files configured in pew.yaml. Use `pew set path --field tasks --value <path>`.'
        );
        return;
      }

      const result: NextTaskResult = await this.taskService.processNextTaskState(filePaths);

      if (result.message) {
        this.logger.log(`\n${result.message}`);
      }

      switch (result.status) {
        case TaskStatus.NEXT_TASK_FOUND: {
          const taskHeader = '⭕ Current Task';
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
        }

        case TaskStatus.ALL_COMPLETE: {
          this.logger.success('\n✅ All tasks complete.');
          this.logger.log(`\n${result.summary}`);
          if (result.displayFilePath) {
            const relativeCompPath = path.relative(process.cwd(), result.displayFilePath);
            this.logger.log(`(File: ${relativeCompPath})`);
          }
          break;
        }

        case TaskStatus.NO_TASKS:
          this.logger.success('\n✅ No tasks found.');
          this.logger.log(`\n${result.summary}`);
          break;

        case TaskStatus.ERROR:
          this.logger.error(`\n❌ Error processing next task: ${result.message}`);
          break;

        default:
          this.logger.error('\n❌ Unexpected error processing next task.');
      }
    } catch (error: unknown) {
      this.logger.error(
        `Error in handleNextTask: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  /**
   * Handles resetting tasks in specified task files.
   * Retrieves configured task files from pew.yaml, gets summaries using TaskService,
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
        this.logger.info(
          'ℹ️ No task files configured in pew.yaml. Use `pew set path --field tasks --value <path>`.'
        );
        return;
      }

      const fileSummaries: TaskFileSummary[] =
        await this.taskService.getTaskFileSummaries(configuredPaths);

      const existingPaths = fileSummaries
        .filter((s) => s.exists && !s.disabled)
        .map((s) => s.filePath);
      const ignoredPaths = fileSummaries.filter((s) => !s.exists).map((s) => s.relativePath);
      const errorPaths = fileSummaries
        .filter((s) => s.exists && s.disabled)
        .map((s) => s.relativePath);

      if (ignoredPaths.length > 0) {
        this.logger.warn(`⚠️ Ignored non-existent task file(s): ${ignoredPaths.join(', ')}`);
      }
      if (errorPaths.length > 0) {
        this.logger.warn(`⚠️ Could not read or process file(s): ${errorPaths.join(', ')}`);
      }

      if (existingPaths.length === 0) {
        this.logger.info(
          'ℹ️ No existing and readable task files found in configuration. Nothing to reset.'
        );
        return;
      }

      const promptChoices = fileSummaries.map((summary) => ({
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
      } catch {
        this.logger.info('\nℹ️ Operation aborted by user.');
        return;
      }

      if (selectedPaths.length === 0) {
        this.logger.info('ℹ️ No files selected for reset.');
      } else {
        this.logger.log(
          `\nAttempting to reset tasks in ${selectedPaths.length} selected file(s)...`
        );
        let successCount = 0;
        let errorCount = 0;
        let totalActualResets = 0;

        for (const filePath of selectedPaths) {
          const relativePath = path.relative(process.cwd(), filePath);
          try {
            const countForFile = await this.taskService.resetTaskFile(filePath);
            totalActualResets += countForFile;
            this.logger.log(
              `   Resetting tasks in ${relativePath}... Done (${countForFile} tasks reset).`
            );
            successCount++;
          } catch (error: unknown) {
            this.logger.error(
              `❌ Error resetting file ${relativePath}: ${error instanceof Error ? error.message : String(error)}`,
              error
            );
            errorCount++;
          }
        }

        if (errorCount === 0) {
          this.logger.success(
            `\n✅ Successfully reset ${totalActualResets} tasks in ${successCount} file(s).`
          );
        } else {
          this.logger.warn(
            `\n⚠️ Completed reset with ${errorCount} error(s). Successfully reset ${totalActualResets} tasks in ${successCount} of ${selectedPaths.length} selected file(s).`
          );
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
   * Uses global pew.yaml to store the last update check timestamp.
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
  
  /**
   * Appends a commented-out templates example to the pew.yaml file.
   * This example helps users understand how to define code generation templates.
   * 
   * @private
   * @async
   * @param {string} yamlPath - The absolute path to the pew.yaml file
   * @returns {Promise<void>} A promise that resolves when the example has been appended
   */
  private async appendTemplatesExampleToYaml(yamlPath: string): Promise<void> {
    try {
      // Read the existing YAML file
      const existingContent = await this.fileSystemService.readFile(yamlPath);
      
      // Define the templates example with detailed comments
      const templatesExample = `
# Templates for code generation (uncomment and modify for your project)
# Each template defines a set of files to be generated based on variables
# -------------------------------------------------------------------
# templates:
#   # Example 'component' template for generating React components
#   component:
#     # Variables are key-value pairs that can be replaced in generated files
#     # These can be overridden via CLI arguments: --VariableName=Value
#     variables:
#       ComponentName: "MyComponent"
#       StyleType: "css"
#       WithTests: "true"
#     
#     # Replacements are direct string substitutions in content and filenames
#     replacements:
#       "__COMPONENT__": "${ComponentName}"
#       "__STYLE_EXT__": "${StyleType}"
#     
#     # Root directory for output files (optional, defaults to current directory)
#     root: "src/components/${ComponentName}"
#     
#     # Files to be processed and generated (required)
#     # Paths relative to project root or absolute paths
#     files:
#       - "templates/component/__COMPONENT__.tsx"
#       - "templates/component/__COMPONENT__.__STYLE_EXT__"
#       - "templates/component/index.ts"
#       - "templates/component/__COMPONENT__.test.tsx"
#
#   # Example 'utility' template for generating utility functions
#   utility:
#     variables:
#       UtilityName: "formatterUtil"
#     replacements:
#       "__UTILITY__": "${UtilityName}"
#     root: "src/utils"
#     files:
#       - "templates/utility/__UTILITY__.ts"
#       - "templates/utility/__UTILITY__.test.ts"
`;

      // Append the templates example to the YAML file
      await this.fileSystemService.writeFile(yamlPath, existingContent + templatesExample);
    } catch (error: unknown) {
      this.logger.error(`Failed to append templates example to ${yamlPath}:`, error);
      // Don't throw error - this is an enhancement, not critical functionality
    }
  }
}
