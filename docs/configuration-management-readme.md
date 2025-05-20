# Configuration Management in pew-pew-cli

This document provides a comprehensive overview of how configuration is managed in the pew-pew-cli project. Understanding this system is essential for AI agents working with the codebase, as configuration plays a central role in how the tool functions.

## Configuration Structure and Hierarchy

pew-pew-cli uses a hierarchical configuration system with two levels:

1. **Local Configuration**: Project-specific settings in `pew.yaml` at the project root
2. **Global Configuration**: User-level settings in `~/.pew/pew.yaml`

The key principle is that **local configuration always takes precedence over global configuration** when both are available.

## Configuration File Format

Configuration is stored in YAML files with a structure defined by the `PewConfigDto` interface:

```yaml
# Example pew.yaml
tasks:
  # List of files scanned for tasks
  all:
    - relative/path/to/tasks.md
    - another-tasks.md
  
  # Default primary task file
  primary: relative/path/to/tasks.md
  
  # Default target file for 'pew paste tasks'
  paste: relative/path/to/tasks.md

updates:
  # Timestamp for last update check
  lastUpdateCheckTimestamp: 1634567890123

# Templates for code generation
templates:
  # Example component template
  component:
    # Variables with default values
    variables:
      ComponentName: "MyComponent"
      StyleType: "css"
    
    # String replacements in content and filenames
    replacements:
      "__COMPONENT__": "${ComponentName}"
      "__STYLE_EXT__": "${StyleType}"
    
    # Root directory for output (optional)
    root: "src/components/${ComponentName}"
    
    # Files to be processed (required)
    files:
      - "templates/component/__COMPONENT__.tsx"
      - "templates/component/__COMPONENT__.__STYLE_EXT__"
      - "templates/component/index.ts"
```

## Data Transfer Objects (DTOs)

The configuration structure is defined by TypeScript interfaces in `src/io/config.dto.ts`:

```typescript
// Root configuration DTO
export interface PewConfigDto {
  tasks?: Partial<TasksConfigDto>;
  updates?: Partial<UpdatesConfigDto>;
  templates?: Record<string, TemplateConfigDto>;
}

// Task-related configuration
export interface TasksConfigDto {
  all: string[];
  primary: string;
  paste: string;
}

// Update-related configuration
export interface UpdatesConfigDto {
  lastUpdateCheckTimestamp: number;
}

// Template configuration for code generation
export interface TemplateConfigDto {
  // Variables to be replaced in the template (optional)
  variables?: Record<string, string>;
  
  // String replacements to apply to content and filenames (optional)
  replacements?: Record<string, string>;
  
  // Root directory for output files (optional)
  root?: string;
  
  // List of files to be processed (required)
  files: string[];
}
```

These DTOs provide type safety and structure for the configuration data.

## The Configuration Service

The `ConfigService` (in `src/io/config.service.ts`) is implemented as a singleton and handles:

1. Loading and parsing YAML files
2. Merging configurations with default values
3. Resolving configuration precedence
4. Providing access to configuration values
5. Updating configuration values

### Initialization Flow

The initialization process is critical to understand:

```typescript
public async initialize(): Promise<void> {
  if (this.isInitialized) return;

  // Find the local project root and pew.yaml path if it exists
  const projectRoot = await this.findProjectRoot(process.cwd());
  if (projectRoot) {
    this.projectRootPath = projectRoot;
    this.localPewYamlPath = this.fileSystemService.joinPath(projectRoot, 'pew.yaml');
  }

  // Load global configuration (always attempt to load)
  this.globalConfigData = await this.loadPewYaml(this.globalPewYamlPath);

  // Load local configuration if available
  if (this.localPewYamlPath) {
    this.localConfigData = await this.loadPewYaml(this.localPewYamlPath);
  }

  // Determine the effective configuration to use
  if (this.localConfigData) {
    // Local configuration takes precedence if available
    this.effectiveConfigData = this.localConfigData;
  } else if (this.globalConfigData) {
    // Global configuration is used if no local configuration exists
    this.effectiveConfigData = this.globalConfigData;
  } else {
    // Fall back to default DTO if neither local nor global configurations exist
    this.effectiveConfigData = ConfigService.getDefaultConfigDTO();
  }

  this.isInitialized = true;
}
```

This initialization:
1. Searches for a local project root with a `pew.yaml` file
2. Loads the global configuration from `~/.pew/pew.yaml`
3. Loads the local configuration if found
4. Determines the "effective" configuration based on precedence rules
5. Marks the service as initialized

### Configuration Loading and Default Values

When loading configuration files, the service merges the loaded values with default values:

```typescript
private deserializeAndMergeWithDefaults(rawData: Record<string, unknown>): PewConfigDto {
  // Start with a deep copy of the default configuration
  const mergedConfig = ConfigService.getDefaultConfigDTO();

  // Process the raw data, applying its values over the defaults if valid
  // ...

  return mergedConfig;
}
```

The default values are defined as static constants:

```typescript
private static readonly kDefaultTasksConfig: TasksConfigDto = {
  all: ['tasks.md'],
  primary: 'tasks.md',
  paste: 'tasks.md',
};

private static readonly kDefaultUpdatesConfig: UpdatesConfigDto = {
  lastUpdateCheckTimestamp: 0,
};
```

### Project Root Discovery

The `ConfigService` searches upward from the current directory to find a project root:

```typescript
private async findProjectRoot(startPath: string): Promise<string | null> {
  let currentPath = startPath;
  const maxDepth = 10;
  let depth = 0;

  while (depth < maxDepth) {
    const pewYamlPath = this.fileSystemService.joinPath(currentPath, 'pew.yaml');

    if (await this.fileSystemService.pathExists(pewYamlPath)) {
      return currentPath; // Found it!
    }

    const parentPath = path.dirname(currentPath);
    if (parentPath === currentPath) {
      break; // Stop if we've reached the root directory
    }

    currentPath = parentPath;
    depth++;
  }

  return null; // No project root found
}
```

This allows the tool to work from any subdirectory within a project.

## Path Resolution

One crucial aspect of the configuration system is path resolution. Configuration files store relative paths, but the service resolves them to absolute paths when needed:

```typescript
public async getTasksPaths(global: boolean = false): Promise<string[]> {
  await this.initialize();

  const configData = global ? this.globalConfigData : this.effectiveConfigData;
  // ...

  const rawPaths = Array.isArray(taskPaths) && taskPaths.length > 0 ? taskPaths : ['tasks.md'];

  // Resolve paths relative to the appropriate base directory
  if (global || !this.projectRootPath) {
    // For global config or when no local project is found, resolve relative to home directory
    const homeDir = this.fileSystemService.getHomeDirectory();
    return rawPaths.map((p) => path.resolve(homeDir, p));
  } else {
    // For local config, resolve relative to the project root
    const rootPath = this.projectRootPath || process.cwd();
    return rawPaths.map((p) => path.resolve(rootPath, p));
  }
}
```

This approach allows users to specify simple relative paths in configuration files but ensures the application always works with absolute paths internally.

## YAML Parsing and Serialization

The `YamlService` (in `src/io/yaml.service.ts`) handles the YAML parsing and serialization:

```typescript
// Parsing YAML to JavaScript objects
parseYaml(yamlString: string): Record<string, unknown> {
  try {
    if (!yamlString || yamlString.trim() === '') {
      return {};
    }
    return (yaml.load(yamlString) as Record<string, unknown>) || {};
  } catch (error: unknown) {
    this.logger.error('Error parsing YAML:', error);
    return {};
  }
}

// Serializing JavaScript objects to YAML strings
serializeToYaml<T>(data: T): string {
  try {
    return yaml.dump(data || {});
  } catch (error: unknown) {
    this.logger.error('Error serializing to YAML:', error);
    return '';
  }
}
```

The service uses the `js-yaml` library for parsing and serialization, with error handling for robustness.

## Working with Configuration

### Reading Configuration Values

To access configuration values, the services provide several methods:

```typescript
// Get all task file paths (resolved to absolute paths)
public async getAllTasksPaths(): Promise<string[]>

// Get the paste tasks file path
public async getPasteTasksPath(): Promise<string>

// Get update-related values
public async getGlobalUpdateValue<T>(key: keyof UpdatesConfigDto, defaultValue: T): Promise<T>
```

These methods handle initialization, path resolution, and fallback to default values.

### Updating Configuration Values

To modify configuration values, the service offers methods like:

```typescript
// Set task file paths
public async setTasksPaths(
  paths: string[],
  global: boolean = false,
  pasteTaskPath?: string
): Promise<void>

// Set update-related values
public async setGlobalUpdateValue(key: keyof UpdatesConfigDto, value: unknown): Promise<void>
```

These methods handle validation, serialization, and file writing.

### Understanding Template Configuration

Templates provide a powerful way to define code generation patterns in pew-pew-cli. Each template defines:

1. **Variables**: Key-value pairs that can be replaced in generated files
   - Can be overridden via CLI arguments: `--VariableName=Value`
   - Used in replacements with `${VariableName}` syntax

2. **Replacements**: Direct string substitutions in file content and filenames
   - The key is the string to find (e.g., `__COMPONENT__`)
   - The value is the replacement, which can include variables (e.g., `${ComponentName}`)

3. **Root Directory**: The base output directory for generated files
   - Can include variable references for dynamic paths
   - If not specified, files are generated relative to the current directory

4. **Files**: A list of source files to be processed during code generation
   - The only required field in a template
   - Can include placeholder strings that will be replaced using the replacements map

The templates section in pew.yaml follows this structure:

```yaml
templates:
  component:
    variables:
      ComponentName: "MyComponent"
    replacements:
      "__COMPONENT__": "${ComponentName}"
    root: "src/components/${ComponentName}"
    files:
      - "templates/component/__COMPONENT__.tsx"
```

This configuration is parsed and validated by the ConfigService, which ensures that:
- All variables are string values
- All replacements are string values
- The root is a string value
- The files property exists and is an array of strings

## Best Practices for Working with Configuration

1. **Always Initialize First**: Before accessing any configuration values, ensure `ConfigService.initialize()` has been called and awaited.

   ```typescript
   await this.configService.initialize();
   const taskPaths = await this.configService.getAllTasksPaths();
   ```

2. **Handle Both Configuration Scopes**: When implementing features, consider whether they should work with local, global, or both configuration scopes.

   ```typescript
   // Use local over global (default behavior)
   const localFirstPaths = await this.configService.getAllTasksPaths();
   
   // Force use of global configuration
   const globalOnlyPaths = await this.configService.getTasksPaths(true);
   ```

3. **Work with Absolute Paths**: When using paths from configuration, always get the resolved absolute paths from the service methods, not raw paths from the configuration objects.

   ```typescript
   // Correct: Use service methods that return absolute paths
   const absolutePaths = await this.configService.getAllTasksPaths();
   
   // Incorrect: Accessing raw configuration objects directly
   const rawPaths = this.configService.effectiveConfigData.tasks?.all; // These are relative!
   ```

4. **Handle Missing Configuration Gracefully**: Always account for the possibility that configuration might not exist or might be incomplete.

   ```typescript
   const fileExists = await this.fileSystemService.pathExists(filePath);
   if (!fileExists) {
     this.logger.info(`Configuration file ${filePath} not found. Using defaults.`);
     // ...
   }
   ```

5. **Update In-Memory Cache After Changes**: When updating configuration files, ensure the in-memory cache is also updated.

   ```typescript
   // Update file
   await this.savePewYaml(targetFile, configData);
   
   // Update cache
   if (global) {
     this.globalConfigData = configData;
   } else {
     this.localConfigData = configData;
   }
   
   // Update effective configuration if needed
   if (!global || !this.localConfigData) {
     this.effectiveConfigData = configData;
   }
   ```

## Adding New Configuration Sections

To add a new configuration section:

1. Define a new DTO interface in `src/io/config.dto.ts`:

   ```typescript
   export interface NewFeatureConfigDto {
     enabled: boolean;
     options: string[];
   }
   ```

2. Update the root `PewConfigDto` interface:

   ```typescript
   export interface PewConfigDto {
     tasks?: Partial<TasksConfigDto>;
     updates?: Partial<UpdatesConfigDto>;
     newFeature?: Partial<NewFeatureConfigDto>; // Add new section
   }
   ```

3. Add default values in `ConfigService`:

   ```typescript
   private static readonly kDefaultNewFeatureConfig: NewFeatureConfigDto = {
     enabled: false,
     options: [],
   };
   
   public static getDefaultConfigDTO(): PewConfigDto {
     return {
       tasks: { ...ConfigService.kDefaultTasksConfig },
       updates: { ...ConfigService.kDefaultUpdatesConfig },
       newFeature: { ...ConfigService.kDefaultNewFeatureConfig },
     };
   }
   ```

4. Update the deserialize method to handle the new section:

   ```typescript
   private deserializeAndMergeWithDefaults(rawData: Record<string, unknown>): PewConfigDto {
     // ...existing code...
     
     // Process newFeature configuration if it exists
     if (rawData.newFeature && typeof rawData.newFeature === 'object') {
       // Handle fields from new section
       // ...
     }
     
     return mergedConfig;
   }
   ```

5. Add accessor methods for the new configuration:

   ```typescript
   public async getNewFeatureConfig(): Promise<NewFeatureConfigDto> {
     await this.initialize();
     return this.effectiveConfigData.newFeature || { ...ConfigService.kDefaultNewFeatureConfig };
   }
   
   public async setNewFeatureConfig(config: Partial<NewFeatureConfigDto>, global: boolean = false): Promise<void> {
     // Implementation
   }
   ```

### Example: Template Configuration Implementation

The templates feature is a concrete example of adding a new configuration section. Here's how it was implemented:

1. Define the DTO interface in `config.dto.ts`:

   ```typescript
   export interface TemplateConfigDto {
     variables?: Record<string, string>;
     replacements?: Record<string, string>;
     root?: string;
     files: string[];
   }
   ```

2. Update the root PewConfigDto interface:

   ```typescript
   export interface PewConfigDto {
     tasks?: Partial<TasksConfigDto>;
     updates?: Partial<UpdatesConfigDto>;
     templates?: Record<string, TemplateConfigDto>;
   }
   ```

3. Add default values in ConfigService:

   ```typescript
   private static readonly kDefaultTemplatesConfig: Record<string, TemplateConfigDto> = {};
   
   public static getDefaultConfigDTO(): PewConfigDto {
     return {
       tasks: { ...ConfigService.kDefaultTasksConfig },
       updates: { ...ConfigService.kDefaultUpdatesConfig },
       templates: { ...ConfigService.kDefaultTemplatesConfig },
     };
   }
   ```

4. Update the deserialize method:

   ```typescript
   private deserializeAndMergeWithDefaults(rawData: Record<string, unknown>): PewConfigDto {
     // ...existing code...
     
     // Process templates configuration if it exists
     if (rawData.templates && typeof rawData.templates === 'object') {
       // Clear default templates
       mergedConfig.templates = {};
       
       // Process each template
       const templatesObj = rawData.templates as Record<string, unknown>;
       
       for (const [templateName, templateValue] of Object.entries(templatesObj)) {
         if (typeof templateValue === 'object' && templateValue !== null) {
           const templateObj = templateValue as Record<string, unknown>;
           
           // Validate the required files field - must be an array of strings
           if (
             Array.isArray(templateObj.files) && 
             (templateObj.files as unknown[]).every(item => typeof item === 'string')
           ) {
             // Initialize a valid template
             const validTemplate: TemplateConfigDto = {
               files: [...(templateObj.files as string[])]
             };
             
             // Process optional fields (variables, replacements, root)
             // ...
             
             // Add validated template to config
             mergedConfig.templates[templateName] = validTemplate;
           }
         }
       }
     }
     
     return mergedConfig;
   }
   ```

This pattern can be followed for adding any new section to the configuration system.

## Conclusion

The configuration management system in pew-pew-cli provides a flexible, hierarchical approach that supports both global user-level settings and local project-specific settings. By understanding this system, you'll be able to effectively work with and extend the configuration capabilities of the tool.