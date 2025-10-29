'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { McpServerCard } from '@/components/integrations/McpServerCard';
import { McpServerConfig } from '@/components/integrations/McpServerConfig';
import { Search, Plus, Puzzle } from 'lucide-react';

interface McpServer {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error';
  tools: number;
  lastSync?: Date;
}

export default function IntegrationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Mock data - replace with real API call
  const [servers] = useState<McpServer[]>([
    {
      id: '1',
      name: 'GitHub MCP',
      description: 'Access GitHub repositories, issues, and pull requests',
      status: 'connected',
      tools: 12,
      lastSync: new Date(),
    },
    {
      id: '2',
      name: 'Slack MCP',
      description: 'Send messages and manage Slack channels',
      status: 'connected',
      tools: 8,
      lastSync: new Date(),
    },
    {
      id: '3',
      name: 'File System MCP',
      description: 'Read and write local files',
      status: 'disconnected',
      tools: 15,
    },
  ]);

  const filteredServers = servers.filter(
    (server) =>
      server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      server.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Puzzle className="w-6 h-6 text-primary" />
                MCP Integrations
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Connect external tools and services via Model Context Protocol
              </p>
            </div>
            <Button onClick={() => setIsConfigOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Integration
            </Button>
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search integrations..."
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
          {filteredServers.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center max-w-md">
                <Puzzle className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery ? 'No integrations found' : 'No integrations yet'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery
                    ? 'Try adjusting your search terms'
                    : 'Connect MCP servers to extend your AI assistant\'s capabilities'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setIsConfigOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Integration
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredServers.map((server) => (
                <McpServerCard key={server.id} server={server} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MCP Server Config Modal */}
      <McpServerConfig
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />
    </div>
  );
}
