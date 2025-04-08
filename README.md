# pewPewCLI

[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)

pewPewCLI is a command-line tool designed to streamline task management and workflows directly from your terminal. It helps you quickly initialize task lists, paste content from your clipboard into them, and advance through your tasks efficiently.

## Commands

| Command                 | Description                                                           | Arguments          | Options                                                                                                |
| :---------------------- | :-------------------------------------------------------------------- | :----------------- | :----------------------------------------------------------------------------------------------------- |
| `pew init`              | Initialize the pewPewCLI project structure in the current directory.  | _None_             | `-f, --force`: Force initialization even if `.pew` directory exists.                                    |
| `pew set path`          | Set a configuration value for a path.                                 | _None_             | `--field <field>`: Field to set (currently only `tasks`).<br>`--value <value>`: Path value to set.<br>`-g, --global`: Set in global config (`~/.pew`). |
| `pew paste tasks`       | Paste clipboard content into the configured primary tasks file.         | `tasks` (required) | `--overwrite`: Overwrite the entire tasks file.<br>`--append`: Append content to the end.<br>`--insert`: Insert content at the beginning.<br>`--force`: Alias for `--overwrite`. |
| `pew next task`         | Mark the current task as complete and display the next task.          | `task` (required)  | _None_                                                                                                 |

## Table of Contents

- [pewPewCLI](#pewpewcli)
  - [Commands](#commands)
  - [Installation](#installation)
    - [Local Installation (for Development)](#local-installation-for-development)
    - [Global Installation (Planned)](#global-installation-planned)
  - [Usage](#usage)
    - [Initialize Project](#initialize-project)
    - [Set Configuration Paths](#set-configuration-paths)
    - [Paste from Clipboard](#paste-from-clipboard)
    - [Advance to Next Task](#advance-to-next-task)
  - [Features](#features)
  - [Configuration](#configuration)
  - [Dependencies](#dependencies)
  - [Contributing](#contributing)
  - [License](#license)
  - [Contact](#contact)

## Installation

### Local Installation (for Development)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/ultrawideturbodev/pew-pew-cli.git
    cd pew-pew-cli
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Build the project:**
    ```bash
    npm run build
    ```
4.  **Link the command globally:**
    ```bash
    npm link
    ```

Now you can use the `pew` command anywhere in your terminal.

### Global Installation (Planned)

Once published to npm, you will be able to install it globally:

```bash
# npm install -g pew-pew-cli # (Coming soon)
```

## Usage

### Initialize Project

Creates the `.pew` directory and default configuration files (`.pew/config/paths.yaml`, `.pew/tasks.md`) in the current directory. It will prompt for the primary tasks file path unless `--force` is used.

```bash
pew init
```

Force initialization without prompts:

```bash
pew init --force
```

### Set Configuration Paths

Set the path for the primary tasks file. Currently, only the `tasks` field is supported.

Set the path locally (relative to the project root):

```bash
pew set path --field tasks --value ./docs/my_tasks.md
```

Set the path globally (relative to `~/.pew/`):

```bash
pew set path --field tasks --value global_tasks.md --global
```

### Paste from Clipboard

Paste clipboard content into the configured primary tasks file. If no mode flag is provided, you will be prompted to choose.

Append content:

```bash
pew paste tasks --append
```

Overwrite content:

```bash
pew paste tasks --overwrite
# or
pew paste tasks --force
```

Insert content at the beginning:

```bash
pew paste tasks --insert
```

Paste with interactive prompt for mode:

```bash
pew paste tasks
# > Choose paste mode: (Use arrow keys)
# > overwrite
#   append
#   insert
```

### Advance to Next Task

Marks the first uncompleted task (`- [ ]`) in the primary tasks file as complete (`- [x]`) and displays the next uncompleted task along with context (headers) and summary statistics.

```bash
pew next task
```

## Features

-   **Task Management:** Simple Markdown-based task list management (`- [ ]`, `- [x]`).
-   **CLI Workflow:** Manage tasks directly from the command line.
-   **Clipboard Integration:** Easily paste content (e.g., notes, code snippets) into your task list.
-   **Configuration:** Supports local (`./.pew`) and global (`~/.pew`) configurations for task file paths.
-   **Task Navigation:** `pew next task` command streamlines moving through your task list.

## Configuration

pewPewCLI uses YAML files for configuration.

-   **Local Configuration:** Located at `./.pew/config/paths.yaml` within your project directory. Paths defined here are relative to the project root (the directory containing `.pew`). Local configuration takes precedence over global configuration.
-   **Global Configuration:** Located at `~/.pew/config/paths.yaml` in your home directory. Paths defined here are relative to the global `.pew` directory (`~/.pew/`).

**`paths.yaml` structure:**

```yaml
tasks:
  - path/to/your/tasks.md # Can be relative
  # - /absolute/path/to/another/tasks.md # Absolute paths also work
```

Currently, only the first path listed under `tasks` is used as the primary task file.

## Dependencies

Key dependencies include:

-   [commander](https://github.com/tj/commander.js/): For command-line argument parsing.
-   [inquirer](https://github.com/SBoudrias/Inquirer.js/): For interactive CLI prompts.
-   [clipboardy](https://github.com/sindresorhus/clipboardy): For clipboard access.
-   [js-yaml](https://github.com/nodeca/js-yaml): For YAML parsing and serialization.

See `package.json` for a full list of dependencies.

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request on the [GitHub repository](https://github.com/ultrawideturbodev/pew-pew-cli).

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## License

This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0).

You are free to:

-   **Share** — copy and redistribute the material in any medium or format
-   **Adapt** — remix, transform, and build upon the material

Under the following terms:

-   **Attribution** — You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
-   **NonCommercial** — You may not use the material for commercial purposes.

See the [LICENSE](LICENSE) file for more details.

*(Note: Consider updating the `license` field in `package.json` to `"CC-BY-NC-4.0"`)*

## Contact

Created by [Brian](https://github.com/ultrawideturbodev) - brian@ultrawideturbodev.com

Project Link: [https://github.com/ultrawideturbodev/pew-pew-cli](https://github.com/ultrawideturbodev/pew-pew-cli)
```
