/**
 * @class YamlService
 * @description Provides utility methods for parsing and serializing YAML data.
 * Interacts with the FileSystemService to read from and write to YAML files.
 */
import yaml from 'js-yaml';
import { FileSystemService } from './file-system.service.js';
import { LoggerService } from '../core/logger.service.js';

export class YamlService {
  private fileSystemService: FileSystemService;
  private logger: LoggerService;

  /**
   * Constructor for YamlService.
   * @param {FileSystemService} fileSystemService - Instance of FileSystemService.
   */
  constructor(fileSystemService: FileSystemService) {
    this.fileSystemService = fileSystemService;
    this.logger = LoggerService.getInstance();
  }

  /**
   * Parses a YAML string into a JavaScript object.
   * Handles empty or invalid input gracefully.
   *
   * @param {string} yamlString - The YAML string to parse.
   * @returns {Record<string, unknown>} The parsed JavaScript object, or an empty object if parsing fails or input is empty.
   */
  parseYaml(yamlString: string): Record<string, unknown> {
    try {
      if (!yamlString || yamlString.trim() === '') {
        return {};
      }
      return (yaml.load(yamlString) as Record<string, unknown>) || {};
    } catch (error: unknown) {
      this.logger.error('Error parsing YAML:', error);
      return {};
    }
  }

  /**
   * Serializes a JavaScript object into a YAML string.
   * Handles null or undefined input gracefully.
   *
   * @template T - Type of the object to serialize
   * @param {T} data - The JavaScript object to serialize.
   * @returns {string} The resulting YAML string, or an empty string if serialization fails.
   */
  serializeToYaml<T>(data: T): string {
    try {
      return yaml.dump(data || {});
    } catch (error: unknown) {
      this.logger.error('Error serializing to YAML:', error);
      return '';
    }
  }

  /**
   * Reads a YAML file from the specified path and parses its content.
   * Checks if the file exists before attempting to read.
   *
   * @param {string} filePath - The absolute path to the YAML file.
   * @returns {Promise<Record<string, unknown>>} A promise that resolves with the parsed JavaScript object.
   *   Returns an empty object if the file doesn't exist or if reading/parsing fails.
   */
  async readYamlFile(filePath: string): Promise<Record<string, unknown>> {
    try {
      const exists = await this.fileSystemService.pathExists(filePath);
      if (!exists) {
        return {};
      }

      const content = await this.fileSystemService.readFile(filePath);
      return this.parseYaml(content);
    } catch (error: unknown) {
      this.logger.error(`Error reading YAML file ${filePath}:`, error);
      return {};
    }
  }

  /**
   * Serializes a JavaScript object and writes it to a YAML file at the specified path.
   * Overwrites the file if it already exists.
   *
   * @template T - Type of the object to write
   * @param {string} filePath - The absolute path where the YAML file should be written.
   * @param {T} data - The JavaScript object to serialize and write.
   * @returns {Promise<void>} A promise that resolves when the file has been written.
   * @throws {Error} If serialization or file writing fails.
   */
  async writeYamlFile<T>(filePath: string, data: T): Promise<void> {
    try {
      const yamlContent = this.serializeToYaml(data);
      await this.fileSystemService.writeFile(filePath, yamlContent);
    } catch (error: unknown) {
      this.logger.error(`Error writing YAML file ${filePath}:`, error);
      throw error;
    }
  }
}
