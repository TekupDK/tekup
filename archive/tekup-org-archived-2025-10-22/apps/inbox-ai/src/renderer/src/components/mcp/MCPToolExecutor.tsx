import React, { useState, useEffect } from 'react';
import { MCPServer, MCPToolCall, MCPToolResult } from '@tekup/shared';

interface MCPToolExecutorProps {
  className?: string;
}

interface ToolExecution {
  id: string;
  serverId: string;
  serverName: string;
  toolName: string;
  arguments: Record<string, any>;
  result?: MCPToolResult;
  status: 'pending' | 'running' | 'completed' | 'error';
  startTime: Date;
  endTime?: Date;
}

export const MCPToolExecutor: React.FC<MCPToolExecutorProps> = ({ className }) => {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [selectedServer, setSelectedServer] = useState<MCPServer | null>(null);
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [toolArguments, setToolArguments] = useState<Record<string, any>>({});
  const [executions, setExecutions] = useState<ToolExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      setLoading(true);
      setError(null);
      const serversData = await window.electronAPI.mcp.getServers();
      const connectedServers = serversData.filter(s => s.status === 'connected');
      setServers(connectedServers);
      
      if (connectedServers.length > 0 && !selectedServer) {
        setSelectedServer(connectedServers[0]);
      }
    } catch (err) {
      logger.error('Failed to load servers:', err);
      setError('Failed to load MCP servers');
    } finally {
      setLoading(false);
    }
  };

  const handleServerChange = (serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    setSelectedServer(server || null);
    setSelectedTool('');
    setToolArguments({});
  };

  const handleToolChange = (toolName: string) => {
    setSelectedTool(toolName);
    
    // Initialize arguments based on tool schema
    const tool = selectedServer?.capabilities.tools?.find(t => t.name === toolName);
    if (tool?.inputSchema?.properties) {
      const initialArgs: Record<string, any> = {};
      Object.entries(tool.inputSchema.properties).forEach(([key, schema]) => {
        if (typeof schema === 'object' && 'default' in schema) {
          initialArgs[key] = schema.default;
        } else if (typeof schema === 'object' && schema.type === 'string') {
          initialArgs[key] = '';
        } else if (typeof schema === 'object' && schema.type === 'number') {
          initialArgs[key] = 0;
        } else if (typeof schema === 'object' && schema.type === 'boolean') {
          initialArgs[key] = false;
        } else if (typeof schema === 'object' && schema.type === 'array') {
          initialArgs[key] = [];
        } else if (typeof schema === 'object' && schema.type === 'object') {
          initialArgs[key] = {};
        }
      });
      setToolArguments(initialArgs);
    } else {
      setToolArguments({});
    }
  };

  const handleArgumentChange = (key: string, value: any) => {
    setToolArguments(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const executeTool = async () => {
    if (!selectedServer || !selectedTool) return;
    
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const execution: ToolExecution = {
      id: executionId,
      serverId: selectedServer.id,
      serverName: selectedServer.name,
      toolName: selectedTool,
      arguments: { ...toolArguments },
      status: 'pending',
      startTime: new Date()
    };
    
    setExecutions(prev => [execution, ...prev]);
    setExecuting(true);
    
    try {
      // Update status to running
      setExecutions(prev => prev.map(e => 
        e.id === executionId ? { ...e, status: 'running' } : e
      ));
      
      const toolCall: MCPToolCall = {
        name: selectedTool,
        arguments: toolArguments
      };
      
      const result = await window.electronAPI.mcp.executeTool(selectedServer.id, toolCall);
      
      // Update with result
      setExecutions(prev => prev.map(e => 
        e.id === executionId ? {
          ...e,
          result,
          status: result.isError ? 'error' : 'completed',
          endTime: new Date()
        } : e
      ));
    } catch (err) {
      logger.error('Tool execution failed:', err);
      setExecutions(prev => prev.map(e => 
        e.id === executionId ? {
          ...e,
          result: {
            content: [{ type: 'text', text: `Execution failed: ${err}` }],
            isError: true
          },
          status: 'error',
          endTime: new Date()
        } : e
      ));
    } finally {
      setExecuting(false);
    }
  };

  const clearExecutions = () => {
    setExecutions([]);
  };

  const renderArgumentInput = (key: string, schema: any, value: any) => {
    const handleChange = (newValue: any) => handleArgumentChange(key, newValue);
    
    if (schema.type === 'string') {
      if (schema.enum) {
        return (
          <select
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select...</option>
            {schema.enum.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      }
      
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={schema.description || `Enter ${key}`}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      );
    }
    
    if (schema.type === 'number' || schema.type === 'integer') {
      return (
        <input
          type="number"
          value={value || 0}
          onChange={(e) => handleChange(Number(e.target.value))}
          placeholder={schema.description || `Enter ${key}`}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      );
    }
    
    if (schema.type === 'boolean') {
      return (
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => handleChange(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">{schema.description || key}</span>
        </label>
      );
    }
    
    if (schema.type === 'array' || schema.type === 'object') {
      return (
        <textarea
          value={JSON.stringify(value || (schema.type === 'array' ? [] : {}), null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              handleChange(parsed);
            } catch {
              // Invalid JSON, don't update
            }
          }}
          placeholder={`Enter ${schema.type === 'array' ? 'array' : 'object'} as JSON`}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
        />
      );
    }
    
    return (
      <input
        type="text"
        value={String(value || '')}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={schema.description || `Enter ${key}`}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    );
  };

  const renderToolResult = (result: MCPToolResult) => {
    return (
      <div className={`p-3 rounded-md ${result.isError ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
        {result.content.map((content, index) => {
          if (content.type === 'text') {
            return (
              <pre key={index} className={`text-sm whitespace-pre-wrap ${
                result.isError ? 'text-red-800' : 'text-green-800'
              }`}>
                {content.text}
              </pre>
            );
          }
          
          if (content.type === 'image') {
            return (
              <div key={index} className="mt-2">
                <img
                  src={content.data}
                  alt="Tool result"
                  className="max-w-full h-auto rounded border"
                />
              </div>
            );
          }
          
          return (
            <div key={index} className="text-sm text-gray-600">
              Unsupported content type: {content.type}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className || ''}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading MCP servers...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className || ''}`}>
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-red-700">{error}</span>
        </div>
        <button
          onClick={loadServers}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className || ''}`}>
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <p>No connected MCP servers</p>
        <p className="text-sm">Start some MCP servers to execute tools</p>
      </div>
    );
  }

  const selectedToolSchema = selectedServer?.capabilities.tools?.find(t => t.name === selectedTool);

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">MCP Tool Executor</h2>
          <p className="text-gray-600">Execute tools from connected MCP servers</p>
        </div>
        {executions.length > 0 && (
          <button
            onClick={clearExecutions}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear History
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tool Execution Form */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Execute Tool</h3>
            
            {/* Server Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Server</label>
              <select
                value={selectedServer?.id || ''}
                onChange={(e) => handleServerChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a server...</option>
                {servers.map((server) => (
                  <option key={server.id} value={server.id}>
                    {server.name} ({server.capabilities.tools?.length || 0} tools)
                  </option>
                ))}
              </select>
            </div>

            {/* Tool Selection */}
            {selectedServer && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Tool</label>
                <select
                  value={selectedTool}
                  onChange={(e) => handleToolChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a tool...</option>
                  {selectedServer.capabilities.tools?.map((tool) => (
                    <option key={tool.name} value={tool.name}>
                      {tool.name}
                    </option>
                  )) || []}
                </select>
                
                {selectedToolSchema && (
                  <p className="text-sm text-gray-600">{selectedToolSchema.description}</p>
                )}
              </div>
            )}

            {/* Tool Arguments */}
            {selectedTool && selectedToolSchema?.inputSchema?.properties && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Arguments</h4>
                {Object.entries(selectedToolSchema.inputSchema.properties).map(([key, schema]) => {
                  const isRequired = selectedToolSchema.inputSchema?.required?.includes(key);
                  return (
                    <div key={key} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {key}
                        {isRequired && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {renderArgumentInput(key, schema, toolArguments[key])}
                      {typeof schema === 'object' && schema.description && (
                        <p className="text-xs text-gray-500">{schema.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Execute Button */}
            <div className="pt-4">
              <button
                onClick={executeTool}
                disabled={!selectedServer || !selectedTool || executing}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {executing ? 'Executing...' : 'Execute Tool'}
              </button>
            </div>
          </div>
        </div>

        {/* Execution History */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Execution History</h3>
          
          {executions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
              <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">No executions yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {executions.map((execution) => (
                <div key={execution.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{execution.toolName}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          execution.status === 'completed' ? 'bg-green-100 text-green-800' :
                          execution.status === 'error' ? 'bg-red-100 text-red-800' :
                          execution.status === 'running' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {execution.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{execution.serverName}</p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {execution.startTime.toLocaleTimeString()}
                      {execution.endTime && (
                        <span className="ml-2">
                          ({Math.round((execution.endTime.getTime() - execution.startTime.getTime()) / 1000)}s)
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {Object.keys(execution.arguments).length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-700 mb-1">Arguments:</p>
                      <pre className="text-xs bg-gray-50 p-2 rounded border overflow-x-auto">
                        {JSON.stringify(execution.arguments, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {execution.result && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">Result:</p>
                      {renderToolResult(execution.result)}
                    </div>
                  )}
                  
                  {execution.status === 'running' && (
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Executing...
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MCPToolExecutor;
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-inbox-ai-src-renderer-src');
