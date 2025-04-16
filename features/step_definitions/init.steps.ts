import { Given, When, Then, Before, After } from '@cucumber/cucumber';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { ICLIWorld } from '../support/world.js'; // Add .js extension
import * as assert from 'assert';
import { fileURLToPath } from 'url'; // Import necessary function

// Calculate __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PEW_EXECUTABLE = path.resolve(__dirname, '../../bin/pew.js'); // Correct path: up two levels
const OVERWRITE_PROMPT = 'Overwrite existing .pew configuration?';

Given('I am in a clean temporary directory', function (this: ICLIWorld) {
  // This step implementation depends heavily on your World setup
  // Assuming this.tempDir is created and cleaned by a Before hook in world.ts or hooks.ts
  assert.ok(this.tempDir, 'Temporary directory should be set in World');
  const files = fs.readdirSync(this.tempDir);
});

Then('the command should succeed', function (this: ICLIWorld) {
  assert.strictEqual(this.lastExitCode, 0, `Expected command to succeed (exit code 0), but got ${this.lastExitCode}. Output:\n${this.lastCommandOutput}`);
});

Given('a .pew directory exists', function (this: ICLIWorld) {
  const pewDirPath = path.join(this.tempDir, '.pew');
  fs.mkdirSync(pewDirPath);
});

When('I run `pew init`', function (this: ICLIWorld) {
  try {
    this.lastCommandOutput = execSync(`node ${PEW_EXECUTABLE} init`, {
      cwd: this.tempDir,
      encoding: 'utf-8',
      stdio: 'pipe',
      input: '\n' // Provide a newline to satisfy subsequent prompts
    });
    this.lastExitCode = 0;
  } catch (error: any) {
    this.lastCommandOutput = error.stdout + '\n' + error.stderr;
    this.lastExitCode = error.status || 1;
    if (!this.lastCommandOutput.includes(OVERWRITE_PROMPT)) {
        // If the error wasn't caused by the expected prompt, rethrow it.
        // This prevents hiding unexpected failures during the init process.
        console.error("Caught error during 'pew init', rethrowing as it didn't contain the expected prompt:", error);
        throw error;
    }
    // If the error includes the overwrite prompt, we suppress the error
    // because the test might only care about the prompt appearing,
    // and the non-zero exit code might be due to the user (the test runner)
    // not interacting with the prompt.
    console.log("Caught error containing overwrite prompt, suppressing error for test assertion.");
  }
});

Then('the user should not be prompted to overwrite configuration', function (this: ICLIWorld) {
  assert.ok(
    !this.lastCommandOutput.includes(OVERWRITE_PROMPT),
    `Expected output not to contain prompt "${OVERWRITE_PROMPT}", but got: \n${this.lastCommandOutput}`
  );
});

Then('the user should be prompted to overwrite configuration', function (this: ICLIWorld) {
  assert.ok(
    this.lastCommandOutput.includes(OVERWRITE_PROMPT),
    `Expected output to contain prompt "${OVERWRITE_PROMPT}", but got: \n${this.lastCommandOutput}`
  );
}); 