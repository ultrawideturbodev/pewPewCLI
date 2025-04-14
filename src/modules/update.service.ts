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
    public async getCurrentVersion(): Promise<string> {
        if (this.currentVersion) {
            return this.currentVersion;
        }

        try {
            // Assuming the compiled output is in dist/ and src/ is sibling to dist/
            // Adjust this path based on your actual build output structure
            const packageJsonPath = path.resolve(__dirname, '../../package.json');
            const packageJsonContent = await this.fileSystemService.readFile(packageJsonPath);
            const packageJsonData = JSON.parse(packageJsonContent);
            this.currentVersion = packageJsonData.version;
            if (!this.currentVersion) {
                throw new Error('Version field missing in package.json');
            }
            return this.currentVersion;
        } catch (error: any) {
            console.error('Error reading current version:', error.message);
            // Consider throwing the error or returning a default/null
            throw new Error(`Failed to get current version: ${error.message}`);
        }
    }

    public async getLatestVersion(): Promise<string> {
        try {
            const latest = await latestVersion('pew-pew-cli');
            return latest;
        } catch (error: any) {
            console.error('Error fetching latest version:', error.message);
            // Consider throwing the error or returning a default/null
            throw new Error(`Failed to get latest version from npm: ${error.message}`);
        }
    }

    public async isUpdateAvailable(): Promise<boolean> {
        try {
            const currentVersion = await this.getCurrentVersion();
            const latestVersion = await this.getLatestVersion();

            // Simple string comparison, assumes standard semver format where lexicographical order works
            // For more robust comparison, consider using a library like 'semver'
            return latestVersion > currentVersion;
        } catch (error: any) {
            // Log the error but return false, as we can't determine if an update is available
            console.error('Error checking if update is available:', error.message);
            return false;
        }
    }

    private async getLastUpdateCheckTimestamp(): Promise<number> {
        try {
            return await this.configService.getGlobalCoreValue<number>('lastUpdateCheckTimestamp', 0);
        } catch (error: any) {
            console.warn(`Warning: Could not read last update check timestamp. Assuming check is needed. Error: ${error.message}`);
            // Return 0 to ensure the check runs if reading fails
            return 0;
        }
    }

    public async shouldCheckForUpdate(): Promise<boolean> {
        const lastCheckTimestamp = await this.getLastUpdateCheckTimestamp();
        const currentTimestamp = Date.now();

        if (lastCheckTimestamp === 0) {
            return true; // Always check if never checked before or if reading failed
        }

        return (currentTimestamp - lastCheckTimestamp) > UpdateService.kUpdateCheckIntervalMs;
    }

    public async performUpdate(): Promise<{success: boolean, error?: Error, noUpdateNeeded?: boolean}> {
        console.log("Checking for updates...");
        let isAvailable = false;
        let currentVersion = 'unknown';
        let latestVersion = 'unknown';

        try {
            // Use Promise.all to fetch versions concurrently, potentially faster
            [currentVersion, latestVersion] = await Promise.all([
                this.getCurrentVersion(),
                this.getLatestVersion()
            ]);

            // Compare versions after fetching both
            isAvailable = latestVersion > currentVersion;

        } catch (error: any) {
            console.error(`❌ Could not check for updates: ${error.message}`);
            return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
        }

        if (!isAvailable) {
            console.log(`ℹ️ pew-pew-cli is already up to date (v${currentVersion}).`);
            return { success: true, noUpdateNeeded: true };
        }

        console.log(`Updating pew-pew-cli from v${currentVersion} to v${latestVersion}...`);
        const command = 'npm install -g pew-pew-cli@latest';

        try {
            // Consider adding a spinner here for better UX during install
            const { stdout, stderr } = await execAsync(command);
            if (stderr && !stderr.toLowerCase().includes('warn')) {
                // Treat non-warning stderr as an error
                throw new Error(stderr);
            }
            // Fetch the *actually* installed version after update for confirmation
            const updatedVersion = await this.getLatestVersion(); // Re-fetch latest as confirmation
            console.log(`✅ pew-pew-cli updated successfully to v${updatedVersion}.`);
            return { success: true };
        } catch (error: any) {
            console.error(`❌ Error updating pew-pew-cli: ${error.message}`);
            return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
        }
    }

    private notifyUserOfUpdate(currentVersion: string, latestVersion: string): void {
        // Use console.info or a dedicated logging service if available
        console.info(`\nℹ️ Update available: pew-pew-cli v${latestVersion} is available (current: v${currentVersion}). Run 'pew update' to install.\n`);
    }

    private async setLastUpdateCheckTimestamp(): Promise<void> {
        const timestamp = Date.now();
        try {
            await this.configService.setGlobalCoreValue('lastUpdateCheckTimestamp', timestamp);
        } catch (error: any) {
            // Log warning but don't block execution
            console.warn(`Warning: Could not set last update check timestamp. Error: ${error.message}`);
        }
    }

    public async runUpdateCheckAndNotify(): Promise<void> {
        try {
            const shouldCheck = await this.shouldCheckForUpdate();
            if (!shouldCheck) {
                return; // Not enough time has passed
            }

            // Variables to store versions if needed for notification
            let currentVersion = 'unknown';
            let latestVersion = 'unknown';
            let updateAvailable = false;

            try {
                 // Fetch versions first
                [currentVersion, latestVersion] = await Promise.all([
                    this.getCurrentVersion(),
                    this.getLatestVersion()
                ]);
                updateAvailable = latestVersion > currentVersion;

                // Set timestamp *after* successful check, regardless of update availability
                await this.setLastUpdateCheckTimestamp(); 

            } catch (checkError: any) {
                // Log error during check but don't notify or update timestamp
                console.warn(`⚠️ Could not check for pew-pew-cli updates: ${checkError.message}`);
                // Do not proceed to notification or timestamp update if the check fails
                return;
            }

            // Notify only if an update is actually available
            if (updateAvailable) {
                this.notifyUserOfUpdate(currentVersion, latestVersion);
            }

        } catch (error: any) {
            // Catch unexpected errors in the outer logic (e.g., shouldCheckForUpdate fails critically)
            console.warn(`⚠️ An unexpected error occurred during the update check process: ${error.message}`);
        }
    }
} 