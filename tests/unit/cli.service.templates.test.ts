/**
 * CliService Templates Unit Tests
 * 
 * Tests specifically for templates functionality in CliService (pew init template example)
 */
import { describe, test, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { CliService } from '@/core/cli.service.js';
import { createMockFileSystemService, createMockLoggerService, createMockConfigService, createMockUserInputService, mockFixtures } from '@tests/mocks/service-factory.js';
import { ConfigService } from '@/io/config.service.js';
import { YamlService } from '@/io/yaml.service.js';
import { FileSystemService } from '@/io/file-system.service.js';
import { UserInputService } from '@/io/user-input.service.js';
import { ClipboardService } from '@/clipboard/clipboard.service.js';
import { TaskService } from '@/tasks/task.service.js';
import { UpdateService } from '@/updates/update.service.js';
import * as path from 'path';

// Mock all dependencies
jest.mock('@/io/file-system.service.js');
jest.mock('@/io/config.service.js');
jest.mock('@/io/user-input.service.js');
jest.mock('@/clipboard/clipboard.service.js');
jest.mock('@/tasks/task.service.js');
jest.mock('@/updates/update.service.js');
jest.mock('@/core/logger.service.js');
jest.mock('@/io/yaml.service.js');
jest.mock('path');

describe('CliService Templates', () => {
  let cliService: CliService;
  let mockFileSystemService: any;
  let mockConfigService: any;
  let mockLoggerService: any;
  let mockYamlService: any;
  let mockUserInputService: any;
  
  beforeEach(() => {
    // Clear the CliService singleton instance
    // @ts-ignore - Accessing private static field for testing
    CliService.instance = null;
    
    // Setup specific mock behaviors
    mockFileSystemService = createMockFileSystemService();
    mockConfigService = createMockConfigService();
    mockLoggerService = createMockLoggerService();
    mockUserInputService = createMockUserInputService();
    
    // Mock FileSystemService constructor
    (FileSystemService as jest.MockedClass<typeof FileSystemService>).mockImplementation(() => mockFileSystemService);
    
    // Mock YamlService methods and constructor
    mockYamlService = {
      readYamlFile: jest.fn().mockResolvedValue({}),
      writeYamlFile: jest.fn().mockResolvedValue(undefined),
    };
    (YamlService as jest.MockedClass<typeof YamlService>).mockImplementation(() => mockYamlService);
    
    // Mock path.join
    (path.join as jest.Mock).mockImplementation((...paths) => paths.join('/'));
    (path.dirname as jest.Mock).mockImplementation((p) => p.split('/').slice(0, -1).join('/') || '/');
    
    // Mock process.cwd
    jest.spyOn(process, 'cwd').mockReturnValue('/mock/current/dir');
    
    // Get an instance of CliService with mocked dependencies
    cliService = CliService.getInstance();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('handleInit', () => {
    test('should append templates example to pew.yaml when initializing', async () => {
      // Mock the appendTemplatesExampleToYaml method
      const mockAppendTemplatesExample = jest.spyOn(cliService as any, 'appendTemplatesExampleToYaml')
        .mockResolvedValueOnce(undefined);
      
      // Mock FileSystemService.pathExists for pew.yaml check
      mockFileSystemService.pathExists.mockResolvedValueOnce(false); // First call for pew.yaml existence check
      mockFileSystemService.pathExists.mockResolvedValueOnce(false); // Second call for task file existence check
      
      // Run the handleInit method
      await cliService.handleInit({ force: true });
      
      // Verify that appendTemplatesExampleToYaml was called with the correct path
      expect(mockAppendTemplatesExample).toHaveBeenCalledWith('/mock/current/dir/pew.yaml');
      
      // Verify the order of operations
      expect(mockFileSystemService.ensureDirectoryExists).toHaveBeenCalled();
      expect(mockYamlService.writeYamlFile).toHaveBeenCalled();
      expect(mockAppendTemplatesExample).toHaveBeenCalled();
      expect(mockConfigService.setTasksPaths).toHaveBeenCalled();
    });
  });
  
  describe('appendTemplatesExampleToYaml', () => {
    test('should read existing content and append templates example', async () => {
      // Mock existing content
      const existingContent = 'tasks:\n  all:\n    - tasks.md\n';
      mockFileSystemService.readFile.mockResolvedValueOnce(existingContent);
      
      // Call the private method directly
      await (cliService as any).appendTemplatesExampleToYaml('/mock/pew.yaml');
      
      // Verify file read
      expect(mockFileSystemService.readFile).toHaveBeenCalledWith('/mock/pew.yaml');
      
      // Verify file write
      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        '/mock/pew.yaml',
        expect.stringContaining(existingContent) // Should include original content
      );
      
      // Verify templates example content was added
      const writeCall = mockFileSystemService.writeFile.mock.calls[0];
      const newContent = writeCall[1]; // Second argument to writeFile
      
      // Check for specific template example elements
      expect(newContent).toContain('# Templates for code generation');
      expect(newContent).toContain('# templates:');
      expect(newContent).toContain('# Example \'project\' template');
      expect(newContent).toContain('# variables:');
      expect(newContent).toContain('# replacements:');
      expect(newContent).toContain('# root:');
      expect(newContent).toContain('# files:');
      
      // Ensure example is commented out
      const templateLines = newContent.split('\n').filter(line => line.includes('templates:'));
      expect(templateLines[0].trim().startsWith('#')).toBe(true);
    });
    
    test('should handle errors when appending templates example', async () => {
      // Mock file read error
      mockFileSystemService.readFile.mockRejectedValueOnce(new Error('Read error'));
      
      // Call the private method
      await (cliService as any).appendTemplatesExampleToYaml('/mock/pew.yaml');
      
      // Verify error was logged
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to append templates example'),
        expect.anything()
      );
      
      // Write should not have been called due to error
      expect(mockFileSystemService.writeFile).not.toHaveBeenCalled();
    });
  });
});