/**
 * @fileoverview Concrete JSON Schema validator implementation for TekUp MCP configuration
 * 
 * This module implements actual JSON Schema validation using the AJV library,
 * providing runtime validation with detailed error reporting and performance metrics.
 * 
 * @author TekUp.org Development Team
 * @version 1.0.0
 */

import Ajv, { ErrorObject, ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { performance } from 'perf_hooks';

import {
  TekUpMCPConfig,
  MCPConfigValidationResult
} from '@tekup/shared/mcp/configuration';

import {
  SchemaValidationResult,
  SchemaValidationError,
  SchemaValidationLoadingError,
  ValidationOptions,
  DEFAULT_VALIDATION_OPTIONS,
  convertSchemaErrors,
  generateConfigWarnings,
  VALIDATION_PERFORMANCE_THRESHOLDS
} from './validation.js';

// =============================================================================
// SCHEMA VALIDATOR CLASS
// =============================================================================

/**
 * JSON Schema validator for MCP configurations
 */
export class MCPSchemaValidator {
  private ajv: Ajv;
  private compiledSchemas: Map<string, ValidateFunction> = new Map();
  private schemaCache: Map<string, any> = new Map();
  
  constructor(options: Partial<ValidationOptions> = {}) {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: options.strict ?? DEFAULT_VALIDATION_OPTIONS.strict,
      removeAdditional: !options.allowAdditional,
      useDefaults: true,
      validateFormats: true
    });
    
    // Add format validation support
    addFormats(this.ajv);
    
    // Add custom formats
    this.addCustomFormats();
  }
  
  /**
   * Add custom format validators specific to MCP configurations
   */
  private addCustomFormats(): void {
    // Semantic version format
    this.ajv.addFormat('semver', {
      type: 'string',
      validate: (data: string) => {
        return /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*)?$/.test(data);
      }
    });
    
    // Environment variable reference format
    this.ajv.addFormat('env-var', {
      type: 'string',
      validate: (data: string) => {
        return /^\${[A-Z_][A-Z0-9_]*}$/.test(data);
      }
    });
    
    // Memory size format (e.g., "256MB", "2GB")
    this.ajv.addFormat('memory-size', {
      type: 'string',
      validate: (data: string) => {
        return /^\d+(?:\.\d+)?[KMGT]?B$/i.test(data);
      }
    });
    
    // CPU limit format (e.g., "0.5", "2.0")
    this.ajv.addFormat('cpu-limit', {
      type: 'string',
      validate: (data: string) => {
        return /^\d+(?:\.\d+)?$/.test(data);
      }
    });
    
    // File path format for different operating systems
    this.ajv.addFormat('file-path', {
      type: 'string',
      validate: (data: string) => {
        // Simple path validation - can be enhanced based on OS
        return data.length > 0 && !data.includes('\0');
      }
    });
  }
  
  /**
   * Load and compile a JSON schema from file
   */
  async loadSchema(schemaPath: string, schemaVersion: string = '1.0.0'): Promise<ValidateFunction> {
    const cacheKey = `${schemaPath}:${schemaVersion}`;
    
    // Return cached compiled schema if available
    if (this.compiledSchemas.has(cacheKey)) {
      return this.compiledSchemas.get(cacheKey)!;
    }
    
    try {
      // Load schema from file
      let schema: any;
      if (this.schemaCache.has(schemaPath)) {
        schema = this.schemaCache.get(schemaPath);
      } else {
        const schemaContent = readFileSync(schemaPath, 'utf-8');
        schema = JSON.parse(schemaContent);
        this.schemaCache.set(schemaPath, schema);
      }
      
      // Compile schema
      const validate = this.ajv.compile(schema);
      this.compiledSchemas.set(cacheKey, validate);
      
      return validate;
    } catch (error) {
      throw new SchemaValidationLoadingError(
        `Failed to load schema from ${schemaPath}: ${error.message}`,
        [{
          path: '',
          message: `Schema loading failed: ${error.message}`,
          code: 'SCHEMA_LOAD_ERROR',
          errorType: 'SCHEMA_NOT_FOUND'
        }],
        schemaPath
      );
    }
  }
  
  /**
   * Validate MCP configuration against schema
   */
  async validateConfig(
    config: TekUpMCPConfig,
    schemaPath: string,
    options: ValidationOptions = {}
  ): Promise<SchemaValidationResult> {
    const startTime = performance.now();
    const memoryBefore = process.memoryUsage().heapUsed;
    
    try {
      // Load and compile schema
      const validate = await this.loadSchema(schemaPath, options.schemaVersion);
      
      // Perform validation
      const valid = validate(config);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Check performance thresholds
      if (duration > VALIDATION_PERFORMANCE_THRESHOLDS.WARNING_VALIDATION_TIME) {
        console.warn(`Schema validation took ${duration.toFixed(2)}ms, which exceeds the warning threshold`);
      }
      
      // Convert errors
      const errors: SchemaValidationError[] = valid 
        ? [] 
        : convertSchemaErrors(validate.errors || []);
      
      // Generate warnings
      const warnings = options.warningDetector 
        ? options.warningDetector(config)
        : generateConfigWarnings(config);
      
      // Calculate memory usage
      const memoryAfter = process.memoryUsage().heapUsed;
      const memoryUsage = (memoryAfter - memoryBefore) / 1024 / 1024; // MB
      
      return {
        valid,
        errors,
        warnings,
        config,
        schemaVersion: options.schemaVersion || '1.0.0',
        performance: {
          duration,
          memoryUsage
        },
        schemaMetadata: {
          schemaPath,
          schemaModified: this.getSchemaModifiedTime(schemaPath),
          schemaChecksum: this.calculateSchemaChecksum(schemaPath)
        }
      };
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (error instanceof SchemaValidationLoadingError) {
        throw error;
      }
      
      throw new SchemaValidationLoadingError(
        `Validation failed: ${error.message}`,
        [{
          path: '',
          message: error.message,
          code: 'VALIDATION_ERROR',
          errorType: 'INVALID_SCHEMA_FORMAT'
        }]
      );
    }
  }
  
  /**
   * Validate configuration against multiple schema versions
   */
  async validateAgainstMultipleVersions(
    config: TekUpMCPConfig,
    schemaBasePath: string,
    versions: string[],
    options: ValidationOptions = {}
  ): Promise<Record<string, SchemaValidationResult>> {
    const results: Record<string, SchemaValidationResult> = {};
    
    for (const version of versions) {
      const schemaPath = resolve(schemaBasePath, `v${version}`, 'mcp-config.schema.json');
      
      try {
        results[version] = await this.validateConfig(config, schemaPath, {
          ...options,
          schemaVersion: version
        });
      } catch (error) {
        // Create error result for failed validation
        results[version] = {
          valid: false,
          errors: [{
            path: '',
            message: `Failed to validate against schema version ${version}: ${error.message}`,
            code: 'SCHEMA_VERSION_ERROR',
            errorType: 'SCHEMA_NOT_FOUND'
          }],
          warnings: [],
          config,
          schemaVersion: version,
          performance: {
            duration: 0
          }
        };
      }
    }
    
    return results;
  }
  
  /**
   * Validate configuration file from disk
   */
  async validateConfigFile(
    configPath: string,
    schemaPath: string,
    options: ValidationOptions = {}
  ): Promise<SchemaValidationResult> {
    try {
      const configContent = readFileSync(configPath, 'utf-8');
      const config: TekUpMCPConfig = JSON.parse(configContent);
      
      return await this.validateConfig(config, schemaPath, options);
    } catch (error) {
      throw new SchemaValidationLoadingError(
        `Failed to load configuration from ${configPath}: ${error.message}`,
        [{
          path: '',
          message: `Configuration loading failed: ${error.message}`,
          code: 'CONFIG_LOAD_ERROR',
          errorType: 'INVALID_SCHEMA_FORMAT'
        }],
        configPath
      );
    }
  }
  
  /**
   * Get schema file modification time
   */
  private getSchemaModifiedTime(schemaPath: string): string {
    try {
      const stats = require('fs').statSync(schemaPath);
      return stats.mtime.toISOString();
    } catch (error) {
      return new Date().toISOString();
    }
  }
  
  /**
   * Calculate schema file checksum for integrity verification
   */
  private calculateSchemaChecksum(schemaPath: string): string {
    try {
      const crypto = require('crypto');
      const content = readFileSync(schemaPath);
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch (error) {
      return '';
    }
  }
  
  /**
   * Clear compiled schema cache
   */
  clearCache(): void {
    this.compiledSchemas.clear();
    this.schemaCache.clear();
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats(): { compiledSchemas: number; schemaCache: number } {
    return {
      compiledSchemas: this.compiledSchemas.size,
      schemaCache: this.schemaCache.size
    };
  }
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Create a pre-configured validator instance
 */
export function createMCPValidator(options: Partial<ValidationOptions> = {}): MCPSchemaValidator {
  return new MCPSchemaValidator(options);
}

/**
 * Quick validation function for common use cases
 */
export async function validateMCPConfig(
  config: TekUpMCPConfig,
  schemaPath?: string,
  options: ValidationOptions = {}
): Promise<SchemaValidationResult> {
  const validator = createMCPValidator(options);
  
  // Use default schema path if not provided
  const defaultSchemaPath = schemaPath || resolve(__dirname, '../schemas/mcp-config.schema.json');
  
  return await validator.validateConfig(config, defaultSchemaPath, options);
}

/**
 * Validate configuration file with detailed error reporting
 */
export async function validateMCPConfigFile(
  configPath: string,
  schemaPath?: string,
  options: ValidationOptions = {}
): Promise<SchemaValidationResult> {
  const validator = createMCPValidator(options);
  
  // Use default schema path if not provided
  const defaultSchemaPath = schemaPath || resolve(__dirname, '../schemas/mcp-config.schema.json');
  
  return await validator.validateConfigFile(configPath, defaultSchemaPath, options);
}

/**
 * Batch validate multiple configuration files
 */
export async function batchValidateConfigs(
  configPaths: string[],
  schemaPath?: string,
  options: ValidationOptions = {}
): Promise<Record<string, SchemaValidationResult>> {
  const validator = createMCPValidator(options);
  const results: Record<string, SchemaValidationResult> = {};
  
  const defaultSchemaPath = schemaPath || resolve(__dirname, '../schemas/mcp-config.schema.json');
  
  for (const configPath of configPaths) {
    try {
      results[configPath] = await validator.validateConfigFile(configPath, defaultSchemaPath, options);
    } catch (error) {
      results[configPath] = {
        valid: false,
        errors: [{
          path: '',
          message: `Failed to validate ${configPath}: ${error.message}`,
          code: 'BATCH_VALIDATION_ERROR',
          errorType: 'SCHEMA_NOT_FOUND'
        }],
        warnings: [],
        config: {} as TekUpMCPConfig,
        schemaVersion: options.schemaVersion || '1.0.0',
        performance: {
          duration: 0
        }
      };
    }
  }
  
  return results;
}

/**
 * Format validation results for console output
 */
export function formatValidationResults(result: SchemaValidationResult): string {
  const lines: string[] = [];
  
  if (result.valid) {
    lines.push(`✅ Configuration is valid (schema v${result.schemaVersion})`);
  } else {
    lines.push(`❌ Configuration is invalid (schema v${result.schemaVersion})`);
  }
  
  // Add performance info
  lines.push(`⏱️  Validation took ${result.performance.duration.toFixed(2)}ms`);
  if (result.performance.memoryUsage) {
    lines.push(`🧠 Memory usage: ${result.performance.memoryUsage.toFixed(2)}MB`);
  }
  
  // Add errors
  if (result.errors.length > 0) {
    lines.push('\n📛 Errors:');
    result.errors.forEach((error, index) => {
      lines.push(`  ${index + 1}. ${error.path}: ${error.message}`);
      if (error.expected && error.actual) {
        lines.push(`     Expected: ${JSON.stringify(error.expected)}`);
        lines.push(`     Actual: ${JSON.stringify(error.actual)}`);
      }
    });
  }
  
  // Add warnings
  if (result.warnings.length > 0) {
    lines.push('\n⚠️  Warnings:');
    result.warnings.forEach((warning, index) => {
      lines.push(`  ${index + 1}. ${warning.path}: ${warning.message}`);
      if (warning.suggestion) {
        lines.push(`     Suggestion: ${warning.suggestion}`);
      }
    });
  }
  
  return lines.join('\n');
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  MCPSchemaValidator,
  SchemaValidationResult,
  SchemaValidationError,
  SchemaValidationLoadingError,
  ValidationOptions,
  DEFAULT_VALIDATION_OPTIONS
};
