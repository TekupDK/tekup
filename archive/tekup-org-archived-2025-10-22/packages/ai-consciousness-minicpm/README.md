# MiniCPM-V Integration for Jarvis AI Consciousness

> **On-device multimodal AI capabilities using MiniCPM-V and MiniCPM-o models**

## 🎯 Overview

This package integrates MiniCPM-V and MiniCPM-o models with the Jarvis AI Consciousness system, providing powerful on-device multimodal AI capabilities including computer vision, speech processing, and real-time conversation.

## ✨ Features

### 🖼️ Vision Capabilities (MiniCPM-V 2.6)
- **High-resolution image processing** (up to 1.8M pixels)
- **Object detection** and recognition
- **OCR (Optical Character Recognition)** with 30+ language support
- **Scene understanding** and analysis
- **Emotion detection** from visual content
- **Multi-image processing** and comparison

### 🎤 Audio Capabilities (MiniCPM-o 2.6)
- **Speech recognition** (ASR) in 30+ languages
- **Speech synthesis** (TTS) with natural voices
- **Voice cloning** for personalized assistants
- **Real-time audio processing**
- **Emotion detection** from speech
- **Speaker identification**
- **Noise reduction**

### 🎭 Multimodal Capabilities
- **Cross-modal reasoning** between vision and audio
- **Real-time streaming** processing
- **Context-aware conversations**
- **Video analysis** and understanding
- **Multi-language support** (30+ languages)

## 🚀 Quick Start

### Installation

```bash
# Install the package
pnpm add @tekup/ai-consciousness-minicpm

# Install dependencies
pnpm install
```

### Basic Usage

```typescript
import { createMiniCPMService, createJarvisWithMiniCPM } from '@tekup/ai-consciousness-minicpm';

// Create MiniCPM service
const minicpmService = createMiniCPMService({
  enableVision: true,
  enableAudio: true,
  enableMultimodal: true,
  device: 'auto'
});

// Initialize the service
await minicpmService.initialize();

// Process an image
const imageData = Buffer.from('your-image-data');
const imageAnalysis = await minicpmService.analyzeImage(imageData);
console.log('Objects detected:', imageAnalysis.objects);
console.log('Text extracted:', imageAnalysis.text);

// Process audio
const audioData = Buffer.from('your-audio-data');
const transcription = await minicpmService.transcribeAudio(audioData);
console.log('Transcription:', transcription);

// Create Jarvis with MiniCPM integration
const jarvis = await createJarvisWithMiniCPM();
await jarvis.start();

// Solve a multimodal problem
const problem = {
  id: 'vision-problem-001',
  type: 'image-analysis',
  description: 'Analyze this image and extract all text content',
  context: {
    imageData: imageData
  }
};

const solution = await jarvis.solve(problem);
console.log('Solution:', solution);
```

## 🏗️ Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────┐
│                MiniCPM Service                          │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │   Vision    │ │    Audio    │ │ Multimodal  │        │
│  │   Agent     │ │    Agent    │ │    Agent    │        │
│  └─────────────┘ └─────────────┘ └─────────────┘        │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │ MiniCPM-V   │ │ MiniCPM-o   │ │  Cross-Modal│        │
│  │   Model     │ │   Model     │ │  Reasoning  │        │
│  └─────────────┘ └─────────────┘ └─────────────┘        │
└─────────────────────────────────────────────────────────┘
```

### Integration with Jarvis AI Consciousness

The package seamlessly integrates with the existing Jarvis AI Consciousness system:

- **MultimodalAgent**: New agent type for multimodal processing
- **Collective Intelligence**: Enhanced with vision and audio capabilities
- **Problem Solving**: Automatic detection and processing of multimodal problems
- **Learning**: Cross-modal learning and experience integration

## 📚 API Reference

### MiniCPMService

Main service for managing MiniCPM models and capabilities.

```typescript
class MiniCPMService {
  constructor(config: MiniCPMConfig)
  async initialize(): Promise<void>
  async processInput(input: MultimodalInput): Promise<ProcessingResult<any>>
  async analyzeImage(imageData: Buffer): Promise<VisionAnalysis>
  async transcribeAudio(audioData: Buffer): Promise<string>
  async synthesizeSpeech(text: string, options?: VoiceSynthesisOptions): Promise<Buffer>
  async processConversation(audioData: Buffer, imageData?: Buffer, context?: ConversationContext): Promise<{response: string, audioResponse: Buffer}>
  async cleanup(): Promise<void>
}
```

### VisionAgent

Specialized agent for computer vision tasks.

```typescript
class VisionAgent extends BaseAgentNode {
  async detectObjects(imageData: Buffer): Promise<DetectedObject[]>
  async extractText(imageData: Buffer): Promise<ExtractedText[]>
  async understandScene(imageData: Buffer): Promise<SceneDescription>
  async processHighResolution(imageData: Buffer, maxPixels?: number): Promise<VisionAnalysis>
  async processMultiImage(images: Buffer[]): Promise<VisionAnalysis[]>
}
```

### AudioAgent

Specialized agent for audio processing tasks.

```typescript
class AudioAgent extends BaseAgentNode {
  async transcribeSpeech(audioData: Buffer): Promise<string>
  async synthesizeSpeech(text: string, options?: VoiceSynthesisOptions): Promise<Buffer>
  async cloneVoice(referenceAudio: Buffer, text: string): Promise<Buffer>
  async detectEmotions(audioData: Buffer): Promise<EmotionAnalysis>
  async identifySpeakers(audioData: Buffer): Promise<SpeakerInfo[]>
  async processRealTime(audioStream: AsyncIterable<Buffer>): Promise<AsyncIterable<AudioAnalysis>>
}
```

### MultimodalAgent

Orchestrates vision and audio agents for comprehensive multimodal processing.

```typescript
class MultimodalAgent extends BaseAgentNode {
  async processConversation(audioData: Buffer, imageData?: Buffer, context?: ConversationContext): Promise<{response: string, audioResponse: Buffer, visualInsights?: any}>
  async processRealTimeStream(audioStream: AsyncIterable<Buffer>, imageStream?: AsyncIterable<Buffer>): Promise<AsyncIterable<any>>
  async performCrossModalReasoning(visionData: VisionAnalysis, audioData: AudioAnalysis): Promise<any>
}
```

## 🔧 Configuration

### MiniCPMConfig

```typescript
interface MiniCPMConfig {
  modelPath: string;           // Model path or HuggingFace model ID
  device: 'cpu' | 'cuda' | 'mps' | 'auto';  // Device to run on
  quantization?: 'int4' | 'int8' | 'fp16' | 'fp32';  // Model quantization
  maxTokens?: number;          // Maximum tokens for generation
  temperature?: number;        // Sampling temperature
  topP?: number;              // Top-p sampling
  languages?: string[];        // Supported languages
  enableVision?: boolean;      // Enable vision capabilities
  enableAudio?: boolean;       // Enable audio capabilities
  enableMultimodal?: boolean;  // Enable multimodal capabilities
}
```

### Device Optimization

The service automatically detects device capabilities and optimizes model selection:

- **High-end devices**: Full MiniCPM-V 2.6 model
- **Mid-range devices**: Quantized int4 model
- **Low-end devices**: Heavily quantized model
- **Mobile devices**: Optimized for battery life and memory usage

## 🌍 Multi-language Support

Supports 30+ languages including:
- English, Chinese, German, French, Spanish
- Italian, Russian, Korean, Japanese
- And many more...

## 📱 On-Device Deployment

### Mobile Devices
- **Android**: Optimized for ARM64 architecture
- **iOS**: Compatible with Apple Silicon
- **Memory**: 4GB+ RAM recommended
- **Storage**: 2-4GB for models

### Desktop/Server
- **CPU**: Multi-core processor recommended
- **GPU**: Optional but recommended for better performance
- **Memory**: 8GB+ RAM recommended
- **Storage**: 4-8GB for models

## 🔒 Privacy & Security

- **On-device processing**: No data sent to external servers
- **Local models**: All AI processing happens locally
- **Data privacy**: Your data stays on your device
- **Offline capable**: Works without internet connection

## 🚀 Performance

### Benchmarks
- **Vision**: GPT-4V level performance on OpenCompass
- **Audio**: Real-time processing with <100ms latency
- **Multimodal**: State-of-the-art cross-modal reasoning
- **Efficiency**: 75% fewer tokens than comparable models

### Optimization
- **Quantization**: Reduces model size by 90%
- **Memory optimization**: Efficient memory usage
- **Compilation optimization**: Faster inference
- **NPU acceleration**: Hardware acceleration when available

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

Proprietary - TekUp.dk

## 🔗 Related Packages

- `@tekup/ai-consciousness` - Core AI consciousness system
- `@tekup/shared` - Shared utilities
- `@tekup/config` - Configuration management

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact the TekUp development team
- Check the documentation wiki

---

**Built with ❤️ by the TekUp team for the future of on-device AI**