import React, { useState, useEffect } from 'react';
import { MCPPlugin, MCPServer, MCPConfig } from '@tekup/shared';

interface MCPPluginManagerProps {
  className?: string;
}

export const MCPPluginManager: React.FC<MCPPluginManagerProps> = ({ className }) => {
  const [plugins, setPlugins] = useState<MCPPlugin[]>([]);
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [config, setConfig] = useState<MCPConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlugin, setSelectedPlugin] = useState<MCPPlugin | null>(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [installPath, setInstallPath] = useState('');

  useEffect(() => {
    loadData();
    
    // Listen for MCP events
    const unsubscribe = window.electronAPI.mcp.onEvent((event) => {
      logger.info('MCP Event:', event);
      // Refresh data on relevant events
      if (['plugin_installed', 'plugin_uninstalled', 'plugin_enabled', 'plugin_disabled'].includes(event.type)) {
        loadData();
      }
    });
    
    return unsubscribe;
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [pluginsData, serversData, configData] = await Promise.all([
        window.electronAPI.mcp.getPlugins(),
        window.electronAPI.mcp.getServers(),
        window.electronAPI.mcp.getConfig()
      ]);
      
      setPlugins(pluginsData);
      setServers(serversData);
      setConfig(configData);
    } catch (err) {
      logger.error('Failed to load MCP data:', err);
      setError('Failed to load MCP data');
    } finally {
      setLoading(false);
    }
  };

  const handleInstallPlugin = async () => {
    if (!installPath.trim()) return;
    
    try {
      setLoading(true);
      await window.electronAPI.mcp.installPlugin(installPath);
      setInstallPath('');
      setShowInstallDialog(false);
      await loadData();
    } catch (err) {
      logger.error('Failed to install plugin:', err);
      setError('Failed to install plugin');
    } finally {
      setLoading(false);
    }
  };

  const handleUninstallPlugin = async (pluginId: string) => {
    if (!confirm('Are you sure you want to uninstall this plugin?')) return;
    
    try {
      setLoading(true);
      await window.electronAPI.mcp.uninstallPlugin(pluginId);
      await loadData();
    } catch (err) {
      logger.error('Failed to uninstall plugin:', err);
      setError('Failed to uninstall plugin');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePlugin = async (pluginId: string, enabled: boolean) => {
    try {
      setLoading(true);
      if (enabled) {
        await window.electronAPI.mcp.disablePlugin(pluginId);
      } else {
        await window.electronAPI.mcp.enablePlugin(pluginId);
      }
      await loadData();
    } catch (err) {
      logger.error('Failed to toggle plugin:', err);
      setError('Failed to toggle plugin');
    } finally {
      setLoading(false);
    }
  };

  const handleStartServer = async (serverId: string) => {
    try {
      await window.electronAPI.mcp.startServer(serverId);
      await loadData();
    } catch (err) {
      logger.error('Failed to start server:', err);
      setError('Failed to start server');
    }
  };

  const handleStopServer = async (serverId: string) => {
    try {
      await window.electronAPI.mcp.stopServer(serverId);
      await loadData();
    } catch (err) {
      logger.error('Failed to stop server:', err);
      setError('Failed to stop server');
    }
  };

  if (loading && plugins.length === 0) {
    return (
      <div className={`flex items-center justify-center p-8 ${className || ''}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading MCP plugins...</span>
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
          onClick={loadData}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">MCP Plugin Manager</h2>
          <p className="text-gray-600">Manage Model Context Protocol plugins and servers</p>
        </div>
        <button
          onClick={() => setShowInstallDialog(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Install Plugin
        </button>
      </div>

      {/* Configuration Status */}
      {config && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Configuration</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Status:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                config.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {config.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Max Servers:</span>
              <span className="ml-2 font-medium">{config.maxConcurrentServers}</span>
            </div>
            <div>
              <span className="text-gray-600">Timeout:</span>
              <span className="ml-2 font-medium">{config.defaultTimeout}ms</span>
            </div>
            <div>
              <span className="text-gray-600">Sandbox:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                config.security.sandboxMode ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {config.security.sandboxMode ? 'On' : 'Off'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Plugins List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Installed Plugins ({plugins.length})</h3>
        
        {plugins.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p>No plugins installed</p>
            <p className="text-sm">Install your first MCP plugin to get started</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {plugins.map((plugin) => (
              <div key={plugin.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-medium text-gray-900">{plugin.name}</h4>
                      <span className="text-sm text-gray-500">v{plugin.version}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        plugin.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {plugin.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    
                    {plugin.description && (
                      <p className="text-gray-600 mt-1">{plugin.description}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      {plugin.author && <span>By {plugin.author}</span>}
                      <span>{plugin.servers.length} server{plugin.servers.length !== 1 ? 's' : ''}</span>
                      <span>Installed {new Date(plugin.installedAt).toLocaleDateString()}</span>
                    </div>
                    
                    {plugin.keywords && plugin.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {plugin.keywords.map((keyword) => (
                          <span key={keyword} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleTogglePlugin(plugin.id, plugin.enabled)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        plugin.enabled
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {plugin.enabled ? 'Disable' : 'Enable'}
                    </button>
                    
                    <button
                      onClick={() => setSelectedPlugin(selectedPlugin?.id === plugin.id ? null : plugin)}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200 transition-colors"
                    >
                      {selectedPlugin?.id === plugin.id ? 'Hide' : 'Details'}
                    </button>
                    
                    <button
                      onClick={() => handleUninstallPlugin(plugin.id)}
                      className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200 transition-colors"
                    >
                      Uninstall
                    </button>
                  </div>
                </div>
                
                {/* Plugin Details */}
                {selectedPlugin?.id === plugin.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h5 className="font-medium text-gray-900 mb-3">Servers ({plugin.servers.length})</h5>
                    <div className="space-y-2">
                      {plugin.servers.map((server) => {
                        const serverStatus = servers.find(s => s.id === server.id);
                        return (
                          <div key={server.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{server.name}</span>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  serverStatus?.status === 'connected' ? 'bg-green-100 text-green-800' :
                                  serverStatus?.status === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                                  serverStatus?.status === 'error' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {serverStatus?.status || 'disconnected'}
                                </span>
                              </div>
                              {server.description && (
                                <p className="text-sm text-gray-600 mt-1">{server.description}</p>
                              )}
                              <div className="text-xs text-gray-500 mt-1">
                                Transport: {server.transport.type}
                                {server.capabilities.tools && (
                                  <span className="ml-2">• {server.capabilities.tools.length} tools</span>
                                )}
                                {server.capabilities.resources && (
                                  <span className="ml-2">• {server.capabilities.resources.length} resources</span>
                                )}
                                {server.capabilities.prompts && (
                                  <span className="ml-2">• {server.capabilities.prompts.length} prompts</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {serverStatus?.status === 'connected' ? (
                                <button
                                  onClick={() => handleStopServer(server.id)}
                                  className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs hover:bg-red-200 transition-colors"
                                >
                                  Stop
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleStartServer(server.id)}
                                  className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs hover:bg-green-200 transition-colors"
                                >
                                  Start
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Install Plugin Dialog */}
      {showInstallDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Install MCP Plugin</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plugin Path or URL
                </label>
                <input
                  type="text"
                  value={installPath}
                  onChange={(e) => setInstallPath(e.target.value)}
                  placeholder="/path/to/plugin or https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="text-sm text-gray-600">
                <p>You can install plugins from:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Local directory path</li>
                  <li>Git repository URL</li>
                  <li>NPM package name</li>
                </ul>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowInstallDialog(false);
                  setInstallPath('');
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInstallPlugin}
                disabled={!installPath.trim() || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Installing...' : 'Install'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MCPPluginManager;
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-inbox-ai-src-renderer-src');
