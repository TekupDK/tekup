#!/usr/bin/env node
/**
 * Standardize dependency versions across all packages
 */
import { readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();

const TARGET_VERSIONS = {
  'typescript': '^5.6.3',
  '@nestjs/common': '^10.4.20',
  '@nestjs/core': '^10.4.20',
  '@nestjs/testing': '^10.4.20',
  '@nestjs/cli': '^10.4.9',
  '@prisma/client': '^5.22.0',
  'prisma': '^5.22.0',
  '@types/node': '^20.14.10'
};

function log(msg) {
  console.log(`[standardize-deps] ${msg}`);
}

function findPackageJsonFiles(dir, files = []) {
  const entries = readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!['node_modules', 'dist', '.next', 'build'].includes(entry)) {
        findPackageJsonFiles(fullPath, files);
      }
    } else if (entry === 'package.json') {
      files.push(fullPath);
    }
  }
  
  return files;
}

function updatePackageJson(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const pkg = JSON.parse(content);
    
    let modified = false;
    
    // Update dependencies
    for (const [depName, targetVersion] of Object.entries(TARGET_VERSIONS)) {
      if (pkg.dependencies && pkg.dependencies[depName]) {
        if (pkg.dependencies[depName] !== targetVersion) {
          log(`Updating ${depName} in ${relative(ROOT, filePath)}: ${pkg.dependencies[depName]} → ${targetVersion}`);
          pkg.dependencies[depName] = targetVersion;
          modified = true;
        }
      }
      
      if (pkg.devDependencies && pkg.devDependencies[depName]) {
        if (pkg.devDependencies[depName] !== targetVersion) {
          log(`Updating ${depName} in ${relative(ROOT, filePath)}: ${pkg.devDependencies[depName]} → ${targetVersion}`);
          pkg.devDependencies[depName] = targetVersion;
          modified = true;
        }
      }
    }
    
    if (modified) {
      writeFileSync(filePath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
      return true;
    }
    
  } catch (error) {
    log(`Error processing ${relative(ROOT, filePath)}: ${error.message}`);
  }
  
  return false;
}

function main() {
  log('Standardizing dependency versions...');
  
  const packageFiles = findPackageJsonFiles(ROOT);
  let filesModified = 0;
  
  for (const file of packageFiles) {
    if (updatePackageJson(file)) {
      filesModified++;
    }
  }
  
  log(`Updated ${filesModified} package.json files.`);
  
  if (filesModified > 0) {
    log('Run "pnpm install" to update lockfile.');
  }
}

main();
