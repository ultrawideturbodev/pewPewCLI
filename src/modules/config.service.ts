/**
 * ConfigService
 * 
 * Manages loading and saving YAML configurations.
 * Handles configuration keys, values, and scopes (local vs global).
 */
import * as path from 'path';
import { FileSystemService } from './file-system.service.js';
import { YamlService } from './yaml.service.js';

export class ConfigService {
  // Singleton instance
  private static instance: ConfigService | null = null;

  // Properties
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

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.fileSystemService = new FileSystemService();
    this.yamlService = new YamlService();
    
    // Set global config paths
    const homeDir = this.fileSystemService.getHomeDirectory();
    this.globalConfigDir = this.fileSystemService.joinPath(homeDir, '.pew');
    this.globalPathsFile = this.fileSystemService.joinPath(this.globalConfigDir, 'config', 'paths.yaml');
    this.globalCoreFile = this.fileSystemService.joinPath(this.globalConfigDir, 'core.yaml');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  /**
   * Initialize the service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    // Find local .pew directory
    const localPewDir = await this._findLocalPewDir(process.cwd());
    
    // Set local config paths if found
    if (localPewDir) {
      this.localConfigDir = localPewDir;
      this.localPathsFile = this.fileSystemService.joinPath(localPewDir, 'config', 'paths.yaml');
    }
    
    // Load configs
    await this._loadPathsConfig();
    await this._loadCoreConfig();
    
    this.isInitialized = true;
  }

  /**
   * Find local .pew directory by searching upwards from current directory
   */
  private async _findLocalPewDir(startPath: string): Promise<string | null> {
    let currentPath = startPath;
    
    // Limit the search to avoid infinite loops
    const maxDepth = 10;
    let depth = 0;
    
    while (depth < maxDepth) {
      const pewPath = this.fileSystemService.joinPath(currentPath, '.pew');
      
      if (await this.fileSystemService.pathExists(pewPath)) {
        return pewPath;
      }
      
      // Move up one directory
      const parentPath = path.dirname(currentPath);
      
      // If we've reached the root, stop searching
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
  private async _loadPathsConfig(): Promise<void> {
    // Load global paths config
    if (await this.fileSystemService.pathExists(this.globalPathsFile)) {
      this.globalPathsData = await this.yamlService.readYamlFile(this.globalPathsFile);
    }
    
    // Load local paths config if available
    if (this.localPathsFile && await this.fileSystemService.pathExists(this.localPathsFile)) {
      this.localPathsData = await this.yamlService.readYamlFile(this.localPathsFile);
    }
  }

  /**
   * Load core configuration from global YAML file
   */
  private async _loadCoreConfig(): Promise<void> {
    if (await this.fileSystemService.pathExists(this.globalCoreFile)) {
      try {
        this.globalCoreData = await this.yamlService.readYamlFile(this.globalCoreFile);
      } catch (error: any) {
        console.warn(`Warning: Could not read or parse global core config file at ${this.globalCoreFile}. Using default values. Error: ${error.message}`);
        this.globalCoreData = {}; // Reset to empty on error
      }
    } else {
      this.globalCoreData = {}; // Set to empty if file doesn't exist
    }
  }

  /**
   * Get tasks paths from config
   */
  public async getTasksPaths(global: boolean = false): Promise<string[]> {
    await this.initialize();
    
    // Determine which config to use
    const config = global ? this.globalPathsData : (this.localPathsFile ? this.localPathsData : this.globalPathsData);
    
    // Get raw paths from config or use default
    const rawPaths = config.tasks && Array.isArray(config.tasks) ? config.tasks : ['.pew/tasks.md'];
    
    // Determine if we're using the global config source
    const isGlobalSource = global || config === this.globalPathsData;
    
    // Resolve paths based on their source
    if (isGlobalSource) {
      // For global paths, resolve relative to the global config directory
      return rawPaths.map(p => path.resolve(this.globalConfigDir, p));
    } else if (this.localConfigDir) {
      // For local paths, resolve relative to the project root (parent of .pew)
      const projectRoot = path.dirname(this.localConfigDir);
      return rawPaths.map(p => path.resolve(projectRoot, p));
    } else {
      // Fallback if no config exists at all (using default)
      return rawPaths.map(p => path.resolve(process.cwd(), p));
    }
  }

  /**
   * Get all tasks paths from config
   * Returns a resolved list of all task file paths
   */
  public async getAllTasksPaths(): Promise<string[]> {
    await this.initialize();
    
    // Determine the effective configuration data
    const config = this.localPathsFile && Object.keys(this.localPathsData).length > 0
      ? this.localPathsData
      : this.globalPathsData;
    
    // Get raw paths from config or use default
    const rawPaths = config.tasks && Array.isArray(config.tasks) ? config.tasks : ['.pew/tasks.md'];
    
    // Determine if we're using the global config source
    const isGlobalSource = config === this.globalPathsData;
    
    // Resolve paths based on their source
    if (isGlobalSource) {
      // For global paths, resolve relative to the global config directory
      return rawPaths.map(p => path.resolve(this.globalConfigDir, p));
    } else if (this.localConfigDir) {
      // For local paths, resolve relative to the project root (parent of .pew)
      const projectRoot = path.dirname(this.localConfigDir);
      return rawPaths.map(p => path.resolve(projectRoot, p));
    } else {
      // Fallback if no config exists at all (using default)
      return rawPaths.map(p => path.resolve(process.cwd(), p));
    }
  }

  /**
   * Set tasks paths in config
   */
  public async setTasksPaths(
    paths: string[],
    global: boolean = false,
    pasteTaskPath?: string
  ): Promise<void> {
    await this.initialize();

    // Determine target file and config data
    const targetFile = global ? this.globalPathsFile : this.localPathsFile;
    let configData = global ? { ...this.globalPathsData } : { ...this.localPathsData };

    // Throw error if no target file could be determined (e.g., no local .pew and trying to write locally)
    if (!targetFile) {
      // Provide a more specific error based on the context
      const errorContext = global
        ? "Cannot determine global config file path."
        : "Cannot determine local config file path. Run 'pew init' first or specify --global.";
      throw new Error(`No config file available: ${errorContext}`);
    }

    // Ensure target directory exists
    const configDir = path.dirname(targetFile);
    await this.fileSystemService.ensureDirectoryExists(configDir);

    // Update config data
    configData.tasks = paths;

    // Set or remove the paste-tasks path based on the provided argument
    if (pasteTaskPath && pasteTaskPath.trim().length > 0) {
      configData['paste-tasks'] = pasteTaskPath.trim();
    } else {
      // Remove the key if no valid path is provided
      // This ensures clean-up if the user removes the paste target later
      delete configData['paste-tasks'];
    }

    // Save config
    await this.yamlService.writeYamlFile(targetFile, configData);

    // Update in-memory data
    if (global) {
      this.globalPathsData = configData;
    } else {
      this.localPathsData = configData;
    }
  }

  /**
   * Get local config directory
   */
  public getLocalConfigDir(): string | null {
    return this.localConfigDir;
  }

  /**
   * Get global config directory
   */
  public getGlobalConfigDir(): string {
    return this.globalConfigDir;
  }

  /**
   * Get the resolved path for the default paste tasks file.
   * Follows fallback logic: local 'paste-tasks' -> global 'paste-tasks' ->
   * first local/global 'tasks' -> default './.pew/tasks.md'.
   */
  public async getPasteTasksPath(): Promise<string> {
    await this.initialize();

    let effectiveConfig: Record<string, any>;
    let isLocalSource: boolean;
    let configSourceDir: string;
    let configFilePath: string | null;

    // Determine effective config source (prefer local)
    if (this.localPathsFile && Object.keys(this.localPathsData).length > 0) {
      effectiveConfig = this.localPathsData;
      isLocalSource = true;
      // Local config paths are relative to the project root (parent of .pew)
      configSourceDir = this.localConfigDir ? path.dirname(this.localConfigDir) : process.cwd();
      configFilePath = this.localPathsFile;
    } else {
      effectiveConfig = this.globalPathsData;
      isLocalSource = false;
      // Global config paths are relative to the global .pew directory
      configSourceDir = this.globalConfigDir;
      configFilePath = this.globalPathsFile;
    }

    // 1. Check 'paste-tasks' key in effective config
    const pasteTaskPathValue = effectiveConfig['paste-tasks'];
    if (typeof pasteTaskPathValue === 'string' && pasteTaskPathValue.trim().length > 0) {
      return path.resolve(configSourceDir, pasteTaskPathValue.trim());
    } else if (pasteTaskPathValue !== undefined && pasteTaskPathValue !== null) {
      // Key exists but is malformed
      const sourceName = configFilePath || (isLocalSource ? 'local' : 'global');
      console.warn(`Malformed 'paste-tasks' value in config file [${sourceName}], using fallback.`);
    }

    // 2. Fallback 1: Check 'tasks' list in effective config
    const tasksList = effectiveConfig.tasks;
    if (Array.isArray(tasksList) && tasksList.length > 0 && typeof tasksList[0] === 'string' && tasksList[0].trim().length > 0) {
      return path.resolve(configSourceDir, tasksList[0].trim());
    }

    // 3. Fallback 2: Default path relative to cwd
    return path.resolve(process.cwd(), '.pew/tasks.md');
  }

  /**
   * Get a value from the global core configuration file.
   * 
   * @param key The configuration key to retrieve.
   * @param defaultValue The default value to return if the key is not found.
   * @returns The value associated with the key, or the defaultValue.
   */
  public async getGlobalCoreValue<T>(key: string, defaultValue: T): Promise<T> {
    await this.initialize(); // Ensure configuration is loaded
    const value = this.globalCoreData[key];
    return value !== undefined && value !== null ? value : defaultValue;
  }

  /**
   * Set a value in the global core configuration file.
   * 
   * @param key The configuration key to set.
   * @param value The value to associate with the key.
   */
  public async setGlobalCoreValue(key: string, value: any): Promise<void> {
    await this.initialize(); // Ensure configuration is loaded

    // Create a copy to modify and write, preserving the original cache until write succeeds
    const coreDataToWrite = { ...this.globalCoreData };
    coreDataToWrite[key] = value;

    try {
      // Ensure the global config directory exists
      await this.fileSystemService.ensureDirectoryExists(this.globalConfigDir);
      // Write the updated data to the core file
      await this.yamlService.writeYamlFile(this.globalCoreFile, coreDataToWrite);
      // Update the in-memory cache only after successful write
      this.globalCoreData = coreDataToWrite;
    } catch (error: any) {
      console.error(`Error writing global core config value for key '${key}' to ${this.globalCoreFile}: ${error.message}`);
      // Optionally re-throw or handle the error more specifically
      throw new Error(`Failed to set global core value: ${error.message}`);
    }
  }
} 