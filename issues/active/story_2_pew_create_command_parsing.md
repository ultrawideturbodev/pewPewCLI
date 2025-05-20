---
name: 📒 Story
about: User-focused feature with clear goals and outcomes
title: "📒 Implement `pew create <templateName>` command argument parsing"
labels: 📒 story
---
# 🔖 Description
> 💡 *This story introduces the new `pew create <templateName>` command. It focuses on the initial argument parsing to identify the template name and retrieve its definition from the `pew.yaml` configuration.*
---

# 🗣 User Story
> 💡 ***As a*** *CLI User* ***I want*** *to run `pew create <templateName>`* ***so that*** *the system can identify the template I wish to use from my `pew.yaml` configuration and initiate the code generation process.*
---

# ⚙️ Requirements
> 💡 *What are the requirements for this story? What should be in scope and what should be out of scope?*
---
*   **In Scope:**
    *   Adding a new `create` command to the `pew` CLI, accepting one mandatory argument.
    *   Logic to differentiate this argument as a `templateName` versus a (future) subcommand of `create`.
    *   Loading `pew.yaml` and searching for the `templateName` within the `templates` map.
    *   Handling the case where the template name is not found.
*   **Out of Scope:**
    *   Full implementation of the template creation flow (parsing variables, file operations, etc. – these are subsequent stories).
    *   CLI options for `pew create` (e.g., for variables or target directory – covered in Story 3).

# ✅ Acceptance Criteria
> 💡 *Specific conditions that must be met for the story to be considered complete. Each criterion should be testable and unambiguous.*
---

* [ ] Criterion 1: A new command `pew create <argument>` is available in the CLI and is registered with the command-line parser (e.g., Commander.js).
* [ ] Criterion 2: When `pew create <argument>` is executed, the system first checks if `<argument>` matches any existing, hardcoded subcommands of `pew create` (placeholder for future subcommands, for now, it will always assume it's a template name).
* [ ] Criterion 3: If `<argument>` is not a recognized subcommand, it is treated as `templateName`.
* [ ] Criterion 4: The system attempts to load the `pew.yaml` configuration (using `ConfigService`) and looks for `templateName` as a key within the `templates` map.
* [ ] Criterion 5: If `templateName` is not found in `pew.yaml`'s `templates` map, a user-friendly warning message is displayed (e.g., "Warning: Template '<templateName>' not found in pew.yaml."), and the command exits gracefully without an error status code.
* [ ] Criterion 6: If `templateName` is found, the system logs a message indicating the template was found and its definition is available (e.g., "Found template: <templateName>. Proceeding with generation..."). The actual generation is out of scope for this story.

# 💾 Data Model
> 💡 *Old and new data models that will be created and/or altered when this feature is added.*
---
*   No new persistent data models are created by this story.
*   The system will read the `PewConfigDto` (specifically the `templates` map) defined in Story 1.
*   In-memory: The parsed `TemplateConfigDto` for the found template will be held for subsequent processing steps (in later stories).

# 🔒 Security Rules / Row Level Security
> 💡 *Old and new security rules with roles and access that should be created and/or altered. Include create, read, update and delete.*
---
Not Applicable.

# 🐒 API
> 💡 *Old and new API calls that should be created and/or altered.*
---
Not Applicable (CLI tool). Internal service APIs in `CliService` will be extended.

# 📊 Analytics
> 💡 *Old and new analytics that should be created and/or altered when this feature is added. Include a name, when it's fired and optional properties.*
---
Not Applicable for this story.

# ☎️ Impact Communication
> 💡 *Who / which teams should we inform about the impact of releasing this ticket? Sales, marketing, data, CS, other?*
---
*   Users of `pew-pew-cli` (via release notes, once the full feature is complete).
*   Documentation update will be needed.

# 🧪 Tests
> 💡 *Components/flows/code that would benefit from tests and which scenario's should be tested.*
---
*   `CliService` (`handleCreateTemplate` or similar method):
    *   Test with a valid `templateName` that exists in a mock `pew.yaml`.
    *   Test with a `templateName` that does NOT exist in a mock `pew.yaml`.
    *   Test with `pew.yaml` missing entirely or `templates` section missing.
    *   Test argument parsing for the `create` command itself.
*   Integration with `ConfigService` to fetch template definitions.

# 🤝 Acceptance Test
> 💡 *Which scenario's should we test in the acceptance test? So that we can make sure that this ticket does what it is supposed to do without any unexpected errors.*
---
1.  Configure a `pew.yaml` with a sample template named `myView`.
2.  Run `pew create myView`. Verify a success message indicating "Found template: myView..." is logged.
3.  Run `pew create nonExistentTemplate`. Verify a warning "Template 'nonExistentTemplate' not found..." is logged.
4.  Run `pew create` without any argument. Verify the CLI parser shows an error for a missing argument.
5.  If `pew.yaml` is missing, run `pew create myView`. Verify a warning about missing configuration or template not found.

# 🎨 UI/UX Behaviour
> 💡 *Anything to take note of regarding the behaviour of UI/UX elements (if applicable). Think of position, behaviour when elements do not fit the screen, feedback on elements and properties of animations.*
---
*   CLI output messages (warnings, success) should be clear and concise.
*   Error messages from the command parser (e.g., for missing arguments) should be standard for the CLI.

# ⏱️ Effort Breakdown & Estimates
> 💡 *Detailed breakdown of estimated effort required for each aspect of the user story implementation.*
---

*   **Design:** [0.5] hours
    *   _Reasoning: Defining the exact flow for subcommand vs. template name resolution._
*   **Refinement:** [0.5] hours
    *   _Reasoning: Clarifying ACs and interaction with ConfigService._
*   **Front-end:** [0] hours
    *   _Reasoning: Not applicable (CLI tool)._
*   **Backend:** [2] hours
    *   _Reasoning: Adding new command in `src/index.ts`, new handler in `CliService`, integrating `ConfigService` lookup._
*   **General Work:** [0.5] hours
    *   _Reasoning: Basic documentation update for the new command syntax._

# 🧪 QA, Testing & Delay Margin
> 💡 *Estimates for quality assurance, testing efforts, and buffer time for potential delays.*
---

*   **QA:** [0.5] hours ([~16]%)
    *   _Reasoning: Manual testing of the command with different arguments and `pew.yaml` states._
*   **Testing:** [1] hours ([~33]%)
    *   _Reasoning: Unit tests for the new `CliService` handler and argument parsing logic._
*   **Delay Margin:** [0.5] hours ([~16]%)
    *   _Reasoning: Potential complexities in Commander.js setup or ConfigService integration._

# 📝 Suggested High Level Approach
> 💡 *With knowledge of the current codebase, try to define a best suggested approach. Think of current components used, flow of data and UI elements. Include mermaid diagrams to illustrate flows and connections.*
---
1.  Add a new `.command('create <templateName>')` in `src/index.ts`.
2.  Create a new `async handleCreateCommand(templateName: string, options: any)` method in `CliService.ts`.
3.  Inside `handleCreateCommand`:
    a.  (Placeholder for future: Check if `templateName` is a known subcommand of `create`. For now, assume it's always a template name).
    b.  Call `ConfigService.getInstance().initialize()` and then retrieve the `templates` map.
    c.  Look up `templateName` in the map.
    d.  If found, log success and store the template definition for later stories.
    e.  If not found, log a warning using `LoggerService`.
4.  Write unit tests.

```mermaid
graph TD
    A[User runs `pew create myTemplate`] --> B[index.ts: program.command('create <templateName>')];
    B --> C[CliService.handleCreateCommand("myTemplate", options)];
    C --> D[ConfigService.getTemplatesMap()];
    D --> E{Template "myTemplate" found?};
    E -- Yes --> F[Log "Template found" message];
    E -- No --> G[Log "Template not found" warning];
```

# 🎯 Roles & Todo's
> *Backend Dev · Front-end Dev · Ui/Ux Designer · DevOps Engineer*
---

* 📌 **Project Manager**:
    - [ ] Review and approve the story.
* 🔧 **Backend Developer**:
    - [ ] Add `create <templateName>` command definition in `src/index.ts`.
    - [ ] Implement `handleCreateCommand` in `CliService.ts` for template lookup.
    - [ ] Integrate with `ConfigService` to fetch template definitions.
    - [ ] Implement logging for found/not-found scenarios.
    - [ ] Write unit tests.
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
*   This story depends on **Story 1** for the `pew.yaml` structure and `templates` map being defined and parsable.
*   The actual template processing logic is deferred to subsequent stories. This story only covers finding the template definition.
*   The mechanism for "subcommand of create" is a placeholder; no actual subcommands are being implemented here.