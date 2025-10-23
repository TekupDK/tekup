import React, { useState, useEffect } from 'react';
import { 
  Plug, 
  Plus, 
  Settings, 
  Play, 
  Pause, 
  RotateCcw, 
  Trash2, 
  Search,
  Grid,
  List,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity
} from 'lucide-react';
import { MCPPlugin, MCPTool } from '../types/plugin';
import { PluginManagerService } from '../services/PluginManager';

interface PluginManagerProps {
  onToolSelect?: (tool: MCPTool) => void;
  onPluginToggle?: (plugin: MCPPlugin) => void;
}

const PluginManager: React.FC<PluginManagerProps> = ({ onToolSelect, onPluginToggle }) => {
  // Suppress unused parameter warnings
  const _onToolSelect = onToolSelect;
  const _onPluginToggle = onPluginToggle;
  
  // Use variables to avoid unused warnings
  console.log('PluginManager props:', { _onToolSelect, _onPluginToggle });
  const [pluginManager] = useState(() => new PluginManagerService());
  const [plugins, setPlugins] = useState<MCPPlugin[]>([]);
  const [discoveredPlugins, setDiscoveredPlugins] = useState<MCPPlugin[]>([]);
  const [selectedPlugin, setSelectedPlugin] = useState<MCPPlugin | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isDiscovering, setIsDiscovering] = useState(false);

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = () => {
    const allPlugins = pluginManager.getAllPlugins();
    setPlugins(allPlugins);
  };

  const handleDiscoverPlugins = async () => {
    setIsDiscovering(true);
    try {
      const discovered = await pluginManager.discoverPlugins();
      setDiscoveredPlugins(discovered);
    } catch (error) {
      console.error('Plugin discovery failed:', error);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleInstallPlugin = async (plugin: MCPPlugin) => {
    try {
      await pluginManager.loadPlugin(plugin);
      loadPlugins();
    } catch (error) {
      console.error('Plugin installation failed:', error);
    }
  };

  const handleUninstallPlugin = async (pluginId: string) => {
    try {
      await pluginManager.unloadPlugin(pluginId);
      loadPlugins();
    } catch (error) {
      console.error('Plugin uninstallation failed:', error);
    }
  };

  const handleTogglePlugin = async (plugin: MCPPlugin) => {
    try {
      if (plugin.status === 'active') {
        await pluginManager.unloadPlugin(plugin.id);
      } else {
        await pluginManager.loadPlugin(plugin);
      }
      loadPlugins();
      _onPluginToggle?.(plugin);
    } catch (error) {
      console.error('Plugin toggle failed:', error);
    }
  };

  const handleRestartPlugin = async (plugin: MCPPlugin) => {
    try {
      await pluginManager.restartPlugin(plugin.id);
      loadPlugins();
    } catch (error) {
      console.error('Plugin restart failed:', error);
    }
  };

  const filteredPlugins = plugins.filter(plugin => {
    const matchesSearch = plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plugin.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || 
                           plugin.metadata.tags.includes(filterCategory);
    return matchesSearch && matchesCategory;
  });

  const getStatusIcon = (plugin: MCPPlugin) => {
    switch (plugin.status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'loading':
        return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (plugin: MCPPlugin) => {
    switch (plugin.status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'loading':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Plug className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">MCP Plugins</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDiscoverPlugins}
              disabled={isDiscovering}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isDiscovering ? 'Discovering...' : 'Discover'}</span>
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search plugins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="calendar">Calendar</option>
            <option value="invoice">Invoice</option>
            <option value="communication">Communication</option>
            <option value="analytics">Analytics</option>
          </select>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Plugin List */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredPlugins.length === 0 ? (
          <div className="text-center py-12">
            <Plug className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No plugins found</h3>
            <p className="text-gray-500 mb-4">Discover and install MCP plugins to extend functionality</p>
            <button
              onClick={handleDiscoverPlugins}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Discover Plugins
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredPlugins.map((plugin) => (
              <div
                key={plugin.id}
                className={`bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow ${
                  selectedPlugin?.id === plugin.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedPlugin(plugin)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{plugin.icon}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{plugin.name}</h3>
                      <p className="text-sm text-gray-500">{plugin.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(plugin)}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(plugin)}`}>
                      {plugin.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Version</span>
                    <span className="font-medium">{plugin.version}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Tools</span>
                    <span className="font-medium">{plugin.tools.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Health</span>
                    <div className="flex items-center space-x-1">
                      <Activity className="w-3 h-3 text-green-500" />
                      <span className="font-medium text-green-600">Good</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePlugin(plugin);
                      }}
                      className={`p-2 rounded-lg ${
                        plugin.status === 'active'
                          ? 'text-red-600 hover:bg-red-100'
                          : 'text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {plugin.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestartPlugin(plugin);
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUninstallPlugin(plugin.id);
                    }}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Discovered Plugins */}
      {discoveredPlugins.length > 0 && (
        <div className="border-t border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Discovered Plugins</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {discoveredPlugins.map((plugin) => (
              <div key={plugin.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="text-xl">{plugin.icon}</div>
                  <div>
                    <h4 className="font-medium text-gray-900">{plugin.name}</h4>
                    <p className="text-sm text-gray-500">{plugin.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleInstallPlugin(plugin)}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Install Plugin
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PluginManager;
