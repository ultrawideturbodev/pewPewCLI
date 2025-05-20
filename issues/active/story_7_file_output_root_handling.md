---
name: 📒 Story
about: User-focused feature with clear goals and outcomes
title: "📒 Implement file output with `root` path handling"
labels: 📒 story
---
# 🔖 Description
> 💡 *This story brings the templating feature to fruition by writing the processed files (with replaced content and names) to the specified output directory. It critically includes the logic for handling the `root` directive from `pew.yaml` to correctly structure the output file and folder hierarchy.*
---

# 🗣 User Story
> 💡 ***As a*** *CLI User* ***I want*** *the processed template files to be generated in my target directory, respecting the `root` path configuration from `pew.yaml`* ***so that*** *I can create well-structured projects or components from my templates with a single command.*
---

# ⚙️ Requirements
> 💡 *What are the requirements for this story? What should be in scope and what should be out of scope?*
---
*   **In Scope:**
    *   Writing files to the target directory (CLI option or CWD).
    *   Interpreting the `root` string from the template definition in `pew.yaml`.
    *   Stripping the `root` prefix from source file paths when constructing output paths.
    *   Handling files not under the `root` path.
    *   Creating necessary subdirectories in the output location.
*   **Out of Scope:**
    *   Complex file conflict resolution (e.g., if a file to be generated already exists). Assume overwrite or simple error for now. (This might need a follow-up decision/story).
    *   Permissions management beyond standard OS behavior.

# ✅ Acceptance Criteria
> 💡 *Specific conditions that must be met for the story to be considered complete. Each criterion should be testable and unambiguous.*
---

* [ ] Criterion 1: All files processed (content from Story 5, path/name from Story 6) are written to the correct final target output directory (which is either specified by the `--target` CLI option or defaults to the current working directory).
* [ ] Criterion 2: If the active template definition in `pew.yaml` includes a `root` string (e.g., `root: "template_source/common_base"`):
    *   For each file whose *original path from `pew.yaml`'s `files` list* started with this `root` string (e.g., `template_source/common_base/ui/style.css`), the `root` prefix is stripped from its *processed path (from Story 6)*. The remaining part of the processed path (e.g., if processed path was `template_src_output/common_out/ui_out/style_out.css` and root was `template_src_output/common_out`, then `ui_out/style_out.css`) is used to construct the final path within the target output directory.
* [ ] Criterion 3: If a file's *original path from `pew.yaml`'s `files` list* did NOT start with the template's `root` path (or if `root` is not specified in `pew.yaml`), its fully *processed path (from Story 6)* is resolved directly relative to the target output directory.
* [ ] Criterion 4: If `root` is not specified in the template's `pew.yaml` definition, all files use their *processed paths (from Story 6)* resolved directly relative to the target output directory.
* [ ] Criterion 5: The content written to each output file is its fully processed content (from Story 5). The name and relative path within the target directory for each output file are determined by its processed path (from Story 6) as modified by the `root` logic (AC2, AC3, AC4).
* [ ] Criterion 6: Any necessary subdirectories within the target output directory (e.g., `targetDir/src/components/`) are automatically created by `FileSystemService.ensureDirectoryExists` before attempting to write files into them.
* [ ] Criterion 7: After all files are successfully written, a confirmation message is logged (e.g., "Successfully generated <N> files from template '<templateName>' in '<targetPath>'.").

# 💾 Data Model
> 💡 *Old and new data models that will be created and/or altered when this feature is added.*
---
*   No changes to persistent data models (`pew.yaml`).
*   In-memory: Uses the list of files to generate, which includes their processed paths and processed content (from Story 6). Example: `Array<{ originalPath: string, processedPath: string, processedContent: string }>`.

# 🔒 Security Rules / Row Level Security
> 💡 *Old and new security rules with roles and access that should be created and/or altered. Include create, read, update and delete.*
---
Not Applicable. Standard file system write permissions apply based on the user running the CLI and the target directory. Care should be taken not to allow writing to arbitrary system locations if paths are not sanitized, but `path.resolve` and `path.join` should handle this.

# 🐒 API
> 💡 *Old and new API calls that should be created and/or altered.*
---
Not Applicable (CLI tool).

# 📊 Analytics
> 💡 *Old and new analytics that should be created and/or altered when this feature is added. Include a name, when it's fired and optional properties.*
---
Not Applicable for this story.

# ☎️ Impact Communication
> 💡 *Who / which teams should we inform about the impact of releasing this ticket? Sales, marketing, data, CS, other?*
---
*   Users of `pew-pew-cli` (via release notes).
*   Documentation update (crucial for explaining `root` behavior).

# 🧪 Tests
> 💡 *Components/flows/code that would benefit from tests and which scenario's should be tested.*
---
*   The file output and path construction logic (in `TemplateService` or `CliService`):
    *   Test with `root` specified:
        *   Files inside the `root`.
        *   Files outside the `root`.
        *   Files where `root` itself contains variables.
    *   Test without `root` specified.
    *   Test with target directory specified via `--target`.
    *   Test with target directory defaulting to CWD.
    *   Test that subdirectories are created correctly.
    *   Test with processed filenames that create new directory structures.
    *   Test with empty files list.
*   Mock `FileSystemService.writeFile` and `FileSystemService.ensureDirectoryExists` to verify they are called with correct paths and content.

# 🤝 Acceptance Test
> 💡 *Which scenario's should we test in the acceptance test? So that we can make sure that this ticket does what it is supposed to do without any unexpected errors.*
---
1.  Setup `pew.yaml`:
    ```yaml
    templates:
      myApp:
        variables: { "AppName": "MyApp" }
        root: "template_files/src"
        files:
          - "template_files/src/{{AppName}}.js"      # Inside root
          - "template_files/src/utils/helpers.js" # Inside root
          - "template_files/README_TEMPLATE.md"   # Outside root
          - "LICENSE"                             # Outside root, at top level
    ```
    Create corresponding dummy template files with some content.
2.  Run `pew create myApp --AppName=MyCoolApp --target=./output_test`.
3.  Verify directory structure and file content in `./output_test`:
    *   `./output_test/MyCoolApp.js` (content processed)
    *   `./output_test/utils/helpers.js` (content processed)
    *   `./output_test/README_TEMPLATE.md` (content processed, path relative to target, not stripped by root)
    *   `./output_test/LICENSE` (content processed, path relative to target)
4.  Run `pew create myApp` (no target). Verify files generated in CWD.
5.  Test with a template that has no `root` defined. Verify all files are created relative to the target dir using their full processed paths.

# 🎨 UI/UX Behaviour
> 💡 *Anything to take note of regarding the behaviour of UI/UX elements (if applicable). Think of position, behaviour when elements do not fit the screen, feedback on elements and properties of animations.*
---
*   Clear success message upon completion, indicating number of files generated and target location.
*   If file writing fails for any reason (e.g., permissions), an error message should be logged.

# ⏱️ Effort Breakdown & Estimates
> 💡 *Detailed breakdown of estimated effort required for each aspect of the user story implementation.*
---

*   **Design:** [1] hours
    *   _Reasoning: Finalizing the precise logic for how `root` interacts with processed paths from Story 6, especially if `root` itself contains variables or if processed paths become complex._
*   **Refinement:** [0.5] hours
    *   _Reasoning: Reviewing ACs for path manipulation edge cases._
*   **Front-end:** [0] hours
    *   _Reasoning: Not applicable (CLI tool)._
*   **Backend:** [3.5] hours
    *   _Reasoning: Implementing the path construction logic (stripping root, resolving final paths), directory creation, and file writing loop. Integrating with `FileSystemService`._
*   **General Work:** [1] hours
    *   _Reasoning: Detailed documentation of the `root` behavior and output structure is critical._

# 🧪 QA, Testing & Delay Margin
> 💡 *Estimates for quality assurance, testing efforts, and buffer time for potential delays.*
---

*   **QA:** [1.5] hours ([~25]%)
    *   _Reasoning: Extensive manual testing with various `pew.yaml` configurations (different `root` values, complex `files` lists) and output targets._
*   **Testing:** [2] hours ([~33]%)
    *   _Reasoning: Unit tests for path resolution logic and mocking file system interactions._
*   **Delay Margin:** [1] hours ([~16]%)
    *   _Reasoning: Path manipulation logic, especially with `root` and dynamic filenames, can be complex and error-prone. Ensuring cross-platform path compatibility._

# 📝 Suggested High Level Approach
> 💡 *With knowledge of the current codebase, try to define a best suggested approach. Think of current components used, flow of data and UI elements. Include mermaid diagrams to illustrate flows and connections.*
---
1.  This is the final step in `CliService.handleCreateCommand` or a `TemplateService`.
2.  Input:
    *   `finalFilesToGenerate: Array<{ originalPath: string, processedPath: string, processedContent: string }>` (from Story 6).
    *   `templateDefinition.root` (string, optional, from `pew.yaml`).
    *   `targetOutputDirectory` (string, resolved path from CLI option or CWD).
3.  For each `fileInfo` in `finalFilesToGenerate`:
    a.  Let `finalRelativePath = fileInfo.processedPath`.
    b.  If `templateDefinition.root` is specified AND `fileInfo.originalPath` (the path string from `pew.yaml` before variable replacement) starts with `templateDefinition.root`:
        i.  Carefully determine how to strip the `root` prefix from `fileInfo.processedPath`. This is tricky if `root` itself could have variables. A robust way:
            1.  Process `templateDefinition.root` with variables to get `resolvedRoot`.
            2.  If `fileInfo.processedPath` starts with `resolvedRoot`, then `finalRelativePath = fileInfo.processedPath.substring(resolvedRoot.length)`. Ensure leading slashes are handled.
    c.  `finalAbsolutePath = path.join(targetOutputDirectory, finalRelativePath)`.
    d.  `directoryToEnsure = path.dirname(finalAbsolutePath)`.
    e.  Call `FileSystemService.ensureDirectoryExists(directoryToEnsure)`.
    f.  Call `FileSystemService.writeFile(finalAbsolutePath, fileInfo.processedContent)`.
4.  Log overall success message.

```mermaid
graph TD
    A[Start File Output] --> B{Get `finalFilesToGenerate` list (processed paths & content), `template.root`, `targetDir`};
    B --> C{Iterate `finalFilesToGenerate`};
    C -- For each `fileInfo` (originalPath, processedPath, content) --> D{Determine `finalRelativePath` based on `template.root`};
    D -- If `originalPath` starts with `template.root` --> E[Strip `root` equivalent from `processedPath` to get `finalRelativePath`];
    D -- Else (or no `root`) --> F[`finalRelativePath = processedPath`];
    E --> G[Construct `finalAbsolutePath = path.join(targetDir, finalRelativePath)`];
    F --> G;
    G --> H[Ensure directory `path.dirname(finalAbsolutePath)` exists];
    H --> I[Write `content` to `finalAbsolutePath`];
    I --> C;
    C -- All files written --> J[Log success message];
```

# 🎯 Roles & Todo's
> *Backend Dev · Front-end Dev · Ui/Ux Designer · DevOps Engineer*
---

* 📌 **Project Manager**:
    - [ ] Review and approve the story.
* 🔧 **Backend Developer**:
    - [ ] Implement logic to determine final output path for each file, considering `root`.
    - [ ] Integrate `FileSystemService.ensureDirectoryExists` and `FileSystemService.writeFile`.
    - [ ] Implement final success logging.
    - [ ] Write unit tests for path handling and file output logic (mocking FS calls).
    - [ ] Update documentation regarding `root` behavior and output.
* 🖥️ **Front-end Developer**:
    - [ ] Not Applicable
* 🎨 **UI/UX Designer**:
    - [ ] Not Applicable
* 🚀 **DevOps Engineer**:
    - [ ] Not Applicable
* 📊 **Data Engineer**:
    - [ ] Not Applicable
* 📣 **Marketeer**:
    - [ ] Not Applicable

# 👉️ Final Remarks
> 💡 *Anything to take note off that is not properly defined yet. Think of out of scope notes, dependencies, anything to be extra cautious about and/or information about related issues.*
---
*   Depends on **Story 3** (for target directory), **Story 5** (for processed content), and **Story 6** (for processed filenames/paths).
*   The logic for stripping `root` from `processedPath` (AC2) needs careful implementation. The `originalPath` (from `pew.yaml` before variable substitution) should be used to determine if a file *was intended* to be under `root`. The `processedPath` (after variable substitution) is then manipulated.
*   File overwriting strategy: This story assumes files can be overwritten. If more complex behavior (prompt, skip, error) is needed for existing files, that would be a separate enhancement.
*   Path normalization (e.g., removing `//` if empty variables cause it) might be needed before writing. `path.normalize()` can help.