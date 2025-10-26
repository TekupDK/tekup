#!/usr/bin/env node

/**
 * @fileoverview TekUp MCP Build System Integration
 * 
 * Build system integration for MCP configuration management including
 * validation, generation, CI/CD integration, and pre-commit hooks.
 * 
 * @author TekUp.org Development Team
 * @version 1.0.0
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, join } from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import MCPConfigurationLoader from './config-loader.js';
import EditorAdapterManager from './editor-adapter-manager.js';
import MCPMigrationTool from './migration-tool.js';
import MCPCleanupTool from './cleanup-tool.js';

const execAsync = promisify(exec);

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface BuildIntegrationConfig {
  version: string;
  build: {
    validateOnBuild: boolean;
    generateEditorConfigs: boolean;
    failOnValidationError: boolean;
    outputDirectory: string;
  };
  validation: {
    strictMode: boolean;
    checkEnvironmentVariables: boolean;
    validateAPIKeys: boolean;
    checkEditorCompatibility: boolean;
  };
  scripts: {
    preCommitHook: boolean;
    prePushHook: boolean;
    ciValidation: boolean;
    generatePackageScripts: boolean;
  };
  ci: {
    platforms: ('github' | 'gitlab' | 'jenkins' | 'azure')[];
    generateWorkflows: boolean;
    cacheConfiguration: boolean;
  };
}

export interface ValidationReport {
  timestamp: string;
  version: string;
  success: boolean;
  summary: {
    totalConfigs: number;
    validConfigs: number;
    invalidConfigs: number;
    warningsCount: number;
    errorsCount: number;
  };
  results: ValidationResult[];
  recommendations: string[];
}

export interface ValidationResult {
  configPath: string;
  configType: 'base' | 'environment' | 'editor' | 'migration';
  valid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: Record<string, any>;
}

// =============================================================================
// BUILD INTEGRATION CLASS
// =============================================================================

export class MCPBuildIntegration {
  private config: BuildIntegrationConfig;
  private configLoader: MCPConfigurationLoader;
  private adapterManager: EditorAdapterManager;

  constructor(configPath?: string) {
    this.loadBuildConfig(configPath);
    this.configLoader = new MCPConfigurationLoader();
    this.adapterManager = new EditorAdapterManager();
    this.initializeDirectories();
  }

  /**
   * Load build integration configuration
   */
  private loadBuildConfig(configPath?: string): void {
    const defaultPath = resolve(process.cwd(), '.mcp', 'configs', 'build-integration.json');
    const path = configPath || defaultPath;

    if (existsSync(path)) {
      try {
        const content = readFileSync(path, 'utf8');
        this.config = JSON.parse(content);
        console.log(`✅ Loaded build integration config from ${path}`);
      } catch (error) {
        console.warn(`⚠️  Failed to load build config, using defaults`);
        this.config = this.createDefaultBuildConfig();
      }
    } else {
      console.log('📋 Creating default build integration configuration');
      this.config = this.createDefaultBuildConfig();
      this.saveBuildConfig();
    }
  }

  /**
   * Create default build configuration
   */
  private createDefaultBuildConfig(): BuildIntegrationConfig {
    return {
      version: '1.0.0',
      build: {
        validateOnBuild: true,
        generateEditorConfigs: true,
        failOnValidationError: true,
        outputDirectory: 'dist'
      },
      validation: {
        strictMode: false,
        checkEnvironmentVariables: true,
        validateAPIKeys: true,
        checkEditorCompatibility: true
      },
      scripts: {
        preCommitHook: true,
        prePushHook: false,
        ciValidation: true,
        generatePackageScripts: true
      },
      ci: {
        platforms: ['github'],
        generateWorkflows: true,
        cacheConfiguration: true
      }
    };
  }

  /**
   * Save build configuration
   */
  private saveBuildConfig(): void {
    try {
      const configPath = resolve(process.cwd(), '.mcp', 'configs', 'build-integration.json');
      writeFileSync(configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('❌ Failed to save build config:', error);
    }
  }

  /**
   * Initialize required directories
   */
  private initializeDirectories(): void {
    const dirs = [
      '.mcp/configs',
      '.mcp/build',
      '.mcp/ci',
      '.mcp/hooks'
    ];

    dirs.forEach(dir => {
      const fullPath = resolve(process.cwd(), dir);
      if (!existsSync(fullPath)) {
        mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  /**
   * Run comprehensive validation of MCP configurations
   */
  async validateConfigurations(): Promise<ValidationReport> {
    console.log('🔍 Validating MCP configurations...');

    const results: ValidationResult[] = [];
    let totalErrors = 0;
    let totalWarnings = 0;

    try {
      // Validate base configuration
      const baseResult = await this.validateBaseConfiguration();
      results.push(baseResult);
      totalErrors += baseResult.errors.length;
      totalWarnings += baseResult.warnings.length;

      // Validate environment-specific configurations
      const environments = ['development', 'staging', 'production'];
      for (const env of environments) {
        const envResult = await this.validateEnvironmentConfiguration(env);
        if (envResult) {
          results.push(envResult);
          totalErrors += envResult.errors.length;
          totalWarnings += envResult.warnings.length;
        }
      }

      // Validate editor configurations
      if (this.config.validation.checkEditorCompatibility) {
        const editorResults = await this.validateEditorConfigurations();
        results.push(...editorResults);
        editorResults.forEach(result => {
          totalErrors += result.errors.length;
          totalWarnings += result.warnings.length;
        });
      }

      // Validate API keys
      if (this.config.validation.validateAPIKeys) {
        const apiKeyResult = await this.validateAPIKeys();
        if (apiKeyResult) {
          results.push(apiKeyResult);
          totalErrors += apiKeyResult.errors.length;
          totalWarnings += apiKeyResult.warnings.length;
        }
      }

    } catch (error) {
      console.error('❌ Validation failed:', error);
      results.push({
        configPath: 'system',
        configType: 'base',
        valid: false,
        errors: [`Validation system error: ${error.message}`],
        warnings: []
      });
      totalErrors++;
    }

    const report: ValidationReport = {
      timestamp: new Date().toISOString(),
      version: this.config.version,
      success: totalErrors === 0,
      summary: {
        totalConfigs: results.length,
        validConfigs: results.filter(r => r.valid).length,
        invalidConfigs: results.filter(r => !r.valid).length,
        warningsCount: totalWarnings,
        errorsCount: totalErrors
      },
      results,
      recommendations: this.generateValidationRecommendations(results)
    };

    // Save validation report
    this.saveValidationReport(report);

    return report;
  }

  /**
   * Validate base configuration
   */
  private async validateBaseConfiguration(): Promise<ValidationResult> {
    const configPath = resolve(process.cwd(), '.mcp', 'configs', 'base.json');
    
    try {
      if (!existsSync(configPath)) {
        return {
          configPath,
          configType: 'base',
          valid: false,
          errors: ['Base configuration file not found'],
          warnings: []
        };
      }

      const config = this.configLoader.loadConfiguration();
      const errors: string[] = [];
      const warnings: string[] = [];

      // Validate required fields
      if (!config.version) {
        errors.push('Missing version field');
      }

      if (!config.mcpServers || Object.keys(config.mcpServers).length === 0) {
        warnings.push('No MCP servers configured');
      }

      // Validate server configurations
      if (config.mcpServers) {
        for (const [serverName, serverConfig] of Object.entries(config.mcpServers)) {
          const server = serverConfig as any;
          
          if (!server.command) {
            errors.push(`Server '${serverName}' missing required 'command' field`);
          }

          if (server.transport?.type === 'websocket' && (!server.transport.host || !server.transport.port)) {
            errors.push(`WebSocket server '${serverName}' requires host and port`);
          }
        }
      }

      // Validate environment variables if enabled
      if (this.config.validation.checkEnvironmentVariables) {
        const envVars = this.extractEnvironmentVariables(config);
        for (const envVar of envVars) {
          if (!process.env[envVar]) {
            warnings.push(`Environment variable '${envVar}' is not set`);
          }
        }
      }

      return {
        configPath,
        configType: 'base',
        valid: errors.length === 0,
        errors,
        warnings,
        metadata: {
          serversCount: Object.keys(config.mcpServers || {}).length,
          environmentVariables: this.extractEnvironmentVariables(config)
        }
      };

    } catch (error) {
      return {
        configPath,
        configType: 'base',
        valid: false,
        errors: [`Failed to validate base configuration: ${error.message}`],
        warnings: []
      };
    }
  }

  /**
   * Validate environment-specific configuration
   */
  private async validateEnvironmentConfiguration(environment: string): Promise<ValidationResult | null> {
    const configPath = resolve(process.cwd(), '.mcp', 'configs', `${environment}.json`);
    
    if (!existsSync(configPath)) {
      return null; // Optional environment configs
    }

    try {
      const content = readFileSync(configPath, 'utf8');
      const config = JSON.parse(content);
      
      const errors: string[] = [];
      const warnings: string[] = [];

      // Validate environment-specific settings
      if (config.environment !== environment) {
        warnings.push(`Configuration environment field (${config.environment}) doesn't match filename (${environment})`);
      }

      // Check for environment-specific overrides
      if (!config.mcpServers && !config.settings && !config.browserAutomation) {
        warnings.push(`Environment configuration for '${environment}' appears to be empty`);
      }

      return {
        configPath,
        configType: 'environment',
        valid: errors.length === 0,
        errors,
        warnings,
        metadata: {
          environment,
          hasOverrides: !!(config.mcpServers || config.settings || config.browserAutomation)
        }
      };

    } catch (error) {
      return {
        configPath,
        configType: 'environment',
        valid: false,
        errors: [`Failed to validate ${environment} configuration: ${error.message}`],
        warnings: []
      };
    }
  }

  /**
   * Validate editor configurations
   */
  private async validateEditorConfigurations(): Promise<ValidationResult[]> {
    console.log('🔍 Validating editor compatibility...');

    try {
      await this.adapterManager.initializeAdapters();
      const testResults = await this.adapterManager.testSyncAll();
      
      const results: ValidationResult[] = [];

      for (const [editorName, testResult] of Object.entries(testResults)) {
        const configPath = `editor-${editorName}`;
        
        results.push({
          configPath,
          configType: 'editor',
          valid: testResult.success,
          errors: testResult.success ? [] : testResult.issues.filter((issue: string) => issue.includes('error') || issue.includes('failed')),
          warnings: testResult.success ? testResult.issues : testResult.issues.filter((issue: string) => !issue.includes('error') && !issue.includes('failed')),
          metadata: {
            editorName,
            transformed: !!testResult.transformed
          }
        });
      }

      return results;

    } catch (error) {
      return [{
        configPath: 'editors',
        configType: 'editor',
        valid: false,
        errors: [`Editor validation failed: ${error.message}`],
        warnings: []
      }];
    }
  }

  /**
   * Validate API keys
   */
  private async validateAPIKeys(): Promise<ValidationResult | null> {
    console.log('🔑 Validating API keys...');

    try {
      // This would integrate with the API key manager
      const configPath = 'api-keys';
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check for common API key environment variables
      const commonApiKeys = [
        'OPENAI_API_KEY',
        'ANTHROPIC_API_KEY',
        'GOOGLE_API_KEY',
        'BRAVE_SEARCH_API_KEY'
      ];

      for (const keyName of commonApiKeys) {
        if (process.env[keyName]) {
          if (process.env[keyName]!.length < 10) {
            warnings.push(`API key '${keyName}' appears to be too short`);
          }
        }
      }

      return {
        configPath,
        configType: 'base',
        valid: errors.length === 0,
        errors,
        warnings,
        metadata: {
          foundKeys: commonApiKeys.filter(key => process.env[key]),
          missingKeys: commonApiKeys.filter(key => !process.env[key])
        }
      };

    } catch (error) {
      return {
        configPath: 'api-keys',
        configType: 'base',
        valid: false,
        errors: [`API key validation failed: ${error.message}`],
        warnings: []
      };
    }
  }

  /**
   * Extract environment variables from configuration
   */
  private extractEnvironmentVariables(config: any): string[] {
    const envVars: Set<string> = new Set();

    const extractFromObject = (obj: any) => {
      if (typeof obj === 'string' && obj.startsWith('$')) {
        envVars.add(obj.substring(1));
      } else if (typeof obj === 'object' && obj !== null) {
        Object.values(obj).forEach(extractFromObject);
      }
    };

    extractFromObject(config);
    return Array.from(envVars);
  }

  /**
   * Generate validation recommendations
   */
  private generateValidationRecommendations(results: ValidationResult[]): string[] {
    const recommendations: string[] = [];
    
    const errorCount = results.reduce((sum, r) => sum + r.errors.length, 0);
    const warningCount = results.reduce((sum, r) => sum + r.warnings.length, 0);

    if (errorCount > 0) {
      recommendations.push(`Fix ${errorCount} configuration errors before deploying.`);
    }

    if (warningCount > 0) {
      recommendations.push(`Review ${warningCount} configuration warnings.`);
    }

    const invalidConfigs = results.filter(r => !r.valid);
    if (invalidConfigs.length > 0) {
      recommendations.push(`${invalidConfigs.length} configurations failed validation and need attention.`);
    }

    if (errorCount === 0 && warningCount === 0) {
      recommendations.push('All configurations are valid. Ready for deployment.');
    }

    recommendations.push('Run validation regularly to catch configuration drift.');

    return recommendations;
  }

  /**
   * Generate editor-specific configurations
   */
  async generateEditorConfigurations(): Promise<boolean> {
    console.log('🔄 Generating editor-specific configurations...');

    try {
      await this.adapterManager.initializeAdapters();
      const syncResult = await this.adapterManager.syncAllAdapters();

      const success = syncResult.failureCount === 0;
      
      if (success) {
        console.log('✅ Successfully generated all editor configurations');
      } else {
        console.error(`❌ Failed to generate ${syncResult.failureCount} editor configurations`);
      }

      return success;

    } catch (error) {
      console.error('❌ Failed to generate editor configurations:', error);
      return false;
    }
  }

  /**
   * Generate package.json scripts for MCP management
   */
  generatePackageScripts(): void {
    console.log('📝 Generating package.json scripts...');

    const packageJsonPath = resolve(process.cwd(), 'package.json');
    
    try {
      let packageJson: any = {};
      
      if (existsSync(packageJsonPath)) {
        packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      }

      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }

      // Add MCP-related scripts
      const mcpScripts = {
        'mcp:validate': 'node .mcp/scripts/build-integration.js validate',
        'mcp:build': 'node .mcp/scripts/build-integration.js build',
        'mcp:clean': 'node .mcp/scripts/cleanup-tool.js scan',
        'mcp:migrate': 'node .mcp/scripts/migration-tool.js migrate',
        'mcp:sync': 'node .mcp/scripts/editor-adapter-manager.js sync',
        'mcp:test': 'node .mcp/scripts/editor-adapter-manager.js test',
        'mcp:status': 'node .mcp/scripts/monitoring-system.js status',
        'mcp:monitor': 'node .mcp/scripts/monitoring-system.js start'
      };

      // Merge with existing scripts
      Object.assign(packageJson.scripts, mcpScripts);

      // Write back to package.json
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      
      console.log('✅ Added MCP scripts to package.json');

    } catch (error) {
      console.error('❌ Failed to update package.json:', error);
    }
  }

  /**
   * Generate pre-commit hook
   */
  generatePreCommitHook(): void {
    if (!this.config.scripts.preCommitHook) return;

    console.log('🪝 Generating pre-commit hook...');

    const hookContent = `#!/bin/sh
# TekUp MCP Configuration Pre-commit Hook
# Validates MCP configurations before commit

echo "🔍 Validating MCP configurations..."

# Run MCP validation
npm run mcp:validate

if [ $? -ne 0 ]; then
  echo "❌ MCP configuration validation failed. Please fix the errors before committing."
  exit 1
fi

echo "✅ MCP configuration validation passed"
exit 0
`;

    const hookPath = resolve(process.cwd(), '.git', 'hooks', 'pre-commit');
    
    try {
      writeFileSync(hookPath, hookContent);
      
      // Make executable (Unix systems)
      if (process.platform !== 'win32') {
        require('fs').chmodSync(hookPath, '755');
      }

      console.log('✅ Pre-commit hook installed');

    } catch (error) {
      console.error('❌ Failed to install pre-commit hook:', error);
    }
  }

  /**
   * Generate CI/CD workflow files
   */
  generateCIWorkflows(): void {
    if (!this.config.ci.generateWorkflows) return;

    console.log('🔄 Generating CI/CD workflows...');

    for (const platform of this.config.ci.platforms) {
      switch (platform) {
        case 'github':
          this.generateGitHubWorkflow();
          break;
        case 'gitlab':
          this.generateGitLabCI();
          break;
        case 'jenkins':
          this.generateJenkinsfile();
          break;
        case 'azure':
          this.generateAzurePipeline();
          break;
      }
    }
  }

  /**
   * Generate GitHub Actions workflow
   */
  private generateGitHubWorkflow(): void {
    const workflowContent = `name: MCP Configuration Validation

on:
  push:
    branches: [ main, develop ]
    paths:
      - '.mcp/**'
      - 'package.json'
      - '.vscode/**'
      - '.cursor/**'
      - '.windsurf/**'
  pull_request:
    branches: [ main ]
    paths:
      - '.mcp/**'
      - 'package.json'
      - '.vscode/**'
      - '.cursor/**'
      - '.windsurf/**'

jobs:
  validate-mcp:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'pnpm'
    
    - name: Install dependencies
      run: pnpm install
    
    ${this.config.ci.cacheConfiguration ? `
    - name: Cache MCP configurations
      uses: actions/cache@v3
      with:
        path: .mcp/cache
        key: mcp-config-\${{ hashFiles('.mcp/**/*.json') }}
        restore-keys: |
          mcp-config-
    ` : ''}
    
    - name: Validate MCP configurations
      run: pnpm run mcp:validate
      env:
        NODE_ENV: test
    
    - name: Test editor configurations
      run: pnpm run mcp:test
    
    - name: Generate editor configurations
      run: pnpm run mcp:build
    
    - name: Upload validation report
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: mcp-validation-report
        path: .mcp/reports/
        retention-days: 30

  security-check:
    runs-on: ubuntu-latest
    needs: validate-mcp
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Check for API key leaks
      run: |
        if grep -r "sk-" .mcp/ --include="*.json" --include="*.js" --include="*.ts"; then
          echo "❌ Potential API key leak detected in MCP configurations"
          exit 1
        fi
        echo "✅ No API key leaks detected"
`;

    const workflowPath = resolve(process.cwd(), '.github', 'workflows', 'mcp-validation.yml');
    
    try {
      const workflowDir = resolve(process.cwd(), '.github', 'workflows');
      if (!existsSync(workflowDir)) {
        mkdirSync(workflowDir, { recursive: true });
      }

      writeFileSync(workflowPath, workflowContent);
      console.log('✅ Generated GitHub Actions workflow');

    } catch (error) {
      console.error('❌ Failed to generate GitHub workflow:', error);
    }
  }

  /**
   * Generate GitLab CI configuration
   */
  private generateGitLabCI(): void {
    const ciContent = `# TekUp MCP Configuration CI/CD Pipeline

stages:
  - validate
  - build
  - test

variables:
  NODE_VERSION: "20"

# Cache configuration
cache:
  paths:
    - node_modules/
    - .mcp/cache/

validate-mcp:
  stage: validate
  image: node:$NODE_VERSION
  before_script:
    - npm install -g pnpm
    - pnpm install
  script:
    - pnpm run mcp:validate
    - pnpm run mcp:clean --dry-run
  artifacts:
    reports:
      junit: .mcp/reports/validation-report.xml
    paths:
      - .mcp/reports/
    expire_in: 1 week
  only:
    changes:
      - .mcp/**/*
      - .vscode/**/*
      - .cursor/**/*
      - .windsurf/**/*

build-editor-configs:
  stage: build
  image: node:$NODE_VERSION
  needs: ["validate-mcp"]
  before_script:
    - npm install -g pnpm
    - pnpm install
  script:
    - pnpm run mcp:build
  artifacts:
    paths:
      - .vscode/settings.json
      - .cursor/settings.json
      - .windsurf/settings.json
    expire_in: 1 week

test-editor-compatibility:
  stage: test
  image: node:$NODE_VERSION
  needs: ["build-editor-configs"]
  before_script:
    - npm install -g pnpm
    - pnpm install
  script:
    - pnpm run mcp:test
  artifacts:
    reports:
      junit: .mcp/reports/test-report.xml
`;

    const ciPath = resolve(process.cwd(), '.gitlab-ci.yml');
    
    try {
      writeFileSync(ciPath, ciContent);
      console.log('✅ Generated GitLab CI configuration');

    } catch (error) {
      console.error('❌ Failed to generate GitLab CI:', error);
    }
  }

  /**
   * Generate Jenkinsfile
   */
  private generateJenkinsfile(): void {
    const jenkinsContent = `pipeline {
    agent any
    
    environment {
        NODE_VERSION = '20'
    }
    
    stages {
        stage('Setup') {
            steps {
                sh 'npm install -g pnpm'
                sh 'pnpm install'
            }
        }
        
        stage('Validate MCP') {
            steps {
                sh 'pnpm run mcp:validate'
            }
            post {
                always {
                    archiveArtifacts artifacts: '.mcp/reports/**/*', fingerprint: true
                }
            }
        }
        
        stage('Build Configurations') {
            steps {
                sh 'pnpm run mcp:build'
            }
        }
        
        stage('Test Editor Compatibility') {
            steps {
                sh 'pnpm run mcp:test'
            }
        }
        
        stage('Security Check') {
            steps {
                script {
                    def apiKeyCheck = sh(
                        script: 'grep -r "sk-" .mcp/ --include="*.json" --include="*.js" --include="*.ts" || true',
                        returnStdout: true
                    ).trim()
                    
                    if (apiKeyCheck) {
                        error("API key leak detected in MCP configurations")
                    }
                }
            }
        }
    }
    
    post {
        always {
            publishHTML([
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: '.mcp/reports',
                reportFiles: '*.html',
                reportName: 'MCP Validation Report'
            ])
        }
        failure {
            emailext (
                subject: "MCP Configuration Validation Failed: \${env.JOB_NAME} - \${env.BUILD_NUMBER}",
                body: "The MCP configuration validation failed. Please check the Jenkins console output.",
                to: "\${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
    }
}`;

    const jenkinsPath = resolve(process.cwd(), 'Jenkinsfile');
    
    try {
      writeFileSync(jenkinsPath, jenkinsContent);
      console.log('✅ Generated Jenkinsfile');

    } catch (error) {
      console.error('❌ Failed to generate Jenkinsfile:', error);
    }
  }

  /**
   * Generate Azure DevOps pipeline
   */
  private generateAzurePipeline(): void {
    const azureContent = `# TekUp MCP Configuration Azure Pipeline

trigger:
  branches:
    include:
    - main
    - develop
  paths:
    include:
    - .mcp/*
    - .vscode/*
    - .cursor/*
    - .windsurf/*

pool:
  vmImage: 'ubuntu-latest'

variables:
  nodeVersion: '20.x'

stages:
- stage: Validate
  displayName: 'Validate MCP Configurations'
  jobs:
  - job: ValidateMCP
    displayName: 'Validate MCP'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '\$(nodeVersion)'
      displayName: 'Install Node.js'
    
    - script: |
        npm install -g pnpm
        pnpm install
      displayName: 'Install dependencies'
    
    - script: pnpm run mcp:validate
      displayName: 'Validate MCP configurations'
    
    - task: PublishTestResults@2
      condition: always()
      inputs:
        testResultsFormat: 'JUnit'
        testResultsFiles: '.mcp/reports/validation-report.xml'
      displayName: 'Publish validation results'

- stage: Build
  displayName: 'Build Editor Configurations'
  dependsOn: Validate
  condition: succeeded()
  jobs:
  - job: BuildConfigs
    displayName: 'Build Editor Configs'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '\$(nodeVersion)'
      displayName: 'Install Node.js'
    
    - script: |
        npm install -g pnpm
        pnpm install
      displayName: 'Install dependencies'
    
    - script: pnpm run mcp:build
      displayName: 'Generate editor configurations'
    
    - task: PublishBuildArtifacts@1
      inputs:
        pathToPublish: '.vscode/settings.json'
        artifactName: 'vscode-config'
      displayName: 'Publish VS Code config'

- stage: Test
  displayName: 'Test Editor Compatibility'
  dependsOn: Build
  condition: succeeded()
  jobs:
  - job: TestEditors
    displayName: 'Test Editor Compatibility'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '\$(nodeVersion)'
      displayName: 'Install Node.js'
    
    - script: |
        npm install -g pnpm
        pnpm install
      displayName: 'Install dependencies'
    
    - script: pnpm run mcp:test
      displayName: 'Test editor compatibility'
`;

    const azurePath = resolve(process.cwd(), 'azure-pipelines.yml');
    
    try {
      writeFileSync(azurePath, azureContent);
      console.log('✅ Generated Azure DevOps pipeline');

    } catch (error) {
      console.error('❌ Failed to generate Azure pipeline:', error);
    }
  }

  /**
   * Save validation report
   */
  private saveValidationReport(report: ValidationReport): void {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportPath = resolve(process.cwd(), '.mcp', 'reports', `validation-report-${timestamp}.json`);
      writeFileSync(reportPath, JSON.stringify(report, null, 2));
      
      console.log(`📊 Validation report saved: ${reportPath}`);
    } catch (error) {
      console.error('❌ Failed to save validation report:', error);
    }
  }

  /**
   * Run full build process
   */
  async runBuild(): Promise<boolean> {
    console.log('🚀 Running MCP build process...');

    let success = true;

    try {
      // Validate configurations
      if (this.config.build.validateOnBuild) {
        const validationReport = await this.validateConfigurations();
        
        if (!validationReport.success && this.config.build.failOnValidationError) {
          console.error('❌ Build failed due to validation errors');
          return false;
        }

        if (!validationReport.success) {
          console.warn('⚠️  Build continuing despite validation errors');
          success = false;
        }
      }

      // Generate editor configurations
      if (this.config.build.generateEditorConfigs) {
        const editorSuccess = await this.generateEditorConfigurations();
        if (!editorSuccess) {
          success = false;
        }
      }

      if (success) {
        console.log('✅ MCP build completed successfully');
      } else {
        console.log('⚠️  MCP build completed with warnings');
      }

      return success;

    } catch (error) {
      console.error('❌ MCP build failed:', error);
      return false;
    }
  }

  /**
   * Initialize build system integration
   */
  async initializeBuildIntegration(): Promise<void> {
    console.log('🔧 Initializing build system integration...');

    // Generate package.json scripts
    if (this.config.scripts.generatePackageScripts) {
      this.generatePackageScripts();
    }

    // Generate pre-commit hooks
    if (this.config.scripts.preCommitHook) {
      this.generatePreCommitHook();
    }

    // Generate CI/CD workflows
    if (this.config.ci.generateWorkflows) {
      this.generateCIWorkflows();
    }

    console.log('✅ Build system integration initialized');
  }
}

// =============================================================================
// CLI INTERFACE
// =============================================================================

async function main() {
  const command = process.argv[2];
  const buildIntegration = new MCPBuildIntegration();

  switch (command) {
    case 'validate':
      const report = await buildIntegration.validateConfigurations();
      
      console.log('\n📊 Validation Summary:');
      console.log(`   Total Configs: ${report.summary.totalConfigs}`);
      console.log(`   Valid: ${report.summary.validConfigs} ✅`);
      console.log(`   Invalid: ${report.summary.invalidConfigs} ❌`);
      console.log(`   Warnings: ${report.summary.warningsCount} ⚠️`);
      console.log(`   Errors: ${report.summary.errorsCount} 🚨`);
      
      if (report.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        report.recommendations.forEach(rec => console.log(`   - ${rec}`));
      }
      
      process.exit(report.success ? 0 : 1);
      break;

    case 'build':
      const buildSuccess = await buildIntegration.runBuild();
      process.exit(buildSuccess ? 0 : 1);
      break;

    case 'init':
      await buildIntegration.initializeBuildIntegration();
      break;

    case 'scripts':
      buildIntegration.generatePackageScripts();
      break;

    case 'hooks':
      buildIntegration.generatePreCommitHook();
      break;

    case 'ci':
      buildIntegration.generateCIWorkflows();
      break;

    default:
      console.log(`
TekUp MCP Build System Integration

Usage: node build-integration.js <command>

Commands:
  validate  - Validate all MCP configurations
  build     - Run full build process (validate + generate)
  init      - Initialize build system integration
  scripts   - Generate package.json scripts
  hooks     - Generate pre-commit hooks
  ci        - Generate CI/CD workflow files

Examples:
  node build-integration.js validate
  node build-integration.js build
  node build-integration.js init
      `);
  }
}

// Run CLI if this is the main module
if (require.main === module) {
  main().catch(console.error);
}

export default MCPBuildIntegration;