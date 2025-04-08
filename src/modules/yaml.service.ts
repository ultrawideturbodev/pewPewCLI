/**
 * YamlService
 * 
 * Handles YAML parsing and serialization.
 * Provides methods for reading and writing YAML files.
 */
import yaml from 'js-yaml';
import { FileSystemService } from './file-system.service.js';

export class YamlService {
  private fileSystemService: FileSystemService;

  constructor() {
    this.fileSystemService = new FileSystemService();
  }

  /**
   * Parse YAML string to JavaScript object
   */
  parseYaml(yamlString: string): Record<string, any> {
    try {
      if (!yamlString || yamlString.trim() === '') {
        return {};
      }
      return yaml.load(yamlString) as Record<string, any> || {};
    } catch (error) {
      console.error('Error parsing YAML:', error);
      return {};
    }
  }

  /**
   * Serialize JavaScript object to YAML string
   */
  serializeToYaml(data: Record<string, any>): string {
    try {
      return yaml.dump(data || {});
    } catch (error) {
      console.error('Error serializing to YAML:', error);
      return '';
    }
  }

  /**
   * Read YAML file and parse its content
   */
  async readYamlFile(filePath: string): Promise<Record<string, any>> {
    try {
      const exists = await this.fileSystemService.pathExists(filePath);
      if (!exists) {
        return {};
      }
      
      const content = await this.fileSystemService.readFile(filePath);
      return this.parseYaml(content);
    } catch (error) {
      console.error(`Error reading YAML file ${filePath}:`, error);
      return {};
    }
  }

  /**
   * Write data to a YAML file
   */
  async writeYamlFile(filePath: string, data: Record<string, any>): Promise<void> {
    try {
      const yamlContent = this.serializeToYaml(data);
      await this.fileSystemService.writeFile(filePath, yamlContent);
    } catch (error) {
      console.error(`Error writing YAML file ${filePath}:`, error);
      throw error; // Rethrow to allow caller to handle the error
    }
  }
} 