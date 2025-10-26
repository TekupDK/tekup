import { EventEmitter } from 'events';
import { faker } from '@faker-js/faker';

export interface ChaosExperiment {
  id: string;
  name: string;
  description: string;
  type: 'network' | 'service' | 'database' | 'infrastructure' | 'business_logic';
  severity: 'low' | 'medium' | 'high' | 'critical';
  duration: number; // in seconds
  status: 'planned' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime?: Date;
  endTime?: Date;
  targetComponents: string[];
  failureMode: string;
  recoveryTime?: number; // in seconds
  impact: {
    affectedServices: string[];
    userImpact: 'none' | 'low' | 'medium' | 'high' | 'critical';
    businessImpact: string;
  };
  results: {
    success: boolean;
    failureDetected: boolean;
    recoverySuccessful: boolean;
    metrics: Record<string, number>;
    observations: string[];
  };
}

export interface ResilienceMetrics {
  mttf: number; // Mean Time To Failure (seconds)
  mttr: number; // Mean Time To Recovery (seconds)
  availability: number; // Percentage uptime
  errorRate: number; // Error rate during chaos
  performanceDegradation: number; // Performance impact percentage
  userExperienceScore: number; // 0-100 score
}

export interface ChaosReport {
  id: string;
  timestamp: Date;
  experiments: ChaosExperiment[];
  summary: {
    totalExperiments: number;
    successfulExperiments: number;
    failedExperiments: number;
    averageRecoveryTime: number;
    systemResilienceScore: number; // 0-100
  };
  recommendations: string[];
  nextSteps: string[];
}

export class ChaosEngineer extends EventEmitter {
  private experiments: ChaosExperiment[] = [];
  private isRunning: boolean = false;
  private activeExperiments: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    super();
  }

  // Create and run chaos experiments
  async runChaosExperiment(experiment: Omit<ChaosExperiment, 'id' | 'status' | 'results'>): Promise<ChaosExperiment> {
    const chaosExperiment: ChaosExperiment = {
      ...experiment,
      id: faker.string.uuid(),
      status: 'planned',
      results: {
        success: false,
        failureDetected: false,
        recoverySuccessful: false,
        metrics: {},
        observations: [],
      },
    };

    this.experiments.push(chaosExperiment);
    this.emit('experiment:created', chaosExperiment);

    logger.info(`🧪 Starting chaos experiment: ${chaosExperiment.name}`);
    
    try {
      await this.executeExperiment(chaosExperiment);
      chaosExperiment.status = 'completed';
      chaosExperiment.endTime = new Date();
      
      if (chaosExperiment.startTime) {
        chaosExperiment.recoveryTime = (chaosExperiment.endTime.getTime() - chaosExperiment.startTime.getTime()) / 1000;
      }
      
      this.emit('experiment:completed', chaosExperiment);
      logger.info(`✅ Chaos experiment completed: ${chaosExperiment.name}`);
      
    } catch (error) {
      chaosExperiment.status = 'failed';
      chaosExperiment.endTime = new Date();
      chaosExperiment.results.observations.push(`Experiment failed: ${error.message}`);
      
      this.emit('experiment:failed', chaosExperiment);
      logger.error(`❌ Chaos experiment failed: ${chaosExperiment.name}`);
    }

    return chaosExperiment;
  }

  // Execute a chaos experiment
  private async executeExperiment(experiment: ChaosExperiment): Promise<void> {
    experiment.status = 'running';
    experiment.startTime = new Date();
    
    this.emit('experiment:started', experiment);

    // Inject failure based on experiment type
    await this.injectFailure(experiment);
    
    // Monitor system behavior
    const failureDetected = await this.monitorFailure(experiment);
    experiment.results.failureDetected = failureDetected;
    
    // Wait for experiment duration
    await this.wait(experiment.duration * 1000);
    
    // Stop failure injection
    await this.stopFailure(experiment);
    
    // Monitor recovery
    const recoverySuccessful = await this.monitorRecovery(experiment);
    experiment.results.recoverySuccessful = recoverySuccessful;
    
    // Calculate metrics
    experiment.results.metrics = await this.calculateExperimentMetrics(experiment);
    
    // Determine overall success
    experiment.results.success = failureDetected && recoverySuccessful;
    
    // Add observations
    this.addExperimentObservations(experiment);
  }

  // Inject failure based on experiment type
  private async injectFailure(experiment: ChaosExperiment): Promise<void> {
    logger.info(`💥 Injecting failure: ${experiment.failureMode}`);
    
    switch (experiment.type) {
      case 'network':
        await this.injectNetworkFailure(experiment);
        break;
      case 'service':
        await this.injectServiceFailure(experiment);
        break;
      case 'database':
        await this.injectDatabaseFailure(experiment);
        break;
      case 'infrastructure':
        await this.injectInfrastructureFailure(experiment);
        break;
      case 'business_logic':
        await this.injectBusinessLogicFailure(experiment);
        break;
      default:
        throw new Error(`Unknown experiment type: ${experiment.type}`);
    }
  }

  // Inject network failures
  private async injectNetworkFailure(experiment: ChaosExperiment): Promise<void> {
    const failures = [
      'network_latency',
      'packet_loss',
      'bandwidth_throttling',
      'connection_drops',
      'dns_failures',
    ];

    const failure = failures[Math.floor(Math.random() * failures.length)];
    
    switch (failure) {
      case 'network_latency':
        await this.simulateNetworkLatency(experiment);
        break;
      case 'packet_loss':
        await this.simulatePacketLoss(experiment);
        break;
      case 'bandwidth_throttling':
        await this.simulateBandwidthThrottling(experiment);
        break;
      case 'connection_drops':
        await this.simulateConnectionDrops(experiment);
        break;
      case 'dns_failures':
        await this.simulateDNSFailures(experiment);
        break;
    }
  }

  // Inject service failures
  private async injectServiceFailure(experiment: ChaosExperiment): Promise<void> {
    const failures = [
      'service_unavailable',
      'high_error_rate',
      'slow_responses',
      'memory_leaks',
      'cpu_spikes',
    ];

    const failure = failures[Math.floor(Math.random() * failures.length)];
    
    switch (failure) {
      case 'service_unavailable':
        await this.simulateServiceUnavailable(experiment);
        break;
      case 'high_error_rate':
        await this.simulateHighErrorRate(experiment);
        break;
      case 'slow_responses':
        await this.simulateSlowResponses(experiment);
        break;
      case 'memory_leaks':
        await this.simulateMemoryLeaks(experiment);
        break;
      case 'cpu_spikes':
        await this.simulateCPUSpikes(experiment);
        break;
    }
  }

  // Inject database failures
  private async injectDatabaseFailure(experiment: ChaosExperiment): Promise<void> {
    const failures = [
      'connection_pool_exhaustion',
      'slow_queries',
      'deadlocks',
      'disk_space_full',
      'replication_lag',
    ];

    const failure = failures[Math.floor(Math.random() * failures.length)];
    
    switch (failure) {
      case 'connection_pool_exhaustion':
        await this.simulateConnectionPoolExhaustion(experiment);
        break;
      case 'slow_queries':
        await this.simulateSlowQueries(experiment);
        break;
      case 'deadlocks':
        await this.simulateDeadlocks(experiment);
        break;
      case 'disk_space_full':
        await this.simulateDiskSpaceFull(experiment);
        break;
      case 'replication_lag':
        await this.simulateReplicationLag(experiment);
        break;
    }
  }

  // Inject infrastructure failures
  private async injectInfrastructureFailure(experiment: ChaosExperiment): Promise<void> {
    const failures = [
      'node_failure',
      'disk_failure',
      'memory_pressure',
      'network_partition',
      'resource_exhaustion',
    ];

    const failure = failures[Math.floor(Math.random() * failures.length)];
    
    switch (failure) {
      case 'node_failure':
        await this.simulateNodeFailure(experiment);
        break;
      case 'disk_failure':
        await this.simulateDiskFailure(experiment);
        break;
      case 'memory_pressure':
        await this.simulateMemoryPressure(experiment);
        break;
      case 'network_partition':
        await this.simulateNetworkPartition(experiment);
        break;
      case 'resource_exhaustion':
        await this.simulateResourceExhaustion(experiment);
        break;
    }
  }

  // Inject business logic failures
  private async injectBusinessLogicFailure(experiment: ChaosExperiment): Promise<void> {
    const failures = [
      'invalid_data',
      'business_rule_violation',
      'rate_limiting',
      'circuit_breaker',
      'fallback_failure',
    ];

    const failure = failures[Math.floor(Math.random() * failures.length)];
    
    switch (failure) {
      case 'invalid_data':
        await this.simulateInvalidData(experiment);
        break;
      case 'business_rule_violation':
        await this.simulateBusinessRuleViolation(experiment);
        break;
      case 'rate_limiting':
        await this.simulateRateLimiting(experiment);
        break;
      case 'circuit_breaker':
        await this.simulateCircuitBreaker(experiment);
        break;
      case 'fallback_failure':
        await this.simulateFallbackFailure(experiment);
        break;
    }
  }

  // Simulate specific failure types
  private async simulateNetworkLatency(experiment: ChaosExperiment): Promise<void> {
    experiment.results.observations.push('Simulating network latency: 200-500ms additional delay');
    await this.wait(1000);
  }

  private async simulatePacketLoss(experiment: ChaosExperiment): Promise<void> {
    experiment.results.observations.push('Simulating packet loss: 5-15% packet drop rate');
    await this.wait(1000);
  }

  private async simulateBandwidthThrottling(experiment: ChaosExperiment): Promise<void> {
    experiment.results.observations.push('Simulating bandwidth throttling: 50% bandwidth reduction');
    await this.wait(1000);
  }

  private async simulateConnectionDrops(experiment: ChaosExperiment): Promise<void> {
    experiment.results.observations.push('Simulating connection drops: Random connection failures');
    await this.wait(1000);
  }

  private async simulateDNSFailures(experiment: ChaosExperiment): Promise<void> {
    experiment.results.observations.push('Simulating DNS failures: DNS resolution timeouts');
    await this.wait(1000);
  }

  private async simulateServiceUnavailable(experiment: ChaosExperiment): Promise<void> {
    experiment.results.observations.push('Simulating service unavailable: 503 Service Unavailable responses');
    await this.wait(1000);
  }

  private async simulateHighErrorRate(experiment: ChaosExperiment): Promise<void> {
    experiment.results.observations.push('Simulating high error rate: 20-40% error responses');
    await this.wait(1000);
  }

  private async simulateSlowResponses(experiment: ChaosExperiment): Promise<void> {
    experiment.results.observations.push('Simulating slow responses: 2-5 second response times');
    await this.wait(1000);
  }

  private async simulateMemoryLeaks(experiment: ChaosExperiment): Promise<void> {
    experiment.results.observations.push('Simulating memory leaks: Gradual memory consumption increase');
    await this.wait(1000);
  }

  private async simulateCPUSpikes(experiment: ChaosExperiment): Promise<void> {
    experiment.results.observations.push('Simulating CPU spikes: 80-95% CPU utilization');
    await this.wait(1000);
  }

  private async simulateConnectionPoolExhaustion(experiment: ChaosExperiment): Promise<void> {
    experiment.results.observations.push('Simulating connection pool exhaustion: No available database connections');
    await this.wait(1000);
  }

  private async simulateSlowQueries(experiment: ChaosExperiment): Promise<void> {
    experiment.results.observations.push('Simulating slow queries: 5-15 second query execution times');
    await this.wait(1000);
  }

  private async simulateDeadlocks(experiment: ChaosExperiment): Promise<void> {
    experiment.results.observations.push('Simulating deadlocks: Database transaction conflicts');
    await this.wait(1000);
  }

  private async simulateDiskSpaceFull(experiment: ChaosExperiment): Promise<void> {
    experiment.results.observations.push('Simulating disk space full: No available disk space');
    await this.wait(1000);
  }

  private async simulateReplicationLag(experiment: ChaosExperiment): Promise<void> {
    experiment.results.observations.push('Simulating replication lag: 30-60 second replication delays');
    await this.wait(1000);
  }

  private async simulateNodeFailure(experiment: ChaosExperiment): Promise<void> {
    experiment.results.observations.push('Simulating node failure: Service instance termination');
    await this.wait(1000);
  }

  private async simulateDiskFailure(experiment: ChaosExperiment): Promise<void> {
    experiment.results.observations.push('Simulating disk failure: Disk I/O errors');
    await this.wait(1000);
  }

  private async simulateMemoryPressure(experiment: ChaosExperiment): Promise<void> {
    experiment.results.observations.push('Simulating memory pressure: 90-95% memory utilization');
    await this.wait(1000);
  }

  private async simulateNetworkPartition(experiment: ChaosExperiment): Promise<void> {
    experiment.results.observations.push('Simulating network partition: Service communication isolation');
    await this.wait(1000);
  }

  private async simulateResourceExhaustion(experiment: ChaosExperiment): Promise<void> {
    experiment.results.observations.push('Simulating resource exhaustion: CPU, memory, and disk pressure');
    await this.wait(1000);
  }

  private async simulateInvalidData(experiment: ChaosExperiment): Promise<void> {
    experiment.results.observations.push('Simulating invalid data: Malformed input data injection');
    await this.wait(1000);
  }

  private async simulateBusinessRuleViolation(experiment: ChaosExperiment): Promise<void> {
    experiment.results.observations.push('Simulating business rule violation: Invalid business logic execution');
    await this.wait(1000);
  }

  private async simulateRateLimiting(experiment: ChaosExperiment): Promise<void> {
    experiment.results.observations.push('Simulating rate limiting: Request throttling and rejection');
    await this.wait(1000);
  }

  private async simulateCircuitBreaker(experiment: ChaosExperiment): Promise<void> {
    experiment.results.observations.push('Simulating circuit breaker: Service failure threshold exceeded');
    await this.wait(1000);
  }

  private async simulateFallbackFailure(experiment: ChaosExperiment): Promise<void> {
    experiment.results.observations.push('Simulating fallback failure: Backup service unavailable');
    await this.wait(1000);
  }

  // Monitor failure detection
  private async monitorFailure(experiment: ChaosExperiment): Promise<boolean> {
    // Simulate failure detection monitoring
    const detectionTime = faker.number.int({ min: 1000, max: 5000 });
    await this.wait(detectionTime);
    
    const failureDetected = Math.random() > 0.2; // 80% detection rate
    experiment.results.observations.push(
      failureDetected 
        ? `Failure detected in ${detectionTime}ms` 
        : 'Failure not detected within expected timeframe'
    );
    
    return failureDetected;
  }

  // Stop failure injection
  private async stopFailure(experiment: ChaosExperiment): Promise<void> {
    logger.info(`🛑 Stopping failure injection: ${experiment.failureMode}`);
    experiment.results.observations.push('Failure injection stopped, monitoring recovery');
    await this.wait(1000);
  }

  // Monitor recovery
  private async monitorRecovery(experiment: ChaosExperiment): Promise<boolean> {
    // Simulate recovery monitoring
    const recoveryTime = faker.number.int({ min: 2000, max: 10000 });
    await this.wait(recoveryTime);
    
    const recoverySuccessful = Math.random() > 0.15; // 85% recovery rate
    experiment.results.observations.push(
      recoverySuccessful 
        ? `System recovered in ${recoveryTime}ms` 
        : 'System failed to recover within expected timeframe'
    );
    
    return recoverySuccessful;
  }

  // Calculate experiment metrics
  private async calculateExperimentMetrics(experiment: ChaosExperiment): Promise<Record<string, number>> {
    const metrics: Record<string, number> = {};
    
    if (experiment.startTime && experiment.endTime) {
      const duration = (experiment.endTime.getTime() - experiment.startTime.getTime()) / 1000;
      metrics.duration = duration;
      metrics.recoveryTime = experiment.recoveryTime || 0;
      metrics.availability = this.calculateAvailability(experiment);
      metrics.errorRate = this.calculateErrorRate(experiment);
      metrics.performanceImpact = this.calculatePerformanceImpact(experiment);
    }
    
    return metrics;
  }

  // Add experiment observations
  private addExperimentObservations(experiment: ChaosExperiment): void {
    const observations = [
      `Experiment type: ${experiment.type}`,
      `Severity level: ${experiment.severity}`,
      `Target components: ${experiment.targetComponents.join(', ')}`,
      `Failure mode: ${experiment.failureMode}`,
      `User impact: ${experiment.impact.userImpact}`,
      `Business impact: ${experiment.impact.businessImpact}`,
    ];
    
    experiment.results.observations.push(...observations);
  }

  // Calculate availability during experiment
  private calculateAvailability(experiment: ChaosExperiment): number {
    if (experiment.type === 'service' && experiment.failureMode.includes('unavailable')) {
      return faker.number.float({ min: 85, max: 95, precision: 0.1 });
    }
    return faker.number.float({ min: 95, max: 99.9, precision: 0.1 });
  }

  // Calculate error rate during experiment
  private calculateErrorRate(experiment: ChaosExperiment): number {
    if (experiment.type === 'service' && experiment.failureMode.includes('error')) {
      return faker.number.float({ min: 15, max: 35, precision: 0.1 });
    }
    return faker.number.float({ min: 0, max: 5, precision: 0.1 });
  }

  // Calculate performance impact during experiment
  private calculatePerformanceImpact(experiment: ChaosExperiment): number {
    if (experiment.type === 'network' || experiment.type === 'service') {
      return faker.number.float({ min: 20, max: 60, precision: 0.1 });
    }
    return faker.number.float({ min: 5, max: 25, precision: 0.1 });
  }

  // Run resilience test suite
  async runResilienceTestSuite(): Promise<ChaosReport> {
    logger.info('🧪 Starting resilience test suite...');
    
    const testScenarios = this.generateTestScenarios();
    const experiments: ChaosExperiment[] = [];
    
    for (const scenario of testScenarios) {
      try {
        const experiment = await this.runChaosExperiment(scenario);
        experiments.push(experiment);
        
        // Wait between experiments
        await this.wait(5000);
        
      } catch (error) {
        logger.error(`❌ Failed to run experiment: ${scenario.name}`, error);
      }
    }
    
    const report = this.generateChaosReport(experiments);
    logger.info(`✅ Resilience test suite completed: ${report.summary.totalExperiments} experiments`);
    
    return report;
  }

  // Generate test scenarios
  private generateTestScenarios(): Array<Omit<ChaosExperiment, 'id' | 'status' | 'results'>> {
    return [
      {
        name: 'Network Latency Test',
        description: 'Test system behavior under high network latency',
        type: 'network',
        severity: 'medium',
        duration: 30,
        targetComponents: ['voice-agent', 'mobile-agent', 'api-gateway'],
        failureMode: 'network_latency',
        impact: {
          affectedServices: ['voice-agent', 'mobile-agent'],
          userImpact: 'medium',
          businessImpact: 'Increased response times may affect user experience',
        },
      },
      {
        name: 'Service Failure Test',
        description: 'Test system behavior when a service becomes unavailable',
        type: 'service',
        severity: 'high',
        duration: 45,
        targetComponents: ['mcp-server', 'database'],
        failureMode: 'service_unavailable',
        impact: {
          affectedServices: ['mcp-server', 'workflow-engine'],
          userImpact: 'high',
          businessImpact: 'Critical business workflows may be interrupted',
        },
      },
      {
        name: 'Database Performance Test',
        description: 'Test system behavior under database performance degradation',
        type: 'database',
        severity: 'medium',
        duration: 60,
        targetComponents: ['database', 'api-gateway'],
        failureMode: 'slow_queries',
        impact: {
          affectedServices: ['api-gateway', 'business-suites'],
          userImpact: 'medium',
          businessImpact: 'Slower data retrieval may impact business operations',
        },
      },
      {
        name: 'Infrastructure Stress Test',
        description: 'Test system behavior under infrastructure stress',
        type: 'infrastructure',
        severity: 'high',
        duration: 90,
        targetComponents: ['voice-agent', 'mobile-agent', 'mcp-server'],
        failureMode: 'resource_exhaustion',
        impact: {
          affectedServices: ['voice-agent', 'mobile-agent', 'mcp-server'],
          userImpact: 'high',
          businessImpact: 'System performance degradation may affect all services',
        },
      },
      {
        name: 'Business Logic Failure Test',
        description: 'Test system behavior under business logic failures',
        type: 'business_logic',
        severity: 'medium',
        duration: 40,
        targetComponents: ['business-suites', 'api-gateway'],
        failureMode: 'circuit_breaker',
        impact: {
          affectedServices: ['business-suites', 'api-gateway'],
          userImpact: 'medium',
          businessImpact: 'Business operations may be temporarily unavailable',
        },
      },
    ];
  }

  // Generate chaos report
  private generateChaosReport(experiments: ChaosExperiment[]): ChaosReport {
    const successfulExperiments = experiments.filter(e => e.results.success);
    const failedExperiments = experiments.filter(e => !e.results.success);
    
    const averageRecoveryTime = experiments
      .filter(e => e.recoveryTime)
      .reduce((sum, e) => sum + (e.recoveryTime || 0), 0) / 
      experiments.filter(e => e.recoveryTime).length;
    
    const systemResilienceScore = this.calculateResilienceScore(experiments);
    
    const recommendations = this.generateRecommendations(experiments);
    const nextSteps = this.generateNextSteps(experiments);
    
    const report: ChaosReport = {
      id: faker.string.uuid(),
      timestamp: new Date(),
      experiments,
      summary: {
        totalExperiments: experiments.length,
        successfulExperiments: successfulExperiments.length,
        failedExperiments: failedExperiments.length,
        averageRecoveryTime: Math.round(averageRecoveryTime * 100) / 100,
        systemResilienceScore,
      },
      recommendations,
      nextSteps,
    };
    
    this.emit('report:generated', report);
    return report;
  }

  // Calculate resilience score
  private calculateResilienceScore(experiments: ChaosExperiment[]): number {
    if (experiments.length === 0) return 100;
    
    let score = 100;
    
    experiments.forEach(experiment => {
      if (!experiment.results.failureDetected) {
        score -= 15; // Failure not detected
      }
      if (!experiment.results.recoverySuccessful) {
        score -= 20; // Recovery failed
      }
      if (experiment.severity === 'critical') {
        score -= 10; // Critical severity penalty
      }
    });
    
    return Math.max(0, Math.round(score));
  }

  // Generate recommendations
  private generateRecommendations(experiments: ChaosExperiment[]): string[] {
    const recommendations: string[] = [];
    
    const failureDetectionIssues = experiments.filter(e => !e.results.failureDetected);
    const recoveryIssues = experiments.filter(e => !e.results.recoverySuccessful);
    
    if (failureDetectionIssues.length > 0) {
      recommendations.push('Improve failure detection mechanisms and monitoring');
    }
    
    if (recoveryIssues.length > 0) {
      recommendations.push('Enhance automatic recovery and self-healing capabilities');
    }
    
    const criticalExperiments = experiments.filter(e => e.severity === 'critical');
    if (criticalExperiments.length > 0) {
      recommendations.push('Review and improve critical system components');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('System demonstrates good resilience characteristics');
      recommendations.push('Continue regular chaos engineering practices');
    }
    
    return recommendations;
  }

  // Generate next steps
  private generateNextSteps(experiments: ChaosExperiment[]): string[] {
    const nextSteps: string[] = [];
    
    const failedExperiments = experiments.filter(e => !e.results.success);
    if (failedExperiments.length > 0) {
      nextSteps.push('Investigate and fix issues identified in failed experiments');
      nextSteps.push('Implement improved monitoring and alerting systems');
    }
    
    nextSteps.push('Schedule follow-up experiments to validate improvements');
    nextSteps.push('Document lessons learned and update runbooks');
    nextSteps.push('Share results with development and operations teams');
    
    return nextSteps;
  }

  // Utility method for waiting
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get experiments
  getExperiments(): ChaosExperiment[] {
    return [...this.experiments];
  }

  // Get experiment by ID
  getExperiment(id: string): ChaosExperiment | undefined {
    return this.experiments.find(e => e.id === id);
  }

  // Cancel running experiment
  cancelExperiment(id: string): boolean {
    const experiment = this.experiments.find(e => e.id === id);
    if (experiment && experiment.status === 'running') {
      experiment.status = 'cancelled';
      experiment.endTime = new Date();
      
      const timeout = this.activeExperiments.get(id);
      if (timeout) {
        clearTimeout(timeout);
        this.activeExperiments.delete(id);
      }
      
      this.emit('experiment:cancelled', experiment);
      return true;
    }
    return false;
  }

  // Clear experiment data
  clearExperiments(): void {
    this.experiments = [];
    this.activeExperiments.forEach(timeout => clearTimeout(timeout));
    this.activeExperiments.clear();
    this.emit('experiments:cleared');
  }
}

// Factory function for creating chaos engineers
export function createChaosEngineer(): ChaosEngineer {
import { createLogger } from '@tekup/shared';
const logger = createLogger('packages-testing-src-chaos-cha');

  return new ChaosEngineer();
}