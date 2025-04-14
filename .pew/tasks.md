# Project Plan: Pew Pew CLI Update Mechanism

## 1. Project Overview
This project introduces an update mechanism for the `pew-pew-cli` tool. It includes a new `pew update` command to manually check for and install updates from npm. Additionally, it implements an automatic background check for updates after specific commands (`pew init`, `pew paste tasks`) run, notifying the user if a new version is available and it has been more than 24 hours since the last check. The mechanism involves checking the npm registry for the latest version, comparing it with the currently installed version, managing a timestamp for notification frequency in a global configuration file, and executing the update via `npm`.
- [x] Read the project overview:
    - Implement `pew update` command.
    - Implement automatic update checks after `pew init` and `pew paste tasks`.
    - Check npm registry for the latest version.
    - Compare latest version with the current installed version.
    - Store and check `lastUpdateCheckTimestamp` in a new global `~/.pew/core.yaml` file.
    - Notify user if update available and timestamp > 24 hours old.
    - Execute update using `npm install -g pew-pew-cli@latest`.

## 2. Requirements Analysis Summary
A concise summary of the requirements identified for the update mechanism.
- [x] Review the requirements summary:
    - **👤 Actors & 🧩 Components:** `User`, `pew CLI Application` (`CliService`, `UpdateService`, `ConfigService`, `FileSystemService`, `YamlService`, `child_process`, `Console Output`, `Commander`), `package.json` (local), `core.yaml` (global), `npm Registry`, `latest-version` package.
    - **🎬 Activities:** Check for updates, Perform update, Get current version, Get latest version, Get/Set last update check timestamp, Read/Write global core config, Notify user of update, Handle `update` command, Handle automatic update check trigger.
    - **🌊 Activity Flows & Scenarios:** `pew update` (update found/not found/error), Automatic check (notification shown/not shown/check skipped/error).
    - **📝 Properties:** `core.yaml.lastUpdateCheckTimestamp: number`, `UpdateService.currentVersion: string`, `UpdateService.latestVersion: string`.
    - **🛠️ Behaviours:** Check frequency (1 day), Notification timing (after specific commands), Update command feedback (success/failure/no update), Error handling (log warnings for background checks, report errors for manual update).
*(Full detailed analysis follows)*

## 3. Detailed Requirements

- 👤 **Actors & 🧩 Components:**
    - [Actor] User (Executes `pew` commands)
    - [Component] `pew` CLI Application
        - [Component] `CliService` (Orchestrates commands, triggers update checks)
        - [Component] `UpdateService` (New: Encapsulates update logic: version check, timestamp management, notification, update execution)
        - [Component] `ConfigService` (Manages configuration access, extended for `core.yaml`)
        - [Component] `FileSystemService` (Reads files like `package.json`, checks paths)
        - [Component] `YamlService` (Parses/serializes `core.yaml`)
        - [Component] `child_process` (Node.js module: Used to execute `npm` commands)
        - [Component] Console Output (Displays messages, notifications, errors)
        - [Component] Commander (Library for parsing CLI args/options, defining `update` command)
        - [Component] `latest-version` (npm package: Fetches latest version from npm registry)
    - [Component] `package.json` (Local: Source for the currently installed version)
    - [Component] `core.yaml` (New Global File: Stores `lastUpdateCheckTimestamp`)
        - [Property] `lastUpdateCheckTimestamp : number` (Unix timestamp in milliseconds)
    - [Component] npm Registry (External: Source for the latest package version)

- 🎬 **Activities:**
    - [`UpdateService`]
        - [Activity] Get current installed version (Read from own `package.json`).
        - [Activity] Get latest available version (Use `latest-version` package to query npm registry).
        - [Activity] Compare versions (Check if latest > current).
        - [Activity] Check if update notification is needed (Compare timestamp from `core.yaml` with current time > 24h).
        - [Activity] Get last update check timestamp (Read from `core.yaml` via `ConfigService`).
        - [Activity] Set last update check timestamp (Write to `core.yaml` via `ConfigService`).
        - [Activity] Notify user of available update (Log formatted message to console).
        - [Activity] Run update check and notify user if applicable (Combines previous steps, handles errors gracefully for background checks).
        - [Activity] Perform update installation (Execute `npm install -g pew-pew-cli@latest` via `child_process`, provide feedback).
    - [`ConfigService`]
        - [Activity] Read global `core.yaml` file.
        - [Activity] Write global `core.yaml` file.
        - [Activity] Get specific value from global `core.yaml` (e.g., `lastUpdateCheckTimestamp`).
        - [Activity] Set specific value in global `core.yaml`.
    - [`CliService`]
        - [Activity] Handle `pew update` command (Call `UpdateService.performUpdate`).
        - [Activity] Handle `pew init` command (Update: Call `UpdateService.runUpdateCheckAndNotify` after successful init).
        - [Activity] Handle `pew paste tasks` command (Update: Call `UpdateService.runUpdateCheckAndNotify` after successful paste).
    - [Commander (`src/index.ts`)]
        - [Activity] Define `update` command.
    - [User]
        - [Activity] Execute `pew update`.
        - [Activity] Execute `pew init`.
        - [Activity] Execute `pew paste tasks`.
        - [Activity] See update notification.
    - [Documentation]
        - [Activity] Update `README.md` command table and descriptions.
        - [Activity] Create `docs/how-to-update.md`.
        - [Activity] Update `CHANGELOG.md`.

- 🌊 **Activity Flows & Scenarios:**
    - [`pew update` (Happy Path - Update Found)]
        - GIVEN User runs `pew update`
        - WHEN `CliService.handleUpdate` executes
        - THEN `CliService` calls `UpdateService.performUpdate`
        - THEN `UpdateService` calls `getCurrentVersion` -> `currentVersion`
        - THEN `UpdateService` calls `getLatestVersion` -> `latestVersion`
        - THEN `UpdateService` compares versions -> `updateAvailable = true`
        - THEN `UpdateService` logs "Updating pew-pew-cli from vA.B.C to vX.Y.Z..."
        - THEN `UpdateService` executes `npm install -g pew-pew-cli@latest` via `child_process`
        - AND IF execution succeeds
            - THEN `UpdateService` logs "✅ pew-pew-cli updated successfully to vX.Y.Z."
        - AND `UpdateService` returns success status to `CliService`
    - [`pew update` (Happy Path - No Update Found)]
        - GIVEN User runs `pew update`
        - WHEN `CliService.handleUpdate` executes
        - THEN `CliService` calls `UpdateService.performUpdate`
        - THEN `UpdateService` gets `currentVersion` and `latestVersion`
        - THEN `UpdateService` compares versions -> `updateAvailable = false`
        - THEN `UpdateService` logs "ℹ️ pew-pew-cli is already up to date (vA.B.C)."
        - AND `UpdateService` returns success status to `CliService`
    - [`pew update` (Error Path - npm Fails)]
        - GIVEN User runs `pew update` and an update is available
        - WHEN `UpdateService` executes `npm install -g ...`
        - AND IF execution fails (e.g., permissions, network error)
            - THEN `UpdateService` logs "❌ Error updating pew-pew-cli: [npm error message]"
        - AND `UpdateService` returns failure status to `CliService`
    - [Automatic Update Check (Notification Shown)]
        - GIVEN User runs `pew init` (or `pew paste tasks`) successfully
        - AND An update is available (latest > current)
        - AND Last check timestamp is > 24 hours ago (or doesn't exist)
        - WHEN `CliService` calls `UpdateService.runUpdateCheckAndNotify` after the command logic
        - THEN `UpdateService` calls `shouldCheckForUpdate` -> `true`
        - THEN `UpdateService` calls `isUpdateAvailable` -> `true`
        - THEN `UpdateService` calls `notifyUserOfUpdate`
        - THEN Console Output shows "ℹ️ Update available: pew-pew-cli vX.Y.Z is available (current: vA.B.C). Run 'pew update' to install."
        - THEN `UpdateService` calls `setLastUpdateCheckTimestamp` (updates `core.yaml`)
    - [Automatic Update Check (Notification Not Shown - Too Soon)]
        - GIVEN User runs `pew init` successfully
        - AND An update is available
        - AND Last check timestamp is < 24 hours ago
        - WHEN `CliService` calls `UpdateService.runUpdateCheckAndNotify`
        - THEN `UpdateService` calls `shouldCheckForUpdate` -> `false`
        - THEN `UpdateService` does not check versions or notify
        - THEN `UpdateService` does not update timestamp
    - [Automatic Update Check (Notification Not Shown - No Update)]
        - GIVEN User runs `pew init` successfully
        - AND No update is available (latest <= current)
        - AND Last check timestamp is > 24 hours ago
        - WHEN `CliService` calls `UpdateService.runUpdateCheckAndNotify`
        - THEN `UpdateService` calls `shouldCheckForUpdate` -> `true`
        - THEN `UpdateService` calls `isUpdateAvailable` -> `false`
        - THEN `UpdateService` does not notify
        - THEN `UpdateService` calls `setLastUpdateCheckTimestamp`
    - [Automatic Update Check (Error Path - Check Fails)]
        - GIVEN User runs `pew init` successfully
        - AND Last check timestamp is > 24 hours ago
        - WHEN `UpdateService.runUpdateCheckAndNotify` executes
        - AND IF `getLatestVersion` fails (e.g., network error)
            - THEN `UpdateService` logs a warning "⚠️ Could not check for pew-pew-cli updates: [error message]"
            - THEN `UpdateService` does not notify or update timestamp

- 📝 **Properties:**
    - [`core.yaml` (Global)]
        - [lastUpdateCheckTimestamp : number] (Unix timestamp in ms)
    - [`UpdateService`]
        - [currentVersion : string] (Locally stored version, e.g., "0.1.3")
        - [latestVersion : string] (Version fetched from npm, e.g., "0.2.0")
        - [kUpdateCheckIntervalMs : number] (Constant: 24 * 60 * 60 * 1000)
    - [`package.json` (Local)]
        - [version : string]

- 🛠️ **Behaviours:**
    - [`UpdateService.runUpdateCheckAndNotify`]
        - Should only proceed with version check if `shouldCheckForUpdate` returns true.
        - Should log a warning and exit gracefully if fetching the latest version fails.
        - Should only notify the user if an update is available (`isUpdateAvailable` is true).
        - Should always update the timestamp via `setLastUpdateCheckTimestamp` if the check was performed (regardless of whether an update was found or notification shown), unless an error occurred during the check itself.
    - [`UpdateService.performUpdate`]
        - Should clearly indicate when starting the update process.
        - Should report success with the new version number.
        - Should report failure clearly, including the error from the `npm` command.
        - Should report if the tool is already up-to-date.
    - [`CliService`]
        - Should call `UpdateService.runUpdateCheckAndNotify` only *after* the primary logic of `handleInit` or `handlePasteTasks` completes successfully.
        - Should await the completion of the background check, but not block the user significantly or fail the original command if the check itself fails (it should log warnings).
    - [`ConfigService`]
        - Should handle the creation of `core.yaml` if it doesn't exist when writing.
        - Should gracefully handle cases where `core.yaml` is missing or malformed when reading, returning default values (e.g., 0 for timestamp).

## 4. Milestones and Tasks

### Milestone 1: Setup & Core Update Logic
Install dependencies, create the `UpdateService`, implement version fetching/comparison, and add support for the new global `core.yaml` config file.

#### Task 1.1: Add Dependencies and Create `UpdateService` Shell
- [x] **Do:** Add the `latest-version` npm package as a dependency and create the basic structure for the `UpdateService`.
- **Sequence Diagram:** (N/A - Setup Task)
- **Files:**
    - U: `package.json`
    - C: `src/modules/update.service.ts`
- **Classes:**
    - C: `public class UpdateService` (Initial shell with constructor)
- **Variables:** N/A
- **Methods:** N/A
- **Process:**
    1. Run `npm install latest-version` in the terminal.
    2. Create the file `src/modules/update.service.ts`.
    3. Define the basic `UpdateService` class structure:
       ```typescript
       import { FileSystemService } from './file-system.service.js';
       import { ConfigService } from './config.service.js';
       import latestVersion from 'latest-version';
       import * as path from 'path';
       import { fileURLToPath } from 'url';
       import { exec } from 'child_process';
       import { promisify } from 'util';

       const execAsync = promisify(exec);

       // Define __dirname for ES Modules
       const __filename = fileURLToPath(import.meta.url);
       const __dirname = path.dirname(__filename);

       export class UpdateService {
           private fileSystemService: FileSystemService;
           private configService: ConfigService;
           private currentVersion: string | null = null;
           private static readonly kUpdateCheckIntervalMs = 24 * 60 * 60 * 1000; // 1 day

           constructor() {
               this.fileSystemService = new FileSystemService();
               this.configService = ConfigService.getInstance();
               // Potentially make UpdateService a singleton if needed later
           }

           // Methods will be added in subsequent tasks
       }
       ```

#### Task 1.2: Implement Version Fetching in `UpdateService`
- [x] **Do:** Implement methods in `UpdateService` to get the currently installed version from `package.json` and the latest version from the npm registry using `latest-version`.
- **Sequence Diagram:**
    ```mermaid
    sequenceDiagram
        participant US as UpdateService
        participant FSS as FileSystemService
        participant path as NodeJSPathModule
        participant lv as latestVersion

        US->>US: getCurrentVersion()
        alt currentVersion already cached
            US-->>US: cached currentVersion
        else Not cached
            US->>path: resolve(__dirname, '../../package.json') # Adjust path as needed
            path-->>US: packageJsonPath
            US->>FSS: readFile(packageJsonPath)
            FSS-->>US: packageJsonContent (string)
            US->>JSON: parse(packageJsonContent)
            JSON-->>US: packageJsonData (object)
            US->>US: Cache packageJsonData.version
            US-->>US: currentVersion
        end

        US->>US: getLatestVersion()
        US->>lv: latestVersion('pew-pew-cli')
        lv-->>US: latestVersionString
        US-->>US: latestVersionString
    ```
- **Files:**
    - U: `src/modules/update.service.ts`
- **Classes:**
    - U: `UpdateService`
- **Variables:**
    - U: `UpdateService.private currentVersion: string | null = null;` (Add caching)
- **Methods:**
    - C: `public async getCurrentVersion(): Promise<string>`
    - C: `public async getLatestVersion(): Promise<string>`
- **Process:**
    1. Open `src/modules/update.service.ts`.
    2. Implement `getCurrentVersion`:
        a. Check if `this.currentVersion` is already set; if so, return it.
        b. Construct the path to the `package.json` file relative to the current module's location (e.g., `path.resolve(__dirname, '../../package.json')` - adjust based on compiled output structure).
        c. Use `this.fileSystemService.readFile` to read the file content.
        d. Parse the JSON content.
        e. Extract the `version` field.
        f. Store the version in `this.currentVersion` and return it.
        g. Include error handling (e.g., file not found, parse error). Return a default like '0.0.0' or throw.
    3. Implement `getLatestVersion`:
        a. Call `await latestVersion('pew-pew-cli');`.
        b. Return the result.
        c. Include error handling (e.g., network error). Throw or return null/empty string.

#### Task 1.3: Implement Version Comparison in `UpdateService`
- [x] **Do:** Implement a method in `UpdateService` to compare the current and latest versions to determine if an update is available. Use a simple string comparison or a more robust semver comparison library/logic if needed (simple comparison is likely sufficient if versions are standard semver).
- **Sequence Diagram:**
    ```mermaid
    sequenceDiagram
        participant US as UpdateService
        US->>US: isUpdateAvailable()
        US->>US: getCurrentVersion()
        US-->>US: currentVersion
        US->>US: getLatestVersion()
        US-->>US: latestVersion
        alt currentVersion && latestVersion && latestVersion > currentVersion
           US-->>US: true
        else Error or No Update
           US-->>US: false
        end
    ```
- **Files:**
    - U: `src/modules/update.service.ts`
- **Classes:**
    - U: `UpdateService`
- **Methods:**
    - C: `public async isUpdateAvailable(): Promise<boolean>`
- **Process:**
    1. Open `src/modules/update.service.ts`.
    2. Implement `isUpdateAvailable`:
        a. Call `await this.getCurrentVersion()` and `await this.getLatestVersion()`.
        b. Handle potential errors from the version fetching methods (e.g., if they return null or throw). Return `false` in case of errors.
        c. Compare the versions. A simple string comparison (`latest > current`) works for standard semver strings. Consider adding a dedicated semver comparison function/library if more complex scenarios are anticipated.
        d. Return `true` if `latestVersion` is greater than `currentVersion`, `false` otherwise.

#### Task 1.4: Add Global `core.yaml` Handling to `ConfigService`
- [x] **Do:** Modify `ConfigService` to support reading from and writing to a new global configuration file `~/.pew/core.yaml`. Add methods to get and set specific keys within this file, ensuring the directory exists.
- **Sequence Diagram:** (Illustrates setting a value)
    ```mermaid
    sequenceDiagram
        participant Caller as UpdateService
        participant CS as ConfigService
        participant FSS as FileSystemService
        participant YS as YamlService
        participant path as NodeJSPathModule

        Caller->>CS: setGlobalCoreValue('lastUpdateCheckTimestamp', 1678886400000)
        CS->>CS: initialize() # Ensure global paths are set
        CS->>CS: globalCoreFile = path.join(globalConfigDir, 'core.yaml')
        CS->>FSS: pathExists(globalCoreFile)
        FSS-->>CS: exists (e.g., false)
        alt File exists
            CS->>YS: readYamlFile(globalCoreFile)
            YS-->>CS: coreData (object)
        else File does not exist
            CS->>CS: coreData = {}
        end
        CS->>CS: coreData['lastUpdateCheckTimestamp'] = 1678886400000 # Update data
        CS->>FSS: ensureDirectoryExists(path.dirname(globalCoreFile)) # Ensure ~/.pew exists
        FSS-->>CS: void
        CS->>YS: writeYamlFile(globalCoreFile, coreData)
        YS-->>CS: void
        CS-->>Caller: void
    ```
- **Files:**
    - U: `src/modules/config.service.ts`
- **Classes:**
    - U: `ConfigService`
- **Variables:**
    - C: `ConfigService.private globalCoreFile: string;`
    - C: `ConfigService.private globalCoreData: Record<string, any> = {};` (Optional cache)
- **Methods:**
    - C: `private async _loadCoreConfig(): Promise<void>` (Helper to load/cache `core.yaml`)
    - C: `public async getGlobalCoreValue<T>(key: string, defaultValue: T): Promise<T>`
    - C: `public async setGlobalCoreValue(key: string, value: any): Promise<void>`
    - U: `initialize()` (Update to set `globalCoreFile` path and call `_loadCoreConfig`)
- **Process:**
    1. Open `src/modules/config.service.ts`.
    2. Add the `globalCoreFile` private property.
    3. In the `constructor` or `initialize`, set `this.globalCoreFile = this.fileSystemService.joinPath(this.globalConfigDir, 'core.yaml');`.
    4. Implement `_loadCoreConfig`: Reads `globalCoreFile` using `YamlService` if it exists, storing the result (e.g., in `globalCoreData`). Handle file not found/parse errors gracefully (default to empty object `{}`). Call this method within `initialize` after paths are set.
    5. Implement `getGlobalCoreValue`: Ensures config is loaded (`await this.initialize()`), retrieves the value for `key` from the loaded core data (e.g., `this.globalCoreData[key]`), returning `defaultValue` if the key is not found or data is invalid.
    6. Implement `setGlobalCoreValue`: Ensures config is loaded, reads the current `core.yaml` content (or starts with `{}` if non-existent), updates the specific `key` with the new `value`, ensures the directory (`this.globalConfigDir`) exists using `FileSystemService.ensureDirectoryExists`, and writes the updated data back to `globalCoreFile` using `YamlService.writeYamlFile`. Update the cache (`this.globalCoreData`) if using one.

#### Task 1.5: Implement Timestamp Check in `UpdateService`
- [x] **Do:** Implement the `shouldCheckForUpdate` method in `UpdateService` using the new `ConfigService` methods to read the `lastUpdateCheckTimestamp` from `core.yaml` and compare it against the configured interval (1 day).
- **Sequence Diagram:**
    ```mermaid
    sequenceDiagram
        participant US as UpdateService
        participant CS as ConfigService
        participant Date as GlobalDate

        US->>US: shouldCheckForUpdate()
        US->>CS: getGlobalCoreValue('lastUpdateCheckTimestamp', 0)
        CS-->>US: lastCheckTimestamp (number)
        US->>Date: now()
        Date-->>US: currentTimestamp (number)
        alt lastCheckTimestamp === 0 OR (currentTimestamp - lastCheckTimestamp) > kUpdateCheckIntervalMs
            US-->>US: true
        else Check interval not elapsed
            US-->>US: false
        end
    ```
- **Files:**
    - U: `src/modules/update.service.ts`
- **Classes:**
    - U: `UpdateService`
- **Variables:**
    - R: `UpdateService.kUpdateCheckIntervalMs`
- **Methods:**
    - C: `private async getLastUpdateCheckTimestamp(): Promise<number>` (Helper using `ConfigService`)
    - C: `public async shouldCheckForUpdate(): Promise<boolean>`
- **Process:**
    1. Open `src/modules/update.service.ts`.
    2. Implement `getLastUpdateCheckTimestamp`: Calls `this.configService.getGlobalCoreValue<number>('lastUpdateCheckTimestamp', 0)` and returns the result.
    3. Implement `shouldCheckForUpdate`:
        a. Call `await this.getLastUpdateCheckTimestamp()`.
        b. Get the current time: `Date.now()`.
        c. Compare: Return `true` if `lastCheckTimestamp` is 0 (never checked) or if `currentTime - lastCheckTimestamp > UpdateService.kUpdateCheckIntervalMs`. Otherwise, return `false`.
        d. Include basic error handling if `getLastUpdateCheckTimestamp` throws (though `ConfigService` should handle gracefully).

### Milestone 2: Update Execution & Notification
Implement the actual update execution, user notification logic, and the combined background check method in `UpdateService`.

#### Task 2.1: Implement Update Execution in `UpdateService`
- [x] **Do:** Implement the `performUpdate` method in `UpdateService` to execute `npm install -g pew-pew-cli@latest` using `child_process.exec` (promisified). Provide console feedback during the process and handle success/error outcomes.
- **Sequence Diagram:**
    ```mermaid
    sequenceDiagram
        participant US as UpdateService
        participant console as Console
        participant cp as NodeJSChildProcess

        US->>US: performUpdate()
        US->>console: log("Checking for updates...")
        US->>US: isUpdateAvailable()
        US-->>US: updateAvailable (boolean)

        alt updateAvailable is true
            US->>US: getCurrentVersion()
            US-->>US: currentVersion
            US->>US: getLatestVersion()
            US-->>US: latestVersion
            US->>console: log(`Updating pew-pew-cli from v${currentVersion} to v${latestVersion}...`)
            US->>cp: execAsync('npm install -g pew-pew-cli@latest')
            alt npm install succeeds
                cp-->>US: { stdout, stderr }
                US->>console: log(`✅ pew-pew-cli updated successfully to v${latestVersion}.`)
                US-->>US: { success: true }
            else npm install fails
                cp-->>US: Error (e.g., permission denied)
                US->>console: error(`❌ Error updating pew-pew-cli: ${error.message}`)
                US-->>US: { success: false, error: error }
            end
        else updateAvailable is false
            US->>US: getCurrentVersion()
            US-->>US: currentVersion
            US->>console: log(`ℹ️ pew-pew-cli is already up to date (v${currentVersion}).`)
            US-->>US: { success: true, noUpdateNeeded: true }
        end
        else Error checking version
             US->>console: error(`❌ Could not check for updates: ${error.message}`)
             US-->>US: { success: false, error: error }
        end

    ```
- **Files:**
    - U: `src/modules/update.service.ts`
- **Classes:**
    - U: `UpdateService`
- **Methods:**
    - C: `public async performUpdate(): Promise<{success: boolean, error?: Error, noUpdateNeeded?: boolean}>`
    - R: `isUpdateAvailable()`
    - R: `getCurrentVersion()`
    - R: `getLatestVersion()`
- **Process:**
    1. Open `src/modules/update.service.ts`.
    2. Implement `performUpdate`:
        a. Log "Checking for updates...".
        b. Call `await this.isUpdateAvailable()`. Handle potential errors during the check (log error, return `{ success: false, error }`).
        c. If `false` (no update needed): Log "ℹ️ pew-pew-cli is already up to date (v{currentVersion})." and return `{ success: true, noUpdateNeeded: true }`.
        d. If `true` (update available):
            i. Get current and latest versions again (or reuse if cached).
            ii. Log `Updating pew-pew-cli from v${currentVersion} to v${latestVersion}...`.
            iii. Define the command: `const command = 'npm install -g pew-pew-cli@latest';`.
            iv. Execute the command using `await execAsync(command);`.
            v. Use a `try...catch` block to handle execution errors.
            vi. On success: Log `✅ pew-pew-cli updated successfully to v${latestVersion}.` and return `{ success: true }`.
            vii. On failure (catch block): Log `❌ Error updating pew-pew-cli: ${error.message}` and return `{ success: false, error }`.

#### Task 2.2: Implement Notification Logic in `UpdateService`
- [x] **Do:** Implement the `notifyUserOfUpdate` method and the timestamp update method (`setLastUpdateCheckTimestamp`) in `UpdateService`.
- **Sequence Diagram:** (Illustrates notification and timestamp update)
    ```mermaid
    sequenceDiagram
        participant US as UpdateService
        participant console as Console
        participant CS as ConfigService
        participant Date as GlobalDate

        US->>US: notifyUserOfUpdate(currentVersion, latestVersion)
        US->>console: log(`ℹ️ Update available: pew-pew-cli v${latestVersion} is available (current: v${currentVersion}). Run 'pew update' to install.`)
        US-->>US: void

        US->>US: setLastUpdateCheckTimestamp()
        US->>Date: now()
        Date-->>US: currentTimestamp
        US->>CS: setGlobalCoreValue('lastUpdateCheckTimestamp', currentTimestamp)
        CS-->>US: void
        US-->>US: void
    ```
- **Files:**
    - U: `src/modules/update.service.ts`
- **Classes:**
    - U: `UpdateService`
- **Methods:**
    - C: `private notifyUserOfUpdate(currentVersion: string, latestVersion: string): void`
    - C: `private async setLastUpdateCheckTimestamp(): Promise<void>`
- **Process:**
    1. Open `src/modules/update.service.ts`.
    2. Implement `notifyUserOfUpdate`: Takes `currentVersion` and `latestVersion` as arguments. Logs the formatted message to the console (e.g., `console.log(\`ℹ️ Update available: pew-pew-cli v${latestVersion} is available (current: v${currentVersion}). Run 'pew update' to install.\`);`).
    3. Implement `setLastUpdateCheckTimestamp`: Gets the current timestamp using `Date.now()`. Calls `await this.configService.setGlobalCoreValue('lastUpdateCheckTimestamp', timestamp);`. Include error handling (log warning if setting fails).

#### Task 2.3: Implement Combined Background Check Method in `UpdateService`
- [x] **Do:** Implement the public `runUpdateCheckAndNotify` method in `UpdateService` that orchestrates the background check: checks if enough time has passed, checks if an update is available, notifies the user if both are true, and updates the timestamp. Handle errors gracefully (log warnings, don't throw).
- **Sequence Diagram:**
    ```mermaid
    sequenceDiagram
        participant US as UpdateService
        participant console as Console

        US->>US: runUpdateCheckAndNotify()
        US->>US: shouldCheckForUpdate()
        US-->>US: shouldCheck (boolean)

        alt shouldCheck is true
            US->>US: isUpdateAvailable()
            alt Update check succeeds
                US-->>US: updateAvailable (boolean)
                alt updateAvailable is true
                    US->>US: getCurrentVersion()
                    US-->>US: currentVersion
                    US->>US: getLatestVersion()
                    US-->>US: latestVersion
                    US->>US: notifyUserOfUpdate(currentVersion, latestVersion)
                end
                US->>US: setLastUpdateCheckTimestamp() # Update timestamp if check ran
            else Update check fails (e.g., network error)
                 US-->>US: Error
                 US->>console: warn("⚠️ Could not check for pew-pew-cli updates: ...")
                 Note over US: Do not update timestamp on error
            end
        else shouldCheck is false
             Note over US: Check interval not elapsed, do nothing.
        end
        US-->>US: void
    ```
- **Files:**
    - U: `src/modules/update.service.ts`
- **Classes:**
    - U: `UpdateService`
- **Methods:**
    - C: `public async runUpdateCheckAndNotify(): Promise<void>`
    - R: `shouldCheckForUpdate()`
    - R: `isUpdateAvailable()`
    - R: `notifyUserOfUpdate()`
    - R: `setLastUpdateCheckTimestamp()`
    - R: `getCurrentVersion()`
    - R: `getLatestVersion()`
- **Process:**
    1. Open `src/modules/update.service.ts`.
    2. Implement `runUpdateCheckAndNotify`:
        a. Use a `try...catch` block to wrap the main logic.
        b. Call `await this.shouldCheckForUpdate()`. If `false`, return early.
        c. If `true`, proceed:
            i. Call `await this.isUpdateAvailable()`.
            ii. If `true`, get current/latest versions and call `this.notifyUserOfUpdate(currentVersion, latestVersion);`.
            iii. **Crucially:** Call `await this.setLastUpdateCheckTimestamp();` *after* successfully checking versions (regardless of whether an update was found), but *before* the end of the `try` block.
        d. In the `catch` block: Log a warning to the console: `console.warn(\`⚠️ Could not check for pew-pew-cli updates: ${error.message}\`);`. Do *not* re-throw the error. Do *not* update the timestamp if an error occurred during the check.

### Milestone 3: CLI Integration
Integrate the `UpdateService` into the `CliService` and define the new `update` command.

#### Task 3.1: Add `update` Command to `index.ts`
- [x] **Do:** Define the new `pew update` command in `src/index.ts` using `commander`.
- **Sequence Diagram:** (N/A - Configuration update)
- **Files:**
    - U: `src/index.ts`
- **Classes:** N/A
- **Methods:** N/A
- **Variables:** N/A
- **Process:**
    1. Open `src/index.ts`.
    2. Add a new command definition:
       ```typescript
       program
         .command('update')
         .description('Check for updates and install the latest version of pew-pew-cli')
         .action(async () => {
           await cliService.handleUpdate(); // Assumes handleUpdate exists in CliService
         });
       ```
    3. Ensure `cliService` instance is available in this scope.

#### Task 3.2: Implement `handleUpdate` in `CliService`
- [x] **Do:** Add the `handleUpdate` method to `CliService` which instantiates (if not singleton) and calls the `performUpdate` method of `UpdateService`.
- **Sequence Diagram:**
    ```mermaid
    sequenceDiagram
        participant Commander as index.ts
        participant CliS as CliService
        participant US as UpdateService

        Commander->>CliS: handleUpdate()
        CliS->>US: new UpdateService() # Or getInstance() if singleton
        US-->>CliS: updateServiceInstance
        CliS->>US: performUpdate()
        US-->>CliS: result ({success: boolean, ...})
        alt result.success is false and result.error
             CliS->>process: exit(1) # Exit with error code
        else Success or No Update Needed
             CliS->>process: exit(0) # Exit cleanly
        end
    ```
- **Files:**
    - U: `src/modules/cli.service.ts`
- **Classes:**
    - U: `CliService`
- **Methods:**
    - C: `public async handleUpdate(): Promise<void>`
    - R: `UpdateService.performUpdate()` (via instance)
- **Process:**
    1. Open `src/modules/cli.service.ts`.
    2. Add a private field for `UpdateService` if making it a dependency: `private updateService: UpdateService;` and initialize it in the constructor: `this.updateService = new UpdateService();`. (Alternatively, instantiate it directly within `handleUpdate`).
    3. Implement the new public async method `handleUpdate`:
        a. Call `const result = await this.updateService.performUpdate();`.
        b. Check `result.success`. If `false` and `result.error` exists, potentially exit the process with an error code: `process.exit(1);`. Otherwise, exit cleanly: `process.exit(0);`.

#### Task 3.3: Integrate Automatic Checks into `CliService` Handlers
- [x] **Do:** Modify `CliService.handleInit` and `CliService.handlePasteTasks` to call `UpdateService.runUpdateCheckAndNotify` after their primary logic completes successfully.
- **Sequence Diagram:** (Illustrates `handleInit` integration)
    ```mermaid
    sequenceDiagram
        participant CliS as CliService
        participant US as UpdateService

        Note over CliS: Inside handleInit, after main logic succeeds...
        CliS->>console: log("pewPewCLI initialized successfully.") # Example success log
        CliS->>US: runUpdateCheckAndNotify() # Call the background check
        US-->>CliS: void # Background check runs, logs warnings on error
        Note over CliS: handleInit completes
    ```
- **Files:**
    - U: `src/modules/cli.service.ts`
- **Classes:**
    - U: `CliService`
- **Methods:**
    - U: `async handleInit(flags: { force: boolean }): Promise<void>`
    - U: `async handlePasteTasks(mode: 'overwrite' | 'append' | 'insert' | null, options: { path?: string }): Promise<void>`
    - R: `UpdateService.runUpdateCheckAndNotify()` (via instance)
- **Process:**
    1. Open `src/modules/cli.service.ts`.
    2. Ensure `UpdateService` instance is available (e.g., `this.updateService` initialized in constructor).
    3. In `handleInit`: Locate the end of the successful execution path (e.g., after the final `console.log`). Add `await this.updateService.runUpdateCheckAndNotify();`. Wrap this call in a `try...catch` that only logs the error (`console.warn`) to prevent the background check failure from crashing the main command.
    4. In `handlePasteTasks`: Locate the end of the successful execution path (e.g., after the final `console.log`). Add `await this.updateService.runUpdateCheckAndNotify();`. Wrap similarly in a non-throwing `try...catch`.

### Milestone 4: Documentation
Update project documentation to reflect the new update command and automatic checks.

#### Task 4.1: Update README.md
- [x] **Do:** Modify `README.md` to add the `pew update` command to the command table and briefly explain the automatic update notification mechanism.
- **Sequence Diagram:** (N/A - Documentation)
- **Files:**
    - U: `README.md`
- **Classes:** N/A
- **Methods:** N/A
- **Variables:** N/A
- **Process:**
    1. Open `README.md`.
    2. Locate the "Commands" table. Add a new row for `pew update`:
        | Command       | Description                                                      | Arguments | Options |
        | :------------ | :--------------------------------------------------------------- | :-------- | :------ |
        | `pew update`  | Check for updates and install the latest version of pew-pew-cli. | _None_    | _None_  |
    3. Add a sentence or short paragraph in the main description or a new "Updates" section explaining that the tool automatically checks for updates periodically after certain commands and notifies the user, mentioning the `pew update` command for manual installation.

#### Task 4.2: Create `how-to-update.md`
- [x] **Do:** Create a new documentation file explaining how the update mechanism works, how to use `pew update`, and how the automatic checks behave.
- **Sequence Diagram:** (N/A - Documentation)
- **Files:**
    - C: `docs/how-to-update.md`
- **Classes:** N/A
- **Methods:** N/A
- **Variables:** N/A
- **Process:**
    1. Create the file `docs/how-to-update.md`.
    2. Write content explaining:
        *   The purpose of keeping the CLI updated.
        *   How to manually check and install updates using `pew update`. Include example output for update found, no update needed, and error scenarios.
        *   How the automatic background check works (triggered after `init`/`paste`, frequency of 1 day, notification message).
        *   Mention where the timestamp is stored (`~/.pew/core.yaml`) for informational purposes.

#### Task 4.3: Update CHANGELOG.md
- [x] **Do:** Add entries to `CHANGELOG.md` under a new version (e.g., v0.3.0) detailing the added update features.
- **Sequence Diagram:** (N/A - Documentation)
- **Files:**
    - U: `CHANGELOG.md`
- **Classes:** N/A
- **Methods:** N/A
- **Variables:** N/A
- **Process:**
    1. Open `CHANGELOG.md`.
    2. Add a new version heading (e.g., `## v0.3.0`).
    3. Add today's date.
    4. Under `#### ✨ Features`, add items like:
        *   Added `pew update` command to check for and install the latest version from npm.
        *   Implemented automatic background update checks (daily) after `pew init` and `pew paste tasks` commands.
        *   Added user notification for available updates.
    5. Under `#### 🛠️ Improvements`, add items like:
        *   Created `UpdateService` to handle update logic.
        *   Added support for global `core.yaml` configuration file in `ConfigService`.