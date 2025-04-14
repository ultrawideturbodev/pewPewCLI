import * as path from 'path';
import { FileSystemService } from './file-system.service.js';
import { YamlService } from './yaml.service.js';
import { LoggerService } from './logger.service.js';

/**
 * @class ConfigService
 * @description Manages loading, saving, and accessing YAML configurations for the pew CLI.
 * Handles configuration keys, values, and scopes (local vs global project settings).
 * Implemented as a lazy singleton.
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
   * Initializes paths for global configuration files.
   * @param {FileSystemService} fileSystemService - Instance of FileSystemService.
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
   * Creates the instance if it doesn't exist.
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
   * Initializes the ConfigService instance.
   * Finds the local .pew directory, loads path and core configurations.
   * Should be called before accessing configuration values.
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
   * Find local .pew directory by searching upwards from current directory
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
   * Load paths configuration from YAML files
   */
  private async loadPathsConfig(): Promise<void> {
    if (await this.fileSystemService.pathExists(this.globalPathsFile)) {
      this.globalPathsData = await this.yamlService.readYamlFile(this.globalPathsFile);
    }
    
    if (this.localPathsFile && await this.fileSystemService.pathExists(this.localPathsFile)) {
      this.localPathsData = await this.yamlService.readYamlFile(this.localPathsFile);
    }
  }

  /**
   * Load core configuration from global YAML file
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
   * Get tasks paths from config
   */
  public async getTasksPaths(global: boolean = false): Promise<string[]> {
    await this.initialize();
    
    const config = global ? this.globalPathsData : (this.localPathsFile ? this.localPathsData : this.globalPathsData);
    
    const rawPaths = config.tasks && Array.isArray(config.tasks) ? config.tasks : ['.pew/tasks.md'];
    
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
   * Get all tasks paths from config
   * Returns a resolved list of all task file paths
   */
  public async getAllTasksPaths(): Promise<string[]> {
    await this.initialize();
    
    const config = this.localPathsFile && Object.keys(this.localPathsData).length > 0
      ? this.localPathsData
      : this.globalPathsData;
    
    const rawPaths = config.tasks && Array.isArray(config.tasks) ? config.tasks : ['.pew/tasks.md'];
    
    const isGlobalSource = config === this.globalPathsData;
    
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
   * Sets the list of task file paths in the configuration.
   * Optionally sets the dedicated path for 'paste' tasks.
   *
   * @param {string[]} paths - An array of paths to task files.
   * @param {boolean} [global=false] - If true, saves to the global config; otherwise, saves to local config.
   * @param {string} [pasteTaskPath] - Optional dedicated path for the file to paste tasks into. If empty or undefined, removes the 'paste-tasks' key.
   * @returns {Promise<void>} A promise that resolves when the configuration is saved.
   * @throws {Error} If the target configuration file (local or global) cannot be determined or written to.
   */
  public async setTasksPaths(
    paths: string[],
    global: boolean = false,
    pasteTaskPath?: string
  ): Promise<void> {
    await this.initialize();

    const targetFile = global ? this.globalPathsFile : this.localPathsFile;
    let configData = global ? { ...this.globalPathsData } : { ...this.localPathsData };

    if (!targetFile) {
      const errorContext = global
        ? "Cannot determine global config file path."
        : "Cannot determine local config file path. Run 'pew init' first or specify --global.";
      throw new Error(`No config file available: ${errorContext}`);
    }

    const configDir = path.dirname(targetFile);
    await this.fileSystemService.ensureDirectoryExists(configDir);

    configData.tasks = paths;

    if (pasteTaskPath && pasteTaskPath.trim().length > 0) {
      configData['paste-tasks'] = pasteTaskPath.trim();
    } else {
      delete configData['paste-tasks'];
    }

    await this.yamlService.writeYamlFile(targetFile, configData);

    if (global) {
      this.globalPathsData = configData;
    } else {
      this.localPathsData = configData;
    }
  }

  /**
   * Gets the path to the local project-specific configuration directory (.pew).
   * @returns {string | null} The absolute path to the local .pew directory, or null if not found.
   */
  public getLocalConfigDir(): string | null {
    return this.localConfigDir;
  }

  /**
   * Gets the path to the global user-level configuration directory (~/.pew).
   * @returns {string} The absolute path to the global .pew directory.
   */
  public getGlobalConfigDir(): string {
    return this.globalConfigDir;
  }

  /**
   * Gets the resolved absolute path for the file where new tasks should be pasted by default.
   * Fallback logic:
   * 1. Checks local config for 'paste-tasks'.
   * 2. Checks global config for 'paste-tasks'.
   * 3. Uses the first path from the effective 'tasks' list (local first, then global).
   * 4. Defaults to './.pew/tasks.md' relative to the current working directory if no other path is found.
   * @returns {Promise<string>} A promise that resolves with the absolute path to the paste tasks file.
   */
  public async getPasteTasksPath(): Promise<string> {
    await this.initialize();

    let effectiveConfig: Record<string, any>;
    let isLocalSource: boolean;
    let configSourceDir: string;
    let configFilePath: string | null;

    if (this.localPathsFile && Object.keys(this.localPathsData).length > 0) {
      effectiveConfig = this.localPathsData;
      isLocalSource = true;
      configSourceDir = this.localConfigDir ? path.dirname(this.localConfigDir) : process.cwd();
      configFilePath = this.localPathsFile;
    } else {
      effectiveConfig = this.globalPathsData;
      isLocalSource = false;
      configSourceDir = this.globalConfigDir;
      configFilePath = this.globalPathsFile;
    }

    const pasteTaskPathValue = effectiveConfig['paste-tasks'];
    if (typeof pasteTaskPathValue === 'string' && pasteTaskPathValue.trim().length > 0) {
      return path.resolve(configSourceDir, pasteTaskPathValue.trim());
    } else if (pasteTaskPathValue !== undefined && pasteTaskPathValue !== null) {
      const sourceName = configFilePath || (isLocalSource ? 'local' : 'global');
      this.logger.warn(`Malformed 'paste-tasks' value in config file [${sourceName}], using fallback.`);
    }

    const tasksList = effectiveConfig.tasks;
    if (Array.isArray(tasksList) && tasksList.length > 0 && typeof tasksList[0] === 'string' && tasksList[0].trim().length > 0) {
      return path.resolve(configSourceDir, tasksList[0].trim());
    }

    return path.resolve(process.cwd(), '.pew/tasks.md');
  }

  /**
   * Get a value from the global core configuration file (core.yaml).
   * Ensures the service is initialized before reading.
   *
   * @template T
   * @param {string} key - The configuration key to retrieve.
   * @param {T} defaultValue - The value to return if the key is not found or the file doesn't exist.
   * @returns {Promise<T>} A promise that resolves with the configuration value or the default value.
   */
  public async getGlobalCoreValue<T>(key: string, defaultValue: T): Promise<T> {
    await this.initialize();
    const value = this.globalCoreData[key];
    return value !== undefined && value !== null ? value : defaultValue;
  }

  /**
   * Set a value in the global core configuration file (core.yaml).
   * Ensures the service is initialized before writing. Creates directories if needed.
   *
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
    } catch (error: any) {
      this.logger.error(`Error writing global core config value for key '${key}' to ${this.globalCoreFile}: ${error.message}`, error);
      throw new Error(`Failed to set global core value: ${error.message}`);
    }
  }
} 