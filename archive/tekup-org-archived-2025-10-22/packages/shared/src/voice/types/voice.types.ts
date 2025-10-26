export interface VoiceCommand {
  id: string;
  name: string;
  description: string;
  parameters?: Record<string, any>;
  tenant_required: boolean;
  tenant_isolation: boolean;
}

export interface VoiceResponse {
  success: boolean;
  data?: any;
  error?: string;
  tenant: string;
  timestamp: Date;
}

export interface ConversationTurn {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  audio?: string;
  timestamp: Date;
  tenant: string;
}

export interface VoiceSession {
  id: string;
  tenant: string;
  startTime: Date;
  endTime?: Date;
  turns: ConversationTurn[];
  isActive: boolean;
}

export interface AudioConfig {
  inputSampleRate: number;
  outputSampleRate: number;
  channels: number;
  format: string;
}

export interface VoiceSettings {
  voiceName: string;
  language: string;
  speed: number;
  pitch: number;
  volume: number;
}