# Changelog

All notable changes to pewPewCLI will be documented in this file.


## v0.3.5

### April 16, 2025

#### ✨ Features
- Integrated Cucumber.js for Behavior-Driven Development (BDD) testing (`test:cucumber` script, `@cucumber/cucumber` dependency).

#### 🛠️ Improvements
- Significantly refactored `ConfigService` for enhanced robustness, clarity, error handling, and improved management of local/global configurations and path resolution logic.
- Improved JSDoc comments and added type definitions in `src/index.ts`, `ConfigService`, and `TaskService`.
- Enhanced type definitions (`TaskStatus`, `NextTaskResult`, `TaskFileSummary`) and error handling in `TaskService`.
- Added informational logging to `ConfigService` write operations.

#### 🐛 Bug fixes
- Removed unused `writeToClipboard` method stub from `ClipboardService`.
- Minor code cleanup in `LoggerService` and `UpdateService`.

#### 🧹 Chores
- Updated various development and runtime dependencies.

## v0.3.0

### April 14, 2025

#### ✨ Features
- Added `pew reset tasks` command to uncheck all completed tasks in selected configured task files via an interactive prompt.

#### 🛠️ Improvements
- Added `TaskService.uncheckTasksInLines` static utility method.
- Enhanced `CliService.handleResetTasks` to filter file paths and handle interactive multi-selection prompts.
- Updated `UserInputService.askForMultipleSelections` to correctly handle checkbox choice objects.
- Enhanced `pew reset tasks` prompt to show per-file task summaries.
- Added comprehensive JSDoc comments to all service classes and public methods (`ConfigService`, `CliService`, `FileSystemService`, `TaskService`, `UpdateService`, `UserInputService`, `YamlService`, `ClipboardService`).
- Refactored service constructors (`CliService`, `TaskService`, `UpdateService`) to correctly inject dependencies.

#### 🐛 Bug fixes:
- Fixed `TaskService.uncheckTasksInLines` to preserve task text when unchecking completed tasks.
- Removed unused stub methods and TODO comments from service classes (`CliService`, `TaskService`).
- Fixed potential runtime error in `CliService.handleSetPath` by ensuring the value obtained from user input is valid before proceeding.
- Corrected `CliService` dependency injection for `TaskService` and `UpdateService`.
- Replaced non-existent `askForPath` calls with `askForText` in `CliService`.

## v0.2.0

### April 14, 2025

#### ✨ Features
- Enhanced `pew next task` command to support multiple task files specified in `paths.yaml`.
- Implemented logic to find the first available task across all configured files.
- Added robust management of the `👉` prefix (add, remove, move) across different task files.
- Updated summary output to be file-specific, showing stats and the relative path for the file containing the current task.
- Added `paste-tasks` key to `paths.yaml` to specify a default target file for `pew paste tasks`.
- Added `--path <value>` option to `pew paste tasks` command to override the configured or default target file.
- Implemented logic in `pew paste tasks` to handle non-existent paths provided via `--path` by prompting the user.
- Updated `pew init` command to automatically configure the `paste-tasks` key alongside the `tasks` key in `paths.yaml`.
- Added `pew update` command to check for and install the latest version from npm.
- Implemented automatic background update checks (daily) after `pew init` and `pew paste tasks` commands.
- Added user notification for available updates.

#### 🛠️ Improvements
- Refactored `ConfigService` to provide a list of all configured task file paths.
- Refactored `TaskService` methods (`readTaskLines`, `writeTaskLines`) to operate on specific file paths, removing reliance on a single primary file.
- Added integration tests for the new multi-file functionality in `CliService.handleNextTask` using Jest mocks.
- Refactored `ConfigService` to include `getPasteTasksPath` method with fallback logic (config key -> first task -> default).
- Modified `ConfigService.setTasksPaths` to handle setting both `tasks` and `paste-tasks` keys.
- Updated `CliService.handlePasteTasks` to use the new configuration and option logic.
- Updated documentation (`README.md`, tutorials) to reflect the new `paste-tasks` functionality.
- Created `UpdateService` to handle update logic.
- Added support for global `core.yaml` configuration file in `ConfigService` to store update check timestamps.

## v0.1.3

### April 9, 2025

#### 🛠️ Improvements:
- Added comprehensive JSDoc comments to all service classes and public methods (`ConfigService`, `CliService`, `FileSystemService`, `TaskService`, `UpdateService`, `UserInputService`, `YamlService`, `ClipboardService`).
- Refactored service constructors (`CliService`, `TaskService`, `UpdateService`) to correctly inject dependencies.

#### 🐛 Bug fixes:
- Removed unused stub methods and TODO comments from service classes (`CliService`, `TaskService`).
- Fixed potential runtime error in `CliService.handleSetPath` by ensuring the value obtained from user input is valid before proceeding.
- Corrected `CliService` dependency injection for `TaskService` and `UpdateService`.
- Replaced non-existent `askForPath` calls with `askForText` in `CliService`.

#### 🏷️ Metadata
- Updated keywords to better represent tool's purpose for AI agents and coding assistants

## v0.1.2

### April 9, 2025

#### 🔄 Changes
- Updated README.md to remove GitHub and contribution references
- Updated project description to "pewPewCLI - agents fav dev tool"
- Added CHANGELOG.md

## v0.1.1

### April 9, 2025

#### 🐛 Bug Fixes
- Removed debug logging from command output
- Fixed version number display in CLI

## v0.1.0

### April 9, 2025

#### ✨ New Features
- Initial release to npm
- Package name set to "pew-pew-cli" with command "pew"
- Core functionality:
  - Task management with "pew next task"
  - Clipboard integration with "pew paste tasks"
  - Configuration management with "pew set path"
  - Project initialization with "pew init" 