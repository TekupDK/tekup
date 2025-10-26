module.exports = {
  // TypeScript/JavaScript files
  '**/*.{ts,tsx,js,jsx}': [
    'eslint --fix',
    'prettier --write',
  ],
  
  // JSON files
  '**/*.json': [
    'prettier --write',
  ],
  
  // Markdown files
  '**/*.md': [
    'prettier --write',
  ],
  
  // Package.json files - run dependency checks
  '**/package.json': [
    'pnpm audit --audit-level high || true',
  ],
  
  // Run tests for affected TypeScript files
  '**/*.{ts,tsx}': () => [
    'pnpm test --findRelatedTests --passWithNoTests',
  ],
};
