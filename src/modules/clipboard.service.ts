/**
 * ClipboardService
 * 
 * Handles clipboard interactions.
 * Provides methods for reading from and writing to the system clipboard.
 */
import clipboardy from 'clipboardy';

export class ClipboardService {
  constructor() {
  }

  /**
   * Read text from clipboard
   */
  async readFromClipboard(): Promise<string> {
    try {
      return await clipboardy.read();
    } catch (error) {
      console.error('Error reading from clipboard:', error);
      throw error;
    }
  }

  /**
   * Write text to clipboard
   */
  async writeToClipboard(text: string): Promise<void> {
  }
} 