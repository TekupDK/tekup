/**
 * Self-Evolving Architecture Engine
 * 
 * This package implements a revolutionary concept: software that continuously
 * improves itself without human intervention. The system monitors performance
 * 24/7, identifies bottlenecks using AI analysis, generates optimization
 * strategies, and implements improvements automatically.
 * 
 * Key Features:
 * - Autonomous performance monitoring
 * - AI-powered bottleneck detection
 * - Intelligent solution generation
 * - Safe testing and deployment
 * - Automatic rollback on degradation
 * - Continuous evolution cycles
 */

// Core interfaces and types
export * from './types';

// Core evolution engine
export { EvolutionEngine, SelfEvolvingEngine } from './core/EvolutionEngine';

// Analyzers
export { BottleneckAnalyzer } from './analyzers/BottleneckAnalyzer';

// Solution generators
export { SolutionGenerator } from './generators/SolutionGenerator';

// Configuration and utilities
export { EvolutionConfigBuilder } from './config/EvolutionConfigBuilder';
export { PerformanceMonitor } from './monitoring/PerformanceMonitor';
export { EvolutionOrchestrator } from './orchestration/EvolutionOrchestrator';

// CLI interface
export { EvolutionCLI } from './cli/EvolutionCLI';

// Default configuration
export const DEFAULT_EVOLUTION_CONFIG = {
  thresholds: [
    { metric: 'responseTime', value: 1000, operator: 'gt', priority: 'medium' },
    { metric: 'errorRate', value: 5, operator: 'gt', priority: 'high' },
    { metric: 'memoryUsage', value: 80, operator: 'gt', priority: 'medium' },
    { metric: 'cpuUsage', value: 90, operator: 'gt', priority: 'high' },
    { metric: 'healthScore', value: 70, operator: 'lt', priority: 'critical' }
  ],
  maxConcurrentEvolutions: 3,
  evolutionTimeout: 30, // minutes
  autoRollback: true,
  minImprovementThreshold: 10, // 10% improvement required
  monitoringInterval: 60, // seconds
  testEnvironment: {
    testDatabaseUrl: 'postgresql://test:test@localhost:5432/test_db',
    testEndpoints: ['http://localhost:3001'],
    mockServices: {},
    testDataSets: {}
  }
};

/**
 * Quick start function to create and configure an evolution engine
 */
export async function createEvolutionEngine(
  configOverrides: Partial<typeof DEFAULT_EVOLUTION_CONFIG> = {}
): Promise<SelfEvolvingEngine> {
  const config = { ...DEFAULT_EVOLUTION_CONFIG, ...configOverrides };
  return new SelfEvolvingEngine(config);
}

/**
 * Start evolution engine with default configuration
 */
export async function startEvolutionEngine(
  configOverrides: Partial<typeof DEFAULT_EVOLUTION_CONFIG> = {}
): Promise<SelfEvolvingEngine> {
  const engine = await createEvolutionEngine(configOverrides);
  await engine.startEvolution();
  return engine;
}

/**
 * Example usage:
 * 
 * ```typescript
 * import { startEvolutionEngine } from '@workspace/evolution-engine';
 * 
 * // Start the self-evolving architecture
 * const engine = await startEvolutionEngine({
 *   monitoringInterval: 30, // Check every 30 seconds
 *   maxConcurrentEvolutions: 5
 * });
 * 
 * // The engine now runs autonomously, continuously improving your software!
 * ```
 */