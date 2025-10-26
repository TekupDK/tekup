/**
 * Distributed AI Consciousness - Agent Mesh Network
 * 
 * This package implements a revolutionary AI system that is smarter than the sum of its parts
 * through specialization and collective intelligence.
 * 
 * Key Components:
 * - AgentNode: Core interface for specialized AI agents
 * - BaseAgentNode: Abstract base class for implementing agents
 * - ReasoningAgent: Specialized in logical reasoning and pattern recognition
 * - MemoryAgent: Specialized in long-term memory and knowledge retrieval
 * - PlanningAgent: Specialized in strategic planning and execution coordination
 * - CollectiveIntelligence: Orchestrates the agent mesh network
 * 
 * Revolutionary Aspect: AI system smarter than sum of its parts through specialization
 */

// Core types and interfaces
export * from './types';

// Base agent classes
export { AgentNode, BaseAgentNode } from './agents/AgentNode';

// Specialized agent implementations
export { ReasoningAgent } from './agents/ReasoningAgent';
export { MemoryAgent } from './agents/MemoryAgent';
export { PlanningAgent } from './agents/PlanningAgent';
export { MultimodalAgent } from './agents/MultimodalAgent';

// Collective intelligence system
export { CollectiveIntelligence } from './collective/CollectiveIntelligence';

// Utility functions for creating and managing agents
export const createReasoningAgent = (id: string) => new (require('./agents/ReasoningAgent')).ReasoningAgent(id);
export const createMemoryAgent = (id: string) => new (require('./agents/MemoryAgent')).MemoryAgent(id);
export const createPlanningAgent = (id: string) => new (require('./agents/PlanningAgent')).PlanningAgent(id);
export const createMultimodalAgent = (id: string) => new (require('./agents/MultimodalAgent')).MultimodalAgent(id);

// Factory function for creating a complete collective intelligence system
export const createCollectiveIntelligence = () => new (require('./collective/CollectiveIntelligence')).CollectiveIntelligence();

// MiniCPM integration function
export const createJarvisWithMiniCPM = async () => {
  const collective = createCollectiveIntelligence();
  
  // Add multimodal agent to the collective
  const multimodalAgent = createMultimodalAgent('jarvis-multimodal');
  await collective.addAgent(multimodalAgent);
  
  return collective;
};

// Example usage and demonstration
export const demonstrateCollectiveIntelligence = async () => {
  logger.info('🤖 Initializing Distributed AI Consciousness System...');
  
  // Create the collective intelligence system
  const collective = createCollectiveIntelligence();
  
  // Start the system
  await collective.start();
  
  // Create a sample complex problem
  const complexProblem = {
    id: 'demo-problem-001',
    type: 'system-optimization',
    description: 'Optimize a distributed system for maximum performance while maintaining reliability and scalability',
    complexity: 8,
    requirements: [
      'performance optimization',
      'reliability improvement',
      'scalability enhancement',
      'cost reduction',
      'maintenance simplification'
    ],
    constraints: [
      'must maintain backward compatibility',
      'budget limited to 100k',
      'deployment within 6 months',
      'zero downtime during migration'
    ],
    context: {
      currentSystem: 'legacy-monolithic',
      userBase: '100k+ active users',
      dataVolume: '1TB+ daily',
      criticality: 'high'
    },
    priority: 'high' as const,
    deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // 6 months from now
  };
  
  logger.info('🧠 Solving complex problem with collective intelligence...');
  logger.info(`Problem: ${complexProblem.description}`);
  logger.info(`Complexity: ${complexProblem.complexity}/10`);
  logger.info(`Requirements: ${complexProblem.requirements.length} requirements`);
  
  try {
    // Solve the problem using collective intelligence
    const solution = await collective.solve(complexProblem);
    
    logger.info('\n🎯 Collective Intelligence Solution:');
    logger.info(`Quality: ${solution.quality}/10`);
    logger.info(`Confidence: ${(solution.confidence * 100).toFixed(1)}%`);
    logger.info(`Approach: ${solution.approach}`);
    logger.info(`Reasoning Steps: ${solution.reasoning.length}`);
    
    logger.info('\n🔍 Key Insights:');
    solution.reasoning.slice(0, 3).forEach((insight: string, index: number) => {
      logger.info(`${index + 1}. ${insight}`);
    });
    
    logger.info('\n⚖️ Tradeoffs:');
    solution.tradeoffs.slice(0, 2).forEach((tradeoff: string, index: number) => {
      logger.info(`${index + 1}. ${tradeoff}`);
    });
    
    // Get system state
    const systemState = collective.getSystemState();
    logger.info('\n📊 System State:');
    logger.info(`Active Agents: ${systemState.agentCount}`);
    logger.info(`Problems Solved: ${systemState.performanceMetrics?.problemsSolved || 0}`);
    logger.info(`Average Quality: ${(systemState.performanceMetrics?.averageQuality || 0).toFixed(2)}/10`);
    logger.info(`Network Connections: ${systemState.networkTopology.totalConnections}`);
    
  } catch (error) {
    logger.error('❌ Error solving problem:', error);
  }
  
  // Stop the system
  await collective.stop();
  logger.info('\n🛑 Distributed AI Consciousness System stopped');
};

// Export the demonstration function
export { demonstrateCollectiveIntelligence as demo };