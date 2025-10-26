#!/usr/bin/env node
/**
 * TekUp App Generator - ensures all new apps follow standards
 * Usage: pnpm create-app my-new-app --type=nextjs|nestjs
 */

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const appName = process.argv[2];
const appType = process.argv.find(arg => arg.startsWith('--type='))?.split('=')[1] || 'nextjs';

if (!appName) {
  console.error('❌ Usage: pnpm create-app <app-name> --type=nextjs|nestjs');
  process.exit(1);
}

const appPath = join('apps', appName);

console.log(`🚀 Creating ${appType} app: ${appName}`);

// Create directory
mkdirSync(appPath, { recursive: true });

// Standard package.json template
const packageJson = {
  name: `@tekup/${appName}`,
  version: '0.1.0',
  private: true,
  scripts: appType === 'nextjs' ? {
    dev: 'next dev',
    build: 'next build', 
    start: 'next start',
    lint: 'next lint',
    test: 'vitest run',
    'test:watch': 'vitest'
  } : {
    dev: 'nest start --watch',
    build: 'nest build',
    start: 'nest start',
    lint: 'eslint src --ext .ts',
    test: 'jest',
    'test:watch': 'jest --watch'
  },
  dependencies: appType === 'nextjs' ? {
    next: '14.2.4',
    react: '18.3.1',
    'react-dom': '18.3.1',
    '@tekup/shared': 'workspace:*',
    '@tekup/ui': 'workspace:*'
  } : {
    '@nestjs/common': '^10.4.20',
    '@nestjs/core': '^10.4.20',
    '@tekup/shared': 'workspace:*'
  },
  devDependencies: {
    '@types/node': '^20.14.10',
    typescript: '^5.5.4',
    tailwindcss: '^4.1.1', // Always v4.1.1
    autoprefixer: '^10.4.21',
    postcss: '^8.5.6',
    ...(appType === 'nextjs' ? {
      '@types/react': '^18.3.3',
      '@types/react-dom': '^18.3.0',
      vitest: '^1.6.0'
    } : {
      '@nestjs/cli': '^10.0.0',
      jest: '^29.7.0'
    })
  }
};

// Write package.json
writeFileSync(
  join(appPath, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

// Create tailwind.config.mjs (v4 style)
const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}'
  ]
};`;

writeFileSync(join(appPath, 'tailwind.config.mjs'), tailwindConfig);

// Create standard v4 CSS
const globalsCss = `@import "tailwindcss";

@theme {
  --font-family-sans: Inter, system-ui, sans-serif;
  --color-brand: #7c3aed;
}`;

mkdirSync(join(appPath, 'src/app'), { recursive: true });
writeFileSync(join(appPath, 'src/app/globals.css'), globalsCss);

// Update workspace
execSync('pnpm install', { stdio: 'inherit' });

console.log(`✅ Created ${appName} with:
- pnpm workspace integration
- Tailwind v4.1.1 
- Standard TekUp structure
- Shared packages linked

Next: cd apps/${appName} && pnpm dev`);
