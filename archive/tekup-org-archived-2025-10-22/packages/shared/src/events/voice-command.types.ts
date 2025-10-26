export interface VoiceCommandRequest {
  command: string;
  parameters?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface VoiceCommandResponse {
  success: boolean;
  message?: string;
  data?: unknown;
  error?: unknown;
}