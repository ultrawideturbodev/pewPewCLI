# Changelog

All notable changes to pewPewCLI will be documented in this file.

## v0.4.1

### May 15, 2025

#### 🐛 Bug fixes
- Fixed TypeScript type compatibility error in `YamlService.writeYamlFile` method to properly handle any type of object serialization
- Updated generic type parameters in `YamlService` to allow serialization of DTOs without requiring index signatures

## v0.4.0

### May 7, 2025

#### 💔 Breaking
- Replaced `.pew/config/` directory structure with a single `pew.yaml` file at the project root for local configuration
- Removed separate `paths.yaml` and `core.yaml` files in favor of a unified `pew.yaml` structure
- Changed configuration loading logic to search for `pew.yaml` instead of `.pew/config/paths.yaml`

#### 🔧 Developer Experience
- Added ESLint v9 and Prettier configuration with `npm run fix` command for automated code quality improvements
- Fixed TypeScript type warnings across the codebase, replacing `any` types with more specific types
- Improved error handling patterns with proper type checking of unknown errors
- Enhanced code maintainability with consistent patterns for error reporting

#### 🛠️ Improvements
- Refactored `config.service.ts` and `yaml.service.ts` to use proper TypeScript typing
- Enhanced error handling in all service classes for better runtime stability
- Updated import paths to ensure consistency across the codebase
- Implemented proper error handling with Error instance checking

#### 🧰 Dependency Updates
- Updated inquirer from 8.2.5 to 12.6.0
- Updated ts-jest from 29.1.1 to 29.3.2
- Updated @types/node from 22.14.0 to 22.15.14

#### 🧹 Chores
- Updated ESLint to v9 with modern configuration format
- Added ESLint and Prettier scripts to package.json for consistent code style
- Cleaned up unused variables and parameters across the codebase

## v0.3.5

### April 16, 2025

#### ✨ Features
- Integrated Cucumber.js for Behavior-Driven Development (BDD) testing (`test:cucumber` script, `@cucumber/cucumber` dependency).
- Implemented unified `pew.yaml` configuration system for both local and global settings with a feature-based structure
- Added automatic defaults for all configuration values to ensure robust operation with missing/malformed configs

#### 🛠️ Improvements
- Significantly refactored `ConfigService` for enhanced robustness, clarity, error handling, and improved management of local/global configurations and path resolution logic.
- Improved JSDoc comments and added type definitions in `src/index.ts`, `ConfigService`, and `TaskService`.
- Enhanced type definitions (`TaskStatus`, `NextTaskResult`, `TaskFileSummary`) and error handling in `TaskService`.
- Added informational logging to `ConfigService` write operations.
- Simplified configuration management with centralized `pew.yaml` files at project root and `~/.pew/pew.yaml` for global settings

#### 🐛 Bug fixes
- Removed unused `writeToClipboard` method stub from `ClipboardService`.
- Minor code cleanup in `LoggerService` and `UpdateService`.
- Fixed potential issues with path resolution in various configuration scenarios

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
- Corrected `