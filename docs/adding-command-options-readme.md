# Adding Command Options to pew-pew-cli

This document provides comprehensive guidance for AI agents working on the pew-pew-cli project who need to implement command options. pew-pew-cli follows a specific approach for command options that ensures flexibility and user-friendliness.

## Command Options in pew-pew-cli

Options in pew-pew-cli are parameters that modify the behavior of a command. They follow this pattern:

```
pew <verb> [subcommand] [--option <value>] [--flag]
```

Where:
- **--option \<value\>**: An option that requires a value
- **--flag**: A boolean flag that doesn't require a value

There are two categories of options in pew-pew-cli:
1. **Required options**: Options that must be provided for the command to work
2. **Optional options**: Options that have defaults or can be omitted

A key principle of pew-pew-cli is that all configurable parameters should be options/flags rather than positional arguments.

## Interactive Flow for Missing Required Options

When a user runs a command without all required options, pew-pew-cli will prompt for the missing values interactively. This ensures a good user experience while maintaining the flexibility of command-line usage.

For example:
- Command with all options: `pew set path --field tasks --value path/to/tasks.md`
- Command with missing options: `pew set path` (will prompt for field and value)

## How to Add Options to Commands

### Step 1: Define Options in the Command Registration

When registering a command in `src/index.ts`, define the options using Commander.js:

```typescript
program
  .command('your-verb')
  .description('Description of what the command does')
  .option('--required-option <value>', 'Description of required option')
  .option('--optional-option <value>', 'Description of optional option')
  .option('-f, --flag', 'Description of a boolean flag')
  .action(async (options: YourOptionsInterface) => {
    await cliService.handleYourVerb(options);
  });
```

Define the TypeScript interface for your options:

```typescript
interface YourOptionsInterface {
  requiredOption?: string;
  optionalOption?: string;
  flag?: boolean;
}
```

### Step 2: Handle Required Options in the Handler Method

In the handler method in `src/core/cli.service.ts`, check for required options and prompt if missing:

```typescript
async handleYourVerb(options: YourOptionsInterface): Promise<void> {
  try {
    // Check for required options
    let finalRequiredOption = options.requiredOption;
    if (!finalRequiredOption) {
      // Prompt for missing required option
      finalRequiredOption = await this.userInputService.askForText(
        'Enter value for required-option:'
      );
    }
    
    // If still missing or invalid, abort
    if (!finalRequiredOption || finalRequiredOption.trim() === '') {
      this.logger.error('Required option is missing. Aborting.');
      return;
    }
    
    // Use optional options with defaults
    const finalOptionalOption = options.optionalOption || 'default value';
    
    // Use boolean flags directly
    const flagEnabled = options.flag || false;
    
    // Command implementation using options
    // ...
    
    this.logger.success('Operation completed successfully.');
  } catch (error) {
    this.logger.error('Error during your-verb operation:', error);
  }
}
```

## Examples of Option Handling in pew-pew-cli

### 1. Required Options with Prompts - "set path" command

```typescript
async handleSetPath(
  field?: string,
  value?: string,
  flags: { global: boolean } = { global: false }
): Promise<void> {
  let finalField = field;
  if (!finalField) {
    finalField = await this.userInputService.askForText('Enter field to set (e.g., tasks):');
  }

  if (finalField !== 'tasks') {
    this.logger.error(`Invalid field '${finalField}' for set path. Only 'tasks' is supported.`);
    return;
  }

  let finalValue = value;
  if (!finalValue) {
    finalValue = await this.userInputService.askForText(`Enter value for ${finalField}:`);
  }

  if (typeof finalValue !== 'string' || finalValue.trim() === '') {
    this.logger.error(`Invalid value provided for ${finalField}. Aborting.`);
    return;
  }

  // Command implementation
  await this.configService.initialize();
  await this.configService.setTasksPaths([finalValue], flags.global);

  // Success message
  this.logger.success(
    `Set ${finalField} to ${finalValue} successfully in ${flags.global ? 'global' : 'local'} pew.yaml.`
  );
}
```

### 2. Multiple Exclusive Options - "paste tasks" command

```typescript
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
      const modeFlags: { flag: PasteMode; value: boolean | undefined }[] = [
        { flag: 'overwrite', value: options.overwrite || options.force },
        { flag: 'append', value: options.append },
        { flag: 'insert', value: options.insert },
      ];

      const activeModes = modeFlags.filter((f) => f.value);

      if (activeModes.length > 1) {
        const flagNames = activeModes.map((f) => `--${f.flag}`);
        if (
          options.force &&
          !options.overwrite &&
          activeModes.some((f) => f.flag !== 'overwrite')
        ) {
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
```

### 3. Interactive Selection for Missing Option

```typescript
async handlePasteTasks(
  mode: 'overwrite' | 'append' | 'insert' | null = null,
  options: { path?: string } = {}
): Promise<void> {
  try {
    // ...

    let finalMode = mode;
    if (finalMode === null) {
      finalMode = await this.userInputService.askForSelection<'overwrite' | 'append' | 'insert'>(
        'Choose paste mode:',
        ['overwrite', 'append', 'insert']
      );
    }

    // ...
  } catch (error) {
    this.logger.error('Error during paste tasks operation:', error);
  }
}
```

## Types of User Prompts for Missing Options

pew-pew-cli provides several methods for prompting users for missing options:

1. **Text Input** (`askForText`): For options that require a string value
   ```typescript
   const value = await this.userInputService.askForText('Prompt message:', defaultValue);
   ```

2. **Confirmation** (`askForConfirmation`): For yes/no questions
   ```typescript
   const confirmed = await this.userInputService.askForConfirmation('Are you sure?', defaultValue);
   ```

3. **Selection** (`askForSelection`): For choosing from a list of options
   ```typescript
   const selected = await this.userInputService.askForSelection('Choose an option:', ['option1', 'option2']);
   ```

4. **Multiple Selection** (`askForMultipleSelections`): For choosing multiple items
   ```typescript
   const selected = await this.userInputService.askForMultipleSelections('Select items:', [
     { name: 'Display Name 1', value: 'value1', checked: true },
     { name: 'Display Name 2', value: 'value2', checked: false }
   ]);
   ```

## Best Practices for Command Options

1. **Option Naming Conventions**:
   - Use `--kebab-case` for option names
   - Use `-s, --long-name` for short and long aliases (when appropriate)
   - Boolean flags should not require values (e.g., `--force`)
   - Value options should have descriptive placeholder (e.g., `--field <fieldName>`)

2. **Validation**:
   - Always validate required options even if provided via CLI
   - Provide clear error messages for invalid options

3. **Interactive Prompts**:
   - Use appropriate prompt type for each option
   - Provide helpful default values when possible
   - Show the prompt message in a way that makes clear what's being asked

4. **Documentation**:
   - Document all options in the command description
   - Include examples in the README

5. **Implementation**:
   - Check for the presence of options before prompting
   - Use consistent patterns for handling options across commands
   - Consider the logical flow for the user when ordering prompts

By following these guidelines, you'll create a consistent and user-friendly command-line experience that works well with both direct command-line usage and interactive prompts.