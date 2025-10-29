import type { Conversation, Memory, Message, User } from '@/types';

type EnvShape = {
  process?: {
    env?: Record<string, string | undefined>;
  };
};

const env = (globalThis as unknown as EnvShape).process?.env;
const BASE_URL = env?.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  status?: number;
  data?: unknown;

  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...init.headers,
      },
      ...init,
    });
  } catch (error) {
    throw new ApiError('Network request failed', undefined, { error });
  }

  let body: unknown = null;
  if (response.status !== 204) {
    try {
      body = await response.json();
    } catch (error) {
      if (response.ok) {
        return {} as T;
      }
      throw new ApiError('Failed to parse API response', response.status, {
        error,
      });
    }
  }

  if (!response.ok) {
    const message =
      typeof body === 'object' && body !== null && 'message' in body
        ? String(
            (body as { message?: unknown }).message ?? 'API request failed'
          )
        : `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, body);
  }

  return body as T;
}

function withBody(body?: unknown): RequestInit {
  if (body === undefined || body === null) {
    return {};
  }

  return {
    body: typeof body === 'string' ? body : JSON.stringify(body),
  };
}

export const api = {
  auth: {
    login(email: string, password: string) {
      return request<User>('/auth/login', {
        method: 'POST',
        ...withBody({ email, password }),
      });
    },
    register(email: string, password: string, name: string) {
      return request<User>('/auth/register', {
        method: 'POST',
        ...withBody({ email, password, name }),
      });
    },
    me() {
      return request<User>('/auth/me');
    },
    logout() {
      return request<void>('/auth/logout', {
        method: 'POST',
      });
    },
  },
  conversations: {
    list() {
      return request<Conversation[]>('/conversations');
    },
    create(payload: { title: string }) {
      return request<Conversation>('/conversations', {
        method: 'POST',
        ...withBody(payload),
      });
    },
    update(id: string, payload: Partial<Conversation>) {
      return request<Conversation>(`/conversations/${id}`, {
        method: 'PATCH',
        ...withBody(payload),
      });
    },
    remove(id: string) {
      return request<void>(`/conversations/${id}`, {
        method: 'DELETE',
      });
    },
  },
  chat: {
    listMessages(conversationId: string) {
      return request<Message[]>(`/conversations/${conversationId}/messages`);
    },
    sendMessage(conversationId: string, payload: { content: string }) {
      return request<Message>(`/conversations/${conversationId}/messages`, {
        method: 'POST',
        ...withBody(payload),
      });
    },
  },
  memories: {
    list() {
      return request<Memory[]>('/memories');
    },
    create(payload: {
      content: string;
      type: Memory['type'];
      metadata?: Memory['metadata'];
    }) {
      return request<Memory>('/memories', {
        method: 'POST',
        ...withBody(payload),
      });
    },
    update(id: string, payload: Partial<Memory>) {
      return request<Memory>(`/memories/${id}`, {
        method: 'PATCH',
        ...withBody(payload),
      });
    },
    remove(id: string) {
      return request<void>(`/memories/${id}`, {
        method: 'DELETE',
      });
    },
  },
};

export type ApiClient = typeof api;
