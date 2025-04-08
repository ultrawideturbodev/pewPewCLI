import { Command } from 'commander';
import { CliService } from './modules/cli.service.js';

/**
 * Main CLI entry point
 */
const program = new Command();
const cliService = CliService.getInstance();

program
  .name('pew')
  .description('Command Line Interface for managing tasks and configurations.')
  .version('0.1.1');

// Initialize command
program
  .command('init')
  .description('Initialize the pewPewCLI project structure')
  .option('-f, --force', 'Force initialization even if .pew directory exists')
  .action(async (options) => {
    await cliService.handleInit({ force: options.force || false });
  });

// Set command with path subcommand
program
  .command('set <subcommand>')
  .description('Set a configuration value')
  .option('--field <field>', 'Field to set (e.g., "tasks")')
  .option('--value <value>', 'Value to set')
  .option('-g, --global', 'Set in global config')
  .action(async (subcommand, options) => {
    if (subcommand === 'path') {
      await cliService.handleSetPath(options.field, options.value, { global: options.global || false });
    } else {
      console.error(`Invalid subcommand '${subcommand}' for set. Valid subcommands: path`);
    }
  });

// Paste command
program
  .command('paste')
  .argument('<target>', 'Target to paste to (e.g., "tasks")')
  .description('Paste clipboard content to a target file')
  .option('--overwrite', 'Overwrite the entire tasks file')
  .option('--append', 'Append content to the end of the tasks file')
  .option('--insert', 'Insert content at the beginning of the tasks file')
  .option('--force', 'Force overwrite (alias for --overwrite)')
  .action(async (target, options) => {
    if (target === 'tasks') {
      // Initialize mode
      let mode: 'overwrite' | 'append' | 'insert' | null = null;
      
      // Collect active mode flags
      const modeFlags: string[] = [];
      if (options.overwrite) modeFlags.push('--overwrite');
      if (options.append) modeFlags.push('--append');
      if (options.insert) modeFlags.push('--insert');
      if (options.force) modeFlags.push('--force');
      
      // Check for mutually exclusive flags
      if (modeFlags.length > 1) {
        console.error(`Error: Options ${modeFlags.join(' and ')} are mutually exclusive.`);
        return;
      }
      
      // Determine mode based on flags
      if (options.overwrite || options.force) {
        mode = 'overwrite';
      } else if (options.append) {
        mode = 'append';
      } else if (options.insert) {
        mode = 'insert';
      }
      
      // Call the service method with the determined mode
      await cliService.handlePasteTasks(mode);
    } else {
      console.error(`Invalid target '${target}' for paste. Valid targets: tasks`);
    }
  });

// Next command
program
  .command('next')
  .argument('<itemType>', 'Type of item to advance (e.g., "task")')
  .description('Advance to the next item')
  .action(async (itemType) => {
    if (itemType === 'task') {
      await cliService.handleNextTask();
    } else {
      console.error(`Invalid itemType '${itemType}' for next. Valid types: task`);
    }
  });

program.parse(process.argv);

// Handle case where no command is given
if (!process.argv.slice(2).length) {
  program.outputHelp();
} 