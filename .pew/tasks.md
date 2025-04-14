# Mode: ACT
🎯 Main Objective: Modify the `pew paste tasks` command to allow specifying a target file via a new `paste-tasks` config key in `paths.yaml` or a `--path` command-line option, including handling for non-existent paths and updating the `pew init` process.

# Project Plan: Enhanced `pew paste tasks` Target File Specification

## 1. Project Overview
This project enhances the `pew paste tasks` command to provide users more control over the target file. It introduces a new `paste-tasks` configuration key in `paths.yaml` to define a default paste target and adds a `--path` command-line option to override this default. The plan includes updating configuration handling, command-line parsing, the paste logic (including user prompts for non-existent override paths), and the initialization process to set the new configuration key. Documentation will also be updated.
- [x] Read the project overview:
    - Add `paste-tasks: <path>` key to `paths.yaml`.
    - Add `--path <value>` option to `pew paste tasks`.
    - Prioritize `--path` over `paste-tasks` config.
    - Implement fallback logic: `--path` (if exists) -> prompt if `--path` doesn't exist (offer config path) -> `paste-tasks` config path -> first `tasks` path -> default `./.pew/tasks.md`.
    - Update `pew init` to set both `tasks` list and `paste-tasks` string.
    - Update documentation.

## 2. Requirements Analysis Summary
A concise summary of the requirements identified for this feature enhancement.
- [x] Review the requirements summary:
    - **👤 Actors & 🧩 Components:** `User`, `pew CLI Application` (`CliService`, `ConfigService`, `TaskService`, `FileSystemService`, `YamlService`, `UserInputService`, `Console Output`, `Commander`), `paths.yaml` (`tasks` key, `paste-tasks` key), Task File, Command Line Interface (`--path` option).
    - **🎬 Activities:** Get paste tasks path, Set paste tasks path, Handle malformed config, Update `handleInit`, Update `handlePasteTasks`, Parse `--path` option, Determine final paste path, Check path existence, Prompt user, Update documentation.
    - **🌊 Activity Flows & Scenarios:** Getting paste path (local/global/fallback), `paste tasks` with/without `--path`, Handling existing/non-existing override path, `init` setting both keys.
    - **📝 Properties:** `paths.yaml.paste-tasks: string`, `options.path: string | undefined`, `defaultPastePath: string`, `finalPastePath: string`.
    - **🛠️ Behaviours:** Prioritize `--path`, Prompt on non-existent override, Fallback logic chain, `init` sets both keys, Log warning on malformed config.
*(Full detailed analysis follows)*

## 3. Detailed Requirements

- 👤 **Actors & 🧩 Components:**
    - [Actor] User (Executes `pew` commands, provides input)
    - [Component] `pew` CLI Application
        - [Component] `CliService` (Orchestrates commands)
        - [Component] `ConfigService` (Manages `paths.yaml` access)
        - [Component] `TaskService` (Writes to task files)
        - [Component] `FileSystemService` (Checks file existence)
        - [Component] `YamlService` (Parses/serializes `paths.yaml`)
        - [Component] `UserInputService` (Handles interactive prompts)
        - [Component] Console Output (Displays messages, prompts, errors)
        - [Component] Commander (Library for parsing CLI args/options)
    - [Component] `paths.yaml` (Configuration file)
        - [Property] `tasks: string[]` (Existing list of task files)
        - [Property] `paste-tasks: string` (New: Default path for paste command)
    - [Component] Task File (Markdown file to be written to)
    - [Component] Command Line Interface
        - [Component] `--path <value>` (New option for `pew paste tasks`)

- 🎬 **Activities:**
    - [`ConfigService`]
        - [Activity] Get resolved paste tasks path (New: `getPasteTasksPath`) - includes fallback logic.
        - [Activity] Handle malformed `paste-tasks` config value (Log warning, fallback).
        - [Activity] Set tasks and paste tasks paths (Update: Modify `setTasksPaths` or add related logic for `init`).
    - [`CliService`]
        - [Activity] Handle `pew init` command (Update: Ensure `paste-tasks` key is set alongside `tasks`).
        - [Activity] Handle `pew paste tasks` command (Update: Incorporate `--path` option and fallback logic).
        - [Activity] Parse `--path` option value from Commander context.
        - [Activity] Determine final paste path based on `--path`, config, existence checks, and user prompts.
        - [Activity] Check if override path provided via `--path` exists using `FileSystemService`.
        - [Activity] Prompt user for confirmation if override path doesn't exist using `UserInputService`.
    - [`UserInputService`]
        - [Activity] Ask for confirmation (Used for non-existent path scenario).
    - [`FileSystemService`]
        - [Activity] Check path existence (Used for `--path` validation).
    - [User]
        - [Activity] Execute `pew init`.
        - [Activity] Execute `pew paste tasks`.
        - [Activity] Execute `pew paste tasks --path <path>`.
        - [Activity] Respond to confirmation prompt.
    - [Documentation]
        - [Activity] Update `README.md` command table and descriptions.
        - [Activity] Update `tutorials/how-to-set-up-repeatable-workflows-eg-build-steps-qa.md` or relevant tutorial.

- 🌊 **Activity Flows & Scenarios:**
    - [Get Paste Path Logic (`ConfigService.getPasteTasksPath`)]
        - GIVEN `ConfigService` is initialized
        - WHEN `CliService` calls `getPasteTasksPath`
        - THEN `ConfigService` checks effective config (local > global) for `paste-tasks` key
        - AND IF key exists AND value is a non-empty string
            - THEN Resolve path relative to config source (project root or global dir)
            - AND Return resolved path
        - AND IF key exists BUT value is NOT a non-empty string
            - THEN Log warning "Malformed 'paste-tasks' value in config, using fallback."
            - AND Proceed to fallback step 1
        - AND IF key does NOT exist
            - THEN Proceed to fallback step 1
        - [Fallback Step 1: First `tasks` path]
            - THEN Get `tasks` list from effective config
            - AND IF `tasks` is an array AND has at least one non-empty string element
                - THEN Resolve the first path relative to config source
                - AND Return resolved path
            - ELSE Proceed to fallback step 2
        - [Fallback Step 2: Default path]
            - THEN Resolve default path `./.pew/tasks.md` relative to `process.cwd()`
            - AND Return resolved default path
    - [`pew paste tasks` (No --path)]
        - GIVEN User runs `pew paste tasks`
        - WHEN `CliService.handlePasteTasks` executes
        - THEN `CliService` gets `options.path` (undefined)
        - THEN `CliService` calls `ConfigService.getPasteTasksPath` -> returns `configuredPath`
        - THEN `CliService` sets `finalPastePath = configuredPath`
        - THEN `CliService` calls `TaskService.writeTasksContent(finalPastePath, ...)`
    - [`pew paste tasks` (--path exists)]
        - GIVEN User runs `pew paste tasks --path existing/file.md`
        - WHEN `CliService.handlePasteTasks` executes
        - THEN `CliService` gets `options.path = "existing/file.md"`
        - THEN `CliService` calls `FileSystemService.pathExists("existing/file.md")` -> returns `true`
        - THEN `CliService` sets `finalPastePath = "existing/file.md"`
        - THEN `CliService` calls `TaskService.writeTasksContent(finalPastePath, ...)`
    - [`pew paste tasks` (--path does NOT exist)]
        - GIVEN User runs `pew paste tasks --path new/file.md`
        - WHEN `CliService.handlePasteTasks` executes
        - THEN `CliService` gets `options.path = "new/file.md"`
        - THEN `CliService` calls `FileSystemService.pathExists("new/file.md")` -> returns `false`
        - THEN `CliService` calls `ConfigService.getPasteTasksPath` -> returns `configuredPath`
        - THEN `CliService` calls `UserInputService.askForConfirmation("Path 'new/file.md' does not exist. Paste into default '${configuredPath}' instead?")`
        - IF User confirms 'yes'
            - THEN `CliService` sets `finalPastePath = configuredPath`
            - THEN `CliService` calls `TaskService.writeTasksContent(finalPastePath, ...)`
        - ELSE (User confirms 'no')
            - THEN `CliService` logs "Paste operation aborted."
            - AND `CliService` returns
    - [`pew init`]
        - GIVEN User runs `pew init` (not forced)
        - WHEN `CliService.handleInit` executes
        - THEN `CliService` prompts for "primary tasks file path" -> user enters `my/tasks.md`
        - THEN `CliService` calls `ConfigService.setTasksPaths(['my/tasks.md'], false, 'my/tasks.md')` (or similar updated signature/logic)
        - THEN `ConfigService` writes local `paths.yaml` with `tasks: ['my/tasks.md']` and `paste-tasks: my/tasks.md`
    - [`pew init --force`]
        - GIVEN User runs `pew init --force`
        - WHEN `CliService.handleInit` executes
        - THEN `CliService` uses default path `.pew/tasks.md`
        - THEN `CliService` calls `ConfigService.setTasksPaths(['.pew/tasks.md'], false, '.pew/tasks.md')` (or similar updated signature/logic)
        - THEN `ConfigService` writes local `paths.yaml` with `tasks: ['.pew/tasks.md']` and `paste-tasks: .pew/tasks.md`

- 📝 **Properties:**
    - [`paths.yaml`]
        - [tasks : string[]]
        - [paste-tasks : string] (New)
    - [`CliService.handlePasteTasks` scope]
        - [options.path : string | undefined] (From Commander)
        - [configuredPastePath : string] (Result from `ConfigService.getPasteTasksPath`)
        - [finalPastePath : string] (Path ultimately used for writing)
        - [overridePathExists : boolean] (Result from `FileSystemService.pathExists` on `options.path`)
    - [`ConfigService`]
        - [localPathsData.paste-tasks : any] (Raw value read from local YAML)
        - [globalPathsData.paste-tasks : any] (Raw value read from global YAML)

- 🛠️ **Behaviours:**
    - [`ConfigService.getPasteTasksPath`]
        - Should return the correctly resolved path based on local `paste-tasks` if valid.
        - Should return the correctly resolved path based on global `paste-tasks` if local is invalid/missing but global is valid.
        - Should log a warning to console if `paste-tasks` value is found but is not a non-empty string.
        - Should return the correctly resolved first path from the `tasks` list if `paste-tasks` is invalid/missing in both scopes.
        - Should return the correctly resolved default `./.pew/tasks.md` path if `paste-tasks` and `tasks` are invalid/missing.
    - [`CliService.handlePasteTasks`]
        - Should use the value from the `--path` option as the target file path if provided and the file exists.
        - If `--path` is provided but the file does *not* exist, should prompt the user whether to use the configured default path instead.
        - If the user declines the prompt, the paste operation should be aborted with a message.
        - If `--path` is not provided, should use the path returned by `ConfigService.getPasteTasksPath`.
    - [`CliService.handleInit`]
        - When initializing (or force initializing), should write both the `tasks` key (as a single-element list) and the `paste-tasks` key (as a string) to the local `paths.yaml`, using the path provided by the user or the default path.

## 4. Milestones and Tasks

### Milestone 1: Update Configuration Handling
Modify `ConfigService` to read, validate, and fallback for the new `paste-tasks` key, and update the setting logic used by `init`.

#### Task 1.1: Implement `ConfigService.getPasteTasksPath`
- [x] **Do:** Create a new public async method `getPasteTasksPath(): Promise<string>` in `ConfigService` to retrieve the resolved default paste task file path, implementing the specified fallback logic (local `paste-tasks` -> global `paste-tasks` -> first local/global `tasks` -> default `./.pew/tasks.md`) and validation.
- **Sequence Diagram:**
    ```mermaid
    sequenceDiagram
        participant CliS as CliService
        participant CS as ConfigService
        participant FSS as FileSystemService
        participant YS as YamlService
        participant path as NodeJSPathModule
        participant console as Console

        CliS->>CS: getPasteTasksPath()
        CS->>CS: initialize() # If not already initialized
        CS->>CS: Determine effective config (local or global)
        alt Local config has 'paste-tasks' key
            CS->>CS: Get raw value localPathsData.tasks['paste-tasks']
            alt Value is valid string
                CS->>path: resolve(localProjectRoot, value)
                path-->>CS: resolvedPath
                CS-->>CliS: resolvedPath
            else Value is invalid
                CS->>console: warn("Malformed 'paste-tasks'...")
                CS->>CS: Proceed to Global Check / Fallback 1
            end
        else Local config missing 'paste-tasks' key
             CS->>CS: Proceed to Global Check / Fallback 1
        end
        Note over CS: Similar check for global config if local failed

        Note over CS: Fallback 1: Check 'tasks' list
        CS->>CS: Get effective 'tasks' list (local or global)
        alt Tasks list is valid array with items
            CS->>path: resolve(configSourceDir, tasks[0])
            path-->>CS: resolvedPath
            CS-->>CliS: resolvedPath
        else Tasks list invalid/empty
            CS->>CS: Proceed to Fallback 2
        end

        Note over CS: Fallback 2: Default path
        CS->>path: resolve(process.cwd(), './.pew/tasks.md')
        path-->>CS: resolvedDefaultPath
        CS-->>CliS: resolvedDefaultPath
    ```
- **Files:**
    - U: `src/modules/config.service.ts`
- **Classes:**
    - U: `ConfigService`
- **Methods:**
    - C: `public async getPasteTasksPath(): Promise<string>`
    - R: `initialize()` (called internally)
    - R: `getTasksPaths()` (potentially reuse parts of its logic for fallback)
- **Variables:**
    - C: `getPasteTasksPath.const effectiveConfig = ...` (Determine local or global data source)
    - C: `getPasteTasksPath.const isLocalSource = ...`
    - C: `getPasteTasksPath.let pasteTaskPathValue: any = effectiveConfig['paste-tasks'];`
    - C: `getPasteTasksPath.let resolvedPath: string | null = null;`
- **Process:**
    1. Open `src/modules/config.service.ts`.
    2. Define the new public async method `getPasteTasksPath`.
    3. Ensure initialization: `await this.initialize();`.
    4. Determine effective config source (local `this.localPathsData` if `this.localPathsFile` exists and data is not empty, else `this.globalPathsData`). Store the source data and whether it's local.
    5. Check for `paste-tasks` key in the effective config.
    6. If the key exists:
        a. Get the value.
        b. Check if the value is a non-empty string.
        c. If valid: Resolve the path based on the source (local resolves relative to project root `path.dirname(this.localConfigDir)`, global resolves relative to `this.globalConfigDir`). Return the resolved path.
        d. If invalid: Log a warning `console.warn("Malformed 'paste-tasks' value in config file [path], using fallback.");`. Proceed to fallback 1.
    7. If the key does not exist: Proceed to fallback 1.
    8. **Fallback 1 (Tasks List):**
        a. Get the `tasks` list from the effective config.
        b. Check if it's a valid array with at least one non-empty string element.
        c. If valid: Resolve the *first* path (`tasks[0]`) based on the source (as in step 6c). Return the resolved path.
        d. If invalid: Proceed to fallback 2.
    9. **Fallback 2 (Default):**
        a. Resolve the default path: `path.resolve(process.cwd(), './.pew/tasks.md')`.
        b. Return the resolved default path.

#### Task 1.2: Update `ConfigService.setTasksPaths` for `init`
- [x] **Do:** Modify `ConfigService.setTasksPaths` (or create a related helper/adjust `handleInit`) to ensure that when setting paths during initialization, it writes *both* the `tasks` list (with a single path) and the `paste-tasks` string key to the target `paths.yaml` file.
- **Sequence Diagram:** (Illustrates the updated save logic)
    ```mermaid
    sequenceDiagram
        participant CliS_Init as CliService.handleInit
        participant CS as ConfigService
        participant YS as YamlService
        participant FSS as FileSystemService

        CliS_Init->>CS: setTasksPaths(['path/to/tasks.md'], false, 'path/to/tasks.md') # Example call signature change
        CS->>CS: Determine targetFile (localPathsFile) and configData (localPathsData)
        CS->>FSS: ensureDirectoryExists(path.dirname(targetFile))
        FSS-->>CS: void
        CS->>CS: Create updated config object: { ...configData, tasks: ['path/to/tasks.md'], 'paste-tasks': 'path/to/tasks.md' }
        CS->>YS: writeYamlFile(targetFile, updatedConfigObject)
        YS->>FSS: writeFile(targetFile, yamlString)
        FSS-->>YS: void
        YS-->>CS: void
        CS->>CS: Update this.localPathsData
        CS-->>CliS_Init: void
    ```
- **Files:**
    - U: `src/modules/config.service.ts`
- **Classes:**
    - U: `ConfigService`
- **Methods:**
    - U: `public async setTasksPaths(paths: string[], global: boolean, pasteTaskPath?: string): Promise<void>` (Proposed signature change, adding optional `pasteTaskPath`)
    - OR: Keep `setTasksPaths` as is and add a new method like `setInitialPaths(primaryPath: string): Promise<void>` specifically for `init`. Let's modify `setTasksPaths` for simplicity.
- **Variables:**
    - U: `setTasksPaths.configData` (Update this object before writing)
- **Process:**
    1. Open `src/modules/config.service.ts`.
    2. Modify the signature of `setTasksPaths` to accept an optional third parameter: `pasteTaskPath?: string`.
    3. Inside the method, after determining the `targetFile` and cloning `configData`:
        a. Set `configData.tasks = paths;`.
        b. **New:** If `pasteTaskPath` is provided (and not empty), set `configData['paste-tasks'] = pasteTaskPath;`.
        c. If `pasteTaskPath` is *not* provided or is empty, consider removing the key: `delete configData['paste-tasks'];` (or decide if it should default to `paths[0]`). For the `init` case, it *will* be provided.
    4. Proceed with writing the updated `configData` to the `targetFile` using `YamlService`.
    5. Update the in-memory cache (`this.globalPathsData` or `this.localPathsData`) with the modified `configData`.

### Milestone 2: Update CLI Command Handling
Modify `CliService` and `index.ts` to handle the new option, logic, and prompts for `paste tasks` and ensure `init` uses the updated config setting.

#### Task 2.1: Add `--path` Option to `pew paste tasks`
- [x] **Do:** Modify `src/index.ts` to define the optional `--path <value>` argument for the `pew paste tasks` command using `commander`.
- **Sequence Diagram:** (N/A - Configuration update)
- **Files:**
    - U: `src/index.ts`
- **Classes:**
    - N/A
- **Methods:**
    - N/A (Updating command definition)
- **Variables:**
    - N/A
- **Process:**
    1. Open `src/index.ts`.
    2. Locate the `.command('paste')` definition.
    3. Add a new `.option('--path <value>', 'Specify the target file path, overriding config')` line before the `.action(...)` call.
    4. Ensure the `options` object passed into the `action` function will now potentially contain a `path` property.

#### Task 2.2: Update `CliService.handleInit` Call
- [x] **Do:** Modify `CliService.handleInit` to call the updated `ConfigService.setTasksPaths` method, passing the determined task path as both the single element in the `paths` array and as the new `pasteTaskPath` argument.
- **Sequence Diagram:**
    ```mermaid
    sequenceDiagram
        participant CliS as CliService
        participant UIS as UserInputService
        participant CS as ConfigService

        Note over CliS: Inside handleInit
        alt Not flags.force
            CliS->>UIS: askForPath('Enter primary tasks file path:', '.pew/tasks.md')
            UIS-->>CliS: taskPath (e.g., 'user/tasks.md')
        else flags.force
            CliS->>CliS: taskPath = '.pew/tasks.md'
        end
        CliS->>CS: initialize()
        CS-->>CliS: void
        CliS->>CS: setTasksPaths([taskPath], false, taskPath) # Pass taskPath twice
        CS-->>CliS: void
        Note over CliS: Continue with file creation etc.
    ```
- **Files:**
    - U: `src/modules/cli.service.ts`
- **Classes:**
    - U: `CliService`
- **Methods:**
    - U: `async handleInit(flags: { force: boolean }): Promise<void>`
- **Variables:**
    - U: `handleInit.taskPath` (Use this value for both arguments)
- **Process:**
    1. Open `src/modules/cli.service.ts`.
    2. Locate the `handleInit` method.
    3. Find the line where `this.configService.setTasksPaths([taskPath], false);` is called.
    4. Modify the call to pass `taskPath` as the third argument: `await this.configService.setTasksPaths([taskPath], false, taskPath);`.

#### Task 2.3: Implement New Logic in `CliService.handlePasteTasks`
- [x] **Do:** Update `CliService.handlePasteTasks` to read the `--path` option, get the configured default path, check for override path existence, prompt the user if the override path doesn't exist, determine the final path, and call `TaskService.writeTasksContent` accordingly.
- **Sequence Diagram:** (Illustrates --path non-existent scenario)
    ```mermaid
    sequenceDiagram
        participant CliS as CliService
        participant options as CommanderOptions
        participant FSS as FileSystemService
        participant CS as ConfigService
        participant UIS as UserInputService
        participant TS as TaskService
        participant console as Console

        Note over CliS: Start handlePasteTasks(mode, options)
        CliS->>options: Read options.path (e.g., 'new/file.md')
        alt options.path is provided
            CliS->>FSS: pathExists(options.path)
            FSS-->>CliS: false
            CliS->>CS: getPasteTasksPath()
            CS-->>CliS: configuredPath (e.g., 'default/tasks.md')
            CliS->>UIS: askForConfirmation("Path 'new/file.md' does not exist. Paste into default 'default/tasks.md' instead?")
            UIS-->>CliS: userConfirmation (e.g., false)
            alt userConfirmation is false
                CliS->>console: log("Paste operation aborted.")
                CliS-->>: return
            else userConfirmation is true
                CliS->>CliS: finalPastePath = configuredPath
            end
        else options.path is provided AND exists
             CliS->>FSS: pathExists(options.path)
             FSS-->>CliS: true
             CliS->>CliS: finalPastePath = options.path
        end
        else options.path is NOT provided
            CliS->>CS: getPasteTasksPath()
            CS-->>CliS: configuredPath
            CliS->>CliS: finalPastePath = configuredPath
        end

        CliS->>TS: writeTasksContent(finalPastePath, clipboardContent, finalMode)
        TS-->>CliS: void
        CliS->>console: log("Pasted content to tasks file...")
    ```
- **Files:**
    - U: `src/modules/cli.service.ts`
- **Classes:**
    - U: `CliService`
- **Methods:**
    - U: `async handlePasteTasks(mode: 'overwrite' | 'append' | 'insert' | null, options: { path?: string }): Promise<void>` (Update signature to accept options)
    - R: `ConfigService.getPasteTasksPath()`
    - R: `FileSystemService.pathExists()`
    - R: `UserInputService.askForConfirmation()`
    - R: `TaskService.writeTasksContent()`
- **Variables:**
    - C: `handlePasteTasks.overridePath: string | undefined = options.path;`
    - C: `handlePasteTasks.finalPastePath: string;`
    - C: `handlePasteTasks.configuredPastePath: string;`
- **Process:**
    1. Open `src/modules/cli.service.ts`.
    2. Modify the signature of `handlePasteTasks` to accept the `options` object from Commander, specifically looking for `options.path`.
    3. Inside the `try` block, before determining the `finalMode`:
        a. Get the override path: `const overridePath = options.path;`.
        b. Get the configured default path: `const configuredPastePath = await this.configService.getPasteTasksPath();`.
        c. Initialize `let finalPastePath: string;`.
    4. Check if `overridePath` was provided.
        a. If `overridePath`:
            i. Check if it exists: `const overrideExists = await this.fileSystemService.pathExists(overridePath);`.
            ii. If `overrideExists`: Set `finalPastePath = overridePath;`.
            iii. If `!overrideExists`:
                1. Prompt the user: `const useDefault = await this.userInputService.askForConfirmation(\`Path '${overridePath}' does not exist. Paste into default '${configuredPastePath}' instead?\`, false);`.
                2. If `useDefault`: Set `finalPastePath = configuredPastePath;`.
                3. If `!useDefault`: Log "Paste operation aborted." and `return;`.
        b. If `!overridePath`: Set `finalPastePath = configuredPastePath;`.
    5. Remove the old logic that determined the file path using `configService.getTasksPaths()[0]`.
    6. Ensure the subsequent call to `this.taskService.writeTasksContent` uses `finalPastePath` instead of the old `filePath` variable.
    7. Update the success message to potentially reflect the final path used, if desired (optional).

### Milestone 3: Documentation Update
Update project documentation to reflect the new configuration key and command option.

#### Task 3.1: Update README.md
- [x] **Do:** Modify `README.md` to include the `paste-tasks` key in the `paths.yaml` example and add the `--path` option to the `pew paste tasks` command description in the table and examples.
- **Sequence Diagram:** (N/A - Documentation)
- **Files:**
    - U: `README.md`
- **Classes:** N/A
- **Methods:** N/A
- **Variables:** N/A
- **Process:**
    1. Open `README.md`.
    2. Locate the "Configuration" section and the `paths.yaml` structure example. Add the `paste-tasks: path/to/default/paste/target.md` key with a comment.
    3. Locate the "Commands" table. Update the row for `pew paste tasks`:
        - Add `--path <value>`: Specify the target file path, overriding config. to the Options column.
    4. Add or modify examples in the "Paste from Clipboard" section to demonstrate using `--path`.
    5. Briefly explain the precedence (`--path` > `paste-tasks` > fallback) in the description for `pew paste tasks`.

#### Task 3.2: Update Relevant Tutorial(s)
- [x] **Do:** Review tutorials like `how-to-set-up-repeatable-workflows-eg-build-steps-qa.md` and update any sections discussing `paths.yaml` or `pew paste tasks` to mention the new `paste-tasks` key and `--path` option.
- **Sequence Diagram:** (N/A - Documentation)
- **Files:**
    - U: `tutorials/how-to-set-up-repeatable-workflows-eg-build-steps-qa.md` (or others if applicable)
- **Classes:** N/A
- **Methods:** N/A
- **Variables:** N/A
- **Process:**
    1. Open `tutorials/how-to-set-up-repeatable-workflows-eg-build-steps-qa.md`.
    2. Review the "Configuration for Multiple Files" section. Add a note about the optional `paste-tasks` key in `paths.yaml` for setting a default paste target.
    3. Review any examples using `pew paste tasks` and consider adding a variation showing the `--path` option.
    4. Ensure the tutorial remains clear and accurate regarding the new functionality.

# Default Tasks
- [ ] Default Task 1
Pasted default content
