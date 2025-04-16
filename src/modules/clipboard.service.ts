import clipboardy from 'clipboardy';
import { LoggerService } from './logger.service.js';

/**
 * @class ClipboardService
 * @description Provides simple interactions with the system clipboard.
 * Currently supports reading text content.
 */
export class ClipboardService {
  private logger: LoggerService;

  /**
   * Constructor for ClipboardService.
   * Initializes the logger instance.
   */
  constructor() {
    this.logger = LoggerService.getInstance();
  }

  /**
   * Reads text content from the system clipboard.
   * Uses the `clipboardy` library.
   * Logs and re-throws errors if reading fails.
   * @returns {Promise<string>} A promise that resolves with the text content of the clipboard.
   * @throws {Error} If reading from the clipboard fails.
   */
  async readFromClipboard(): Promise<string> {
    try {
      return await clipboardy.read();
    } catch (error) {
      this.logger.error('Error reading from clipboard:', error);
      throw error;
    }
  }
}