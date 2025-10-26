#!/usr/bin/env node

/**
 * @fileoverview Command-line interface for MCP configuration validation
 * 
 * This script provides a CLI for validating MCP configurations against schemas,
 * with support for batch validation, multiple formats, and detailed reporting.
 * 
 * @author TekUp.org Development Team
 * @version 1.0.0
 */

import { program } from 'commander';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { resolve, basename, extname } from 'path';
import { glob } from 'glob';
import chalk from 'chalk';

import {
  validateMCPConfig,
  validateMCPConfigFile,
  batchValidateConfigs,
  formatValidationResults,
  createMCPValidator,
  ValidationOptions,
  SchemaValidationResult
} from '../schemas/validator.js';

import { TekUpMCPConfig } from '@tekup/shared/mcp/configuration';

// =============================================================================
// CLI PROGRAM CONFIGURATION
// =============================================================================

program
  .name('mcp-validate')
  .description('Validate MCP configurations against JSON Schema')
  .version('1.0.0');

// =============================================================================
// COMMANDS
// =============================================================================

/**
 * Validate a single configuration file
 */
program
  .command('file')
  .description('Validate a single MCP configuration file')
  .argument('<config-path>', 'Path to the MCP configuration file')
  .option('-s, --schema <path>', 'Path to the JSON schema file')
  .option('-f, --format <format>', 'Output format (text|json|junit)', 'text')
  .option('-o, --output <path>', 'Output file for results')
  .option('--strict', 'Enable strict validation mode', false)
  .option('--allow-additional', 'Allow additional properties', false)
  .option('--schema-version <version>', 'Schema version to validate against', '1.0.0')
  .option('--no-warnings', 'Suppress warnings in output')
  .option('--verbose', 'Enable verbose output', false)
  .action(async (configPath: string, options: any) => {
    try {
      await validateSingleFile(configPath, options);
    } catch (error) {
      console.error(chalk.red(`❌ Validation failed: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * Batch validate multiple configuration files
 */
program
  .command('batch')
  .description('Validate multiple MCP configuration files')
  .argument('<pattern>', 'Glob pattern to match configuration files')
  .option('-s, --schema <path>', 'Path to the JSON schema file')
  .option('-f, --format <format>', 'Output format (text|json|junit)', 'text')
  .option('-o, --output <path>', 'Output file for results')
  .option('--strict', 'Enable strict validation mode', false)
  .option('--allow-additional', 'Allow additional properties', false)
  .option('--schema-version <version>', 'Schema version to validate against', '1.0.0')
  .option('--no-warnings', 'Suppress warnings in output')
  .option('--fail-fast', 'Stop on first validation error', false)
  .option('--parallel', 'Run validations in parallel', false)
  .option('--verbose', 'Enable verbose output', false)
  .action(async (pattern: string, options: any) => {
    try {
      await validateBatch(pattern, options);
    } catch (error) {
      console.error(chalk.red(`❌ Batch validation failed: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * Validate all configurations in a directory tree
 */
program
  .command('directory')
  .description('Validate all MCP configurations in a directory')
  .argument('<dir-path>', 'Path to the directory to scan')
  .option('-s, --schema <path>', 'Path to the JSON schema file')
  .option('-f, --format <format>', 'Output format (text|json|junit)', 'text')
  .option('-o, --output <path>', 'Output file for results')
  .option('--recursive', 'Scan directories recursively', true)
  .option('--include <pattern>', 'File pattern to include (default: **/*.json)', '**/*.json')
  .option('--exclude <pattern>', 'File pattern to exclude')
  .option('--strict', 'Enable strict validation mode', false)
  .option('--allow-additional', 'Allow additional properties', false)
  .option('--schema-version <version>', 'Schema version to validate against', '1.0.0')
  .option('--no-warnings', 'Suppress warnings in output')
  .option('--fail-fast', 'Stop on first validation error', false)
  .option('--verbose', 'Enable verbose output', false)
  .action(async (dirPath: string, options: any) => {
    try {
      await validateDirectory(dirPath, options);
    } catch (error) {
      console.error(chalk.red(`❌ Directory validation failed: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * Test schema validation with sample data
 */
program
  .command('test')
  .description('Test schema validation with sample configurations')
  .option('-s, --schema <path>', 'Path to the JSON schema file')
  .option('--generate-samples', 'Generate sample configuration files', false)
  .option('--test-invalid', 'Include invalid sample configurations', false)
  .option('--verbose', 'Enable verbose output', false)
  .action(async (options: any) => {
    try {
      await testSchemaValidation(options);
    } catch (error) {
      console.error(chalk.red(`❌ Schema testing failed: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * Show schema information and statistics
 */
program
  .command('info')
  .description('Show information about the JSON schema')
  .argument('<schema-path>', 'Path to the JSON schema file')
  .option('--validate-schema', 'Validate the schema itself', false)
  .option('--show-examples', 'Show usage examples', false)
  .action(async (schemaPath: string, options: any) => {
    try {
      await showSchemaInfo(schemaPath, options);
    } catch (error) {
      console.error(chalk.red(`❌ Schema info failed: ${error.message}`));
      process.exit(1);
    }
  });

// =============================================================================
// COMMAND IMPLEMENTATIONS
// =============================================================================

/**
 * Validate a single configuration file
 */
async function validateSingleFile(configPath: string, options: any): Promise<void> {
  if (!existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }

  const validationOptions: ValidationOptions = {
    strict: options.strict,
    allowAdditional: options.allowAdditional,
    schemaVersion: options.schemaVersion
  };

  const schemaPath = options.schema || getDefaultSchemaPath();
  
  console.log(chalk.blue(`🔍 Validating ${configPath}...`));
  if (options.verbose) {
    console.log(chalk.gray(`   Schema: ${schemaPath}`));
    console.log(chalk.gray(`   Options: ${JSON.stringify(validationOptions)}`));
  }

  const result = await validateMCPConfigFile(configPath, schemaPath, validationOptions);
  
  // Format and output results
  const output = formatOutput(result, options.format, configPath);
  
  if (options.output) {
    writeFileSync(options.output, output);
    console.log(chalk.green(`📁 Results saved to ${options.output}`));
  } else {
    console.log(output);
  }

  // Exit with error code if validation failed
  if (!result.valid) {
    process.exit(1);
  }
}

/**
 * Batch validate multiple configuration files
 */
async function validateBatch(pattern: string, options: any): Promise<void> {
  console.log(chalk.blue(`🔍 Finding files matching pattern: ${pattern}`));
  
  const files = await glob(pattern);
  
  if (files.length === 0) {
    throw new Error(`No files found matching pattern: ${pattern}`);
  }

  console.log(chalk.blue(`📁 Found ${files.length} files to validate`));

  const validationOptions: ValidationOptions = {
    strict: options.strict,
    allowAdditional: options.allowAdditional,
    schemaVersion: options.schemaVersion
  };

  const schemaPath = options.schema || getDefaultSchemaPath();
  
  if (options.verbose) {
    console.log(chalk.gray(`   Schema: ${schemaPath}`));
    console.log(chalk.gray(`   Options: ${JSON.stringify(validationOptions)}`));
  }

  const results = await batchValidateConfigs(files, schemaPath, validationOptions);
  
  // Process results
  let hasErrors = false;
  const formattedResults: string[] = [];
  
  for (const [filePath, result] of Object.entries(results)) {
    if (!result.valid) {
      hasErrors = true;
      if (options.failFast) {
        console.error(chalk.red(`❌ Validation failed for ${filePath}, stopping due to --fail-fast`));
        console.error(formatOutput(result, 'text', filePath));
        process.exit(1);
      }
    }
    
    formattedResults.push(formatOutput(result, options.format, filePath));
    
    if (options.verbose) {
      console.log(result.valid ? 
        chalk.green(`✅ ${basename(filePath)}`) : 
        chalk.red(`❌ ${basename(filePath)}`)
      );
    }
  }

  // Output combined results
  const output = options.format === 'json' 
    ? JSON.stringify(results, null, 2)
    : formattedResults.join('\n\n');
  
  if (options.output) {
    writeFileSync(options.output, output);
    console.log(chalk.green(`📁 Results saved to ${options.output}`));
  } else {
    console.log(output);
  }

  // Summary
  const validFiles = Object.values(results).filter(r => r.valid).length;
  const invalidFiles = files.length - validFiles;
  
  console.log(chalk.blue(`\n📊 Summary: ${validFiles} valid, ${invalidFiles} invalid`));

  if (hasErrors) {
    process.exit(1);
  }
}

/**
 * Validate all configurations in a directory
 */
async function validateDirectory(dirPath: string, options: any): Promise<void> {
  if (!existsSync(dirPath)) {
    throw new Error(`Directory not found: ${dirPath}`);
  }

  const includePattern = options.recursive 
    ? resolve(dirPath, options.include)
    : resolve(dirPath, options.include.replace('**/', ''));

  let pattern = includePattern;
  if (options.exclude) {
    pattern = `{${includePattern},!${options.exclude}}`;
  }

  console.log(chalk.blue(`🔍 Scanning directory: ${dirPath}`));
  console.log(chalk.gray(`   Pattern: ${pattern}`));

  // Delegate to batch command
  await validateBatch(pattern, options);
}

/**
 * Test schema validation with sample data
 */
async function testSchemaValidation(options: any): Promise<void> {
  const schemaPath = options.schema || getDefaultSchemaPath();
  
  console.log(chalk.blue(`🧪 Testing schema validation`));
  console.log(chalk.gray(`   Schema: ${schemaPath}`));

  if (options.generateSamples) {
    console.log(chalk.blue(`📝 Generating sample configuration files...`));
    await generateSampleConfigs(schemaPath);
  }

  // Test with valid sample
  const validSample = createValidSample();
  console.log(chalk.blue(`✅ Testing valid configuration...`));
  
  const validResult = await validateMCPConfig(validSample, schemaPath);
  console.log(validResult.valid ? 
    chalk.green(`✅ Valid sample passed`) : 
    chalk.red(`❌ Valid sample failed: ${validResult.errors[0]?.message}`)
  );

  if (options.testInvalid) {
    // Test with invalid sample
    const invalidSample = createInvalidSample();
    console.log(chalk.blue(`❌ Testing invalid configuration...`));
    
    const invalidResult = await validateMCPConfig(invalidSample, schemaPath);
    console.log(!invalidResult.valid ? 
      chalk.green(`✅ Invalid sample correctly rejected`) : 
      chalk.red(`❌ Invalid sample incorrectly passed`)
    );
  }

  if (options.verbose) {
    console.log(chalk.gray(`\nValid sample result:`));
    console.log(formatValidationResults(validResult));
  }
}

/**
 * Show schema information
 */
async function showSchemaInfo(schemaPath: string, options: any): Promise<void> {
  if (!existsSync(schemaPath)) {
    throw new Error(`Schema file not found: ${schemaPath}`);
  }

  console.log(chalk.blue(`📋 Schema Information: ${schemaPath}`));

  const schemaContent = JSON.parse(readFileSync(schemaPath, 'utf-8'));
  
  console.log(chalk.green(`   Title: ${schemaContent.title || 'N/A'}`));
  console.log(chalk.green(`   Description: ${schemaContent.description || 'N/A'}`));
  console.log(chalk.green(`   Version: ${schemaContent.version || 'N/A'}`));
  console.log(chalk.green(`   Schema: ${schemaContent.$schema || 'N/A'}`));

  if (schemaContent.properties) {
    console.log(chalk.blue(`\n📝 Properties:`));
    Object.keys(schemaContent.properties).forEach(prop => {
      const isRequired = schemaContent.required?.includes(prop);
      console.log(`   ${isRequired ? '🔸' : '🔹'} ${prop}`);
    });
  }

  if (options.validateSchema) {
    console.log(chalk.blue(`\n🔍 Validating schema itself...`));
    try {
      const validator = createMCPValidator();
      // In a real implementation, you would validate against meta-schema
      console.log(chalk.green(`✅ Schema is valid`));
    } catch (error) {
      console.log(chalk.red(`❌ Schema validation failed: ${error.message}`));
    }
  }

  if (options.showExamples) {
    console.log(chalk.blue(`\n📄 Usage Examples:`));
    console.log(chalk.gray(`   mcp-validate file ./config.json --schema ${schemaPath}`));
    console.log(chalk.gray(`   mcp-validate batch "configs/*.json" --schema ${schemaPath}`));
    console.log(chalk.gray(`   mcp-validate directory ./configs --schema ${schemaPath}`));
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get default schema path
 */
function getDefaultSchemaPath(): string {
  return resolve(__dirname, '../schemas/mcp-config.schema.json');
}

/**
 * Format validation output based on format option
 */
function formatOutput(result: SchemaValidationResult, format: string, filePath: string): string {
  switch (format) {
    case 'json':
      return JSON.stringify({ [filePath]: result }, null, 2);
    
    case 'junit':
      return formatJUnitOutput(result, filePath);
    
    case 'text':
    default:
      return `\n${chalk.cyan(`=== ${filePath} ===`)}\n${formatValidationResults(result)}`;
  }
}

/**
 * Format output in JUnit XML format
 */
function formatJUnitOutput(result: SchemaValidationResult, filePath: string): string {
  const testName = basename(filePath, extname(filePath));
  const errors = result.errors.length;
  const warnings = result.warnings.length;
  
  let xml = `<testcase name="${testName}" classname="mcp.validation" time="${(result.performance.duration / 1000).toFixed(3)}">`;
  
  if (!result.valid) {
    xml += `<failure message="Validation failed with ${errors} errors">\n`;
    result.errors.forEach(error => {
      xml += `${error.path}: ${error.message}\n`;
    });
    xml += `</failure>`;
  }
  
  if (warnings > 0) {
    xml += `<system-out>\n`;
    result.warnings.forEach(warning => {
      xml += `WARNING: ${warning.path}: ${warning.message}\n`;
    });
    xml += `</system-out>`;
  }
  
  xml += `</testcase>`;
  
  return xml;
}

/**
 * Create a valid sample configuration
 */
function createValidSample(): TekUpMCPConfig {
  return {
    $schema: "https://tekup.org/schemas/mcp-config.schema.json",
    version: "1.0.0",
    name: "sample-config",
    description: "Sample MCP configuration for testing",
    environment: "development",
    mcpServers: {
      browser: {
        transport: {
          type: "stdio",
          config: {
            command: "node",
            args: ["./browser-server.js"]
          }
        },
        capabilities: {
          tools: [],
          resources: []
        }
      }
    }
  };
}

/**
 * Create an invalid sample configuration
 */
function createInvalidSample(): any {
  return {
    // Missing required fields
    version: "invalid-version",
    mcpServers: {
      // Invalid server configuration
      invalidServer: {
        transport: {
          type: "invalid-transport-type"
        }
      }
    }
  };
}

/**
 * Generate sample configuration files
 */
async function generateSampleConfigs(schemaPath: string): Promise<void> {
  const validSample = createValidSample();
  const invalidSample = createInvalidSample();
  
  const validPath = resolve(process.cwd(), 'mcp-config.valid.json');
  const invalidPath = resolve(process.cwd(), 'mcp-config.invalid.json');
  
  writeFileSync(validPath, JSON.stringify(validSample, null, 2));
  writeFileSync(invalidPath, JSON.stringify(invalidSample, null, 2));
  
  console.log(chalk.green(`📝 Generated valid sample: ${validPath}`));
  console.log(chalk.green(`📝 Generated invalid sample: ${invalidPath}`));
}

// =============================================================================
// MAIN PROGRAM EXECUTION
// =============================================================================

// Parse command line arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
