export { PerformanceService } from './performance.service.js';
export { QueryOptimizerService } from './query-optimizer.service.js';
export { PerformanceController } from './performance.controller.js';
export { PerformanceModule } from './performance.module.js';
export { MeasurePerformance, MeasureQuery, MeasureEndpoint, PerformanceMetadata } from './performance.decorator.js';

export type {
  QueryMetadata,
  QueryPerformance,
  SlowQuery,
  PerformanceReport,
  ConnectionPoolStats,
  OptimizedQuery,
} from './performance.service.js';

export type {
  QueryPlan,
  IndexRecommendation,
  QueryOptimizationResult,
} from './query-optimizer.service.js';