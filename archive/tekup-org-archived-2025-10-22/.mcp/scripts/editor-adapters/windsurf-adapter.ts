#!/usr/bin/env node

/**
 * @fileoverview Windsurf Editor Adapter for MCP Configuration Integration
 * 
 * Specialized adapter for integrating centralized MCP configuration
 * with Windsurf IDE settings and extensions.
 * 
 * @author TekUp.org Development Team
 * @version 1.0.0
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import BaseEditorAdapter, { EditorInfo, TransformationRule, ValidationRule, ValidationResult } from './base-editor-adapter.js';
import type { MCPConfiguration } from '../types/mcp-types.js';

const execAsync = promisify(exec);

// =============================================================================
// WINDSURF SPECIFIC TYPES
// =============================================================================

interface WindsurfSettings {
  "mcp.servers"?: Record<string, WindsurfMCPServer>;
  "mcp.enabled"?: boolean;
  "mcp.autoStart"?: boolean;
  "mcp.logLevel"?: "debug" | "info" | "warn" | "error";
  "mcp.timeout"?: number;
  "windsurf.ai.enabled"?: boolean;
  "windsurf.ai.provider"?: string;
  "windsurf.ai.model"?: string;
  "windsurf.codeCompletion.enabled"?: boolean;
  "windsurf.refactoring.ai"?: boolean;
  "extensions.autoUpdate"?: boolean;
  [key: string]: any;
}

interface WindsurfMCPServer {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  transport?: {
    type: "stdio" | "websocket";
    host?: string;
    port?: number;
  };
  initializationOptions?: Record<string, any>;
  windsurfIntegration?: {
    enabled?: boolean;
    aiAssisted?: boolean;
    codeAnalysis?: boolean;
  };
}

// =============================================================================
// WINDSURF ADAPTER IMPLEMENTATION
// =============================================================================

export class WindsurfAdapter extends BaseEditorAdapter {
  
  constructor(configLoader: any) {
    const editorInfo: EditorInfo = {
      name: 'windsurf',
      displayName: 'Windsurf IDE',
      configDir: join(process.env.APPDATA || process.env.HOME || '', 'Windsurf', 'User'),
      configFile: 'settings.json',
      format: 'json',
      executable: 'windsurf',
      installed: false
    };
    
    super(editorInfo, configLoader);
  }

  /**
   * Detect Windsurf installation and version
   */
  async detectEditor(): Promise<EditorInfo> {
    const editorInfo = { ...this.config.editor };
    
    try {
      // Try to detect Windsurf installation
      const possiblePaths = [
        'windsurf',
        join(process.env.LOCALAPPDATA || '', 'Programs', 'Windsurf', 'Windsurf.exe'),
        join(process.env.PROGRAMFILES || '', 'Windsurf', 'Windsurf.exe'),
        join(process.env.PROGRAMW6432 || '', 'Windsurf', 'Windsurf.exe'),
        '/Applications/Windsurf.app/Contents/MacOS/Windsurf', // macOS
        '/usr/local/bin/windsurf', // Linux
        '/opt/windsurf/windsurf' // Linux alternative
      ];

      for (const path of possiblePaths) {
        try {
          const { stdout } = await execAsync(`"${path}" --version`);
          const lines = stdout.trim().split('\n');
          if (lines.length >= 1) {
            editorInfo.version = lines[0].trim();
            editorInfo.executable = path;
            editorInfo.installed = true;
            break;
          }
        } catch (error) {
          // Continue to next path
        }
      }

      // Try to detect by checking common installation directories
      if (!editorInfo.installed && process.platform === 'win32') {
        const windowsPaths = [
          `${process.env.LOCALAPPDATA}\\Programs\\Windsurf\\Windsurf.exe`,
          `${process.env.PROGRAMFILES}\\Windsurf\\Windsurf.exe`,
          `${process.env['PROGRAMFILES(X86)']}\\Windsurf\\Windsurf.exe`
        ];

        for (const path of windowsPaths) {
          if (existsSync(path)) {
            try {
              const { stdout } = await execAsync(`"${path}" --version`);
              const lines = stdout.trim().split('\n');
              if (lines.length >= 1) {
                editorInfo.version = lines[0].trim();
                editorInfo.executable = path;
                editorInfo.installed = true;
                break;
              }
            } catch (error) {
              // If --version fails, assume it's installed but version unknown
              editorInfo.version = 'Unknown';
              editorInfo.executable = path;
              editorInfo.installed = true;
              break;
            }
          }
        }
      }

      // Update config directory based on platform
      if (process.platform === 'win32') {
        editorInfo.configDir = join(process.env.APPDATA || '', 'Windsurf', 'User');
      } else if (process.platform === 'darwin') {
        editorInfo.configDir = join(process.env.HOME || '', 'Library', 'Application Support', 'Windsurf', 'User');
      } else {
        editorInfo.configDir = join(process.env.HOME || '', '.config', 'Windsurf', 'User');
      }

    } catch (error) {
      console.warn(`⚠️  Could not detect Windsurf installation:`, error.message);
    }

    return editorInfo;
  }

  /**
   * Get Windsurf specific transformation rules
   */
  getTransformationRules(): TransformationRule[] {
    return [
      {
        id: 'mcp-servers-transform',
        description: 'Transform MCP servers to Windsurf format with AI integration',
        sourceField: 'mcpServers',
        targetField: 'mcp.servers',
        transformer: (servers: any, config: MCPConfiguration) => {
          const windsurfServers: Record<string, WindsurfMCPServer> = {};
          
          for (const [serverName, serverConfig] of Object.entries(servers || {})) {
            const server = serverConfig as any;
            
            windsurfServers[serverName] = {
              command: server.command,
              args: server.args || [],
              env: this.transformEnvironmentVariables(server.env || {}),
              cwd: server.cwd,
              transport: server.transport ? {
                type: server.transport.type === 'websocket' ? 'websocket' : 'stdio',
                ...(server.transport.host && { host: server.transport.host }),
                ...(server.transport.port && { port: server.transport.port })
              } : { type: 'stdio' },
              ...(server.initializationOptions && { 
                initializationOptions: server.initializationOptions 
              }),
              // Windsurf-specific integration settings
              windsurfIntegration: {
                enabled: server.windsurfIntegration?.enabled !== false,
                aiAssisted: server.windsurfIntegration?.aiAssisted !== false,
                codeAnalysis: server.windsurfIntegration?.codeAnalysis !== false
              }
            };
          }
          
          return windsurfServers;
        }
      },
      {
        id: 'mcp-settings-transform',
        description: 'Transform MCP global settings for Windsurf',
        sourceField: 'settings',
        transformer: (settings: any, config: MCPConfiguration) => {
          return {
            'mcp.enabled': settings?.enabled !== false,
            'mcp.autoStart': settings?.autoStart !== false,
            'mcp.logLevel': this.mapLogLevel(settings?.logLevel || 'info'),
            'mcp.timeout': settings?.timeout || 30000
          };
        }
      },
      {
        id: 'windsurf-ai-settings',
        description: 'Configure Windsurf AI specific settings',
        sourceField: 'windsurfAI',
        transformer: (aiConfig: any, config: MCPConfiguration) => {
          if (!aiConfig) return {};
          
          return {
            'windsurf.ai.enabled': aiConfig.enabled !== false,
            'windsurf.ai.provider': aiConfig.provider || 'openai',
            'windsurf.ai.model': aiConfig.model || 'gpt-4',
            'windsurf.codeCompletion.enabled': aiConfig.codeCompletion?.enabled !== false,
            'windsurf.refactoring.ai': aiConfig.refactoring?.enabled !== false
          };
        }
      },
      {
        id: 'browser-automation-settings',
        description: 'Add browser automation settings optimized for Windsurf',
        sourceField: 'browserAutomation',
        transformer: (browserConfig: any, config: MCPConfiguration) => {
          if (!browserConfig) return {};
          
          return {
            'mcp.browserAutomation.enabled': browserConfig.enabled !== false,
            'mcp.browserAutomation.defaultBrowser': browserConfig.defaultBrowser || 'chrome',
            'mcp.browserAutomation.headless': browserConfig.headless !== false,
            'mcp.browserAutomation.timeout': browserConfig.timeout || 30000,
            'mcp.browserAutomation.windsurfIntegration': browserConfig.windsurfIntegration !== false,
            'mcp.browserAutomation.codeGeneration': browserConfig.codeGeneration !== false
          };
        }
      }
    ];
  }

  /**
   * Get Windsurf specific validation rules
   */
  getValidationRules(): ValidationRule[] {
    return [
      {
        id: 'validate-mcp-servers',
        description: 'Validate MCP servers configuration for Windsurf',
        validator: (config: WindsurfSettings, originalConfig: MCPConfiguration): ValidationResult => {
          const errors: string[] = [];
          const warnings: string[] = [];
          
          if (!config['mcp.servers'] || Object.keys(config['mcp.servers']).length === 0) {
            warnings.push('No MCP servers configured');
          }
          
          for (const [serverName, serverConfig] of Object.entries(config['mcp.servers'] || {})) {
            if (!serverConfig.command) {
              errors.push(`Server '${serverName}' is missing required 'command' field`);
            }
            
            if (serverConfig.transport?.type === 'websocket') {
              if (!serverConfig.transport.host || !serverConfig.transport.port) {
                errors.push(`WebSocket server '${serverName}' requires host and port`);
              }
            }

            // Windsurf-specific validations
            if (serverConfig.windsurfIntegration?.aiAssisted && !config['windsurf.ai.enabled']) {
              warnings.push(`Server '${serverName}' has AI assistance enabled but Windsurf AI is disabled`);
            }
          }
          
          return {
            valid: errors.length === 0,
            errors,
            warnings
          };
        }
      },
      {
        id: 'validate-windsurf-ai-settings',
        description: 'Validate Windsurf AI configuration',
        validator: (config: WindsurfSettings, originalConfig: MCPConfiguration): ValidationResult => {
          const errors: string[] = [];
          const warnings: string[] = [];
          
          // Check AI provider configuration
          const aiProvider = config['windsurf.ai.provider'];
          if (aiProvider && !['openai', 'anthropic', 'azure', 'local'].includes(aiProvider)) {
            warnings.push(`Unknown AI provider: ${aiProvider}. Consider using a supported provider.`);
          }

          // Check AI model configuration
          const aiModel = config['windsurf.ai.model'];
          if (aiModel && aiProvider === 'openai' && !aiModel.startsWith('gpt-')) {
            warnings.push(`Model ${aiModel} may not be compatible with OpenAI provider`);
          }
          
          return {
            valid: errors.length === 0,
            errors,
            warnings
          };
        }
      },
      {
        id: 'validate-settings-format',
        description: 'Validate Windsurf settings format',
        validator: (config: WindsurfSettings, originalConfig: MCPConfiguration): ValidationResult => {
          const errors: string[] = [];
          const warnings: string[] = [];
          
          // Check for valid log level
          const logLevel = config['mcp.logLevel'];
          if (logLevel && !['debug', 'info', 'warn', 'error'].includes(logLevel)) {
            errors.push(`Invalid log level: ${logLevel}. Must be one of: debug, info, warn, error`);
          }
          
          // Check timeout value
          const timeout = config['mcp.timeout'];
          if (timeout && (typeof timeout !== 'number' || timeout < 1000)) {
            warnings.push(`Timeout should be a number >= 1000ms, got: ${timeout}`);
          }
          
          return {
            valid: errors.length === 0,
            errors,
            warnings
          };
        }
      }
    ];
  }

  /**
   * Transform MCP configuration to Windsurf settings format
   */
  transformConfig(mcpConfig: MCPConfiguration): WindsurfSettings {
    const windsurfConfig: WindsurfSettings = {};
    
    // Apply transformation rules
    for (const rule of this.config.transformationRules) {
      if (rule.condition && !rule.condition(mcpConfig)) {
        continue;
      }
      
      const sourceValue = this.getNestedValue(mcpConfig, rule.sourceField);
      if (sourceValue !== undefined) {
        const transformedValue = rule.transformer ? 
          rule.transformer(sourceValue, mcpConfig) : 
          sourceValue;
        
        if (rule.targetField) {
          this.setNestedValue(windsurfConfig, rule.targetField, transformedValue);
        } else {
          Object.assign(windsurfConfig, transformedValue);
        }
      }
    }
    
    return windsurfConfig;
  }

  /**
   * Validate transformed Windsurf configuration
   */
  validateTransformedConfig(transformedConfig: WindsurfSettings, originalConfig: MCPConfiguration): ValidationResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    
    // Run all validation rules
    for (const rule of this.config.validationRules) {
      const result = rule.validator(transformedConfig, originalConfig);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    }
    
    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  }

  /**
   * Write Windsurf settings file
   */
  async writeEditorConfig(transformedConfig: WindsurfSettings, targetPath: string): Promise<void> {
    try {
      // Format with proper indentation for Windsurf
      const jsonContent = JSON.stringify(transformedConfig, null, 2);
      writeFileSync(targetPath, jsonContent, 'utf8');
      
      console.log(`📝 Written Windsurf settings to: ${targetPath}`);
    } catch (error) {
      console.error('❌ Failed to write Windsurf settings:', error);
      throw error;
    }
  }

  /**
   * Read existing Windsurf settings
   */
  async readExistingEditorConfig(configPath: string): Promise<WindsurfSettings> {
    try {
      if (!existsSync(configPath)) {
        return {};
      }
      
      const content = readFileSync(configPath, 'utf8');
      const config = JSON.parse(content);
      
      return config;
    } catch (error) {
      console.warn(`⚠️  Failed to read existing Windsurf settings: ${error.message}`);
      return {};
    }
  }

  /**
   * Merge configurations with Windsurf specific logic
   */
  protected mergeConfigurations(existing: WindsurfSettings, transformed: WindsurfSettings): WindsurfSettings {
    const merged = { ...existing };
    
    // Preserve existing Windsurf settings that are not MCP-related
    const mcpKeys = Object.keys(transformed).filter(key => key.startsWith('mcp.') || key.startsWith('windsurf.'));
    const nonMcpKeys = Object.keys(existing).filter(key => !key.startsWith('mcp.') && !key.startsWith('windsurf.'));
    
    // Keep all non-MCP/Windsurf settings
    nonMcpKeys.forEach(key => {
      merged[key] = existing[key];
    });
    
    // Apply all MCP and Windsurf settings from transformed config
    Object.keys(transformed).forEach(key => {
      merged[key] = transformed[key];
    });
    
    return merged;
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  /**
   * Transform environment variables for Windsurf format
   */
  private transformEnvironmentVariables(env: Record<string, string>): Record<string, string> {
    const transformed: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(env)) {
      // Windsurf supports environment variable references
      if (value.startsWith('$')) {
        transformed[key] = value; // Keep as reference
      } else {
        transformed[key] = value;
      }
    }
    
    return transformed;
  }

  /**
   * Map log level to Windsurf format
   */
  private mapLogLevel(level: string): "debug" | "info" | "warn" | "error" {
    const levelMap: Record<string, "debug" | "info" | "warn" | "error"> = {
      'debug': 'debug',
      'verbose': 'debug',
      'info': 'info',
      'information': 'info',
      'warn': 'warn',
      'warning': 'warn',
      'error': 'error',
      'err': 'error'
    };
    
    return levelMap[level.toLowerCase()] || 'info';
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Set nested value in object using dot notation
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!(key in current)) {
        current[key] = {};
      }
      return current[key];
    }, obj);
    
    target[lastKey] = value;
  }
}

export default WindsurfAdapter;