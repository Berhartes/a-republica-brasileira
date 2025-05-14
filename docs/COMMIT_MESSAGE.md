Refactor: Unify configurations and resolve structural issues

- Consolidated Vite configuration into `config/vite/vite.config.ts`.
- Standardized server port to 5174 in the Vite configuration.
- Removed duplicate/obsolete configuration file `vite.config.ts` from the project root.
- Consolidated `package.json` by integrating necessary changes from `package.json.new` and `package.json.update`, then removed these auxiliary files.
- Updated `config/typescript/tsconfig.json` to remove the obsolete reference to the root `vite.config.ts`.
- Verified paths in `index.html` for CSS and JS entry points.

These changes address the structural inconsistencies identified in the analysis report, aiming for a more stable and maintainable project setup. The Vite development server is confirmed to be running on port 5174.

Note: Firebase emulator setup (part of `pnpm run dev:full`) was not addressed in this commit due to current environment limitations (Java dependency and Firebase login being out of scope for this correction phase). The focus was on rectifying the web application's structure and core build process.
