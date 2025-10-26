#!/usr/bin/env ts-node

/**
 * Self-Evolving Architecture Demo
 * 
 * This script demonstrates how the self-evolving architecture works
 * by simulating a system that continuously improves itself.
 */

import { 
  startEvolutionEngine, 
  DEFAULT_EVOLUTION_CONFIG,
  SystemMetrics,
  CodeSection,
  CodeSolution
} from '../src';

/**
 * Simulate a system with performance bottlenecks
 */
class SimulatedSystem {
  private responseTime = 1200; // ms - above threshold
  private errorRate = 8; // % - above threshold
  private memoryUsage = 85; // % - above threshold
  private cpuUsage = 92; // % - above threshold
  private healthScore = 65; // below threshold

  /**
   * Simulate system performance metrics
   */
  getMetrics(): SystemMetrics {
    return {
      responseTime: this.responseTime,
      throughput: 150,
      memoryUsage: this.memoryUsage,
      cpuUsage: this.cpuUsage,
      errorRate: this.errorRate,
      databasePerformance: 450,
      cacheHitRate: 45,
      networkLatency: 120,
      timestamp: new Date(),
      healthScore: this.healthScore
    };
  }

  /**
   * Simulate performance improvement after optimization
   */
  applyOptimization(improvement: Partial<SystemMetrics>): void {
    if (improvement.responseTime) {
      this.responseTime = Math.max(200, this.responseTime - improvement.responseTime);
    }
    if (improvement.errorRate) {
      this.errorRate = Math.max(0, this.errorRate - improvement.errorRate);
    }
    if (improvement.memoryUsage) {
      this.memoryUsage = Math.max(20, this.memoryUsage - improvement.memoryUsage);
    }
    if (improvement.cpuUsage) {
      this.cpuUsage = Math.max(10, this.cpuUsage - improvement.cpuUsage);
    }
    
    // Recalculate health score
    this.healthScore = this.calculateHealthScore();
  }

  private calculateHealthScore(): number {
    let score = 100;
    
    if (this.responseTime > 1000) score -= 20;
    if (this.errorRate > 5) score -= 30;
    if (this.memoryUsage > 80) score -= 15;
    if (this.cpuUsage > 90) score -= 15;
    
    return Math.max(0, score);
  }

  /**
   * Simulate system load to trigger evolution
   */
  simulateLoad(): void {
    // Simulate increasing load
    this.responseTime = Math.min(2000, this.responseTime + Math.random() * 100);
    this.errorRate = Math.min(15, this.errorRate + Math.random() * 2);
    this.memoryUsage = Math.min(95, this.memoryUsage + Math.random() * 5);
    this.cpuUsage = Math.min(98, this.cpuUsage + Math.random() * 3);
    
    this.healthScore = this.calculateHealthScore();
  }
}

/**
 * Enhanced evolution engine with simulation capabilities
 */
class DemoEvolutionEngine {
  private system: SimulatedSystem;
  private evolutionCount = 0;
  private totalImprovement = 0;

  constructor() {
    this.system = new SimulatedSystem();
  }

  /**
   * Run the evolution demo
   */
  async runDemo(): Promise<void> {
    logger.info('🚀 Starting Self-Evolving Architecture Demo');
    logger.info('=' .repeat(60));
    
    // Initial system state
    logger.info('\n📊 Initial System State:');
    this.displayMetrics(this.system.getMetrics());
    
    // Start evolution cycles
    await this.runEvolutionCycles();
    
    // Final results
    logger.info('\n🎯 Evolution Demo Complete!');
    logger.info('=' .repeat(60));
    logger.info(`Total evolutions performed: ${this.evolutionCount}`);
    logger.info(`Total performance improvement: ${this.totalImprovement.toFixed(1)}%`);
    logger.info('\n📊 Final System State:');
    this.displayMetrics(this.system.getMetrics());
  }

  /**
   * Run multiple evolution cycles
   */
  private async runEvolutionCycles(): Promise<void> {
    const cycles = 5;
    
    for (let i = 1; i <= cycles; i++) {
      logger.info(`\n🔄 Evolution Cycle ${i}/${cycles}`);
      logger.info('-'.repeat(40));
      
      // Simulate system load
      this.system.simulateLoad();
      logger.info('📈 System load increased...');
      
      // Check if evolution is needed
      const metrics = this.system.getMetrics();
      if (this.shouldTriggerEvolution(metrics)) {
        logger.info('🔍 Performance thresholds exceeded, triggering evolution...');
        
        // Simulate evolution process
        const improvement = await this.simulateEvolution(metrics);
        
        if (improvement) {
          this.system.applyOptimization(improvement);
          this.evolutionCount++;
          this.totalImprovement += improvement.healthScore || 0;
          
          logger.info('✅ Evolution successful! System performance improved.');
        } else {
          logger.info('❌ Evolution failed or was rolled back.');
        }
      } else {
        logger.info('✅ System performance within acceptable thresholds.');
      }
      
      // Display current state
      this.displayMetrics(this.system.getMetrics());
      
      // Wait between cycles
      await this.delay(2000);
    }
  }

  /**
   * Check if evolution should be triggered
   */
  private shouldTriggerEvolution(metrics: SystemMetrics): boolean {
    return (
      metrics.responseTime > 1000 ||
      metrics.errorRate > 5 ||
      metrics.memoryUsage > 80 ||
      metrics.cpuUsage > 90 ||
      metrics.healthScore < 70
    );
  }

  /**
   * Simulate the evolution process
   */
  private async simulateEvolution(metrics: SystemMetrics): Promise<Partial<SystemMetrics> | null> {
    logger.info('🧠 AI analyzing bottlenecks...');
    await this.delay(1000);
    
    logger.info('🎯 Generating optimization strategies...');
    await this.delay(1000);
    
    logger.info('🧪 Testing optimizations in isolated environment...');
    await this.delay(1500);
    
    // Simulate success/failure with 80% success rate
    const success = Math.random() < 0.8;
    
    if (success) {
      logger.info('🚀 Deploying successful optimizations...');
      await this.delay(1000);
      
      // Generate realistic improvements
      return {
        responseTime: Math.random() * 300 + 100, // 100-400ms improvement
        errorRate: Math.random() * 3 + 1, // 1-4% improvement
        memoryUsage: Math.random() * 15 + 5, // 5-20% improvement
        cpuUsage: Math.random() * 10 + 5, // 5-15% improvement
        healthScore: Math.random() * 20 + 10 // 10-30% improvement
      };
    } else {
      logger.info('⚠️  Optimization failed, rolling back changes...');
      await this.delay(1000);
      return null;
    }
  }

  /**
   * Display system metrics in a formatted way
   */
  private displayMetrics(metrics: SystemMetrics): void {
    const formatMetric = (value: number, unit: string) => {
      const color = this.getMetricColor(value, unit);
      return `${color}${value}${unit}\x1b[0m`;
    };

    logger.info(`  Response Time: ${formatMetric(metrics.responseTime, 'ms')}`);
    logger.info(`  Error Rate: ${formatMetric(metrics.errorRate, '%')}`);
    logger.info(`  Memory Usage: ${formatMetric(metrics.memoryUsage, '%')}`);
    logger.info(`  CPU Usage: ${formatMetric(metrics.cpuUsage, '%')}`);
    logger.info(`  Health Score: ${formatMetric(metrics.healthScore, '')}`);
  }

  /**
   * Get color for metric based on threshold
   */
  private getMetricColor(value: number, unit: string): string {
    if (unit === 'ms') {
      return value > 1000 ? '\x1b[31m' : value > 500 ? '\x1b[33m' : '\x1b[32m';
    } else if (unit === '%') {
      if (unit === '' && value < 70) return '\x1b[31m'; // Health score
      return value > 80 ? '\x1b[31m' : value > 60 ? '\x1b[33m' : '\x1b[32m';
    }
    return '\x1b[37m';
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Main demo execution
 */
async function main(): Promise<void> {
  try {
    const demo = new DemoEvolutionEngine();
    await demo.runDemo();
    
    logger.info('\n🎉 Demo completed successfully!');
    logger.info('\nThis demonstrates how the Self-Evolving Architecture:');
    logger.info('• Continuously monitors system performance');
    logger.info('• Automatically identifies bottlenecks');
    logger.info('• Generates and tests optimization strategies');
    logger.info('• Deploys improvements when beneficial');
    logger.info('• Rolls back changes when needed');
    logger.info('• Continuously improves system performance over time');
    
  } catch (error) {
    logger.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { DemoEvolutionEngine, SimulatedSystem };
import { createLogger } from '@tekup/shared';
const logger = createLogger('packages-evolution-engine-exam');
