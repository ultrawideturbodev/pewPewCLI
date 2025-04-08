/**
 * UserInputService
 * 
 * Handles interactive CLI prompts using inquirer.
 * Provides methods for various types of user input.
 */
import inquirer from 'inquirer';

export class UserInputService {
  constructor() {
    // Initialize service
  }

  /**
   * Ask for text input
   */
  async askForText(message: string, defaultValue?: string): Promise<string> {
    try {
      const response = await inquirer.prompt([
        {
          type: 'input',
          name: 'value',
          message,
          default: defaultValue
        }
      ]);
      return response.value;
    } catch (error) {
      console.error('Error during text input:', error);
      // If canceled, return empty string or default
      return defaultValue || '';
    }
  }

  /**
   * Ask for confirmation (yes/no)
   */
  async askForConfirmation(message: string, defaultValue: boolean = false): Promise<boolean> {
    try {
      const response = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'value',
          message,
          default: defaultValue
        }
      ]);
      return response.value;
    } catch (error) {
      console.error('Error during confirmation prompt:', error);
      return defaultValue;
    }
  }

  /**
   * Ask for path input
   */
  async askForPath(message: string, defaultValue?: string): Promise<string> {
    try {
      const response = await inquirer.prompt([
        {
          type: 'input',
          name: 'value',
          message,
          default: defaultValue
        }
      ]);
      return response.value;
    } catch (error) {
      console.error('Error during path input:', error);
      return defaultValue || '';
    }
  }

  /**
   * Ask for selection from a list of choices
   */
  async askForSelection<T>(message: string, choices: T[]): Promise<T> {
    try {
      const response = await inquirer.prompt([
        {
          type: 'list',
          name: 'value',
          message,
          choices
        }
      ]);
      return response.value;
    } catch (error) {
      console.error('Error during selection prompt:', error);
      return choices[0];
    }
  }

  /**
   * Ask for multiple selections from a list of choices
   */
  async askForMultipleSelections<T>(message: string, choices: T[]): Promise<T[]> {
    try {
      const response = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'value',
          message,
          choices
        }
      ]);
      return response.value;
    } catch (error) {
      console.error('Error during multiple selection prompt:', error);
      return [];
    }
  }
} 