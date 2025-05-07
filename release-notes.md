### May 7, 2025

#### 💔 Breaking
- Replaced `.pew/config/` directory structure with a single `pew.yaml` file at the project root for local configuration
- Removed separate `paths.yaml` and `core.yaml` files in favor of a unified `pew.yaml` structure
- Changed configuration loading logic to search for `pew.yaml` instead of `.pew/config/paths.yaml`

#### 🔧 Developer Experience
- Added ESLint v9 and Prettier configuration with `npm run fix` command for automated code quality improvements
- Fixed TypeScript type warnings across the codebase, replacing `any` types with more specific types
- Improved error handling patterns with proper type checking of unknown errors
- Enhanced code maintainability with consistent patterns for error reporting

#### 🛠️ Improvements
- Refactored `config.service.ts` and `yaml.service.ts` to use proper TypeScript typing
- Enhanced error handling in all service classes for better runtime stability
- Updated import paths to ensure consistency across the codebase
- Implemented proper error handling with Error instance checking

#### 🧰 Dependency Updates
- Updated inquirer from 8.2.5 to 12.6.0
- Updated ts-jest from 29.1.1 to 29.3.2
- Updated @types/node from 22.14.0 to 22.15.14

#### 🧹 Chores
- Updated ESLint to v9 with modern configuration format
- Added ESLint and Prettier scripts to package.json for consistent code style
- Cleaned up unused variables and parameters across the codebase 