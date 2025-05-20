---
name: 📒 Story
about: User-focused feature with clear goals and outcomes
title: "📒 Implement interactive prompting for template variables"
labels: 📒 story
---
# 🔖 Description
> 💡 *This story enables the `pew create <templateName>` command to interactively prompt users for values of template variables defined in `pew.yaml`, but only if those variables were not already supplied via CLI options. This makes the templating feature more user-friendly for cases where not all variables are passed via command line.*
---

# 🗣 User Story
> 💡 ***As a*** *CLI User* ***I want*** *to be prompted for values of template variables when running `pew create <templateName>` if I haven't provided them as CLI options* ***so that*** *I can easily supply all necessary customizations for template generation without needing to remember all variable names for command-line input.*
---

# ⚙️ Requirements
> 💡 *What are the requirements for this story? What should be in scope and what should be out of scope?*
---
*   **In Scope:**
    *   Checking the `variables` map of the selected template definition from `pew.yaml`.
    *   Comparing these defined variables against those already provided via CLI options (from Story 3).
    *   Using `UserInputService` (Inquirer.js) to prompt for any missing variable values.
    *   Using default values from `pew.yaml` in prompts.
    *   Collecting all variable values (CLI, prompted, defaults) into a final map.
*   **Out of Scope:**
    *   The actual use of these variables in file/content replacement (covered in later stories).
    *   Complex validation of prompted input beyond what Inquirer.js provides by default for text input.

# ✅ Acceptance Criteria
> 💡 *Specific conditions that must be met for the story to be considered complete. Each criterion should be testable and unambiguous.*
---

* [ ] Criterion 1: When `pew create <templateName>` is executed, and the specified template in `pew.yaml` has a `variables` map (e.g., `variables: { ComponentName: "DefaultComp", TargetVersion: "1.0" }`).
* [ ] Criterion 2: For each key-value pair (e.g., `VariableName: "DefaultValue"`) in the template's `variables` map:
    *   If `VariableName` was already provided as a CLI option (e.g., `--VariableName=CustomValue` from Story 3), the user is NOT prompted for this variable. The `CustomValue` is used.
    *   Otherwise, the user is prompted to enter a value for `VariableName`. The prompt message should be clear (e.g., "Enter value for VariableName (default: DefaultValue):").
* [ ] Criterion 3: The default value displayed and used by the Inquirer.js prompt for a variable is taken from its value in the `pew.yaml` template's `variables` map (e.g., "DefaultValue" from the example in AC1).
* [ ] Criterion 4: The user can input any string value during the prompt, including an empty string. This input becomes the value for that variable. If the user simply presses Enter at a prompt with a default value, the default value is used.
* [ ] Criterion 5: All variable values (whether from CLI options, interactive prompts, or `pew.yaml` defaults if no user input and no CLI option) are collated into a single, final map of variable names to their resolved string values. This map is then available for subsequent file processing.

# 💾 Data Model
> 💡 *Old and new data models that will be created and/or altered when this feature is added.*
---
*   No changes to persistent data models (`pew.yaml`).
*   In-memory: The `CliService` or a new `TemplateService` will manage:
    *   The initial map of variables from CLI options (from Story 3).
    *   The map of variables defined in `pew.yaml` for the template (from Story 1).
    *   The final, merged map of resolved variable values.

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
*   Users of `pew-pew-cli` (via release notes).
*   Documentation update.

# 🧪 Tests
> 💡 *Components/flows/code that would benefit from tests and which scenario's should be tested.*
---
*   `CliService` (or new `TemplateService`) logic for variable resolution:
    *   Test scenario: All variables provided via CLI options; no prompts should occur.
    *   Test scenario: No variables provided via CLI options; prompts should occur for all variables defined in `pew.yaml`, using defaults from `pew.yaml`.
    *   Test scenario: Some variables via CLI, some not; prompts only for missing ones.
    *   Test scenario: Template has no `variables` map in `pew.yaml`; no prompts should occur.
    *   Test user inputting empty string at prompt.
    *   Test user accepting default value at prompt.
*   Mock `UserInputService.askForText` to simulate user interaction in unit tests.

# 🤝 Acceptance Test
> 💡 *Which scenario's should we test in the acceptance test? So that we can make sure that this ticket does what it is supposed to do without any unexpected errors.*
---
1.  Setup `pew.yaml` with template `myComp` having `variables: { Name: "DefaultName", Type: "Button" }`.
2.  Run `pew create myComp`. Verify prompts for "Name (default: DefaultName):" and "Type (default: Button):". Provide values.
3.  Run `pew create myComp --Name=CustomName`. Verify prompt only for "Type (default: Button):". `Name` should use "CustomName".
4.  Run `pew create myComp --Name=SuperName --Type=Input`. Verify no prompts occur.
5.  During a prompt, press Enter to accept the default. Verify the default value is used.
6.  During a prompt, enter an empty string. Verify an empty string is used as the value.

# 🎨 UI/UX Behaviour
> 💡 *Anything to take note of regarding the behaviour of UI/UX elements (if applicable). Think of position, behaviour when elements do not fit the screen, feedback on elements and properties of animations.*
---
*   Prompts generated by `UserInputService` (Inquirer.js) should be clear.
*   The prompt message must indicate which variable is being asked for and its default value from `pew.yaml`.
*   The order of prompts should ideally follow the order of keys in the `variables` map in `pew.yaml` for consistency, if feasible.

# ⏱️ Effort Breakdown & Estimates
> 💡 *Detailed breakdown of estimated effort required for each aspect of the user story implementation.*
---

*   **Design:** [0.5] hours
    *   _Reasoning: Defining the exact logic for merging CLI variables, prompted variables, and `pew.yaml` defaults._
*   **Refinement:** [0.5] hours
    *   _Reasoning: Reviewing ACs and interaction points._
*   **Front-end:** [0] hours
    *   _Reasoning: Not applicable (CLI tool)._
*   **Backend:** [2.5] hours
    *   _Reasoning: Implementing the prompting logic in `CliService` (or a new `TemplateService`), integrating `UserInputService`, managing variable maps._
*   **General Work:** [0.5] hours
    *   _Reasoning: Updating documentation for interactive behavior._

# 🧪 QA, Testing & Delay Margin
> 💡 *Estimates for quality assurance, testing efforts, and buffer time for potential delays.*
---

*   **QA:** [1] hours ([~25]%)
    *   _Reasoning: Manual testing of various prompting scenarios and CLI option combinations._
*   **Testing:** [1.5] hours ([~37]%)
    *   _Reasoning: Unit tests for the variable resolution and prompting logic, including mocking `UserInputService`._
*   **Delay Margin:** [0.5] hours ([~12]%)
    *   _Reasoning: Ensuring robust merging of variable sources._

# 📝 Suggested High Level Approach
> 💡 *With knowledge of the current codebase, try to define a best suggested approach. Think of current components used, flow of data and UI elements. Include mermaid diagrams to illustrate flows and connections.*
---
1.  In `CliService.handleCreateCommand` (or a new `TemplateService.resolveVariables` method):
    a.  Receive the template definition (from Story 2) and CLI-provided variables (from Story 3).
    b.  Check if the template definition has a `variables` map. If not, return the CLI variables (or an empty map).
    c.  Initialize a `finalVariables` map, potentially pre-filled with CLI-provided variables.
    d.  Iterate through the keys in the template's `variables` map (from `pew.yaml`).
    e.  For each `yamlVarName` and `yamlDefaultValue`:
        i.  If `finalVariables` does not already contain `yamlVarName` (meaning it wasn't set via CLI):
            1.  Use `UserInputService.askForText` to prompt the user: `Enter value for ${yamlVarName} (default: ${yamlDefaultValue}):`. Pass `yamlDefaultValue` as the default to `askForText`.
            2.  Store the result in `finalVariables[yamlVarName]`.
    f.  Return the `finalVariables` map.
2.  This resolved map will then be passed to the file content/name replacement logic in subsequent stories.

```mermaid
graph TD
    A[Start `pew create <templateName>`] --> B{Get Template Definition from pew.yaml};
    B --> C{Get CLI-provided variables (from Story 3)};
    C --> D[Initialize finalVariables map (e.g., with CLI vars)];
    B --> E{Iterate `variables` from pew.yaml};
    E -- For each var (yamlVar, yamlDefault) --> F{Is yamlVar in finalVariables (CLI)?};
    F -- No --> G[Prompt user for yamlVar with yamlDefault];
    G --> H[Add user_input/default to finalVariables];
    F -- Yes --> I[Keep CLI value in finalVariables];
    H --> E;
    I --> E;
    E -- Loop finished --> J[Return finalResolvedVariables map];
    J --> K[Use for file processing (Story 5, 6)];
```

# 🎯 Roles & Todo's
> *Backend Dev · Front-end Dev · Ui/Ux Designer · DevOps Engineer*
---

* 📌 **Project Manager**:
    - [ ] Review and approve the story.
* 🔧 **Backend Developer**:
    - [ ] Implement logic to identify variables needing prompts.
    - [ ] Integrate `UserInputService.askForText` for prompting.
    - [ ] Ensure correct use of default values from `pew.yaml` in prompts.
    - [ ] Implement logic to merge variables from CLI, prompts, and `pew.yaml` defaults.
    - [ ] Write unit tests, mocking `UserInputService`.
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
*   Depends on **Story 1** (for `pew.yaml` variable definitions), **Story 2** (for getting the template definition), and **Story 3** (for CLI-provided variables).
*   The `UserInputService` is already part of the codebase and should be used for prompts.
*   Consider the case where `variables` in `pew.yaml` might be an empty map or not present; no prompts should occur then unless variables are defined.