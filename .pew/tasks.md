<chatName="npm-private-cli-release-plan"/>
```markdown
# Project Plan: Prepare pewPewCLI for Private npm Release

## 1. Project Overview
This plan outlines the steps required to prepare the `pew-pew-cli` TypeScript project for release as a private package on the npm registry. The goal is to make the tool installable via `npm install pew` and executable as `pew`, while keeping the source code private and unpublished. The package name on npm will be `pew`. Documentation and description fields can still refer to the tool as `pewPewCLI`.
- [x] Read the project overview:
    - Prepare the existing TypeScript CLI tool for publishing to npm.
    - The package should be private (not open source).
    - Users should install it using `npm install pew`.
    - The command executed by users should be `pew`.
    - The package name on npm will be `pew`.
    - Source maps and type declarations should *not* be included in the published package.
    - The initial version will be `0.1.0`.
    - The plan includes instructions for setting up an npm account.

## 2. Requirements
Overview of all requirements based on user request and codebase analysis.
- [x] Read the requirements:
    - 👤 **Actors & 🧩 Components:**
        - **Actors:**
            - Developer (Configuring the package, building, publishing)
            - User (Installing and running the CLI via npm/npx)
            - npm Registry (Hosts the package)
            - npm CLI (Tool used for publishing and installation)
        - **Components:**
            - `package.json` (Metadata, dependencies, scripts, publish config)
            - `tsconfig.json` (TypeScript compiler options)
            - `README.md` (Package description and usage instructions)
            - `LICENSE` (License file - to be excluded from publish)
            - `src/` (TypeScript source code directory)
            - `dist/` (Compiled JavaScript output directory)
            - `bin/` (Executable scripts directory)
                - `bin/pew.js` (Primary executable script)
            - Node.js Runtime (Executes the CLI)
            - TypeScript Compiler (`tsc`) (Builds the project)

    - 🎬 **Activities:** Specify what actions need to be performed.
        - [Developer]
            - Modify `package.json` configuration
            - Modify `tsconfig.json` configuration
            - Update `README.md` content
            - Verify `bin/pew.js` shebang
            - Run build script (`npm run build`)
            - Create npm account (if needed)
            - Log in to npm via CLI (`npm login`)
            - Publish package to npm (`npm publish`)
        - [`package.json`]
            - Store package name (`pew`)
            - Store version (`0.1.0`)
            - Store license type (`UNLICENSED`)
            - Define executable command (`pew` -> `bin/pew.js`)
            - List runtime dependencies (`dependencies`)
            - List development dependencies (`devDependencies`)
            - Specify files to include in package (`files`)
            - Ensure package is not private (`private: false`)
            - Remove repository URL
        - [`tsconfig.json`]
            - Disable source map generation (`sourceMap: false`)
            - Disable type declaration generation (`declaration: false`)
            - Define output directory (`outDir: "./dist"`)
        - [`README.md`]
            - Remove conflicting license information (CC BY-NC 4.0 badge/mentions)
            - Refer to the package as `pewPewCLI` in descriptions
            - Update installation instructions (use `npm install pew`)
        - [`bin/pew.js`]
            - Contain correct shebang (`#!/usr/bin/env node`)
            - Import and run compiled code from `dist/`
        - [TypeScript Compiler (`tsc`)]
            - Compile TypeScript code from `src/` to JavaScript in `dist/` based on `tsconfig.json`
        - [npm CLI]
            - Read `package.json` for publishing details
            - Package specified files into a `.tgz` archive
            - Upload package archive to npm Registry
            - Authenticate Developer with npm Registry
            - Install package dependencies
            - Link binary command (`pew`) during global install
        - [npm Registry]
            - Store published package versions
            - Serve package files for installation
        - [User]
            - Run `npm install [-g] pew`
            - Run `pew <command>` or `npx pew <command>`

    - 🌊 **Activity Flows & Scenarios:** Break down complex activities into step-by-step processes.
        - [Configuration Flow]
            - GIVEN Developer has the project codebase
            - WHEN Developer edits `package.json`
            - THEN `name` is set to `"pew"`
            - AND `version` is set to `"0.1.0"`
            - AND `license` is set to `"UNLICENSED"`
            - AND `private` is set to `false`
            - AND `repository` field is removed
            - AND `files` array includes `"dist"`, `"bin"`, `"README.md"` and excludes `"LICENSE"`
            - AND runtime dependencies (`commander`, `inquirer`, `clipboardy`, `js-yaml`) are moved from `devDependencies` to `dependencies`
            - WHEN Developer edits `tsconfig.json`
            - THEN `sourceMap` is set to `false`
            - AND `declaration` is set to `false`
            - WHEN Developer edits `README.md`
            - THEN CC BY-NC 4.0 license badge and text are removed
            - THEN Installation instructions are updated to `npm install pew`
            - WHEN Developer checks `bin/pew.js`
            - THEN The first line is `#!/usr/bin/env node`
        - [Build Flow]
            - GIVEN Configuration is complete
            - WHEN Developer runs `npm run build`
            - THEN `tsc` compiles files from `src/`
            - AND JavaScript output is placed in `dist/`
            - AND No `.js.map` or `.d.ts` files are generated in `dist/`
        - [Publishing Flow]
            - GIVEN Build is successful
            - AND Developer has an npm account
            - WHEN Developer runs `npm login`
            - THEN npm CLI prompts for username, password, OTP
            - AND npm CLI authenticates the Developer
            - WHEN Developer runs `npm publish`
            - THEN npm CLI reads `package.json`
            - THEN npm CLI packages files listed in `files` array into an archive
            - THEN npm CLI uploads the archive to the npm Registry under the name `pew` and version `0.1.0`
            - [Error Scenario: Name Taken]
                - GIVEN Package name `pew` is already taken on npm
                - WHEN Developer runs `npm publish`
                - THEN npm Registry rejects the upload
                - AND npm CLI shows an error message (e.g., E403 or similar name conflict error)
            - [Error Scenario: Not Logged In]
                - GIVEN Developer is not logged in
                - WHEN Developer runs `npm publish`
                - THEN npm CLI shows an error message requiring login

    - 📝 **Properties:** Define any values or configurations associated with components or activities.
        - [`package.json`]
            - [name : string] = `"pew"`
            - [version : string] = `"0.1.0"`
            - [license : string] = `"UNLICENSED"`
            - [private : boolean] = `false`
            - [bin : object] = `{ "pew": "bin/pew.js" }`
            - [files : string[]] = `["dist", "bin", "README.md"]`
            - [dependencies : object] = (Contains runtime deps like `commander`, `inquirer`, etc.)
            - [devDependencies : object] = (Contains build/test deps like `typescript`, `@types/*`, `jest`, etc.)
            - [main : string] = `"dist/index.js"` (Entry point for module usage, less relevant for pure CLI but good practice)
            - [type : string] = `"module"` (Already set, important for ES module resolution)
        - [`tsconfig.json`]
            - [compilerOptions.sourceMap : boolean] = `false`
            - [compilerOptions.declaration : boolean] = `false`
            - [compilerOptions.outDir : string] = `"./dist"`
            - [compilerOptions.rootDir : string] = `"./src"`
        - [`bin/pew.js`]
            - [shebang : string] = `"#!/usr/bin/env node"`

    - 🛠️ **Behaviours:** Describe how actors, components, properties, and activities should act or respond in different situations.
        - [`package.json`]
            - [Should define the public interface for npm]
            - [Should correctly list dependencies needed at runtime]
            - [Should specify exactly which files are included in the published package]
            - [Should map the desired command (`pew`) to the correct executable script]
        - [`tsconfig.json`]
            - [Should configure the TypeScript compiler to exclude source maps and declaration files]
            - [Should ensure output goes to the correct directory (`dist/`)]
        - [npm CLI]
            - [Should respect the `files` array during `npm publish`]
            - [Should correctly handle authentication via `npm login`]
            - [Should install runtime dependencies listed in `dependencies` when a user runs `npm install pew`]
            - [Should *not* install `devDependencies` when a user runs `npm install pew`]
            - [Should link the `pew` command specified in `bin` when installed globally]
        - [Build Process (`npm run build`)]
            - [Should produce a clean `dist` directory containing only compiled JavaScript]
            - [Should fail if TypeScript compilation errors occur]

## 3. Milestones and Tasks

### Milestone 1: Prepare Package Configuration
Update configuration files (`package.json`, `tsconfig.json`, `README.md`) and verify the executable script to align with publishing requirements.

#### Task 1.1: Update `package.json` for Publishing
- [x] 1. Modify `package.json` to set the correct package name, version, license, dependencies, included files, and remove private/repository fields for publishing.
    - Sequence diagram:
        ```mermaid
        sequenceDiagram
            Developer->>package.json: Edit file
            package.json-->>Developer: Apply changes (name, version, license, private, files, dependencies, devDependencies, bin, repository removal)
        ```
    - Files:
        - Update: `package.json`
    - Properties:
        - Update: `name`: `"pew-pew-cli"` -> `"pew"`
        - Update: `version`: `"1.0.0"` -> `"0.1.0"`
        - Update: `license`: `"UNLICENSED"` (Keep as is, but ensure LICENSE file is excluded later)
        - Update: `private`: `true` -> `false`
        - Update: `repository`: Remove this entire field.
        - Update: `files`: `["dist", "bin", "README.md", "LICENSE"]` -> `["dist", "bin", "README.md"]`
        - Update: `dependencies`: Add `commander`, `inquirer`, `clipboardy`, `js-yaml` (move from `devDependencies`). Ensure versions are appropriate (e.g., `^13.1.0` for commander, `^8.2.5` for inquirer, `^4.0.0` for clipboardy, `^4.1.0` for js-yaml).
        - Update: `devDependencies`: Remove `commander`, `inquirer`, `clipboardy`, `js-yaml`. Keep `@types/*`, `jest`, `ts-jest`, `ts-node`, `typescript`.
        - Verify: `bin`: `{ "pew": "bin/pew.js" }` (Ensure it remains correct).
        - Verify: `main`: `"dist/index.js"` (Ensure it remains correct).
        - Verify: `type`: `"module"` (Ensure it remains correct).
    - Process:
        - Open `package.json`.
        - Change the value of the `name` field to `"pew"`.
        - Change the value of the `version` field to `"0.1.0"`.
        - Change the value of the `private` field to `false`.
        - Delete the entire `repository` field (key and value).
        - Modify the `files` array to contain only `"dist"`, `"bin"`, and `"README.md"`.
        - Identify `commander`, `inquirer`, `clipboardy`, `js-yaml` within the `devDependencies` object. Note their versions.
        - Cut these entries from `devDependencies`.
        - Create a new `dependencies` object (if it doesn't exist).
        - Paste the cut entries into the `dependencies` object, preserving their version numbers (e.g., `"commander": "^13.1.0"`).
        - Verify the `bin`, `main`, and `type` fields are correct.
        - Save the `package.json` file.

#### Task 1.2: Update `tsconfig.json` to Exclude Maps and Declarations
- [x] 1. Modify `tsconfig.json` to ensure the generation of source maps (`.js.map`) and type declaration files (`.d.ts`) is disabled during the build process.
    - Sequence diagram:
        ```mermaid
        sequenceDiagram
            Developer->>tsconfig.json: Edit file
            tsconfig.json-->>Developer: Apply changes (compilerOptions.sourceMap, compilerOptions.declaration)
        ```
    - Files:
        - Update: `tsconfig.json`
    - Properties:
        - Verify/Update: `compilerOptions.sourceMap`: Should be `false`.
        - Verify/Update: `compilerOptions.declaration`: Should be `false`.
    - Process:
        - Open `tsconfig.json`.
        - Locate the `compilerOptions` object.
        - Ensure the value of the `sourceMap` property is `false`. If it's `true` or missing, set it to `false`.
        - Ensure the value of the `declaration` property is `false`. If it's `true` or missing, set it to `false`.
        - Save the `tsconfig.json` file if changes were made.

#### Task 1.3: Update `README.md` License and Installation Instructions
- [x] 1. Modify `README.md` to remove conflicting license information and update the installation command to reflect the new package name.
    - Sequence diagram:
        ```mermaid
        sequenceDiagram
            Developer->>README.md: Edit file
            README.md-->>Developer: Apply changes (Remove CC license badge/text, update install command)
        ```
    - Files:
        - Update: `README.md`
    - Process:
        - Open `README.md`.
        - Delete the CC BY-NC 4.0 license badge line: `[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)`.
        - Delete the entire "License" section near the end of the file that describes the CC BY-NC 4.0 license. You may optionally add a simple statement like: `## License\n\nThis software is provided under a private license. See the `LICENSE` file in the source repository for details.` or simply remove the section if preferred, given the `LICENSE` file won't be published. Since the user requested removal, let's remove the section entirely.
        - In the "Installation" -> "Global Installation (Planned)" section, change the example command from `# npm install -g pew-pew-cli # (Coming soon)` to `npm install -g pew`. Remove the `# (Coming soon)` comment.
        - Review the rest of the README for any other mentions of the old license or `pew-pew-cli` in installation contexts and update accordingly. Keep references to `pewPewCLI` for the tool's descriptive name.
        - Save the `README.md` file.

#### Task 1.4: Verify Executable Shebang
- [x] 1. Check the main executable file (`bin/pew.js`) to ensure it starts with the correct shebang line required for node CLI scripts.
    - Sequence diagram:
        ```mermaid
        sequenceDiagram
            Developer->>bin/pew.js: Read file content
            bin/pew.js-->>Developer: Show first line
            Developer->>Developer: Verify first line is '#!/usr/bin/env node'
        ```
    - Files:
        - Read: `bin/pew.js`
    - Properties:
        - Verify: `shebang` (first line) is `#!/usr/bin/env node`
    - Process:
        - Open `bin/pew.js`.
        - Confirm that the very first line of the file is exactly `#!/usr/bin/env node`.
        - If it's missing or incorrect, add/edit it.
        - Save the file if changes were made.

### Milestone 2: Build, Account Setup, and Publishing Instructions
Perform a clean build, provide instructions for npm account management, and detail the publishing command.

#### Task 2.1: Perform Clean Build
- [x] 1. Instruct the developer to perform a clean build to ensure the `dist` directory contains the latest compiled JavaScript code without source maps or declaration files.
    - Sequence diagram:
        ```mermaid
        sequenceDiagram
            Developer->>Terminal: Run 'npm run build'
            Terminal->>TypeScript Compiler: Execute 'tsc' based on tsconfig.json
            TypeScript Compiler->>dist/: Output compiled .js files
            dist/-->>Developer: Contains compiled code
        ```
    - Files:
        - Delete: `dist/` (Optional, but ensures a clean build)
        - Create/Update: `dist/` directory and its `.js` contents.
    - Process:
        - Open a terminal in the project root directory.
        - (Optional but recommended) Remove the existing `dist` directory: `rm -rf dist` (macOS/Linux) or `rmdir /s /q dist` (Windows).
        - Run the build script defined in `package.json`: `npm run build`.
        - Verify that the `dist` directory is created and contains `.js` files corresponding to your `.ts` files in `src/`.
        - Verify that no `.js.map` or `.d.ts` files are present in the `dist` directory.

#### Task 2.2: Provide npm Account and Login Instructions
- [x] 1. Provide instructions for creating an npm account (if needed) and logging into the account via the npm CLI.
    - Sequence diagram:
        ```mermaid
        sequenceDiagram
            alt No npm Account
                Developer->>npmjs.com: Navigate to signup page
                npmjs.com-->>Developer: Display signup form
                Developer->>npmjs.com: Submit signup details
                npmjs.com-->>Developer: Account created
            end
            Developer->>Terminal: Run 'npm login'
            Terminal->>npm CLI: Initiate login process
            npm CLI-->>Developer: Prompt for username
            Developer->>npm CLI: Enter username
            npm CLI-->>Developer: Prompt for password
            Developer->>npm CLI: Enter password
            npm CLI-->>Developer: Prompt for email/OTP (if 2FA enabled)
            Developer->>npm CLI: Enter email/OTP
            npm CLI->>npm Registry: Authenticate user
            npm Registry-->>npm CLI: Authentication status
            npm CLI-->>Developer: Display login success/failure message
        ```
    - Process:
        - **If you don't have an npm account:**
            - Go to [https://www.npmjs.com/signup](https://www.npmjs.com/signup).
            - Fill out the required information (username, password, email) and complete the signup process.
            - Verify your email address if required.
        - **Log in via the command line:**
            - Open a terminal.
            - Run the command: `npm login`.
            - Enter your npm username when prompted.
            - Enter your npm password when prompted.
            - Enter the email address associated with your account when prompted (this is often used for verification or notifications).
            - If you have Two-Factor Authentication (2FA) enabled, you will be prompted to enter a One-Time Password (OTP) from your authenticator app.
            - Upon successful login, you should see a message like `Logged in as <your-username> on https://registry.npmjs.org/`.

#### Task 2.3: Provide Publishing Instructions
- [x] 1. Provide the command to publish the package to the npm registry.
    - Sequence diagram:
        ```mermaid
        sequenceDiagram
            Developer->>Terminal: Run 'npm publish'
            Terminal->>npm CLI: Initiate publish process
            npm CLI->>package.json: Read package metadata and 'files' array
            npm CLI->>Filesystem: Package specified files into .tgz archive
            npm CLI->>npm Registry: Upload .tgz archive for 'pew@0.1.0'
            npm Registry-->>npm CLI: Publish success/failure status
            npm CLI-->>Developer: Display publish success/failure message
        ```
    - Files:
        - Read: `package.json`
        - Read: Files listed in `package.json`'s `files` array (e.g., `dist/`, `bin/`, `README.md`)
    - Process:
        - Ensure you are logged in to npm (see Task 2.2).
        - Ensure your `package.json` reflects the desired package name (`pew`) and version (`0.1.0`).
        - Ensure the `private` field in `package.json` is set to `false`.
        - Ensure the build is complete and the `dist` directory is up-to-date (see Task 2.1).
        - Open a terminal in the project root directory.
        - Run the command: `npm publish`.
        - Monitor the output for success or error messages.
            - **Success:** You should see messages indicating the package contents being uploaded and a final confirmation like `+ pew@0.1.0`.
            - **Error (Name Taken):** If the name `pew` is already taken, npm will return an error (e.g., `npm ERR! 403 Forbidden - PUT https://registry.npmjs.org/pew - You do not have permission to publish "pew". Are you logged in as the correct user?`). You would need to choose a different, unique name in `package.json` and try again.
            - **Error (Not Logged In):** If you are not logged in, you'll likely see an error prompting you to log in first. Run `npm login` and retry `npm publish`.
            - **Other Errors:** Address any other build or configuration errors reported by npm.

---
Plan Parts:
1. Milestone 1: Prepare Package Configuration
2. Milestone 2: Build, Account Setup, and Publishing Instructions
```