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
  public async setTasksPaths(paths: string[], global: boolean = false): Promise<void> {
    await this.initialize();
    
    // Determine target file and config data
    const targetFile = global ? this.globalPathsFile : this.localPathsFile;
    let configData = global ? this.globalPathsData : this.localPathsData;
    
    // Create config dirs if needed
    if (!targetFile) {
      throw new Error('No config file available');
    }
    
    // Ensure target directory exists
    const configDir = path.dirname(targetFile);
    await this.fileSystemService.ensureDirectoryExists(configDir);
    
    // Update config data
    configData = { ...configData };
    configData.tasks = paths;
    
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
} 