/**
 * MiniCPM-V Integration Types
 * 
 * Type definitions for MiniCPM-V multimodal AI integration
 * with Jarvis AI Consciousness system
 */

export interface MultimodalInput {
  type: 'image' | 'audio' | 'video' | 'text' | 'multimodal';
  data: Buffer | string | ArrayBuffer;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    format?: string;
    language?: string;
    timestamp?: Date;
  };
}

export interface VisionAnalysis {
  objects: DetectedObject[];
  text: ExtractedText[];
  scene: SceneDescription;
  emotions?: EmotionAnalysis;
  actions?: ActionDescription[];
  confidence: number;
}

export interface DetectedObject {
  label: string;
  confidence: number;
  boundingBox: BoundingBox;
  attributes?: Record<string, any>;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExtractedText {
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
  language?: string;
}

export interface SceneDescription {
  description: string;
  setting: string;
  mood: string;
  lighting: string;
  weather?: string;
}

export interface EmotionAnalysis {
  dominant: string;
  confidence: number;
  all: Array<{
    emotion: string;
    confidence: number;
  }>;
}

export interface ActionDescription {
  action: string;
  confidence: number;
  subject?: string;
  object?: string;
}

export interface AudioAnalysis {
  transcription: string;
  language: string;
  confidence: number;
  emotions?: EmotionAnalysis;
  speakers?: SpeakerInfo[];
  topics?: string[];
  sentiment: SentimentAnalysis;
}

export interface SpeakerInfo {
  id: string;
  gender?: 'male' | 'female' | 'unknown';
  age?: 'child' | 'adult' | 'elderly' | 'unknown';
  confidence: number;
}

export interface SentimentAnalysis {
  polarity: 'positive' | 'negative' | 'neutral';
  confidence: number;
  magnitude: number;
}

export interface ConversationContext {
  history: ConversationTurn[];
  currentUser: string;
  sessionId: string;
  preferences?: UserPreferences;
}

export interface ConversationTurn {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  modality?: 'text' | 'voice' | 'image' | 'video';
  metadata?: Record<string, any>;
}

export interface UserPreferences {
  language: string;
  voiceStyle?: string;
  responseLength: 'short' | 'medium' | 'long';
  formality: 'casual' | 'professional' | 'formal';
  interests?: string[];
}

export interface MiniCPMConfig {
  modelPath: string;
  device: 'cpu' | 'cuda' | 'mps' | 'auto';
  quantization?: 'int4' | 'int8' | 'fp16' | 'fp32';
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  languages?: string[];
  enableVision?: boolean;
  enableAudio?: boolean;
  enableMultimodal?: boolean;
}

export interface DeviceCapabilities {
  hasGPU: boolean;
  hasNPU: boolean;
  memoryGB: number;
  cpuCores: number;
  platform: 'android' | 'ios' | 'windows' | 'macos' | 'linux';
  architecture: 'arm64' | 'x64' | 'x86';
}

export interface ProcessingResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  processingTime: number;
  modelUsed: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface VoiceSynthesisOptions {
  voice?: string;
  speed?: number;
  pitch?: number;
  volume?: number;
  language?: string;
  emotion?: string;
}

export interface VideoAnalysis {
  frames: FrameAnalysis[];
  overall: {
    description: string;
    duration: number;
    fps: number;
    keyMoments: KeyMoment[];
  };
  objects: DetectedObject[];
  actions: ActionDescription[];
  text: ExtractedText[];
}

export interface FrameAnalysis {
  timestamp: number;
  objects: DetectedObject[];
  text: ExtractedText[];
  scene: SceneDescription;
  keyFrame: boolean;
}

export interface KeyMoment {
  timestamp: number;
  description: string;
  importance: number;
  type: 'action' | 'object' | 'text' | 'emotion';
}

// Agent-specific interfaces
export interface VisionAgentCapabilities {
  objectDetection: boolean;
  textRecognition: boolean;
  sceneUnderstanding: boolean;
  emotionRecognition: boolean;
  actionRecognition: boolean;
  highResolution: boolean;
  multiImage: boolean;
}

export interface AudioAgentCapabilities {
  speechRecognition: boolean;
  speechSynthesis: boolean;
  voiceCloning: boolean;
  emotionDetection: boolean;
  speakerIdentification: boolean;
  realTimeProcessing: boolean;
  noiseReduction: boolean;
}

export interface MultimodalAgentCapabilities {
  vision: VisionAgentCapabilities;
  audio: AudioAgentCapabilities;
  crossModalReasoning: boolean;
  realTimeStreaming: boolean;
  contextAwareness: boolean;
  languageSupport: string[];
}