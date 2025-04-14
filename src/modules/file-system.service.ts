import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { LoggerService } from './logger.service.js';

/**
 * @class FileSystemService
 * @description Provides abstracted and error-handled interactions with the file system.
 * Wraps Node.js `fs`, `path`, and `os` modules for common operations like reading/writing files,
 * checking paths, creating directories, and resolving paths.
 */
export class FileSystemService {
  private logger: LoggerService;

  /**
   * Constructor for FileSystemService.
   * Initializes the logger instance.
   */
  constructor() {
    this.logger = LoggerService.getInstance();
  }

  /**
   * Asynchronously reads the entire content of a file.
   * Assumes UTF-8 encoding.
   * Logs and re-throws errors if reading fails.
   * @param {string} filePath - The absolute or relative path to the file.
   * @returns {Promise<string>} A promise that resolves with the file content as a string.
   * @throws {Error} If reading the file fails.
   */
  async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      this.logger.error(`Error reading file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Asynchronously writes data to a file, replacing the file if it already exists.
   * Assumes UTF-8 encoding.
   * Logs and re-throws errors if writing fails.
   * @param {string} filePath - The absolute or relative path to the file.
   * @param {string} content - The string content to write.
   * @returns {Promise<void>} A promise that resolves when the file has been written.
   * @throws {Error} If writing the file fails.
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      this.logger.error(`Error writing file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Asynchronously checks if a path exists on the file system.
   * Does not throw an error if the path doesn't exist.
   * @param {string} filePath - The path to check.
   * @returns {Promise<boolean>} A promise that resolves with true if the path exists, false otherwise.
   */
  async pathExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Asynchronously creates a directory.
   * The `recursive: true` option ensures parent directories are created if they don't exist.
   * Logs and re-throws errors if creation fails.
   * @param {string} dirPath - The path of the directory to create.
   * @returns {Promise<void>} A promise that resolves when the directory has been created.
   * @throws {Error} If creating the directory fails.
   */
  async createDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      this.logger.error(`Error creating directory ${dirPath}:`, error);
      throw error;
    }
  }

  /**
   * Synchronously gets the path to the user's home directory.
   * Uses the `os` module.
   * @returns {string} The user's home directory path.
   */
  getHomeDirectory(): string {
    return os.homedir();
  }

  /**
   * Synchronously resolves a sequence of paths or path segments into an absolute path.
   * Uses the `path` module.
   * @param {...string[]} paths - A sequence of paths or path segments.
   * @returns {string} The resolved absolute path.
   */
  resolvePath(...paths: string[]): string {
    return path.resolve(...paths);
  }

  /**
   * Synchronously joins all given path segments together using the platform-specific separator.
   * Uses the `path` module.
   * @param {...string[]} paths - A sequence of path segments.
   * @returns {string} The joined path.
   */
  joinPath(...paths: string[]): string {
    return path.join(...paths);
  }

  /**
   * Asynchronously ensures that a directory exists. If it doesn't exist, it creates it.
   * @param {string} dirPath - The path of the directory to ensure exists.
   * @returns {Promise<void>} A promise that resolves when the directory exists (or has been created).
   * @throws {Error} If creating the directory fails.
   */
  async ensureDirectoryExists(dirPath: string): Promise<void> {
    const exists = await this.pathExists(dirPath);
    if (!exists) {
      await this.createDirectory(dirPath);
    }
  }
} 