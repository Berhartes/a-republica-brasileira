Chore: Clean up project structure and remove unused files

- Removed `public/assets/` directory, which appeared to contain build artifacts.
- Removed `public/index.html`, which seemed to be a duplicate or build artifact.
- Removed loose test/script files from the project root: `testar-funcoes.js` and `teste-simples.js`.

These changes were made to simplify the project structure and remove potentially confusing or unnecessary files, as per user request and previous analysis. Firebase-related scripts were kept intact as instructed.

The project was tested locally after these changes, and the Vite development server started successfully.
