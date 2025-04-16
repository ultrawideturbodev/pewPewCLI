import chalk from 'chalk';

/**
 * @class LoggerService
 * @description Provides standardized logging methods for the CLI.
 * Uses chalk for basic coloring. (Could be expanded for levels, file logging, etc.)
 */
export class LoggerService {
  private static instance: LoggerService | null = null;

  /**
   * Private constructor for singleton pattern.
   */
  private constructor() {}

  /**
   * Gets the singleton instance of LoggerService.
   * @returns {LoggerService} The singleton instance.
   */
  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  /**
   * Logs a standard informational message.
   * @param {string} message - The message to log.
   */
  public log(message: string): void {
    console.log(message);
  }

  /**
   * Logs a success message (typically with a checkmark).
   * Uses green color.
   * @param {string} message - The message to log.
   */
  public success(message: string): void {
    console.log(chalk.green(message));
  }

  /**
   * Logs an informative message (typically with an info icon).
   * Uses blue color.
   * @param {string} message - The message to log.
   */
    public info(message: string): void {
        console.info(chalk.blue(message));
    }

  /**
   * Logs a warning message.
   * Uses yellow color.
   * @param {string} message - The message to log.
   */
  public warn(message: string): void {
    console.warn(chalk.yellow(message));
  }

  /**
   * Logs an error message.
   * Uses red color.
   * @param {string} message - The message to log.
   * @param {any} [error] - Optional associated error object.
   */
  public error(message: string, error?: any): void {
    console.error(chalk.red(message));
  }

    /**
     * Logs a header for emphasizing sections like the current task.
     * Uses bold text.
     * @param {string} message - The header text.
     */
    public header(message: string): void {
        console.log(chalk.bold(message));
    }

    /**
     * Logs a divider line, often used under headers.
     * @param {number} length - The length of the divider line.
     * @param {string} [char='═'] - The character to use for the divider.
     */
    public divider(length: number, char: string = '═'): void {
        console.log(char.repeat(length));
    }

     /**
     * Logs raw task lines, typically used when displaying task content.
     * No special formatting applied by default.
     * @param {string[]} lines - The lines to log.
     */
    public taskLines(lines: string[]): void {
        lines.forEach(line => console.log(line));
    }
} 