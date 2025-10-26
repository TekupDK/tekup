export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  service: string;
  dependencies: DependencyHealth[];
  metrics: HealthMetrics;
  details?: Record<string, any>;
}

export interface DependencyHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck: string;
  error?: string;
  details?: Record<string, any>;
}

export interface HealthMetrics {
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  requestCount: number;
  errorRate: number;
  averageResponseTime: number;
}

export interface ReadinessCheck {
  ready: boolean;
  timestamp: string;
  service: string;
  requiredDependencies: string[];
  dependencyStatus: Record<string, boolean>;
  reason?: string;
}

export interface LivenessCheck {
  alive: boolean;
  timestamp: string;
  service: string;
  uptime: number;
  lastActivity: string;
}

export interface HealthCheckConfig {
  serviceName: string;
  version: string;
  cacheTimeout?: number;
  requiredDependencies?: string[];
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  database?: {
    enabled: boolean;
    testQuery?: string;
  };
  externalServices?: {
    name: string;
    url: string;
    timeout?: number;
  }[];
}

export interface DependencyChecker {
  name: string;
  check(): Promise<DependencyHealth>;
}

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';
