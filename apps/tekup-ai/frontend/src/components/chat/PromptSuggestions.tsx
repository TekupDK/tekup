'use client';

import { Card } from '@/components/ui/card';
import { Lightbulb, Code, PenTool, Database, Sparkles } from 'lucide-react';

interface PromptSuggestionsProps {
  onSelectPrompt: (prompt: string) => void;
}

export function PromptSuggestions({ onSelectPrompt }: PromptSuggestionsProps) {
  const suggestions = [
    {
      icon: Lightbulb,
      title: 'Brainstorm Ideas',
      prompt: 'Help me brainstorm creative ideas for...',
      color: 'text-yellow-500',
    },
    {
      icon: Code,
      title: 'Code Review',
      prompt: 'Review this code and suggest improvements...',
      color: 'text-blue-500',
    },
    {
      icon: PenTool,
      title: 'Write Content',
      prompt: 'Help me write engaging content about...',
      color: 'text-purple-500',
    },
    {
      icon: Database,
      title: 'Analyze Data',
      prompt: 'Analyze this data and provide insights...',
      color: 'text-green-500',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="w-4 h-4" />
        <span>Suggested prompts to get started:</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {suggestions.map((suggestion, index) => (
          <Card
            key={index}
            className="p-4 cursor-pointer hover:bg-accent transition-colors"
            onClick={() => onSelectPrompt(suggestion.prompt)}
          >
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 ${suggestion.color}`}>
                <suggestion.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium mb-1">{suggestion.title}</h3>
                <p className="text-sm text-muted-foreground">{suggestion.prompt}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
