'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IntegrationStatus } from './IntegrationStatus';
import { McpServerConfig } from './McpServerConfig';
import { Settings, Trash2, RefreshCw, Wrench } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface McpServer {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error';
  tools: number;
  lastSync?: Date;
}

interface McpServerCardProps {
  server: McpServer;
}

export function McpServerCard({ server }: McpServerCardProps) {
  const { toast } = useToast();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Simulate refresh
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: 'Server refreshed',
        description: 'Successfully refreshed server connection',
      });
    } catch (error) {
      toast({
        title: 'Refresh failed',
        description: 'Failed to refresh server connection',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to remove ${server.name}?`)) {
      try {
        toast({
          title: 'Server removed',
          description: `${server.name} has been removed`,
        });
      } catch (error) {
        toast({
          title: 'Delete failed',
          description: 'Failed to remove server',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <>
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">{server.name}</h3>
                <IntegrationStatus status={server.status} />
              </div>
              <p className="text-sm text-muted-foreground">{server.description}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 py-3 border-y">
            <div className="flex items-center gap-2 text-sm">
              <Wrench className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{server.tools}</span>
              <span className="text-muted-foreground">tools</span>
            </div>
            {server.lastSync && (
              <div className="text-xs text-muted-foreground">
                Last synced: {new Date(server.lastSync).toLocaleString()}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfigOpen(true)}
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>
      </Card>

      <McpServerConfig
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        server={server}
      />
    </>
  );
}
