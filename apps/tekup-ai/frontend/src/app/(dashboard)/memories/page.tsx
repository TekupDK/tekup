'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MemoryList } from '@/components/memory/MemoryList';
import { MemoryEditor } from '@/components/memory/MemoryEditor';
import { useMemories } from '@/hooks/useMemories';
import { Search, Plus, Brain } from 'lucide-react';

export default function MemoriesPage() {
  const { memories, isLoading } = useMemories();
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const filteredMemories = memories.filter(
    (memory) =>
      memory.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.metadata?.tags?.some((tag: string) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Brain className="w-6 h-6 text-primary" />
                Memory Management
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your AI's persistent memory and context
              </p>
            </div>
            <Button onClick={() => setIsEditorOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Memory
            </Button>
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search memories by content or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
                <p className="text-muted-foreground">Loading memories...</p>
              </div>
            </div>
          ) : filteredMemories.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center max-w-md">
                <Brain className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery ? 'No memories found' : 'No memories yet'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery
                    ? 'Try adjusting your search terms'
                    : 'Create your first memory to help your AI assistant remember important context'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setIsEditorOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Memory
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <MemoryList memories={filteredMemories} />
          )}
        </div>
      </div>

      {/* Memory Editor Modal */}
      <MemoryEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
      />
    </div>
  );
}
