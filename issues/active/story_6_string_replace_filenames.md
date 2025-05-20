---
name: 📒 Story
about: User-focused feature with clear goals and outcomes
title: "📒 Implement string replacement in template filenames"
labels: 📒 story
---
# 🔖 Description
> 💡 *This story extends the templating capabilities to allow dynamic filenames and directory structures. Placeholders within the file paths defined in `pew.yaml` will be replaced using the resolved template variables.*
---

# 🗣 User Story
> 💡 ***As a*** *CLI User* ***I want*** *to use template variables within the file paths specified in my `pew.yaml` template definition* ***so that*** *I can generate files and directories with names that are dynamically determined by user input or defaults (e.g., creating `MyComponent.js` based on a `ComponentName` variable).*
---

# ⚙️ Requirements
> 💡 *What are the requirements for this story? What should be in scope and what should be out of scope?*
---
*   **In Scope:**
    *   Processing each file path string from the template's `files` list.
    *   Replacing placeholders (variable names) in these path strings with their resolved values.
    *   This applies to both directory names and filenames in the path.
    *   Using the resolved `variables` map from Story 4 for these replacements.
*   **Out of Scope:**
    *   Using static `replacements` for filename changes (typically variables are used for this). If this is desired, it needs clarification. For now, assume only `variables` apply to filenames.
    *   Writing files to disk (covered in Story 7).

# ✅ Acceptance Criteria
> 💡 *Specific conditions that must be met for the story to be considered complete. Each criterion should be testable and unambiguous.*
---

* [ ] Criterion 1: For each original file path string listed in the active template's `files` array (from `pew.yaml`):
    *   All occurrences of keys (variable names) from the template's resolved `variables` map (collated as per Story 4) within the file path string itself are replaced with their corresponding resolved string values.
* [ ] Criterion 2: This replacement mechanism applies to all parts of the path string, including directory names and the final filename component (e.g., a path like `src/{{ModuleName}}/views/{{ViewName}}Screen.js` becomes `src/Auth/views/LoginScreen.js`).
* [ ] Criterion 3: The resulting processed file path string is stored and associated with its processed content (from Story 5). This processed path will be used as the relative path for output in Story 7.
* [ ] Criterion 4: If a variable used in a filename/path is not defined or its resolved value is an empty string, its placeholder in the filename/path is replaced by an empty string. (e.g., `{{OptionalPrefix}}-component.js` with `OptionalPrefix` being empty becomes `-component.js`. Consider if this behavior is ideal or if undefined variables should leave placeholder or cause warning). For now, assume empty string replacement.
* [ ] Criterion 5: The replacement of variable names in paths is case-sensitive, matching the variable names from the resolved `variables` map.

# 💾 Data Model
> 💡 *Old and new data models that will be created and/or altered when this feature is added.*
---
*   No changes to persistent data models (`pew.yaml`).
*   In-memory: The data structure holding processed file content (from Story 5, e.g., `Map<originalFilePath, processedContent>`) will need to be transformed or augmented. The new structure might be `Map<processedFilePath, processedContent>` or a list of objects like `{ originalPath: string, processedPath: string, processedContent: string }`.

# 🔒 Security Rules / Row Level Security
> 💡 *Old and new security rules with roles and access that should be created and/or altered. Include create, read, update and delete.*
---
Not Applicable. Path manipulation is internal; actual file system interaction is in Story 7.

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
*   The filename/path replacement logic:
    *   Test with variables in the filename part only (e.g., `{{ComponentName}}.js`).
    *   Test with variables in directory parts (e.g., `{{Module}}/component.js`).
    *   Test with variables in multiple parts (e.g., `{{Module}}/{{Feature}}/{{Name}}.ts`).
    *   Test with multiple variables in a single component (e.g., `{{Name}}-{{Type}}.css`).
    *   Test with variables whose resolved values are empty strings.
    *   Test with variables not present in the path string (should not change path).
    *   Test case sensitivity of variable replacement in paths.
    *   Test with paths that have no variables (should remain unchanged).

# 🤝 Acceptance Test
> 💡 *Which scenario's should we test in the acceptance test? So that we can make sure that this ticket does what it is supposed to do without any unexpected errors.*
---
1.  Setup `pew.yaml` with a template:
    ```yaml
    templates:
      myFeature:
        variables: { "FeatureName": "UserAuth", "ComponentName": "LoginForm" }
        files:
          - "src/{{FeatureName}}/components/{{ComponentName}}.js"
          - "src/{{FeatureName}}/styles/{{ComponentName}}.css"
          - "docs/{{FeatureName}}.md"
    ```
2.  Run `pew create myFeature --FeatureName=OrderProcessing --ComponentName=OrderForm`.
3.  Internally verify that the list of files to be generated (before `root` processing) includes:
    *   `src/OrderProcessing/components/OrderForm.js`
    *   `src/OrderProcessing/styles/OrderForm.css`
    *   `docs/OrderProcessing.md`
4.  Run `pew create myFeature --FeatureName=Inventory`. (Assume `ComponentName` defaults to "DefaultComp" or is prompted).
5.  Verify paths like `src/Inventory/components/DefaultComp.js` are generated.

# 🎨 UI/UX Behaviour
> 💡 *Anything to take note of regarding the behaviour of UI/UX elements (if applicable). Think of position, behaviour when elements do not fit the screen, feedback on elements and properties of animations.*
---
Not Applicable for this story (internal processing).

# ⏱️ Effort Breakdown & Estimates
> 💡 *Detailed breakdown of estimated effort required for each aspect of the user story implementation.*
---

*   **Design:** [0.5] hours
    *   _Reasoning: Confirming the exact replacement strategy for paths (e.g., handling of undefined variables in paths)._
*   **Refinement:** [0.5] hours
    *   _Reasoning: Reviewing ACs, especially around edge cases like empty variable values._
*   **Front-end:** [0] hours
    *   _Reasoning: Not applicable (CLI tool)._
*   **Backend:** [2] hours
    *   _Reasoning: Implementing the path string replacement logic, iterating through the file list from `pew.yaml`, and updating the in-memory representation of files to be generated._
*   **General Work:** [0] hours
    *   _Reasoning: Documentation for this specific step is minor, part of overall feature docs._

# 🧪 QA, Testing & Delay Margin
> 💡 *Estimates for quality assurance, testing efforts, and buffer time for potential delays.*
---

*   **QA:** [0.5] hours ([~16]%)
    *   _Reasoning: Manually verifying that the internal list of processed paths is correct for various inputs._
*   **Testing:** [1] hours ([~33]%)
    *   _Reasoning: Unit tests for the path replacement function(s) with various path structures and variable combinations._
*   **Delay Margin:** [0.5] hours ([~16]%)
    *   _Reasoning: Ensuring robust handling of path manipulations and variable substitutions in paths._

# 📝 Suggested High Level Approach
> 💡 *With knowledge of the current codebase, try to define a best suggested approach. Think of current components used, flow of data and UI elements. Include mermaid diagrams to illustrate flows and connections.*
---
1.  This logic will likely follow content replacement (Story 5) and can be part of a `TemplateService` or `CliService.handleCreateCommand`.
2.  Input: The original list of file paths from `templateConfig.files`, and the resolved `variables` map (from Story 4). The processed file contents (from Story 5) also need to be associated.
3.  Create a new list or map to store the final file information: `finalFilesToGenerate: Array<{ outputPath: string, content: string }> = [];`
4.  For each `originalPath` in `templateConfig.files`:
    a.  Let `currentPath = originalPath`.
    b.  Retrieve its `processedContent` (from Story 5, keyed by `originalPath`).
    c.  Iterate through the `resolvedVariables` map. For each `variableName` and `resolvedValue`:
        i.  `currentPath = currentPath.split(variableName).join(resolvedValue);` (Replace all occurrences of the variable name string).
    d.  Add `{ outputPath: currentPath, content: processedContent }` to `finalFilesToGenerate`.
5.  This `finalFilesToGenerate` list is then passed to the file writing stage (Story 7).

```mermaid
graph TD
    A[Start Filename/Path Replacement] --> B{Get original `files` list from pew.yaml & resolved `variables` map};
    B --> C{Get processed content map (from Story 5)};
    C --> D[Initialize `finalFilesToGenerate` list];
    D --> E{Iterate through original `files` list (from pew.yaml)};
    E -- For each `originalFilePath` --> F[Let `processedPath = originalFilePath`];
    F --> G[Retrieve `processedContent` for `originalFilePath`];
    G --> H{Iterate through `resolvedVariables` map (varName, varValue)};
    H -- For each variable --> I[Replace all occurrences of `varName` in `processedPath` with `varValue`];
    I --> H;
    H -- Variables loop finished --> J[Add `{ outputPath: processedPath, content: processedContent }` to `finalFilesToGenerate`];
    J --> E;
    E -- All files processed --> K[List of files with processed paths and content ready for output];
```

# 🎯 Roles & Todo's
> *Backend Dev · Front-end Dev · Ui/Ux Designer · DevOps Engineer*
---

* 📌 **Project Manager**:
    - [ ] Review and approve the story.
* 🔧 **Backend Developer**:
    - [ ] Implement logic to iterate through template file paths from `pew.yaml`.
    - [ ] Implement string replacement for variable placeholders within these paths.
    - [ ] Ensure the processed paths are correctly associated with their processed content.
    - [ ] Write unit tests for path replacement logic.
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
*   Depends on **Story 4** (for resolved variables map) and **Story 5** (for processed file content).
*   The placeholder syntax for variables in filenames (e.g., `{{VarName}}` vs. `VarName`) should be consistent with content replacement. Current ACs imply direct replacement of the variable name string.
*   Consider potential issues with file system path validity if variable replacements result in illegal characters for paths (though this is an edge case, and users are responsible for their variable values). For this story, assume valid characters.
*   The decision in AC4 (undefined/empty variables replaced by empty string) might lead to paths like `src//component.js` or `-component.js`. This should be tested. Normalizing paths (e.g., removing double slashes) could be part of Story 7.