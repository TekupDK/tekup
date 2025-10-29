export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  toolCalls?: Array<Record<string, unknown>>;
  metadata?: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
  metadata?: Record<string, unknown>;
}

export type MemoryType = 'user' | 'system' | 'context';

export interface MemoryMetadata {
  tags?: string[];
  source?: string;
  importance?: number;
}

export interface Memory {
  id: string;
  content: string;
  type: MemoryType;
  metadata?: MemoryMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface SettingsState {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  enableMemory: boolean;
  enableAutoMemory: boolean;
  memoryRetention: number;
  maxMemorySize: number;
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
  showTimestamps: boolean;
  enableSoundEffects: boolean;
  enableNotifications: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

export interface ApiListResponse<T> {
  data: T[];
  total?: number;
  page?: number;
  pageSize?: number;
}

export interface ApiResponse<T> {
  data: T;
}
