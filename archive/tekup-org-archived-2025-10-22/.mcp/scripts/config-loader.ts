/**
 * @fileoverview MCP Configuration Loader and Merger System
 * 
 * This module provides centralized loading, validation, and merging of MCP configurations
 * with support for environment detection, caching, and hot-reload in development.
 * 
 * @author TekUp.org Development Team
 * @version 1.0.0
 */

import { readFileSync, writeFileSync, existsSync, watchFile, unwatchFile } from 'fs';
import { resolve, join } from 'path';
import { EventEmitter } from 'events';
import { merge } from 'lodash-es';

import {
  TekUpMCPConfig,
  MCPEnvironment,
  MCPConfigLoadingOptions,
  MCPConfigLoadingError
} from '@tekup/shared/mcp/configuration';

import {
  validateMCPConfig,
  SchemaValidationResult,
  ValidationOptions
} from '../schemas/validator.js';

// =============================================================================
// CONFIGURATION LOADER CLASS
// =============================================================================

/**
 * MCP Configuration Loader with caching and hot-reload support
 */
export class MCPConfigLoader extends EventEmitter {
  private cache: Map<string, TekUpMCPConfig> = new Map();
  private watchers: Set<string> = new Set();
  private baseConfigPath: string;
  private schemaPath: string;
  private environment: MCPEnvironment;
  
  constructor(
    baseConfigPath: string = resolve(process.cwd(), '.mcp/configs'),
    schemaPath: string = resolve(process.cwd(), '.mcp/schemas/mcp-config.schema.json')
  ) {
    super();
    this.baseConfigPath = baseConfigPath;
    this.schemaPath = schemaPath;
    this.environment = this.detectEnvironment();
    
    // Enable hot-reload in development
    if (this.environment === 'development') {
      this.enableHotReload();
    }
  }
  
  /**
   * Detect current environment from various sources
   */
  private detectEnvironment(): MCPEnvironment {
    // Check environment variables in priority order
    const envSources = [
      process.env.MCP_ENV,
      process.env.NODE_ENV,
      process.env.ENVIRONMENT,
      process.env.ENV
    ];
    
    for (const source of envSources) {
      if (source) {
        const normalized = source.toLowerCase();
        if (['development', 'staging', 'production', 'test'].includes(normalized)) {
          return normalized as MCPEnvironment;
        }
      }
    }
    
    // Default to development
    return 'development';
  }
  
  /**
   * Load and merge configuration for current environment
   */
  async loadConfig(
    environment?: MCPEnvironment,
    options: MCPConfigLoadingOptions = {}
  ): Promise<TekUpMCPConfig> {
    const env = environment || this.environment;
    const cacheKey = `${env}:${JSON.stringify(options)}`;
    
    // Return cached config if available and not disabled
    if (!options.skipCache && this.cache.has(cacheKey)) {
      this.emit('configLoaded', { environment: env, source: 'cache' });
      return this.cache.get(cacheKey)!;
    }
    
    try {
      // Load base configuration
      const baseConfig = await this.loadBaseConfig();
      
      // Load environment-specific overrides
      const envOverrides = await this.loadEnvironmentOverrides(env);
      
      // Merge configurations
      const mergedConfig = this.mergeConfigurations(baseConfig, envOverrides);
      
      // Apply runtime overrides if provided
      const finalConfig = options.overrides 
        ? this.mergeConfigurations(mergedConfig, options.overrides)
        : mergedConfig;
      
      // Set environment in final config
      finalConfig.environment = env;
      
      // Validate merged configuration
      if (options.skipValidation !== true) {
        await this.validateConfiguration(finalConfig);
      }
      
      // Cache the result
      this.cache.set(cacheKey, finalConfig);
      
      this.emit('configLoaded', { 
        environment: env, 
        source: 'file',
        config: finalConfig 
      });
      
      return finalConfig;
    } catch (error) {
      this.emit('configError', { environment: env, error });
      throw new MCPConfigLoadingError(
        `Failed to load configuration for environment '${env}': ${error.message}`
      );
    }
  }
  
  /**
   * Load base configuration from file
   */
  private async loadBaseConfig(): Promise<Partial<TekUpMCPConfig>> {
    const baseConfigFile = join(this.baseConfigPath, 'base.json');
    
    if (!existsSync(baseConfigFile)) {
      throw new Error(`Base configuration file not found: ${baseConfigFile}`);
    }
    
    try {
      const content = readFileSync(baseConfigFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to parse base configuration: ${error.message}`);
    }
  }
  
  /**
   * Load environment-specific overrides
   */
  private async loadEnvironmentOverrides(env: MCPEnvironment): Promise<Partial<TekUpMCPConfig>> {
    const envConfigFile = join(this.baseConfigPath, `${env}.json`);
    
    if (!existsSync(envConfigFile)) {
      console.warn(`Environment configuration file not found: ${envConfigFile}. Using base config only.`);
      return {};
    }
    
    try {
      const content = readFileSync(envConfigFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.warn(`Failed to parse environment configuration for '${env}': ${error.message}`);
      return {};
    }
  }
  
  /**
   * Deep merge configurations with custom merge strategy
   */
  private mergeConfigurations(
    base: Partial<TekUpMCPConfig>,
    override: Partial<TekUpMCPConfig>
  ): TekUpMCPConfig {
    return merge({}, base, override, {
      // Custom merge for arrays (replace instead of merge)
      customizer: (objValue: any, srcValue: any, key: string) => {
        if (Array.isArray(objValue) && Array.isArray(srcValue)) {
          return srcValue; // Replace arrays completely
        }
        
        // Special handling for MCP servers - merge by server ID
        if (key === 'mcpServers' && objValue && srcValue) {
          return { ...objValue, ...srcValue };
        }
        
        return undefined; // Use default merge behavior
      }
    }) as TekUpMCPConfig;
  }
  
  /**
   * Validate configuration against schema
   */
  private async validateConfiguration(config: TekUpMCPConfig): Promise<void> {
    const validationOptions: ValidationOptions = {
      strict: config.environment === 'production',
      schemaVersion: '1.0.0'
    };
    
    const result: SchemaValidationResult = await validateMCPConfig(
      config,
      this.schemaPath,
      validationOptions
    );
    
    if (!result.valid) {
      const errorMessages = result.errors.map(err => `${err.path}: ${err.message}`);
      throw new Error(`Configuration validation failed:\n${errorMessages.join('\n')}`);
    }
    
    // Log warnings in development
    if (config.environment === 'development' && result.warnings.length > 0) {
      console.warn('Configuration warnings:');
      result.warnings.forEach(warning => {
        console.warn(`  ${warning.path}: ${warning.message}`);
      });
    }
  }
  
  /**
   * Enable hot-reload for development environment
   */
  private enableHotReload(): void {
    const baseConfigFile = join(this.baseConfigPath, 'base.json');
    const devConfigFile = join(this.baseConfigPath, 'development.json');
    
    [baseConfigFile, devConfigFile].forEach(file => {
      if (existsSync(file) && !this.watchers.has(file)) {
        watchFile(file, { interval: 1000 }, () => {
          console.log(`Configuration file changed: ${file}`);
          this.clearCache();
          this.emit('configChanged', { file });
        });
        this.watchers.add(file);
      }
    });
  }
  
  /**
   * Disable hot-reload and cleanup watchers
   */
  private disableHotReload(): void {
    this.watchers.forEach(file => unwatchFile(file));
    this.watchers.clear();
  }
  
  /**
   * Clear configuration cache
   */
  clearCache(): void {
    this.cache.clear();
    this.emit('cacheCleared');
  }
  
  /**
   * Get current environment
   */
  getCurrentEnvironment(): MCPEnvironment {
    return this.environment;
  }
  
  /**
   * Set environment (useful for testing)
   */
  setEnvironment(env: MCPEnvironment): void {
    this.environment = env;
    this.clearCache();
  }
  
  /**
   * Get configuration for specific server
   */
  async getServerConfig(serverId: string, environment?: MCPEnvironment): Promise<any> {
    const config = await this.loadConfig(environment);
    return config.mcpServers[serverId];
  }
  
  /**
   * Get all server configurations
   */
  async getAllServerConfigs(environment?: MCPEnvironment): Promise<Record<string, any>> {
    const config = await this.loadConfig(environment);
    return config.mcpServers;
  }
  
  /**
   * Get global configuration settings
   */
  async getGlobalConfig(environment?: MCPEnvironment): Promise<any> {
    const config = await this.loadConfig(environment);
    return config.global;
  }
  
  /**
   * Export configuration to file
   */
  async exportConfig(
    outputPath: string,
    environment?: MCPEnvironment,
    format: 'json' | 'yaml' = 'json'
  ): Promise<void> {
    const config = await this.loadConfig(environment);
    
    let content: string;
    if (format === 'yaml') {
      const yaml = await import('yaml');
      content = yaml.stringify(config);
    } else {
      content = JSON.stringify(config, null, 2);
    }
    
    writeFileSync(outputPath, content);
  }
  
  /**
   * Cleanup resources
   */
  dispose(): void {
    this.disableHotReload();
    this.clearCache();
    this.removeAllListeners();
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create a singleton instance of the configuration loader
 */
let globalLoader: MCPConfigLoader | null = null;

export function getConfigLoader(
  baseConfigPath?: string,
  schemaPath?: string
): MCPConfigLoader {
  if (!globalLoader) {
    globalLoader = new MCPConfigLoader(baseConfigPath, schemaPath);
  }
  return globalLoader;
}

/**
 * Quick access to load current environment configuration
 */
export async function loadMCPConfig(
  options?: MCPConfigLoadingOptions
): Promise<TekUpMCPConfig> {
  const loader = getConfigLoader();
  return await loader.loadConfig(undefined, options);
}

/**
 * Quick access to get server configuration
 */
export async function getMCPServerConfig(
  serverId: string,
  environment?: MCPEnvironment
): Promise<any> {
  const loader = getConfigLoader();
  return await loader.getServerConfig(serverId, environment);
}

/**
 * Quick access to get all server configurations
 */
export async function getAllMCPServerConfigs(
  environment?: MCPEnvironment
): Promise<Record<string, any>> {
  const loader = getConfigLoader();
  return await loader.getAllServerConfigs(environment);
}

/**
 * Quick access to get global configuration
 */
export async function getGlobalMCPConfig(
  environment?: MCPEnvironment
): Promise<any> {
  const loader = getConfigLoader();
  return await loader.getGlobalConfig(environment);
}

/**
 * Process environment variables in configuration values
 */
export function processEnvironmentVariables(
  config: any,
  envVars: Record<string, string> = process.env
): any {
  if (typeof config === 'string') {
    // Replace ${VAR_NAME} with environment variable value
    return config.replace(/\$\{([A-Z_][A-Z0-9_]*)\}/g, (match, varName) => {
      const value = envVars[varName];
      if (value === undefined) {
        console.warn(`Environment variable '${varName}' not found, keeping placeholder`);
        return match;
      }
      return value;
    });
  }
  
  if (Array.isArray(config)) {
    return config.map(item => processEnvironmentVariables(item, envVars));
  }
  
  if (config && typeof config === 'object') {
    const processed: any = {};
    for (const [key, value] of Object.entries(config)) {
      processed[key] = processEnvironmentVariables(value, envVars);
    }
    return processed;
  }
  
  return config;
}

/**
 * Validate environment variable references in configuration
 */
export function validateEnvironmentReferences(
  config: any,
  requiredVars: Set<string> = new Set()
): { missing: string[]; unused: string[] } {
  const references = new Set<string>();
  
  function extractReferences(obj: any): void {
    if (typeof obj === 'string') {
      const matches = obj.match(/\$\{([A-Z_][A-Z0-9_]*)\}/g);
      if (matches) {
        matches.forEach(match => {
          const varName = match.slice(2, -1);
          references.add(varName);
        });
      }
    } else if (Array.isArray(obj)) {
      obj.forEach(extractReferences);
    } else if (obj && typeof obj === 'object') {
      Object.values(obj).forEach(extractReferences);
    }
  }
  
  extractReferences(config);
  
  const missing = Array.from(references).filter(varName => !process.env[varName]);
  const unused = Array.from(requiredVars).filter(varName => !references.has(varName));
  
  return { missing, unused };
}

// =============================================================================
// CONFIGURATION PRESETS
// =============================================================================

/**
 * Development environment preset
 */
export const DEVELOPMENT_PRESET = {
  global: {
    logging: {
      level: 'debug',
      console: true,
      file: '.mcp/logs/development.log'
    },
    monitoring: {
      debugMode: true,
      testMode: true
    }
  }
};

/**
 * Production environment preset
 */
export const PRODUCTION_PRESET = {
  global: {
    logging: {
      level: 'error',
      console: false,
      file: '.mcp/logs/production.log'
    },
    security: {
      sandboxMode: true,
      requireHttps: true
    },
    monitoring: {
      debugMode: false,
      testMode: false
    }
  }
};

/**
 * Staging environment preset
 */
export const STAGING_PRESET = {
  global: {
    logging: {
      level: 'warning',
      console: true,
      file: '.mcp/logs/staging.log'
    },
    security: {
      sandboxMode: true
    },
    monitoring: {
      debugMode: false,
      testMode: false
    }
  }
};

// =============================================================================
// EXPORTS
// =============================================================================

export {
  MCPConfigLoader,
  loadMCPConfig,
  getMCPServerConfig,
  getAllMCPServerConfigs,
  getGlobalMCPConfig,
  getConfigLoader,
  processEnvironmentVariables,
  validateEnvironmentReferences
};
