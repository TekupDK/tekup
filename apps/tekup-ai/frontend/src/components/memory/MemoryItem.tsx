'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MemoryEditor } from './MemoryEditor';
import { useMemories } from '@/hooks/useMemories';
import { useToast } from '@/hooks/useToast';
import { Brain, Edit2, Trash2, User, Cpu, FileText, Star } from 'lucide-react';

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

interface MemoryItemProps {
  memory: Memory;
}

export function MemoryItem({ memory }: MemoryItemProps) {
  const { toast } = useToast();
  const { deleteMemory } = useMemories();
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const getTypeIcon = () => {
    switch (memory.type) {
      case 'user':
        return <User className="w-4 h-4" />;
      case 'system':
        return <Cpu className="w-4 h-4" />;
      case 'context':
        return <FileText className="w-4 h-4" />;
      default:
        return <Brain className="w-4 h-4" />;
    }
  };

  const getTypeColor = () => {
    switch (memory.type) {
      case 'user':
        return 'bg-blue-500/10 text-blue-500';
      case 'system':
        return 'bg-purple-500/10 text-purple-500';
      case 'context':
        return 'bg-green-500/10 text-green-500';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this memory?')) {
      try {
        await deleteMemory(memory.id);
        toast({
          title: 'Memory deleted',
          description: 'The memory has been permanently deleted',
        });
      } catch (error) {
        toast({
          title: 'Delete failed',
          description: 'Failed to delete memory. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const renderImportance = () => {
    const importance = memory.metadata?.importance || 0;
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${
              i < importance
                ? 'fill-yellow-500 text-yellow-500'
                : 'text-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <Card className="p-4 hover:shadow-lg transition-shadow">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <Badge variant="secondary" className={getTypeColor()}>
              <span className="flex items-center gap-1">
                {getTypeIcon()}
                {memory.type}
              </span>
            </Badge>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditorOpen(true)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <p className="text-sm text-foreground line-clamp-4">
            {memory.content}
          </p>

          {/* Tags */}
          {memory.metadata?.tags && memory.metadata.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {memory.metadata.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="text-xs text-muted-foreground">
              {new Date(memory.createdAt).toLocaleDateString()}
            </div>
            {memory.metadata?.importance && renderImportance()}
          </div>

          {/* Source */}
          {memory.metadata?.source && (
            <div className="text-xs text-muted-foreground">
              Source: {memory.metadata.source}
            </div>
          )}
        </div>
      </Card>

      <MemoryEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        memory={memory}
      />
    </>
  );
}
