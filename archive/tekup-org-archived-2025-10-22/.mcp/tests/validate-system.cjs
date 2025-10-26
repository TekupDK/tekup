#!/usr/bin/env node
/**
 * @fileoverview Simplified system validation script for MCP Configuration Management System
 * 
 * This script performs basic validation of the MCP configuration system without
 * complex TypeScript dependencies.
 * 
 * @author TekUp.org Development Team
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

class MCPSystemValidator {
  constructor() {
    this.results = [];
    this.startTime = performance.now();
  }

  /**
   * Main validation entry point
   */
  async validate() {
    console.log('🧪 MCP Configuration Management System - System Validation');
    console.log('=' .repeat(60));
    console.log();

    try {
      // Check directory structure
      await this.validateDirectoryStructure();
      
      // Validate configuration files
      await this.validateConfigurationFiles();
      
      // Check scripts and tools
      await this.validateScriptsAndTools();
      
      // Validate documentation
      await this.validateDocumentation();
      
      // Check environment setup
      await this.validateEnvironmentSetup();
      
      // Performance checks
      await this.performanceChecks();
      
      // Security validation
      await this.securityValidation();
      
      // Print summary
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    }
  }

  /**
   * Validate directory structure
   */
  async validateDirectoryStructure() {
    console.log('🏗️  Validating Directory Structure...');
    
    const requiredDirs = [
      '.mcp',
      '.mcp/configs',
      '.mcp/schemas',
      '.mcp/scripts',
      '.mcp/docs',
      '.mcp/tests'
    ];

    for (const dir of requiredDirs) {
      await this.checkPath(dir, 'directory', `Directory structure: ${dir}`);
    }
    
    console.log('✅ Directory structure validation complete\n');
  }

  /**
   * Validate configuration files
   */
  async validateConfigurationFiles() {
    console.log('📄 Validating Configuration Files...');
    
    const configFiles = [
      '.mcp/configs/base.json',
      '.mcp/configs/development.json',
      '.mcp/configs/staging.json',
      '.mcp/configs/production.json'
    ];

    for (const file of configFiles) {
      await this.validateJSONFile(file);
    }
    
    console.log('✅ Configuration files validation complete\n');
  }

  /**
   * Validate scripts and tools
   */
  async validateScriptsAndTools() {
    console.log('🔧 Validating Scripts and Tools...');
    
    const scripts = [
      '.mcp/scripts/migration-tool.ts',
      '.mcp/scripts/cleanup-tool.ts',
      '.mcp/scripts/build-integration.ts',
      '.mcp/scripts/config-loader.ts'
    ];

    for (const script of scripts) {
      await this.checkPath(script, 'file', `Script: ${path.basename(script)}`);
    }
    
    console.log('✅ Scripts and tools validation complete\n');
  }

  /**
   * Validate documentation
   */
  async validateDocumentation() {
    console.log('📚 Validating Documentation...');
    
    const docs = [
      '.mcp/docs/README.md',
      '.mcp/docs/SETUP.md',
      '.mcp/docs/MIGRATION.md',
      '.mcp/docs/TROUBLESHOOTING.md',
      '.mcp/docs/API.md',
      '.mcp/docs/INDEX.md'
    ];

    for (const doc of docs) {
      await this.checkPath(doc, 'file', `Documentation: ${path.basename(doc)}`);
    }
    
    console.log('✅ Documentation validation complete\n');
  }

  /**
   * Validate environment setup
   */
  async validateEnvironmentSetup() {
    console.log('🌍 Validating Environment Setup...');
    
    const tests = [
      {
        name: 'Node.js version check',
        test: () => {
          const version = process.version;
          const major = parseInt(version.slice(1).split('.')[0]);
          return major >= 18;
        }
      },
      {
        name: 'Current working directory',
        test: () => path.basename(process.cwd()) === 'Tekup-org'
      },
      {
        name: 'Package.json exists',
        test: () => fs.existsSync('package.json')
      },
      {
        name: 'Environment file template',
        test: () => fs.existsSync('.env.example') || fs.existsSync('.env')
      }
    ];

    for (const test of tests) {
      await this.runTest(test.name, test.test);
    }
    
    console.log('✅ Environment setup validation complete\n');
  }

  /**
   * Performance checks
   */
  async performanceChecks() {
    console.log('⚡ Running Performance Checks...');
    
    const startTime = performance.now();
    
    // Simulate configuration loading performance
    const configLoadTime = await this.simulateConfigLoad();
    await this.recordResult(`Configuration loading simulation`, 
      configLoadTime < 1000, 
      `${configLoadTime.toFixed(2)}ms (target: <1000ms)`);
    
    // Memory usage check
    const memoryUsage = process.memoryUsage();
    const heapMB = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
    await this.recordResult(`Memory usage baseline`, 
      memoryUsage.heapUsed < 100 * 1024 * 1024, 
      `${heapMB}MB heap used`);
    
    console.log('✅ Performance checks complete\n');
  }

  /**
   * Security validation
   */
  async securityValidation() {
    console.log('🔒 Running Security Validation...');
    
    // Check for potential API key leaks in config files
    await this.checkAPIKeyLeaks();
    
    // Validate file permissions (basic check)
    await this.checkFilePermissions();
    
    console.log('✅ Security validation complete\n');
  }

  /**
   * Check if a path exists and is of the correct type
   */
  async checkPath(pathStr, type, testName) {
    try {
      const stats = fs.statSync(pathStr);
      const isCorrectType = type === 'file' ? stats.isFile() : stats.isDirectory();
      
      await this.recordResult(testName, isCorrectType, 
        isCorrectType ? `${type} exists` : `Expected ${type}, found ${stats.isFile() ? 'file' : 'directory'}`);
        
    } catch (error) {
      await this.recordResult(testName, false, `Path does not exist: ${pathStr}`);
    }
  }

  /**
   * Validate JSON file
   */
  async validateJSONFile(filePath) {
    const testName = `JSON validation: ${path.basename(filePath)}`;
    
    try {
      if (!fs.existsSync(filePath)) {
        await this.recordResult(testName, false, 'File does not exist');
        return;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(content);
      
      // Basic structure validation for MCP configs
      if (filePath.includes('configs/')) {
        const hasRequiredFields = parsed.version || parsed.extends || parsed.servers;
        await this.recordResult(testName, hasRequiredFields, 
          hasRequiredFields ? 'Valid MCP configuration structure' : 'Missing required fields');
      } else {
        await this.recordResult(testName, true, 'Valid JSON');
      }
      
    } catch (error) {
      await this.recordResult(testName, false, `Invalid JSON: ${error.message}`);
    }
  }

  /**
   * Run a simple test
   */
  async runTest(name, testFn) {
    try {
      const result = testFn();
      await this.recordResult(name, result, result ? 'Pass' : 'Fail');
    } catch (error) {
      await this.recordResult(name, false, error.message);
    }
  }

  /**
   * Simulate configuration loading performance
   */
  async simulateConfigLoad() {
    const startTime = performance.now();
    
    // Simulate reading and parsing config files
    const files = ['.mcp/configs/base.json', '.mcp/configs/development.json'];
    
    for (const file of files) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        JSON.parse(content);
      }
    }
    
    // Simulate some processing time
    await this.delay(Math.random() * 50 + 10);
    
    return performance.now() - startTime;
  }

  /**
   * Check for potential API key leaks
   */
  async checkAPIKeyLeaks() {
    const configFiles = [
      '.mcp/configs/base.json',
      '.mcp/configs/development.json',
      '.mcp/configs/staging.json',
      '.mcp/configs/production.json'
    ];

    let foundLeaks = false;
    const apiKeyPatterns = [
      /sk-[a-zA-Z0-9]{48,}/,  // OpenAI-style keys
      /[a-zA-Z0-9]{32,}/      // Generic long keys
    ];

    for (const file of configFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        for (const pattern of apiKeyPatterns) {
          if (pattern.test(content) && !content.includes('${')) {
            // Found potential hardcoded key (not an env var reference)
            foundLeaks = true;
            break;
          }
        }
      }
    }

    await this.recordResult('API key leak detection', !foundLeaks, 
      foundLeaks ? 'Potential API key leaks found' : 'No API key leaks detected');
  }

  /**
   * Check file permissions (basic)
   */
  async checkFilePermissions() {
    const sensitiveFiles = ['.env', '.mcp/configs'];
    let permissionsOk = true;

    for (const file of sensitiveFiles) {
      if (fs.existsSync(file)) {
        try {
          // Basic check - ensure we can read the file
          fs.accessSync(file, fs.constants.R_OK);
        } catch (error) {
          permissionsOk = false;
          break;
        }
      }
    }

    await this.recordResult('File permissions check', permissionsOk, 
      permissionsOk ? 'File permissions appear correct' : 'File permission issues detected');
  }

  /**
   * Record a test result
   */
  async recordResult(name, success, details) {
    const result = {
      name,
      success,
      details,
      timestamp: new Date()
    };
    
    this.results.push(result);
    
    const status = success ? '✅' : '❌';
    console.log(`  ${status} ${name} - ${details}`);
  }

  /**
   * Print validation summary
   */
  printSummary() {
    const totalDuration = ((performance.now() - this.startTime) / 1000).toFixed(2);
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const total = this.results.length;
    
    console.log('=' .repeat(60));
    console.log('📋 Validation Summary');
    console.log('=' .repeat(60));
    console.log(`Total Duration: ${totalDuration}s`);
    console.log(`Total Checks: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    
    const successRate = ((passed / total) * 100).toFixed(1);
    console.log(`📈 Success Rate: ${successRate}%`);

    // List failed tests
    const failedTests = this.results.filter(r => !r.success);
    if (failedTests.length > 0) {
      console.log('\n❌ Failed Validations:');
      failedTests.forEach(test => {
        console.log(`   • ${test.name}: ${test.details}`);
      });
    }

    if (failed > 0) {
      console.log('\n⚠️  Some validations failed. Please review and address the issues above.');
    } else {
      console.log('\n🎉 All validations passed! MCP Configuration System is ready.');
    }

    // Generate simple report
    this.generateReport();
  }

  /**
   * Generate validation report
   */
  generateReport() {
    const reportData = {
      timestamp: new Date().toISOString(),
      totalDuration: performance.now() - this.startTime,
      results: this.results,
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.success).length,
        failed: this.results.filter(r => !r.success).length,
        successRate: (this.results.filter(r => r.success).length / this.results.length * 100).toFixed(1)
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cwd: process.cwd()
      }
    };

    // Ensure test-results directory exists
    const resultsDir = '.mcp/test-results';
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    // Write JSON report
    fs.writeFileSync(
      path.join(resultsDir, 'validation-report.json'),
      JSON.stringify(reportData, null, 2)
    );

    console.log(`\n📄 Validation report saved to: ${resultsDir}/validation-report.json`);
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// =============================================================================
// CLI INTERFACE
// =============================================================================

async function main() {
  const validator = new MCPSystemValidator();
  await validator.validate();
}

// Run validation if this script is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}

module.exports = { MCPSystemValidator };