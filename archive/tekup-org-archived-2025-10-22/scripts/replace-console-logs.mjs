#!/usr/bin/env node
/**
 * Replace console.log/error statements with proper @tekup/shared logger calls
 */
import { readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
const APPS_DIR = join(ROOT, 'apps');
const PACKAGES_DIR = join(ROOT, 'packages');

function log(msg) {
  console.log(`[replace-logs] ${msg}`);
}

function findTsFiles(dir, files = []) {
  const entries = readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, dist, .next, build directories
      if (['node_modules', 'dist', '.next', 'build', 'coverage'].includes(entry)) {
        continue;
      }
      findTsFiles(fullPath, files);
    } else if (entry.match(/\.(ts|tsx|js|jsx)$/) && !entry.includes('.test.') && !entry.includes('.spec.')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function replaceConsoleInFile(filePath) {
  try {
    let content = readFileSync(filePath, 'utf-8');
    let modified = false;
    
    // Skip files that already use logger
    if (content.includes('import') && content.includes('createLogger')) {
      return false;
    }
    
    // Count console statements to decide if it's worth replacing
    const consoleMatches = content.match(/console\.(log|error|warn|info|debug)/g);
    if (!consoleMatches || consoleMatches.length === 0) {
      return false;
    }
    
    // Skip demo/test files with excessive console.log (likely intentional)
    if (consoleMatches.length > 50) {
      log(`Skipping ${relative(ROOT, filePath)} - too many console statements (${consoleMatches.length})`);
      return false;
    }
    
    // Add logger import at the top
    const hasImports = content.includes('import');
    if (hasImports) {
      // Find the last import statement
      const lines = content.split('\n');
      let lastImportIndex = -1;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import') || lines[i].trim().startsWith('export')) {
          lastImportIndex = i;
        }
      }
      
      if (lastImportIndex >= 0) {
        const serviceName = relative(ROOT, filePath)
          .replace(/[^a-zA-Z0-9]/g, '-')
          .replace(/^-+|-+$/g, '')
          .substring(0, 30);
        
        lines.splice(lastImportIndex + 1, 0, `import { createLogger } from '@tekup/shared';`);
        lines.splice(lastImportIndex + 2, 0, `const logger = createLogger('${serviceName}');`);
        lines.splice(lastImportIndex + 3, 0, '');
        
        content = lines.join('\n');
        modified = true;
      }
    }
    
    // Replace console statements
    content = content.replace(/console\.error\(/g, 'logger.error(');
    content = content.replace(/console\.warn\(/g, 'logger.warn(');
    content = content.replace(/console\.info\(/g, 'logger.info(');
    content = content.replace(/console\.log\(/g, 'logger.info(');
    content = content.replace(/console\.debug\(/g, 'logger.debug(');
    
    if (modified || content !== readFileSync(filePath, 'utf-8')) {
      writeFileSync(filePath, content, 'utf-8');
      log(`Updated ${relative(ROOT, filePath)} (${consoleMatches.length} statements)`);
      return true;
    }
    
  } catch (error) {
    log(`Error processing ${relative(ROOT, filePath)}: ${error.message}`);
  }
  
  return false;
}

function main() {
  log('Starting console.log replacement...');
  
  const allFiles = [
    ...findTsFiles(APPS_DIR),
    ...findTsFiles(PACKAGES_DIR)
  ];
  
  let filesModified = 0;
  let totalConsoleStatements = 0;
  
  for (const file of allFiles) {
    if (replaceConsoleInFile(file)) {
      filesModified++;
    }
  }
  
  log(`Completed! Modified ${filesModified} files.`);
}

main();
