<chatName="pew-fix-next-task-summary-plan"/>
# Project Plan: Fix `pew next task` Summary Calculation

## 1. Project Overview
This plan addresses a bug in the `pew next task` command where the summary output incorrectly reports the number of completed tasks after the last task in a file is marked complete. The goal is to refactor the command's logic to accurately calculate and display the task summary based on the state *after* the task completion, without relying on potentially unreliable file re-reads for status calculation.
- [ ] Read the project overview:
    - Fix bug where completing the last task shows an incorrect "completed" count in the summary.
    - Refactor `CliService.handleNextTask` to calculate summary stats based on the in-memory state transition rather than re-reading the file for stats.
    - Ensure the summary accurately reflects the state *after* the task completion in all scenarios (next task exists, last task completed, no tasks initially).

## 2. Requirements
Overview of all requirements.
- [ ] Read the requirements:
    - 👤 Actors & 🧩 Components:
        - **[Developer]**: The person implementing the code changes.
        - **[pew Command]**: The CLI executable being modified.
        - **[CliService]**: Service containing the primary command logic to be refactored.
        - **[TaskService]**: Service used for task parsing, manipulation, and statistics calculation.
        - **[FileSystemService]**: Service used for reading/writing the task file.
        - **[Terminal/Shell]**: Interface displaying the command's output.
        - **[Tasks File]**: The markdown file containing the tasks.
    - 🎬 Activities: Specify what actions need to be performed.
        - **[Developer]**
            - [Modify `CliService.handleNextTask` method]
            - [Adjust statistics calculation logic]
        - **[CliService]**
            - [Read task lines]
            - [Calculate initial task statistics]
            - [Find first unchecked task]
            - [Mark task complete in memory]
            - [Write updated lines to file]
            - [Find next unchecked task in memory]
            - [Calculate final/intermediate statistics based on initial stats and completion]
            - [Format summary string]
            - [Display output (next task or completion message) with correct summary]
        - **[TaskService]**
            - [Provide task statistics calculation (`getTaskStatsFromLines`)]
            - [Provide task finding logic (`findFirstUncheckedTask`)]
            - [Provide task marking logic (`markTaskComplete`)]
            - [Provide summary formatting (`getSummary`)]
            - [Provide context/range finding logic (`getContextHeaders`, `getTaskOutputRange`, `findFirstTask`)]
        - **[FileSystemService]**
            - [Read file content]
            - [Write file content]
    - 🌊 Activity Flows & Scenarios: Break down complex activities into step-by-step processes.
        - **[Fix `pew next task` Summary (Scenario: Completing the only task)]**
            - GIVEN a tasks file contains only one unchecked task (e.g., `- [ ] Task 1`)
            - WHEN the Developer runs `pew next task`
            - THEN `CliService.handleNextTask` reads the lines `["- [ ] Task 1"]`
            - AND `CliService` calculates initial stats: `{ total: 1, completed: 0, remaining: 1 }`
            - AND `CliService` finds the task at index 0
            - AND `CliService` marks the task complete in memory: `lines` becomes `["- [x] Task 1"]`
            - AND `CliService` writes `["- [x] Task 1"]` to the tasks file
            - AND `CliService` logs "✅ Task marked as complete"
            - AND `CliService` finds no next unchecked task in the updated `lines` array
            - AND `CliService` calculates final stats based on initial stats: `{ total: 1, completed: 1, remaining: 0 }`
            - AND `CliService` gets the summary string: "Total: 1 task(s) | Completed: 1 (100.0%) | Remaining: 0"
            - AND `CliService` logs "✅ All tasks complete."
            - AND `CliService` logs the correct summary string.
        - **[Fix `pew next task` Summary (Scenario: Completing not the last task)]**
            - GIVEN a tasks file contains `["- [ ] Task 1", "- [ ] Task 2"]`
            - WHEN the Developer runs `pew next task`
            - THEN `CliService.handleNextTask` reads the lines
            - AND `CliService` calculates initial stats: `{ total: 2, completed: 0, remaining: 2 }`
            - AND `CliService` finds the task at index 0
            - AND `CliService` marks the task complete in memory: `lines` becomes `["- [x] Task 1", "- [ ] Task 2"]`
            - AND `CliService` writes the updated `lines` to the tasks file
            - AND `CliService` logs "✅ Task marked as complete"
            - AND `CliService` finds the next unchecked task at index 1 in the updated `lines` array
            - AND `CliService` calculates intermediate stats based on initial stats: `{ total: 2, completed: 1, remaining: 1 }`
            - AND `CliService` gets the summary string: "Total: 2 task(s) | Completed: 1 (50.0%) | Remaining: 1"
            - AND `CliService` displays Task 2 context/content.
            - AND `CliService` logs the correct summary string.
    - 📝 Properties: Define any values or configurations associated with components or activities.
        - **[CliService.handleNextTask]**
            - [lines : string[]] (In-memory representation of task file lines)
            - [statsBefore : { total: number, completed: number, remaining: number }] (Stats calculated before modification)
            - [currentTaskIndex : number] (Index of the task being completed)
            - [nextUncheckedIndex : number] (Index of the next task after completion)
            - [statsAfter : { total: number, completed: number, remaining: number }] (Stats calculated after modification if next task exists)
            - [finalStats : { total: number, completed: number, remaining: number }] (Stats calculated after modification if last task completed)
            - [summary : string] (Formatted summary string)
    - 🛠️ Behaviours: Describe how actors, components, properties, and activities should act or respond in different situations.
        - **[CliService.handleNextTask]**
            - Should calculate initial statistics *before* modifying the task list.
            - Should modify the task list *in memory* first.
            - Should write the modified list to the file.
            - Should determine the next state (next task exists or all complete) based on the *in-memory* modified list.
            - Should calculate the summary statistics based on the *initial statistics* and the fact that *one task was completed*.
            - Should *not* re-read the file to calculate the final summary statistics.
            - Should display a summary that accurately reflects the state *after* the task completion.

## 3. Milestones and Tasks

### Milestone 1: Refactor `handleNextTask` for Accurate Summary Calculation
Modify the `CliService.handleNextTask` method to calculate task summary statistics reliably after completing a task, avoiding reliance on file re-reads for the calculation.

#### Task 1: Refactor `CliService.handleNextTask` Logic
- [x] 1. Modify the `handleNextTask` method in `CliService` to calculate initial task statistics before attempting to find and mark a task complete. Use these initial statistics and the in-memory updated task list to determine and display the correct summary after task completion. Remove the unnecessary file re-read previously used for stats calculation.
- Sequence diagram:
    ```mermaid
    sequenceDiagram
        participant PewCLI as pew Command
        participant CliSvc as CliService
        participant TaskSvc as TaskService
        participant FSSvc as FileSystemService

        PewCLI->>CliSvc: handleNextTask()
        CliSvc->>TaskSvc: getPrimaryTasksFilePath()
        TaskSvc-->>CliSvc: filePath
        CliSvc->>FSSvc: pathExists(filePath)
        alt File does not exist
            CliSvc-->>PewCLI: Log error and return
        end
        CliSvc->>TaskSvc: readTaskLines()
        TaskSvc-->>CliSvc: lines[]
        CliSvc->>TaskSvc: getTaskStatsFromLines(lines) # Calculate stats BEFORE
        TaskSvc-->>CliSvc: statsBefore
        CliSvc->>TaskSvc: findFirstUncheckedTask(lines)
        TaskSvc-->>CliSvc: currentTaskIndex
        alt currentTaskIndex != -1 # Task found
            CliSvc->>TaskSvc: markTaskComplete(lines[currentTaskIndex])
            TaskSvc-->>CliSvc: modifiedLine
            Note over CliSvc: Update lines[currentTaskIndex] = modifiedLine (in memory)
            CliSvc->>TaskSvc: writeTaskLines(lines) # Write updated in-memory lines
            TaskSvc-->>CliSvc: (Success)
            CliSvc->>PewCLI: Log "✅ Task marked as complete"
            CliSvc->>TaskSvc: findFirstUncheckedTask(lines) # Check updated in-memory lines
            TaskSvc-->>CliSvc: nextUncheckedIndex
            alt nextUncheckedIndex != -1 # Next task exists
                Note over CliSvc: Calculate statsAfter based on statsBefore (+1 completed, -1 remaining)
                CliSvc->>TaskSvc: getSummary(statsAfter)
                TaskSvc-->>CliSvc: summary
                Note over CliSvc: Get context/range for nextUncheckedIndex from in-memory lines
                CliSvc->>PewCLI: Format and print next task header, context, content, summary
            else # Last task completed
                Note over CliSvc: Calculate finalStats based on statsBefore (+1 completed, remaining=0)
                CliSvc->>TaskSvc: getSummary(finalStats)
                TaskSvc-->>CliSvc: summary
                CliSvc->>PewCLI: Log "✅ All tasks complete."
                CliSvc->>PewCLI: Log summary
            end
        else # No unchecked task initially
            Note over CliSvc: Use statsBefore for summary
            CliSvc->>TaskSvc: getSummary(statsBefore)
            TaskSvc-->>CliSvc: summary
            alt statsBefore.total == 0
                 CliSvc->>PewCLI: Log "✅ No tasks found."
            else
                 CliSvc->>PewCLI: Log "✅ All tasks complete."
            end
            CliSvc->>PewCLI: Log summary
        end
        CliSvc-->>PewCLI: (Completion)

    ```
- Files:
    - **Update**: `src/modules/cli.service.ts`
- Classes:
    - **Update**: `CliService`
- Variables:
    - **Create**: `statsBefore: { total: number, completed: number, remaining: number }` within `handleNextTask` scope.
    - **Create**: `statsAfter: { total: number, completed: number, remaining: number }` within `handleNextTask` scope (conditional).
    - **Create**: `finalStats: { total: number, completed: number, remaining: number }` within `handleNextTask` scope (conditional).
    - **Update**: Logic using `lines: string[]` (used for in-memory checks after modification).
    - **Remove**: `updatedLines: string[]` (no longer needed as file isn't re-read for stats).
    - **Update**: Logic using `nextTaskIndex` renamed to `nextUncheckedIndex` for clarity.
- Methods:
    - **Update**: `CliService.handleNextTask()`
        - Move `TaskService.getTaskStatsFromLines()` call near the beginning, before `findFirstUncheckedTask`.
        - Remove the second call to `this.taskService.readTaskLines()`.
        - Replace the `TaskService.getTaskStatsFromLines(updatedLines)` calls with calculations based on `statsBefore`.
        - Ensure `findFirstUncheckedTask`, `getContextHeaders`, `getTaskOutputRange`, `findFirstTask` calls after modification use the updated in-memory `lines` array.
- Process:
    1. Open `src/modules/cli.service.ts`.
    2. Locate the `handleNextTask` method.
    3. Immediately after the initial `let lines = await this.taskService.readTaskLines();` call, add:
       ```typescript
       const statsBefore = TaskService.getTaskStatsFromLines(lines);
       ```
    4. Locate the section within the `if (currentTaskIndex !== -1)` block where the file is re-read:
       ```typescript
       // Read the file again to get fresh state
       // const updatedLines = await this.taskService.readTaskLines(); // REMOVE THIS LINE
       ```
    5. Replace the subsequent call to find the next task:
       ```typescript
       // Find the next unchecked task
       // const nextTaskIndex = TaskService.findFirstUncheckedTask(updatedLines); // REPLACE THIS
       const nextUncheckedIndex = TaskService.findFirstUncheckedTask(lines); // USE IN-MEMORY 'lines'
       ```
    6. Modify the `if (nextTaskIndex !== -1)` block (now `if (nextUncheckedIndex !== -1)`):
       - Remove the `const stats = TaskService.getTaskStatsFromLines(updatedLines);` line.
       - Add calculation for `statsAfter`:
         ```typescript
         const statsAfter = {
             total: statsBefore.total,
             completed: statsBefore.completed + 1,
             remaining: statsBefore.remaining - 1,
         };
         ```
       - Ensure `TaskService.getSummary`, `TaskService.getContextHeaders`, `TaskService.getTaskOutputRange`, `TaskService.findFirstTask` use `statsAfter` and the in-memory `lines` array with `nextUncheckedIndex`.
    7. Modify the `else` block (where `nextUncheckedIndex === -1`):
       - Remove the `const stats = TaskService.getTaskStatsFromLines(updatedLines);` line.
       - Add calculation for `finalStats`:
         ```typescript
         const finalStats = {
             total: statsBefore.total,
             completed: statsBefore.completed + 1,
             remaining: 0, // Since this was the last task
         };
         // Optional sanity check:
         // if (finalStats.completed !== finalStats.total) {
         //     console.warn("Warning: Task count mismatch after completing the last task.");
         // }
         ```
       - Ensure `TaskService.getSummary` uses `finalStats`.
    8. Modify the final `else` block (where `currentTaskIndex === -1` initially):
       - Ensure it uses `statsBefore` for the summary calculation (this part was likely already correct).
    9. Review the entire method to ensure consistency and correct variable usage (`lines`, `statsBefore`, `statsAfter`, `finalStats`, `nextUncheckedIndex`).

```

**Plan Parts:**

1.  Part 1: Full plan (this response).