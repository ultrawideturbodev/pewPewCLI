 💡 *Provide a high-level overview of the epic. What is this large initiative about? What problem does it solve or what opportunity does it address at a strategic level?*

This epic covers the implementation of a new feature in the `pew` CLI that allows users to define and use templates for generating files and folder structures. Users will configure templates in `pew.yaml`, specifying variables, static replacements, source files, and an optional root directory for structuring output. The `pew create <templateName>` command will then process these templates, prompt for variable values (or accept them via CLI options), perform replacements in file content and names, and generate the output in the current directory or a specified target directory. This feature aims to streamline repetitive code scaffolding tasks and enable users to create shareable, reusable project starters or component templates.
---

# 🎯 Strategic Goals & Objectives
> 💡 *What are the main strategic goals this epic aims to achieve? List 2-5 key objectives.*
> *e.g., "Increase user engagement by X%," "Expand into new market segment Y," "Improve system performance and scalability for Z."*

*   **Goal 1:** Enhance developer productivity by automating boilerplate code generation.
    *   Objective 1.1: Allow users to define custom file/folder templates within `pew.yaml`.
    *   Objective 1.2: Enable one-command scaffolding of templated structures via `pew create <templateName>`.
*   **Goal 2:** Increase the utility and adoption of `pew-pew-cli` by adding a powerful templating engine.
    *   Objective 2.1: Support dynamic content and filenames through user-defined variables.
    *   Objective 2.2: Provide flexibility in output structure generation using a `root` directive.
---

# 💼 Business Value / Justification
> 💡 *Why is this epic important for the business? What value will it deliver? Quantify if possible.*
> *e.g., "Expected to generate $X in new revenue," "Reduce operational costs by Y%," "Enhance competitive advantage by Z."*

This feature will significantly increase the value proposition of `pew-pew-cli` by transforming it from a task management tool into a more comprehensive development assistant. It addresses a common developer need for quick scaffolding and boilerplate reduction, potentially saving significant time on projects. This can lead to increased user satisfaction, broader adoption within development teams, and position `pew-pew-cli` as a more versatile tool in a developer's toolkit.
---

# 🗺️ Scope
> 💡 *Define the boundaries of this epic. What is included and what is explicitly excluded?*

## In Scope:
*   Modifications to `pew.yaml` to support a new `templates` configuration section.
*   A new `pew create <templateName>` command.
*   Parsing of template definitions (variables, replacements, root, files).
*   Interactive prompting for template variables if not provided via CLI.
*   CLI options for `pew create` to specify variable values and target output directory.
*   String replacement in template file content and filenames.
*   Generation of files and directory structures based on template configuration, including `root` path handling.
*   Basic error handling for missing templates, missing source files, and malformed `pew.yaml`.
*   Updating `pew init` to include a commented-out example of the `templates` configuration.
*   Documentation for the new feature.

## Out of Scope:
*   Advanced templating logic (e.g., loops, conditionals within templates). Only simple string replacement is in scope.
*   Fetching templates from remote sources (e.g., git repositories).
*   A UI or separate management interface for templates.
*   Complex conflict resolution for file overwrites (basic overwrite or error).
*   Template validation beyond basic structure.
---

# ✨ Key Features / User Stories
> 💡 *List the primary features or user stories that constitute this epic. These will likely be broken down further into individual tickets.*
> *You can link to existing story/feature tickets if they are already created, or list them as placeholders.*

*   **Feature 1:** `pew.yaml` Template Configuration (Story 1)
*   **Feature 2:** `pew create <templateName>` Command & Argument Parsing (Story 2)
*   **Feature 3:** CLI Options for Template Variables & Target Directory (Story 3)
*   **Feature 4:** Interactive Prompting for Template Variables (Story 4)
*   **Feature 5:** String Replacement in Template File Content (Story 5)
*   **Feature 6:** String Replacement in Template Filenames (Story 6)
*   **Feature 7:** File Output Generation with `root` Path Handling (Story 7)
*   **Feature 8:** Error Handling for `pew.yaml` (Story 8)
---

# 📈 Success Metrics / KPIs
> 💡 *How will we measure the success of this epic once completed? Define key performance indicators (KPIs).*
> *e.g., "User adoption rate of new features > X% within Y months," "Reduction in customer support tickets related to Z by A%."*

*   **KPI 1:** Number of users utilizing the `pew create <templateName>` command (tracked via analytics, if possible, or user feedback).
*   **KPI 2:** Positive feedback from users regarding time saved or improved workflow.
*   **KPI 3:** Number of custom templates defined by users (inferred from support channels/community discussions).
---

# 🔗 Dependencies
> 💡 *Are there any internal or external dependencies that could impact this epic?*

*   **Internal Dependencies:** Relies on existing `ConfigService`, `FileSystemService`, `UserInputService`, `LoggerService`, and `YamlService`.
*   **External Dependencies:** None explicitly, beyond standard Node.js environment and CLI libraries already in use (Commander, Inquirer).
---

# 💣 Potential Risks & Mitigation
> 💡 *What are the potential risks that could hinder the successful completion of this epic? How can they be mitigated?*

*   **Risk 1:** Complexity in `root` path handling logic.
    *   Mitigation: Write comprehensive unit tests covering various `root` and file path scenarios. Start with simpler cases and build up.
*   **Risk 2:** Ambiguity in variable/replacement precedence or application.
    *   Mitigation: Clearly define and document the precedence rules. Test thoroughly.
*   **Risk 3:** Performance issues if templates involve many files or large files.
    *   Mitigation: Focus on efficient file reading and string manipulation. Consider performance implications for very large numbers of replacements (though not expected to be an issue for typical use cases).
---

# 🧑‍🤝‍🧑 Stakeholders
> 💡 *Who are the key stakeholders for this epic? List individuals or teams.*

*   **Product Owner/Sponsor:** User (Codaveto)
*   **Development Lead(s):** AI Assistant (Self)
*   **Users:** Developers using `pew-pew-cli`.
---

# 🎨 High-Level UI/UX Considerations (If Applicable)
> 💡 *Describe any overarching UI/UX principles, themes, or major changes anticipated for this epic. Detailed designs will be in individual stories/features.*

*   CLI interactions should be clear and intuitive.
*   Prompts for variables should be straightforward.
*   Error messages should be helpful and guide the user.
*   The `pew.yaml` configuration should be well-documented with clear examples.
---

# 🛠️ High-Level Technical Considerations (If Applicable)
> 💡 *Outline any significant architectural changes, new technologies to be adopted, or major technical challenges anticipated.*

*   **Architecture Impact:**
    *   New methods in `CliService` to handle `pew create <templateName>`.
    *   Potential new `TemplateService` to encapsulate template processing logic (parsing, variable handling, file operations).
    *   Enhancements to `ConfigService` to read and validate the `templates` section of `pew.yaml`.
*   **Technology Stack Considerations:** Continue using existing stack (TypeScript, Node.js, Commander, Inquirer, js-yaml).
*   **Integration Points:** Integration with existing file system and configuration services.
---

# 🗓️ Estimated Timeline / Phases (Optional)
> 💡 *Provide a rough timeline or break the epic into logical phases with target completion dates. This is a high-level estimate.*

*   **Phase 1: Configuration & Basic Command Structure** (Stories 1, 2, 8)
*   **Phase 2: Variable Handling & CLI Options** (Stories 3, 4)
*   **Phase 3: Core Templating Logic** (Stories 5, 6)
*   **Phase 4: File Output & Finalization** (Story 7)
*   **Phase 5: Documentation & Release Prep**
---

# 🎯 Roles & Todos (High-Level)
> 💡 *High-level responsibilities for the epic. Detailed tasks will be in individual stories.*
> ```
> * 👑 **Epic Owner/Sponsor**: User (Codaveto)
>     - [X] Define strategic goals and business value (via user_requests)
>     - [ ] Provide feedback on implemented stories
> * 🗣️ **Product Management**: AI Assistant
>     - [X] Break down epic into features/stories (this document)
>     - [ ] Prioritize work within the epic (implicit in story ordering)
>     - [X] Gather and refine requirements (via clarifying questions)
> * 🏗️ **Lead Architect/Tech Lead**: AI Assistant
>     - [X] Define technical approach (in plan for stories)
>     - [ ] Oversee technical implementation (by generating code for stories)
> ```
---

# 👉️ Final Remarks & Open Questions
> 💡 *Any other relevant information, links to supporting documents, or open questions that need to be addressed.*
> - **Supporting Documents:** User request, clarifying questions and answers.
> - **Open Questions:**
>     - None at this stage. Further questions may arise during individual story implementation.

---
# User Stories
---

## User Story 1: Define `templates` structure in `pew.yaml` and add default example (1 Point)

**Description:**
Update the `ConfigService` and `pew.yaml` structure to support a new top-level `templates` map. Each entry in this map will define a named template with its configuration (variables, replacements, root path, and file list). The `pew init` command should also be updated to include a commented-out example of this new `templates` structure in the generated `pew.yaml`.

**Dependencies:** None

**Acceptance Criteria:**
*   AC1: `ConfigService` can correctly parse and validate the new `templates` map from `pew.yaml`.
*   AC2: The `templates` key in `pew.yaml` is a map where each key is a template name (string).
*   AC3: Each template object within the `templates` map must support:
    *   `variables`: An optional map (string keys, string values).
    *   `replacements`: An optional map (string keys, string values).
    *   `root`: An optional string representing a single path.
    *   `files`: A required list of strings (file paths).
*   AC4: When `pew init` is run, the generated `pew.yaml` (or the default global config if no local one is created) includes a commented-out section demonstrating the `templates` structure with clear descriptions for each field and sub-field. The example should be valid YAML if uncommented.
*   AC5: Project documentation (e.g., README.md or a dedicated config doc) is updated to reflect the new `templates` structure in `pew.yaml`.

## User Story 2: Implement `pew create <templateName>` command argument parsing (1 Point)

**Description:**
Introduce a new command `pew create <argument>`. The CLI must first determine if `<argument>` is a predefined subcommand of `create`. If not, it should treat `<argument>` as a `templateName` and attempt to find a corresponding template definition in the `pew.yaml` configuration's `templates` map.

**Dependencies:** Story 1 (for `pew.yaml` structure and `templates` map)

**Acceptance Criteria:**
*   AC1: A new command `pew create <argument>` is available in the CLI.
*   AC2: When `pew create <argument>` is executed, the system first checks if `<argument>` matches any existing, hardcoded subcommands of `pew create` (if any are planned for the future).
*   AC3: If `<argument>` is not a recognized subcommand, it is treated as `templateName`.
*   AC4: The system attempts to load the `pew.yaml` configuration and looks for `templateName` as a key within the `templates` map.
*   AC5: If `templateName` is not found in `pew.yaml`'s `templates` map, a user-friendly warning message is displayed (e.g., "Warning: Template '<templateName>' not found in pew.yaml."), and the command exits gracefully without error.
*   AC6: If `templateName` is found, the system proceeds to the template creation flow (this flow will be fully implemented in subsequent stories; for this story, it can be a stub or log a message indicating the template was found).

## User Story 3: Implement CLI option parsing for template variables and target directory (2 Points)

**Description:**
Enhance the `pew create <templateName>` command to accept command-line options for providing template variable values (e.g., `--ViewName=TestView`) and for specifying a target output directory (e.g., `--target=./output_here`).

**Dependencies:** Story 2 (for the base `pew create <templateName>` command)

**Acceptance Criteria:**
*   AC1: The `pew create <templateName>` command accepts dynamic options in the format `--<VariableName>=<Value>` to set values for template variables defined in `pew.yaml`.
*   AC2: Variable names passed via CLI options are case-sensitive and should match the keys defined in the `variables` map of the specified template in `pew.yaml`.
*   AC3: The command accepts a `--target=<PATH>` option to specify the directory where the templated files will be generated.
*   AC4: If the `--target` option is not provided, the output directory defaults to the current working directory from which the `pew` command was executed.
*   AC5: All parsed variable values from CLI options and the resolved target path are collected and made available to the subsequent template creation flow.
*   AC6: Help documentation for `pew create` is updated to show these new options.

## User Story 4: Implement interactive prompting for template variables (2 Points)

**Description:**
If a template defined in `pew.yaml` includes a `variables` map, the `pew create <templateName>` command should prompt the user to enter values for any of these variables that were not already supplied via CLI options (as per Story 3).

**Dependencies:** Story 2 (for identifying the template), Story 3 (for CLI variable overrides)

**Acceptance Criteria:**
*   AC1: When `pew create <templateName>` is executed for a template that has a `variables` map in its `pew.yaml` definition.
*   AC2: For each key (variable name) in the template's `variables` map:
    *   If a value for this variable was already provided via a CLI option (e.g., `--<VariableName>=<Value>`), the user is NOT prompted for this variable.
    *   Otherwise, the user is prompted to enter a value for `<VariableName>`. The prompt should clearly indicate which variable's value is being requested (e.g., "Enter value for ComponentName (default: DefaultComponent): ").
*   AC3: The default value shown in the prompt (if any) is taken from the value associated with the variable key in the `pew.yaml` `variables` map.
*   AC4: The user can input any string value, including an empty string, which is then used as the variable's value.
*   AC5: All collected variable values (whether from CLI options or interactive prompts) are collated and made available for the file processing and replacement stages.

## User Story 5: Implement string replacement in template file content (2 Points)

**Description:**
For each file specified in a template's `files` list, read its content and perform string replacements. Replacements are based on both the static `replacements` map and the dynamic `variables` (collected from CLI options, user prompts, or defaults in `pew.yaml`).

**Dependencies:** Story 4 (to have all variable values resolved)

**Acceptance Criteria:**
*   AC1: For each source file path listed in the active template's `files` array in `pew.yaml`:
    *   The system attempts to read the content of the source template file.
    *   If a source file cannot be read (e.g., does not exist), a warning is logged (e.g., "Warning: Source template file '<filePath>' not found, skipping."), and processing continues to the next file.
*   AC2: For the content of each successfully read source file:
    *   All occurrences of keys from the template's static `replacements` map are replaced with their corresponding values.
    *   All occurrences of keys (variable names) from the template's `variables` map (using the resolved values from Story 4) are replaced with their corresponding resolved values.
*   AC3: If a key is present in both the `replacements` map and the `variables` map, the value from the `variables` map takes precedence for replacement.
*   AC4: The string replacement is a direct, case-sensitive match of the key/variable name.
*   AC5: The fully processed content for each file is stored in memory, ready for writing to the output destination in a later story.

## User Story 6: Implement string replacement in template filenames (1 Point)

**Description:**
Extend the string replacement mechanism to also process the filenames/paths specified in the template's `files` list. This allows for dynamic filenames based on template variables (e.g., a file listed as `{{ComponentName}}.js` could become `MyButton.js`).

**Dependencies:** Story 4 (to have all variable values resolved)

**Acceptance Criteria:**
*   AC1: For each file path string in the active template's `files` list (from `pew.yaml`):
    *   All occurrences of variable placeholders (e.g., `{{VariableName}}` or the exact variable name string like `ComponentName`) in the file path string itself are replaced with their corresponding resolved variable values (from Story 4).
*   AC2: This replacement applies to both the filename part and any directory parts of the path string. For example, `src/{{Module}}/{{ComponentName}}.ts` becomes `src/Auth/LoginScreen.ts`.
*   AC3: The resulting processed file paths are stored and used when writing the files to the output destination in the next story.
*   AC4: If a variable used in a filename is not defined or resolved, its placeholder in the filename should remain as is or be replaced by an empty string, based on a consistent rule (e.g., prefer empty string if value is empty/null).

## User Story 7: Implement file output with `root` path handling (3 Points)

**Description:**
Write the processed template files (with replaced content and names) to the target output directory. The output directory structure should be determined by the template's `root` configuration value and the paths of the files in the `files` list.

**Dependencies:** Story 3 (for target directory), Story 5 (for processed file content), Story 6 (for processed file names/paths)

**Acceptance Criteria:**
*   AC1: All processed files are written to the correct target output directory (either specified by `--target` or the current working directory).
*   AC2: If the template definition in `pew.yaml` includes a `root` string (e.g., `root: "template_src/component_files"`):
    *   For each file from the `files` list whose original path starts with this `root` string (e.g., `template_src/component_files/ui/style.css`), the `root` prefix is stripped from its path (resulting in `ui/style.css`). This remaining relative path is then used to construct the final path within the target output directory (e.g., `TARGET_DIR/ui/style.css`).
*   AC3: If a file from the `files` list does NOT start with the template's `root` path (or if `root` is not specified), its processed path (from Story 6, which might be relative like `docs/{{ComponentName}}_readme.md`) is resolved directly within the target output directory (e.g., `TARGET_DIR/docs/MyComponent_readme.md`).
*   AC4: If `root` is not specified in the template's `pew.yaml` definition, all files from the `files` list are placed in the target output directory, preserving any relative path structure from their processed paths (e.g., if a processed path is `api/services/user_service.js`, it's written to `TARGET_DIR/api/services/user_service.js`).
*   AC5: The content written to each output file is the processed content from Story 5. The name of the output file is the processed name from Story 6.
*   AC6: Any necessary subdirectories within the target output directory are automatically created before writing files into them (e.g., if outputting to `TARGET_DIR/ui/style.css`, the `TARGET_DIR/ui` directory is created if it doesn't exist).

## User Story 8: Handle `pew.yaml` malformed errors (1 Point)

**Description:**
Implement error handling for scenarios where `pew.yaml` is malformed or contains an invalid `templates` structure, specifically when the `pew create <templateName>` command is invoked.

**Dependencies:** Story 1 (defines valid structure)

**Acceptance Criteria:**
*   AC1: If `pew.yaml` exists but is not valid YAML (e.g., syntax error), and `pew create <templateName>` is run, an error message is displayed (e.g., "Error: Malformed pew.yaml. Please check its syntax."), and the CLI aborts gracefully.
*   AC2: If `pew.yaml` is valid YAML but the `templates` section (or a specific template entry being accessed) does not conform to the expected structure (e.g., `files` is not a list, `variables` is not a map), and `pew create <templateName>` is run, an error message is displayed (e.g., "Error: Invalid template structure for '<templateName>' in pew.yaml. 'files' must be a list."), and the CLI aborts gracefully.
*   AC3: These checks occur before attempting to process the template.
---