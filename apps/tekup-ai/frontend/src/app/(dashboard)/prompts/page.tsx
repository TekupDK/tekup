'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, MessageSquare, Copy, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface SavedPrompt {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: Date;
  usageCount: number;
}

export default function PromptsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - replace with real API call
  const [prompts] = useState<SavedPrompt[]>([
    {
      id: '1',
      title: 'Code Review',
      content: 'Review this code for best practices, potential bugs, and optimization opportunities:',
      category: 'Development',
      createdAt: new Date(),
      usageCount: 15,
    },
    {
      id: '2',
      title: 'Email Draft',
      content: 'Help me draft a professional email about:',
      category: 'Writing',
      createdAt: new Date(),
      usageCount: 8,
    },
    {
      id: '3',
      title: 'Brainstorm Ideas',
      content: 'Let\'s brainstorm creative ideas for:',
      category: 'Creativity',
      createdAt: new Date(),
      usageCount: 22,
    },
  ]);

  const filteredPrompts = prompts.filter(
    (prompt) =>
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyPrompt = (prompt: SavedPrompt) => {
    navigator.clipboard.writeText(prompt.content);
    toast({
      title: 'Prompt copied',
      description: 'The prompt has been copied to your clipboard',
    });
  };

  const handleUsePrompt = (prompt: SavedPrompt) => {
    // Navigate to chat with this prompt
    toast({
      title: 'Opening chat',
      description: 'Starting a new conversation with this prompt',
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-primary" />
                Saved Prompts
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Quick access to your frequently used prompts
              </p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Prompt
            </Button>
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search prompts by title, content, or category..."
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
          {filteredPrompts.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center max-w-md">
                <MessageSquare className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery ? 'No prompts found' : 'No saved prompts yet'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery
                    ? 'Try adjusting your search terms'
                    : 'Save your frequently used prompts for quick access'}
                </p>
                {!searchQuery && (
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Prompt
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPrompts.map((prompt) => (
                <Card key={prompt.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{prompt.title}</h3>
                        <Badge variant="secondary">{prompt.category}</Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleCopyPrompt(prompt)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {prompt.content}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-xs text-muted-foreground">
                        Used {prompt.usageCount} times
                      </span>
                      <Button size="sm" onClick={() => handleUsePrompt(prompt)}>
                        Use Prompt
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
