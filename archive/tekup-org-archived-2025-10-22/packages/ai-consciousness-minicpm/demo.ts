/**
 * MiniCPM-V Integration Demo
 * 
 * Demonstrates the capabilities of MiniCPM-V integration with Jarvis AI Consciousness
 */

import { 
  createMiniCPMService, 
  createJarvisWithMiniCPM, 
  demonstrateMiniCPM 
} from './src/index';

async function runDemo() {
  console.log('🎭 MiniCPM-V Integration Demo for Jarvis AI Consciousness');
  console.log('=' .repeat(60));
  
  try {
    // Run the built-in demonstration
    await demonstrateMiniCPM();
    
    console.log('\n' + '=' .repeat(60));
    console.log('🤖 Creating Jarvis with MiniCPM integration...');
    
    // Create Jarvis with MiniCPM capabilities
    const jarvis = await createJarvisWithMiniCPM();
    
    // Start the collective intelligence system
    await jarvis.start();
    
    console.log('✅ Jarvis with MiniCPM started successfully!');
    
    // Create a sample multimodal problem
    const multimodalProblem = {
      id: 'demo-multimodal-001',
      type: 'multimodal-analysis',
      description: 'Analyze this image and transcribe the audio to understand the complete context',
      complexity: 7,
      requirements: [
        'extract text from image',
        'transcribe audio content',
        'understand visual context',
        'provide integrated analysis'
      ],
      constraints: [
        'must process on-device',
        'real-time response required',
        'maintain privacy'
      ],
      context: {
        imageData: Buffer.from('mock-image-data'),
        audioData: Buffer.from('mock-audio-data'),
        modalities: ['vision', 'audio'],
        language: 'en'
      },
      priority: 'high' as const,
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    };
    
    console.log('\n🧠 Solving multimodal problem with Jarvis...');
    console.log(`Problem: ${multimodalProblem.description}`);
    console.log(`Complexity: ${multimodalProblem.complexity}/10`);
    console.log(`Requirements: ${multimodalProblem.requirements.length} requirements`);
    
    // Solve the problem using collective intelligence
    const solution = await jarvis.solve(multimodalProblem);
    
    console.log('\n🎯 Jarvis Solution:');
    console.log(`Quality: ${solution.quality}/10`);
    console.log(`Confidence: ${(solution.confidence * 100).toFixed(1)}%`);
    console.log(`Approach: ${solution.approach}`);
    console.log(`Reasoning Steps: ${solution.reasoning.length}`);
    
    console.log('\n🔍 Key Insights:');
    solution.reasoning.slice(0, 3).forEach((insight: string, index: number) => {
      console.log(`${index + 1}. ${insight}`);
    });
    
    console.log('\n⚖️ Tradeoffs:');
    solution.tradeoffs.slice(0, 2).forEach((tradeoff: string, index: number) => {
      console.log(`${index + 1}. ${tradeoff}`);
    });
    
    // Get system state
    const systemState = jarvis.getSystemState();
    console.log('\n📊 Jarvis System State:');
    console.log(`Active Agents: ${systemState.agentCount}`);
    console.log(`Problems Solved: ${systemState.performanceMetrics?.problemsSolved || 0}`);
    console.log(`Average Quality: ${(systemState.performanceMetrics?.averageQuality || 0).toFixed(2)}/10`);
    console.log(`Network Connections: ${systemState.networkTopology.totalConnections}`);
    
    // Test individual capabilities
    console.log('\n🔬 Testing individual capabilities...');
    
    // Test vision capabilities
    console.log('🖼️ Testing vision capabilities...');
    const visionProblem = {
      id: 'vision-test-001',
      type: 'image-analysis',
      description: 'Detect objects and extract text from this image',
      context: { imageData: Buffer.from('mock-image-data') }
    };
    
    const visionSolution = await jarvis.solve(visionProblem);
    console.log(`Vision analysis quality: ${visionSolution.quality}/10`);
    
    // Test audio capabilities
    console.log('🎤 Testing audio capabilities...');
    const audioProblem = {
      id: 'audio-test-001',
      type: 'speech-processing',
      description: 'Transcribe and analyze this audio content',
      context: { audioData: Buffer.from('mock-audio-data') }
    };
    
    const audioSolution = await jarvis.solve(audioProblem);
    console.log(`Audio analysis quality: ${audioSolution.quality}/10`);
    
    // Stop the system
    await jarvis.stop();
    console.log('\n🛑 Jarvis with MiniCPM stopped');
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ Demo completed successfully!');
    console.log('🎉 Jarvis now has powerful multimodal AI capabilities!');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runDemo().catch(console.error);
}

export { runDemo };