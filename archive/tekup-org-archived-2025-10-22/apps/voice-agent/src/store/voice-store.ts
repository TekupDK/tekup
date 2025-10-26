import { create } from 'zustand';
import { ConversationTurn, VoiceSession, TenantContext, createLogger } from '@tekup/shared';

const logger = createLogger('voice-store');

interface VoiceState {
  // Voice Session
  isListening: boolean;
  isProcessing: boolean;
  currentSession: VoiceSession | null;

  // Conversation
  conversation: ConversationTurn[];

  // Tenant
  tenantContext: TenantContext | null;

  // Audio
  audioLevel: number;
  isAudioPlaying: boolean;

  // Actions
  startListening: () => void;
  stopListening: () => void;
  addConversationTurn: (turn: ConversationTurn) => void;
  clearConversation: () => void;
  setTenantContext: (context: TenantContext) => void;
  setAudioLevel: (level: number) => void;
  setAudioPlaying: (playing: boolean) => void;
  setProcessing: (processing: boolean) => void;
}

export const useVoiceStore = create<VoiceState>((set, get) => ({

  // Initial State
  isListening: false,
  isProcessing: false,
  currentSession: null,
  conversation: [],
  tenantContext: null,
  audioLevel: 0,
  isAudioPlaying: false,

  // Actions
  startListening: () => {
    set({ isListening: true });
    logger.info('🎤 Voice listening started');
  },

  stopListening: () => {
    set({ isListening: false });
    logger.info('🔇 Voice listening stopped');
  },

  addConversationTurn: (turn: ConversationTurn) => {
    set((state) => ({
      conversation: [...state.conversation, turn]
    }));
  },

  clearConversation: () => {
    set({ conversation: [] });
  },

  setTenantContext: (context: TenantContext) => {
    set({ tenantContext: context });
  },

  setAudioLevel: (level: number) => {
    set({ audioLevel: level });
  },

  setAudioPlaying: (playing: boolean) => {
    set({ isAudioPlaying: playing });
  },

  setProcessing: (processing: boolean) => {
    set({ isProcessing: processing });
  }
}));
