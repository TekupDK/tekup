export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  metadata?: {
    emailContext?: string;
    mode?: ChatMode;
    tokens?: number;
    model?: string;
  };
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  mode: ChatMode;
  context?: EmailContext;
}

export type ChatMode = 'standard' | 'smarter';

export interface ChatbotConfig {
  defaultMode: ChatMode;
  standardModel: string;
  smarterModel: string;
  maxTokens: number;
  temperature: number;
  systemPrompts: {
    standard: string;
    smarter: string;
  };
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  mode: ChatMode;
  emailContext?: {
    emailId?: string;
    threadId?: string;
    selectedEmails?: string[];
  };
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  messageId: string;
  mode: ChatMode;
  metadata: {
    tokens: number;
    model: string;
    processingTime: number;
  };
  suggestions?: string[];
  actions?: ChatAction[];
}

export interface ChatAction {
  id: string;
  type: 'compose' | 'reply' | 'schedule' | 'archive' | 'delete' | 'forward' | 'search';
  label: string;
  description?: string;
  payload?: any;
}

export interface EmailContext {
  selectedEmails: string[];
  currentFolder: string;
  searchQuery?: string;
  threadContext?: {
    threadId: string;
    participants: string[];
    subject: string;
  };
}

export interface ChatbotCapabilities {
  emailComposition: boolean;
  emailSummarization: boolean;
  emailSearch: boolean;
  workflowAutomation: boolean;
  scheduling: boolean;
  translation: boolean;
  codeGeneration: boolean;
  dataAnalysis: boolean;
}

export interface ChatbotState {
  isActive: boolean;
  currentMode: ChatMode;
  activeConversation?: string;
  isTyping: boolean;
  lastActivity: Date;
}