# How To: Initialize Pew Pew CLI Inside Your Project

## Introduction

This tutorial guides you through initializing the `pewPewCLI` within your existing project directory using the `pew init` command. Initialization sets up the necessary configuration files and default task file needed for the tool to operate.

## Steps for Initialization

1.  **Navigate to Project Root:** Open your terminal or command prompt and change the directory (`cd`) to the root folder of the project where you want to use the `pewPewCLI`.

    ```bash
    cd /path/to/your/project
    ```

2.  **Run `pew init`:** Execute the initialization command.

    ```bash
    pew init
    ```

3.  **Expected Output & Files:** The command will:
    *   Create a hidden directory named `.pew` in your project root.
    *   Inside `.pew`, create a `config` subdirectory.
    *   Create the configuration file: `.pew/config/paths.yaml`. This file tells the `pewPewCLI` where to find your task files. By default, it's configured to use `.pew/tasks.md`.
    *   Create the default task file: `.pew/tasks.md`. This is a markdown file where you can start adding your project tasks.

    **Default `.pew/config/paths.yaml**:**
    ```yaml
    tasks:
      - .pew/tasks.md
    paste-tasks: .pew/tasks.md # Default target for 'pew paste tasks' is also set
    ```

    **Default `.pew/tasks.md**:**
    ```markdown
    # My Project Tasks
    - [ ] Task 1
    - [ ] Task 2
    ```

    **Directory Structure after `init`:**
    ```
    your-project/
    ├── .pew/
    │   ├── config/
    │   │   └── paths.yaml
    │   └── tasks.md
    ├── other-project-files/
    └── ...
    ```

## Using the `--force` Option

If you have previously run `pew init` or if the `.pew` directory already exists for any reason, running `pew init` again will normally prompt you to confirm overwriting.

To skip this prompt and forcefully overwrite the existing `.pew` directory and its contents with the default setup, use the `-f` or `--force` flag:

```bash
pew init --force
```

**Caution:** Using `--force` will delete any existing configuration in `.pew/config/paths.yaml` and replace the content of `.pew/tasks.md` with the default template. Use this option carefully.

## Conclusion

Running `pew init` is the first step to integrating the `pewPewCLI` into your workflow. It quickly sets up the standard directory and files, allowing you to immediately start managing your tasks with commands like `pew next task`. 
