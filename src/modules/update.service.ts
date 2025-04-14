import { FileSystemService } from './file-system.service.js';
import { ConfigService } from './config.service.js';
import latestVersion from 'latest-version';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import { LoggerService } from './logger.service.js';

const execAsync = promisify(exec);

// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const kPackageName = 'pew-pew-cli';
const kNpmInstallCommand = `npm install -g ${kPackageName}@latest`;

/**
 * @class UpdateService
 * @description Handles checking for, notifying about, and performing updates for the pew-pew-cli package.
 * Interacts with npm to fetch version information and execute installation commands.
 */
export class UpdateService {
    private fileSystemService: FileSystemService;
    private configService: ConfigService;
    private currentVersion: string | null = null;
    private logger: LoggerService;
    private static readonly kUpdateCheckIntervalMs = 24 * 60 * 60 * 1000; // 1 day

    /**
     * Constructor for UpdateService.
     * @param {FileSystemService} fileSystemService - Instance of FileSystemService.
     * @param {ConfigService} configService - Instance of ConfigService.
     */
    constructor(fileSystemService: FileSystemService, configService: ConfigService) {
        this.fileSystemService = fileSystemService;
        this.configService = configService;
        this.logger = LoggerService.getInstance();
    }

    /**
     * Gets the currently installed version of the CLI package from package.json.
     * Caches the result after the first read.
     * @returns {Promise<string>} A promise that resolves with the current package version.
     * @throws {Error} If package.json cannot be read or the version field is missing.
     */
    public async getCurrentVersion(): Promise<string> {
        if (this.currentVersion) {
            return this.currentVersion;
        }

        try {
            const packageJsonPath = path.resolve(__dirname, '../../package.json');
            const packageJsonContent = await this.fileSystemService.readFile(packageJsonPath);
            const packageJsonData = JSON.parse(packageJsonContent);
            this.currentVersion = packageJsonData.version;
            if (!this.currentVersion) {
                throw new Error('Version field missing in package.json');
            }
            return this.currentVersion;
        } catch (error: any) {
            this.logger.error('Error reading current version:', error.message);
            throw new Error(`Failed to get current version: ${error.message}`);
        }
    }

    /**
     * Gets the latest available version of the CLI package from the npm registry.
     * @returns {Promise<string>} A promise that resolves with the latest package version.
     * @throws {Error} If fetching the latest version from npm fails.
     */
    public async getLatestVersion(): Promise<string> {
        try {
            const latest = await latestVersion(kPackageName);
            return latest;
        } catch (error: any) {
            this.logger.error('Error fetching latest version:', error.message);
            throw new Error(`Failed to get latest version from npm: ${error.message}`);
        }
    }

    /**
     * Checks if a newer version of the package is available on npm compared to the current version.
     * @returns {Promise<boolean>} A promise that resolves with true if an update is available, false otherwise.
     */
    public async isUpdateAvailable(): Promise<boolean> {
        try {
            const currentVersion = await this.getCurrentVersion();
            const latestVersion = await this.getLatestVersion();

            return latestVersion > currentVersion;
        } catch (error: any) {
            this.logger.error('Error checking if update is available:', error.message);
            return false;
        }
    }

    private async getLastUpdateCheckTimestamp(): Promise<number> {
        try {
            return await this.configService.getGlobalCoreValue<number>('lastUpdateCheckTimestamp', 0);
        } catch (error: any) {
            this.logger.warn(`Warning: Could not read last update check timestamp. Assuming check is needed. Error: ${error.message}`);
            return 0;
        }
    }

    /**
     * Determines if an update check should be performed based on the configured interval.
     * Reads the timestamp of the last check from global config.
     * @returns {Promise<boolean>} A promise that resolves with true if a check is due, false otherwise.
     */
    public async shouldCheckForUpdate(): Promise<boolean> {
        const lastCheckTimestamp = await this.getLastUpdateCheckTimestamp();
        const currentTimestamp = Date.now();

        if (lastCheckTimestamp === 0) {
            return true;
        }

        return (currentTimestamp - lastCheckTimestamp) > UpdateService.kUpdateCheckIntervalMs;
    }

    /**
     * Performs the update process: checks for updates, and if available, attempts to install the latest version using npm.
     * Logs progress and results to the console.
     * @returns {Promise<{success: boolean, error?: Error, noUpdateNeeded?: boolean}>} A promise that resolves with an object indicating the outcome:
     *  - `success`: true if the update completed successfully or no update was needed.
     *  - `error`: An Error object if the update check or installation failed.
     *  - `noUpdateNeeded`: true if the package was already up to date.
     */
    public async performUpdate(): Promise<{success: boolean, error?: Error, noUpdateNeeded?: boolean}> {
        this.logger.log("Checking for updates...");
        let isAvailable = false;
        let currentVersion = 'unknown';
        let latestVersion = 'unknown';

        try {
            [currentVersion, latestVersion] = await Promise.all([
                this.getCurrentVersion(),
                this.getLatestVersion()
            ]);

            isAvailable = latestVersion > currentVersion;

        } catch (error: any) {
            this.logger.error(`❌ Could not check for updates: ${error.message}`);
            return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
        }

        if (!isAvailable) {
            this.logger.info(`ℹ️ ${kPackageName} is already up to date (v${currentVersion}).`);
            return { success: true, noUpdateNeeded: true };
        }

        this.logger.log(`Updating ${kPackageName} from v${currentVersion} to v${latestVersion}...`);

        try {
            const { stdout, stderr } = await execAsync(kNpmInstallCommand);
            if (stderr && !stderr.toLowerCase().includes('warn')) {
                throw new Error(stderr);
            }
            const updatedVersion = await this.getLatestVersion();
            this.logger.success(`✅ ${kPackageName} updated successfully to v${updatedVersion}.`);
            return { success: true };
        } catch (error: any) {
            this.logger.error(`❌ Error updating ${kPackageName}: ${error.message}`, error);
            return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
        }
    }

    private notifyUserOfUpdate(currentVersion: string, latestVersion: string): void {
        this.logger.info(`\nℹ️ Update available: ${kPackageName} v${latestVersion} is available (current: v${currentVersion}). Run 'pew update' to install.\n`);
    }

    private async setLastUpdateCheckTimestamp(): Promise<void> {
        const timestamp = Date.now();
        try {
            await this.configService.setGlobalCoreValue('lastUpdateCheckTimestamp', timestamp);
        } catch (error: any) {
            this.logger.warn(`Warning: Could not set last update check timestamp. Error: ${error.message}`);
        }
    }

    /**
     * Runs the update check logic based on the configured interval and notifies the user if an update is available.
     * This is typically run in the background after other commands complete.
     * Updates the last check timestamp regardless of whether an update was found (unless checking fails).
     * @returns {Promise<void>} A promise that resolves when the check and notification process is complete.
     */
    public async runUpdateCheckAndNotify(): Promise<void> {
        try {
            const shouldCheck = await this.shouldCheckForUpdate();
            if (!shouldCheck) {
                return;
            }

            let currentVersion = 'unknown';
            let latestVersion = 'unknown';
            let updateAvailable = false;

            try {
                [currentVersion, latestVersion] = await Promise.all([
                    this.getCurrentVersion(),
                    this.getLatestVersion()
                ]);
                updateAvailable = latestVersion > currentVersion;

                await this.setLastUpdateCheckTimestamp();

            } catch (checkError: any) {
                this.logger.warn(`⚠️ Could not check for ${kPackageName} updates: ${checkError.message}`);
                return;
            }

            if (updateAvailable) {
                this.notifyUserOfUpdate(currentVersion, latestVersion);
            }

        } catch (error: any) {
            this.logger.warn(`⚠️ An unexpected error occurred during the update check process: ${error.message}`);
        }
    }
} 