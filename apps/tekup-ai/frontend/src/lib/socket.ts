import type { Message } from '@/types';
import { io, type Socket } from 'socket.io-client';
import { isBrowser } from './utils';

interface ServerToClientEvents {
  message: (payload: Message) => void;
  typing: (payload: { conversationId: string; isTyping: boolean }) => void;
  status: (payload: { connected: boolean }) => void;
}

interface ClientToServerEvents {
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  typing: (payload: { conversationId: string; isTyping: boolean }) => void;
}

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

function getSocketUrl() {
  const env = (
    globalThis as unknown as {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process?.env;
  return env?.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:3001';
}

export function getSocket() {
  if (!isBrowser()) {
    return null;
  }

  if (!socket) {
    socket = io(getSocketUrl(), {
      autoConnect: false,
      transports: ['websocket'],
      withCredentials: true,
    });
  }

  return socket;
}

export function connectSocket() {
  const instance = getSocket();
  if (instance && !instance.connected) {
    instance.connect();
  }
  return instance;
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
  }
}

export function subscribeToMessages(handler: ServerToClientEvents['message']) {
  const instance = connectSocket();
  instance?.on('message', handler);
  return () => {
    instance?.off('message', handler);
  };
}

export function subscribeToTyping(handler: ServerToClientEvents['typing']) {
  const instance = connectSocket();
  instance?.on('typing', handler);
  return () => {
    instance?.off('typing', handler);
  };
}
