# Contributing to pew-pew-cli

First off, thank you for considering contributing to pew-pew-cli! Your help is appreciated. Please take a moment to review this document to ensure a smooth contribution process.

We welcome contributions in various forms, including:
*   Reporting bugs
*   Suggesting enhancements or new features
*   Improving documentation
*   Submitting code changes (bug fixes, features)

Please note this project adheres to the [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

1.  **Fork the Repository:** Click the "Fork" button on the top right of the [pew-pew-cli GitHub repository](https://github.com/ultrawideturbodev/pew-pew-cli).
2.  **Clone Your Fork:**
    ```bash
    git clone https://github.com/YOUR_USERNAME/pew-pew-cli.git
    cd pew-pew-cli
    ```
3.  **Install Dependencies:** Ensure you have Node.js and npm installed. Then, run:
    ```bash
    npm install
    ```
4.  **Run Tests:** Verify the baseline tests pass:
    ```bash
    npm test
    ```

## Making Changes

1.  **Create a Branch:** Create a descriptive branch name for your changes:
    ```bash
    git checkout -b feature/your-descriptive-feature-name
    # or
    git checkout -b fix/short-description-of-fix
    ```
2.  **Implement Changes:** Make your code changes, additions, or fixes.
3.  **Test Your Changes:** Ensure existing tests pass (`npm test`) and add new tests if you are introducing new functionality.
4.  **Commit Signing:** **Crucially, all commits merged into the `main` branch MUST be signed.** Please configure commit signing in your Git client. You can find instructions on how to set this up in the [GitHub documentation on signing commits](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits). Commit your changes with the `-S` flag:
    ```bash
    git add .
    git commit -S -m "feat: Add new feature for X"
    # or
    git commit -S -m "fix: Resolve issue Y"
    ```
    *(Consider using [Conventional Commits](https://www.conventionalcommits.org/) format for commit messages).*

## Submitting Pull Requests

1.  **Push Your Branch:** Push your local branch to your fork on GitHub:
    ```bash
    git push origin feature/your-descriptive-feature-name
    ```
2.  **Open a Pull Request:** Navigate to the original `pew-pew-cli` repository on GitHub and click the "New pull request" button. GitHub should automatically detect your pushed branch.
3.  **Target Branch:** Ensure the pull request targets the `main` branch of the `ultrawideturbodev/pew-pew-cli` repository.
4.  **Provide Details:** Fill out the pull request template with a clear title and description explaining your changes, why they are needed, and how they were tested. Link any relevant issues.
5.  **Review Process:** Maintainers will review your pull request. Address any feedback or requested changes. Once approved, your signed commits will be merged into `main`.

## Reporting Bugs / Suggesting Features

Please use the GitHub Issue tracker for reporting bugs or suggesting new features/enhancements. We have provided issue templates (which will be available shortly after this setup phase) to guide you in providing the necessary information.

*   **Bug Reports:** Clearly describe the issue, steps to reproduce, expected behavior, and actual behavior. Include your environment details.
*   **Feature Requests/Enhancements:** Explain the problem your suggestion solves, the proposed solution, and any alternatives considered.

Thank you again for your contribution! 