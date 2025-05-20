---
name: 📒 Story
about: User-focused feature with clear goals and outcomes
title: "📒 Handle `pew.yaml` malformed errors for templates"
labels: 📒 story
---
# 🔖 Description
> 💡 *This story ensures that the `pew create <templateName>` command handles errors gracefully if the `pew.yaml` file is malformed or if the `templates` section (or a specific template entry) does not adhere to the defined structure. Robust error handling improves user experience by providing clear feedback.*
---

# 🗣 User Story
> 💡 ***As a*** *CLI User* ***I want*** *the `pew create` command to inform me with clear error messages if my `pew.yaml` is syntactically incorrect or if my template definitions are structurally invalid* ***so that*** *I can quickly identify and fix configuration issues.*
---

# ⚙️ Requirements
> 💡 *What are the requirements for this story? What should be in scope and what should be out of scope?*
---
*   **In Scope:**
    *   Detecting and reporting YAML syntax errors in `pew.yaml` when `pew create` is run.
    *   Detecting and reporting structural errors in the `templates` section or a specific template definition (e.g., `files` not being a list).
    *   Aborting the `pew create` command gracefully with an error message.
*   **Out of Scope:**
    *   Deep validation of all possible values (e.g., validating file paths actually exist at this stage).
    *   Interactive correction of `pew.yaml` errors.

# ✅ Acceptance Criteria
> 💡 *Specific conditions that must be met for the story to be considered complete. Each criterion should be testable and unambiguous.*
---

* [ ] Criterion 1: If `pew.yaml` exists but contains a YAML syntax error, and `pew create <templateName>` is run, an error message is displayed by the `LoggerService` (e.g., "Error: Malformed pew.yaml. Please check its syntax. Details: [YAML parser error message]"), and the CLI command aborts with a non-zero exit code.
* [ ] Criterion 2: If `pew.yaml` is valid YAML but the `templates` section itself is not a map (e.g., it's a list or a string), and `pew create <templateName>` is run, an error message is displayed (e.g., "Error: Invalid 'templates' section in pew.yaml. It must be a map of template definitions."), and the CLI aborts.
* [ ] Criterion 3: If `pew.yaml` is valid and `templates` is a map, but a specific template entry (e.g., `myTemplate: ...`) being accessed by `pew create myTemplate` does not conform to the expected structure (e.g., `files` field is missing or is not a list; `variables` or `replacements` is not a map if present; `root` is not a string if present), an error message is displayed (e.g., "Error: Invalid template structure for 'myTemplate' in pew.yaml. 'files' must be a list of strings."), and the CLI aborts.
* [ ] Criterion 4: These validation checks and error reporting occur early in the `pew create` command execution, before attempting any significant template processing (like variable prompting or file operations).
* [ ] Criterion 5: Error messages are user-friendly and provide enough information for the user to locate and fix the issue in `pew.yaml`.

# 💾 Data Model
> 💡 *Old and new data models that will be created and/or altered when this feature is added.*
---
*   No changes to persistent data models. This story focuses on validating the existing `PewConfigDto` structure, particularly the `templates` part defined in Story 1.
*   The `YamlService` and `ConfigService` are key to detecting these issues.

# 🔒 Security Rules / Row Level Security
> 💡 *Old and new security rules with roles and access that should be created and/or altered. Include create, read, update and delete.*
---
Not Applicable.

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
*   Users of `pew-pew-cli` (via release notes, as improved error handling is a user benefit).
*   Documentation should mention common configuration pitfalls if relevant.

# 🧪 Tests
> 💡 *Components/flows/code that would benefit from tests and which scenario's should be tested.*
---
*   `ConfigService` (or `YamlService` if errors are caught there):
    *   Test loading a `pew.yaml` with invalid YAML syntax. Verify it throws or returns a state indicating error.
*   `CliService` (`handleCreateCommand`):
    *   Test with `pew.yaml` having syntactical errors.
    *   Test with `pew.yaml` where `templates:` is a list instead of a map.
    *   Test with a specific template definition where `files:` is missing.
    *   Test with a specific template definition where `files:` is a string instead of a list.
    *   Test with a specific template definition where `variables:` is a list instead of a map.
    *   Test with a specific template definition where `replacements:` is a list instead of a map.
    *   Test with a specific template definition where `root:` is a number instead of a string.
    *   Verify appropriate error messages are logged and the process exits correctly.

# 🤝 Acceptance Test
> 💡 *Which scenario's should we test in the acceptance test? So that we can make sure that this ticket does what it is supposed to do without any unexpected errors.*
---
1.  Create a `pew.yaml` with a YAML syntax error (e.g., incorrect indentation). Run `pew create anyTemplate`. Verify CLI aborts with a "Malformed pew.yaml" error.
2.  Create `pew.yaml`: `templates: ["item1", "item2"]` (templates is a list). Run `pew create anyTemplate`. Verify CLI aborts with "Invalid 'templates' section" error.
3.  Create `pew.yaml`:
    ```yaml
    templates:
      badView:
        variables: "shouldBeAMap" # Invalid structure
        files: ["file.txt"]
    ```
    Run `pew create badView`. Verify CLI aborts with "Invalid template structure for 'badView'... 'variables' must be a map" (or similar).
4.  Create `pew.yaml`:
    ```yaml
    templates:
      badView2:
        # files is missing
        root: "src"
    ```
    Run `pew create badView2`. Verify CLI aborts with "Invalid template structure for 'badView2'... 'files' is required and must be a list".

# 🎨 UI/UX Behaviour
> 💡 *Anything to take note of regarding the behaviour of UI/UX elements (if applicable). Think of position, behaviour when elements do not fit the screen, feedback on elements and properties of animations.*
---
*   Error messages displayed in the CLI must be clear, specific, and guide the user towards fixing their `pew.yaml`.
*   The CLI should exit with a non-zero status code on these configuration errors.

# ⏱️ Effort Breakdown & Estimates
> 💡 *Detailed breakdown of estimated effort required for each aspect of the user story implementation.*
---

*   **Design:** [0.5] hours
    *   _Reasoning: Defining specific error messages and validation points in the config loading/parsing flow._
*   **Refinement:** [0.5] hours
    *   _Reasoning: Ensuring ACs cover key structural validation points._
*   **Front-end:** [0] hours
    *   _Reasoning: Not applicable (CLI tool)._
*   **Backend:** [2] hours
    *   _Reasoning: Enhancing `ConfigService` or `CliService` to perform structural checks on the loaded template configuration. Integrating error logging and process exit._
*   **General Work:** [0.5] hours
    *   _Reasoning: Documenting common configuration errors if helpful._

# 🧪 QA, Testing & Delay Margin
> 💡 *Estimates for quality assurance, testing efforts, and buffer time for potential delays.*
---

*   **QA:** [1] hours ([~28]%)
    *   _Reasoning: Manually creating various malformed `pew.yaml` files to test all specified error conditions._
*   **Testing:** [1] hours ([~28]%)
    *   _Reasoning: Unit tests for config validation logic, ensuring correct errors are thrown/logged for different invalid structures._
*   **Delay Margin:** [0.5] hours ([~14]%)
    *   _Reasoning: Ensuring that error detection doesn't inadvertently flag valid but unusual configurations, or that error messages are precise._

# 📝 Suggested High Level Approach
> 💡 *With knowledge of the current codebase, try to define a best suggested approach. Think of current components used, flow of data and UI elements. Include mermaid diagrams to illustrate flows and connections.*
---
1.  `YamlService.readYamlFile` already catches YAML parsing errors. Ensure `ConfigService.loadPewYaml` propagates these or handles them by returning a state that `CliService` can check.
2.  In `ConfigService.deserializeAndMergeWithDefaults` (or a new dedicated validation method called after loading):
    a.  After `yaml.load`, check the type of `rawData.templates`. If present and not an object (map), throw a specific error or return an invalid status.
    b.  When accessing a specific template (e.g., `rawData.templates[templateName]`):
        i.  Check if the entry exists. If not, this is "template not found" (Story 2).
        ii. Check if `files` exists and is an array of strings. If not, throw/return specific error.
        iii. If `variables` exists, check if it's an object (map). If not, throw/return specific error.
        iv. If `replacements` exists, check if it's an object (map). If not, throw/return specific error.
        v.  If `root` exists, check if it's a string. If not, throw/return specific error.
3.  In `CliService.handleCreateCommand`:
    a.  Call `ConfigService` to get the specific template definition.
    b.  If `ConfigService` indicates a loading/parsing/validation error (from step 1 or 2), log the detailed error using `LoggerService.error()` and `process.exit(1)`.

```mermaid
graph TD
    A[User runs `pew create myTemplate`] --> B[CliService.handleCreateCommand];
    B --> C[ConfigService.getTemplateDefinition("myTemplate")];
    subgraph ConfigService
        C --> D{yamlService.readYamlFile("pew.yaml")};
        D -- YAML Syntax Error --> E[Throw/Signal YAML Error];
        D -- Success --> F[deserializeAndMergeWithDefaults];
        F --> G{Validate `templates` structure};
        G -- Invalid Structure (e.g. `templates` not a map) --> H[Throw/Signal Structural Error for `templates`];
        G -- Valid `templates` map --> I{Validate structure of `templates["myTemplate"]`};
        I -- Invalid (e.g. `files` not list) --> J[Throw/Signal Structural Error for "myTemplate"];
        I -- Valid --> K[Return TemplateDefinition];
    end
    E --> L[CliService catches error];
    H --> L;
    J --> L;
    L --> M[LoggerService.error(message)];
    M --> N[process.exit(1)];
    K --> O[CliService receives valid TemplateDefinition];
    O --> P[Proceed with template processing (other stories)];
```

# 🎯 Roles & Todo's
> *Backend Dev · Front-end Dev · Ui/Ux Designer · DevOps Engineer*
---

* 📌 **Project Manager**:
    - [ ] Review and approve the story.
* 🔧 **Backend Developer**:
    - [ ] Enhance `ConfigService` to perform structural validation of the `templates` data.
    - [ ] Ensure `YamlService` errors are correctly handled/propagated by `ConfigService`.
    - [ ] Update `CliService.handleCreateCommand` to catch these configuration errors, log them, and exit.
    - [ ] Define clear, user-friendly error messages for each validation failure.
    - [ ] Write unit tests for these error scenarios.
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
*   Depends on **Story 1** which defines the correct DTO and structure for `templates`.
*   This story focuses on errors detected *before* starting the main templating logic (like prompting or file processing).
*   The `ConfigService.deserializeAndMergeWithDefaults` method is a good place to add these structural checks, as it already processes the raw loaded data.