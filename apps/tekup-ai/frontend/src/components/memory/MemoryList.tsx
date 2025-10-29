'use client';

import { MemoryItem } from './MemoryItem';

interface Memory {
  id: string;
  content: string;
  type: 'user' | 'system' | 'context';
  metadata?: {
    tags?: string[];
    source?: string;
    importance?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface MemoryListProps {
  memories: Memory[];
}

export function MemoryList({ memories }: MemoryListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {memories.map((memory) => (
        <MemoryItem key={memory.id} memory={memory} />
      ))}
    </div>
  );
}
