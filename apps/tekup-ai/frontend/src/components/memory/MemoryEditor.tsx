'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useMemories } from '@/hooks/useMemories';
import { useToast } from '@/hooks/useToast';
import { Loader2, X, Star } from 'lucide-react';

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

interface MemoryEditorProps {
  isOpen: boolean;
  onClose: () => void;
  memory?: Memory;
}

export function MemoryEditor({ isOpen, onClose, memory }: MemoryEditorProps) {
  const { toast } = useToast();
  const { createMemory, updateMemory } = useMemories();
  const [isLoading, setIsLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const [formData, setFormData] = useState({
    content: '',
    type: 'user' as 'user' | 'system' | 'context',
    tags: [] as string[],
    source: '',
    importance: 3,
  });

  useEffect(() => {
    if (memory) {
      setFormData({
        content: memory.content,
        type: memory.type,
        tags: memory.metadata?.tags || [],
        source: memory.metadata?.source || '',
        importance: memory.metadata?.importance || 3,
      });
    } else {
      setFormData({
        content: '',
        type: 'user',
        tags: [],
        source: '',
        importance: 3,
      });
    }
  }, [memory, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const memoryData = {
        content: formData.content,
        type: formData.type,
        metadata: {
          tags: formData.tags,
          source: formData.source || undefined,
          importance: formData.importance,
        },
      };

      if (memory) {
        await updateMemory(memory.id, memoryData);
        toast({
          title: 'Memory updated',
          description: 'The memory has been successfully updated',
        });
      } else {
        await createMemory(memoryData);
        toast({
          title: 'Memory created',
          description: 'The memory has been successfully created',
        });
      }
      onClose();
    } catch (error) {
      toast({
        title: 'Operation failed',
        description: 'Failed to save memory. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {memory ? 'Edit Memory' : 'Create New Memory'}
          </DialogTitle>
          <DialogDescription>
            {memory
              ? 'Update the memory details below'
              : 'Add a new memory to your AI assistant\'s context'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              placeholder="Enter the memory content..."
              value={formData.content}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, content: e.target.value }))
              }
              required
              rows={6}
              className="resize-none"
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  type: e.target.value as any,
                }))
              }
              className="w-full px-3 py-2 border rounded-md bg-background"
            >
              <option value="user">User</option>
              <option value="system">System</option>
              <option value="context">Context</option>
            </select>
            <p className="text-xs text-muted-foreground">
              User: Personal preferences and information<br />
              System: AI behavior and instructions<br />
              Context: Background information and facts
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
              />
              <Button type="button" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Source */}
          <div className="space-y-2">
            <Label htmlFor="source">Source (Optional)</Label>
            <Input
              id="source"
              placeholder="Where did this information come from?"
              value={formData.source}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, source: e.target.value }))
              }
            />
          </div>

          {/* Importance */}
          <div className="space-y-2">
            <Label>Importance</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, importance: level }))
                  }
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      level <= formData.importance
                        ? 'fill-yellow-500 text-yellow-500'
                        : 'text-muted-foreground/30 hover:text-yellow-500/50'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {formData.importance}/5
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : memory ? (
                'Update Memory'
              ) : (
                'Create Memory'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
