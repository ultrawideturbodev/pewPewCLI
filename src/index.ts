import { Command } from 'commander';
// Future imports from service modules will go here
// import { CliService } from './modules/cli.service';

/**
 * Main CLI entry point
 */
const program = new Command();

program
  .name('pew')
  .description('TypeScript pewPewCLI')
  .version('0.0.1'); // Placeholder version

// TODO: Define commands (init, set, paste, next) later using CliService
program
  .command('init')
  .description('Initialize the pewPewCLI project structure')
  .option('-f, --force', 'Force initialization even if .pew directory exists')
  .action(() => {
    console.log('Init command called (stub)');
  });

program
  .command('set <key> <value>')
  .description('Set a configuration value')
  .option('-g, --global', 'Set in global config')
  .action((key, value, options) => {
    console.log(`Set command called with key: ${key}, value: ${value}, global: ${options.global || false} (stub)`);
  });

program
  .command('paste')
  .argument('<target>', 'Target to paste to (e.g., "tasks")')
  .description('Paste clipboard content to a target file')
  .action((target) => {
    console.log(`Paste command called with target: ${target} (stub)`);
  });

program
  .command('next')
  .argument('<itemType>', 'Type of item to advance (e.g., "task")')
  .description('Advance to the next item')
  .action((itemType) => {
    console.log(`Next command called with itemType: ${itemType} (stub)`);
  });

program.parse(process.argv);

// Handle case where no command is given
if (!process.argv.slice(2).length) {
  program.outputHelp();
} 