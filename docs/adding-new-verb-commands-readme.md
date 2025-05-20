# Adding New Verb Commands to pew-pew-cli

This document provides guidelines for AI agents working on the pew-pew-cli project who need to implement new verb commands. The pew-pew-cli follows a verb-first command structure for its CLI interface.

## What is "Verb-First" Command Structure?

In pew-pew-cli, commands follow this pattern:

```
pew <verb> [subcommand] [options]
```

Where:
- `pew` is the CLI tool name
- `<verb>` is the primary action (like "init", "set", "paste", "next", "reset", "update")
- `[subcommand]` is an optional specifier for the verb (max 1 subcommand allowed)
- `[options]` are flags and parameters that modify the command behavior

Examples:
- `pew init`
- `pew set path --field tasks --value path/to/tasks.md`
- `pew paste tasks --append`
- `pew next task`

## How to Add a New Verb Command

Follow these steps to add a new verb command to the pew-pew-cli:

### Step 1: Define the Command in src/index.ts

All commands are registered in `src/index.ts` using Commander.js. Add your new command following this pattern:

```typescript
program
  .command('your-verb')
  .description('Clear description of what the command does')
  .option('-f, --flag', 'Description of this flag')
  .option('--option <value>', 'Description of this option')
  .action(async (options: YourOptionsInterface) => {
    await cliService.handleYourVerb(options);
  });
```

If your command requires a subcommand:

```typescript
program
  .command('your-verb')
  .argument('<subcommand>', 'Description of the subcommand parameter')
  .description('Clear description of what the command does')
  .option('--option <value>', 'Description of this option')
  .action(async (subcommand: string, options: YourOptionsInterface) => {
    if (subcommand === 'allowed-subcommand') {
      await cliService.handleYourVerb(options);
    } else {
      logger.error(`Invalid subcommand '${subcommand}' for your-verb. Valid subcommands: allowed-subcommand`);
    }
  });
```

### Step 2: Create a Handler Method in CliService

In `src/core/cli.service.ts`, implement a handler method for your new command:

```typescript
/**
 * Handles the logic for your-verb command.
 * 
 * @param {YourOptionsInterface} options - Options passed to the command
 * @returns {Promise<void>} A promise that resolves when the operation is complete
 */
async handleYourVerb(options: YourOptionsInterface): Promise<void> {
  try {
    // Initialize configuration if needed
    await this.configService.initialize();
    
    // Command implementation
    // ...
    
    // Success message
    this.logger.success('Operation completed successfully.');
    
    // Optional background update check
    try {
      await this.updateService.runUpdateCheckAndNotify();
    } catch (updateError: unknown) {
      this.logger.warn(
        `Background update check failed: ${updateError instanceof Error ? updateError.message : String(updateError)}`
      );
    }
  } catch (error) {
    this.logger.error('Error during your-verb operation:', error);
  }
}
```

### Step 3: Create Supporting Service Methods

If your command requires specific functionality, implement the necessary methods in the appropriate service classes.

For example, if your command deals with tasks, add methods to the `TaskService`. If it deals with file operations, use the `FileSystemService`.

### Step 4: Add Documentation

Update the following files to document your new command:
- `README.md`: Add to the Commands section
- `CLAUDE.md`: Add to the CLI Commands section

### Step 5: Write Tests

Create unit tests for your command in the `tests/unit` directory:
- Test the handler method in CliService
- Test any supporting service methods

## Best Practices for Verb Commands

1. **Clear Naming**: Choose a verb that clearly describes the action (e.g., "init", "set", "paste").

2. **Single Responsibility**: Each verb command should do one thing well.

3. **Consistent Pattern**: Follow the established patterns:
   - Initialize ConfigService at the beginning
   - Use try/catch blocks for error handling
   - Log success messages on completion
   - Run an update check in the background if appropriate

4. **User Experience**:
   - Provide helpful error messages
   - Display progress and success messages using the LoggerService
   - Support both CLI options and interactive prompts for required parameters

5. **Documentation**: Thoroughly document all parameters and behavior in JSDoc comments.

## Examples of Existing Verb Commands

1. **init**: Initialize the pewPewCLI project structure
   ```
   pew init [--force]
   ```

2. **set**: Set configuration values
   ```
   pew set path --field tasks --value path/to/tasks.md [--global]
   ```

3. **paste**: Paste clipboard content
   ```
   pew paste tasks [--overwrite|--append|--insert] [--path <path>]
   ```

4. **next**: Move to the next task
   ```
   pew next task
   ```

5. **reset**: Reset completed tasks
   ```
   pew reset tasks
   ```

6. **update**: Check for and install updates
   ```
   pew update
   ```

## Command Service Lifecycle

When implementing a new verb command, ensure you follow this general workflow:

1. Parse and validate command line arguments
2. Initialize configuration if needed
3. Perform the main operation
4. Display appropriate success/error messages
5. (Optional) Run background update check

By following these guidelines, you'll create consistent, user-friendly commands that integrate well with the existing pew-pew-cli architecture.