# PewPew CLI

A command-line tool for managing tasks and workflows.

## Installation

### Local Installation (for development)

1. Clone the repository.
2. Build the project: `npm run build`
3. Link the command globally: `npm link`

Now you can use the `pew` command anywhere in your terminal.

### Global Installation (from NPM - placeholder)

```bash
# npm install -g pew-pew-cli # (Once published)
```

## Usage

### Initialize Project
Creates the `.pew` directory and configuration files in the current directory.
```bash
pew init
```

### Set Configuration Paths
Set the path for tasks (only 'tasks' field supported currently).
```bash
pew set path --field tasks --value ./path/to/your/tasks.md
pew set path --field tasks --value ~/.pew/global_tasks.md -g # Set globally
```

### Paste from Clipboard
Paste clipboard content into the configured tasks file.
```bash
pew paste tasks
# Choose mode: overwrite, append, insert
```

### Advance to Next Task
Marks the current task in the primary tasks file as complete and displays the next one.
```bash
pew next task
``` 