# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

pew-pew-cli is a lightweight CLI tool that enables collaborative local task file management between developers and AI agents. It helps manage Markdown task lists (with checkboxes `- [ ]`) across multiple files, provides commands for task management, and allows tracking progress through tasks. The tool is also being enhanced with template-based code generation capabilities.

## Common Commands

### Development Commands

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run the CLI tool locally during development
npm run dev

# Run tests (Jest for unit tests + Cucumber for acceptance tests)
npm test

# Run unit tests only
node --experimental-vm-modules node_modules/jest/bin/jest.js

# Run linting
npm run lint

# Fix linting issues and format code
npm run fix
```

### CLI Commands

```bash
# Initialize pew-pew-cli in a directory
pew init

# Set paths for task files
pew set path --field tasks --value path/to/tasks.md

# Paste clipboard content into task file
pew paste tasks [--overwrite|--append|--insert]

# Mark current task complete and move to next task
pew next task

# Reset completed tasks to unchecked state
pew reset tasks

# Check for and install updates
pew update

# Generate code from templates (in development)
pew create <templateName> [--VariableName=Value] [--target=path/to/output]
```

## Architecture

The project follows a service-oriented architecture with clear separation of concerns:

1. **CLI Layer** (src/index.ts):
   - Uses Commander.js for parsing commands and arguments
   - Delegates command handling to the CliService

2. **Service Layer**:
   - **CliService** (src/core/cli.service.ts): Orchestrates command execution and delegates to specialized services
   - **TaskService** (src/tasks/task.service.ts): Core service for task manipulation (finding, marking complete, navigating)
   - **ConfigService** (src/io/config.service.ts): Manages configuration in pew.yaml files
   - **FileSystemService** (src/io/file-system.service.ts): Handles file operations
   - **ClipboardService** (src/clipboard/clipboard.service.ts): Manages clipboard operations
   - **UpdateService** (src/updates/update.service.ts): Handles checking for and installing updates
   - **LoggerService** (src/core/logger.service.ts): Handles formatted output to the console
   - **YamlService** (src/io/yaml.service.ts): Manages YAML parsing and serialization
   - **TemplateService** (planned): Will handle template processing for code generation

3. **DTOs** (src/io/config.dto.ts):
   - Define data structures for configuration (TasksConfigDto, UpdatesConfigDto, PewConfigDto)
   - Will be extended to include TemplateConfigDto for the code generation feature

## Key Components

1. **Task Management**:
   - Tasks are represented as Markdown checkbox items (`- [ ]` for unchecked, `- [x]` for checked)
   - Current task is marked with 👉 prefix (`👉 - [ ] Current task`)
   - TaskService includes utilities for parsing, finding, and manipulating tasks

2. **Configuration**:
   - Uses local pew.yaml (project-specific) and global ~/.pew/pew.yaml (user-level)
   - Configuration follows the structure defined in the README.md

3. **Testing Approach**:
   - Jest for unit tests (with ts-jest for TypeScript support)
   - Test files are located in tests/unit/ directory
   - Uses mocks for file system and configuration services

4. **Template-Based Code Generation** (in development):
   - Templates defined in `pew.yaml` under the `templates` section
   - Each template specifies variables, replacements, source files, and an optional root directory
   - The `pew create <templateName>` command processes templates, handles variable replacements in file content and filenames, and generates output files

## Testing Guidelines

When writing tests for the project:

1. Focus on testing core functionality first (happy paths)
2. Utilize the existing testing structure in tests/unit/
3. Use the mocks provided in tests/unit/__mocks__/ for file system and configuration services
4. For service methods that interact with files, ensure appropriate mocking of file system operations
5. Follow the pattern established in task-service.test.ts for new tests

## Best Practices

1. Follow existing patterns for service implementation and dependency injection
2. Use TypeScript's strict typing (strict mode is enabled)
3. Document new methods with JSDoc comments
4. Maintain modular and testable code architecture
5. When modifying task manipulation logic, ensure compatibility with existing task file formats
6. Use async/await for file operations and other asynchronous processes

## Active Development

The project is currently implementing a template-based code generation feature that will enable users to define code templates in `pew.yaml` and generate files with `pew create`. This feature includes:

1. Defining templates with variables, replacements, and file lists in `pew.yaml`
2. Command-line argument and option parsing for the `pew create` command
3. Interactive prompting for template variables
4. String replacement in both file content and filenames
5. Output file generation with configurable root path handling