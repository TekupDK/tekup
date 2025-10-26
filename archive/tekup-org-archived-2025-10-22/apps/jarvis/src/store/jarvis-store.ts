import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    consciousnessLevel?: number;
    processingTime?: number;
    confidence?: number;
    audioUrl?: string;
    vision?: boolean;
    tools?: string[];
  };
}

export interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  language: 'da' | 'en';
}

export interface ConsciousnessState {
  level: number;
  insights: string[];
  activeAgents: string[];
  lastUpdate: Date;
}

export interface TekupIntegration {
  connectedServices: string[];
  lastSync: Date;
  activeLeads: number;
  conversionRate: number;
}

interface JarvisStore {
  // Chat State
  messages: ChatMessage[];
  isTyping: boolean;
  currentInput: string;
  
  // Voice State
  voice: VoiceState;
  
  // AI Consciousness
  consciousness: ConsciousnessState;
  
  // Tekup Integration
  tekup: TekupIntegration;
  
  // Connection Status
  apiStatus: 'connected' | 'disconnected' | 'error' | 'connecting';
  
  // Actions - Chat
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  addSystemMessage: (content: string) => void;
  setIsTyping: (typing: boolean) => void;
  setCurrentInput: (input: string) => void;
  clearMessages: () => void;
  
  // Actions - Voice
  setListening: (listening: boolean) => void;
  setProcessing: (processing: boolean) => void;
  setSpeaking: (speaking: boolean) => void;
  setAudioLevel: (level: number) => void;
  setLanguage: (language: 'da' | 'en') => void;
  
  // Actions - Consciousness
  setConsciousnessLevel: (level: number) => void;
  addInsight: (insight: string) => void;
  setActiveAgents: (agents: string[]) => void;
  
  // Actions - Tekup Integration
  updateTekupStats: (stats: Partial<TekupIntegration>) => void;
  
  // Actions - Connection
  setApiStatus: (status: 'connected' | 'disconnected' | 'error' | 'connecting') => void;
}

export const useJarvisStore = create<JarvisStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    messages: [
      {
        id: 'welcome',
        type: 'system',
        content: 'Velkommen til Jarvis! Din AI assistent integreret med hele Tekup-økosystemet. Du kan chatte med tekst eller tale - jeg forstår begge dele på dansk og engelsk.',
        timestamp: new Date(),
      }
    ],
    isTyping: false,
    currentInput: '',
    
    voice: {
      isListening: false,
      isProcessing: false,
      isSpeaking: false,
      audioLevel: 0,
      language: 'da',
    },
    
    consciousness: {
      level: 8.9,
      insights: [
        'Multi-modal processing active',
        'Danish language optimization enabled',
        'Tekup ecosystem integration running'
      ],
      activeAgents: ['vision', 'audio', 'reasoning', 'evolution', 'multimodal'],
      lastUpdate: new Date(),
    },
    
    tekup: {
      connectedServices: ['Flow API', 'CRM', 'Business Metrics', 'Lead Platform'],
      lastSync: new Date(),
      activeLeads: 12,
      conversionRate: 53,
    },
    
    apiStatus: 'connecting',
    
    // Chat Actions
    addMessage: (message) => set((state) => ({
      messages: [...state.messages, {
        ...message,
        id: crypto.randomUUID(),
        timestamp: new Date(),
      }]
    })),
    
    addSystemMessage: (content) => set((state) => ({
      messages: [...state.messages, {
        id: crypto.randomUUID(),
        type: 'system',
        content,
        timestamp: new Date(),
      }]
    })),
    
    setIsTyping: (typing) => set({ isTyping: typing }),
    setCurrentInput: (input) => set({ currentInput: input }),
    clearMessages: () => set({ 
      messages: [{
        id: 'welcome',
        type: 'system',
        content: 'Chat ryddet. Hvordan kan jeg hjælpe dig i dag?',
        timestamp: new Date(),
      }]
    }),
    
    // Voice Actions
    setListening: (listening) => set((state) => ({
      voice: { ...state.voice, isListening: listening }
    })),
    
    setProcessing: (processing) => set((state) => ({
      voice: { ...state.voice, isProcessing: processing }
    })),
    
    setSpeaking: (speaking) => set((state) => ({
      voice: { ...state.voice, isSpeaking: speaking }
    })),
    
    setAudioLevel: (level) => set((state) => ({
      voice: { ...state.voice, audioLevel: level }
    })),
    
    setLanguage: (language) => set((state) => ({
      voice: { ...state.voice, language }
    })),
    
    // Consciousness Actions
    setConsciousnessLevel: (level) => set((state) => ({
      consciousness: { 
        ...state.consciousness, 
        level,
        lastUpdate: new Date()
      }
    })),
    
    addInsight: (insight) => set((state) => ({
      consciousness: {
        ...state.consciousness,
        insights: [...state.consciousness.insights.slice(-9), insight], // Keep last 10
        lastUpdate: new Date()
      }
    })),
    
    setActiveAgents: (agents) => set((state) => ({
      consciousness: {
        ...state.consciousness,
        activeAgents: agents,
        lastUpdate: new Date()
      }
    })),
    
    // Tekup Actions
    updateTekupStats: (stats) => set((state) => ({
      tekup: { ...state.tekup, ...stats, lastSync: new Date() }
    })),
    
    // Connection Actions
    setApiStatus: (status) => set({ apiStatus: status }),
  }))
);