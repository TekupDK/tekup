#!/usr/bin/env node
/**
 * Script to fix JSX syntax issues in React components
 * Fixes escaped quotes in className attributes and other JSX syntax issues
 */

const fs = require('fs');
const path = require('path');

// Function to recursively find all .tsx files
function findTsxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findTsxFiles(filePath, fileList);
    } else if (file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Function to fix JSX syntax issues
function fixJsxSyntax(content) {
  let fixed = content;

  // Fix escaped quotes in className attributes
  fixed = fixed.replace(/className=\\"([^"]*?)\\"/g, 'className="$1"');
  
  // Fix escaped quotes in other attributes
  fixed = fixed.replace(/(\w+)=\\"([^"]*?)\\"/g, '$1="$2"');
  
  // Fix escaped quotes in string literals within JSX
  fixed = fixed.replace(/>\s*\\"([^"]*?)\\"\s*</g, '>"$1"<');
  
  // Fix any remaining escaped quotes in JSX content
  fixed = fixed.replace(/\\"([^"]*?)\\"/g, '"$1"');
  
  // Fix stroke attributes specifically
  fixed = fixed.replace(/stroke=\\"currentColor\\"/g, 'stroke="currentColor"');
  fixed = fixed.replace(/strokeLinecap=\\"round\\"/g, 'strokeLinecap="round"');
  fixed = fixed.replace(/strokeLinejoin=\\"round\\"/g, 'strokeLinejoin="round"');
  fixed = fixed.replace(/fill=\\"none\\"/g, 'fill="none"');
  fixed = fixed.replace(/viewBox=\\"([^"]*?)\\"/g, 'viewBox="$1"');
  
  // Fix d attribute in path elements
  fixed = fixed.replace(/d=\\"([^"]*?)\\"/g, 'd="$1"');
  
  // Fix type attributes
  fixed = fixed.replace(/type=\\"button\\"/g, 'type="button"');
  fixed = fixed.replace(/type=\\"text\\"/g, 'type="text"');
  fixed = fixed.replace(/type=\\"email\\"/g, 'type="email"');
  fixed = fixed.replace(/type=\\"password\\"/g, 'type="password"');
  
  return fixed;
}

// Main execution
try {
  logger.info('Starting JSX syntax fix...');
  
  const rendererDir = path.join(__dirname, 'src', 'renderer');
  const tsxFiles = findTsxFiles(rendererDir);
  
  logger.info(`Found ${tsxFiles.length} .tsx files to process`);
  
  let fixedCount = 0;
  
  tsxFiles.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const fixedContent = fixJsxSyntax(content);
      
      if (content !== fixedContent) {
        fs.writeFileSync(filePath, fixedContent, 'utf8');
        logger.info(`Fixed: ${path.relative(__dirname, filePath)}`);
        fixedCount++;
      }
    } catch (error) {
      logger.error(`Error processing ${filePath}:`, error.message);
    }
  });
  
  logger.info(`✅ JSX syntax fix completed. Fixed ${fixedCount} files.`);
  
} catch (error) {
  logger.error('❌ Error during JSX syntax fix:', error.message);
  process.exit(1);
}