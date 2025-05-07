/**
 * FileSystemService Mock
 */
export const FileSystemService = jest.fn().mockImplementation(() => ({
  ensureDirectoryExists: jest.fn().mockResolvedValue(undefined),
  pathExists: jest.fn().mockResolvedValue(true),
  readFile: jest.fn().mockResolvedValue(''),
  writeFile: jest.fn().mockResolvedValue(undefined)
})); 