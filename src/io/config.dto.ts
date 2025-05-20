/**
 * Data Transfer Object types for pew.yaml configuration
 */

/**
 * Task-related configuration
 */
export interface TasksConfigDto {
  /**
   * All task files to be managed (default: ["tasks.md"])
   */
  all: string[];
  
  /**
   * Primary task file (default: "tasks.md")
   */
  primary: string;
  
  /**
   * Task file for paste operations (default: "tasks.md")
   */
  paste: string;
}

/**
 * Update-related configuration
 */
export interface UpdatesConfigDto {
  /**
   * Timestamp of the last update check (default: 0)
   */
  lastUpdateCheckTimestamp: number;
}

/**
 * Template configuration for code generation
 */
export interface TemplateConfigDto {
  /**
   * Variables to be replaced in the template
   * These are key-value pairs where the key is the variable name and the value is the default value
   */
  variables?: Record<string, string>;
  
  /**
   * String replacements to apply to file content and filenames
   * These are key-value pairs where the key is the string to find and the value is the replacement
   */
  replacements?: Record<string, string>;
  
  /**
   * Root directory for the template output
   * If not specified, output will be relative to the current directory
   */
  root?: string;
  
  /**
   * List of files to be included in the template
   * These are relative file paths that will be processed during code generation
   */
  files: string[];
}

/**
 * Root configuration DTO for pew.yaml
 */
export interface PewConfigDto {
  /**
   * Task-related configuration
   */
  tasks?: Partial<TasksConfigDto>;

  /**
   * Update-related configuration
   */
  updates?: Partial<UpdatesConfigDto>;
  
  /**
   * Template configurations for code generation
   * Each key is a template name and the value is the template configuration
   */
  templates?: Record<string, TemplateConfigDto>;
}
