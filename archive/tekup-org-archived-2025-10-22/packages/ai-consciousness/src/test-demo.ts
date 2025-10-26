/**
 * Test demonstration of the Distributed AI Consciousness system
 * This file demonstrates the core functionality and capabilities
 */

import { 
  CollectiveIntelligence, 
  ReasoningAgent, 
  MemoryAgent, 
  PlanningAgent,
  Problem,
  Solution 
} from './index';

async function runBasicDemo() {
  console.log('🚀 Starting Basic Demo of Distributed AI Consciousness\n');
  
  // Create the collective intelligence system
  const collective = new CollectiveIntelligence();
  
  try {
    // Start the system
    await collective.start();
    console.log('✅ Collective Intelligence system started');
    
    // Display system state
    const initialState = collective.getSystemState();
    console.log(`📊 Initial System State:`);
    console.log(`   - Active Agents: ${initialState.agentCount}`);
    console.log(`   - Network Connections: ${initialState.networkTopology.totalConnections}`);
    
    // Create a simple test problem
    const testProblem: Problem = {
      id: 'test-problem-001',
      type: 'optimization',
      description: 'Optimize a simple web application for better performance',
      complexity: 5,
      requirements: ['performance improvement', 'user experience', 'maintainability'],
      constraints: ['budget limited', 'quick deployment'],
      context: { currentSystem: 'basic-web-app' },
      priority: 'medium'
    };
    
    console.log('\n🧠 Solving Test Problem:');
    console.log(`   Problem: ${testProblem.description}`);
    console.log(`   Complexity: ${testProblem.complexity}/10`);
    console.log(`   Requirements: ${testProblem.requirements.join(', ')}`);
    
    // Solve the problem
    const solution = await collective.solve(testProblem);
    
    console.log('\n🎯 Solution Generated:');
    console.log(`   Quality: ${solution.quality}/10`);
    console.log(`   Confidence: ${(solution.confidence * 100).toFixed(1)}%`);
    console.log(`   Approach: ${solution.approach}`);
    
    console.log('\n🔍 Key Insights:');
    solution.reasoning.slice(0, 3).forEach((insight, index) => {
      console.log(`   ${index + 1}. ${insight}`);
    });
    
    // Get updated system state
    const finalState = collective.getSystemState();
    console.log('\n📊 Final System State:');
    console.log(`   - Problems Solved: ${finalState.performanceMetrics?.problemsSolved || 0}`);
    console.log(`   - Average Quality: ${(finalState.performanceMetrics?.averageQuality || 0).toFixed(2)}/10`);
    
  } catch (error) {
    console.error('❌ Error during demo:', error);
  } finally {
    // Stop the system
    await collective.stop();
    console.log('\n🛑 Demo completed, system stopped');
  }
}

async function runAdvancedDemo() {
  console.log('\n🚀 Starting Advanced Demo with Custom Agents\n');
  
  // Create the collective intelligence system
  const collective = new CollectiveIntelligence();
  
  try {
    // Start the system
    await collective.start();
    console.log('✅ Collective Intelligence system started');
    
    // Create additional specialized agents
    const advancedReasoningAgent = new ReasoningAgent('advanced-reasoning-001');
    const advancedMemoryAgent = new MemoryAgent('advanced-memory-001');
    
    // Add them to the system
    await collective.addAgent(advancedReasoningAgent);
    await collective.addAgent(advancedMemoryAgent);
    
    console.log('✅ Added 2 additional specialized agents');
    
    // Create a complex problem
    const complexProblem: Problem = {
      id: 'complex-problem-001',
      type: 'system-architecture',
      description: 'Design a scalable microservices architecture for a high-traffic e-commerce platform',
      complexity: 9,
      requirements: [
        'high availability',
        'horizontal scalability',
        'data consistency',
        'security compliance',
        'monitoring and observability',
        'cost optimization'
      ],
      constraints: [
        'must support 1M+ concurrent users',
        '99.99% uptime requirement',
        'GDPR compliance',
        'deployment within 12 months'
      ],
      context: {
        currentSystem: 'monolithic-legacy',
        userBase: '500K+ active users',
        dataVolume: '10TB+ daily',
        businessCriticality: 'extremely high'
      },
      priority: 'critical',
      deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    };
    
    console.log('\n🧠 Solving Complex Problem:');
    console.log(`   Problem: ${complexProblem.description}`);
    console.log(`   Complexity: ${complexProblem.complexity}/10`);
    console.log(`   Requirements: ${complexProblem.requirements.length} requirements`);
    console.log(`   Constraints: ${complexProblem.constraints.length} constraints`);
    
    // Solve the complex problem
    const complexSolution = await collective.solve(complexProblem);
    
    console.log('\n🎯 Complex Solution Generated:');
    console.log(`   Quality: ${complexSolution.quality}/10`);
    console.log(`   Confidence: ${(complexSolution.confidence * 100).toFixed(1)}%`);
    console.log(`   Approach: ${complexSolution.approach}`);
    
    console.log('\n🔍 Key Insights:');
    complexSolution.reasoning.slice(0, 5).forEach((insight, index) => {
      console.log(`   ${index + 1}. ${insight}`);
    });
    
    console.log('\n⚖️ Tradeoffs Identified:');
    complexSolution.tradeoffs.slice(0, 3).forEach((tradeoff, index) => {
      console.log(`   ${index + 1}. ${tradeoff}`);
    });
    
    console.log('\n🔄 Alternative Approaches:');
    complexSolution.alternatives.slice(0, 2).forEach((alternative, index) => {
      console.log(`   ${index + 1}. ${alternative}`);
    });
    
    // Get comprehensive system state
    const finalState = collective.getSystemState();
    console.log('\n📊 Advanced System State:');
    console.log(`   - Total Agents: ${finalState.agentCount}`);
    console.log(`   - Problems Solved: ${finalState.performanceMetrics?.problemsSolved || 0}`);
    console.log(`   - Average Quality: ${(finalState.performanceMetrics?.averageQuality || 0).toFixed(2)}/10`);
    console.log(`   - Network Connections: ${finalState.networkTopology.totalConnections}`);
    
    // Show agent utilization
    if (finalState.performanceMetrics?.agentUtilization) {
      console.log('\n👥 Agent Utilization:');
      for (const [agentId, utilization] of finalState.performanceMetrics.agentUtilization.entries()) {
        console.log(`   - ${agentId}: ${utilization} problems`);
      }
    }
    
    // Show specialty effectiveness
    if (finalState.performanceMetrics?.specialtyEffectiveness) {
      console.log('\n🎯 Specialty Effectiveness:');
      for (const [specialty, stats] of finalState.performanceMetrics.specialtyEffectiveness.entries()) {
        const avgQuality = stats.quality / stats.total;
        console.log(`   - ${specialty}: ${stats.total} problems, avg quality ${avgQuality.toFixed(2)}/10`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error during advanced demo:', error);
  } finally {
    // Stop the system
    await collective.stop();
    console.log('\n🛑 Advanced demo completed, system stopped');
  }
}

async function runAgentInteractionDemo() {
  console.log('\n🚀 Starting Agent Interaction Demo\n');
  
  // Create individual agents to demonstrate direct interaction
  const reasoningAgent = new ReasoningAgent('demo-reasoning-001');
  const memoryAgent = new MemoryAgent('demo-memory-001');
  const planningAgent = new PlanningAgent('demo-planning-001');
  
  try {
    // Start all agents
    await reasoningAgent.start();
    await memoryAgent.start();
    await planningAgent.start();
    
    console.log('✅ All individual agents started');
    
    // Connect agents
    await reasoningAgent.connect(memoryAgent);
    await memoryAgent.connect(planningAgent);
    await planningAgent.connect(reasoningAgent);
    
    console.log('✅ Agents connected in a triangle network');
    
    // Create a simple problem for individual agent testing
    const simpleProblem: Problem = {
      id: 'simple-problem-001',
      type: 'analysis',
      description: 'Analyze the performance characteristics of a database query',
      complexity: 4,
      requirements: ['performance analysis', 'optimization suggestions'],
      constraints: ['no schema changes', 'quick analysis'],
      context: { databaseType: 'postgresql' },
      priority: 'medium'
    };
    
    console.log('\n🧠 Testing Individual Agent Capabilities:');
    console.log(`   Problem: ${simpleProblem.description}`);
    
    // Test reasoning agent
    console.log('\n🧮 Reasoning Agent Analysis:');
    const reasoningSolution = await reasoningAgent.contribute(simpleProblem);
    console.log(`   Quality: ${reasoningSolution.quality}/10`);
    console.log(`   Confidence: ${(reasoningSolution.confidence * 100).toFixed(1)}%`);
    console.log(`   Key Insight: ${reasoningSolution.reasoning[0]}`);
    
    // Test memory agent
    console.log('\n🧠 Memory Agent Analysis:');
    const memorySolution = await memoryAgent.contribute(simpleProblem);
    console.log(`   Quality: ${memorySolution.quality}/10`);
    console.log(`   Confidence: ${(memorySolution.confidence * 100).toFixed(1)}%`);
    console.log(`   Key Insight: ${memorySolution.reasoning[0]}`);
    
    // Test planning agent
    console.log('\n📋 Planning Agent Analysis:');
    const planningSolution = await planningAgent.contribute(simpleProblem);
    console.log(`   Quality: ${planningSolution.quality}/10`);
    console.log(`   Confidence: ${(planningSolution.confidence * 100).toFixed(1)}%`);
    console.log(`   Key Insight: ${planningSolution.reasoning[0]}`);
    
    // Demonstrate agent communication
    console.log('\n💬 Testing Agent Communication:');
    
    const message = {
      id: 'test-message-001',
      senderId: reasoningAgent.id,
      targetId: memoryAgent.id,
      type: 'insight' as const,
      content: { insight: 'Database query optimization patterns identified' },
      timestamp: new Date(),
      priority: 'medium' as const
    };
    
    await reasoningAgent.communicate(message, memoryAgent.id);
    console.log('✅ Message sent from reasoning agent to memory agent');
    
    // Show agent states
    console.log('\n📊 Individual Agent States:');
    console.log(`   Reasoning Agent: ${reasoningAgent.getState().status}`);
    console.log(`   Memory Agent: ${memoryAgent.getState().status}`);
    console.log(`   Planning Agent: ${planningAgent.getState().status}`);
    
  } catch (error) {
    console.error('❌ Error during agent interaction demo:', error);
  } finally {
    // Stop all agents
    await reasoningAgent.stop();
    await memoryAgent.stop();
    await planningAgent.stop();
    console.log('\n🛑 Agent interaction demo completed, all agents stopped');
  }
}

// Main demo runner
async function runAllDemos() {
  console.log('🌟 Distributed AI Consciousness - Complete Demo Suite\n');
  console.log('This demo showcases the revolutionary AI system that is smarter than the sum of its parts!\n');
  
  try {
    await runBasicDemo();
    await runAdvancedDemo();
    await runAgentInteractionDemo();
    
    console.log('\n🎉 All demos completed successfully!');
    console.log('\n💡 Key Takeaways:');
    console.log('   • Specialized agents excel in their domains');
    console.log('   • Collective intelligence emerges from collaboration');
    console.log('   • The system adapts and learns from experience');
    console.log('   • Complex problems are solved through distributed expertise');
    
  } catch (error) {
    console.error('\n💥 Demo suite failed:', error);
  }
}

// Export the demo functions
export { runBasicDemo, runAdvancedDemo, runAgentInteractionDemo, runAllDemos };

// Run the complete demo if this file is executed directly
if (require.main === module) {
  runAllDemos().catch(console.error);
}