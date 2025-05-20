# File System Operations in pew-pew-cli

This document provides a comprehensive overview of how pew-pew-cli interacts with the file system. Understanding this system is essential for AI agents working with the codebase, as file operations are a core part of the tool's functionality.

## File System Abstraction

pew-pew-cli abstracts file system operations through the `FileSystemService` class located in `src/io/file-system.service.ts`. This service:

1. Wraps Node.js built-in modules (`fs`, `path`, and `os`)
2. Provides consistent error handling and logging
3. Offers a promise-based API for all operations
4. Abstracts platform-specific details

## Core File Operations

### Reading Files

```typescript
/**
 * Asynchronously reads the entire content of a file.
 * Assumes UTF-8 encoding.
 */
async readFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    this.logger.error(`Error reading file ${filePath}:`, error);
    throw error;
  }
}
```

This method:
- Takes an absolute or relative file path
- Returns the file content as a string (UTF-8 encoded)
- Logs and re-throws errors for better debugging

### Writing Files

```typescript
/**
 * Asynchronously writes data to a file, replacing it if it exists.
 * Assumes UTF-8 encoding.
 */
async writeFile(filePath: string, content: string): Promise<void> {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
  } catch (error) {
    this.logger.error(`Error writing file ${filePath}:`, error);
    throw error;
  }
}
```

This method:
- Takes a file path and string content to write
- Overwrites existing files (does not append)
- Logs and re-throws errors

### Checking Path Existence

```typescript
/**
 * Asynchronously checks if a path exists on the file system.
 */
async pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
```

This method:
- Returns `true` if the path exists, `false` otherwise
- Never throws an error, making it safe for existence checks
- Works for both files and directories

### Directory Operations

```typescript
/**
 * Asynchronously creates a directory.
 */
async createDirectory(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    this.logger.error(`Error creating directory ${dirPath}:`, error);
    throw error;
  }
}

/**
 * Ensures a directory exists, creating it if needed.
 */
async ensureDirectoryExists(dirPath: string): Promise<void> {
  const exists = await this.pathExists(dirPath);
  if (!exists) {
    await this.createDirectory(dirPath);
  }
}
```

These methods:
- Create directories with the `recursive: true` option (creates parent directories too)
- Handle errors consistently
- `ensureDirectoryExists` is a convenience method that checks existence first

## Path Management

### Home Directory Access

```typescript
/**
 * Gets the path to the user's home directory.
 */
getHomeDirectory(): string {
  return os.homedir();
}
```

This method:
- Returns the absolute path to the user's home directory
- Uses the Node.js `os` module for cross-platform support

### Path Resolution

```typescript
/**
 * Resolves a sequence of paths into an absolute path.
 */
resolvePath(...paths: string[]): string {
  return path.resolve(...paths);
}

/**
 * Joins path segments using the platform-specific separator.
 */
joinPath(...paths: string[]): string {
  return path.join(...paths);
}
```

These methods:
- Wrap the Node.js `path` module methods
- Handle platform-specific path separators
- `resolvePath` turns relative paths into absolute paths
- `joinPath` simply joins path segments with the correct separator

## Error Handling Pattern

All file operations follow a consistent error handling pattern:

```typescript
try {
  // Perform file operation
  return result;
} catch (error) {
  // Log the error with context
  this.logger.error(`Error description with ${contextDetails}:`, error);
  // Re-throw for caller to handle
  throw error;
}
```

This pattern ensures:
1. All errors are logged with context
2. Error handling is consistent across the service
3. Callers can catch and handle errors appropriately

## Path Resolution Strategy

### Relative vs. Absolute Paths

pew-pew-cli uses a consistent approach to path handling:

1. **Configuration Storage**: Paths are stored as relative paths in configuration files
2. **Internal Processing**: Paths are resolved to absolute paths when loaded from configuration
3. **File Operations**: All file operations use absolute paths

This allows for:
- Portable configuration files (relative paths)
- Correct operation regardless of the current working directory (absolute paths)
- Consistent behavior across different command invocations

### Path Resolution Flow

When a path comes from configuration:

1. Read the relative path from configuration
2. Determine the base directory (project root for local config, home directory for global config)
3. Resolve the path against the base directory
4. Use the absolute path for file operations

```typescript
// Example from ConfigService
const rawPaths = config.tasks?.all || ['tasks.md'];
const baseDir = this.projectRootPath || this.fileSystemService.getHomeDirectory();
return rawPaths.map((p) => path.resolve(baseDir, p));
```

## File System Operations in Context

### Task File Operations

The `TaskService` relies heavily on the `FileSystemService` for operations like:

1. Reading task files:
   ```typescript
   async readTaskLines(filePath: string): Promise<string[]> {
     const fileExists = await this.fileSystemService.pathExists(filePath);
     if (!fileExists) {
       throw new Error(`Task file not found: ${filePath}`);
     }
     const content = await this.fileSystemService.readFile(filePath);
     return content.split('\n');
   }
   ```

2. Writing task files:
   ```typescript
   async writeTaskLines(filePath: string, lines: string[]): Promise<void> {
     const content = lines.join('\n');
     const dirPath = path.dirname(filePath);
     await this.fileSystemService.ensureDirectoryExists(dirPath);
     await this.fileSystemService.writeFile(filePath, content);
   }
   ```

### Configuration File Operations

The `ConfigService` uses the `FileSystemService` to:

1. Find project roots:
   ```typescript
   private async findProjectRoot(startPath: string): Promise<string | null> {
     let currentPath = startPath;
     while (depth < maxDepth) {
       const pewYamlPath = this.fileSystemService.joinPath(currentPath, 'pew.yaml');
       if (await this.fileSystemService.pathExists(pewYamlPath)) {
         return currentPath;
       }
       // ...continue searching upward
     }
   }
   ```

2. Save configuration:
   ```typescript
   private async savePewYaml(filePath: string, dto: PewConfigDto): Promise<void> {
     await this.fileSystemService.ensureDirectoryExists(path.dirname(filePath));
     await this.yamlService.writeYamlFile(filePath, dto);
   }
   ```

## Best Practices for File Operations

### 1. Always Check Existence Before Reading

Before reading a file, check if it exists to provide better error messages:

```typescript
const exists = await this.fileSystemService.pathExists(filePath);
if (!exists) {
  // Handle non-existence case specifically
} else {
  // Proceed with reading
}
```

### 2. Ensure Parent Directories Exist Before Writing

Before writing a file, ensure its parent directory exists:

```typescript
const dirPath = path.dirname(filePath);
await this.fileSystemService.ensureDirectoryExists(dirPath);
await this.fileSystemService.writeFile(filePath, content);
```

### 3. Use Absolute Paths for Operations

Always resolve paths to absolute before operations:

```typescript
// Convert relative to absolute
const absolutePath = this.fileSystemService.resolvePath(relativePath);

// Then perform operation
await this.fileSystemService.readFile(absolutePath);
```

### 4. Handle Errors at the Appropriate Level

Catch errors at the level where you can provide meaningful context:

```typescript
try {
  await this.fileSystemService.writeFile(filePath, content);
} catch (error) {
  // Add task-specific context to the error
  this.logger.error(`Failed to write task file: ${error.message}`);
  throw new Error(`Task file could not be updated: ${filePath}`);
}
```

### 5. Use Path Joining for Platform Independence

Always use `joinPath` or `resolvePath` instead of string concatenation:

```typescript
// Good
const configPath = this.fileSystemService.joinPath(homeDir, '.pew', 'pew.yaml');

// Bad
const configPath = homeDir + '/.pew/pew.yaml'; // Won't work on Windows
```

## Adding New File Operations

If you need to add new file system operations:

1. First, check if the functionality can be built from existing methods
2. If not, add a new method to the `FileSystemService` that:
   - Wraps the necessary Node.js `fs` operations
   - Follows the consistent error handling pattern
   - Has a clear, descriptive name and documentation
   - Returns a Promise for async operations

Example:

```typescript
/**
 * Reads a file and parses it as JSON.
 * @param {string} filePath - The path to the JSON file.
 * @returns {Promise<unknown>} The parsed JSON object.
 * @throws {Error} If the file doesn't exist or contains invalid JSON.
 */
async readJsonFile(filePath: string): Promise<unknown> {
  try {
    const content = await this.readFile(filePath);
    return JSON.parse(content);
  } catch (error) {
    this.logger.error(`Error reading or parsing JSON file ${filePath}:`, error);
    throw error;
  }
}
```

## Testing File Operations

When testing file operations, use the provided mock in `tests/unit/__mocks__/file-system.service.js`:

```javascript
// Example from tests
const mockFileSystem = {
  pathExists: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  // ...other methods
};

mockFileSystem.pathExists.mockResolvedValue(true);
mockFileSystem.readFile.mockResolvedValue('- [ ] Task 1\n- [x] Task 2');
```

This allows you to:
- Control the behavior of file operations in tests
- Test error handling by making methods reject with errors
- Verify that methods were called with the expected arguments

## Conclusion

The `FileSystemService` provides a robust abstraction over Node.js file system operations, with consistent error handling, logging, and a promise-based API. By using this service for all file operations, pew-pew-cli ensures consistent behavior across different platforms and proper error reporting.