# Adding Subcommands to pew-pew-cli

This document provides guidance for AI agents working on the pew-pew-cli project who need to implement subcommands. In pew-pew-cli, each verb command can have at most one subcommand to maintain simplicity and consistency.

## Subcommand Structure in pew-pew-cli

pew-pew-cli follows a strict command structure:

```
pew <verb> [subcommand] [options]
```

Where:
- **verb**: The primary action (e.g., "set", "paste", "next")
- **subcommand**: A single specifier for the verb (required for some verbs, optional for others)
- **options**: Flags and parameters that modify the command behavior

Key principles:
1. **Maximum one subcommand**: Unlike tools with nested subcommands, pew-pew-cli allows at most one subcommand level
2. **Subcommand specifies scope**: Subcommands indicate what the verb acts upon

Examples:
- `pew set path --field tasks --value path/to/tasks.md`
- `pew paste tasks --append`
- `pew next task`
- `pew reset tasks`

## How to Add a Subcommand to an Existing Verb

Follow these steps to add a subcommand to an existing verb command:

### Step 1: Modify the Command Registration in src/index.ts

When a verb requires a subcommand, use Commander's `.argument()` method:

```typescript
program
  .command('existing-verb')
  .argument('<subcommand>', 'Description of what the subcommand specifies')
  .description('Description of what the verb does')
  .option('--option <value>', 'Description of the option')
  .action(async (subcommand: string, options: YourOptionsInterface) => {
    if (subcommand === 'existing-subcommand') {
      await cliService.handleExistingVerb(options);
    } else if (subcommand === 'new-subcommand') { // Add your new subcommand
      await cliService.handleExistingVerbWithNewSubcommand(options);
    } else {
      logger.error(`Invalid subcommand '${subcommand}' for existing-verb. Valid subcommands: existing-subcommand, new-subcommand`);
    }
  });
```

### Step 2: Add a Handler Method in CliService

In `src/core/cli.service.ts`, implement a handler method for the new subcommand:

```typescript
/**
 * Handles the existing-verb command with the new-subcommand.
 * 
 * @param {YourOptionsInterface} options - Options passed to the command
 * @returns {Promise<void>} A promise that resolves when the operation is complete
 */
async handleExistingVerbWithNewSubcommand(options: YourOptionsInterface): Promise<void> {
  try {
    // Command implementation for the new subcommand
    // ...
    
    this.logger.success('Operation completed successfully.');
  } catch (error) {
    this.logger.error('Error during existing-verb with new-subcommand operation:', error);
  }
}
```

### Step 3: Create a New Verb with Subcommand

If you're creating a brand new verb that requires a subcommand:

```typescript
program
  .command('new-verb')
  .argument('<subcommand>', 'Description of the subcommand parameter')
  .description('Description of what the new verb does')
  .option('--option <value>', 'Description of the option')
  .action(async (subcommand: string, options: YourOptionsInterface) => {
    if (subcommand === 'allowed-subcommand') {
      await cliService.handleNewVerbWithSubcommand(options);
    } else {
      logger.error(`Invalid subcommand '${subcommand}' for new-verb. Valid subcommands: allowed-subcommand`);
    }
  });
```

## Examples of Verbs with Subcommands

### 1. The "set" verb with "path" subcommand

```typescript
program
  .command('set <subcommand>')
  .description('Set a configuration value')
  .option('--field <field>', 'Field to set (e.g., "tasks")')
  .option('--value <value>', 'Value to set')
  .option('-g, --global', 'Set in global config')
  .action(
    async (subcommand: string, options: { field?: string; value?: string; global?: boolean }) => {
      if (subcommand === 'path') {
        await cliService.handleSetPath(options.field, options.value, {
          global: options.global || false,
        });
      } else {
        logger.error(`Invalid subcommand '${subcommand}' for set. Valid subcommands: path`);
      }
    }
  );
```

### 2. The "paste" verb with "tasks" subcommand

```typescript
program
  .command('paste')
  .argument('<target>', 'Target to paste to (e.g., "tasks")')
  .description('Paste clipboard content to a target file')
  .option('--overwrite', 'Overwrite the entire tasks file')
  .option('--append', 'Append content to the end of the tasks file')
  .option('--insert', 'Insert content at the beginning of the tasks file')
  .option('--path <value>', 'Specify the target file path, overriding config')
  .action(async (target: string, options: PasteOptions) => {
    if (target === 'tasks') {
      // Handle paste tasks
      await cliService.handlePasteTasks(mode, { path: options.path });
    } else {
      logger.error(`Invalid target '${target}' for paste. Valid targets: tasks`);
    }
  });
```

### 3. The "next" verb with "task" subcommand

```typescript
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
```

## Best Practices for Subcommands

1. **Use Meaningful Names**: Choose subcommand names that clearly indicate what the verb acts upon.

2. **Validate Subcommands**: Always check if the supplied subcommand is valid and provide helpful error messages if not.

3. **Limited Choices**: Keep the number of subcommands for any verb small and focused.

4. **Consistent Pattern**: Follow the pattern established in existing commands:
   - Subcommands are validated before processing
   - Error messages indicate all valid subcommands

5. **Future-Proofing**: Implement the validation for the subcommand even if there's only one valid subcommand at the moment, to make adding new subcommands easier in the future.

6. **Documentation**: Update all relevant documentation when adding or modifying subcommands.

## Subcommand Handler Implementation Guidelines

When implementing handlers for subcommands:

1. Use descriptive method names that indicate both the verb and subcommand (e.g., `handleSetPath`, `handlePasteTasks`)

2. Follow the same pattern for all handlers:
   ```typescript
   async handle<Verb><Subcommand>(options: OptionsType): Promise<void> {
     try {
       // Initialize config if needed
       await this.configService.initialize();
       
       // Validate options and provide interactive prompts if needed
       
       // Perform the command's core functionality
       
       // Log success
       this.logger.success('Operation completed successfully.');
     } catch (error) {
       this.logger.error('Error during operation:', error);
     }
   }
   ```

3. Ensure proper error handling and user feedback

By following these guidelines, you'll maintain the consistent and straightforward command structure of pew-pew-cli while adding new functionality.