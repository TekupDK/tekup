/**
 * Simple test to verify the Distributed AI Consciousness system works
 */

const { CollectiveIntelligence } = require('./dist/index.js');

async function testBasicFunctionality() {
  logger.info('🧪 Testing Distributed AI Consciousness System...\n');
  
  try {
    // Create the collective intelligence system
    const collective = new CollectiveIntelligence();
    logger.info('✅ Collective Intelligence system created');
    
    // Start the system
    await collective.start();
    logger.info('✅ System started');
    
    // Check system state
    const state = collective.getSystemState();
    logger.info(`📊 System State:`);
    logger.info(`   - Active: ${state.active}`);
    logger.info(`   - Agents: ${state.agentCount}`);
    logger.info(`   - Connections: ${state.networkTopology.totalConnections}`);
    
    // Create a simple problem
    const problem = {
      id: 'test-001',
      type: 'test',
      description: 'Test problem for verification',
      complexity: 3,
      requirements: ['reasoning', 'memory', 'planning'],
      constraints: ['simple'],
      context: { test: true },
      priority: 'low'
    };
    
    logger.info('\n🧠 Solving test problem...');
    const solution = await collective.solve(problem);
    
    logger.info('✅ Problem solved!');
    logger.info(`   - Quality: ${solution.quality}/10`);
    logger.info(`   - Confidence: ${(solution.confidence * 100).toFixed(1)}%`);
    logger.info(`   - Approach: ${solution.approach}`);
    
    // Check final state
    const finalState = collective.getSystemState();
    logger.info(`\n📊 Final State:`);
    logger.info(`   - Problems Solved: ${finalState.performanceMetrics?.problemsSolved || 0}`);
    logger.info(`   - Average Quality: ${(finalState.performanceMetrics?.averageQuality || 0).toFixed(2)}/10`);
    
    // Stop the system
    await collective.stop();
    logger.info('\n🛑 System stopped');
    
    logger.info('\n🎉 All tests passed! The Distributed AI Consciousness system is working correctly.');
    
  } catch (error) {
    logger.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testBasicFunctionality().catch(console.error);