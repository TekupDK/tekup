'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface ToolCall {
  id: string;
  name: string;
  arguments: any;
  result?: any;
  status: 'pending' | 'running' | 'success' | 'error';
  error?: string;
}

interface ToolCallDisplayProps {
  toolCall: ToolCall;
}

export function ToolCallDisplay({ toolCall }: ToolCallDisplayProps) {
  const getStatusIcon = () => {
    switch (toolCall.status) {
      case 'pending':
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusColor = () => {
    switch (toolCall.status) {
      case 'pending':
      case 'running':
        return 'bg-blue-500/10 text-blue-500';
      case 'success':
        return 'bg-green-500/10 text-green-500';
      case 'error':
        return 'bg-destructive/10 text-destructive';
    }
  };

  return (
    <Card className="p-3 bg-muted/50 border-l-4 border-l-primary">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <Wrench className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{toolCall.name}</span>
              <Badge variant="secondary" className={getStatusColor()}>
                <span className="flex items-center gap-1">
                  {getStatusIcon()}
                  {toolCall.status}
                </span>
              </Badge>
            </div>
          </div>

          {/* Arguments */}
          {toolCall.arguments && Object.keys(toolCall.arguments).length > 0 && (
            <div className="text-xs">
              <span className="text-muted-foreground">Arguments:</span>
              <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">
                {JSON.stringify(toolCall.arguments, null, 2)}
              </pre>
            </div>
          )}

          {/* Result */}
          {toolCall.result && (
            <div className="text-xs">
              <span className="text-muted-foreground">Result:</span>
              <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">
                {typeof toolCall.result === 'string'
                  ? toolCall.result
                  : JSON.stringify(toolCall.result, null, 2)}
              </pre>
            </div>
          )}

          {/* Error */}
          {toolCall.error && (
            <div className="text-xs text-destructive">
              <span className="font-medium">Error:</span> {toolCall.error}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
