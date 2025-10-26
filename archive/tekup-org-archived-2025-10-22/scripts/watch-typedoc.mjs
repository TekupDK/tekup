#!/usr/bin/env node

/**
 * TypeDoc Watch Script
 * 
 * Monitors package changes and regenerates TypeDoc documentation automatically
 */

import { watch } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

let isGenerating = false;
let pendingRegeneration = false;

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

async function regenerateTypeDocs() {
  if (isGenerating) {
    pendingRegeneration = true;
    return;
  }

  try {
    isGenerating = true;
    log('🔄 Regenerating TypeDoc documentation...');
    
    execSync('node scripts/generate-typedoc.mjs', { 
      cwd: rootDir, 
      stdio: 'inherit' 
    });
    
    log('✅ TypeDoc documentation regenerated successfully', 'success');
    
    if (pendingRegeneration) {
      pendingRegeneration = false;
      setTimeout(() => regenerateTypeDocs(), 1000);
    }
  } catch (error) {
    log(`❌ Failed to regenerate TypeDoc: ${error.message}`, 'error');
  } finally {
    isGenerating = false;
  }
}

const debouncedRegenerate = debounce(regenerateTypeDocs, 2000);

function startWatching() {
  const packagesDir = join(rootDir, 'packages');
  
  if (!existsSync(packagesDir)) {
    log('Packages directory not found, exiting...', 'error');
    process.exit(1);
  }

  log('👀 Starting TypeDoc watch mode...');
  log(`📁 Watching: ${packagesDir}`);
  log('💡 Press Ctrl+C to stop watching');

  // Watch the packages directory recursively
  const watcher = watch(packagesDir, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    
    // Only watch TypeScript files
    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) {
      log(`📝 File changed: ${filename}`);
      debouncedRegenerate();
    }
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('🛑 Stopping TypeDoc watch mode...');
    watcher.close();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    log('🛑 Stopping TypeDoc watch mode...');
    watcher.close();
    process.exit(0);
  });

  // Initial generation
  log('🚀 Running initial TypeDoc generation...');
  regenerateTypeDocs();
}

startWatching();