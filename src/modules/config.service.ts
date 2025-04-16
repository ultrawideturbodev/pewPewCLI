import * as path from 'path';
import { FileSystemService } from './file-system.service.js';
import { YamlService } from './yaml.service.js';
import { LoggerService } from './logger.service.js';

/**
 * Configuration Service for pew CLI.
 * 
 * Manages loading, saving, and accessing YAML configurations (paths.yaml, core.yaml).
 * Handles configuration scopes (local project vs. global user) and provides
 * methods to interact with configuration values.
 * Implemented as a lazy singleton.
 * 
 * @class ConfigService
 */
export class ConfigService {
  private static instance: ConfigService | null = null;

  private localConfigDir: string | null = null;
  private globalConfigDir: string;
  private localPathsFile: string | null = null;
  private globalPathsFile: string;
  private localPathsData: Record<string, any> = {};
  private globalPathsData: Record<string, any> = {};
  private globalCoreFile: string;
  private globalCoreData: Record<string, any> = {};
  private fileSystemService: FileSystemService;
  private yamlService: YamlService;
  private isInitialized: boolean = false;
  private logger: LoggerService;

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
    this.globalConfigDir = this.fileSystemService.joinPath(homeDir, '.pew');
    this.globalPathsFile = this.fileSystemService.joinPath(this.globalConfigDir, 'config', 'paths.yaml');
    this.globalCoreFile = this.fileSystemService.joinPath(this.globalConfigDir, 'core.yaml');
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
   * Locates the nearest local `.pew` directory upwards from the current working directory.
   * Loads configurations from global and discovered local files.
   * This method should be awaited before accessing configuration values.
   * 
   * @public
   * @async
   * @returns {Promise<void>} A promise that resolves when initialization is complete.
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    const localPewDir = await this.findLocalPewDir(process.cwd());
    
    if (localPewDir) {
      this.localConfigDir = localPewDir;
      this.localPathsFile = this.fileSystemService.joinPath(localPewDir, 'config', 'paths.yaml');
    }
    
    await this.loadPathsConfig();
    await this.loadCoreConfig();
    
    this.isInitialized = true;
  }

  /**
   * Finds the nearest `.pew` directory by searching upwards from a given starting path.
   * Stops searching if the root directory is reached or after a max depth.
   * 
   * @private
   * @async
   * @param {string} startPath - The absolute path to start searching from.
   * @returns {Promise<string | null>} A promise resolving to the absolute path of the found `.pew` directory, or null if not found.
   */
  private async findLocalPewDir(startPath: string): Promise<string | null> {
    let currentPath = startPath;
    
    const maxDepth = 10;
    let depth = 0;
    
    while (depth < maxDepth) {
      const pewPath = this.fileSystemService.joinPath(currentPath, '.pew');
      
      if (await this.fileSystemService.pathExists(pewPath)) {
        return pewPath;
      }
      
      const parentPath = path.dirname(currentPath);
      
      if (parentPath === currentPath) {
        break;
      }
      
      currentPath = parentPath;
      depth++;
    }
    
    return null;
  }

  /**
   * Loads configuration data from global and local `paths.yaml` files if they exist.
   * Populates `this.globalPathsData` and `this.localPathsData`.
   * 
   * @private
   * @async
   * @returns {Promise<void>}
   */
  private async loadPathsConfig(): Promise<void> {
    try {
      if (await this.fileSystemService.pathExists(this.globalPathsFile)) {
        this.globalPathsData = await this.yamlService.readYamlFile(this.globalPathsFile);
      }
    } catch (error: any) {
      this.logger.warn(`Failed to load global paths config (${this.globalPathsFile}): ${error.message}`);
      this.globalPathsData = {};
    }
    
    try {
      if (this.localPathsFile && await this.fileSystemService.pathExists(this.localPathsFile)) {
        this.localPathsData = await this.yamlService.readYamlFile(this.localPathsFile);
      }
    } catch (error: any) {
       if (this.localPathsFile) {
          this.logger.warn(`Failed to load local paths config (${this.localPathsFile}): ${error.message}`);
       }
       this.localPathsData = {};
    }
  }

  /**
   * Loads configuration data from the global `core.yaml` file if it exists.
   * Populates `this.globalCoreData`.
   * 
   * @private
   * @async
   * @returns {Promise<void>}
   */
  private async loadCoreConfig(): Promise<void> {
    if (await this.fileSystemService.pathExists(this.globalCoreFile)) {
      try {
        this.globalCoreData = await this.yamlService.readYamlFile(this.globalCoreFile);
      } catch (error: any) {
        this.logger.warn(`Warning: Could not read or parse global core config file at ${this.globalCoreFile}. Using default values. Error: ${error.message}`);
        this.globalCoreData = {};
      }
    } else {
      this.globalCoreData = {};
    }
  }

  /**
   * Gets the list of configured task file paths, resolved to absolute paths.
   * Reads from local config first if available, otherwise global.
   * Defaults to `['.pew/tasks.md']` relative to the config source directory if no paths are defined.
   *
   * @public
   * @async
   * @param {boolean} [global=false] - If true, forces reading from the global configuration.
   * @returns {Promise<string[]>} A promise resolving to an array of absolute task file paths.
   */
  public async getTasksPaths(global: boolean = false): Promise<string[]> {
    await this.initialize();
    
    const config = global ? this.globalPathsData : (this.localPathsFile ? this.localPathsData : this.globalPathsData);
    const taskConfig = config?.tasks?.all;
    const rawPaths = Array.isArray(taskConfig) && taskConfig.length > 0 ? taskConfig : ['.pew/tasks.md'];
    
    const isGlobalSource = global || config === this.globalPathsData;
    
    if (isGlobalSource) {
      return rawPaths.map(p => path.resolve(this.globalConfigDir, p));
    } else if (this.localConfigDir) {
      const projectRoot = path.dirname(this.localConfigDir);
      return rawPaths.map(p => path.resolve(projectRoot, p));
    } else {
      return rawPaths.map(p => path.resolve(process.cwd(), p));
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
      throw new Error("Cannot set task paths: provided paths array is empty.");
    }

    let targetFile: string;
    let configData: Record<string, any>;

    if (global) {
      targetFile = this.globalPathsFile;
      configData = await this.loadOrCreateConfigData(targetFile);
    } else {
      if (!this.localPathsFile) {
        const currentLocalPewDir = path.join(process.cwd(), '.pew');
        this.localPathsFile = this.fileSystemService.joinPath(currentLocalPewDir, 'config', 'paths.yaml');
      }
      targetFile = this.localPathsFile;
      configData = await this.loadOrCreateConfigData(targetFile);
    }

    const configDir = path.dirname(targetFile);
    try {
        await this.fileSystemService.ensureDirectoryExists(configDir);
    } catch (err: any) {
        this.logger.error(`Failed to ensure config directory exists at ${configDir}: ${err.message}`);
        throw new Error(`Configuration directory creation failed: ${err.message}`);
    }

    configData.tasks = configData.tasks || {};
    configData.tasks.all = paths;
    configData.tasks.primary = paths[0];
    
    configData['paste-tasks'] = (pasteTaskPath && pasteTaskPath.trim().length > 0)
                               ? pasteTaskPath.trim()
                               : configData.tasks.primary;

    try {
        await this.yamlService.writeYamlFile(targetFile, configData);
        this.logger.log(`Successfully wrote paths config to ${targetFile}`);
    } catch (err: any) {
        this.logger.error(`Failed to write YAML config to ${targetFile}: ${err.message}`);
        throw new Error(`Configuration file write failed: ${err.message}`);
    }

    if (global) {
      this.globalPathsData = configData;
    } else {
      this.localPathsData = configData;
    }
  }

  /**
   * Helper to load YAML data from a file, returning empty object if file doesn't exist.
   * 
   * @private
   * @async
   * @param {string} filePath - The absolute path to the YAML file.
   * @returns {Promise<Record<string, any>>} Loaded data or empty object.
   */
  private async loadOrCreateConfigData(filePath: string): Promise<Record<string, any>> {
      if (await this.fileSystemService.pathExists(filePath)) {
          try {
              return await this.yamlService.readYamlFile(filePath);
          } catch (error: any) {
              this.logger.warn(`Failed to read existing config file at ${filePath}. Starting with empty config. Error: ${error.message}`);
              return {};
          }
      } else {
          return {};
      }
  }

  /**
   * Gets the path to the local project-specific configuration directory (`.pew`).
   * Returns the path found during initialization.
   * 
   * @public
   * @returns {string | null} The absolute path to the local `.pew` directory, or null if no local project context was found.
   */
  public getLocalConfigDir(): string | null {
    return this.localConfigDir;
  }

  /**
   * Gets the path to the global user-level configuration directory (`~/.pew`).
   * 
   * @public
   * @returns {string} The absolute path to the global `.pew` directory.
   */
  public getGlobalConfigDir(): string {
    return this.globalConfigDir;
  }

  /**
   * Gets the resolved absolute path for the file where new tasks should be pasted by default.
   * Fallback logic:
   * 1. Checks effective config (local preferred) for `paste-tasks` key.
   * 2. Uses the primary task path (`tasks.primary`) from the effective config.
   * 3. Defaults to `./.pew/tasks.md` relative to the project root (if local) or CWD (if global/no local).
   * 
   * @public
   * @async
   * @returns {Promise<string>} A promise that resolves with the absolute path to the paste tasks file.
   */
  public async getPasteTasksPath(): Promise<string> {
    await this.initialize();

    let effectiveConfig: Record<string, any>;
    let configSourceDir: string;
    let configFilePathForLog: string | null;

    if (this.localPathsFile && Object.keys(this.localPathsData).length > 0) {
      effectiveConfig = this.localPathsData;
      configSourceDir = this.localConfigDir ? path.dirname(this.localConfigDir) : process.cwd();
      configFilePathForLog = this.localPathsFile;
    } else {
      effectiveConfig = this.globalPathsData;
      configSourceDir = this.globalConfigDir;
      configFilePathForLog = this.globalPathsFile;
    }

    const pasteTaskPathValue = effectiveConfig['paste-tasks'];
    if (typeof pasteTaskPathValue === 'string' && pasteTaskPathValue.trim().length > 0) {
      return path.resolve(configSourceDir, pasteTaskPathValue.trim());
    }
     else if (pasteTaskPathValue !== undefined && pasteTaskPathValue !== null) {
       const sourceName = configFilePathForLog || (this.localPathsFile ? 'local' : 'global');
       this.logger.warn(`Malformed 'paste-tasks' value in config file [${sourceName}], using fallback.`);
     }

    const primaryTaskPath = effectiveConfig?.tasks?.primary;
    if (typeof primaryTaskPath === 'string' && primaryTaskPath.trim().length > 0) {
      return path.resolve(configSourceDir, primaryTaskPath.trim());
    }

    const fallbackBaseDir = this.localConfigDir ? path.dirname(this.localConfigDir) : process.cwd();
    return path.resolve(fallbackBaseDir, '.pew/tasks.md');
  }

  /**
   * Gets a value from the global core configuration file (`core.yaml`).
   * Ensures the service is initialized before reading.
   *
   * @public
   * @async
   * @template T The expected type of the configuration value.
   * @param {string} key - The configuration key to retrieve (e.g., 'lastUpdateCheck').
   * @param {T} defaultValue - The value to return if the key is not found or the file doesn't exist.
   * @returns {Promise<T>} A promise that resolves with the configuration value or the default value.
   */
  public async getGlobalCoreValue<T>(key: string, defaultValue: T): Promise<T> {
    await this.initialize();
    const value = this.globalCoreData[key];
    return value !== undefined && value !== null ? value : defaultValue;
  }

  /**
   * Sets a value in the global core configuration file (`core.yaml`).
   * Ensures the service is initialized before writing. Creates directories if needed.
   * Updates the in-memory cache after successful write.
   *
   * @public
   * @async
   * @param {string} key - The configuration key to set.
   * @param {any} value - The value to associate with the key.
   * @returns {Promise<void>} A promise that resolves when the configuration is saved.
   * @throws {Error} If writing to the core configuration file fails.
   */
  public async setGlobalCoreValue(key: string, value: any): Promise<void> {
    await this.initialize();

    const coreDataToWrite = { ...this.globalCoreData };
    coreDataToWrite[key] = value;

    try {
      await this.fileSystemService.ensureDirectoryExists(this.globalConfigDir);
      await this.yamlService.writeYamlFile(this.globalCoreFile, coreDataToWrite);
      this.globalCoreData = coreDataToWrite;
      this.logger.log(`Successfully wrote core config value for key '${key}'`);
    } catch (error: any) {
      this.logger.error(`Error writing global core config value for key '${key}' to ${this.globalCoreFile}: ${error.message}`, error);
      throw new Error(`Failed to set global core value: ${error.message}`);
    }
  }
} 