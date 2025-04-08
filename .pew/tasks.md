<chatName="pewPewCLI_TypeScript_Setup_Plan"/>
```markdown
# Project Plan: pewPewCLI TypeScript Setup

## 1. Project Overview
- [ ] Read the project overview:
    - This project aims to establish the foundational structure for a new TypeScript version of the `pewPewCLI` tool. The structure will emulate the organization of the `claude-task-master` project. The core objective is to create a runnable TypeScript project with stubbed implementations of essential services identified from the Python `pew-pew-cli` codebase, specifically those required for `init`, `set path`, `paste tasks`, and `next task` functionalities. This includes setting up the project, installing base dependencies, creating the directory structure, and defining basic TypeScript classes/interfaces for the core services.

## 2. Requirements
- [ ] Read the requirements:
    - 👤 **Actors & 🧩 Components**:
        - **[Developer]**: The user initiating and interacting with the CLI.
        - **[System]**: The operating system environment where the CLI runs.
        - **[Node.js]**: The runtime environment for TypeScript/JavaScript.
        - **[npm]**: Node Package Manager for handling dependencies and scripts.
        - **[TypeScript Compiler (tsc)]**: Compiles TypeScript code to JavaScript.
        - **[ts-node]**: Executes TypeScript code directly.
        - **[Commander Library]**: Parses command-line arguments and flags.
        - **[js-yaml Library]**: Parses and serializes YAML configuration files.
        - **[inquirer Library (or similar)]**: Handles interactive user prompts.
        - **[pyperclip Library (Python equivalent)]**: Interacts with the system clipboard (will need a TS equivalent like `clipboardy`).
        - **[FileSystem]**: Represents the underlying file system.
        - **[CLI Application]**: The main executable entry point.
            - **[Command Parser]**: Component responsible for parsing input strings into commands and flags.
            - **[Command Dispatcher]**: Component responsible for routing parsed commands to the correct service.
        - **[Configuration Files]**: YAML files storing settings, paths, secrets, etc.
            - `package.json`: Node.js project configuration and dependencies.
            - `tsconfig.json`: TypeScript compiler options.
            - `.pew/config/settings.yaml`: General settings.
            - `.pew/config/paths.yaml`: File/directory path configurations.
            - `.pew/config/secrets.yaml`: API keys and sensitive information.
            - `.pew/config/aliases.yaml`: Command aliases.
            - `.pew/config/prompts.yaml`: Prompt configurations.
        - **[Task File]**: Markdown file containing tasks (`.pew/tasks.md`).
        - **[Backlog Directory]**: Directory containing backlog markdown files (`.pew/backlog/`).
        - **[Source Code Files]**: TypeScript files containing the application logic.
            - `src/`: Main source code directory.
            - `src/modules/`: Directory for service modules.
            - `tests/`: Directory for test files.
            - `bin/`: Directory for executable CLI scripts.
        - **[Service Stubs (TypeScript)]**: Placeholder implementations for core logic.
            - **[ConfigService]**: Manages loading and saving YAML configurations.
            - **[YamlService]**: Wraps YAML parsing/serialization logic.
            - **[FileSystemService]**: Wraps file system operations.
            - **[UserInputService]**: Handles interactive CLI prompts.
            - **[TaskService]**: Manages task file operations (reading, writing, parsing).
            - **[CliService]**: Orchestrates command execution.
            - **[ClipboardService]**: Handles clipboard interactions.
    - 🎬 **Activities**:
        - **[Developer]**:
            - [Run CLI command]
            - [Provide input to prompts]
        - **[System]**:
            - [Execute Node.js script]
            - [Read environment variables]
            - [Access file system]
            - [Access clipboard]
        - **[npm]**:
            - [Install dependencies]
            - [Run scripts (e.g., build, start)]
        - **[TypeScript Compiler (tsc)]**:
            - [Compile TypeScript to JavaScript]
        - **[ts-node]**:
            - [Execute TypeScript script]
        - **[Commander Library]**:
            - [Parse command-line arguments]
            - [Define commands and options]
            - [Display help messages]
        - **[js-yaml Library]**:
            - [Load YAML data from file/string]
            - [Dump JavaScript object to YAML string]
        - **[inquirer Library]**:
            - [Prompt user for text input]
            - [Prompt user for single selection]
            - [Prompt user for multiple selections]
            - [Prompt user for confirmation]
        - **[ClipboardService]**:
            - [Read text from clipboard]
            - [Write text to clipboard]
        - **[FileSystem]**:
            - [Read file content]
            - [Write file content]
            - [Check if path exists]
            - [Create directory]
            - [List directory contents]
            - [Delete file/directory]
        - **[CLI Application]**:
            - [Initialize project structure (`init`)]
            - [Set configuration value (`set path`)]
            - [Paste content into tasks file (`paste tasks`)]
            - [Advance to next task (`next task`)]
        - **[ConfigService]**:
            - [Load configuration from YAML files]
            - [Save configuration to YAML files]
            - [Get configuration value]
            - [Set configuration value]
            - [Determine local vs. global config path]
        - **[YamlService]**:
            - [Parse YAML string]
            - [Serialize object to YAML string]
        - **[FileSystemService]**:
            - [Read file]
            - [Write file]
            - [Check path existence]
            - [Create directory]
        - **[UserInputService]**:
            - [Ask for confirmation]
            - [Ask for text input]
            - [Ask for single choice]
            - [Ask for multiple choices]
            - [Ask for path input]
        - **[TaskService]**:
            - [Read tasks from file]
            - [Write tasks to file]
            - [Parse task lines]
            - [Find next uncompleted task]
            - [Mark task as complete]
            - [Add content to tasks file] (for paste)
            - [Get task statistics]
        - **[CliService]**:
            - [Parse command string]
            - [Dispatch command to appropriate service]
            - [Handle flags]
            - [Orchestrate `init` command logic]
            - [Orchestrate `set path` command logic]
            - [Orchestrate `paste tasks` command logic]
            - [Orchestrate `next task` command logic]
    - 🌊 **Activity Flows & Scenarios**:
        - **[Initialize Project (`pew init`)]**:
            - GIVEN Developer runs `pew init`
            - WHEN `CliService` receives the command
            - THEN `CliService` checks if `.pew` directory exists
            - AND IF `.pew` exists AND `force` flag is not set THEN `UserInputService` asks for overwrite confirmation
            - AND IF confirmation is denied THEN `CliService` aborts
            - AND `CliService` calls `FileSystemService` to create `.pew` and subdirectories (`config`, `prompts`, `templates`, `.logs`)
            - AND `CliService` calls `FileSystemService` to create default config files (`settings.yaml`, `paths.yaml`, etc.) with basic content (potentially using `ConfigService` or `YamlService` to write defaults)
            - AND `CliService` calls `FileSystemService` to create default `tasks.md`
            - THEN `CliService` outputs success message.
        - **[Set Path (`pew set paths.tasks ./my_tasks.md`)]**:
            - GIVEN Developer runs `pew set paths.tasks ./my_tasks.md`
            - WHEN `CliService` receives the command
            - THEN `CliService` parses the key (`paths.tasks`) and value (`./my_tasks.md`)
            - AND `CliService` determines the target config file (`paths.yaml`) and scope (local/global based on flags)
            - AND `CliService` calls `ConfigService.set_config` with key, value, and scope
            - AND `ConfigService` calls `YamlService` to update the `paths.yaml` file
            - THEN `CliService` outputs success message.
        - **[Paste Tasks (`pew paste tasks`)]**:
            - GIVEN Developer runs `pew paste tasks`
            - WHEN `CliService` receives the command
            - THEN `CliService` calls `ClipboardService` to get clipboard content
            - AND `CliService` calls `ConfigService` to get the tasks file path
            - AND `CliService` calls `FileSystemService` to check if tasks file exists and has content
            - AND IF file has content THEN `CliService` calls `UserInputService` to ask for write mode (overwrite/append/insert)
            - AND `CliService` calls `TaskService` to process/format the clipboard content
            - AND `CliService` calls `FileSystemService` to write the processed content to the tasks file using the selected mode
            - THEN `CliService` outputs success message.
        - **[Next Task (`pew next task`)]**:
            - GIVEN Developer runs `pew next task`
            - WHEN `CliService` receives the command
            - THEN `CliService` calls `ConfigService` to get the tasks file path
            - AND `CliService` calls `TaskService` to read the tasks file
            - AND `TaskService` finds the first uncompleted task
            - AND IF an uncompleted task is found THEN `TaskService` marks it as complete
            - AND `TaskService` writes the updated tasks back to the file via `FileSystemService`
            - AND `TaskService` finds the *next* uncompleted task (which might be the one after the one just completed)
            - AND `TaskService` gets task statistics
            - AND `CliService` displays the next task details and summary statistics
            - ELSE IF no uncompleted task is found THEN `CliService` displays "All tasks complete" message and statistics.
    - 📝 **Properties**:
        - **[ConfigService]**:
            - `localConfigDir: string`
            - `globalConfigDir: string`
            - `settings: object`
            - `paths: object`
            - `secrets: object`
            - `aliases: object`
            - `prompts: object`
        - **[TaskService]**:
            - `tasksFilePath: string` (derived from ConfigService)
        - **[CliService]**:
            - `command: string`
            - `subCommand: string | null`
            - `args: string[]`
            - `flags: object`
        - **[Task]**:
            - `id: number` (implicit line number or generated)
            - `text: string`
            - `isComplete: boolean`
            - `contextHeaders: string[]` (derived from file structure)
    - 🛠️ **Behaviours**:
        - **[CLI Application]**:
            - Should parse commands and flags correctly.
            - Should provide helpful error messages for invalid commands or flags.
            - Should handle user cancellation (Ctrl+C) gracefully during prompts.
        - **[ConfigService]**:
            - Should correctly identify and load local `.pew` config if present, otherwise fall back to global `~/.pew`.
            - Should merge local and global configurations where appropriate (e.g., settings), with local taking precedence.
            - Should handle missing config files gracefully.
        - **[TaskService]**:
            - Should correctly parse markdown task lines (`- [ ]`, `- [x]`).
            - Should handle files with no tasks or only completed tasks.
            - Should correctly identify context headers (`#`, `##`, etc.).
        - **[UserInputService]**:
            - Should provide clear and interactive prompts.
            - Should handle different input types correctly.

## 3. Milestones and Tasks

### Milestone 1: Project Initialization and Dependencies
Set up the basic Node.js/TypeScript project structure and install necessary dependencies.

#### Task: Initialize npm and Install Dependencies
- [x] 1. Initialize the npm project and install base dependencies.
- **Sequence diagram**:
    ```mermaid
    sequenceDiagram
        Developer->>Terminal: npm init -y
        Terminal-->>Developer: Creates package.json
        Developer->>Terminal: npm install typescript ts-node @types/node commander js-yaml @types/js-yaml inquirer @types/inquirer clipboardy --save-dev
        Terminal-->>Developer: Installs dependencies and updates package.json
    ```
- **Files**:
    - **Create**: `package.json`
    - **Update**: `package.json`, `package-lock.json`
    - **Create**: `node_modules/` (implicitly)
- **Classes**: N/A
- **Variables**: N/A
- **Methods**: N/A
- **Process**:
    1. Open a terminal in the root directory for the new `pewPewCLI` project.
    2. Run `npm init -y` to create a default `package.json`.
    3. Run `npm install typescript ts-node @types/node commander js-yaml @types/js-yaml inquirer @types/inquirer clipboardy --save-dev` to install required development dependencies.
    4. Modify `package.json`:
        - Set `"type": "module"` to enable ES Module syntax.
        - Add basic scripts:
          ```json
          "scripts": {
            "build": "tsc",
            "start": "ts-node src/index.ts",
            "dev": "ts-node-dev --respawn src/index.ts" 
          }
          ```
        - (Optional: Add `ts-node-dev` via `npm install ts-node-dev --save-dev` if the dev script is desired).

#### Task: Create tsconfig.json
- [x] 1. Create the `tsconfig.json` file for TypeScript configuration.
- **Sequence diagram**:
    ```mermaid
    sequenceDiagram
        Developer->>FileSystem: Create tsconfig.json
        FileSystem-->>Developer: File created
        Developer->>tsc: (Implicitly) Uses tsconfig.json for compilation
    ```
- **Files**:
    - **Create**: `tsconfig.json`
- **Classes**: N/A
- **Variables**: N/A
- **Methods**: N/A
- **Process**:
    1. Create a file named `tsconfig.json` in the project root.
    2. Add the following basic configuration, enabling ES Modules and setting output/root directories:
      ```json
      {
        "compilerOptions": {
          "target": "ES2022",                     /* Set the JavaScript language version for emitted JavaScript and include compatible library declarations. */
          "module": "NodeNext",                  /* Specify what module code is generated. */
          "moduleResolution": "NodeNext",        /* Specify how TypeScript looks up a file from a given module specifier. */
          "rootDir": "./src",                      /* Specify the root folder within your source files. */
          "outDir": "./dist",                      /* Specify an output folder for all emitted files. */
          "esModuleInterop": true,                 /* Emit additional JavaScript to ease support for importing CommonJS modules. This enables 'allowSyntheticDefaultImports' for type compatibility. */
          "forceConsistentCasingInFileNames": true,/* Ensure that casing is correct in imports. */
          "strict": true,                          /* Enable all strict type-checking options. */
          "skipLibCheck": true,                    /* Skip type checking all .d.ts files. */
          "resolveJsonModule": true,             /* Enable importing .json files */
          "sourceMap": true,                       /* Create source map files for emitted JavaScript files. */
          "declaration": true                      /* Generate .d.ts files from TypeScript and JavaScript files in your project. */
        },
        "include": ["src/**/*"],                   /* Specifies an array of filenames or patterns to include in the program */
        "exclude": ["node_modules", "dist"]        /* Specifies an array of filenames or patterns that should be skipped when resolving include. */
      }
      ```

### Milestone 2: Directory Structure and Core Stubs
Create the necessary directories and stub files for the core services.

#### Task: Create Directory Structure
- [x] 1. Create the basic directory structure for the project.
- **Sequence diagram**:
    ```mermaid
    sequenceDiagram
        Developer->>FileSystem: Create directories (src, src/modules, tests, bin)
        FileSystem-->>Developer: Directories created
    ```
- **Files**:
    - **Create**: `src/`, `src/modules/`, `tests/`, `bin/`
- **Classes**: N/A
- **Variables**: N/A
- **Methods**: N/A
- **Process**:
    1. In the project root, create the following directories:
        - `src`
        - `src/modules`
        - `tests`
        - `bin`

#### Task: Create Core Service Stubs
- [x] 1. Create stub TypeScript files and basic class/interface definitions for core services.
- **Sequence diagram**:
    ```mermaid
    sequenceDiagram
        Developer->>FileSystem: Create src/modules/config.service.ts
        Developer->>FileSystem: Create src/modules/yaml.service.ts
        Developer->>FileSystem: Create src/modules/file-system.service.ts
        Developer->>FileSystem: Create src/modules/user-input.service.ts
        Developer->>FileSystem: Create src/modules/task.service.ts
        Developer->>FileSystem: Create src/modules/cli.service.ts
        Developer->>FileSystem: Create src/modules/clipboard.service.ts
        FileSystem-->>Developer: Files created with basic class/interface stubs
    ```
- **Files**:
    - **Create**: `src/modules/config.service.ts`
    - **Create**: `src/modules/yaml.service.ts`
    - **Create**: `src/modules/file-system.service.ts`
    - **Create**: `src/modules/user-input.service.ts`
    - **Create**: `src/modules/task.service.ts`
    - **Create**: `src/modules/cli.service.ts`
    - **Create**: `src/modules/clipboard.service.ts`
- **Classes**:
    - **Create**: `export class ConfigService {}` (in `config.service.ts`)
    - **Create**: `export class YamlService {}` (in `yaml.service.ts`)
    - **Create**: `export class FileSystemService {}` (in `file-system.service.ts`)
    - **Create**: `export class UserInputService {}` (in `user-input.service.ts`)
    - **Create**: `export class TaskService {}` (in `task.service.ts`)
    - **Create**: `export class CliService {}` (in `cli.service.ts`)
    - **Create**: `export class ClipboardService {}` (in `clipboard.service.ts`)
- **Variables**: N/A
- **Methods**: N/A (Stubs only)
- **Process**:
    1. Navigate to the `src/modules/` directory.
    2. Create the following files with basic class definitions:
        - `config.service.ts`: `export class ConfigService {}`
        - `yaml.service.ts`: `export class YamlService {}`
        - `file-system.service.ts`: `export class FileSystemService {}`
        - `user-input.service.ts`: `export class UserInputService {}`
        - `task.service.ts`: `export class TaskService {}`
        - `cli.service.ts`: `export class CliService {}`
        - `clipboard.service.ts`: `export class ClipboardService {}`
    3. (Optional but recommended) Add basic JSDoc comments to each class indicating its purpose.

### Milestone 3: CLI Entry Point
Create the main entry point for the CLI application.

#### Task: Create CLI Entry Point Script
- [x] 1. Create the main CLI entry point script using `commander`.
- **Sequence diagram**:
    ```mermaid
    sequenceDiagram
        Developer->>FileSystem: Create src/index.ts
        Developer->>FileSystem: Create bin/pew.js
        Developer->>Terminal: chmod +x bin/pew.js
        Developer->>package.json: Add bin entry {"pew": "dist/bin/pew.js"}
        Developer->>Terminal: npm run build
        Developer->>Terminal: npm link (or similar for testing)
        Developer->>Terminal: pew --help
        Terminal-->>Developer: Displays basic help message from commander
    ```
- **Files**:
    - **Create**: `src/index.ts`
    - **Create**: `bin/pew.js`
    - **Update**: `package.json` (add `bin` field and potentially adjust `main` or `exports`)
- **Classes**: N/A
- **Variables**:
    - `program: Command` (in `src/index.ts`, from `commander`)
- **Methods**:
    - `program.command()` (in `src/index.ts`)
    - `program.option()` (in `src/index.ts`)
    - `program.action()` (in `src/index.ts`)
    - `program.parse()` (in `src/index.ts`)
- **Process**:
    1. Create `src/index.ts`.
    2. Import `Command` from `commander`.
    3. Initialize `commander`:
       ```typescript
       import { Command } from 'commander';
       // Potentially import CliService later
       // import { CliService } from './modules/cli.service';

       const program = new Command();

       program
         .name('pew')
         .description('TypeScript pewPewCLI')
         .version('0.0.1'); // Placeholder version

       // TODO: Define commands (init, set, paste, next) later using CliService
       program
         .command('hello')
         .description('A sample command')
         .action(() => {
           console.log('Hello from pewPewCLI (TypeScript)!');
         });

       program.parse(process.argv);

       // Handle case where no command is given
       if (!process.argv.slice(2).length) {
         program.outputHelp();
       }
       ```
    4. Create `bin/pew.js`. This will be the executable file after compilation. It needs to import and run the compiled JavaScript from `dist/src/index.js`.
       ```javascript
       #!/usr/bin/env node
       // bin/pew.js
       // This file will execute the compiled JavaScript code.
       // Adjust the path based on your final build structure in 'dist'.
       import('../dist/src/index.js'); 
       ```
       *Self-correction:* Since we are using ES Modules, the compiled output in `dist` will likely be `.js` files that still use `import`. The shebang script needs to correctly invoke node and import the compiled entry point.
    5. Make the `bin/pew.js` script executable: `chmod +x bin/pew.js`.
    6. Update `package.json` to include the `bin` field:
       ```json
       "bin": {
         "pew": "dist/bin/pew.js" 
       },
       ```
       *Note:* The path `dist/bin/pew.js` assumes `tsc` compiles `bin/pew.js` into the `dist` directory. This might need adjustment based on `tsconfig.json` (`rootDir` vs. how `bin` is handled). A common pattern is to have a separate JS file in `bin` that imports the compiled `dist/src/index.js`. Let's refine `bin/pew.js`:
       ```javascript
       #!/usr/bin/env node
       // bin/pew.js - This JS file runs the compiled TS code
       
       // Dynamically import the compiled entry point from dist
       // Adjust the path if your build output structure is different
       import('../dist/src/index.js') 
         .catch(err => {
           console.error("Failed to load the CLI application:", err);
           process.exit(1);
         });
       ```
       And ensure `src/index.ts` is compiled to `dist/src/index.js`.
    7. Run `npm run build` to compile the TypeScript code.
    8. Test the entry point locally using `npm link` or by running `node dist/src/index.js --help`.
```