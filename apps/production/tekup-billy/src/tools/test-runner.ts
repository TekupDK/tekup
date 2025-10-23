/**
 * Test Runner Tool for Billy MCP Server
 * Allows users to run predefined test scenarios and workflows
 */

import { z } from 'zod';
import type { BillyClient } from '../billy-client.js';
import { dataLogger } from '../utils/data-logger.js';
import { getBillyConfig } from '../config.js';
import {
  testScenarios,
  testWorkflows,
  TestScenarioRunner,
  runTestScenario as executeTestScenario,
  listAvailableScenarios
} from '../test-scenarios.js';

// Input schemas for validation
const runTestScenarioSchema = z.object({
  scenario: z.enum(['freelancer', 'retailBusiness', 'serviceBusiness']),
  cleanup: z.boolean().optional().default(false),
});

const listScenariosSchema = z.object({
  detailed: z.boolean().optional().default(false),
});

/**
 * List available test scenarios and workflows
 */
export async function listTestScenarios(client: BillyClient, args: unknown) {
  const startTime = Date.now();
  try {
    const params = listScenariosSchema.parse(args);

    // Log the action
    await dataLogger.logAction({
      action: 'listTestScenarios',
      tool: 'test-runner',
      parameters: params,
    });

    const scenarios = Object.entries(testScenarios).map(([key, scenario]) => ({
      id: key,
      name: scenario.name,
      description: scenario.description,
      customerCount: scenario.testData.customers.length,
      productCount: scenario.testData.products.length,
      invoiceCount: scenario.testData.invoices.length,
    }));

    const workflows = Object.entries(testWorkflows).map(([key, workflow]) => ({
      id: key,
      name: workflow.name,
      description: workflow.description,
      steps: 'steps' in workflow ? workflow.steps : [],
      scenarios: 'scenarios' in workflow ? workflow.scenarios : [],
    }));

    // Log successful completion
    await dataLogger.logAction({
      action: 'listTestScenarios',
      tool: 'test-runner',
      parameters: params,
      result: 'success',
      metadata: {
        executionTime: Date.now() - startTime,
      },
    });

    const responseData = {
      success: true,
      scenarios,
      workflows,
      usage: {
        runScenario: "Use runTestScenario with scenario parameter to execute a test scenario",
        availableScenarios: scenarios.map(s => s.id),
        dryRunMode: getBillyConfig().dryRun ? "ENABLED - No real API calls will be made" : "DISABLED - Real API calls will be made",
        testMode: getBillyConfig().testMode ? "ENABLED - Using test environment" : "DISABLED - Using production environment"
      }
    };

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(responseData, null, 2),
      }],
      structuredContent: responseData
    };
  } catch (error) {
    // Log error
    await dataLogger.logAction({
      action: 'listTestScenarios',
      tool: 'test-runner',
      parameters: args,
      result: 'error',
      metadata: {
        executionTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return {
      content: [{
        type: 'text' as const,
        text: `Error listing test scenarios: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
      isError: true,
    };
  }
}

/**
 * Run a specific test scenario
 */
export async function runTestScenario(client: BillyClient, args: unknown) {
  const startTime = Date.now();
  try {
    const params = runTestScenarioSchema.parse(args);

    // Log the action
    await dataLogger.logAction({
      action: 'runTestScenario',
      tool: 'test-runner',
      parameters: params,
    });

    const scenario = testScenarios[params.scenario];
    if (!scenario) {
      throw new Error(`Unknown test scenario: ${params.scenario}`);
    }

    // Create test runner and execute scenario
    const runner = new TestScenarioRunner(client);

    let executionLog: string[] = [];
    let createdEntities: { customers: string[]; products: string[]; invoices: string[] } = {
      customers: [],
      products: [],
      invoices: []
    };

    try {
      // Capture console output for logging
      const originalLog = console.log;
      console.log = (...args) => {
        const message = args.join(' ');
        executionLog.push(message);
        originalLog(...args);
      };

      await runner.runScenario(params.scenario);
      createdEntities = runner.getCreatedEntities();

      // Cleanup if requested
      if (params.cleanup) {
        await runner.cleanup();
        executionLog.push("🧹 Cleanup completed");
      }

      // Restore console.log
      console.log = originalLog;

    } catch (scenarioError) {
      console.log = console.log; // Restore console.log
      throw scenarioError;
    }

    // Log successful completion
    await dataLogger.logAction({
      action: 'runTestScenario',
      tool: 'test-runner',
      parameters: params,
      result: 'success',
      metadata: {
        executionTime: Date.now() - startTime,
      },
    });

    const config = getBillyConfig();
    const responseData = {
      success: true,
      scenario: {
        name: scenario.name,
        description: scenario.description,
        executed: params.scenario,
      },
      execution: {
        dryRun: config.dryRun,
        testMode: config.testMode,
        executionTime: Date.now() - startTime,
        cleanupPerformed: params.cleanup,
      },
      results: {
        entitiesCreated: createdEntities,
        executionLog: executionLog.slice(-20), // Last 20 log entries
      },
      nextSteps: [
        "Review the created entities in your Billy dashboard",
        "Use getRevenue to analyze the test data",
        "Run additional scenarios to test different business types",
        params.cleanup ? "Test data has been cleaned up" : "Consider running cleanup if needed"
      ]
    };

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(responseData, null, 2),
      }],
      structuredContent: responseData
    };

  } catch (error) {
    // Log error
    await dataLogger.logAction({
      action: 'runTestScenario',
      tool: 'test-runner',
      parameters: args,
      result: 'error',
      metadata: {
        executionTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return {
      content: [{
        type: 'text' as const,
        text: `Error running test scenario: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
      isError: true,
    };
  }
}

/**
 * Generate test data for a specific business type
 */
export async function generateTestData(client: BillyClient, args: unknown) {
  const startTime = Date.now();
  try {
    const generateTestDataSchema = z.object({
      businessType: z.enum(['freelancer', 'retailBusiness', 'serviceBusiness']),
      customization: z.object({
        customerCount: z.number().min(1).max(10).optional().default(2),
        productCount: z.number().min(1).max(10).optional().default(3),
        invoiceCount: z.number().min(1).max(5).optional().default(1),
      }).optional().default({}),
    });

    const params = generateTestDataSchema.parse(args);

    // Log the action
    await dataLogger.logAction({
      action: 'generateTestData',
      tool: 'test-runner',
      parameters: params,
    });

    const baseScenario = testScenarios[params.businessType];
    if (!baseScenario) {
      throw new Error(`Unknown business type: ${params.businessType}`);
    }

    // Generate customized test data based on the base scenario
    const customization = params.customization;
    const testData = {
      businessType: params.businessType,
      name: baseScenario.name,
      description: baseScenario.description,
      customers: baseScenario.testData.customers.slice(0, customization.customerCount),
      products: baseScenario.testData.products.slice(0, customization.productCount),
      invoices: baseScenario.testData.invoices.slice(0, customization.invoiceCount),
    };

    // Log successful completion
    await dataLogger.logAction({
      action: 'generateTestData',
      tool: 'test-runner',
      parameters: params,
      result: 'success',
      metadata: {
        executionTime: Date.now() - startTime,
      },
    });

    const responseData = {
      success: true,
      testData,
      usage: {
        description: "Use this generated test data with runTestScenario or create entities manually",
        recommendation: `This data is optimized for ${baseScenario.name.toLowerCase()} use cases`,
      }
    };

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(responseData, null, 2),
      }],
      structuredContent: responseData
    };

  } catch (error) {
    // Log error
    await dataLogger.logAction({
      action: 'generateTestData',
      tool: 'test-runner',
      parameters: args,
      result: 'error',
      metadata: {
        executionTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return {
      content: [{
        type: 'text' as const,
        text: `Error generating test data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
      isError: true,
    };
  }
}