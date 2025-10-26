#!/usr/bin/env node
/**
 * @fileoverview Practical MCP Configuration Testing
 * 
 * This script tests the actual MCP configuration files and their functionality
 * without relying on complex TypeScript imports.
 * 
 * @author TekUp.org Development Team  
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

class MCPConfigTester {
  constructor() {
    this.results = [];
    this.startTime = performance.now();
  }

  /**
   * Main test execution
   */
  async runTests() {
    console.log('🧪 MCP Configuration Testing - Practical Tests');
    console.log('='.repeat(60));
    console.log();

    try {
      // Test configuration file loading and parsing
      await this.testConfigurationLoading();
      
      // Test configuration merging logic
      await this.testConfigurationMerging();
      
      // Test environment variable handling
      await this.testEnvironmentVariables();
      
      // Test browser configuration specifically
      await this.testBrowserConfiguration();
      
      // Test validation rules
      await this.testConfigurationValidation();
      
      // Performance tests
      await this.testPerformance();
      
      // Print results
      this.printResults();
      
    } catch (error) {
      console.error('❌ Testing failed:', error);
      process.exit(1);
    }
  }

  /**
   * Test configuration file loading and parsing
   */
  async testConfigurationLoading() {
    console.log('📂 Testing Configuration Loading...');
    
    const configFiles = [
      'base.json',
      'development.json', 
      'staging.json',
      'production.json',
      'browser-unified.json'
    ];

    for (const configFile of configFiles) {
      const filePath = path.join('.mcp', 'configs', configFile);
      
      await this.runTest(`Load ${configFile}`, async () => {
        if (!fs.existsSync(filePath)) {
          throw new Error(`Configuration file not found: ${filePath}`);
        }

        const content = fs.readFileSync(filePath, 'utf8');
        const config = JSON.parse(content);
        
        // Basic structure validation
        if (configFile === 'base.json') {
          if (!config.version || !config.servers) {
            throw new Error('Base config missing required fields: version or servers');
          }
        }
        
        return { success: true, config: config };
      });
    }
    
    console.log('✅ Configuration loading tests complete\n');
  }

  /**
   * Test configuration merging logic
   */
  async testConfigurationMerging() {
    console.log('🔗 Testing Configuration Merging...');
    
    await this.runTest('Load and merge development config', async () => {
      const baseConfig = this.loadConfig('base.json');
      const devConfig = this.loadConfig('development.json');
      
      // Simulate basic merging
      const merged = this.mergeConfigs(baseConfig, devConfig);
      
      // Verify merge worked
      if (!merged.servers) {
        throw new Error('Merged config missing servers');
      }
      
      // Check if development overrides are applied
      if (devConfig.extends === 'base' && devConfig.globalSettings) {
        const devLogLevel = devConfig.globalSettings.logLevel;
        if (devLogLevel && merged.globalSettings.logLevel !== devLogLevel) {
          throw new Error('Development log level override not applied');
        }
      }
      
      return { success: true, mergedConfig: merged };
    });

    await this.runTest('Environment-specific overrides', async () => {
      const configs = ['development.json', 'staging.json', 'production.json'];
      
      for (const configFile of configs) {
        const config = this.loadConfig(configFile);
        
        if (!config.extends && !config.servers) {
          throw new Error(`${configFile} should either extend base or define servers`);
        }
      }
      
      return { success: true };
    });
    
    console.log('✅ Configuration merging tests complete\n');
  }

  /**
   * Test environment variable handling
   */
  async testEnvironmentVariables() {
    console.log('🌍 Testing Environment Variables...');
    
    await this.runTest('Environment variable references', async () => {
      const configs = ['base.json', 'development.json'];
      let foundEnvVars = false;
      
      for (const configFile of configs) {
        const config = this.loadConfig(configFile);
        const configStr = JSON.stringify(config);
        
        // Check for environment variable patterns
        if (configStr.includes('${') && configStr.includes('}')) {
          foundEnvVars = true;
          
          // Extract env var references
          const envVarMatches = configStr.match(/\$\{[^}]+\}/g);
          if (envVarMatches) {
            console.log(`  Found ${envVarMatches.length} environment variable references in ${configFile}`);
          }
        }
      }
      
      if (!foundEnvVars) {
        throw new Error('No environment variable references found in configs');
      }
      
      return { success: true };
    });

    await this.runTest('Environment variable expansion simulation', async () => {
      // Test with mock environment variables
      const testEnv = {
        'BROWSER_PATH': 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'BROWSER_HEADLESS': 'true',
        'OPENAI_API_KEY': 'sk-test123',
        'NODE_ENV': 'development'
      };
      
      const config = this.loadConfig('base.json');
      const expandedConfig = this.expandEnvironmentVariables(config, testEnv);
      
      // Check if expansion worked
      const configStr = JSON.stringify(expandedConfig);
      if (configStr.includes('${')) {
        console.log('  ⚠️  Some environment variables may not have been expanded');
      }
      
      return { success: true, expandedConfig };
    });
    
    console.log('✅ Environment variable tests complete\n');
  }

  /**
   * Test browser configuration specifically
   */
  async testBrowserConfiguration() {
    console.log('🌐 Testing Browser Configuration...');
    
    await this.runTest('Browser MCP server configuration', async () => {
      const baseConfig = this.loadConfig('base.json');
      
      if (!baseConfig.servers || !baseConfig.servers.browser) {
        throw new Error('Base config missing browser server configuration');
      }
      
      const browserServer = baseConfig.servers.browser;
      
      if (!browserServer.command || !browserServer.args) {
        throw new Error('Browser server missing command or args');
      }
      
      return { success: true, browserConfig: browserServer };
    });

    await this.runTest('Browser unified configuration', async () => {
      const browserConfig = this.loadConfig('browser-unified.json');
      
      if (!browserConfig.metadata) {
        throw new Error('Browser unified config missing metadata');
      }
      
      if (!browserConfig.servers || !browserConfig.servers.browser) {
        throw new Error('Browser unified config missing browser server');
      }
      
      return { success: true };
    });

    await this.runTest('Development browser settings', async () => {
      const devConfig = this.loadConfig('development.json');
      
      // Check if development has browser-specific overrides
      if (devConfig.servers && devConfig.servers.browser) {
        const devBrowserConfig = devConfig.servers.browser;
        console.log('  Found development browser overrides');
        
        if (devBrowserConfig.env) {
          console.log(`  Environment overrides: ${Object.keys(devBrowserConfig.env).join(', ')}`);
        }
      }
      
      return { success: true };
    });
    
    console.log('✅ Browser configuration tests complete\n');
  }

  /**
   * Test configuration validation
   */
  async testConfigurationValidation() {
    console.log('✅ Testing Configuration Validation...');
    
    await this.runTest('Required fields validation', async () => {
      const baseConfig = this.loadConfig('base.json');
      
      const requiredFields = ['version', 'servers', 'globalSettings'];
      for (const field of requiredFields) {
        if (!baseConfig[field]) {
          throw new Error(`Base config missing required field: ${field}`);
        }
      }
      
      return { success: true };
    });

    await this.runTest('Server configuration validation', async () => {
      const baseConfig = this.loadConfig('base.json');
      
      for (const [serverName, serverConfig] of Object.entries(baseConfig.servers)) {
        if (!serverConfig.command) {
          throw new Error(`Server ${serverName} missing command`);
        }
        
        if (!Array.isArray(serverConfig.args)) {
          throw new Error(`Server ${serverName} args must be an array`);
        }
      }
      
      return { success: true };
    });

    await this.runTest('Global settings validation', async () => {
      const baseConfig = this.loadConfig('base.json');
      const globalSettings = baseConfig.globalSettings;
      
      const expectedSettings = ['timeout', 'retryCount', 'logLevel'];
      for (const setting of expectedSettings) {
        if (globalSettings[setting] === undefined) {
          throw new Error(`Global settings missing: ${setting}`);
        }
      }
      
      // Validate log level values
      const validLogLevels = ['debug', 'info', 'warn', 'error'];
      if (!validLogLevels.includes(globalSettings.logLevel)) {
        throw new Error(`Invalid log level: ${globalSettings.logLevel}`);
      }
      
      return { success: true };
    });
    
    console.log('✅ Configuration validation tests complete\n');
  }

  /**
   * Test performance characteristics
   */
  async testPerformance() {
    console.log('⚡ Testing Performance...');
    
    await this.runTest('Configuration loading performance', async () => {
      const iterations = 10;
      const times = [];
      
      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        
        // Load all configurations
        this.loadConfig('base.json');
        this.loadConfig('development.json');
        this.loadConfig('production.json');
        
        times.push(performance.now() - startTime);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      
      if (avgTime > 100) {
        throw new Error(`Configuration loading too slow: ${avgTime.toFixed(2)}ms average`);
      }
      
      return { 
        success: true, 
        performance: { 
          avgTime: avgTime.toFixed(2) + 'ms',
          maxTime: maxTime.toFixed(2) + 'ms',
          iterations 
        }
      };
    });

    await this.runTest('Memory usage during config operations', async () => {
      const beforeMemory = process.memoryUsage();
      
      // Perform multiple config operations
      for (let i = 0; i < 50; i++) {
        const baseConfig = this.loadConfig('base.json');
        const devConfig = this.loadConfig('development.json');
        this.mergeConfigs(baseConfig, devConfig);
      }
      
      const afterMemory = process.memoryUsage();
      const memoryIncrease = afterMemory.heapUsed - beforeMemory.heapUsed;
      const memoryIncreaseMB = (memoryIncrease / 1024 / 1024).toFixed(2);
      
      if (memoryIncrease > 10 * 1024 * 1024) { // 10MB
        console.log(`  ⚠️  High memory usage: ${memoryIncreaseMB}MB increase`);
      }
      
      return { success: true, memoryIncrease: `${memoryIncreaseMB}MB` };
    });
    
    console.log('✅ Performance tests complete\n');
  }

  /**
   * Load a configuration file
   */
  loadConfig(filename) {
    const filePath = path.join('.mcp', 'configs', filename);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Configuration file not found: ${filePath}`);
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  }

  /**
   * Simple configuration merging
   */
  mergeConfigs(base, override) {
    const result = JSON.parse(JSON.stringify(base)); // Deep copy
    
    if (override.extends === 'base') {
      // Merge globalSettings
      if (override.globalSettings) {
        result.globalSettings = { ...result.globalSettings, ...override.globalSettings };
      }
      
      // Merge servers
      if (override.servers) {
        for (const [serverName, serverConfig] of Object.entries(override.servers)) {
          if (result.servers[serverName]) {
            result.servers[serverName] = { ...result.servers[serverName], ...serverConfig };
            
            // Special handling for env variables
            if (serverConfig.env && result.servers[serverName].env) {
              result.servers[serverName].env = { 
                ...result.servers[serverName].env, 
                ...serverConfig.env 
              };
            }
          } else {
            result.servers[serverName] = serverConfig;
          }
        }
      }
    } else {
      // Direct merge for non-extending configs
      Object.assign(result, override);
    }
    
    return result;
  }

  /**
   * Simulate environment variable expansion
   */
  expandEnvironmentVariables(config, env = process.env) {
    const configStr = JSON.stringify(config);
    let expandedStr = configStr;
    
    // Replace ${VAR_NAME} patterns
    const envVarMatches = configStr.match(/\$\{([^}]+)\}/g);
    
    if (envVarMatches) {
      for (const match of envVarMatches) {
        const varName = match.slice(2, -1); // Remove ${ and }
        
        // Handle default values ${VAR_NAME:-default}
        const [varKey, defaultValue] = varName.split(':-');
        const value = env[varKey] || defaultValue || '';
        
        expandedStr = expandedStr.replace(match, value);
      }
    }
    
    return JSON.parse(expandedStr);
  }

  /**
   * Run a single test
   */
  async runTest(name, testFn) {
    const startTime = performance.now();
    
    try {
      const result = await testFn();
      const duration = performance.now() - startTime;
      
      this.results.push({
        name,
        success: true,
        duration,
        result
      });
      
      console.log(`  ✅ ${name} (${duration.toFixed(2)}ms)`);
      
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.results.push({
        name,
        success: false,
        duration,
        error: error.message
      });
      
      console.log(`  ❌ ${name} - ${error.message}`);
    }
  }

  /**
   * Print test results summary
   */
  printResults() {
    const totalDuration = ((performance.now() - this.startTime) / 1000).toFixed(2);
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const total = this.results.length;
    
    console.log('='.repeat(60));
    console.log('📋 MCP Configuration Test Results');
    console.log('='.repeat(60));
    console.log(`Total Duration: ${totalDuration}s`);
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    
    const successRate = ((passed / total) * 100).toFixed(1);
    console.log(`📈 Success Rate: ${successRate}%`);

    // Show failed tests
    const failedTests = this.results.filter(r => !r.success);
    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests:');
      failedTests.forEach(test => {
        console.log(`   • ${test.name}: ${test.error}`);
      });
    }

    // Generate report
    this.generateReport();

    if (failed > 0) {
      console.log('\n⚠️  Some tests failed. Please review the issues above.');
      process.exit(1);
    } else {
      console.log('\n🎉 All MCP configuration tests passed!');
    }
  }

  /**
   * Generate detailed test report
   */
  generateReport() {
    const reportData = {
      timestamp: new Date().toISOString(),
      totalDuration: performance.now() - this.startTime,
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.success).length,
        failed: this.results.filter(r => !r.success).length,
        successRate: (this.results.filter(r => r.success).length / this.results.length * 100).toFixed(1)
      },
      results: this.results,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        cwd: process.cwd()
      }
    };

    // Ensure test results directory exists
    const resultsDir = '.mcp/test-results';
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    // Write detailed report
    fs.writeFileSync(
      path.join(resultsDir, 'mcp-config-test-report.json'),
      JSON.stringify(reportData, null, 2)
    );

    console.log(`\n📄 Detailed report saved to: ${resultsDir}/mcp-config-test-report.json`);
  }
}

// Main execution
async function main() {
  const tester = new MCPConfigTester();
  await tester.runTests();
}

if (require.main === module) {
  main().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { MCPConfigTester };