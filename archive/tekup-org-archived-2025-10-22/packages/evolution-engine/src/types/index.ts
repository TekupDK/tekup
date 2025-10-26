/**
 * Core types for the Self-Evolving Architecture
 * This system enables software to continuously improve itself without human intervention
 */

export interface SystemMetrics {
  /** Response time in milliseconds */
  responseTime: number;
  /** Throughput - requests per second */
  throughput: number;
  /** Memory usage in MB */
  memoryUsage: number;
  /** CPU usage percentage */
  cpuUsage: number;
  /** Error rate percentage */
  errorRate: number;
  /** Database query performance in milliseconds */
  databasePerformance: number;
  /** Cache hit rate percentage */
  cacheHitRate: number;
  /** Network latency in milliseconds */
  networkLatency: number;
  /** Timestamp of measurement */
  timestamp: Date;
  /** Overall health score (0-100) */
  healthScore: number;
}

export interface CodeSection {
  /** Unique identifier for the code section */
  id: string;
  /** File path */
  filePath: string;
  /** Function/class/method name */
  name: string;
  /** Type of code section */
  type: 'function' | 'class' | 'method' | 'module' | 'service';
  /** Start line number */
  startLine: number;
  /** End line number */
  endLine: number;
  /** Performance impact score (0-100) */
  performanceImpact: number;
  /** Complexity score */
  complexity: number;
  /** Number of dependencies */
  dependencyCount: number;
  /** Last modified timestamp */
  lastModified: Date;
  /** Current performance metrics */
  metrics: Partial<SystemMetrics>;
}

export interface CodeSolution {
  /** Unique identifier for the solution */
  id: string;
  /** Description of the optimization */
  description: string;
  /** Type of optimization */
  type: 'refactor' | 'algorithm' | 'caching' | 'parallelization' | 'memory' | 'database';
  /** Expected performance improvement percentage */
  expectedImprovement: number;
  /** Risk level (low, medium, high) */
  riskLevel: 'low' | 'medium' | 'high';
  /** Implementation complexity (1-10) */
  complexity: number;
  /** Estimated implementation time in minutes */
  estimatedTime: number;
  /** Code changes required */
  codeChanges: CodeChange[];
  /** Dependencies that need to be added/removed */
  dependencies: DependencyChange[];
  /** Test cases to verify the change */
  testCases: TestCase[];
  /** Rollback strategy */
  rollbackStrategy: RollbackStrategy;
}

export interface CodeChange {
  /** File path to modify */
  filePath: string;
  /** Type of change */
  type: 'replace' | 'insert' | 'delete' | 'modify';
  /** Start line for the change */
  startLine: number;
  /** End line for the change */
  endLine: number;
  /** New code content */
  newCode: string;
  /** Original code content for rollback */
  originalCode: string;
}

export interface DependencyChange {
  /** Package name */
  packageName: string;
  /** Action to perform */
  action: 'add' | 'remove' | 'update';
  /** Version specification */
  version?: string;
  /** Reason for the change */
  reason: string;
}

export interface TestCase {
  /** Test description */
  description: string;
  /** Input data */
  input: any;
  /** Expected output */
  expectedOutput: any;
  /** Test function */
  testFunction: string;
}

export interface RollbackStrategy {
  /** How to rollback the changes */
  method: 'git-revert' | 'code-restore' | 'dependency-rollback';
  /** Rollback command or script */
  rollbackCommand: string;
  /** Verification steps */
  verificationSteps: string[];
}

export interface EvolutionResult {
  /** Whether the evolution was successful */
  success: boolean;
  /** Performance improvement achieved */
  improvement: Partial<SystemMetrics>;
  /** Time taken for the evolution */
  duration: number;
  /** Any errors encountered */
  errors: string[];
  /** Rollback performed if needed */
  rollbackPerformed: boolean;
  /** New system metrics after evolution */
  newMetrics: SystemMetrics;
}

export interface PerformanceThreshold {
  /** Metric name */
  metric: keyof SystemMetrics;
  /** Threshold value */
  value: number;
  /** Comparison operator */
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
  /** Priority level */
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface EvolutionConfig {
  /** Performance thresholds that trigger evolution */
  thresholds: PerformanceThreshold[];
  /** Maximum number of concurrent evolutions */
  maxConcurrentEvolutions: number;
  /** Timeout for evolution attempts in minutes */
  evolutionTimeout: number;
  /** Whether to enable automatic rollback on failure */
  autoRollback: boolean;
  /** Minimum improvement required to keep changes */
  minImprovementThreshold: number;
  /** Testing environment configuration */
  testEnvironment: TestEnvironmentConfig;
  /** Monitoring intervals in seconds */
  monitoringInterval: number;
}

export interface TestEnvironmentConfig {
  /** Test database URL */
  testDatabaseUrl: string;
  /** Test API endpoints */
  testEndpoints: string[];
  /** Mock services configuration */
  mockServices: Record<string, any>;
  /** Test data sets */
  testDataSets: Record<string, any[]>;
}

export interface EvolutionContext {
  /** Current system state */
  currentMetrics: SystemMetrics;
  /** Historical performance data */
  performanceHistory: SystemMetrics[];
  /** Current active evolutions */
  activeEvolutions: string[];
  /** Evolution history */
  evolutionHistory: EvolutionResult[];
  /** System configuration */
  config: EvolutionConfig;
}