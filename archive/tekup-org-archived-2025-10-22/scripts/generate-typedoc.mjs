#!/usr/bin/env node

/**
 * TypeDoc Generation Pipeline
 * 
 * This script generates comprehensive API documentation for all packages
 * using TypeDoc with enhanced configuration and cross-references.
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Configuration
const config = {
  packagesDir: join(rootDir, 'packages'),
  outputDir: join(rootDir, 'docs/site/static/api-docs'),
  docusaurusDocsDir: join(rootDir, 'docs/site/docs/packages'),
  tempDir: join(rootDir, '.temp-typedoc'),
  typedocConfig: join(rootDir, 'typedoc.json'),
};

// Package categories for better organization
const packageCategories = {
  'shared': { category: 'Core', priority: 1, description: 'Shared utilities and types' },
  'api-client': { category: 'Core', priority: 2, description: 'API client library' },
  'auth': { category: 'Authentication', priority: 3, description: 'Authentication utilities' },
  'config': { category: 'Configuration', priority: 4, description: 'Configuration management' },
  'ui': { category: 'UI Components', priority: 5, description: 'Reusable UI components' },
  'testing': { category: 'Testing', priority: 6, description: 'Testing utilities' },
  'sso': { category: 'Authentication', priority: 7, description: 'Single Sign-On utilities' },
  'consciousness': { category: 'AI', priority: 8, description: 'AI consciousness framework' },
  'ai-consciousness': { category: 'AI', priority: 9, description: 'Advanced AI consciousness' },
  'evolution-engine': { category: 'AI', priority: 10, description: 'AI evolution engine' },
  'eslint-config': { category: 'Development', priority: 11, description: 'ESLint configuration' },
};

/**
 * Utility functions
 */
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    log(`Created directory: ${dir}`);
  }
}

function getPackages() {
  if (!existsSync(config.packagesDir)) {
    log(`Packages directory not found: ${config.packagesDir}`, 'error');
    return [];
  }

  return readdirSync(config.packagesDir)
    .filter(name => {
      const packageDir = join(config.packagesDir, name);
      const packageJsonPath = join(packageDir, 'package.json');
      const srcDir = join(packageDir, 'src');
      const indexFile = join(srcDir, 'index.ts');
      
      return statSync(packageDir).isDirectory() && 
             existsSync(packageJsonPath) && 
             existsSync(srcDir) && 
             existsSync(indexFile);
    })
    .map(name => {
      const packageDir = join(config.packagesDir, name);
      const packageJsonPath = join(packageDir, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      
      return {
        name,
        path: packageDir,
        packageJson,
        category: packageCategories[name] || { category: 'Other', priority: 999, description: 'Package description' }
      };
    })
    .sort((a, b) => a.category.priority - b.category.priority);
}

function generatePackageReadme(pkg) {
  const readmePath = join(pkg.path, 'README.md');
  
  if (existsSync(readmePath)) {
    return; // README already exists
  }

  const readme = `# ${pkg.packageJson.name}

${pkg.category.description}

## Installation

\`\`\`bash
pnpm add ${pkg.packageJson.name}
\`\`\`

## Usage

\`\`\`typescript
import { } from '${pkg.packageJson.name}';
\`\`\`

## API Documentation

See the [API documentation](../../api-docs/${pkg.name}) for detailed information about all exports.

## Contributing

Please read our [Contributing Guide](../../development/contributing.md) for details on our code of conduct and the process for submitting pull requests.
`;

  writeFileSync(readmePath, readme);
  log(`Generated README for ${pkg.name}`);
}

function generateDocusaurusPages(packages) {
  ensureDir(config.docusaurusDocsDir);

  // Generate overview page
  const overviewContent = `# Shared Packages

TekUp platform consists of several shared packages that provide common functionality across all applications.

## Package Overview

${packages.map(pkg => `
### ${pkg.packageJson.name}

**Category:** ${pkg.category.category}  
**Description:** ${pkg.category.description}  
**Version:** ${pkg.packageJson.version}

${pkg.packageJson.description || 'No description available.'}

- [API Documentation](/api-docs/${pkg.name})
- [Source Code](https://github.com/TekUp-org/tekup-org/tree/main/packages/${pkg.name})

`).join('')}

## Installation

All packages are available via pnpm and follow the \`@tekup/\` namespace:

\`\`\`bash
# Install a specific package
pnpm add @tekup/shared

# Install multiple packages
pnpm add @tekup/shared @tekup/api-client @tekup/auth
\`\`\`

## Usage Patterns

### Core Packages
The core packages (\`@tekup/shared\`, \`@tekup/api-client\`) provide fundamental functionality:

\`\`\`typescript
import { ApiClient } from '@tekup/api-client';
import { Logger } from '@tekup/shared';

const client = new ApiClient();
const logger = new Logger();
\`\`\`

### Authentication
Authentication packages provide secure authentication utilities:

\`\`\`typescript
import { AuthService } from '@tekup/auth';
import { SSOProvider } from '@tekup/sso';

const auth = new AuthService();
const sso = new SSOProvider();
\`\`\`

### UI Components
UI packages provide reusable React components:

\`\`\`typescript
import { Button, Card } from '@tekup/ui';

function MyComponent() {
  return (
    <Card>
      <Button variant="primary">Click me</Button>
    </Card>
  );
}
\`\`\`

## Development

### Building Packages
\`\`\`bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @tekup/shared build
\`\`\`

### Testing Packages
\`\`\`bash
# Test all packages
pnpm test

# Test specific package
pnpm --filter @tekup/shared test
\`\`\`

### Linting
\`\`\`bash
# Lint all packages
pnpm lint

# Lint specific package
pnpm --filter @tekup/shared lint
\`\`\`
`;

  writeFileSync(join(config.docusaurusDocsDir, 'overview.md'), overviewContent);
  log('Generated packages overview page');

  // Generate individual package pages
  packages.forEach(pkg => {
    const packageContent = `# ${pkg.packageJson.name}

${pkg.category.description}

## Overview

${pkg.packageJson.description || 'No description available.'}

**Category:** ${pkg.category.category}  
**Version:** ${pkg.packageJson.version}  
**License:** ${pkg.packageJson.license || 'MIT'}

## Installation

\`\`\`bash
pnpm add ${pkg.packageJson.name}
\`\`\`

## Quick Start

\`\`\`typescript
import { } from '${pkg.packageJson.name}';

// Usage example will be added based on the package functionality
\`\`\`

## API Reference

For detailed API documentation, see the [TypeDoc generated documentation](/api-docs/${pkg.name}).

## Dependencies

${pkg.packageJson.dependencies ? Object.keys(pkg.packageJson.dependencies).map(dep => `- \`${dep}\``).join('\n') : 'No dependencies'}

## Development Dependencies

${pkg.packageJson.devDependencies ? Object.keys(pkg.packageJson.devDependencies).map(dep => `- \`${dep}\``).join('\n') : 'No development dependencies'}

## Scripts

${pkg.packageJson.scripts ? Object.entries(pkg.packageJson.scripts).map(([script, command]) => `- \`${script}\`: ${command}`).join('\n') : 'No scripts defined'}

## Source Code

- [GitHub Repository](https://github.com/TekUp-org/tekup-org/tree/main/packages/${pkg.name})
- [Package Directory](https://github.com/TekUp-org/tekup-org/tree/main/packages/${pkg.name}/src)

## Contributing

Please read our [Contributing Guide](../development/contributing.md) for details on our code of conduct and the process for submitting pull requests.

## Changelog

See [CHANGELOG.md](https://github.com/TekUp-org/tekup-org/blob/main/packages/${pkg.name}/CHANGELOG.md) for a list of changes.
`;

    writeFileSync(join(config.docusaurusDocsDir, `${pkg.name}.md`), packageContent);
    log(`Generated Docusaurus page for ${pkg.name}`);
  });
}

function runTypeDoc() {
  try {
    log('Starting TypeDoc generation...');
    
    // Ensure output directory exists
    ensureDir(config.outputDir);
    
    // Run TypeDoc
    const command = `npx typedoc --options ${config.typedocConfig}`;
    log(`Running: ${command}`);
    
    execSync(command, { 
      cwd: rootDir, 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    log('TypeDoc generation completed successfully', 'success');
    return true;
  } catch (error) {
    log(`TypeDoc generation failed: ${error.message}`, 'error');
    return false;
  }
}

function generateBuildScript() {
  const buildScript = `#!/usr/bin/env node

/**
 * Automated TypeDoc Build Script
 * This script is called during the build process to regenerate documentation
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'success' ? '✅' : 'ℹ️';
  console.log(\`\${prefix} [\${timestamp}] \${message}\`);
}

function main() {
  try {
    log('Starting automated TypeDoc generation...');
    
    // Check if packages have changed
    const packagesDir = join(rootDir, 'packages');
    if (!existsSync(packagesDir)) {
      log('No packages directory found, skipping TypeDoc generation');
      return;
    }
    
    // Run the main generation script
    execSync('node scripts/generate-typedoc.mjs', { 
      cwd: rootDir, 
      stdio: 'inherit' 
    });
    
    log('Automated TypeDoc generation completed', 'success');
  } catch (error) {
    log(\`Automated TypeDoc generation failed: \${error.message}\`, 'error');
    process.exit(1);
  }
}

main();
`;

  writeFileSync(join(rootDir, 'scripts/build-typedoc.mjs'), buildScript);
  log('Generated automated build script');
}

function updatePackageJsonScripts() {
  const packageJsonPath = join(rootDir, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  
  // Update scripts
  packageJson.scripts = {
    ...packageJson.scripts,
    'docs:typedoc': 'node scripts/generate-typedoc.mjs',
    'docs:typedoc:build': 'node scripts/build-typedoc.mjs',
    'docs:typedoc:watch': 'nodemon --watch packages --ext ts,tsx,js,jsx --exec "node scripts/generate-typedoc.mjs"'
  };
  
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  log('Updated package.json scripts');
}

/**
 * Main execution
 */
async function main() {
  try {
    log('🚀 Starting TypeDoc Generation Pipeline');
    
    // Get all packages
    const packages = getPackages();
    log(`Found ${packages.length} packages to document`);
    
    if (packages.length === 0) {
      log('No packages found to document', 'warn');
      return;
    }
    
    // Generate README files for packages that don't have them
    log('📝 Generating package README files...');
    packages.forEach(generatePackageReadme);
    
    // Generate Docusaurus pages
    log('📚 Generating Docusaurus documentation pages...');
    generateDocusaurusPages(packages);
    
    // Run TypeDoc generation
    log('🔧 Running TypeDoc generation...');
    const success = runTypeDoc();
    
    if (!success) {
      log('TypeDoc generation failed', 'error');
      process.exit(1);
    }
    
    // Generate build scripts
    log('⚙️ Generating build scripts...');
    generateBuildScript();
    
    // Update package.json scripts
    log('📦 Updating package.json scripts...');
    updatePackageJsonScripts();
    
    log('✨ TypeDoc Generation Pipeline completed successfully!', 'success');
    log(`📖 Documentation available at: ${config.outputDir}`);
    log(`🌐 Docusaurus pages available at: ${config.docusaurusDocsDir}`);
    
  } catch (error) {
    log(`Pipeline failed: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, getPackages, runTypeDoc };