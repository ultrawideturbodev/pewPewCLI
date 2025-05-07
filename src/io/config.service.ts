import * as path from 'path';
import { FileSystemService } from './file-system.service.js';
import { YamlService } from './yaml.service.js';
import { LoggerService } from '../core/logger.service.js';
import { PewConfigDto, TasksConfigDto, UpdatesConfigDto } from './config.dto.js';

/**
 * Configuration Service for pew CLI.
 *
 * Manages loading, saving, and accessing YAML configuration from pew.yaml.
 * Handles configuration scopes (local project vs. global user) and provides
 * methods to interact with configuration values.
 * Implemented as a lazy singleton.
 *
 * @class ConfigService
 */
export class ConfigService {
  private static instance: ConfigService | null = null;

  /**
   * Default configuration for tasks
   * @private
   * @static
   */
  private static readonly kDefaultTasksConfig: TasksConfigDto = {
    all: ['tasks.md'],
    primary: 'tasks.md',
    paste: 'tasks.md',
  };

  /**
   * Default configuration for updates
   * @private
   * @static
   */
  private static readonly kDefaultUpdatesConfig: UpdatesConfigDto = {
    lastUpdateCheckTimestamp: 0,
  };

  /**
   * Returns a new PewConfigDTO instance with all default values
   * @public
   * @static
   * @returns {PewConfigDto} A complete PewConfigDTO with default values
   */
  public static getDefaultConfigDTO(): PewConfigDto {
    return {
      tasks: { ...ConfigService.kDefaultTasksConfig },
      updates: { ...ConfigService.kDefaultUpdatesConfig },
    };
  }

  /**
   * Deserializes raw data (from YAML) into a PewConfigDTO, applying defaults for missing or invalid fields
   * @private
   * @param {Record<string, unknown>} rawData - Raw data object from parsed YAML
   * @returns {PewConfigDto} A complete PewConfigDTO with values from rawData if valid, otherwise defaults
   */
  private deserializeAndMergeWithDefaults(rawData: Record<string, unknown>): PewConfigDto {
    // Start with a deep copy of the default configuration
    const mergedConfig = ConfigService.getDefaultConfigDTO();

    // Ensure tasks property exists
    if (!mergedConfig.tasks) {
      mergedConfig.tasks = { ...ConfigService.kDefaultTasksConfig };
    }

    // Ensure updates property exists
    if (!mergedConfig.updates) {
      mergedConfig.updates = { ...ConfigService.kDefaultUpdatesConfig };
    }

    // Process tasks configuration if it exists
    if (rawData.tasks && typeof rawData.tasks === 'object') {
      // Handle 'all' field - must be an array of strings
      if (
        Array.isArray((rawData.tasks as Record<string, unknown>).all) &&
        ((rawData.tasks as Record<string, unknown>).all as unknown[]).every(
          (item) => typeof item === 'string'
        )
      ) {
        mergedConfig.tasks.all = [...((rawData.tasks as Record<string, unknown>).all as string[])];
      }

      // Handle 'primary' field - must be a string
      if (typeof (rawData.tasks as Record<string, unknown>).primary === 'string') {
        mergedConfig.tasks.primary = (rawData.tasks as Record<string, unknown>).primary as string;
      }

      // Handle 'paste' field - must be a string
      if (typeof (rawData.tasks as Record<string, unknown>).paste === 'string') {
        mergedConfig.tasks.paste = (rawData.tasks as Record<string, unknown>).paste as string;
      }
    }

    // Process updates configuration if it exists
    if (rawData.updates && typeof rawData.updates === 'object') {
      // Handle 'lastUpdateCheckTimestamp' field - must be a number
      if (
        typeof (rawData.updates as Record<string, unknown>).lastUpdateCheckTimestamp === 'number'
      ) {
        mergedConfig.updates.lastUpdateCheckTimestamp = (rawData.updates as Record<string, unknown>)
          .lastUpdateCheckTimestamp as number;
      }
    }

    return mergedConfig;
  }

  /**
   * Loads and parses YAML from the specified file path, applying defaults for missing or invalid fields
   * @private
   * @async
   * @param {string} filePath - The absolute path to the pew.yaml file to load
   * @returns {Promise<PewConfigDto>} A complete PewConfigDTO with data from the file and defaults applied
   */
  private async loadPewYaml(filePath: string): Promise<PewConfigDto> {
    try {
      const rawData = await this.yamlService.readYamlFile(filePath);
      return this.deserializeAndMergeWithDefaults(rawData);
    } catch (error: unknown) {
      this.logger.warn(
        `Failed to load or parse YAML from ${filePath}. Using defaults. Error: ${error instanceof Error ? error.message : String(error)}`
      );
      return ConfigService.getDefaultConfigDTO();
    }
  }

  /**
   * Saves a PewConfigDTO to the specified file path, ensuring the directory exists
   * @private
   * @async
   * @param {string} filePath - The absolute path to save the pew.yaml file
   * @param {PewConfigDto} dto - The configuration DTO to serialize and save
   * @returns {Promise<void>}
   */
  private async savePewYaml(filePath: string, dto: PewConfigDto): Promise<void> {
    try {
      // Ensure the directory exists before writing
      await this.fileSystemService.ensureDirectoryExists(path.dirname(filePath));

      // Write the file
      await this.yamlService.writeYamlFile(filePath, dto);
      this.logger.log(`Successfully wrote configuration to ${filePath}`);
    } catch (error: unknown) {
      this.logger.error(
        `Failed to save configuration to ${filePath}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw new Error(
        `Failed to save configuration: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Paths and configuration data
  private projectRootPath: string | null = null;
  private localPewYamlPath: string | null = null;
  private globalPewYamlPath: string;
  private localConfigData: PewConfigDto | null = null;
  private globalConfigData: PewConfigDto | null = null;
  private effectiveConfigData: PewConfigDto;

  // Services
  private fileSystemService: FileSystemService;
  private yamlService: YamlService;
  private logger: LoggerService;

  // State
  private isInitialized: boolean = false;

  /**
   * Private constructor to enforce singleton pattern.
   * Initializes service instances and determines global configuration paths.
   *
   * @private
   * @param {FileSystemService} fileSystemService - Instance of FileSystemService for file operations.
   */
  private constructor(fileSystemService: FileSystemService) {
    this.fileSystemService = fileSystemService;
    this.yamlService = new YamlService(this.fileSystemService);
    this.logger = LoggerService.getInstance();

    const homeDir = this.fileSystemService.getHomeDirectory();
    const globalConfigDir = this.fileSystemService.joinPath(homeDir, '.pew');
    this.globalPewYamlPath = this.fileSystemService.joinPath(globalConfigDir, 'pew.yaml');

    // Initialize effectiveConfigData with defaults
    this.effectiveConfigData = ConfigService.getDefaultConfigDTO();
  }

  /**
   * Gets the singleton instance of ConfigService.
   * Creates the instance with necessary dependencies if it doesn't exist.
   *
   * @public
   * @static
   * @returns {ConfigService} The singleton instance.
   */
  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      const fileSystem = new FileSystemService();
      ConfigService.instance = new ConfigService(fileSystem);
    }
    return ConfigService.instance;
  }

  /**
   * Initializes the ConfigService if not already initialized.
   * Locates the nearest pew.yaml file upwards from the current working directory.
   * Loads configurations from global and discovered local files.
   * This method should be awaited before accessing configuration values.
   *
   * @public
   * @async
   * @returns {Promise<void>} A promise that resolves when initialization is complete.
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Find the local project root and pew.yaml path if it exists
    const projectRoot = await this.findProjectRoot(process.cwd());
    if (projectRoot) {
      this.projectRootPath = projectRoot;
      this.localPewYamlPath = this.fileSystemService.joinPath(projectRoot, 'pew.yaml');
    }

    // Load global configuration (always attempt to load)
    this.globalConfigData = await this.loadPewYaml(this.globalPewYamlPath);

    // Load local configuration if available
    if (this.localPewYamlPath) {
      this.localConfigData = await this.loadPewYaml(this.localPewYamlPath);
    }

    // Determine the effective configuration to use
    if (this.localConfigData) {
      // Local configuration takes precedence if available
      this.effectiveConfigData = this.localConfigData;
    } else if (this.globalConfigData) {
      // Global configuration is used if no local configuration exists
      this.effectiveConfigData = this.globalConfigData;
    } else {
      // Fall back to default DTO if neither local nor global configurations exist
      // (though loadPewYaml should already return defaults if loading fails)
      this.effectiveConfigData = ConfigService.getDefaultConfigDTO();
    }

    this.isInitialized = true;
  }

  /**
   * Finds the project root directory by looking for a pew.yaml file
   * Searches upwards from a given starting path until a pew.yaml is found.
   * Stops searching if the root directory is reached or after a max depth.
   *
   * @private
   * @async
   * @param {string} startPath - The absolute path to start searching from.
   * @returns {Promise<string | null>} A promise resolving to the absolute path of the project root (directory containing pew.yaml), or null if not found.
   */
  private async findProjectRoot(startPath: string): Promise<string | null> {
    let currentPath = startPath;

    const maxDepth = 10;
    let depth = 0;

    while (depth < maxDepth) {
      const pewYamlPath = this.fileSystemService.joinPath(currentPath, 'pew.yaml');

      if (await this.fileSystemService.pathExists(pewYamlPath)) {
        return currentPath; // Return the directory containing pew.yaml, not the file path
      }

      const parentPath = path.dirname(currentPath);

      if (parentPath === currentPath) {
        break; // Stop if we've reached the root directory
      }

      currentPath = parentPath;
      depth++;
    }

    return null;
  }

  /**
   * Gets the list of configured task file paths, resolved to absolute paths.
   * When global=false (default), uses the effective configuration (local preferred over global).
   * When global=true, uses only the global configuration.
   * Defaults to `['tasks.md']` relative to the appropriate directory if no paths are defined.
   * Paths are resolved relative to the project root (for local config) or home directory (for global config).
   *
   * @public
   * @async
   * @param {boolean} [global=false] - If true, forces reading from the global configuration.
   * @returns {Promise<string[]>} A promise resolving to an array of absolute task file paths.
   */
  public async getTasksPaths(global: boolean = false): Promise<string[]> {
    await this.initialize();

    const configData = global ? this.globalConfigData : this.effectiveConfigData;
    // Ensure configData is not null - it should never be after initialize()
    if (!configData) {
      this.logger.warn(`Configuration data not available, using defaults`);
      return [path.resolve(process.cwd(), 'tasks.md')];
    }

    const taskPaths = configData.tasks?.all;

    // Use default task path if none are defined
    const rawPaths = Array.isArray(taskPaths) && taskPaths.length > 0 ? taskPaths : ['tasks.md'];

    // Resolve paths relative to the appropriate base directory
    if (global || !this.projectRootPath) {
      // For global config or when no local project is found, resolve relative to home directory
      const homeDir = this.fileSystemService.getHomeDirectory();
      return rawPaths.map((p) => path.resolve(homeDir, p));
    } else {
      // For local config, resolve relative to the project root
      // This.projectRootPath should never be null here since we've checked !this.projectRootPath above
      const rootPath = this.projectRootPath || process.cwd(); // Fallback to CWD in the impossible case
      return rawPaths.map((p) => path.resolve(rootPath, p));
    }
  }

  /**
   * Gets all configured task file paths, preferring local over global configuration.
   * This is essentially a wrapper for `getTasksPaths(false)`.
   *
   * @public
   * @async
   * @returns {Promise<string[]>} A promise resolving to an array of absolute task file paths based on effective config.
   */
  public async getAllTasksPaths(): Promise<string[]> {
    return this.getTasksPaths(false);
  }

  /**
   * Sets the list of task file paths in the configuration and optionally the dedicated paste path.
   * Creates the configuration file and directories if they don't exist.
   * Updates the in-memory cache after successful write.
   *
   * @public
   * @async
   * @param {string[]} paths - An array of paths to task files (relative paths will be stored as is, resolved later). Should not be empty.
   * @param {boolean} [global=false] - If true, saves to the global config; otherwise, saves to local config.
   * @param {string} [pasteTaskPath] - Optional dedicated path for pasting tasks. If undefined, defaults to the primary task path.
   * @returns {Promise<void>} A promise that resolves when the configuration is saved.
   * @throws {Error} If writing to the configuration file fails or paths array is empty.
   */
  public async setTasksPaths(
    paths: string[],
    global: boolean = false,
    pasteTaskPath?: string
  ): Promise<void> {
    await this.initialize();

    if (!paths || paths.length === 0) {
      throw new Error('Cannot set task paths: provided paths array is empty.');
    }

    // Determine which configuration to update and which file to save to
    let targetFile: string;
    let configData: PewConfigDto;

    if (global) {
      targetFile = this.globalPewYamlPath;
      configData = { ...this.globalConfigData };
    } else {
      if (!this.localPewYamlPath) {
        // Create a new local config if one doesn't exist
        this.projectRootPath = process.cwd();
        this.localPewYamlPath = this.fileSystemService.joinPath(this.projectRootPath, 'pew.yaml');
      }
      targetFile = this.localPewYamlPath;
      configData = this.localConfigData
        ? { ...this.localConfigData }
        : ConfigService.getDefaultConfigDTO();
    }

    // Ensure tasks property exists
    if (!configData.tasks) {
      configData.tasks = { ...ConfigService.kDefaultTasksConfig };
    }

    // Update task paths
    configData.tasks.all = [...paths];
    configData.tasks.primary = paths[0];

    // Set paste task path if provided, otherwise use the primary path
    if (pasteTaskPath && pasteTaskPath.trim().length > 0) {
      configData.tasks.paste = pasteTaskPath.trim();
    } else {
      configData.tasks.paste = paths[0];
    }

    try {
      await this.savePewYaml(targetFile, configData);

      // Update in-memory cache
      if (global) {
        this.logger.log(`Updating global configuration with new task paths`);
        this.globalConfigData = configData;
      } else {
        this.logger.log(`Updating local configuration with new task paths`);
        this.localConfigData = configData;
      }

      // Update effective configuration
      if (!global || !this.localConfigData) {
        this.logger.log(`Updating effective configuration with the new task paths`);
        this.effectiveConfigData = configData;
      }

      this.logger.log(`Successfully updated task paths in ${targetFile}`);
    } catch (error: unknown) {
      this.logger.error(
        `Failed to update task paths in ${targetFile}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw new Error(
        `Failed to update task paths: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Gets the path to the local project-specific root directory where pew.yaml is located.
   * Returns the path found during initialization.
   *
   * @public
   * @returns {string | null} The absolute path to the project root directory containing pew.yaml, or null if no local project context was found.
   */
  public getProjectRootPath(): string | null {
    return this.projectRootPath;
  }

  /**
   * Gets the path to the local project-specific pew.yaml file.
   * Returns the path found during initialization.
   *
   * @public
   * @returns {string | null} The absolute path to the local pew.yaml file, or null if no local project context was found.
   */
  public getLocalPewYamlPath(): string | null {
    return this.localPewYamlPath;
  }

  /**
   * Gets the path to the global user-level pew.yaml file.
   *
   * @public
   * @returns {string} The absolute path to the global pew.yaml file.
   */
  public getGlobalPewYamlPath(): string {
    return this.globalPewYamlPath;
  }

  /**
   * Gets the resolved absolute path for the file where new tasks should be pasted by default.
   * Uses the effective configuration (local preferred over global) to get the path.
   * Fallback logic:
   * 1. Uses the paste task path (`tasks.paste`) from the effective config.
   * 2. Falls back to the primary task path (`tasks.primary`) from the effective config.
   * 3. Defaults to `tasks.md` relative to the project root (if local) or home directory (if global/no local).
   * Paths are resolved relative to the project root (for local config) or home directory (for global config).
   *
   * @public
   * @async
   * @returns {Promise<string>} A promise that resolves with the absolute path to the paste tasks file.
   */
  public async getPasteTasksPath(): Promise<string> {
    await this.initialize();

    // Get the effective configuration (local preferred over global)
    const config = this.effectiveConfigData;

    // Determine base directory for resolving relative paths
    const baseDir = this.projectRootPath || this.fileSystemService.getHomeDirectory();

    // Check for paste task path in configuration
    if (
      config.tasks?.paste &&
      typeof config.tasks.paste === 'string' &&
      config.tasks.paste.trim().length > 0
    ) {
      return path.resolve(baseDir, config.tasks.paste.trim());
    }

    // Fall back to primary task path
    if (
      config.tasks?.primary &&
      typeof config.tasks.primary === 'string' &&
      config.tasks.primary.trim().length > 0
    ) {
      return path.resolve(baseDir, config.tasks.primary.trim());
    }

    // Default fallback
    return path.resolve(baseDir, 'tasks.md');
  }

  /**
   * Gets a value from the updates section of the global configuration.
   * Ensures the service is initialized before reading.
   *
   * @public
   * @async
   * @template T The expected type of the configuration value.
   * @param {keyof UpdatesConfigDto} key - The configuration key to retrieve (e.g., 'lastUpdateCheckTimestamp').
   * @param {T} defaultValue - The value to return if the key is not found or invalid.
   * @returns {Promise<T>} A promise that resolves with the configuration value or the default value.
   */
  public async getGlobalUpdateValue<T>(key: keyof UpdatesConfigDto, defaultValue: T): Promise<T> {
    await this.initialize();

    if (!this.globalConfigData) {
      return defaultValue;
    }

    const value = this.globalConfigData.updates?.[key];
    return value !== undefined && value !== null ? (value as unknown as T) : defaultValue;
  }

  /**
   * Updates a value in the global updates configuration.
   * Does not affect local configuration.
   *
   * @public
   * @async
   * @param {keyof UpdatesConfigDto} key - The key in the updates section to update.
   * @param {unknown} value - The value to set.
   * @returns {Promise<void>} A promise that resolves when the update is complete.
   * @throws {Error} If the global configuration cannot be loaded or updated.
   */
  public async setGlobalUpdateValue(key: keyof UpdatesConfigDto, value: unknown): Promise<void> {
    await this.initialize();

    try {
      // Load or initialize global config
      let globalConfig = this.globalConfigData;
      if (!globalConfig) {
        try {
          globalConfig = await this.loadPewYaml(this.globalPewYamlPath);
        } catch (error: unknown) {
          this.logger.warn(
            `Failed to load global config. Creating new one. Error: ${error instanceof Error ? error.message : String(error)}`
          );
          globalConfig = ConfigService.getDefaultConfigDTO();
        }
      }

      // Ensure updates section exists
      if (!globalConfig.updates) {
        globalConfig.updates = { ...ConfigService.kDefaultUpdatesConfig };
      }

      // Only set the value if it's the correct type for the key
      if (key === 'lastUpdateCheckTimestamp' && typeof value === 'number') {
        globalConfig.updates.lastUpdateCheckTimestamp = value;
      }

      // Save back to file
      await this.savePewYaml(this.globalPewYamlPath, globalConfig);
      this.logger.log(`Successfully wrote update config value for key '${key}'`);
    } catch (error: unknown) {
      this.logger.error(
        `Error writing global update config value for key '${key}' to ${this.globalPewYamlPath}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw new Error(
        `Failed to set global update value: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Sets a value in the global core configuration (deprecated, use setGlobalUpdateValue instead).
   * Currently only supports 'lastUpdateCheckTimestamp' key for backward compatibility.
   *
   * @deprecated Use setGlobalUpdateValue instead
   * @public
   * @async
   * @param {string} key - The configuration key to set.
   * @param {unknown} value - The value to associate with the key.
   * @returns {Promise<void>} A promise that resolves when the configuration is saved.
   * @throws {Error} If writing to the configuration file fails.
   */
  public async setGlobalCoreValue(key: string, value: unknown): Promise<void> {
    await this.initialize();

    if (key === 'lastUpdateCheckTimestamp') {
      await this.setGlobalUpdateValue(
        'lastUpdateCheckTimestamp',
        typeof value === 'number' ? value : 0
      );
    } else {
      this.logger.error(
        `Deprecated key '${key}' attempted to be set with setGlobalCoreValue. Only 'lastUpdateCheckTimestamp' is supported.`
      );
      throw new Error(`Unsupported configuration key: ${key}`);
    }
  }

  /**
   * Gets the currently loaded global configuration data.
   * This is an internal helper for CliService.handleInit() to access the global configuration.
   *
   * @internal
   * @returns {PewConfigDto | null} The current global configuration or null if not loaded
   */
  public getGlobalConfigDataInternal(): PewConfigDto | null {
    return this.globalConfigData;
  }

  /**
   * Gets a value from the global core configuration (deprecated, use getGlobalUpdateValue instead).
   * Currently only supports 'lastUpdateCheckTimestamp' key for backward compatibility.
   *
   * @deprecated Use getGlobalUpdateValue instead
   * @public
   * @async
   * @template T The expected type of the configuration value.
   * @param {string} key - The configuration key to retrieve.
   * @param {T} defaultValue - The value to return if the key is not found or invalid.
   * @returns {Promise<T>} A promise that resolves with the configuration value or the default value.
   */
  public async getGlobalCoreValue<T>(key: string, defaultValue: T): Promise<T> {
    await this.initialize();

    if (key === 'lastUpdateCheckTimestamp') {
      return this.getGlobalUpdateValue('lastUpdateCheckTimestamp', defaultValue);
    } else {
      this.logger.warn(
        `Deprecated key '${key}' requested from getGlobalCoreValue. Only 'lastUpdateCheckTimestamp' is supported.`
      );
      return defaultValue;
    }
  }
}
