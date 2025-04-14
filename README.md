# pewPewCLI ❤️ Agents' Fav Dev Tool 🔫

[![Brought to you by ultrawideturbodevs.com](https://img.shields.io/badge/Brought%20to%20you%20by-ultrawideturbodevs.com-blue?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0xIDE1aC0ydi0yaDJ2MnptMC00aC0yVjdoMnY2eiIvPjwvc3ZnPg==)](https://ultrawideturbodevs.com)

[![npm version](https://badge.fury.io/js/pew-pew-cli.svg)](https://badge.fury.io/js/pew-pew-cli)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/username/pew-pew-cli/actions) <!-- Placeholder -->

Lightweight CLI tool that enables collaborative local task file management between developers and AI agents.

---

## 📚 Table of Contents

- [💻 Install](#-install)
- [🚀 Quick Start Usage](#-quick-start-usage)
- [📝 Commands Reference](#-commands-reference)
  - [`pew init`](#-pew-init)
  - [`pew set path`](#-pew-set-path)
  - [`pew paste tasks`](#-pew-paste-tasks)
  - [`pew next task`](#-pew-next-task)
  - [`pew reset tasks`](#-pew-reset-tasks)
  - [`pew update`](#-pew-update)
- [⚙️ Configuration](#️-configuration)
  - [`paths.yaml` Structure](#pathsyaml-structure)
- [💡 Workflows & Examples](#-workflows--examples)
  - [Populating and Running Tasks](#populating-and-running-tasks)
  - [Managing Multiple Task Files](#managing-multiple-task-files)
- [📦 Dependencies](#-dependencies)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [📞 Contact & Support](#-contact--support)
- [🏢 Ownership](#-ownership)
- [🤖 Example Agent Prompt](#-example-agent-prompt)

---

## 💻 Install

Ensure you have Node.js and npm installed.

```bash
npm install -g pew-pew-cli
```

---

## 🚀 Quick Start Usage

Get started quickly in your project directory:

```bash
# 1. Initialize the project structure and config
pew init
# Creates .pew/ directory and default .pew/tasks.md

# 2. Add tasks to .pew/tasks.md (manually or via AI)
#    Example task format: - [ ] My first task

# 3. (Optional) Paste a task list from clipboard (prompts for mode)
# pew paste tasks

# 4. Start working through your tasks
pew next task
# Marks current task done, finds next `- [ ]`, adds 👉, displays it

# Complete the task shown...
# Then run again:
pew next task

# 5. Reset completed tasks in your checklist(s) if needed
# pew reset tasks

# 6. Keep your CLI up-to-date!
# pew update
```

---

## 📝 Commands Reference

Here's a summary of available commands:

| Command             | Description                                                                 | Options                                                                                                                               |
| :------------------ | :-------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------ |
| `pew init`          | Initialize the `pewPewCLI` project structure in the current directory.      | `-f, --force`: Force initialization even if `.pew` directory exists.                                                                   |
| `pew set path`      | Set a configuration value for a path (currently only `tasks`).              | `--field <field>`: Field to set (only `tasks`).<br>`--value <value>`: Path value to set.<br>`-g, --global`: Set in global config (`~/.pew`). |
| `pew paste tasks`   | Paste clipboard content into the configured task file.                      | `--mode <mode>`: Paste mode (`overwrite`, `append`, `insert`). Prompts if omitted.<br>`--path <value>`: Specify target file path, overriding config. |
| `pew next task`     | Marks the current task (`👉`) complete and displays the next available task. | _None_                                                                                                                                |
| `pew reset tasks`   | Uncheck all completed tasks (`[x]`) in configured task files interactively. | _None_                                                                                                                                |
| `pew update`        | Check for updates and install the latest version of `pew-pew-cli`.          | _None_                                                                                                                                |

### 📂 `pew init`

Creates the `.pew` directory and default configuration files (`.pew/config/paths.yaml`, `.pew/tasks.md`) in the current directory. It will prompt for the primary tasks file path unless `--force` is used.

```bash
# Interactive initialization
pew init

# Force initialization without prompts (uses defaults)
pew init --force
```

### 🔧 `pew set path`

Updates the `paths.yaml` configuration file (either locally in `.pew/config/paths.yaml` or globally in `~/.pew/core.yaml` with the `-g` flag). Currently, only setting the `tasks` field (an array of task file paths) and `paste-tasks` (a single path for the default paste target) is supported via this command or direct config editing. The `set path` command currently only handles the `tasks` field interactively.

```bash
# Set the local tasks path (prompts for value)
pew set path --field tasks

# Set the global tasks path explicitly
pew set path --field tasks --value /path/to/my/global/tasks.md -g

# Note: 'paste-tasks' must currently be set by editing the paths.yaml file directly.
```

###📋 `pew paste tasks`

Reads content from your system clipboard and writes it to a task file. By default, it targets the file specified by `paste-tasks` in `paths.yaml` (or falls back to the first file under `tasks:`). You can specify the mode (`overwrite`, `append`, `insert`) or the target path using options. If no mode is specified, it will prompt interactively.

```bash
# Paste and overwrite the default task file
pew paste tasks --mode overwrite

# Append clipboard content to a specific file
pew paste tasks --path specific/project/tasks.md --mode append

# Run interactively to choose mode
pew paste tasks
```

### 👉 `pew next task`

This is the core command for progressing through your task lists. It finds the current task marked with `👉`, marks it as complete (`- [ ]` -> `- [x]`), removes the `👉`, finds the next available incomplete task (`- [ ]`) across all files configured in `paths.yaml` (in order), adds the `👉` prefix to it, and displays the context of that new task.

```bash
# Process the current task and move to the next one
pew next task
```

### 🔄 `pew reset tasks`

Resets completed tasks within your configured checklists. This command interactively prompts you to select which of the task files listed in your `paths.yaml` you want to reset. For each selected file, it changes all completed task markers (`- [x]` or `- [X]`) back to incomplete (`- [ ]`) and removes the `👉` prefix if present.

It helps restart repeatable workflows (like daily checklists, QA runs) without manual editing.

```bash
# Interactively select configured task files to reset
pew reset tasks
```

The prompt will show a summary of tasks within each file to help you select.

### ✨ `pew update`

Checks if a newer version of `pew-pew-cli` is available on npm and prompts you to install it if found.

```bash
# Check for and install updates
pew update
```

---

## ⚙️ Configuration

`pew-pew-cli` uses YAML configuration files.

*   **Local:** `.pew/config/paths.yaml` (specific to the current project/directory)
*   **Global:** `~/.pew/config/core.yaml` (user-level settings, used with `-g` flags)

### `paths.yaml` Structure

This file defines which markdown files the CLI should operate on.

```yaml
# Example .pew/config/paths.yaml

# List of files scanned by 'pew next task' and offered by 'pew reset tasks'
# Processed in the order listed. Absolute paths also work.
tasks:
  - path/to/your/tasks.md
  - relative/path/to/another/checklist.md
  # - /absolute/path/to/tasks.md

# Optional: Default target file for 'pew paste tasks'.
# If omitted, defaults to the first path listed under 'tasks:'.
paste-tasks: path/to/default/paste/target.md
```

---

## 💡 Workflows & Examples

### Populating and Running Tasks

After running `pew init`, populate your main task file (e.g., `.pew/tasks.md`) using:

1.  **Manual Edit:** Open the file and add tasks like `- [ ] My Task`.
2.  **Paste from Clipboard:** Use `pew paste tasks` (see command details above).

Once populated, start the workflow:

```bash
# Mark the current task complete, show the next
pew next task
```

Repeat `pew next task` after completing each task.

### Managing Multiple Task Files

You can manage different checklists across multiple files (e.g., main dev tasks, QA checklist).

1.  **Configure `paths.yaml`:** List all relevant files under the `tasks:` key in order.
2.  **Run `pew next task`:** It processes tasks sequentially through the files listed.
3.  **Reset Checklists:** Use `pew reset tasks` to uncheck completed items when you want to restart a workflow (like the QA checklist).

---

## 📦 Dependencies

Key dependencies include:

*   [commander](https://github.com/tj/commander.js/): Command-line argument parsing.
*   [inquirer](https://github.com/SBoudrias/Inquirer.js/): Interactive CLI prompts.
*   [clipboardy](https://github.com/sindresorhus/clipboardy): Clipboard access.
*   [js-yaml](https://github.com/nodeca/js-yaml): YAML parsing/serialization.
*   [latest-version](https://github.com/sindresorhus/latest-version): Fetches the latest version of an npm package.
*   [chalk](https://github.com/chalk/chalk): Terminal string styling (used indirectly).

---

## 🤝 Contributing

Contributions are welcome! We appreciate bug reports, feature suggestions, documentation improvements, and code contributions.

Please refer to the [CONTRIBUTING.md](CONTRIBUTING.md) file for detailed guidelines on how to contribute, including setting up your development environment, commit signing requirements, and the pull request process.

We adhere to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).

---

## 📄 License

This project is proprietary software, owned and distributed by Ultra Wide Turbo Company. All rights reserved.

Usage is subject to the terms outlined in the [LICENSE](LICENSE) file and requires a separate commercial agreement for any commercial use. Please review the [LICENSE](LICENSE) file for details.

---

## �� Contact & Support

*   **Bugs & Feature Requests:** Please use the [GitHub Issues](https://github.com/ultrawideturbodev/pew-pew-cli/issues) tracker. Use the provided templates for effective reporting.
*   **Questions & Discussions:** Use the [GitHub Discussions](https://github.com/ultrawideturbodev/pew-pew-cli/discussions) tab for general questions, usage help, or sharing ideas (if Discussions are enabled).
*   **Security Vulnerabilities:** Please report privately according to the [SECURITY.md](SECURITY.md) policy.
*   **General Info:** Visit [ultrawideturbodevs.com](https://ultrawideturbodevs.com) for more context.

---

## 🏢 Ownership

`pew-pew-cli` is owned and maintained by Ultra Wide Turbo Company.

---

## 🤖 Example Agent Prompt

Here's a prompt you can adapt for an AI agent to use this tool once initialized in a project:

```
You are an AI assistant tasked with executing the next available milestones and set of tasks outlined in the provided plan. Follow these instructions carefully:

1.  **Review Task Plan:** First, carefully review the content of the {{TASK_FILE_LOCATION}} (typically `.pew/tasks.md`).

2.  **Understand Context:**
    *   Your goal is to complete the next available milestone (specifically Milestone `{{MILESTONE_NUMBER}}`) and its associated tasks sequentially.
    *   You must follow the plan exactly as specified in `{{TASK_FILE_LOCATION}}` without adding, removing, or changing steps or requirements unless explicitly instructed by a task.

3.  **Identify Next Task:**
    *   Locate Milestone `{{MILESTONE_NUMBER}}` in the `{{TASK_FILE_LOCATION}}` file.
    *   Identify the first uncompleted task listed under this milestone.
    *   Use the `pew next task` command to confirm and retrieve the details of this first task.

4.  **Research Project Context:**
    *   Based on the output of `pew next task`, thoroughly scan all related project files to gain a deep understanding of the task's requirements and the project's context.

5.  **Execute Tasks Sequentially:**
    *   Complete each task strictly in the order presented.
    *   Use the `pew next task` command *after* successfully completing the current task to mark it done and get the next one.
    *   Do not skip any tasks or alter their prescribed order.

6.  **Milestone Completion Review:**
    *   After completing *all* tasks for Milestone `{{MILESTONE_NUMBER}}`, review the implemented work for correctness and consistency.

7.  **Completion and Next Steps:**
    *   Once all tasks for the specified milestone are successfully completed and reviewed/fixed, ask the user for the next set of instructions.

**Always remember:**
*   Stick rigorously to the plan.
*   Focus exclusively on the tasks for the specified milestone.
*   Update the task file using `pew next task` immediately after completing each task.
*   Ensure high-quality output (code, documentation, etc.).
*   Run `pew` commands autonomously as needed ("yolo mode is on").

Begin your work by reading the `{{TASK_FILE_LOCATION}}`. Then, identify and start the first task for Milestone `{{MILESTONE_NUMBER}}` using `pew next task`.

MILESTONE_NUMBER = ALL
TASK_FILE_LOCATION = .pew/tasks.md

ACT
```