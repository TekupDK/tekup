#!/usr/bin/env node

/**
 * @fileoverview Cursor AI Editor Adapter for MCP Configuration Integration
 * 
 * Specialized adapter for integrating centralized MCP configuration
 * with Cursor AI code editor settings and extensions.
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
// CURSOR SPECIFIC TYPES
// =============================================================================

interface CursorSettings {
  "mcp.servers"?: Record<string, CursorMCPServer>;
  "mcp.enabled"?: boolean;
  "mcp.autoStart"?: boolean;
  "mcp.logLevel"?: "debug" | "info" | "warn" | "error";
  "mcp.timeout"?: number;
  "cursor.ai.enabled"?: boolean;
  "cursor.ai.model"?: string;
  "cursor.ai.customInstructions"?: string;
  "cursor.completions.enabled"?: boolean;
  "cursor.chat.enabled"?: boolean;
  "extensions.autoUpdate"?: boolean;
  [key: string]: any;
}

interface CursorMCPServer {
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
  cursorIntegration?: {
    enabled?: boolean;
    contextAware?: boolean;
    aiAssisted?: boolean;
  };
}

// =============================================================================
// CURSOR ADAPTER IMPLEMENTATION
// =============================================================================

export class CursorAdapter extends BaseEditorAdapter {
  
  constructor(configLoader: any) {
    const editorInfo: EditorInfo = {
      name: 'cursor',
      displayName: 'Cursor AI',
      configDir: join(process.env.APPDATA || process.env.HOME || '', 'Cursor', 'User'),
      configFile: 'settings.json',
      format: 'json',
      executable: 'cursor',
      installed: false
    };
    
    super(editorInfo, configLoader);
  }

  /**
   * Detect Cursor installation and version
   */
  async detectEditor(): Promise<EditorInfo> {
    const editorInfo = { ...this.config.editor };
    
    try {
      // Try to detect Cursor installation
      const possiblePaths = [
        'cursor',
        join(process.env.LOCALAPPDATA || '', 'Programs', 'Cursor', 'Cursor.exe'),
        join(process.env.PROGRAMFILES || '', 'Cursor', 'Cursor.exe'),
        join(process.env.PROGRAMW6432 || '', 'Cursor', 'Cursor.exe'),
        '/Applications/Cursor.app/Contents/MacOS/Cursor', // macOS
        '/usr/local/bin/cursor', // Linux
        '/opt/cursor/cursor' // Linux alternative
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
          `${process.env.LOCALAPPDATA}\\Programs\\Cursor\\Cursor.exe`,
          `${process.env.PROGRAMFILES}\\Cursor\\Cursor.exe`,
          `${process.env['PROGRAMFILES(X86)']}\\Cursor\\Cursor.exe`
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
        editorInfo.configDir = join(process.env.APPDATA || '', 'Cursor', 'User');
      } else if (process.platform === 'darwin') {
        editorInfo.configDir = join(process.env.HOME || '', 'Library', 'Application Support', 'Cursor', 'User');
      } else {
        editorInfo.configDir = join(process.env.HOME || '', '.config', 'Cursor', 'User');
      }

    } catch (error) {
      console.warn(`⚠️  Could not detect Cursor installation:`, error.message);
    }

    return editorInfo;
  }

  /**
   * Get Cursor specific transformation rules
   */
  getTransformationRules(): TransformationRule[] {
    return [
      {
        id: 'mcp-servers-transform',
        description: 'Transform MCP servers to Cursor format with AI integration',
        sourceField: 'mcpServers',
        targetField: 'mcp.servers',
        transformer: (servers: any, config: MCPConfiguration) => {
          const cursorServers: Record<string, CursorMCPServer> = {};
          
          for (const [serverName, serverConfig] of Object.entries(servers || {})) {
            const server = serverConfig as any;
            
            cursorServers[serverName] = {
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
              // Cursor-specific AI integration settings
              cursorIntegration: {
                enabled: server.cursorIntegration?.enabled !== false,
                contextAware: server.cursorIntegration?.contextAware !== false,
                aiAssisted: server.cursorIntegration?.aiAssisted !== false
              }
            };
          }
          
          return cursorServers;
        }
      },
      {
        id: 'mcp-settings-transform',
        description: 'Transform MCP global settings for Cursor',
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
        id: 'cursor-ai-settings',
        description: 'Configure Cursor AI specific settings',
        sourceField: 'cursorAI',
        transformer: (aiConfig: any, config: MCPConfiguration) => {
          if (!aiConfig) return {};
          
          return {
            'cursor.ai.enabled': aiConfig.enabled !== false,
            'cursor.ai.model': aiConfig.model || 'gpt-4',
            'cursor.ai.customInstructions': aiConfig.customInstructions || '',
            'cursor.completions.enabled': aiConfig.completions?.enabled !== false,
            'cursor.chat.enabled': aiConfig.chat?.enabled !== false
          };
        }
      },
      {
        id: 'browser-automation-settings',
        description: 'Add browser automation settings optimized for Cursor',
        sourceField: 'browserAutomation',
        transformer: (browserConfig: any, config: MCPConfiguration) => {
          if (!browserConfig) return {};
          
          return {
            'mcp.browserAutomation.enabled': browserConfig.enabled !== false,
            'mcp.browserAutomation.defaultBrowser': browserConfig.defaultBrowser || 'chrome',
            'mcp.browserAutomation.headless': browserConfig.headless !== false,
            'mcp.browserAutomation.timeout': browserConfig.timeout || 30000,
            'mcp.browserAutomation.cursorIntegration': browserConfig.cursorIntegration !== false,
            'mcp.browserAutomation.aiContextSharing': browserConfig.aiContextSharing !== false
          };
        }
      }
    ];
  }

  /**
   * Get Cursor specific validation rules
   */
  getValidationRules(): ValidationRule[] {
    return [
      {
        id: 'validate-mcp-servers',
        description: 'Validate MCP servers configuration for Cursor',
        validator: (config: CursorSettings, originalConfig: MCPConfiguration): ValidationResult => {
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

            // Cursor-specific validations
            if (serverConfig.cursorIntegration?.aiAssisted && !config['cursor.ai.enabled']) {
              warnings.push(`Server '${serverName}' has AI assistance enabled but Cursor AI is disabled`);
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
        id: 'validate-cursor-ai-settings',
        description: 'Validate Cursor AI configuration',
        validator: (config: CursorSettings, originalConfig: MCPConfiguration): ValidationResult => {
          const errors: string[] = [];
          const warnings: string[] = [];
          
          // Check AI model configuration
          const aiModel = config['cursor.ai.model'];
          if (aiModel && !['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'claude-3', 'claude-3.5'].includes(aiModel)) {
            warnings.push(`Unknown AI model: ${aiModel}. Consider using a supported model.`);
          }

          // Check if AI is enabled but no custom instructions
          if (config['cursor.ai.enabled'] && !config['cursor.ai.customInstructions']) {
            warnings.push('Cursor AI is enabled but no custom instructions provided. Consider adding project-specific instructions.');
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
        description: 'Validate Cursor settings format',
        validator: (config: CursorSettings, originalConfig: MCPConfiguration): ValidationResult => {
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
   * Transform MCP configuration to Cursor settings format
   */
  transformConfig(mcpConfig: MCPConfiguration): CursorSettings {
    const cursorConfig: CursorSettings = {};
    
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
          this.setNestedValue(cursorConfig, rule.targetField, transformedValue);
        } else {
          Object.assign(cursorConfig, transformedValue);
        }
      }
    }
    
    return cursorConfig;
  }

  /**
   * Validate transformed Cursor configuration
   */
  validateTransformedConfig(transformedConfig: CursorSettings, originalConfig: MCPConfiguration): ValidationResult {
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
   * Write Cursor settings file
   */
  async writeEditorConfig(transformedConfig: CursorSettings, targetPath: string): Promise<void> {
    try {
      // Format with proper indentation for Cursor
      const jsonContent = JSON.stringify(transformedConfig, null, 2);
      writeFileSync(targetPath, jsonContent, 'utf8');
      
      console.log(`📝 Written Cursor settings to: ${targetPath}`);
    } catch (error) {
      console.error('❌ Failed to write Cursor settings:', error);
      throw error;
    }
  }

  /**
   * Read existing Cursor settings
   */
  async readExistingEditorConfig(configPath: string): Promise<CursorSettings> {
    try {
      if (!existsSync(configPath)) {
        return {};
      }
      
      const content = readFileSync(configPath, 'utf8');
      const config = JSON.parse(content);
      
      return config;
    } catch (error) {
      console.warn(`⚠️  Failed to read existing Cursor settings: ${error.message}`);
      return {};
    }
  }

  /**
   * Merge configurations with Cursor specific logic
   */
  protected mergeConfigurations(existing: CursorSettings, transformed: CursorSettings): CursorSettings {
    const merged = { ...existing };
    
    // Preserve existing Cursor settings that are not MCP-related
    const mcpKeys = Object.keys(transformed).filter(key => key.startsWith('mcp.') || key.startsWith('cursor.'));
    const nonMcpKeys = Object.keys(existing).filter(key => !key.startsWith('mcp.') && !key.startsWith('cursor.'));
    
    // Keep all non-MCP/Cursor settings
    nonMcpKeys.forEach(key => {
      merged[key] = existing[key];
    });
    
    // Apply all MCP and Cursor settings from transformed config
    Object.keys(transformed).forEach(key => {
      merged[key] = transformed[key];
    });
    
    return merged;
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  /**
   * Transform environment variables for Cursor format
   */
  private transformEnvironmentVariables(env: Record<string, string>): Record<string, string> {
    const transformed: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(env)) {
      // Cursor supports environment variable references like VS Code
      if (value.startsWith('$')) {
        transformed[key] = value; // Keep as reference
      } else {
        transformed[key] = value;
      }
    }
    
    return transformed;
  }

  /**
   * Map log level to Cursor format
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

export default CursorAdapter;