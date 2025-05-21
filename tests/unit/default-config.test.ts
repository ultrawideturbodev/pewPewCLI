/**
 * Default Config Tests
 * 
 * Tests for default configuration values in ConfigService
 */
import { describe, test, expect } from '@jest/globals';
import { ConfigService } from '@/io/config.service.js';

// No need to mock dependencies for testing static properties

describe('ConfigService Default Config', () => {
  describe('getDefaultConfigDTO', () => {
    test('should include templates property in default config', () => {
      // Get the default config
      const defaultConfig = ConfigService.getDefaultConfigDTO();
      
      // Validate structure
      expect(defaultConfig).toBeDefined();
      expect(defaultConfig.templates).toBeDefined();
      expect(typeof defaultConfig.templates).toBe('object');
      expect(Object.keys(defaultConfig.templates).length).toBe(0); // Empty by default
    });
    
    test('should ensure templates is a separate object from other defaults', () => {
      const defaultConfig = ConfigService.getDefaultConfigDTO();
      
      // Create a modified copy to ensure mutation doesn't affect original defaults
      const configCopy = { ...defaultConfig };
      configCopy.templates = { 
        test: { 
          files: ['file.txt'] 
        } 
      };
      
      // Get a fresh default config
      const freshDefault = ConfigService.getDefaultConfigDTO();
      
      // Verify the fresh default still has empty templates
      expect(Object.keys(freshDefault.templates).length).toBe(0);
      expect(freshDefault).not.toEqual(configCopy);
    });
  });
});