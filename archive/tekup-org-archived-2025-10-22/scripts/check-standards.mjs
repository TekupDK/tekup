#!/usr/bin/env node
/**
 * Standards Checker - validates TekUp monorepo standards
 * Runs in CI and locally to ensure consistency
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

let errors = 0;

function error(msg) {
  console.error(`❌ ${msg}`);
  errors++;
}

function success(msg) {
  console.log(`✅ ${msg}`);
}

console.log('🔍 Checking TekUp standards...\n');

// Check 1: No legacy package manager artifacts
if (existsSync('package-lock.json')) error('package-lock.json found - use pnpm only');
if (existsSync('yarn.lock')) error('yarn.lock found - use pnpm only');
else success('No legacy lockfiles (pnpm-only)');

// Check 2: All apps use Tailwind v4.1.1
const apps = readdirSync('apps', { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

apps.forEach(app => {
  const pkgPath = join('apps', app, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    const tailwind = pkg.devDependencies?.tailwindcss || pkg.dependencies?.tailwindcss;
    
    if (tailwind) {
      if (!tailwind.includes('4.1.1')) {
        error(`${app}: uses Tailwind ${tailwind}, should be ^4.1.1`);
      } else {
        success(`${app}: uses Tailwind v4.1.1`);
      }
    }
  }
});

// Check 3: All apps use workspace packages
apps.forEach(app => {
  const pkgPath = join('apps', app, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    
    let hasWorkspaceDep = false;
    Object.keys(deps).forEach(dep => {
      if (dep.startsWith('@tekup/') && deps[dep] === 'workspace:*') {
        hasWorkspaceDep = true;
      }
    });
    
    if (hasWorkspaceDep) {
      success(`${app}: uses workspace packages`);
    }
  }
});

// Check 4: pnpm packageManager is set
const rootPkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (rootPkg.packageManager && rootPkg.packageManager.startsWith('pnpm@')) {
  success('pnpm packageManager enforced in root package.json');
} else {
  error('Missing pnpm packageManager in root package.json');
}

console.log(`\n${errors === 0 ? '🎉' : '💥'} Standards check: ${errors} errors\n`);

if (errors > 0) {
  console.log('Fix standards with:');
  console.log('- Remove any legacy lockfiles (package-lock.json/yarn.lock)');
  console.log('- Update Tailwind to ^4.1.1 in all apps');
  console.log('- Use pnpm create-app for new apps');
  process.exit(1);
}
