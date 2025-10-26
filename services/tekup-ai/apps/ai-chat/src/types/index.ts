// Message Types
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sources?: Source[];
  isStreaming?: boolean;
}

export interface Source {
  repository: string;
  path: string;
  content: string;
  similarity: number;
  url?: string;
}

// Chat Session Types
export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  archived?: boolean;
}

// API Request/Response Types
export interface ChatRequest {
  message: string;
  sessionId?: string;
  useVault?: boolean;
  temperature?: number;
}

export interface ChatResponse {
  message: Message;
  sessionId: string;
  sources?: Source[];
}

export interface StreamChunk {
  type: 'content' | 'sources' | 'done' | 'error';
  content?: string;
  sources?: Source[];
  error?: string;
}

// TekupVault Types
export interface VaultSearchRequest {
  query: string;
  limit?: number;
  threshold?: number;
  repository?: string;
}

export interface VaultSearchResponse {
  success: boolean;
  results: {
    document: {
      repository: string;
      path: string;
      content: string;
    };
    similarity: number;
  }[];
}

// User Settings Types
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'da';
  voiceEnabled: boolean;
  autoArchive: boolean;
  temperature: number;
}
