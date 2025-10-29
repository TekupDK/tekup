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
import { useToast } from '@/hooks/useToast';
import { Loader2 } from 'lucide-react';

interface McpServer {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error';
  tools: number;
  lastSync?: Date;
}

interface McpServerConfigProps {
  isOpen: boolean;
  onClose: () => void;
  server?: McpServer;
}

export function McpServerConfig({ isOpen, onClose, server }: McpServerConfigProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    apiKey: '',
    config: '{}',
  });

  useEffect(() => {
    if (server) {
      setFormData({
        name: server.name,
        description: server.description,
        url: '',
        apiKey: '',
        config: '{}',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        url: '',
        apiKey: '',
        config: '{}',
      });
    }
  }, [server, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate JSON config
      try {
        JSON.parse(formData.config);
      } catch {
        throw new Error('Invalid JSON configuration');
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: server ? 'Server updated' : 'Server added',
        description: server
          ? 'MCP server configuration has been updated'
          : 'New MCP server has been added successfully',
      });
      onClose();
    } catch (error: any) {
      toast({
        title: 'Operation failed',
        description: error.message || 'Failed to save MCP server configuration',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {server ? 'Configure MCP Server' : 'Add MCP Server'}
          </DialogTitle>
          <DialogDescription>
            {server
              ? 'Update the MCP server configuration'
              : 'Connect a new Model Context Protocol server'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Server Name *</Label>
            <Input
              id="name"
              placeholder="e.g., GitHub MCP"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              placeholder="Brief description of this server's purpose"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              required
            />
          </div>

          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="url">Server URL *</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://api.example.com/mcp"
              value={formData.url}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, url: e.target.value }))
              }
              required
            />
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key (Optional)</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter API key if required"
              value={formData.apiKey}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, apiKey: e.target.value }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Leave empty if the server doesn't require authentication
            </p>
          </div>

          {/* Configuration */}
          <div className="space-y-2">
            <Label htmlFor="config">Configuration (JSON)</Label>
            <Textarea
              id="config"
              placeholder='{"key": "value"}'
              value={formData.config}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, config: e.target.value }))
              }
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Additional configuration in JSON format
            </p>
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
              ) : server ? (
                'Update Server'
              ) : (
                'Add Server'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
