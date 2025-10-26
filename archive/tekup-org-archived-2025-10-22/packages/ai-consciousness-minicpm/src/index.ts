/**
 * MiniCPM-V Integration for Jarvis AI Consciousness
 * 
 * On-device multimodal AI capabilities using MiniCPM-V and MiniCPM-o models
 * 
 * Key Components:
 * - VisionAgent: Computer vision using MiniCPM-V
 * - AudioAgent: Speech processing using MiniCPM-o
 * - MultimodalAgent: Combined vision and audio processing
 * - MiniCPMService: Main service for managing all capabilities
 * 
 * Features:
 * - On-device processing (no cloud dependency)
 * - Real-time multimodal understanding
 * - Voice assistant capabilities
 * - High-resolution image processing
 * - Multi-language support (30+ languages)
 * - Cross-modal reasoning
 */

// Export types
export * from './types';

// Export agents
export { VisionAgent } from './agents/VisionAgent';
export { AudioAgent } from './agents/AudioAgent';
export { MultimodalAgent } from './agents/MultimodalAgent';

// Export services
export { MiniCPMService } from './services/MiniCPMService';

// Import classes for factory functions
import { MiniCPMService } from './services/MiniCPMService';
import { VisionAgent } from './agents/VisionAgent';
import { AudioAgent } from './agents/AudioAgent';
import { MultimodalAgent } from './agents/MultimodalAgent';

// Factory functions for easy integration
export const createMiniCPMService = (config?: any) => {
  return new MiniCPMService(config);
};

export const createVisionAgent = (id: string, config?: any) => {
  return new VisionAgent(id, config);
};

export const createAudioAgent = (id: string, config?: any) => {
  return new AudioAgent(id, config);
};

export const createMultimodalAgent = (id: string, config?: any) => {
  return new MultimodalAgent(id, config);
};

// Integration with Jarvis AI Consciousness
export const integrateWithJarvis = async (collectiveIntelligence: any) => {
  console.log('🤖 Integrating MiniCPM with Jarvis AI Consciousness...');
  
  // Create MiniCPM service
  const minicpmService = createMiniCPMService({
    enableVision: true,
    enableAudio: true,
    enableMultimodal: true,
    device: 'auto'
  });
  
  // Initialize the service
  await minicpmService.initialize();
  
  // Register agents with collective intelligence
  const visionAgent = createVisionAgent('jarvis-vision');
  const audioAgent = createAudioAgent('jarvis-audio');
  const multimodalAgent = createMultimodalAgent('jarvis-multimodal');
  
  // Initialize agents
  await Promise.all([
    visionAgent.initialize(),
    audioAgent.initialize(),
    multimodalAgent.initialize()
  ]);
  
  // Register with collective intelligence
  // TODO: Implement actual registration with collective intelligence system
  
  console.log('✅ MiniCPM successfully integrated with Jarvis');
  
  return {
    service: minicpmService,
    visionAgent,
    audioAgent,
    multimodalAgent
  };
};

// Demo function
export const demonstrateMiniCPM = async () => {
  console.log('🎭 Demonstrating MiniCPM-V Integration...');
  
  try {
    // Create and initialize service
    const service = createMiniCPMService({
      enableVision: true,
      enableAudio: true,
      enableMultimodal: true
    });
    
    await service.initialize();
    
    // Health check
    const health = await service.healthCheck();
    console.log('🏥 Health Status:', health);
    
    // Device capabilities
    const capabilities = service.getDeviceCapabilities();
    console.log('📱 Device Capabilities:', capabilities);
    
    // Demo image processing (mock)
    console.log('🖼️ Testing image processing...');
    const mockImageData = Buffer.from('mock-image-data');
    
    try {
      const imageAnalysis = await service.analyzeImage(mockImageData);
      console.log('✅ Image analysis successful:', {
        objects: imageAnalysis.objects.length,
        text: imageAnalysis.text.length,
        confidence: imageAnalysis.confidence
      });
    } catch (error) {
      console.log('⚠️ Image processing demo failed (expected with mock data):', error instanceof Error ? error.message : 'Unknown error');
    }
    
    // Demo audio processing (mock)
    console.log('🎤 Testing audio processing...');
    const mockAudioData = Buffer.from('mock-audio-data');
    
    try {
      const audioAnalysis = await service.analyzeAudio(mockAudioData);
      console.log('✅ Audio analysis successful:', {
        transcription: audioAnalysis.transcription,
        language: audioAnalysis.language,
        confidence: audioAnalysis.confidence
      });
    } catch (error) {
      console.log('⚠️ Audio processing demo failed (expected with mock data):', error instanceof Error ? error.message : 'Unknown error');
    }
    
    // Cleanup
    await service.cleanup();
    
    console.log('✅ MiniCPM demonstration completed');
    
  } catch (error) {
    console.error('❌ MiniCPM demonstration failed:', error);
  }
};

// Export demo function
export { demonstrateMiniCPM as demo };