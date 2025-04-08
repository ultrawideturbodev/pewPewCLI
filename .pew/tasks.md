<chatName="pew-ts-config-init-set-plan"/>
```markdown
# Project Plan: PewTS Config Init/Set Path

## 1. Project Overview
This project aims to implement the core configuration management for the `tasks` path within the TypeScript version of `pew-pew-cli`. This involves replicating and adapting the logic from the Python version for initializing the project (`pew init`) and setting the tasks path (`pew set path`), including handling local and global configurations stored in `paths.yaml`. The end goal is to have a functional `ConfigService` that can read and write the tasks path list to the correct YAML file (local `.pew/config/paths.yaml` or global `~/.pew/config/paths.yaml`), an `Init` command that sets up the default or user-specified initial tasks path locally, and a `Set Path` command that allows overwriting the tasks path list locally or globally.

- [ ] Read the project overview:
    - Implement `pew init` to create `.pew/config/paths.yaml` with a default or user-specified tasks path list (e.g., `tasks: ['.pew/tasks.md']`). `init` is always local.
    - Implement `pew set path --field tasks --value <path>` to overwrite the `tasks` list in local or global `paths.yaml`.
    - Create necessary services (`ConfigService`, `YamlService`, `FileSystemService`, `UserInputService`) in TypeScript.
    - Use `js-yaml` for YAML handling.
    - Use basic text input for path prompts in `UserInputService`.

## 2. Requirements
Overview of all requirements.
- [ ] Read the requirements:
    - 👤 Actors & 🧩 Components:
        - **Actors:**
            - [User] (Interacts with the CLI)
            - [Developer] (Maintains the CLI)
        - **Components:**
            - [PewCLI] (The command-line application itself)
                - [Command] (Represents a CLI command like 'init' or 'set')
                    - [InitCommand]
                    - [SetCommand]
                        - [PathSubCommand]
                - [Flag] (Command-line options like --force, --field, --value, --global)
                    - [ForceFlag]
                    - [FieldFlag]
                    - [ValueFlag]
                    - [GlobalFlag]
                - [CliService] (Parses commands/flags, orchestrates execution)
                - [ConfigService] (Manages loading/saving configurations)
                - [YamlService] (Handles YAML parsing/serialization)
                - [FileSystemService] (Handles file system operations)
                - [UserInputService] (Handles interactive prompts)
                - [ConfigFile] (YAML files storing configuration)
                    - [LocalPathsConfig] (`.pew/config/paths.yaml`)
                    - [GlobalPathsConfig] (`~/.pew/config/paths.yaml`)
                - [TaskFile] (The markdown file(s) containing tasks, e.g., `.pew/tasks.md`)
                - [PewDirectory] (The `.pew` directory in the project or home directory)
                    - [LocalPewDirectory] (`./.pew`)
                    - [GlobalPewDirectory] (`~/.pew`)
                - [Console] (Output interface for messages, errors, prompts)
                - [Process] (The running Node.js process)
                    - [Arguments] (Command line arguments `process.argv`)
                    - [Environment] (Environment variables like `HOME`)
    - 🎬 Activities: Specify what actions need to be performed.
        - [User]
            - [Execute PewCLI command]
            - [Provide input to prompts]
            - [Specify command-line flags]
        - [PewCLI]
            - [Parse command-line arguments]
            - [Dispatch command to CliService]
            - [Output messages to Console]
            - [Output errors to Console]
            - [Exit process]
        - [CliService]
            - [Parse command and flags]
            - [Identify required flags]
            - [Request missing flags via UserInputService]
            - [Call ConfigService to get/set config]
            - [Call FileSystemService to manage files/dirs]
            - [Handle InitCommand logic]
            - [Handle SetCommand logic]
        - [ConfigService]
            - [Find local PewDirectory]
            - [Determine local config path]
            - [Determine global config path]
            - [Load YAML config file] (using YamlService)
            - [Save YAML config file] (using YamlService)
            - [Get tasks path list]
            - [Set tasks path list] (local or global)
            - [Ensure default directories exist] (using FileSystemService)
        - [YamlService]
            - [Parse YAML string to object] (using js-yaml)
            - [Serialize object to YAML string] (using js-yaml)
            - [Read YAML file content] (using FileSystemService)
            - [Write YAML file content] (using FileSystemService)
        - [FileSystemService]
            - [Read file content]
            - [Write file content]
            - [Check if path exists]
            - [Check if path is directory]
            - [Create directory]
            - [Get absolute path]
            - [Get home directory]
        - [UserInputService]
            - [Ask for text input] (for paths, flag values)
            - [Ask for confirmation] (for overwrite)
        - [InitCommand]
            - [Check for existing LocalPewDirectory]
            - [Request overwrite confirmation if exists and no ForceFlag]
            - [Create LocalPewDirectory and subdirectories]
            - [Request task path via UserInputService if interactive]
            - [Save default or user-provided task path to LocalPathsConfig]
            - [Create default TaskFile if it doesn't exist]
        - [SetCommand]
            - [Identify target field (e.g., 'tasks')]
            - [Identify value (e.g., '/path/to/file.md')]
            - [Identify scope (local or global via GlobalFlag)]
            - [Load appropriate ConfigFile]
            - [Overwrite tasks list in ConfigFile]
            - [Save updated ConfigFile]
    - 🌊 Activity Flows & Scenarios: Break down complex activities into step-by-step processes.
        - [InitCommand]
            - **Happy Flow (No existing .pew, Default Path):**
                - GIVEN [User] executes `pew init` in a project directory
                - AND no `.pew` directory exists
                - WHEN [CliService] handles the init command
                - THEN [FileSystemService] creates the `./.pew` directory
                - AND [FileSystemService] creates the `./.pew/config` directory
                - AND [ConfigService] saves `tasks: ['.pew/tasks.md']` to `./.pew/config/paths.yaml` using [YamlService]
                - AND [FileSystemService] creates an empty `./.pew/tasks.md` file if it doesn't exist
                - AND [PewCLI] outputs success message to [Console]
            - **Happy Flow (No existing .pew, Custom Path):**
                - GIVEN [User] executes `pew init` in a project directory
                - AND no `.pew` directory exists
                - WHEN [CliService] handles the init command
                - AND [CliService] determines interactive mode (no --force)
                - AND [UserInputService] asks "Enter the primary tasks file path:" with default ".pew/tasks.md"
                - AND [User] provides "my/custom/tasks.md"
                - THEN [FileSystemService] creates the `./.pew` directory
                - AND [FileSystemService] creates the `./.pew/config` directory
                - AND [ConfigService] saves `tasks: ['my/custom/tasks.md']` to `./.pew/config/paths.yaml` using [YamlService]
                - AND [FileSystemService] creates an empty `my/custom/tasks.md` file if it doesn't exist
                - AND [PewCLI] outputs success message to [Console]
            - **Happy Flow (Existing .pew, Force):**
                - GIVEN [User] executes `pew init --force` in a project directory
                - AND a `.pew` directory exists
                - WHEN [CliService] handles the init command
                - THEN [FileSystemService] ensures the `./.pew` directory exists
                - AND [FileSystemService] ensures the `./.pew/config` directory exists
                - AND [ConfigService] overwrites `./.pew/config/paths.yaml` with `tasks: ['.pew/tasks.md']` using [YamlService]
                - AND [FileSystemService] creates an empty `./.pew/tasks.md` file if it doesn't exist
                - AND [PewCLI] outputs success message to [Console]
            - **Scenario (Existing .pew, Interactive Overwrite):**
                - GIVEN [User] executes `pew init` in a project directory
                - AND a `.pew` directory exists
                - WHEN [CliService] handles the init command
                - AND [CliService] determines interactive mode (no --force)
                - AND [UserInputService] asks "Overwrite existing .pew configuration?"
                - AND [User] confirms 'Yes'
                - THEN [FileSystemService] ensures the `./.pew` directory exists
                - AND [FileSystemService] ensures the `./.pew/config` directory exists
                - AND [UserInputService] asks "Enter the primary tasks file path:" with default ".pew/tasks.md"
                - AND [User] provides default path
                - AND [ConfigService] overwrites `./.pew/config/paths.yaml` with `tasks: ['.pew/tasks.md']` using [YamlService]
                - AND [FileSystemService] creates an empty `./.pew/tasks.md` file if it doesn't exist
                - AND [PewCLI] outputs success message to [Console]
            - **Error Flow (Existing .pew, Interactive No Overwrite):**
                - GIVEN [User] executes `pew init` in a project directory
                - AND a `.pew` directory exists
                - WHEN [CliService] handles the init command
                - AND [CliService] determines interactive mode (no --force)
                - AND [UserInputService] asks "Overwrite existing .pew configuration?"
                - AND [User] confirms 'No'
                - THEN [PewCLI] outputs "Initialization aborted." message to [Console]
                - AND [PewCLI] exits
            - **Error Flow (Filesystem Permission Denied):**
                - GIVEN [User] executes `pew init`
                - WHEN [FileSystemService] attempts to create directory or file
                - BUT operation fails due to permissions
                - THEN [PewCLI] outputs error message to [Console]
                - AND [PewCLI] exits with non-zero code
        - [SetCommand] [PathSubCommand]
            - **Happy Flow (Local Set):**
                - GIVEN [User] executes `pew set path --field tasks --value new/tasks.md`
                - AND a local `.pew/config/paths.yaml` exists
                - WHEN [CliService] handles the set path command
                - THEN [ConfigService] loads `./.pew/config/paths.yaml`
                - AND [ConfigService] updates the data to `tasks: ['new/tasks.md']`
                - AND [ConfigService] saves the updated data to `./.pew/config/paths.yaml` using [YamlService]
                - AND [PewCLI] outputs success message to [Console]
            - **Happy Flow (Global Set):**
                - GIVEN [User] executes `pew set path --field tasks --value other/tasks.md --global`
                - AND a global `~/.pew/config/paths.yaml` exists
                - WHEN [CliService] handles the set path command
                - THEN [ConfigService] loads `~/.pew/config/paths.yaml`
                - AND [ConfigService] updates the data to `tasks: ['other/tasks.md']`
                - AND [ConfigService] saves the updated data to `~/.pew/config/paths.yaml` using [YamlService]
                - AND [PewCLI] outputs success message to [Console]
            - **Scenario (Missing Flags, Interactive):**
                - GIVEN [User] executes `pew set path`
                - WHEN [CliService] handles the set path command
                - AND [CliService] detects missing `--field` flag
                - THEN [UserInputService] asks "Enter field to set (e.g., tasks):"
                - AND [User] provides "tasks"
                - AND [CliService] detects missing `--value` flag
                - THEN [UserInputService] asks "Enter value for tasks:"
                - AND [User] provides "path/from/prompt.md"
                - THEN [ConfigService] loads `./.pew/config/paths.yaml` (assuming local default)
                - AND [ConfigService] updates the data to `tasks: ['path/from/prompt.md']`
                - AND [ConfigService] saves the updated data to `./.pew/config/paths.yaml` using [YamlService]
                - AND [PewCLI] outputs success message to [Console]
            - **Error Flow (Invalid Field):**
                - GIVEN [User] executes `pew set path --field non_existent --value foo`
                - WHEN [CliService] handles the set path command
                - THEN [CliService] determines 'non_existent' is not a valid field for 'path' subcommand
                - AND [PewCLI] outputs error message "Invalid field 'non_existent' for set path" to [Console]
                - AND [PewCLI] exits with non-zero code
            - **Error Flow (Config File Not Found):**
                - GIVEN [User] executes `pew set path --field tasks --value foo`
                - AND no local `.pew/config/paths.yaml` exists
                - WHEN [ConfigService] tries to load the file
                - THEN [ConfigService] creates the directory/file structure
                - AND [ConfigService] saves `tasks: ['foo']` to the new `./.pew/config/paths.yaml`
                - AND [PewCLI] outputs success message to [Console]
            - **Error Flow (YAML Write Error):**
                - GIVEN [User] executes `pew set path --field tasks --value foo`
                - WHEN [YamlService] attempts to write to `paths.yaml`
                - BUT operation fails (e.g., disk full, permissions)
                - THEN [PewCLI] outputs error message to [Console]
                - AND [PewCLI] exits with non-zero code
    - 📝 Properties: Define any values or configurations associated with components or activities.
        - [PewCLI]
            - [version : string]
        - [Command]
            - [name : string]
            - [description : string]
        - [Flag]
            - [name : string] (e.g., '--force')
            - [shortName : string] (e.g., '-f')
            - [description : string]
            - [required : boolean]
            - [type : string] ('boolean', 'string')
        - [CliService]
            - [parsedCommand : string]
            - [parsedSubCommand : string | null]
            - [parsedArgs : string[]]
            - [parsedFlags : Record<string, any>]
        - [ConfigService]
            - [localConfigDir : string]
            - [globalConfigDir : string]
            - [localPathsFile : string]
            - [globalPathsFile : string]
            - [currentPathsConfig : object | null]
        - [ConfigFile]
            - [filePath : string]
            - [content : object]
        - [LocalPathsConfig]
            - [tasks : string[]] (List of paths relative to project root)
        - [GlobalPathsConfig]
            - [tasks : string[]] (List of absolute paths or paths with ~)
        - [TaskFile]
            - [filePath : string]
            - [content : string]
        - [UserInputService]
            - [promptMessage : string]
            - [promptChoices : string[] | null]
            - [promptDefault : any]
    - 🛠️ Behaviours: Describe how actors, components, properties, and activities should act or respond in different situations.
        - [ConfigService]
            - [Should find .pew directory by searching upwards from current directory]
            - [Should default to global config path if no local .pew directory is found]
            - [Should correctly resolve '~' in global paths]
            - [Should create config directories if they don't exist upon first write]
            - [Should merge global and local settings appropriately if applicable (though not strictly needed for just `paths.tasks`)]
            - [Should load config lazily or cache it to avoid repeated file reads]
        - [YamlService]
            - [Should correctly parse YAML strings into JS objects]
            - [Should correctly serialize JS objects into YAML strings]
            - [Should preserve YAML structure and comments if possible (js-yaml might not support this as well as ruamel)] -> *Correction: js-yaml does not preserve comments. Accept this limitation.*
            - [Should handle file read/write errors gracefully]
        - [FileSystemService]
            - [Should handle file/directory existence checks correctly]
            - [Should create directories recursively (`mkdir -p`)]
            - [Should handle file system errors (permissions, not found) gracefully]
        - [UserInputService]
            - [Should display prompts clearly]
            - [Should handle user cancellation (Ctrl+C) gracefully]
            - [Should pre-fill default values in prompts]
            - [Should return the correct data type based on the prompt]
        - [InitCommand]
            - [Should not prompt for overwrite if --force is used]
            - [Should only create files/dirs if they don't exist, unless overwriting]
            - [Should default to '.pew/tasks.md' if user provides no input in interactive mode]
            - [Should always operate on the local directory]
        - [SetCommand] [PathSubCommand]
            - [Should require --field and --value flags or prompt for them]
            - [Should validate that --field is 'tasks' for this specific implementation]
            - [Should correctly identify local vs. global scope based on --global flag]
            - [Should overwrite the entire 'tasks' list, not append]
            - [Should create the config file if it doesn't exist before writing]

## 3. Milestones and Tasks

### Milestone 1: Core Services Setup (Config, YAML, FileSystem)
Implement the foundational services needed for file system operations, YAML handling, and basic configuration loading/saving.

#### Task 1.1: Implement YamlService
- [ ] 1. Create the `YamlService` class to encapsulate YAML parsing and serialization using the `js-yaml` library.
    - Sequence diagram:
        ```mermaid
        sequenceDiagram
            participant C as Caller
            participant YS as YamlService
            participant JSYAML as js-yaml
            participant FSS as FileSystemService

            C->>YS: parseYaml(yamlString)
            YS->>JSYAML: load(yamlString)
            JSYAML-->>YS: jsObject
            YS-->>C: jsObject

            C->>YS: serializeToYaml(jsObject)
            YS->>JSYAML: dump(jsObject)
            JSYAML-->>YS: yamlString
            YS-->>C: yamlString

            C->>YS: readYamlFile(filePath)
            YS->>FSS: readFile(filePath)
            FSS-->>YS: yamlString
            YS->>JSYAML: load(yamlString)
            JSYAML-->>YS: jsObject
            YS-->>C: jsObject

            C->>YS: writeYamlFile(filePath, jsObject)
            YS->>JSYAML: dump(jsObject)
            JSYAML-->>YS: yamlString
            YS->>FSS: writeFile(filePath, yamlString)
            FSS-->>YS: void
            YS-->>C: void
        ```
    - Files:
        - C: `src/modules/yaml.service.ts`
    - Classes:
        - C: `YamlService`
    - Variables:
        - N/A (Uses imported library)
    - Methods:
        - C: `YamlService.parseYaml(yamlString: string): Record<string, any>` (sync)
        - C: `YamlService.serializeToYaml(data: Record<string, any>): string` (sync)
        - C: `YamlService.readYamlFile(filePath: string): Promise<Record<string, any>>` (async) - Depends on FileSystemService.readFile
        - C: `YamlService.writeYamlFile(filePath: string, data: Record<string, any>): Promise<void>` (async) - Depends on FileSystemService.writeFile
    - Process:
        - Import `load` and `dump` from `js-yaml`.
        - Implement `parseYaml` using `load`.
        - Implement `serializeToYaml` using `dump`.
        - Implement `readYamlFile` to read file content (using `FileSystemService`) and then parse it. Handle file not found or empty file (return {}).
        - Implement `writeYamlFile` to serialize data and then write it to a file (using `FileSystemService`).

#### Task 1.2: Implement FileSystemService
- [ ] 1. Create the `FileSystemService` class to handle interactions with the file system using Node.js built-in modules (`fs`, `path`, `os`).
    - Sequence diagram:
        ```mermaid
        sequenceDiagram
            participant C as Caller
            participant FSS as FileSystemService
            participant FS as Node_fs_promises
            participant PATH as Node_path
            participant OS as Node_os

            C->>FSS: readFile(filePath)
            FSS->>FS: readFile(filePath, 'utf-8')
            FS-->>FSS: contentString
            FSS-->>C: contentString

            C->>FSS: writeFile(filePath, content)
            FSS->>FS: writeFile(filePath, content, 'utf-8')
            FS-->>FSS: void
            FSS-->>C: void

            C->>FSS: pathExists(filePath)
            FSS->>FS: access(filePath)
            alt Path Exists
                FS-->>FSS: void
                FSS-->>C: true
            else Path Does Not Exist
                FS-->>FSS: Error (ENOENT)
                FSS-->>C: false
            end

            C->>FSS: createDirectory(dirPath)
            FSS->>FS: mkdir(dirPath, { recursive: true })
            FS-->>FSS: void
            FSS-->>C: void

            C->>FSS: getHomeDirectory()
            FSS->>OS: homedir()
            OS-->>FSS: homePath
            FSS-->>C: homePath

            C->>FSS: resolvePath(...paths)
            FSS->>PATH: resolve(...paths)
            PATH-->>FSS: absolutePath
            FSS-->>C: absolutePath

            C->>FSS: joinPath(...paths)
            FSS->>PATH: join(...paths)
            PATH-->>FSS: joinedPath
            FSS-->>C: joinedPath

            C->>FSS: ensureDirectoryExists(dirPath)
            FSS->>FSS: pathExists(dirPath)
            alt Exists
              FSS-->>FSS: true
            else Does Not Exist
              FSS-->>FSS: false
              FSS->>FSS: createDirectory(dirPath)
              FSS-->>FSS: void
            end
            FSS-->>C: void
        ```
    - Files:
        - C: `src/modules/file-system.service.ts`
    - Classes:
        - C: `FileSystemService`
    - Variables:
        - N/A (Uses imported modules)
    - Methods:
        - C: `FileSystemService.readFile(filePath: string): Promise<string>` (async)
        - C: `FileSystemService.writeFile(filePath: string, content: string): Promise<void>` (async)
        - C: `FileSystemService.pathExists(filePath: string): Promise<boolean>` (async)
        - C: `FileSystemService.createDirectory(dirPath: string): Promise<void>` (async)
        - C: `FileSystemService.getHomeDirectory(): string` (sync)
        - C: `FileSystemService.resolvePath(...paths: string[]): string` (sync)
        - C: `FileSystemService.joinPath(...paths: string[]): string` (sync)
        - C: `FileSystemService.ensureDirectoryExists(dirPath: string): Promise<void>` (async)
    - Process:
        - Import `promises as fs` from `fs`, `path` from `path`, `os` from `os`.
        - Implement methods using the corresponding functions from `fs`, `path`, and `os`.
        - Use `fs.access` for `pathExists` and handle errors.
        - Use `fs.mkdir` with `{ recursive: true }` for `createDirectory`.
        - Implement `ensureDirectoryExists` to check existence and create if needed.

#### Task 1.3: Implement ConfigService Structure and Path Handling
- [ ] 1. Create the `ConfigService` class, implement logic to find local/global config paths, and load/save the `paths.yaml` file.
    - Sequence diagram:
        ```mermaid
        sequenceDiagram
            participant C as Caller
            participant CS as ConfigService
            participant FSS as FileSystemService
            participant YS as YamlService

            C->>CS: constructor()
            CS->>FSS: getHomeDirectory()
            FSS-->>CS: homeDir
            CS->>CS: _findLocalPewDir(process.cwd())
            alt Local .pew Found
                CS-->>CS: localPewPath
                Note over CS: Set local/global paths based on localPewPath
            else No Local .pew
                CS-->>CS: null
                Note over CS: Set local/global paths based on homeDir
            end
            CS->>CS: _loadPathsConfig()
            CS-->>C: ConfigService instance

            CS->>CS: _findLocalPewDir(startPath)
            loop Search upwards
                CS->>FSS: joinPath(currentPath, '.pew')
                FSS-->>CS: potentialPewDir
                CS->>FSS: pathExists(potentialPewDir)
                alt Exists
                    FSS-->>CS: true
                    CS-->>CS: potentialPewDir
                    break
                else Does Not Exist
                    FSS-->>CS: false
                    Note over CS: Move to parent directory
                end
            end
            alt Found
                CS-->>CS: foundPath
            else Not Found
                CS-->>CS: null
            end

            CS->>CS: _loadPathsConfig()
            Note over CS: Determine localPathsFile path
            CS->>FSS: pathExists(localPathsFile)
            alt Exists
                FSS-->>CS: true
                CS->>YS: readYamlFile(localPathsFile)
                YS-->>CS: localPathsData
                Note over CS: Store localPathsData
            else Does Not Exist
                FSS-->>CS: false
                Note over CS: Set localPathsData to {}
            end
            Note over CS: Determine globalPathsFile path
            CS->>FSS: pathExists(globalPathsFile)
            alt Exists
                FSS-->>CS: true
                CS->>YS: readYamlFile(globalPathsFile)
                YS-->>CS: globalPathsData
                Note over CS: Store globalPathsData
            else Does Not Exist
                FSS-->>CS: false
                Note over CS: Set globalPathsData to {}
            end

            C->>CS: getTasksPaths(global: boolean = false): Promise<string[]>
            CS->>CS: _loadPathsConfig() // Ensure loaded
            alt global is true
                Note over CS: Use globalPathsData
            else global is false
                Note over CS: Use localPathsData (or global if no local)
            end
            Note over CS: Extract 'tasks' list or return default ['.pew/tasks.md']
            CS-->>C: tasksList

            C->>CS: setTasksPaths(paths: string[], global: boolean = false): Promise<void>
            alt global is true
                Note over CS: targetFile = globalPathsFile
                Note over CS: configData = globalPathsData
            else global is false
                Note over CS: targetFile = localPathsFile
                Note over CS: configData = localPathsData
            end
            Note over CS: Update configData['tasks'] = paths
            CS->>FSS: ensureDirectoryExists(dirname(targetFile))
            FSS-->>CS: void
            CS->>YS: writeYamlFile(targetFile, configData)
            YS-->>CS: void
            CS-->>C: void
        ```
    - Files:
        - C: `src/modules/config.service.ts`
    - Classes:
        - C: `ConfigService` (Lazy Singleton)
    - Variables:
        - C: `ConfigService.instance: ConfigService | null` (static, private)
        - C: `ConfigService.localConfigDir: string | null` (private)
        - C: `ConfigService.globalConfigDir: string` (private)
        - C: `ConfigService.localPathsFile: string | null` (private)
        - C: `ConfigService.globalPathsFile: string` (private)
        - C: `ConfigService.localPathsData: Record<string, any>` (private)
        - C: `ConfigService.globalPathsData: Record<string, any>` (private)
        - C: `ConfigService.fileSystemService: FileSystemService` (private, injected or instantiated)
        - C: `ConfigService.yamlService: YamlService` (private, injected or instantiated)
        - C: `ConfigService.isInitialized: boolean` (private)
    - Methods:
        - C: `ConfigService.getInstance(): ConfigService` (static, public) - Singleton access
        - C: `ConfigService.constructor()` (private)
        - C: `ConfigService._initialize(): Promise<void>` (private, async) - Loads initial config
        - C: `ConfigService._findLocalPewDir(startPath: string): Promise<string | null>` (private, async)
        - C: `ConfigService._loadPathsConfig(): Promise<void>` (private, async)
        - C: `ConfigService.getTasksPaths(global?: boolean): Promise<string[]>` (public, async)
        - C: `ConfigService.setTasksPaths(paths: string[], global?: boolean): Promise<void>` (public, async)
        - C: `ConfigService.getLocalConfigDir(): string | null` (public, sync)
        - C: `ConfigService.getGlobalConfigDir(): string` (public, sync)
    - Process:
        - Implement singleton pattern (`getInstance`, private constructor).
        - Inject or instantiate `FileSystemService` and `YamlService`.
        - In constructor or an init method:
            - Get home directory using `FileSystemService`.
            - Define `globalConfigDir` (`homeDir/.pew`).
            - Define `globalPathsFile` (`globalConfigDir/config/paths.yaml`).
            - Call `_findLocalPewDir` starting from `process.cwd()`.
            - If local dir found, define `localConfigDir` and `localPathsFile`.
            - Call `_loadPathsConfig` to load initial data.
        - Implement `_findLocalPewDir` to search upwards using `FileSystemService.pathExists`.
        - Implement `_loadPathsConfig` to read local and global `paths.yaml` using `YamlService.readYamlFile`, handling cases where files don't exist. Store loaded data in private variables.
        - Implement `getTasksPaths` to return the `tasks` list from the appropriate loaded data (local takes precedence if it exists, otherwise global), returning `['.pew/tasks.md']` as a default if neither config has the key. Ensure paths are resolved correctly (relative for local, absolute/tilde for global). *Correction: User specified local paths should be relative to project root.* Return `['.pew/tasks.md']` if key not found or config empty.
        - Implement `setTasksPaths` to update the `tasks` key in the appropriate data object (local or global), ensure the target directory exists using `FileSystemService.ensureDirectoryExists`, and write the updated object back using `YamlService.writeYamlFile`.

```
```markdown
### Milestone 2: User Input and `init` Command Logic
Implement user interaction for prompts and the logic for the `pew init` command.

#### Task 2.1: Implement UserInputService Methods
- [ ] 1. Implement required methods in `UserInputService` for text input (specifically for paths) and confirmation, using the `inquirer` library.
    - Sequence diagram:
        ```mermaid
        sequenceDiagram
            participant C as Caller
            participant UIS as UserInputService
            participant INQ as inquirer

            C->>UIS: askForText(message, default?)
            UIS->>INQ: prompt([{ type: 'input', name: 'value', message, default }])
            INQ-->>UIS: { value: userInput }
            UIS-->>C: userInput

            C->>UIS: askForPath(message, default?)
            Note over UIS: Signal it's a path, prefill default. No autocomplete.
            UIS->>INQ: prompt([{ type: 'input', name: 'value', message, default }])
            INQ-->>UIS: { value: userInputPath }
            UIS-->>C: userInputPath

            C->>UIS: askForConfirmation(message, default?)
            UIS->>INQ: prompt([{ type: 'confirm', name: 'value', message, default }])
            INQ-->>UIS: { value: userConfirmation }
            UIS-->>C: userConfirmation
        ```
    - Files:
        - C: `src/modules/user-input.service.ts`
    - Classes:
        - C: `UserInputService`
    - Variables:
        - N/A (Uses imported library)
    - Methods:
        - C: `UserInputService.askForText(message: string, defaultValue?: string): Promise<string>` (async)
        - C: `UserInputService.askForConfirmation(message: string, defaultValue?: boolean): Promise<boolean>` (async)
        - C: `UserInputService.askForPath(message: string, defaultValue?: string): Promise<string>` (async)
    - Process:
        - Import `inquirer`.
        - Implement `askForText` using `inquirer.prompt` with type `input`. Handle potential cancellation (inquirer might throw or return specific values). Return the entered text.
        - Implement `askForConfirmation` using `inquirer.prompt` with type `confirm`. Return the boolean result.
        - Implement `askForPath` similarly to `askForText`. While `inquirer` doesn't have built-in path autocomplete without plugins, use the `input` type. The `message` should indicate it's a path. Pre-fill the `defaultValue` if provided.

#### Task 2.2: Implement `init` Command Logic
- [ ] 1. Implement the logic for the `pew init` command within `CliService` (or a dedicated `InitService` called by `CliService`), handling directory/file creation, user prompts for the task path, and saving the configuration.
    - Sequence diagram:
        ```mermaid
        sequenceDiagram
            participant IDX as index.ts
            participant CLI as CliService
            participant FSS as FileSystemService
            participant UIS as UserInputService
            participant CS as ConfigService

            IDX->>CLI: handleInit(flags: { force: boolean })
            CLI->>FSS: getLocalConfigDir()
            FSS-->>CLI: localPewDir or null
            alt localPewDir exists AND !flags.force
                CLI->>UIS: askForConfirmation("Overwrite existing .pew configuration?")
                UIS-->>CLI: confirmation
                alt !confirmation
                    Note over CLI: Log "Aborted" and return
                    CLI-->>IDX: void
                end
            end

            Note over CLI: Proceed with initialization
            CLI->>FSS: ensureDirectoryExists("./.pew/config")
            FSS-->>CLI: void

            alt !flags.force
                CLI->>UIS: askForPath("Enter primary tasks file path:", ".pew/tasks.md")
                UIS-->>CLI: taskPath
            else flags.force
                Note over CLI: Use default taskPath = ".pew/tasks.md"
                CLI-->>CLI: taskPath = ".pew/tasks.md"
            end

            CLI->>CS: setTasksPaths([taskPath], false) // Always local
            CS-->>CLI: void

            CLI->>FSS: pathExists(taskPath)
            FSS-->>CLI: exists
            alt !exists
                CLI->>FSS: writeFile(taskPath, "") // Create empty file
                FSS-->>CLI: void
            end
            Note over CLI: Log "Initialized successfully"
            CLI-->>IDX: void
        ```
    - Files:
        - C: `src/modules/cli.service.ts`
        - U: `src/index.ts` (to call the handler)
    - Classes:
        - U: `CliService`
    - Variables:
        - M: `CliService.handleInit.flags: { force: boolean }` (method parameter)
        - M: `CliService.handleInit.localPewDir: string | null`
        - M: `CliService.handleInit.confirmation: boolean`
        - M: `CliService.handleInit.taskPath: string`
    - Methods:
        - C: `CliService.handleInit(flags: { force: boolean }): Promise<void>` (async)
        - R: `FileSystemService.ensureDirectoryExists(dirPath: string): Promise<void>`
        - R: `FileSystemService.pathExists(filePath: string): Promise<boolean>`
        - R: `FileSystemService.writeFile(filePath: string, content: string): Promise<void>`
        - R: `UserInputService.askForConfirmation(message: string, defaultValue?: boolean): Promise<boolean>`
        - R: `UserInputService.askForPath(message: string, defaultValue?: string): Promise<string>`
        - R: `ConfigService.setTasksPaths(paths: string[], global?: boolean): Promise<void>`
        - R: `ConfigService.getLocalConfigDir(): string | null`
    - Process:
        - Define `handleInit` method in `CliService` accepting flags.
        - Check if the local `.pew` directory exists using `ConfigService.getLocalConfigDir()` or `FileSystemService.pathExists("./.pew")`.
        - If it exists and `force` flag is not set, use `UserInputService.askForConfirmation` to ask for overwrite permission. If denied, log and return.
        - Ensure the `./.pew` and `./.pew/config` directories exist using `FileSystemService.ensureDirectoryExists`.
        - If `force` flag is not set, use `UserInputService.askForPath` to prompt the user for the task file path, providing `.pew/tasks.md` as the default.
        - If `force` flag is set, use `.pew/tasks.md` as the task path directly.
        - Call `ConfigService.setTasksPaths` with the determined path (wrapped in a list) and `global: false`.
        - Check if the specified task file exists using `FileSystemService.pathExists`.
        - If the task file doesn't exist, create it as an empty file using `FileSystemService.writeFile`.
        - Log success message.
        - Update `src/index.ts` to call `cliService.handleInit` for the `init` command, passing the parsed `force` option.

```
```markdown
### Milestone 3: `set path` Command Logic and Integration
Implement the logic for the `pew set path` command and integrate the new commands into the main CLI entry point.

#### Task 3.1: Implement `set path` Command Logic
- [ ] 1. Implement the logic for the `pew set path` command within `CliService`, handling flag parsing (--field, --value, --global), prompting for missing flags, and saving the configuration.
    - Sequence diagram:
        ```mermaid
        sequenceDiagram
            participant IDX as index.ts
            participant CLI as CliService
            participant UIS as UserInputService
            participant CS as ConfigService

            IDX->>CLI: handleSetPath(field: string | undefined, value: string | undefined, flags: { global: boolean })
            alt field is undefined
                CLI->>UIS: askForText("Enter field to set (e.g., tasks):")
                UIS-->>CLI: promptedField
                CLI-->>CLI: field = promptedField
            end
            alt value is undefined
                CLI->>UIS: askForPath("Enter value for " + field + ":")
                UIS-->>CLI: promptedValue
                CLI-->>CLI: value = promptedValue
            end

            alt field !== 'tasks'
                 Note over CLI: Log "Invalid field" error and return
                 CLI-->>IDX: void
            end

            Note over CLI: field is 'tasks', value is defined
            CLI->>CS: setTasksPaths([value], flags.global)
            CS-->>CLI: void

            Note over CLI: Log "Set successfully"
            CLI-->>IDX: void
        ```
    - Files:
        - C: `src/modules/cli.service.ts`
        - U: `src/index.ts` (to call the handler)
    - Classes:
        - U: `CliService`
    - Variables:
        - M: `CliService.handleSetPath.field: string | undefined` (method parameter)
        - M: `CliService.handleSetPath.value: string | undefined` (method parameter)
        - M: `CliService.handleSetPath.flags: { global: boolean }` (method parameter)
        - M: `CliService.handleSetPath.finalField: string`
        - M: `CliService.handleSetPath.finalValue: string`
    - Methods:
        - C: `CliService.handleSetPath(field: string | undefined, value: string | undefined, flags: { global: boolean }): Promise<void>` (async)
        - R: `UserInputService.askForText(message: string, defaultValue?: string): Promise<string>`
        - R: `UserInputService.askForPath(message: string, defaultValue?: string): Promise<string>`
        - R: `ConfigService.setTasksPaths(paths: string[], global?: boolean): Promise<void>`
    - Process:
        - Define `handleSetPath` method in `CliService` accepting field, value, and flags.
        - Check if `field` is provided. If not, use `UserInputService.askForText` to prompt for it.
        - Check if `value` is provided. If not, use `UserInputService.askForPath` to prompt for it.
        - Validate if the `field` is 'tasks'. If not, log an error ("Invalid field for set path") and return.
        - Call `ConfigService.setTasksPaths` with the `value` (wrapped in a list) and the `global` flag state.
        - Log success message.

#### Task 3.2: Integrate Handlers into `index.ts`
- [ ] 1. Update `src/index.ts` to use `commander` to define the `init` and `set path` commands, parse their options/arguments, and call the corresponding handlers in `CliService`.
    - Sequence diagram:
        ```mermaid
        sequenceDiagram
            participant User as User
            participant Node as Node.js Process
            participant IDX as index.ts
            participant Commander as commander
            participant CLI as CliService

            User->>Node: Executes `pew init --force`
            Node->>IDX: Starts execution
            IDX->>Commander: program.command('init')...action(options => {...})
            IDX->>Commander: program.command('set <subcommand>')...
            Commander->>Commander: Parses `process.argv`
            Commander->>IDX: Calls action for 'init' with options = { force: true }
            IDX->>CLI: getInstance()
            CLI-->>IDX: cliServiceInstance
            IDX->>CLI: handleInit({ force: true })
            CLI-->>IDX: Promise<void>

            User->>Node: Executes `pew set path --field tasks --value foo.md --global`
            Node->>IDX: Starts execution
            IDX->>Commander: program.command('set <subcommand>')...action((subcommand, options) => {...})
            Commander->>Commander: Parses `process.argv`
            Commander->>IDX: Calls action for 'set' with subcommand='path', options = { field: 'tasks', value: 'foo.md', global: true }
            IDX->>CLI: getInstance()
            CLI-->>IDX: cliServiceInstance
            IDX->>CLI: handleSetPath(options.field, options.value, { global: options.global })
            CLI-->>IDX: Promise<void>
        ```
    - Files:
        - U: `src/index.ts`
    - Classes:
        - N/A (Updates existing file)
    - Variables:
        - U: `program: Command` (from commander)
        - U: `cliService: CliService` (instance)
    - Methods:
        - U: `CliService.handleInit(flags: { force: boolean }): Promise<void>`
        - U: `CliService.handleSetPath(field: string | undefined, value: string | undefined, flags: { global: boolean }): Promise<void>`
    - Process:
        - Import `CliService`.
        - Instantiate `CliService` (using singleton pattern if implemented).
        - Modify the `init` command definition:
            - Remove the stub `console.log`.
            - In the `.action((options) => {...})`, call `await cliService.handleInit({ force: options.force || false });`. Make the action async.
        - Modify the `set` command definition:
            - Change `<key> <value>` arguments to options: `.option('--field <field>', 'Field to set').option('--value <value>', 'Value to set')`.
            - Add the subcommand argument: `.command('set <subcommand>')`.
            - Keep the `--global` option.
            - In the `.action(async (subcommand, options) => {...})`:
                - Check if `subcommand === 'path'`.
                - If yes, call `await cliService.handleSetPath(options.field, options.value, { global: options.global || false });`.
                - If no, log an error "Invalid subcommand for set".
        - Remove other stub commands (`paste`, `next`) or update them similarly if their handlers exist. Ensure the main `program.parse(process.argv)` call remains.

```