/**
 * TemplateConfigDto Unit Tests
 * 
 * Tests specifically for the TemplateConfigDto interface
 */
import { describe, test, expect } from '@jest/globals';
import { TemplateConfigDto } from '../config.dto.js';

describe('TemplateConfigDto', () => {
  test('should define the required interface properties', () => {
    // Create a valid template config object
    const templateConfig: TemplateConfigDto = {
      files: ['file1.txt', 'file2.txt'],
      variables: { 'Var1': 'Value1' },
      replacements: { 'find': 'replace' },
      root: 'output/dir'
    };
    
    // Verify that all properties exist and are of the correct type
    expect(Array.isArray(templateConfig.files)).toBe(true);
    expect(templateConfig.files.length).toBe(2);
    expect(typeof templateConfig.variables).toBe('object');
    expect(typeof templateConfig.replacements).toBe('object');
    expect(typeof templateConfig.root).toBe('string');
    
    // Verify that files is the only required property
    const minimalConfig: TemplateConfigDto = {
      files: ['file.txt']
    };
    
    expect(Array.isArray(minimalConfig.files)).toBe(true);
    expect(minimalConfig.variables).toBeUndefined();
    expect(minimalConfig.replacements).toBeUndefined();
    expect(minimalConfig.root).toBeUndefined();
  });
});