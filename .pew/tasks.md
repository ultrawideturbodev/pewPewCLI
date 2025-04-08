```markdown
<chatName="pew-next-task-logic-update"/>
# Project Plan: Update `pew next task` Logic with `[pew]` Prefix

## 1. Project Overview
This project aims to refactor the `pew next task` command logic within the `pew-pew-cli` application. The update introduces a `[pew]` prefix to explicitly mark the task currently in focus. The command will now manage this prefix, update task completion status, and present relevant task context based on the presence and location of the `[pew]` prefix and task completion states.
- [x] Read the project overview:
    - The goal is to modify `TaskService` and `CliService` to handle the `[pew]` prefix for identifying the next task, completing tasks, and displaying context according to the new rules specified in the user request.

## 2. Requirements
Overview of all requirements based on user request and codebase analysis.
- [x] Read the requirements:
    - 👤 **Actors & 🧩 Components:**
        - **Actors:**
            - User (executing `pew next task`)
            - Developer (implementing the changes)
        - **Components:**
            - CLI Application (`pewPewCLI`)
            - `CliService` (handles command logic)
            - `TaskService` (handles task file parsing, manipulation, `[pew]` prefix logic)
            - `FileSystemService` (reads/writes task file)
            - Tasks File (e.g., `.pew/tasks.md`, Markdown format)
            - Console Output (displays messages, task context, summary)
            - `[pew]` Prefix (string marker `"[pew] "`)
            - Task Line (string representing a task, e.g., `- [ ] Task`)
            - Header Line (string representing a markdown header, e.g., `# Header`)
            - Task Statistics (total, completed, remaining, percentage)
            - Commander Instance (`program` in `src/index.ts`)

    - 🎬 **Activities:** Specify what actions need to be performed.
        - [User]
            - Execute `pew next task` command
        - [CLI Application]
            - Parse `next task` command
            - Invoke `CliService.handleNextTask`
        - [`CliService`]
            - Coordinate task processing using `TaskService`
            - Read task file content via `TaskService`
            - Determine current state (empty, all complete, task needs prefix, task ready for completion)
            - Instruct `TaskService` to add/remove `[pew]` prefix
            - Instruct `TaskService` to mark task complete
            - Instruct `TaskService` to get presentation context
            - Instruct `FileSystemService` (via `TaskService`) to write updated file content
            - Format and display output (messages, task context, summary) to Console Output
        - [`TaskService`]
            - Read task lines from file via `FileSystemService`
            - Write task lines to file via `FileSystemService`
            - Find first incomplete task index
            - Find index of task with `[pew]` prefix
            - Add `[pew]` prefix to a specific line
            - Remove `[pew]` prefix from a specific line
            - Mark task line as complete (`- [ ]` -> `- [x]`)
            - Calculate task statistics from lines
            - Identify headers and task lines using regex
            - Determine presentation range (start/end lines) for a given task index
            - Extract context headers for a given task index
            - Generate summary string
        - [`FileSystemService`]
            - Read file content
            - Write file content
            - Check file existence
        - [Tasks File]
            - Store task lines and headers
            - Persist `[pew]` prefix location
            - Persist task completion status
        - [Console Output]
            - Display feedback messages (e.g., "No tasks found", "Task marked complete", "All tasks complete")
            - Display task content/context
            - Display task summary

    - 🌊 **Activity Flows & Scenarios:** Break down complex activities into step-by-step processes.
        - [`pew next task` Execution Flow]
            - GIVEN User executes `pew next task`
            - WHEN `CliService.handleNextTask` is called
            - THEN `TaskService` reads task lines
            - AND `TaskService` finds first incomplete task index (`firstUncheckedIndex`)
            - AND `TaskService` finds `[pew]` prefix index (`pewIndex`)
            - AND `TaskService` calculates initial stats (`statsBefore`)
            - [Scenario: Empty/No Tasks]
                - GIVEN `lines` is empty OR no task lines found
                - THEN `CliService` prints "No tasks found."
                - AND `CliService` prints summary (0/0/0)
                - AND `CliService` exits
            - [Scenario: All Tasks Complete]
                - GIVEN `firstUncheckedIndex` is -1
                - THEN IF `pewIndex` is not -1
                    - THEN `TaskService` removes `[pew]` from `lines[pewIndex]`
                    - AND `TaskService` writes updated lines
                - THEN `CliService` prints "✅ All tasks complete."
                - AND `CliService` prints summary (`statsBefore`)
                - AND `CliService` exits
            - [Scenario: `[pew]` on Wrong Task]
                - GIVEN `pewIndex` is not -1 AND `pewIndex` != `firstUncheckedIndex`
                - THEN `TaskService` removes `[pew]` from `lines[pewIndex]`
                - AND `pewIndex` is treated as -1 for subsequent steps in this run
                - *(Continues to 'Needs Prefix' Scenario)*
            - [Scenario: Needs `[pew]` Prefix]
                - GIVEN `pewIndex` is -1 (or was reset in previous step)
                - THEN `TaskService` adds `[pew]` prefix to `lines[firstUncheckedIndex]`
                - AND `TaskService` writes updated lines
                - AND `TaskService` determines presentation range for `firstUncheckedIndex`
                - AND `TaskService` gets context headers for `firstUncheckedIndex`
                - AND `CliService` prints context headers
                - AND `CliService` prints task presentation range content
                - AND `CliService` prints summary (`statsBefore`)
                - AND `CliService` exits
            - [Scenario: Complete Task with `[pew]`]
                - GIVEN `pewIndex` == `firstUncheckedIndex`
                - THEN `TaskService` removes `[pew]` prefix from `lines[firstUncheckedIndex]`
                - AND `TaskService` marks task complete (`- [ ]` -> `- [x]`) on `lines[firstUncheckedIndex]`
                - AND `TaskService` writes updated lines
                - AND `CliService` prints "✅ Task marked as complete"
                - AND `TaskService` calculates `statsAfter`
                - AND `TaskService` finds *new* first incomplete task index (`nextUncheckedIndex`)
                - THEN IF `nextUncheckedIndex` is not -1
                    - THEN `TaskService` adds `[pew]` prefix to `lines[nextUncheckedIndex]`
                    - AND `TaskService` writes updated lines *again*
                    - AND `TaskService` determines presentation range for `nextUncheckedIndex`
                    - AND `TaskService` gets context headers for `nextUncheckedIndex`
                    - AND `CliService` prints context headers
                    - AND `CliService` prints task presentation range content
                    - AND `CliService` prints summary (`statsAfter`)
                - ELSE (`nextUncheckedIndex` is -1)
                    - THEN `CliService` prints "✅ All tasks complete."
                    - THEN `CliService` prints summary (`statsAfter`)
                - AND `CliService` exits

    - 📝 **Properties:** Define any values or configurations associated with components or activities.
        - [`TaskService`]
            - [PEW_PREFIX : string] = `"[pew] "` (Constant)
            - [PEW_PREFIX_REGEX : RegExp] = `/^\[pew\]\s+/` (Constant)
            - [TASK_PATTERN : RegExp] (Updated to handle optional prefix)
            - [UNCHECKED_PATTERN : RegExp] (Updated to handle optional prefix)
            - [CHECKED_PATTERN : RegExp] (Updated to handle optional prefix)
            - [HEADER_PATTERN : RegExp] (Existing)
        - [`CliService.handleNextTask`]
            - [lines : string[]] (Current content of task file)
            - [firstUncheckedIndex : number] (Index of first `- [ ]` task)
            - [pewIndex : number] (Index of task starting with `[pew] `)
            - [statsBefore : object] ({ total, completed, remaining })
            - [statsAfter : object] ({ total, completed, remaining })
            - [nextUncheckedIndex : number] (Index of next `- [ ]` task after completion)
        - [Task Presentation Range]
            - [startIndex : number]
            - [endIndex : number]
        - [Task Statistics]
            - [total : number]
            - [completed : number]
            - [remaining : number]
            - [percentComplete : number]

    - 🛠️ **Behaviours:** Describe how actors, components, properties, and activities should act or respond in different situations.
        - [`TaskService`]
            - [Should correctly identify task lines regardless of `[pew]` prefix presence]
            - [Should correctly find the first incomplete task index]
            - [Should correctly find the index of the task with the `[pew]` prefix, if any]
            - [Should add `[pew]` prefix idempotently (or ensure only one exists)]
            - [Should remove `[pew]` prefix correctly]
            - [Should mark task complete without corrupting the line or prefix]
            - [Should calculate presentation range based on surrounding headers and tasks]
            - [Should calculate statistics accurately, ignoring `[pew]` for counting]
        - [`CliService`]
            - [Should follow the state machine logic defined in Activity Flows]
            - [Should handle file I/O via `TaskService`]
            - [Should provide clear console output for each scenario]
            - [Should always display the summary at the end of execution]
        - [Console Output]
            - [Should clearly indicate which task is being presented]
            - [Should show context headers when available]
            - [Should display the correct summary statistics]

## 3. Milestones and Tasks
The project is broken down into two milestones: enhancing the `TaskService` with prefix and presentation logic, and then refactoring the `CliService` to use the enhanced service.

*Assumption*: The refined presentation logic (using preceding/subsequent headers/tasks to define the block) and the state machine flow (including handling misplaced `[pew]` prefixes and the two-step process for completing tasks without a prefix) are accepted based on the thought process and proposed flow.

### Milestone 1: Enhance Task Service Logic
Update `TaskService` to handle the `[pew]` prefix, refine task identification, and implement the new presentation range calculation.

#### Task 1.1: Implement `[pew]` Prefix Management
- [x] 1. Add methods to `TaskService` for finding, adding, and removing the `[pew]` prefix from task lines.
    - Sequence diagram:
        ```mermaid
        sequenceDiagram
            CliService->>TaskService: findTaskWithPewPrefix(lines)
            TaskService-->>CliService: pewIndex
            CliService->>TaskService: addPewPrefix(lines, index)
            TaskService-->>TaskService: Modify lines[index]
            TaskService-->>CliService: updatedLines
            CliService->>TaskService: removePewPrefix(lines, index)
            TaskService-->>TaskService: Modify lines[index]
            TaskService-->>CliService: updatedLines
        ```
    - Files:
        - Update: `src/modules/task.service.ts`
    - Classes:
        - Update: `TaskService`
    - Variables:
        - Add (Constants): `TaskService.PEW_PREFIX = "[pew] "`
        - Add (Constants): `TaskService.PEW_PREFIX_REGEX = /^\[pew\]\s+/`
    - Methods:
        - Add: `TaskService.findTaskWithPewPrefix(lines: string[]): number` (Returns index or -1)
        - Add: `TaskService.addPewPrefix(lines: string[], index: number): string[]` (Returns modified lines array)
        - Add: `TaskService.removePewPrefix(lines: string[], index: number): string[]` (Returns modified lines array)
        - Add Helper (Private Static): `TaskService.getLineWithoutPewPrefix(line: string): string` (Returns line content after prefix, or original line if no prefix)
        - Add Helper (Private Static): `TaskService.lineHasPewPrefix(line: string): boolean`
    - Process:
        - Implement `findTaskWithPewPrefix` to iterate through lines and use `PEW_PREFIX_REGEX.test()`.
        - Implement `addPewPrefix` to check if the prefix exists using `lineHasPewPrefix` before prepending `PEW_PREFIX` to `lines[index]`. Return a *new* array or modify in place depending on preference (returning new is safer).
        - Implement `removePewPrefix` to use `line.replace(PEW_PREFIX_REGEX, '')` on `lines[index]` if the prefix exists. Return a *new* array or modify in place.
        - Implement helper methods.

#### Task 1.2: Refine Task Identification and Completion
- [x] 1. Update existing `TaskService` static methods (`isTask`, `isUncheckedTask`, `isCheckedTask`, `findFirstUncheckedTask`, `markTaskComplete`, `getTaskStatsFromLines`) to correctly handle lines that may or may not have the `[pew]` prefix.
    - Sequence diagram:
        ```mermaid
        sequenceDiagram
            participant C as CliService
            participant T as TaskService
            C->>T: findFirstUncheckedTask(lines)
            T->>T: Loop lines
            T->>T: isUncheckedTask(line) // Ignores prefix
            T-->>C: index
            C->>T: markTaskComplete(line)
            T->>T: Check if line has prefix
            T->>T: Modify line (replace `- [ ]` with `- [x]`)
            T-->>C: modifiedLine // Prefix preserved if present
            C->>T: getTaskStatsFromLines(lines)
            T->>T: Loop lines
            T->>T: isTask(line) // Ignores prefix
            T->>T: isCheckedTask(line) // Ignores prefix
            T-->>C: stats
        ```
    - Files:
        - Update: `src/modules/task.service.ts`
    - Classes:
        - Update: `TaskService`
    - Variables:
        - Update (Constants): `TaskService.TASK_PATTERN` (Adjust regex to optionally match prefix: `^(?:\[pew\]\s+)?\s*-\s*\[\s*[xX\s]*\s*\]`)
        - Update (Constants): `TaskService.UNCHECKED_PATTERN` (Adjust regex: `^(?:\[pew\]\s+)?\s*-\s*\[\s*\]`)
        - Update (Constants): `TaskService.CHECKED_PATTERN` (Adjust regex: `^(?:\[pew\]\s+)?\s*-\s*\[\s*[xX]\s*\]`)
    - Methods:
        - Update: `TaskService.isTask(line: string): boolean` (Use updated regex or helper `getLineWithoutPewPrefix` before testing)
        - Update: `TaskService.isUncheckedTask(line: string): boolean` (Use updated regex or helper)
        - Update: `TaskService.isCheckedTask(line: string): boolean` (Use updated regex or helper)
        - Update: `TaskService.findFirstUncheckedTask(lines: string[]): number` (Ensure it uses the updated `isUncheckedTask`)
        - Update: `TaskService.markTaskComplete(line: string): string` (Modify to preserve prefix. Find `- [ ]` in the line *after* any potential prefix, replace it with `- [x]`, and return the full modified line including prefix if it was present).
        - Update: `TaskService.getTaskStatsFromLines(lines: string[]): { total: number, completed: number, remaining: number }` (Ensure it uses updated `isTask`, `isCheckedTask`)
    - Process:
        - Modify the regex constants to optionally match the `[pew]` prefix at the start (`^(?:\[pew\]\s+)?`).
        - Review all methods listed and ensure they correctly identify/process tasks regardless of the prefix. For `markTaskComplete`, the logic should be: find `- [ ]`, replace with `- [x]`, ensuring not to damage the prefix if present.

#### Task 1.3: Implement New Presentation Logic
- [x] 1. Update `TaskService.getTaskOutputRange` and `TaskService.getContextHeaders` to implement the refined logic for determining the block of lines to display.
    - Sequence diagram:
        ```mermaid
        sequenceDiagram
            CliService->>TaskService: getTaskOutputRange(lines, taskIndex)
            TaskService->>TaskService: Find governing header level for taskIndex
            TaskService->>TaskService: Scan backwards for startIndex (header or 0)
            TaskService->>TaskService: Scan forwards for endIndex (next task, same/higher header, or end)
            TaskService-->>CliService: { startIndex, endIndex }
            CliService->>TaskService: getContextHeaders(lines, taskIndex)
            TaskService->>TaskService: Scan backwards for up to 2 headers
            TaskService-->>CliService: headerString
        ```
    - Files:
        - Update: `src/modules/task.service.ts`
    - Classes:
        - Update: `TaskService`
    - Methods:
        - Update: `TaskService.getTaskOutputRange(lines: string[], taskIndex: number): { startIndex: number, endIndex: number }`
        - Update: `TaskService.getContextHeaders(lines: string[], taskIndex: number): string` (Existing logic might be sufficient, review).
        - Add Helper (Private Static): `TaskService.getLineHeaderLevel(line: string): number` (Returns 1-6 if header, 0 otherwise)
        - Add Helper (Private Static): `TaskService.isTaskOrHeader(line: string): boolean`
    - Process:
        - Implement `getLineHeaderLevel` using `HEADER_PATTERN`.
        - Refactor `getTaskOutputRange`:
            - Find the header level governing `lines[taskIndex]` by scanning backwards from `taskIndex - 1` until a header is found or index 0 is reached. Store this `governingLevel`.
            - Find `startIndex`: Scan backwards from `taskIndex - 1`. The `startIndex` is the index of the first line found that is a header, or 0 if no header is found before the start.
            - Find `endIndex`: Scan forwards from `taskIndex + 1`. The `endIndex` is the index of the first line found that is:
                - A task (`isTask(line)`).
                - A header (`isHeader(line)`) with a level <= `governingLevel`.
            - If no such line is found, `endIndex` is `lines.length`.
        - Review `getContextHeaders`: The current logic of scanning backwards for 2 headers seems okay. Ensure it uses the updated `isHeader`.

### Milestone 2: Refactor CLI Service Logic
Update `CliService.handleNextTask` to implement the new state machine using the enhanced `TaskService`.

#### Task 2.1: Implement `handleNextTask` State Machine
- [x] 1. Replace the existing logic in `CliService.handleNextTask` with the new state machine described in the Activity Flow.
    - Sequence diagram: (Represents the overall flow from Activity Flows section)
        ```mermaid
        sequenceDiagram
            participant User
            participant CLI
            participant CliSvc as CliService
            participant TaskSvc as TaskService
            participant FSvc as FileSystemService

            User->>CLI: pew next task
            CLI->>CliSvc: handleNextTask()
            CliSvc->>TaskSvc: readTaskLines()
            TaskSvc->>FSvc: readFile()
            FSvc-->>TaskSvc: fileContent
            TaskSvc-->>CliSvc: lines
            CliSvc->>TaskSvc: findFirstUncheckedTask(lines)
            TaskSvc-->>CliSvc: firstUncheckedIndex
            CliSvc->>TaskSvc: findTaskWithPewPrefix(lines)
            TaskSvc-->>CliSvc: pewIndex
            CliSvc->>TaskSvc: getTaskStatsFromLines(lines)
            TaskSvc-->>CliSvc: statsBefore

            alt Empty or No Tasks
                CliSvc->>CliSvc: Check if lines empty or no tasks
                CliSvc->>Console: Print "No tasks found."
                CliSvc->>TaskSvc: getSummary(statsBefore)
                TaskSvc-->>CliSvc: summaryString
                CliSvc->>Console: Print summaryString
            else All Tasks Complete
                CliSvc->>CliSvc: Check if firstUncheckedIndex == -1
                opt pewIndex != -1
                    CliSvc->>TaskSvc: removePewPrefix(lines, pewIndex)
                    TaskSvc-->>CliSvc: updatedLines
                    CliSvc->>TaskSvc: writeTaskLines(updatedLines)
                    TaskSvc->>FSvc: writeFile()
                    FSvc-->>TaskSvc: ok
                    TaskSvc-->>CliSvc: ok
                end
                CliSvc->>Console: Print "✅ All tasks complete."
                CliSvc->>TaskSvc: getSummary(statsBefore)
                TaskSvc-->>CliSvc: summaryString
                CliSvc->>Console: Print summaryString
            else Pew on Wrong Task
                CliSvc->>CliSvc: Check if pewIndex != -1 and pewIndex != firstUncheckedIndex
                CliSvc->>TaskSvc: removePewPrefix(lines, pewIndex)
                TaskSvc-->>CliSvc: lines // updated in memory
                CliSvc->>CliSvc: Set pewIndex = -1 (for this run)
                // Fallthrough to Needs Prefix
            else Needs Pew Prefix
                CliSvc->>CliSvc: Check if pewIndex == -1
                CliSvc->>TaskSvc: addPewPrefix(lines, firstUncheckedIndex)
                TaskSvc-->>CliSvc: updatedLines
                CliSvc->>TaskSvc: writeTaskLines(updatedLines)
                TaskSvc->>FSvc: writeFile()
                FSvc-->>TaskSvc: ok
                TaskSvc-->>CliSvc: ok
                CliSvc->>TaskSvc: getContextHeaders(updatedLines, firstUncheckedIndex)
                TaskSvc-->>CliSvc: contextHeaders
                CliSvc->>TaskSvc: getTaskOutputRange(updatedLines, firstUncheckedIndex)
                TaskSvc-->>CliSvc: range
                CliSvc->>Console: Print contextHeaders
                CliSvc->>Console: Print lines[range.startIndex...range.endIndex]
                CliSvc->>TaskSvc: getSummary(statsBefore)
                TaskSvc-->>CliSvc: summaryString
                CliSvc->>Console: Print summaryString
            else Complete Task with Pew
                CliSvc->>CliSvc: Check if pewIndex == firstUncheckedIndex
                CliSvc->>TaskSvc: removePewPrefix(lines, firstUncheckedIndex)
                TaskSvc-->>CliSvc: lines // updated in memory
                CliSvc->>TaskSvc: markTaskComplete(lines[firstUncheckedIndex])
                TaskSvc-->>CliSvc: modifiedLine
                CliSvc->>CliSvc: Update lines array with modifiedLine
                CliSvc->>TaskSvc: writeTaskLines(lines) // Write completion + prefix removal
                TaskSvc->>FSvc: writeFile()
                FSvc-->>TaskSvc: ok
                TaskSvc-->>CliSvc: ok
                CliSvc->>Console: Print "✅ Task marked as complete"
                CliSvc->>TaskSvc: getTaskStatsFromLines(lines) // Calculate statsAfter
                TaskSvc-->>CliSvc: statsAfter
                CliSvc->>TaskSvc: findFirstUncheckedTask(lines) // Find next one
                TaskSvc-->>CliSvc: nextUncheckedIndex
                opt nextUncheckedIndex != -1
                    CliSvc->>TaskSvc: addPewPrefix(lines, nextUncheckedIndex)
                    TaskSvc-->>CliSvc: linesWithNewPrefix
                    CliSvc->>TaskSvc: writeTaskLines(linesWithNewPrefix) // Write new prefix
                    TaskSvc->>FSvc: writeFile()
                    FSvc-->>TaskSvc: ok
                    TaskSvc-->>CliSvc: ok
                    CliSvc->>TaskSvc: getContextHeaders(linesWithNewPrefix, nextUncheckedIndex)
                    TaskSvc-->>CliSvc: nextContextHeaders
                    CliSvc->>TaskSvc: getTaskOutputRange(linesWithNewPrefix, nextUncheckedIndex)
                    TaskSvc-->>CliSvc: nextRange
                    CliSvc->>Console: Print nextContextHeaders
                    CliSvc->>Console: Print lines[nextRange.startIndex...nextRange.endIndex]
                    CliSvc->>TaskSvc: getSummary(statsAfter)
                    TaskSvc-->>CliSvc: summaryString
                    CliSvc->>Console: Print summaryString
                else // No more tasks
                    CliSvc->>Console: Print "✅ All tasks complete."
                    CliSvc->>TaskSvc: getSummary(statsAfter)
                    TaskSvc-->>CliSvc: summaryString
                    CliSvc->>Console: Print summaryString
                end
            end
        ```
    - Files:
        - Update: `src/modules/cli.service.ts`
    - Classes:
        - Update: `CliService`
    - Variables:
        - Within `handleNextTask`: `lines`, `firstUncheckedIndex`, `pewIndex`, `statsBefore`, `statsAfter`, `nextUncheckedIndex`, `contextHeaders`, `range`, `summaryString`, etc.
    - Methods:
        - Update: `CliService.handleNextTask(): Promise<void>`
    - Process:
        - Clear the existing implementation of `handleNextTask`.
        - Implement the logic step-by-step as outlined in the "Activity Flows & Scenarios" section and the sequence diagram above.
        - Use the newly added/updated methods from `TaskService` (`readTaskLines`, `findFirstUncheckedTask`, `findTaskWithPewPrefix`, `getTaskStatsFromLines`, `removePewPrefix`, `addPewPrefix`, `markTaskComplete`, `writeTaskLines`, `getContextHeaders`, `getTaskOutputRange`, `getSummary`).
        - Ensure all file writes (`writeTaskLines`) happen at the correct points (after adding/removing prefix, after marking complete). Note that two writes might occur in the "Complete Task" scenario if a subsequent task needs its prefix added.
        - Structure the code using `if/else if/else` blocks to represent the different scenarios (Empty, All Complete, Needs Prefix, Complete Task).
        - Include `try...catch` block around the main logic to handle potential errors during file operations or processing, logging errors to the console.
        - Ensure the summary is printed using `TaskService.getSummary` and `console.log` before exiting in every scenario branch.
        - Handle the presentation logic: call `getContextHeaders` and `getTaskOutputRange`, then iterate from `range.startIndex` to `range.endIndex` printing `lines[i]`.

---
Plan Parts:
1. Milestone 1: Enhance Task Service Logic (Tasks 1.1, 1.2, 1.3)
2. Milestone 2: Refactor CLI Service Logic (Task 2.1)
```