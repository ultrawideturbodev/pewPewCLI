/**
 * UserInputService
 *
 * Handles interactive CLI prompts using inquirer.
 * Provides methods for various types of user input.
 */
import inquirer from 'inquirer';
import { LoggerService } from '../core/logger.service.js';

/**
 * @class UserInputService
 * @description Provides methods for handling interactive command-line prompts using the inquirer library.
 * Encapsulates different prompt types (text, confirmation, selection, multiple selection).
 */
export class UserInputService {
  private logger: LoggerService;

  /**
   * Initializes the UserInputService.
   */
  constructor() {
    this.logger = LoggerService.getInstance();
  }

  /**
   * Prompts the user for text input.
   *
   * @param {string} message - The message to display to the user.
   * @param {string} [defaultValue] - An optional default value for the input.
   * @returns {Promise<string>} A promise that resolves with the user's input string. Returns defaultValue or empty string on error.
   */
  async askForText(message: string, defaultValue?: string): Promise<string> {
    try {
      const response = await inquirer.prompt([
        {
          type: 'input',
          name: 'value',
          message,
          default: defaultValue,
        },
      ]);
      return response.value;
    } catch (error) {
      this.logger.error('Error during text input:', error);
      return defaultValue || '';
    }
  }

  /**
   * Prompts the user for a yes/no confirmation.
   *
   * @param {string} message - The confirmation message to display.
   * @param {boolean} [defaultValue=false] - The default value (true for yes, false for no).
   * @returns {Promise<boolean>} A promise that resolves with true if the user confirms (yes), false otherwise. Returns defaultValue on error.
   */
  async askForConfirmation(message: string, defaultValue: boolean = false): Promise<boolean> {
    try {
      const response = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'value',
          message,
          default: defaultValue,
        },
      ]);
      return response.value;
    } catch (error) {
      this.logger.error('Error during confirmation prompt:', error);
      return defaultValue;
    }
  }

  /**
   * Prompts the user to select a single option from a list.
   *
   * @template T
   * @param {string} message - The message to display.
   * @param {T[]} choices - An array of choices to present to the user.
   * @returns {Promise<T>} A promise that resolves with the selected choice. Returns the first choice on error.
   */
  async askForSelection<T>(message: string, choices: T[]): Promise<T> {
    try {
      const response = await inquirer.prompt<{ value: T }>([
        {
          type: 'list',
          name: 'value',
          message,
          choices,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any);
      return response.value;
    } catch (error) {
      this.logger.error('Error during selection prompt:', error);
      return choices[0];
    }
  }

  /**
   * Prompts the user to select multiple options from a list using checkboxes.
   *
   * @param {string} message - The message to display.
   * @param {Array<{ name: string, value: string, checked?: boolean }>} choices - An array of choice objects.
   *   Each object should have `name` (display text), `value` (returned value), and optionally `checked` (default selection state).
   * @returns {Promise<string[]>} A promise that resolves with an array of the `value` properties of the selected choices. Returns an empty array on error.
   */
  async askForMultipleSelections(
    message: string,
    choices: Array<{ name: string; value: string; checked?: boolean }>
  ): Promise<string[]> {
    try {
      const response = await inquirer.prompt<{ value: string[] }>([
        {
          type: 'checkbox',
          name: 'value',
          message,
          choices,
        },
      ]);
      return response.value;
    } catch (error) {
      this.logger.error('Error during multiple selection prompt:', error);
      return [];
    }
  }
}
