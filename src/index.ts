import { Command } from 'commander';
import { CliService } from './modules/cli.service.js';
import { LoggerService } from './modules/logger.service.js';

/**
 * Main CLI entry point
 */
const program = new Command();
const cliService = CliService.getInstance();
const logger = LoggerService.getInstance();

program
  .name('pew')
  .description('pewPewCLI - agents fav dev tool')
  .version('0.1.3');

program
  .command('init')
  .description('Initialize the pewPewCLI project structure')
  .option('-f, --force', 'Force initialization even if .pew directory exists')
  .action(async (options: { force?: boolean }) => {
    await cliService.handleInit({ force: options.force || false });
  });

program
  .command('set <subcommand>')
  .description('Set a configuration value')
  .option('--field <field>', 'Field to set (e.g., "tasks")')
  .option('--value <value>', 'Value to set')
  .option('-g, --global', 'Set in global config')
  .action(async (subcommand: string, options: { field?: string; value?: string; global?: boolean }) => {
    if (subcommand === 'path') {
      await cliService.handleSetPath(options.field, options.value, { global: options.global || false });
    } else {
      logger.error(`Invalid subcommand '${subcommand}' for set. Valid subcommands: path`);
    }
  });

interface PasteOptions {
  overwrite?: boolean;
  append?: boolean;
  insert?: boolean;
  force?: boolean;
  path?: string;
}

type PasteMode = 'overwrite' | 'append' | 'insert' | null;

program
  .command('paste')
  .argument('<target>', 'Target to paste to (e.g., "tasks")')
  .description('Paste clipboard content to a target file')
  .option('--overwrite', 'Overwrite the entire tasks file')
  .option('--append', 'Append content to the end of the tasks file')
  .option('--insert', 'Insert content at the beginning of the tasks file')
  .option('--path <value>', 'Specify the target file path, overriding config')
  .option('--force', 'Force overwrite (alias for --overwrite)')
  .action(async (target: string, options: PasteOptions) => {
    if (target === 'tasks') {
      const modeFlags: { flag: PasteMode, value: boolean | undefined }[] = [
        { flag: 'overwrite', value: options.overwrite || options.force },
        { flag: 'append', value: options.append },
        { flag: 'insert', value: options.insert },
      ];

      const activeModes = modeFlags.filter(f => f.value);

      if (activeModes.length > 1) {
        const flagNames = activeModes.map(f => `--${f.flag}`);
        if (options.force && !options.overwrite && activeModes.some(f => f.flag !== 'overwrite')) {
          flagNames.push('--force');
        }
        logger.error(`Error: Options ${flagNames.join(' and ')} are mutually exclusive.`);
        return;
      }

      const mode: PasteMode = activeModes.length === 1 ? activeModes[0].flag : null;

      await cliService.handlePasteTasks(mode, { path: options.path });
    } else {
      logger.error(`Invalid target '${target}' for paste. Valid targets: tasks`);
    }
  });

program
  .command('next')
  .argument('<itemType>', 'Type of item to advance (e.g., "task")')
  .description('Advance to the next item')
  .action(async (itemType: string) => {
    if (itemType === 'task') {
      await cliService.handleNextTask();
    } else {
      logger.error(`Invalid itemType '${itemType}' for next. Valid types: task`);
    }
  });

program
  .command('update')
  .description('Check for updates and install the latest version of pew-pew-cli')
  .action(async () => {
    await cliService.handleUpdate(); 
  });

program
  .command('reset <target>')
  .description('Uncheck all completed tasks in specified task files')
  .action(async (target: string) => {
    if (target === 'tasks') {
      await cliService.handleResetTasks();
    } else {
      logger.error(`Invalid target '${target}' for reset. Valid targets: tasks`);
      process.exit(1);
    }
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
} 