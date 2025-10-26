#!/usr/bin/env node

/**
 * @fileoverview VS Code Editor Adapter for MCP Configuration Integration
 * 
 * Specialized adapter for integrating centralized MCP configuration
 * with Visual Studio Code settings and extensions.
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
// VS CODE SPECIFIC TYPES
// =============================================================================

interface VSCodeSettings {
  "mcp.servers"?: Record<string, VSCodeMCPServer>;
  "mcp.enabled"?: boolean;
  "mcp.autoStart"?: boolean;
  "mcp.logLevel"?: "debug" | "info" | "warn" | "error";
  "mcp.timeout"?: number;
  "extensions.autoUpdate"?: boolean;
  [key: string]: any;
}

interface VSCodeMCPServer {
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
}

// =============================================================================
// VS CODE ADAPTER IMPLEMENTATION
// =============================================================================

export class VSCodeAdapter extends BaseEditorAdapter {
  
  constructor(configLoader: any) {
    const editorInfo: EditorInfo = {
      name: 'vscode',
      displayName: 'Visual Studio Code',
      configDir: '.vscode',
      configFile: 'settings.json',
      format: 'json',
      executable: 'code',
      installed: false
    };
    
    super(editorInfo, configLoader);
  }

  /**
   * Detect VS Code installation and version
   */
  async detectEditor(): Promise<EditorInfo> {
    const editorInfo = { ...this.config.editor };
    
    try {
      // Try to detect VS Code installation
      const possiblePaths = [
        'code',
        'code-insiders',
        join(process.env.LOCALAPPDATA || '', 'Programs', 'Microsoft VS Code', 'bin', 'code.cmd'),
        join(process.env.PROGRAMFILES || '', 'Microsoft VS Code', 'bin', 'code.cmd'),
        join(process.env.PROGRAMW6432 || '', 'Microsoft VS Code', 'bin', 'code.cmd')
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

      // If not found in PATH, try common Windows locations
      if (!editorInfo.installed && process.platform === 'win32') {
        const windowsPaths = [
          `${process.env.LOCALAPPDATA}\\Programs\\Microsoft VS Code\\Code.exe`,
          `${process.env.PROGRAMFILES}\\Microsoft VS Code\\Code.exe`,
          `${process.env['PROGRAMFILES(X86)']}\\Microsoft VS Code\\Code.exe`
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
              // Continue to next path
            }
          }
        }
      }

    } catch (error) {
      console.warn(`⚠️  Could not detect VS Code installation:`, error.message);
    }

    return editorInfo;
  }

  /**
   * Get VS Code specific transformation rules
   */
  getTransformationRules(): TransformationRule[] {
    return [
      {
        id: 'mcp-servers-transform',
        description: 'Transform MCP servers to VS Code format',
        sourceField: 'mcpServers',
        targetField: 'mcp.servers',
        transformer: (servers: any, config: MCPConfiguration) => {
          const vsCodeServers: Record<string, VSCodeMCPServer> = {};
          
          for (const [serverName, serverConfig] of Object.entries(servers || {})) {
            const server = serverConfig as any;
            
            vsCodeServers[serverName] = {
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
              })
            };
          }
          
          return vsCodeServers;
        }
      },
      {
        id: 'mcp-settings-transform',
        description: 'Transform MCP global settings',
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
        id: 'browser-automation-settings',
        description: 'Add browser automation specific settings',
        sourceField: 'browserAutomation',
        transformer: (browserConfig: any, config: MCPConfiguration) => {
          if (!browserConfig) return {};
          
          return {
            'mcp.browserAutomation.enabled': browserConfig.enabled !== false,
            'mcp.browserAutomation.defaultBrowser': browserConfig.defaultBrowser || 'chrome',
            'mcp.browserAutomation.headless': browserConfig.headless !== false,
            'mcp.browserAutomation.timeout': browserConfig.timeout || 30000
          };
        }
      }
    ];
  }

  /**
   * Get VS Code specific validation rules
   */
  getValidationRules(): ValidationRule[] {
    return [
      {
        id: 'validate-mcp-servers',
        description: 'Validate MCP servers configuration',
        validator: (config: VSCodeSettings, originalConfig: MCPConfiguration): ValidationResult => {
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
        description: 'Validate VS Code settings format',
        validator: (config: VSCodeSettings, originalConfig: MCPConfiguration): ValidationResult => {
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
   * Transform MCP configuration to VS Code settings format
   */
  transformConfig(mcpConfig: MCPConfiguration): VSCodeSettings {
    const vsCodeConfig: VSCodeSettings = {};
    
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
          this.setNestedValue(vsCodeConfig, rule.targetField, transformedValue);
        } else {
          Object.assign(vsCodeConfig, transformedValue);
        }
      }
    }
    
    return vsCodeConfig;
  }

  /**
   * Validate transformed VS Code configuration
   */
  validateTransformedConfig(transformedConfig: VSCodeSettings, originalConfig: MCPConfiguration): ValidationResult {
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
   * Write VS Code settings file
   */
  async writeEditorConfig(transformedConfig: VSCodeSettings, targetPath: string): Promise<void> {
    try {
      // Format with proper indentation for VS Code
      const jsonContent = JSON.stringify(transformedConfig, null, 2);
      writeFileSync(targetPath, jsonContent, 'utf8');
      
      console.log(`📝 Written VS Code settings to: ${targetPath}`);
    } catch (error) {
      console.error('❌ Failed to write VS Code settings:', error);
      throw error;
    }
  }

  /**
   * Read existing VS Code settings
   */
  async readExistingEditorConfig(configPath: string): Promise<VSCodeSettings> {
    try {
      if (!existsSync(configPath)) {
        return {};
      }
      
      const content = readFileSync(configPath, 'utf8');
      const config = JSON.parse(content);
      
      return config;
    } catch (error) {
      console.warn(`⚠️  Failed to read existing VS Code settings: ${error.message}`);
      return {};
    }
  }

  /**
   * Merge configurations with VS Code specific logic
   */
  protected mergeConfigurations(existing: VSCodeSettings, transformed: VSCodeSettings): VSCodeSettings {
    const merged = { ...existing };
    
    // Preserve existing VS Code settings that are not MCP-related
    const mcpKeys = Object.keys(transformed).filter(key => key.startsWith('mcp.'));
    const nonMcpKeys = Object.keys(existing).filter(key => !key.startsWith('mcp.'));
    
    // Keep all non-MCP settings
    nonMcpKeys.forEach(key => {
      merged[key] = existing[key];
    });
    
    // Apply all MCP settings from transformed config
    mcpKeys.forEach(key => {
      merged[key] = transformed[key];
    });
    
    return merged;
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  /**
   * Transform environment variables for VS Code format
   */
  private transformEnvironmentVariables(env: Record<string, string>): Record<string, string> {
    const transformed: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(env)) {
      // VS Code supports environment variable references
      if (value.startsWith('$')) {
        transformed[key] = value; // Keep as reference
      } else {
        transformed[key] = value;
      }
    }
    
    return transformed;
  }

  /**
   * Map log level to VS Code format
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

export default VSCodeAdapter;