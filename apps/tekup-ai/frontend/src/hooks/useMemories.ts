import { useToast } from '@/hooks/useToast';
import { api, ApiError } from '@/lib/api';
import { generateId } from '@/lib/utils';
import type { Memory } from '@/types';
import { useCallback, useEffect, useMemo, useState } from 'react';

export interface UiMemory extends Omit<Memory, 'createdAt' | 'updatedAt'> {
  createdAt: Date;
  updatedAt: Date;
}

interface UseMemoriesResult {
  memories: UiMemory[];
  isLoading: boolean;
  error: string | null;
  createMemory: (
    payload: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<UiMemory>;
  updateMemory: (
    memoryId: string,
    payload: Partial<Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>>
  ) => Promise<UiMemory>;
  deleteMemory: (memoryId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

const toUiMemory = (memory: Memory): UiMemory => ({
  ...memory,
  createdAt: new Date(memory.createdAt),
  updatedAt: new Date(memory.updatedAt),
});

const buildFallbackMemory = (
  payload: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>
): UiMemory => {
  const now = new Date();
  return {
    ...payload,
    id: generateId('memory'),
    createdAt: now,
    updatedAt: now,
  };
};

export function useMemories(): UseMemoriesResult {
  const { toast } = useToast();
  const [memories, setMemories] = useState<UiMemory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMemories = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await api.memories.list();
      setMemories(data.map(toUiMemory));
    } catch (err) {
      console.warn('Failed to fetch memories, using fallback data:', err);
      setError(
        err instanceof ApiError ? err.message : 'Unable to load memories'
      );
      if (memories.length === 0) {
        setMemories([
          buildFallbackMemory({
            content:
              'Add important information here so TekupAI can remember it for you.',
            type: 'system',
            metadata: {
              tags: ['getting-started'],
              source: 'system',
              importance: 3,
            },
          }),
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [memories.length]);

  useEffect(() => {
    if (memories.length === 0) {
      void fetchMemories();
    } else {
      setIsLoading(false);
    }
  }, [fetchMemories, memories.length]);

  const createMemory = useCallback(
    async (payload: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>) => {
      setIsLoading(true);
      try {
        const data = await api.memories.create(payload);
        const uiMemory = toUiMemory(data);
        setMemories((prev: UiMemory[]) => [uiMemory, ...prev]);
        return uiMemory;
      } catch (err) {
        console.warn('Falling back to local memory creation:', err);
        const uiMemory = buildFallbackMemory(payload);
        setMemories((prev: UiMemory[]) => [uiMemory, ...prev]);
        toast({
          title: 'Memory stored locally',
          description: 'Will sync once the server connection is available.',
        });
        return uiMemory;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const updateMemory = useCallback(
    async (
      memoryId: string,
      payload: Partial<Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>>
    ) => {
      try {
        const data = await api.memories.update(memoryId, payload);
        const uiMemory = toUiMemory(data);
        setMemories((prev: UiMemory[]) =>
          prev.map((memory: UiMemory) =>
            memory.id === memoryId ? uiMemory : memory
          )
        );
        return uiMemory;
      } catch (err) {
        console.warn(
          'Failed to update memory remotely, applying local update:',
          err
        );
        let fallbackMemory: UiMemory | null = null;
        setMemories((prev: UiMemory[]) =>
          prev.map((memory: UiMemory) => {
            if (memory.id === memoryId) {
              const updatedMemory: UiMemory = {
                ...memory,
                ...payload,
                updatedAt: new Date(),
              };
              fallbackMemory = updatedMemory;
              return updatedMemory;
            }
            return memory;
          })
        );
        toast({
          title: 'Memory updated locally',
          description: 'Changes will sync once connectivity is restored.',
        });
        return (
          fallbackMemory ??
          buildFallbackMemory({
            content: payload.content ?? 'Updated memory',
            type: (payload.type ?? 'user') as Memory['type'],
            metadata: payload.metadata,
          })
        );
      }
    },
    [toast]
  );

  const deleteMemory = useCallback(
    async (memoryId: string) => {
      try {
        await api.memories.remove(memoryId);
        setMemories((prev: UiMemory[]) =>
          prev.filter((memory: UiMemory) => memory.id !== memoryId)
        );
      } catch (err) {
        console.warn(
          'Failed to delete memory remotely, removing locally:',
          err
        );
        setMemories((prev: UiMemory[]) =>
          prev.filter((memory: UiMemory) => memory.id !== memoryId)
        );
        toast({
          title: 'Memory deleted locally',
          description: 'Changes will sync when the server is reachable.',
        });
      }
    },
    [toast]
  );

  const sortedMemories = useMemo(
    () =>
      [...memories].sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
      ),
    [memories]
  );

  return {
    memories: sortedMemories,
    isLoading,
    error,
    createMemory,
    updateMemory,
    deleteMemory,
    refetch: fetchMemories,
  };
}
