# How to Update Pew Pew CLI

Keeping your `pew-pew-cli` tool up-to-date ensures you have the latest features, bug fixes, and improvements.

## Automatic Update Checks

To make staying updated easier, `pew-pew-cli` includes an automatic background check for new versions.

*   **How it works:** After you successfully run specific commands (`pew init` or `pew paste tasks`), the CLI will check the npm registry for a newer version.
*   **Frequency:** This check happens at most once every 24 hours.
*   **Notification:** If a newer version is found and it's been more than 24 hours since the last check, you'll see a message like this in your terminal:

    ```
    ℹ️ Update available: pew-pew-cli v0.3.0 is available (current: v0.2.1). Run 'pew update' to install.
    ```
*   **Timestamp:** The time of the last check is stored in a global configuration file located at `~/.pew/core.yaml` (`lastUpdateCheckTimestamp` key). This file is managed automatically.

## Manual Updates with `pew update`

You can manually check for and install updates at any time using the `pew update` command.

```bash
pew update
```

**Example Outputs:**

*   **Update Found:**

    ```
    Checking for updates...
    Updating pew-pew-cli from v0.2.1 to v0.3.0...
    ✅ pew-pew-cli updated successfully to v0.3.0.
    ```

*   **No Update Needed:**

    ```
    Checking for updates...
    ℹ️ pew-pew-cli is already up to date (v0.3.0).
    ```

*   **Error During Update:**

    ```
    Checking for updates...
    Updating pew-pew-cli from v0.2.1 to v0.3.0...
    ❌ Error updating pew-pew-cli: [Specific error message from npm, e.g., permission denied]
    ```

*   **Error Checking for Updates:**

    ```
    Checking for updates...
    ❌ Could not check for updates: [Specific error message, e.g., network error]
    ```

Running `pew update` is the recommended way to install the latest version. 