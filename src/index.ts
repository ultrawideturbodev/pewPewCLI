import { Command } from 'commander';
import { CliService } from './modules/cli.service.js';

/**
 * Main CLI entry point
 */
const program = new Command();
const cliService = CliService.getInstance();

program
  .name('pew')
  .description('TypeScript pewPewCLI')
  .version('0.0.1'); // Placeholder version

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
  .action(async (target) => {
    if (target === 'tasks') {
      await cliService.handlePasteTasks();
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