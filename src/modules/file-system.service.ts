/**
 * FileSystemService
 * 
 * Wraps file system operations to provide consistent error handling and abstractions.
 * Handles reading, writing, and checking files and directories.
 */
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

export class FileSystemService {
  constructor() {
  }

  /**
   * Read a file's contents
   */
  async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Write content to a file
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      console.error(`Error writing file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Check if a path exists (file or directory)
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
   * Create a directory (and parent directories if needed)
   */
  async createDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      console.error(`Error creating directory ${dirPath}:`, error);
      throw error;
    }
  }

  /**
   * Get the user's home directory
   */
  getHomeDirectory(): string {
    return os.homedir();
  }

  /**
   * Resolve path to absolute path
   */
  resolvePath(...paths: string[]): string {
    return path.resolve(...paths);
  }

  /**
   * Join path segments
   */
  joinPath(...paths: string[]): string {
    return path.join(...paths);
  }

  /**
   * Ensure a directory exists, creating it if needed
   */
  async ensureDirectoryExists(dirPath: string): Promise<void> {
    const exists = await this.pathExists(dirPath);
    if (!exists) {
      await this.createDirectory(dirPath);
    }
  }
} 