import type { Conversation, Message } from '@/types';
import { create } from 'zustand';

export interface ChatState {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  currentConversationId: string | null;
  isSyncing: boolean;
  setCurrentConversationId: (conversationId: string | null) => void;
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (
    conversationId: string,
    updates: Partial<Conversation>
  ) => void;
  removeConversation: (conversationId: string) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  clear: () => void;
}

type StoreSetter<TState> = (
  partial:
    | TState
    | Partial<TState>
    | ((state: TState) => TState | Partial<TState>),
  replace?: boolean
) => void;

const chatStoreCreator = (set: StoreSetter<ChatState>) => ({
  conversations: [] as Conversation[],
  messages: {} as Record<string, Message[]>,
  currentConversationId: null as string | null,
  isSyncing: false,
  setCurrentConversationId(conversationId: string | null) {
    set({ currentConversationId: conversationId });
  },
  setConversations(conversations: Conversation[]) {
    set({ conversations });
  },
  addConversation(conversation: Conversation) {
    set((state) => ({
      conversations: [
        conversation,
        ...state.conversations.filter((item) => item.id !== conversation.id),
      ],
    }));
  },
  updateConversation(conversationId: string, updates: Partial<Conversation>) {
    set((state) => ({
      conversations: state.conversations.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, ...updates }
          : conversation
      ),
    }));
  },
  removeConversation(conversationId: string) {
    set((state) => {
      const { [conversationId]: _removed, ...rest } = state.messages;
      return {
        conversations: state.conversations.filter(
          (conversation) => conversation.id !== conversationId
        ),
        messages: rest,
        currentConversationId:
          state.currentConversationId === conversationId
            ? null
            : state.currentConversationId,
      };
    });
  },
  setMessages(conversationId: string, messages: Message[]) {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: messages,
      },
    }));
  },
  addMessage(conversationId: string, message: Message) {
    set((state) => {
      const existing = state.messages[conversationId] ?? [];
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...existing, message],
        },
        conversations: state.conversations.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                lastMessage: message.content,
                updatedAt: new Date().toISOString(),
              }
            : conversation
        ),
      };
    });
  },
  clear() {
    set({ conversations: [], messages: {}, currentConversationId: null });
  },
});

export const useChatStore = create<ChatState>()(chatStoreCreator);
