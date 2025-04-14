# Project Plan: Multi-File Task Iteration for `pew next task`

## 1. Project Overview
This project aims to enhance the `pew next task` command in the `pew-pew-cli` tool. The primary objective is to enable the command to iterate through multiple markdown task files, as configured in `paths.yaml`, instead of just the primary one. This involves finding the next available task across all files, correctly managing the `👉` prefix (adding, removing, moving it between files), updating the summary output to be file-specific, and implementing integration tests to ensure the new multi-file functionality works as expected under various scenarios.
- [x] Read the project overview:
    - Modify `pew next task` to support multiple task files defined in `paths.yaml`.
    - Implement logic to find the first available task across all configured files.
    - Manage the `👉` prefix correctly across files (add, remove, move).
    - Update the summary output to show statistics and the path for the file containing the current task.
    - Add integration tests for the multi-file behavior.

## 2. Requirements Analysis Summary
A concise summary of the requirements identified for this feature enhancement.
- [x] Review the requirements summary:
    - **👤 Actors & 🧩 Components:** `CliService`, `ConfigService`, `TaskService`, `FileSystemService`, `YamlService`, `User` (implicit), Task File(s), Console Output, Jest Test Runner, Mocks (fs, config, console).
    - **🎬 Activities:** Read multiple task files, Find first unchecked task across files, Find `👉` prefix across files, Add `👉` prefix to task line, Remove `👉` prefix from task line, Mark task as complete in line array, Write modified lines to specific file, Calculate stats for a single file, Display file-specific summary, Display relative file path, Log file read errors, Run integration tests.
    - **🌊 Activity Flows & Scenarios:** Iterating through files, Handling file read errors, Finding first task (in first file vs later file), Managing prefix (add new, move existing, complete task & add to next), Handling "all tasks complete", Handling no tasks found.
    - **📝 Properties:** List of task file paths, Current task file path, Current task line index, Current task line array, `👉` prefix file path, `👉` prefix line index, File-specific task statistics (total, completed, remaining), Relative file path string.
    - **🛠️ Behaviours:** Iterate files in configured order, Log errors and skip unreadable files, Wrap around file list when searching for next task after completion, Display summary based *only* on the current task's file, Display relative path below summary.
*(Full detailed analysis follows)*

## 3. Detailed Requirements

- 👤 **Actors & 🧩 Components:**
    - [Actor] User (Executes `pew next task`)
    - [Component] `pew` CLI Application
        - [Component] `CliService` (Orchestrates `next task` command)
        - [Component] `ConfigService` (Provides list of task file paths)
        - [Component] `TaskService` (Reads/writes specific task files, parses/modifies lines)
        - [Component] `FileSystemService` (Performs underlying file operations)
        - [Component] `YamlService` (Used by `ConfigService` to read `paths.yaml`)
        - [Component] Console Output (Displays task, summary, file path, errors)
    - [Component] Task File(s) (Markdown files containing tasks, referenced in `paths.yaml`)
        - [Component] Task Line (`- [ ]`, `- [x]`)
        - [Component] Header Line (`#`, `##`, etc.)
        - [Component] `👉` Prefix
    - [Component] `paths.yaml` (Configuration file listing task files)
    - [Actor] Jest Test Runner (Executes integration tests)
    - [Component] Test Environment
        - [Component] Filesystem Mock
        - [Component] `ConfigService` Mock
        - [Component] `console.log` Mock

- 🎬 **Activities:**
    - [`ConfigService`]
        - [Activity] Get all configured task file paths (resolved)
    - [`TaskService`]
        - [Activity] Read lines from a specific task file path
        - [Activity] Write lines to a specific task file path
        - [Activity] Check if line is task/unchecked/checked/header (Static)
        - [Activity] Check if line has `👉` prefix (Static)
        - [Activity] Get line without `👉` prefix (Static)
        - [Activity] Find task with `👉` prefix in lines (Static)
        - [Activity] Add `👉` prefix to line in array (Static)
        - [Activity] Remove `👉` prefix from line in array (Static)
        - [Activity] Find first unchecked task in lines (Static)
        - [Activity] Find next unchecked task in lines (Static)
        - [Activity] Find first task in lines (Static)
        - [Activity] Calculate task statistics from lines (Static)
        - [Activity] Format statistics summary string (Static)
        - [Activity] Get context headers from lines (Static)
        - [Activity] Get task output range from lines (Static)
        - [Activity] Mark task complete in line string (Static)
    - [`CliService` (`handleNextTask`)]
        - [Activity] Get all task file paths from `ConfigService`
        - [Activity] Iterate through file paths
        - [Activity] Read lines for current file path using `TaskService`
        - [Activity] Handle file read error (log, skip file)
        - [Activity] Find first unchecked task across all files' lines
        - [Activity] Find `👉` prefix location across all files' lines
        - [Activity] Determine overall state (no tasks, all complete, needs prefix, move prefix, complete task)
        - [Activity] Remove `👉` prefix from specific file's lines using `TaskService`
        - [Activity] Mark task complete in specific file's lines using `TaskService`
        - [Activity] Add `👉` prefix to specific file's lines using `TaskService`
        - [Activity] Write modified lines to correct file path using `TaskService`
        - [Activity] Find next unchecked task (potentially wrapping around file list)
        - [Activity] Calculate statistics for the current task's file lines using `TaskService`
        - [Activity] Get summary string for current file's stats using `TaskService`
        - [Activity] Get context headers for current task's lines using `TaskService`
        - [Activity] Get output range for current task's lines using `TaskService`
        - [Activity] Calculate relative path for current file
        - [Activity] Display task content to Console Output
        - [Activity] Display file-specific summary to Console Output
        - [Activity] Display relative file path to Console Output
        - [Activity] Display "All tasks complete" message with last file's summary
        - [Activity] Display "No tasks found" message
    - [Jest Test Runner]
        - [Activity] Execute integration tests for `CliService.handleNextTask`
        - [Activity] Use Mocks for filesystem, config, console

- 🌊 **Activity Flows & Scenarios:**
    - [Find First Unchecked Task Across Files]
        - GIVEN multiple task files are configured in `paths.yaml`
        - WHEN User runs `pew next task`
        - AND `CliService` gets the list of file paths from `ConfigService`
        - THEN `CliService` iterates through the file paths in order
        - AND For each path, `CliService` calls `TaskService.readTaskLines(filePath)`
        - [Error Flow: File Read Error]
            - GIVEN `TaskService.readTaskLines` throws an error for `filePath1`
            - THEN `CliService` logs an error message mentioning `filePath1`
            - AND `CliService` continues iteration with the next file path
        - AND `CliService` calls `TaskService.findFirstUncheckedTask(lines)` for each successfully read file
        - WHEN `TaskService.findFirstUncheckedTask` returns a valid index for `filePath2`
        - THEN `CliService` stores `filePath2`, the index, and its lines
        - AND `CliService` stops iterating through files for finding the task
    - [Manage `👉` Prefix - Add New]
        - GIVEN No `👉` prefix exists in any file
        - AND The first unchecked task is found at `taskIndex` in `lines` from `filePath`
        - WHEN `CliService` determines the "Needs Prefix" state
        - THEN `CliService` calls `TaskService.addPewPrefix(lines, taskIndex)`
        - AND `CliService` calls `TaskService.writeTaskLines(filePath, modifiedLines)`
        - AND `CliService` displays the task from `lines` at `taskIndex`
    - [Manage `👉` Prefix - Complete Task & Add Next]
        - GIVEN `👉` prefix exists on the first unchecked task at `taskIndex` in `lines` from `filePath`
        - WHEN `CliService` determines the "Complete Task" state
        - THEN `CliService` calls `TaskService.removePewPrefix(lines, taskIndex)`
        - AND `CliService` calls `TaskService.markTaskComplete(lines[taskIndex])` updating the line in `lines`
        - AND `CliService` calls `TaskService.writeTaskLines(filePath, modifiedLines)`
        - AND `CliService` searches for the *next* unchecked task starting from `filePath` (or the next file), potentially wrapping around
        - WHEN The next unchecked task is found at `nextTaskIndex` in `nextLines` from `nextFilePath`
        - THEN `CliService` calls `TaskService.addPewPrefix(nextLines, nextTaskIndex)`
        - AND `CliService` calls `TaskService.writeTaskLines(nextFilePath, nextModifiedLines)`
        - AND `CliService` displays the task from `nextLines` at `nextTaskIndex`
    - [Manage `👉` Prefix - Move Incorrect]
        - GIVEN `👉` prefix exists on a completed task at `pewIndex` in `pewLines` from `pewFilePath`
        - AND The first unchecked task is found at `taskIndex` in `taskLines` from `taskFilePath`
        - WHEN `CliService` determines the "Move Prefix" state
        - THEN `CliService` calls `TaskService.removePewPrefix(pewLines, pewIndex)`
        - AND `CliService` calls `TaskService.writeTaskLines(pewFilePath, modifiedPewLines)`
        - AND `CliService` calls `TaskService.addPewPrefix(taskLines, taskIndex)`
        - AND `CliService` calls `TaskService.writeTaskLines(taskFilePath, modifiedTaskLines)`
        - AND `CliService` displays the task from `taskLines` at `taskIndex`
    - [Display Summary]
        - GIVEN The current task to display is at `taskIndex` in `lines` from `filePath`
        - WHEN `CliService` prepares the output
        - THEN `CliService` calls `TaskService.getTaskStatsFromLines(lines)`
        - AND `CliService` calls `TaskService.getSummary(fileStats)`
        - AND `CliService` calls `path.relative(process.cwd(), filePath)`
        - THEN `CliService` prints the summary string to the console
        - AND `CliService` prints the relative path string on the next line

- 📝 **Properties:**
    - [`ConfigService`]
        - [allTasksPaths : string[]] (Resolved paths from local/global config)
    - [`CliService` (`handleNextTask` scope)]
        - [filePaths : string[]] (List of paths from `ConfigService`)
        - [currentFilePath : string] (Path of the file being processed in loop)
        - [currentLines : string[]] (Lines read from `currentFilePath`)
        - [firstUncheckedFilePath : string | null]
        - [firstUncheckedIndex : number] (-1 if none found)
        - [firstUncheckedLines : string[] | null]
        - [pewFilePath : string | null]
        - [pewIndex : number] (-1 if none found)
        - [pewLines : string[] | null]
        - [fileStats : { total: number, completed: number, remaining: number }] (Stats for the *current* file)
        - [summaryString : string]
        - [relativeFilePath : string]
    - [Task File Line]
        - [isTask : boolean]
        - [isUnchecked : boolean]
        - [isChecked : boolean]
        - [hasPewPrefix : boolean]
        - [content : string]

- 🛠️ **Behaviours:**
    - [`CliService.handleNextTask`]
        - [Behaviour] Should iterate through file paths obtained from `ConfigService` in the order they are returned.
        - [Behaviour] Should log an error message to the console and continue to the next file if `TaskService.readTaskLines` fails for a specific file path.
        - [Behaviour] Should identify the very first unchecked task (`- [ ]`) across all readable files, respecting the file iteration order.
        - [Behaviour] Should correctly identify the location (file path and index) of an existing `👉` prefix, if any.
        - [Behaviour] If no unchecked tasks are found, should display "✅ All tasks complete." along with the summary for the last file checked.
        - [Behaviour] If no tasks (`- [ ]` or `- [x]`) are found in any file, should display "✅ No tasks found." with a zero-stats summary.
        - [Behaviour] If `👉` prefix exists and is on the first unchecked task, should mark that task complete (`- [x]`), remove the prefix, write changes to that file, find the *next* unchecked task (wrapping around the file list if necessary), add the prefix to the next task, write changes to *its* file, and display the next task.
        - [Behaviour] If `👉` prefix exists but is *not* on the first unchecked task, should remove the prefix from its current location, write changes to that file, add the prefix to the *correct* first unchecked task, write changes to *its* file, and display the correct task.
        - [Behaviour] If no `👉` prefix exists, should add it to the first unchecked task found, write changes to that file, and display that task.
        - [Behaviour] When displaying a task, should calculate statistics (`getTaskStatsFromLines`) using *only* the lines from the file containing that task.
        - [Behaviour] When displaying a task, should show the summary string followed by the relative path of the task's file on a new line (e.g., `(File: path/to/tasks.md)`).

## 4. Milestones and Tasks

### Milestone 1: Refactor Services for Multi-File Support
Modify `ConfigService` and `TaskService` to handle multiple file paths and operate on specific files rather than assuming a single primary file.

#### Task 1.1: Update `ConfigService` to Get All Task Paths
- [x] **Do:** Add a new public method `getAllTasksPaths(): Promise<string[]>` to `ConfigService` that returns a resolved list of all task file paths, respecting local-over-global configuration precedence.
- **Sequence Diagram:**
    ```mermaid
    sequenceDiagram
        participant C as CliService
        participant CS as ConfigService
        participant FSS as FileSystemService
        participant YS as YamlService

        C->>CS: getAllTasksPaths()
        CS->>CS: initialize() # If not already initialized
        CS->>CS: _loadPathsConfig() # Loads local/global data
        CS->>CS: Determine config source (local or global)
        CS->>CS: Get raw paths array from configData.tasks
        CS->>CS: Resolve paths relative to project root or global dir
        CS-->>C: Return string[] (resolved paths)
    ```
- **Files:**
    - U: `src/modules/config.service.ts`
- **Classes:**
    - U: `ConfigService`
- **Methods:**
    - C: `public async getAllTasksPaths(): Promise<string[]>` (in `ConfigService`)
    - U: Potentially reuse internal logic from `getTasksPaths` like path resolution.
- **Process:**
    1. Open `src/modules/config.service.ts`.
    2. Define the new public async method `getAllTasksPaths`.
    3. Inside the method, ensure the service is initialized by calling `await this.initialize();`.
    4. Determine the effective configuration data: check if `this.localPathsFile` exists and `this.localPathsData` has content; if so, use `this.localPathsData`, otherwise use `this.globalPathsData`.
    5. Get the raw paths array from the `tasks` key of the effective configuration data (defaulting to `['.pew/tasks.md']` if the key is missing or not an array).
    6. Determine if the source was global (`config === this.globalPathsData`).
    7. Resolve the raw paths:
        - If the source is global, map paths using `path.resolve(this.globalConfigDir, p)`.
        - If the source is local (and `this.localConfigDir` is set), map paths using `path.resolve(path.dirname(this.localConfigDir), p)`.
        - Add a fallback for the default case if needed (e.g., `path.resolve(process.cwd(), p)`).
    8. Return the array of resolved paths.

#### Task 1.2: Refactor `TaskService` Instance Methods for File Path Parameter
- [x] **Do:** Modify `TaskService` instance methods `readTaskLines` and `writeTaskLines` to accept a `filePath: string` parameter and operate on that specific file, removing the internal reliance on `getPrimaryTasksFilePath`. Remove the `getPrimaryTasksFilePath` method.
- **Sequence Diagram:**
    ```mermaid
    sequenceDiagram
        participant CliS as CliService
        participant TS as TaskService
        participant FSS as FileSystemService

        CliS->>TS: readTaskLines(filePath)
        TS->>FSS: pathExists(filePath)
        FSS-->>TS: boolean
        alt File Exists
            TS->>FSS: readFile(filePath)
            FSS-->>TS: fileContent (string)
            TS->>TS: Split content into lines
            TS-->>CliS: string[] (lines)
        else File Does Not Exist
            TS-->>CliS: Throw Error
        end

        CliS->>TS: writeTaskLines(filePath, lines)
        TS->>TS: Join lines with newline
        TS->>FSS: ensureDirectoryExists(path.dirname(filePath))
        FSS-->>TS: void
        TS->>FSS: writeFile(filePath, content)
        FSS-->>TS: void
        TS-->>CliS: void
    ```
- **Files:**
    - U: `src/modules/task.service.ts`
- **Classes:**
    - U: `TaskService`
- **Methods:**
    - U: `async readTaskLines(filePath: string): Promise<string[]>` (was `async readTaskLines(): Promise<string[]>`) - Update signature and implementation to use `filePath` parameter.
    - U: `async writeTaskLines(filePath: string, lines: string[]): Promise<void>` (was `async writeTaskLines(lines: string[]): Promise<void>`) - Update signature and implementation to use `filePath` parameter.
    - D: `async getPrimaryTasksFilePath(): Promise<string>` (Delete this method).
    - U: Constructor - Remove initialization related to `tasksFilePath` if any.
    - U: Remove `tasksFilePath` class property.
- **Process:**
    1. Open `src/modules/task.service.ts`.
    2. Modify the signature of `readTaskLines` to accept `filePath: string`.
    3. Update the implementation of `readTaskLines` to use the passed `filePath` directly when calling `this.fileSystemService.pathExists` and `this.fileSystemService.readFile`. Remove any calls to `getPrimaryTasksFilePath`.
    4. Modify the signature of `writeTaskLines` to accept `filePath: string` and `lines: string[]`.
    5. Update the implementation of `writeTaskLines` to use the passed `filePath` directly when calling `path.dirname`, `this.fileSystemService.ensureDirectoryExists`, and `this.fileSystemService.writeFile`. Remove any calls to `getPrimaryTasksFilePath`.
    6. Delete the `getPrimaryTasksFilePath` method entirely.
    7. Remove the `tasksFilePath` class property.
    8. Remove any logic in the constructor related to setting `this.tasksFilePath`.

#### Task 1.3: Confirm `TaskService` Static Methods Suitability
- [x] **Do:** Review the existing static methods in `TaskService` to confirm they operate purely on input parameters (like line strings or line arrays) and do not implicitly rely on a single file context or instance state, making them suitable for the multi-file logic.
- **Sequence Diagram:** (N/A - Code review task)
- **Files:**
    - R: `src/modules/task.service.ts`
- **Classes:**
    - R: `TaskService`
- **Methods:**
    - R: `isTask(line: string): boolean`
    - R: `isUncheckedTask(line: string): boolean`
    - R: `isCheckedTask(line: string): boolean`
    - R: `isHeader(line: string): boolean`
    - R: `getLineHeaderLevel(line: string): number`
    - R: `isTaskOrHeader(line: string): boolean`
    - R: `lineHasPewPrefix(line: string): boolean`
    - R: `getLineWithoutPewPrefix(line: string): string`
    - R: `findTaskWithPewPrefix(lines: string[]): number`
    - R: `addPewPrefix(lines: string[], index: number): string[]`
    - R: `removePewPrefix(lines: string[], index: number): string[]`
    - R: `findFirstUncheckedTask(lines: string[]): number`
    - R: `findNextUncheckedTask(lines: string[], startIndex: number): number`
    - R: `findFirstTask(lines: string[]): number`
    - R: `getTaskStatsFromLines(lines: string[]): { total: number, completed: number, remaining: number }`
    - R: `getSummary(stats: { total: number, completed: number, remaining: number }): string`
    - R: `getContextHeaders(lines: string[], taskIndex: number): string`
    - R: `getTaskOutputRange(lines: string[], taskIndex: number): { startIndex: number, endIndex: number }`
    - R: `markTaskComplete(line: string): string`
- **Process:**
    1. Open `src/modules/task.service.ts`.
    2. Examine the implementation of each static method listed above.
    3. Verify that each method only uses its input parameters (`line`, `lines`, `index`, `stats`, etc.) and static properties/constants (like `TASK_PATTERN`, `PEW_PREFIX`).
    4. Confirm that none of these static methods access instance properties (like `this.tasksFilePath` which was removed) or call instance methods that rely on a single file context (like the old `readTaskLines` or `writeTaskLines`).
    5. Conclude that these methods are safe to use within the multi-file iteration logic in `CliService`.

### Milestone 2: Implement Multi-File Logic in `CliService.handleNextTask`
Update the `handleNextTask` method in `CliService` to iterate through all configured task files, manage the `👉` prefix across them, and update the summary output.

#### Task 2.1: Fetch All Paths in `handleNextTask`
- [x] **Do:** Modify `CliService.handleNextTask` to call the new `configService.getAllTasksPaths()` method instead of the previous `taskService.readTaskLines()` to get the list of files to process.
- **Sequence Diagram:**
    ```mermaid
    sequenceDiagram
        participant CliS as CliService
        participant CS as ConfigService

        Note over CliS: Start of handleNextTask()
        CliS->>CS: getAllTasksPaths()
        CS-->>CliS: filePaths: string[]
        Note over CliS: Store filePaths for iteration
    ```
- **Files:**
    - U: `src/modules/cli.service.ts`
- **Classes:**
    - U: `CliService`
- **Methods:**
    - U: `async handleNextTask(): Promise<void>`
- **Variables:**
    - C: `handleNextTask.const filePaths: string[] = await this.configService.getAllTasksPaths();`
    - D: Remove the initial call to `this.taskService.readTaskLines()` at the beginning of the method.
- **Process:**
    1. Open `src/modules/cli.service.ts`.
    2. Locate the `handleNextTask` method.
    3. Remove the existing line that reads the primary task file (e.g., `let lines = await this.taskService.readTaskLines();`).
    4. Add a new line near the beginning of the `try` block to call `configService.getAllTasksPaths()` and store the result in a variable, e.g., `const filePaths = await this.configService.getAllTasksPaths();`.
    5. Check if `filePaths` is empty. If so, display a "No task files configured" message and return.

#### Task 2.2: Implement Core Iteration Logic in `handleNextTask`
- [x] **Do:** Implement the main loop in `handleNextTask` to iterate through the fetched `filePaths`. Inside the loop, read each file's content, handle errors, find the first unchecked task across all files, and locate the current `👉` prefix. Determine the overall state after checking all files.
- **Sequence Diagram:**
    ```mermaid
    sequenceDiagram
        participant CliS as CliService
        participant TS as TaskService

        CliS->>CliS: Initialize state variables (firstUnchecked*, pew*) to null/empty/-1
        loop For each filePath in filePaths
            CliS->>TS: readTaskLines(filePath)
            alt Success
                TS-->>CliS: lines: string[]
                CliS->>TS: findFirstUncheckedTask(lines)
                TS-->>CliS: taskIndex: number
                alt taskIndex !== -1 AND firstUncheckedFilePath === null
                    CliS->>CliS: Store filePath, taskIndex, lines in firstUnchecked* variables
                end
                CliS->>TS: findTaskWithPewPrefix(lines)
                TS-->>CliS: pewIndex: number
                alt pewIndex !== -1
                    CliS->>CliS: Store filePath, pewIndex, lines in pew* variables
                end
            else Error Reading File
                TS-->>CliS: Error
                CliS->>CliS: Log error message for filePath
                CliS->>CliS: Continue to next filePath
            end
        end
        CliS->>CliS: Determine overall state based on firstUnchecked* and pew* variables
    ```
- **Files:**
    - U: `src/modules/cli.service.ts`
- **Classes:**
    - U: `CliService`
- **Methods:**
    - U: `async handleNextTask(): Promise<void>`
- **Variables:**
    - C: `handleNextTask.let firstUncheckedFilePath: string | null = null;`
    - C: `handleNextTask.let firstUncheckedIndex: number = -1;`
    - C: `handleNextTask.let firstUncheckedLines: string[] | null = null;`
    - C: `handleNextTask.let pewFilePath: string | null = null;`
    - C: `handleNextTask.let pewIndex: number = -1;`
    - C: `handleNextTask.let pewLines: string[] | null = null;`
    - C: `handleNextTask.let allLinesRead: Map<string, string[]> = new Map();` (To store lines for later use)
    - C: `handleNextTask.let totalTasksAcrossFiles = 0;`
    - C: `handleNextTask.let completedTasksAcrossFiles = 0;`
- **Process:**
    1. Inside `handleNextTask`, after getting `filePaths`, initialize the state variables (`firstUncheckedFilePath`, `firstUncheckedIndex`, `firstUncheckedLines`, `pewFilePath`, `pewIndex`, `pewLines`) to their default null/-1 values. Initialize `allLinesRead = new Map()` and task counters.
    2. Start a `for...of` loop iterating through `filePaths`.
    3. Inside the loop, wrap the file reading and processing in a `try...catch` block.
    4. **Try block:**
        a. Call `const currentLines = await this.taskService.readTaskLines(filePath);`.
        b. Store the lines: `allLinesRead.set(filePath, currentLines);`.
        c. Calculate stats for this file: `const fileStats = TaskService.getTaskStatsFromLines(currentLines);`
        d. Accumulate total stats: `totalTasksAcrossFiles += fileStats.total; completedTasksAcrossFiles += fileStats.completed;`
        e. If `firstUncheckedFilePath` is still `null` (meaning we haven't found the first one yet):
            i. Call `const taskIndex = TaskService.findFirstUncheckedTask(currentLines);`.
            ii. If `taskIndex !== -1`, update `firstUncheckedFilePath = filePath`, `firstUncheckedIndex = taskIndex`, `firstUncheckedLines = currentLines`.
        f. Call `const currentPewIndex = TaskService.findTaskWithPewPrefix(currentLines);`.
        g. If `currentPewIndex !== -1`, update `pewFilePath = filePath`, `pewIndex = currentPewIndex`, `pewLines = currentLines`. (This will overwrite if found in multiple files, effectively finding the last one, which is acceptable as there should only be one).
    5. **Catch block:**
        a. Log an error using `console.error(`Error reading task file ${filePath}:`, error);`.
        b. `continue;` to the next iteration of the loop.
    6. After the loop, determine the overall state based on the values of the state variables and total task counts. This logic will replace the initial checks from the old implementation. Example checks:
        - If `totalTasksAcrossFiles === 0`: Handle "No tasks found".
        - If `firstUncheckedIndex === -1`: Handle "All tasks complete".
        - Otherwise: Proceed to prefix management logic.

#### Task 2.3: Implement `👉` Prefix Management Across Files
- [x] **Do:** Implement the logic within `handleNextTask` to correctly add, remove, or move the `👉` prefix based on the state determined in Task 2.2, ensuring modifications are written back to the correct task files.
- **Sequence Diagram:** (Illustrates the "Complete Task & Add Next" scenario)
    ```mermaid
    sequenceDiagram
        participant CliS as CliService
        participant TS as TaskService

        Note over CliS: State: Complete Task (pewIndex === firstUncheckedIndex)
        CliS->>CliS: Get lines for completed task (firstUncheckedLines, firstUncheckedFilePath)
        CliS->>TS: removePewPrefix(firstUncheckedLines, firstUncheckedIndex)
        TS-->>CliS: modifiedLines (prefix removed)
        CliS->>TS: markTaskComplete(modifiedLines[firstUncheckedIndex])
        TS-->>CliS: completedLineString
        CliS->>CliS: Update line in modifiedLines array
        CliS->>TS: writeTaskLines(firstUncheckedFilePath, modifiedLines)
        TS-->>CliS: void

        CliS->>CliS: Find NEXT unchecked task (loop through files, starting after firstUncheckedFilePath, wrap around)
        alt Next task found (nextFilePath, nextIndex, nextLines)
            CliS->>TS: addPewPrefix(nextLines, nextIndex)
            TS-->>CliS: nextModifiedLines
            CliS->>TS: writeTaskLines(nextFilePath, nextModifiedLines)
            TS-->>CliS: void
            CliS->>CliS: Prepare display for NEXT task
        else No next task found
             CliS->>CliS: Prepare "All tasks complete" display
        end
    ```
- **Files:**
    - U: `src/modules/cli.service.ts`
- **Classes:**
    - U: `CliService`
- **Methods:**
    - U: `async handleNextTask(): Promise<void>`
- **Process:**
    1. Structure the logic after the iteration loop (Task 2.2) using `if/else if` blocks based on the determined state.
    2. **Scenario: Needs Prefix (`pewIndex === -1` and `firstUncheckedIndex !== -1`)**
        a. Get the correct lines: `let linesToModify = allLinesRead.get(firstUncheckedFilePath);` (Handle potential map miss).
        b. Add prefix: `const modifiedLines = TaskService.addPewPrefix(linesToModify, firstUncheckedIndex);`.
        c. Write back: `await this.taskService.writeTaskLines(firstUncheckedFilePath, modifiedLines);`.
        d. Set variables for display: `displayFilePath = firstUncheckedFilePath`, `displayIndex = firstUncheckedIndex`, `displayLines = modifiedLines`.
    3. **Scenario: Move Prefix (`pewIndex !== -1` and `pewFilePath !== firstUncheckedFilePath` or `pewIndex !== firstUncheckedIndex`)**
        a. Get lines for *old* prefix location: `let oldPrefixLines = allLinesRead.get(pewFilePath);`.
        b. Remove old prefix: `const linesWithoutOldPrefix = TaskService.removePewPrefix(oldPrefixLines, pewIndex);`.
        c. Write back old file: `await this.taskService.writeTaskLines(pewFilePath, linesWithoutOldPrefix);`.
        d. Get lines for *new* prefix location: `let newPrefixLines = allLinesRead.get(firstUncheckedFilePath);`.
        e. Add new prefix: `const linesWithNewPrefix = TaskService.addPewPrefix(newPrefixLines, firstUncheckedIndex);`.
        f. Write back new file: `await this.taskService.writeTaskLines(firstUncheckedFilePath, linesWithNewPrefix);`.
        g. Set variables for display: `displayFilePath = firstUncheckedFilePath`, `displayIndex = firstUncheckedIndex`, `displayLines = linesWithNewPrefix`.
    4. **Scenario: Complete Task (`pewIndex !== -1` and `pewFilePath === firstUncheckedFilePath` and `pewIndex === firstUncheckedIndex`)**
        a. Get lines for completed task: `let completedTaskLines = allLinesRead.get(firstUncheckedFilePath);`.
        b. Remove prefix: `let linesNoPrefix = TaskService.removePewPrefix(completedTaskLines, firstUncheckedIndex);`.
        c. Mark complete: `const completedLine = TaskService.markTaskComplete(linesNoPrefix[firstUncheckedIndex]); linesNoPrefix[firstUncheckedIndex] = completedLine;`.
        d. Write back completed file: `await this.taskService.writeTaskLines(firstUncheckedFilePath, linesNoPrefix);`.
        e. **Find Next Task:**
            i. Implement a helper function or inline logic to search for the next unchecked task. Start searching from `firstUncheckedIndex + 1` in `linesNoPrefix`.
            ii. If not found, continue iterating through the *rest* of the `filePaths` array (using `allLinesRead`), starting from the file *after* `firstUncheckedFilePath`.
            iii. If still not found, wrap around and search from the *beginning* of the `filePaths` array up to (but not including) `firstUncheckedFilePath`.
            iv. Store the result: `nextFilePath`, `nextIndex`, `nextLines`.
        f. **If Next Task Found:**
            i. Add prefix to next task: `const nextLinesWithPrefix = TaskService.addPewPrefix(nextLines, nextIndex);`.
            ii. Write back next file: `await this.taskService.writeTaskLines(nextFilePath, nextLinesWithPrefix);`.
            iii. Set variables for display: `displayFilePath = nextFilePath`, `displayIndex = nextIndex`, `displayLines = nextLinesWithPrefix`.
            iv. Set flag `taskWasCompleted = true`.
        g. **If No Next Task Found:**
            i. Set flag `allNowComplete = true`.
            ii. Set variables for display: `displayFilePath = firstUncheckedFilePath`, `displayLines = linesNoPrefix`.
    5. Ensure all file paths and line arrays used in these scenarios are correctly retrieved from the `allLinesRead` map or updated state variables.

#### Task 2.4: Update Summary Output in `handleNextTask`
- [x] **Do:** Modify the console output section of `handleNextTask` to calculate statistics based *only* on the lines of the file containing the task being displayed, format the summary, and append the relative file path on a new line.
- **Sequence Diagram:**
    ```mermaid
    sequenceDiagram
        participant CliS as CliService
        participant TS as TaskService
        participant path as NodeJSPathModule

        Note over CliS: Preparing display for task in displayFilePath at displayIndex
        CliS->>TS: getTaskStatsFromLines(displayLines)
        TS-->>CliS: fileStats: {total, completed, remaining}
        CliS->>TS: getSummary(fileStats)
        TS-->>CliS: summaryString: string
        CliS->>path: relative(process.cwd(), displayFilePath)
        path-->>CliS: relativePath: string
        CliS->>CliS: Format output string for file path: e.g., "(File: relativePath)"
        CliS->>Console: log(task content)
        CliS->>Console: log(summaryString)
        CliS->>Console: log(formatted file path string)
    ```
- **Files:**
    - U: `src/modules/cli.service.ts`
- **Classes:**
    - U: `CliService`
- **Methods:**
    - U: `async handleNextTask(): Promise<void>`
- **Variables:**
    - U: Use `displayFilePath`, `displayIndex`, `displayLines` (set in Task 2.3) for calculations and output.
    - C: `handleNextTask.const fileStats = TaskService.getTaskStatsFromLines(displayLines);`
    - C: `handleNextTask.const summaryString = TaskService.getSummary(fileStats);`
    - C: `handleNextTask.const relativePath = path.relative(process.cwd(), displayFilePath);`
    - C: `handleNextTask.const filePathString = \`(File: ${relativePath})\`;`
- **Process:**
    1. Locate the sections in `handleNextTask` where the task content and summary are printed to the console (e.g., after adding/moving the prefix, or after completing a task and finding the next one, or when all tasks are complete).
    2. Ensure you have the correct line array (`displayLines`) and file path (`displayFilePath`) for the task being shown (or the last file checked if all complete).
    3. Calculate stats *only* for `displayLines`: `const fileStats = TaskService.getTaskStatsFromLines(displayLines);`.
    4. Generate the summary string: `const summaryString = TaskService.getSummary(fileStats);`.
    5. Calculate the relative path: `const relativePath = path.relative(process.cwd(), displayFilePath);`. Use the `path` module (ensure it's imported: `import * as path from 'path';`).
    6. Format the file path string: `const filePathString = \`(File: ${relativePath})\`;`.
    7. Modify the `console.log` calls:
        - Print the task content as before (using `getContextHeaders`, `getTaskOutputRange` with `displayLines` and `displayIndex`).
        - Print the `summaryString`.
        - Print the `filePathString` on a new line immediately after the summary.
    8. Adapt the "All tasks complete" and "No tasks found" messages to also include the final summary string and file path string (likely from the last file processed).

### Milestone 3: Implement Integration Tests
Create integration tests for `CliService.handleNextTask` to verify the new multi-file functionality, including task finding, prefix management, and summary output, using mocks.

#### Task 3.1: Set up Integration Test Environment
- [x] **Do:** Create the integration test file and configure Jest mocks for the filesystem (`fs`), `ConfigService`, and `console.log` to control inputs and capture outputs during tests.
- **Sequence Diagram:** (N/A - Test setup)
- **Files:**
    - C: `tests/integration/cli-service.test.ts`
    - U: `jest.config.js` (Potentially, if specific setup needed)
- **Classes:**
    - C: Test suite structure (`describe`, `beforeEach`, `test`)
- **Methods:**
    - C: Mock implementations for `fs.promises.readFile`, `fs.promises.writeFile`, `fs.promises.access`, `fs.promises.mkdir`.
    - C: Mock implementation for `ConfigService.getInstance().getAllTasksPaths`.
    - C: Mock implementation for `console.log`.
- **Process:**
    1. Create the directory `tests/integration/` if it doesn't exist.
    2. Create the file `tests/integration/cli-service.test.ts`.
    3. Import necessary modules (`CliService`, `ConfigService`, `TaskService`, `fs`, `path`).
    4. Use `jest.mock('fs', ...)` or similar techniques to provide mock implementations for file system operations. A common pattern is to use an in-memory representation of files.
    5. Use `jest.mock('../../src/modules/config.service.js', ...)` to mock `ConfigService`. Ensure the mock allows setting the return value for `getAllTasksPaths()` per test case.
    6. Set up mocking for `console.log` (e.g., `jest.spyOn(console, 'log').mockImplementation(() => {});`) within `beforeEach` or individual tests to capture output. Remember to restore mocks in `afterEach`.
    7. Instantiate `CliService.getInstance()` within tests or `beforeEach`.

#### Task 3.2: Write Test for Single File Scenario
- [x] **Do:** Create a test case verifying `handleNextTask` functions correctly when the mocked `ConfigService` returns only one file path, mimicking the original behavior but using the refactored multi-file code path.
- **Sequence Diagram:**
    ```mermaid
    sequenceDiagram
        participant Test as JestTest
        participant M_Config as MockConfigService
        participant M_FS as MockFileSystem
        participant CliS as CliService
        participant M_Console as MockConsole

        Test->>M_Config: Setup getAllTasksPaths() to return ['file1.md']
        Test->>M_FS: Setup 'file1.md' content (e.g., one unchecked task)
        Test->>CliS: handleNextTask()
        CliS->>M_Config: getAllTasksPaths()
        M_Config-->>CliS: ['file1.md']
        CliS->>M_FS: readFile('file1.md')
        M_FS-->>CliS: file content
        CliS->>M_FS: writeFile('file1.md') # To add prefix
        M_FS-->>CliS: void
        CliS->>M_Console: log(...) # Task output, summary, file path
        Test->>M_Console: Assert correct output captured
        Test->>M_FS: Assert 'file1.md' content now includes prefix
    ```
- **Files:**
    - U: `tests/integration/cli-service.test.ts`
- **Process:**
    1. Create a `test('should handle single file correctly', async () => { ... });` block.
    2. Configure `MockConfigService` to return `['./.pew/tasks1.md']`.
    3. Configure `MockFileSystem` with initial content for `./.pew/tasks1.md` (e.g., `# Header
- [x] Task 1`).
    4. Call `await CliService.getInstance().handleNextTask();`.
    5. Assert that `console.log` was called with the expected task output, summary (for Task 1's file), and file path `(File: .pew/tasks1.md)`.
    6. Assert that the content of `./.pew/tasks1.md` in the `MockFileSystem` was updated to include the `👉` prefix on Task 1.

#### Task 3.3: Write Tests for Multi-File Scenarios (Task Finding)
- [x] **Do:** Create test cases with multiple mocked task files to verify that `handleNextTask` correctly identifies the first available task across different files under various conditions.
- **Files:**
    - U: `tests/integration/cli-service.test.ts`
- **Process:**
    1. **Scenario 1: First unchecked in File 2:**
        - Mock `getAllTasksPaths` -> `['f1.md', 'f2.md']`.
        - Mock `f1.md` content: `- [x] Done`.
        - Mock `f2.md` content: `- [ ] Task A`.
        - Run `handleNextTask`.
        - Assert output shows Task A.
        - Assert `f2.md` content has prefix added to Task A.
    2. **Scenario 2: First unchecked in File 1:**
        - Mock `getAllTasksPaths` -> `['f1.md', 'f2.md']`.
        - Mock `f1.md` content: `- [ ] Task B`.
        - Mock `f2.md` content: `- [ ] Task C`.
        - Run `handleNextTask`.
        - Assert output shows Task B.
        - Assert `f1.md` content has prefix added to Task B.
    3. **Scenario 3: All tasks complete:**
        - Mock `getAllTasksPaths` -> `['f1.md', 'f2.md']`.
        - Mock `f1.md` content: `- [x] Done 1`.
        - Mock `f2.md` content: `- [x] Done 2`.
        - Run `handleNextTask`.
        - Assert `console.log` includes "All tasks complete".
        - Assert summary output reflects stats for `f2.md` (the last file checked).
    4. **Scenario 4: Empty/No Task Files:**
        - Mock `getAllTasksPaths` -> `['f1.md', 'f2.md']`.
        - Mock `f1.md` content: `# Header only`.
        - Mock `f2.md` content: `` (empty string).
        - Run `handleNextTask`.
        - Assert `console.log` includes "No tasks found".
    5. **Scenario 5: Unreadable File:**
        - Mock `getAllTasksPaths` -> `['f1.md', 'f2.md']`.
        - Mock `f1.md` content: `- [ ] Task D`.
        - Mock `fs.readFile` to throw an error when called for `f2.md`.
        - Mock `console.error` spy.
        - Run `handleNextTask`.
        - Assert `console.error` was called with an error message for `f2.md`.
        - Assert output shows Task D (from `f1.md`).
        - Assert `f1.md` content has prefix added to Task D.

#### Task 3.4: Write Tests for Multi-File Scenarios (`👉` Prefix)
- [x] **Do:** Create test cases focusing on the correct addition, removal, and movement of the `👉` prefix across multiple mocked files during task completion and state correction.
- **Files:**
    - U: `tests/integration/cli-service.test.ts`
- **Process:**
    1. **Scenario 1: Complete Task A (File 1), Next Task B (File 2):**
        - Mock `getAllTasksPaths` -> `['f1.md', 'f2.md']`.
        - Mock `f1.md` content: `👉 - [ ] Task A`.
        - Mock `f2.md` content: `- [ ] Task B`.
        - Run `handleNextTask`.
        - Assert `f1.md` content becomes `- [x] Task A`.
        - Assert `f2.md` content becomes `👉 - [ ] Task B`.
        - Assert output shows Task B.
    2. **Scenario 2: Complete Task C (File 2), Next Task D (File 1 - Wrap Around):**
        - Mock `getAllTasksPaths` -> `['f1.md', 'f2.md']`.
        - Mock `f1.md` content: `- [ ] Task D`.
        - Mock `f2.md` content: `👉 - [ ] Task C`.
        - Run `handleNextTask`.
        - Assert `f2.md` content becomes `- [x] Task C`.
        - Assert `f1.md` content becomes `👉 - [ ] Task D`.
        - Assert output shows Task D.
    3. **Scenario 3: No prefix, First Task E (File 2):**
        - Mock `getAllTasksPaths` -> `['f1.md', 'f2.md']`.
        - Mock `f1.md` content: `- [x] Done`.
        - Mock `f2.md` content: `- [ ] Task E`.
        - Run `handleNextTask`.
        - Assert `f1.md` content remains unchanged.
        - Assert `f2.md` content becomes `👉 - [ ] Task E`.
        - Assert output shows Task E.
    4. **Scenario 4: Incorrect Prefix (Task F, File 1), Correct Task G (File 2):**
        - Mock `getAllTasksPaths` -> `['f1.md', 'f2.md']`.
        - Mock `f1.md` content: `👉 - [x] Task F`.
        - Mock `f2.md` content: `- [ ] Task G`.
        - Run `handleNextTask`.
        - Assert `f1.md` content becomes `- [x] Task F`.
        - Assert `f2.md` content becomes `👉 - [ ] Task G`.
        - Assert output shows Task G.

#### Task 3.5: Write Tests for Summary Output Accuracy
- [x] **Do:** Enhance the multi-file test scenarios (from Tasks 3.3 and 3.4) to specifically assert that the `console.log` output for the summary line and the file path line are accurate for the file containing the *currently displayed* task.
- **Files:**
    - U: `tests/integration/cli-service.test.ts`
- **Process:**
    1. Revisit the test cases created in Tasks 3.3 and 3.4.
    2. In each test where a task is displayed (not "All complete" or "No tasks"), add assertions against the captured `console.log` output.
    3. **Example Assertion (Scenario 1 from Task 3.4):**
        - After running `handleNextTask`, Task B from `f2.md` should be displayed.
        - Calculate the expected stats for `f2.md` *at that point* (Total: 1, Completed: 0, Remaining: 1).
        - Calculate the expected summary string: `Total: 1 task(s) | Completed: 0 (0.0%) | Remaining: 1`.
        - Calculate the expected relative path: `(File: f2.md)`.
        - Assert that `console.log` was called with the expected summary string.
        - Assert that `console.log` was called with the expected relative path string on the next line.
    4. **Example Assertion (Scenario 3 from Task 3.3):**
        - After running `handleNextTask`, the "All tasks complete" message should be shown.
        - Calculate expected stats for `f2.md` (the last file checked): Total: 1, Completed: 1, Remaining: 0.
        - Calculate expected summary: `Total: 1 task(s) | Completed: 1 (100.0%) | Remaining: 0`.
        - Calculate expected relative path: `(File: f2.md)`.
        - Assert `console.log` includes the "All tasks complete" message.
        - Assert `console.log` was called with the expected summary string.
        - Assert `console.log` was called with the expected relative path string on the next line.
    5. Apply similar assertions to other relevant test cases, ensuring the stats and path match the file of the task being displayed *after* any modifications within that `handleNextTask` call.

## Test New Task

- [x] This is a new unchecked task in the first file