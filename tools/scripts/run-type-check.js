// This is a Node.js script to run type-check
const { execSync } = require('child_process');

try {
  console.log('Running TypeScript type check...');
  const output = execSync('pnpm run type-check --project config/typescript/tsconfig.json', { encoding: 'utf8' });
  console.log(output);
  console.log('TypeScript type check completed successfully!');
} catch (error) {
  console.error('Error during TypeScript type check:');
  console.error(error.stdout);
}
