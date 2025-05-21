# Testing Guide for pew-pew-cli

## Overview

This document is the single source of truth for testing in the pew-pew-cli project. It covers the testing approach, how to run tests, how to write new tests, and troubleshooting.

## Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific modules
npm run test:tasks    # TaskService tests only
npm run test:core     # Core service tests only
```

## Current Test Status

✅ **Working Tests (28 passing):**
- TaskService: Core task management functionality
- LoggerService: Logging and output formatting  
- ConfigService: Basic configuration validation
- DTO validation: Data structure tests

❌ **Disabled Tests (module resolution issues):**
- FileSystemService
- YamlService  
- CliService (advanced tests)

## Test Structure

Tests are organized in a dedicated tests/ folder separate from source code:

```
tests/
├── unit/
│   ├── task.service.test.ts
│   ├── logger.service.test.ts
│   ├── config.service.templates.test.ts
│   ├── cli.service.test.ts
│   ├── cli.service.templates.test.ts
│   ├── file-system.service.test.ts
│   ├── yaml.service.test.ts
│   ├── template-config.dto.test.ts
│   └── default-config.test.ts
├── mocks/
│   └── service-factory.ts
└── utils/
    └── test-helpers.ts
```

## Writing Tests

### Basic Test Structure

```typescript
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { ServiceToTest } from '@/service-to-test.js'; // Absolute import

describe('ServiceToTest', () => {
  let service: ServiceToTest;
  
  beforeEach(() => {
    // Setup before each test
    service = new ServiceToTest();
  });
  
  describe('methodName', () => {
    test('should do something', () => {
      // Arrange
      const input = 'test input';
      
      // Act
      const result = service.methodName(input);
      
      // Assert
      expect(result).toBe('expected output');
    });
  });
});
```

### Using Mock Factories

```typescript
import { createMockFileSystemService, createMockConfigService } from '@tests/mocks/service-factory.js';

const fileSystemService = createMockFileSystemService();
const configService = createMockConfigService();
const taskService = new TaskService(configService, fileSystemService);
```

### Import System

The project uses **absolute imports** (like Flutter) instead of relative paths:

```typescript
// ✅ Use absolute imports
import { TaskService } from '@/tasks/task.service.js';           // Source code
import { mockFactory } from '@tests/mocks/service-factory.js';   // Test utilities

// ❌ Don't use relative imports  
import { TaskService } from '../../src/tasks/task.service.js';   // Harder to maintain
import { mockFactory } from '../mocks/service-factory.js';       // Path depends on location
```

**Available import aliases:**
- `@/*` → `src/*` (all source code)
- `@tests/*` → `tests/*` (test utilities, mocks, helpers)

### Testing Patterns

1. **Static Methods**: Test directly without instantiation
2. **Instance Methods**: Create instances with mocked dependencies
3. **Singletons**: Reset singleton instance in beforeEach
4. **Async Methods**: Use async/await in test functions

## Available Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all enabled tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:verbose` | Run with detailed output |
| `npm run test:debug` | Run in debug mode |
| `npm run test:tasks` | Run TaskService tests only |
| `npm run test:core` | Run core service tests only |

## ESM Module Issues

The project uses ESM modules which causes some Jest compatibility issues:

### Current Workaround
- Only enabled tests that work are included in jest.config.js
- Some tests are written but disabled due to module resolution

### Potential Solutions
1. **Use CommonJS for tests only** (recommended)
2. **Switch to Vitest** (better ESM support)
3. **Use babel-jest** for module transformation

## Adding New Tests

1. Create test file in `tests/unit/` directory 
2. Name it `serviceName.test.ts`
3. Follow the existing test patterns
4. **Tests are automatically discovered** - no configuration needed!
5. Use absolute imports like `@/service.js` for source code and `@tests/mocks/service-factory.js` for test utilities
6. If your test has ESM import issues, add it to `testPathIgnorePatterns` in jest.config.js temporarily

## Troubleshooting

### Module Resolution Errors
If you see errors like "Could not locate module", the test has ESM import issues. Try:
1. Check import paths use `.js` extensions
2. Verify the test is included in jest.config.js
3. Consider using the dual-config approach (CommonJS for tests)

### Mock Issues
If mocks aren't working:
1. Ensure mocks are set up before imports
2. Use the mock factories for consistency
3. Reset mocks in beforeEach

### Singleton Issues
For singleton services:
```typescript
beforeEach(() => {
  // @ts-ignore - Reset singleton for testing
  SingletonService.instance = null;
});
```

## Best Practices

1. **Test file naming**: `*.test.ts`
2. **One service per test file**
3. **Use descriptive test names**: "should do X when Y"
4. **Follow AAA pattern**: Arrange, Act, Assert
5. **Mock external dependencies**
6. **Test both success and error cases**
7. **Keep tests focused and isolated**

## Mock Strategy

- Use centralized mock factory (`tests/mocks/service-factory.ts`)
- Mock external modules (fs, path, etc.) at file level
- Mock service dependencies via constructor injection
- Reset mocks between tests

## Coverage Goals

- Focus on core business logic first
- Aim for high coverage on services
- Test error handling paths
- Validate edge cases

---

For any questions about testing, refer to this document first. If you need to update testing approaches, update this file to keep everything in one place.