---
name: 📒 Story
about: User-focused feature with clear goals and outcomes
title: "📒 Implement string replacement in template file content"
labels: 📒 story
---
# 🔖 Description
> 💡 *This story focuses on the core templating engine behavior: reading source template files and replacing placeholders within their content based on resolved variables and static replacements defined in `pew.yaml`.*
---

# 🗣 User Story
> 💡 ***As a*** *CLI User* ***I want*** *the content of my template files to be processed* ***so that*** *placeholders (based on defined variables and static replacements) are substituted with their actual values before the files are generated.*
---

# ⚙️ Requirements
> 💡 *What are the requirements for this story? What should be in scope and what should be out of scope?*
---
*   **In Scope:**
    *   Reading each file specified in the template's `files` list.
    *   Performing string replacements in the content of these files.
    *   Using both the static `replacements` map and the dynamic `variables` map (resolved from Story 4) for substitutions.
    *   Handling precedence if a key exists in both `replacements` and `variables`.
    *   Storing the processed content in memory for later output.
    *   Warning if a source template file is not found.
*   **Out of Scope:**
    *   Writing files to disk (covered in Story 7).
    *   Replacing placeholders in filenames (covered in Story 6).
    *   Advanced templating logic like loops or conditionals.

# ✅ Acceptance Criteria
> 💡 *Specific conditions that must be met for the story to be considered complete. Each criterion should be testable and unambiguous.*
---

* [ ] Criterion 1: For each source file path listed in the active template's `files` array (from `pew.yaml`):
    *   The system attempts to read the content of the source template file using `FileSystemService`.
    *   If a source file cannot be read (e.g., does not exist, permissions issue), a warning is logged (e.g., "Warning: Source template file '<filePath>' not found or unreadable, skipping."), and processing continues to the next file.
* [ ] Criterion 2: For the content of each successfully read source file:
    *   All occurrences of keys from the template's static `replacements` map (defined in `pew.yaml`) are replaced with their corresponding values.
    *   All occurrences of keys (variable names) from the template's resolved `variables` map (collated from CLI options, user prompts, and `pew.yaml` defaults as per Story 4) are replaced with their corresponding resolved string values.
* [ ] Criterion 3: If a key is present in both the template's `replacements` map and the resolved `variables` map, the value from the `variables` map takes precedence for replacement.
* [ ] Criterion 4: The string replacement mechanism performs a direct, case-sensitive match of the key/variable name string. (e.g., if variable is `ViewName`, it replaces occurrences of "ViewName").
* [ ] Criterion 5: The fully processed content for each file (after all replacements) is stored in memory, associated with its original (or eventually, processed) filename, ready for writing to the output destination in Story 7.

# 💾 Data Model
> 💡 *Old and new data models that will be created and/or altered when this feature is added.*
---
*   No changes to persistent data models (`pew.yaml`).
*   In-memory: A data structure (e.g., a map or list of objects) will be needed to hold the processed content for each template file, keyed by its intended output filename (which will be determined in Story 6).
    *   Example: `Map<string, string>` where key is `targetFilePath` and value is `processedFileContent`.

# 🔒 Security Rules / Row Level Security
> 💡 *Old and new security rules with roles and access that should be created and/or altered. Include create, read, update and delete.*
---
Not Applicable. File reading is based on paths from `pew.yaml`, standard file system permissions apply.

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
*   Documentation update.

# 🧪 Tests
> 💡 *Components/flows/code that would benefit from tests and which scenario's should be tested.*
---
*   The core string replacement logic (likely in a new `TemplateService` or within `CliService`):
    *   Test with content containing only static `replacements` keys.
    *   Test with content containing only dynamic `variables` keys.
    *   Test with content containing a mix of both.
    *   Test precedence: variable value overrides static replacement value if keys conflict.
    *   Test multiple occurrences of the same key in content.
    *   Test with keys/variables not present in content (should not change content).
    *   Test with empty file content.
    *   Test with content where replacement values are empty strings.
    *   Test case sensitivity of replacements.
*   File reading:
    *   Mock `FileSystemService.readFile` to provide content.
    *   Mock `FileSystemService.readFile` to throw an error (e.g., file not found) and verify warning is logged and processing continues.

# 🤝 Acceptance Test
> 💡 *Which scenario's should we test in the acceptance test? So that we can make sure that this ticket does what it is supposed to do without any unexpected errors.*
---
1.  Setup `pew.yaml` with a template:
    ```yaml
    templates:
      myTest:
        variables: { "UserName": "User", "ItemName": "DefaultItem" }
        replacements: { "staticPlaceholder": "StaticValue", "ItemName": "StaticItem" }
        files: ["template1.txt"]
    ```
    Create `template1.txt` with content: "Hello {{UserName}}! Welcome. This is a staticPlaceholder. Your item is {{ItemName}}."
2.  Run `pew create myTest --UserName=Alice`.
3.  Internally verify the processed content of `template1.txt` is "Hello Alice! Welcome. This is a StaticValue. Your item is DefaultItem." (Assuming prompt for ItemName yields "DefaultItem" or it's overridden by CLI).
4.  Modify the test: Run `pew create myTest --UserName=Bob --ItemName=SpecialItem`.
5.  Verify processed content is "Hello Bob! Welcome. This is a StaticValue. Your item is SpecialItem." (Variable `ItemName` overrides replacement `ItemName`).
6.  Test with a non-existent file in the `files` list. Verify a warning is logged and the command doesn't crash.

# 🎨 UI/UX Behaviour
> 💡 *Anything to take note of regarding the behaviour of UI/UX elements (if applicable). Think of position, behaviour when elements do not fit the screen, feedback on elements and properties of animations.*
---
*   Warnings for missing source files should be clear and non-blocking for other files.

# ⏱️ Effort Breakdown & Estimates
> 💡 *Detailed breakdown of estimated effort required for each aspect of the user story implementation.*
---

*   **Design:** [0.5] hours
    *   _Reasoning: Designing the replacement algorithm, especially handling precedence and multiple occurrences._
*   **Refinement:** [0.5] hours
    *   _Reasoning: Clarifying ACs for replacement behavior._
*   **Front-end:** [0] hours
    *   _Reasoning: Not applicable (CLI tool)._
*   **Backend:** [3] hours
    *   _Reasoning: Implementing file reading loop, string replacement logic (potentially using regex or iterative `String.prototype.split().join()`), managing processed content in memory._
*   **General Work:** [0] hours
    *   _Reasoning: Documentation primarily for overall feature, less for this internal step._

# 🧪 QA, Testing & Delay Margin
> 💡 *Estimates for quality assurance, testing efforts, and buffer time for potential delays.*
---

*   **QA:** [1] hours ([~25]%)
    *   _Reasoning: Manually preparing template files and `pew.yaml` to test various replacement scenarios._
*   **Testing:** [1.5] hours ([~37]%)
    *   _Reasoning: Unit tests for the string replacement function(s) with diverse inputs and edge cases._
*   **Delay Margin:** [0.5] hours ([~12]%)
    *   _Reasoning: String replacement logic can have subtle bugs if not carefully implemented (e.g., replacing parts of already replaced strings if not done correctly)._

# 📝 Suggested High Level Approach
> 💡 *With knowledge of the current codebase, try to define a best suggested approach. Think of current components used, flow of data and UI elements. Include mermaid diagrams to illustrate flows and connections.*
---
1.  This logic will likely reside in a new `TemplateService` or within `CliService.handleCreateCommand`.
2.  Input: List of source file paths (from `templateConfig.files`), resolved `variables` map (from Story 4), `replacements` map (from `templateConfig`).
3.  Initialize an in-memory store for processed files: `processedFiles: Map<string, string> = new Map();` (key will be original path for now, updated in Story 6).
4.  Loop through each `sourceFilePath` in `templateConfig.files`:
    a.  Try to read `sourceFilePath` using `FileSystemService.readFile`.
    b.  If error, log warning with `LoggerService` and continue to next file.
    c.  If successful, let `content = fileContent`.
    d.  Create a combined replacement map, giving precedence to `variables` over `staticReplacements`.
    e.  Iterate through the combined replacement map. For each `keyToReplace` and `valueToInsert`:
        i.  `content = content.split(keyToReplace).join(valueToInsert);` (This is a common way to replace all occurrences).
    f.  Store the final `content` in `processedFiles` map, keyed by `sourceFilePath`.
5.  This `processedFiles` map is then passed to the filename processing (Story 6) and file writing (Story 7) stages.

```mermaid
graph TD
    A[Start Content Replacement] --> B{Get template definition & resolved variables};
    B --> C[Iterate `template.files` list];
    C -- For each `sourceFile` --> D{Read `sourceFile` content};
    D -- Success --> E[Merge `replacements` & `variables` (vars take precedence)];
    E --> F[Iterate merged map (key, value)];
    F -- For each pair --> G[Replace all occurrences of `key` with `value` in content];
    G --> F;
    F -- Loop finished --> H[Store processed content in memory (Map<filePath, newContent>)];
    H --> C;
    D -- Failure (e.g. not found) --> I[Log warning, skip file];
    I --> C;
    C -- All files processed --> J[Processed content map ready for filename replacement & output];
```

# 🎯 Roles & Todo's
> *Backend Dev · Front-end Dev · Ui/Ux Designer · DevOps Engineer*
---

* 📌 **Project Manager**:
    - [ ] Review and approve the story.
* 🔧 **Backend Developer**:
    - [ ] Implement logic to read content of each template file.
    - [ ] Implement string replacement mechanism for both static replacements and dynamic variables.
    - [ ] Ensure correct precedence (variables over static replacements).
    - [ ] Handle file read errors gracefully with warnings.
    - [ ] Store processed content in memory.
    - [ ] Write unit tests for replacement logic.
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
*   Depends on **Story 1** (for `pew.yaml` structure) and **Story 4** (for resolved variables map).
*   The choice of placeholder syntax in template files (e.g., `{{VariableName}}` vs. just `VariableName`) needs to be consistent with how replacements are performed. The current ACs imply direct string replacement of the variable name itself. If a different placeholder syntax (like `{{ }}`) is desired, AC4 and the implementation approach would need adjustment. Based on user request "replacing the value with the value the user gave" and "replacing any replacement (strings) inside the files", direct string replacement seems intended.
*   Consider performance for very large files or many replacements, though typically template files are small.