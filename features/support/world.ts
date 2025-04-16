import { World, setWorldConstructor, IWorldOptions } from '@cucumber/cucumber';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Define the interface for your custom World context
export interface ICLIWorld extends World {
  tempDir: string;
  lastCommandOutput: string;
  lastExitCode: number | null;
}

// Define the World class implementing the interface
class CLIWorld extends World implements Omit<ICLIWorld, 'attach' | 'log' | 'parameters'> {
  public tempDir: string = '';
  public lastCommandOutput: string = '';
  public lastExitCode: number | null = null;

  constructor(options: IWorldOptions) {
    super(options);
    // Create a unique temporary directory for each scenario
    this.tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pew-cucumber-'));
  }
}

// Set the custom World constructor
setWorldConstructor(CLIWorld);

// Note: You'll also need Before/After hooks (e.g., in a separate features/support/hooks.ts file)
// to clean up the temp directory after each scenario.
// Example cleanup hook (place in hooks.ts):
/*
import { Before, After, ITestCaseHookParameter } from '@cucumber/cucumber';
import * as fs from 'fs';
import { ICLIWorld } from './world';

Before(function (this: ICLIWorld) {
  // Reset state before each scenario if needed
  this.lastCommandOutput = '';
  this.lastExitCode = null;
});

After(function (this: ICLIWorld, scenario: ITestCaseHookParameter) {
  // Cleanup the temporary directory
  if (this.tempDir) {
    fs.rmSync(this.tempDir, { recursive: true, force: true });
    console.log(`Cleaned up temp directory: ${this.tempDir} after scenario: ${scenario.pickle.name}`);
  }
});
*/ 