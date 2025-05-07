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
}
