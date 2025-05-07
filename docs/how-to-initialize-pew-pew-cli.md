# How To: Initialize Pew Pew CLI Inside Your Project

## Introduction

This tutorial guides you through initializing the `pewPewCLI` within your existing project directory using the `pew init` command. Initialization sets up the necessary configuration file and default task file needed for the tool to operate.

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
    *   Create a configuration file named `pew.yaml` in your project root.
    *   Create a default task file (usually `tasks.md` in your project root, but you can specify a different path during initialization).
    *   Prompt you to enter the primary tasks file path, with the default being `tasks.md`.

    **Default `pew.yaml`:**
    ```yaml
    tasks:
      all:
        - tasks.md
      primary: tasks.md
      paste: tasks.md
    updates:
      lastUpdateCheckTimestamp: 0
    ```

    **Default `tasks.md`:**
    ```markdown
    # My Project Tasks
    - [ ] Task 1
    - [ ] Task 2
    ```

    **Directory Structure after `init`:**
    ```
    your-project/
    ├── pew.yaml
    ├── tasks.md
    ├── other-project-files/
    └── ...
    ```

## Using the `--force` Option

If you have previously run `pew init` or if the `pew.yaml` file already exists for any reason, running `pew init` again will normally prompt you to confirm overwriting.

To skip this prompt and forcefully overwrite the existing `pew.yaml` file and create a new default task file, use the `-f` or `--force` flag:

```bash
pew init --force
```

**Caution:** Using `--force` will replace the content of your existing `pew.yaml` with default values. Use this option carefully.

## Conclusion

Running `pew init` is the first step to integrating the `pewPewCLI` into your workflow. It quickly sets up the configuration file and default task file, allowing you to immediately start managing your tasks with commands like `pew next task`. 
