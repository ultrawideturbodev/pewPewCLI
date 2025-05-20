# Service Architecture in pew-pew-cli

This document provides a comprehensive overview of the service architecture used throughout the pew-pew-cli project for AI agents who need to understand, maintain, or extend the codebase.

## Core Architecture Pattern

pew-pew-cli follows a service-oriented architecture with a clear separation of concerns. The codebase is organized around specialized service classes, each focused on a specific domain of functionality.

### Key Architectural Principles

1. **Service Specialization**: Each service handles a specific domain (CLI, tasks, configuration, file system, etc.)
2. **Singleton Pattern**: Core services use the singleton pattern for global access and state management
3. **Dependency Injection**: Services receive their dependencies through constructors
4. **Asynchronous Operations**: File I/O and user interactions are handled asynchronously with Promises

## Service Structure Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│    CliService   │────▶│   TaskService   │────▶│ FileSystemService│
│  (Orchestrator) │     │ (Core Business) │     │    (I/O Layer)  │
│                 │     │                 │     │                 │
└────────┬────────┘     └────────┬────────┘     └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  ConfigService  │     │ UserInputService│     │  LoggerService  │
│  (Configuration)│     │  (Interaction)  │     │   (Feedback)    │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                                              ▲
         │                                              │
         ▼                                              │
┌─────────────────┐     ┌─────────────────┐            │
│                 │     │                 │            │
│   YamlService   │     │ ClipboardService│────────────┘
│  (YAML Parser)  │     │  (OS Interface) │
│                 │     │                 │
└─────────────────┘     └─────────────────┘
```

## Singleton Pattern Implementation

Several core services in pew-pew-cli are implemented as singletons to ensure there's only one instance throughout the application:

### Example: CliService Singleton

```typescript
export class CliService {
  private static instance: CliService | null = null;

  // Private constructor prevents direct instantiation
  private constructor() {
    // Initialize properties
  }

  // Static method to get the singleton instance
  public static getInstance(): CliService {
    if (!CliService.instance) {
      CliService.instance = new CliService();
    }
    return CliService.instance;
  }
}
```

### Other Singleton Services

- **LoggerService**: Provides centralized logging with consistent formatting
- **ConfigService**: Manages application configuration with caching

## Service Dependencies and Injection

Services that require other services receive them via constructor injection:

```typescript
export class TaskService {
  constructor(
    private configService: ConfigService,
    private fileSystemService: FileSystemService
  ) {}
  
  // Service methods...
}
```

This pattern:
1. Makes dependencies explicit
2. Facilitates testing through mock injection
3. Creates a clear dependency graph

## Service Initialization Pattern

Many services require initialization before use. This is typically handled with an asynchronous `initialize()` method:

```typescript
export class ConfigService {
  private isInitialized = false;
  
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    // Perform initialization steps
    // Load configuration, etc.
    
    this.isInitialized = true;
  }
}
```

This pattern:
1. Allows lazy initialization
2. Prevents redundant initialization
3. Handles asynchronous setup operations

## Service Lifecycle

A typical service in pew-pew-cli follows this lifecycle:

1. **Instantiation**: Created by direct instantiation or through `getInstance()`
2. **Dependency Injection**: Dependencies are passed to constructor (for non-singletons)
3. **Initialization**: Asynchronous setup operations (if needed)
4. **Method Calls**: Service methods are called as needed
5. **Error Handling**: Methods include try/catch blocks for error management

## Key Services Overview

### CliService (src/core/cli.service.ts)

**Role**: Command orchestration and routing.

**Pattern**: Singleton with handler methods for each CLI command.

**Key Methods**:
- `handleInit()`: Sets up initial configuration
- `handleSetPath()`: Updates configuration paths
- `handlePasteTasks()`: Manages clipboard-to-file operations
- `handleNextTask()`: Processes the current task and moves to the next

### TaskService (src/tasks/task.service.ts)

**Role**: Core business logic for task manipulation.

**Pattern**: Standard service with specialized methods for task operations.

**Key Methods**:
- `processNextTaskState()`: Advances to the next task
- `resetTaskFile()`: Resets completed tasks to unchecked state
- `writeTasksContent()`: Writes task content to file

### ConfigService (src/io/config.service.ts)

**Role**: Configuration management across local and global scopes.

**Pattern**: Singleton with caching and lazy loading.

**Key Methods**:
- `initialize()`: Loads configuration files
- `getAllTasksPaths()`: Retrieves task file paths
- `setTasksPaths()`: Updates task paths in configuration

### FileSystemService (src/io/file-system.service.ts)

**Role**: File system abstraction.

**Pattern**: Standard service with promise-based file operations.

**Key Methods**:
- `pathExists()`: Checks if a path exists
- `readFile()`: Reads file content
- `writeFile()`: Writes content to file
- `ensureDirectoryExists()`: Creates directories if needed

### UserInputService (src/io/user-input.service.ts)

**Role**: Interactive user prompts management.

**Pattern**: Standard service wrapping Inquirer.js.

**Key Methods**:
- `askForText()`: Prompts for text input
- `askForConfirmation()`: Prompts for yes/no confirmation
- `askForSelection()`: Prompts for selection from a list

### LoggerService (src/core/logger.service.ts)

**Role**: Console output formatting.

**Pattern**: Singleton for consistent output.

**Key Methods**:
- `log()`: Standard logging
- `success()`: Success message formatting
- `error()`: Error message formatting

## Best Practices for Working with Services

1. **Follow the Existing Pattern**: When creating a new service, follow the established patterns
   ```typescript
   export class NewService {
     // For singletons
     private static instance: NewService | null = null;
     public static getInstance(): NewService {
       if (!NewService.instance) {
         NewService.instance = new NewService();
       }
       return NewService.instance;
     }
     
     // OR for standard services
     constructor(
       private dependency1: Dependency1Service,
       private dependency2: Dependency2Service
     ) {}
   }
   ```

2. **Proper Error Handling**: Wrap service method implementation in try/catch blocks
   ```typescript
   async serviceMethod(): Promise<void> {
     try {
       // Implementation
     } catch (error) {
       // Log error
       this.logger.error('Error message:', error);
       // Optionally rethrow
     }
   }
   ```

3. **Initialization Check**: For services requiring initialization
   ```typescript
   async methodRequiringInit(): Promise<void> {
     await this.initialize();
     // Rest of method implementation
   }
   ```

4. **Clear Method Documentation**: Use JSDoc for all public methods
   ```typescript
   /**
    * Brief description of what the method does.
    * 
    * @param {ParamType} paramName - Description of parameter
    * @returns {Promise<ReturnType>} Description of return value
    */
   async methodName(paramName: ParamType): Promise<ReturnType> {
     // Implementation
   }
   ```

5. **Service Responsibility**: Keep services focused on their domain
   - Don't add file system operations to the TaskService
   - Don't add task-specific logic to the FileSystemService

## Adding a New Service

When adding a new service to the pew-pew-cli project:

1. **Determine Singleton Status**: Decide if the service should be a singleton based on:
   - Does it need to maintain global state?
   - Will it be accessed from many places in the code?
   - Does it need to coordinate resources across the application?

2. **Identify Dependencies**: Determine what other services this service requires

3. **Create the Service Class**: Follow the pattern of existing services
   ```typescript
   // For a standard service
   export class YourService {
     constructor(
       private dependency1: Dependency1Service,
       private dependency2: Dependency2Service
     ) {}
     
     // Methods...
   }
   
   // For a singleton
   export class YourSingletonService {
     private static instance: YourSingletonService | null = null;
     
     private constructor() {
       // Initialize properties
     }
     
     public static getInstance(): YourSingletonService {
       if (!YourSingletonService.instance) {
         YourSingletonService.instance = new YourSingletonService();
       }
       return YourSingletonService.instance;
     }
     
     // Methods...
   }
   ```

4. **Add to CliService**: If needed, add an instance in the CliService constructor
   ```typescript
   private constructor() {
     // Other initializations...
     this.yourService = new YourService(dependency1, dependency2);
     // Or for singletons
     this.yourService = YourSingletonService.getInstance();
   }
   ```

5. **Create Tests**: Add unit tests for your service in the tests/unit/services directory

By understanding and following these service architecture patterns, you'll be able to effectively maintain and extend the pew-pew-cli codebase in a way that's consistent with its existing design.