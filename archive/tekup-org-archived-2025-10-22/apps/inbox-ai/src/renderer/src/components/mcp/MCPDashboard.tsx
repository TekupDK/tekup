import React, { useState } from 'react';
import MCPPluginManager from './MCPPluginManager';
import MCPToolExecutor from './MCPToolExecutor';

interface MCPDashboardProps {
  className?: string;
}

type TabType = 'plugins' | 'tools' | 'resources' | 'prompts';

export const MCPDashboard: React.FC<MCPDashboardProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState<TabType>('plugins');

  const tabs = [
    {
      id: 'plugins' as TabType,
      name: 'Plugin Manager',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      description: 'Manage MCP plugins and servers'
    },
    {
      id: 'tools' as TabType,
      name: 'Tool Executor',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      description: 'Execute tools from MCP servers'
    },
    {
      id: 'resources' as TabType,
      name: 'Resources',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      description: 'Browse and access MCP resources'
    },
    {
      id: 'prompts' as TabType,
      name: 'Prompts',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      description: 'Manage and use MCP prompt templates'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'plugins':
        return <MCPPluginManager />;
      case 'tools':
        return <MCPToolExecutor />;
      case 'resources':
        return <MCPResourceBrowser />;
      case 'prompts':
        return <MCPPromptManager />;
      default:
        return <MCPPluginManager />;
    }
  };

  return (
    <div className={`h-full flex flex-col ${className || ''}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Model Context Protocol</h1>
            <p className="text-gray-600 mt-1">Manage plugins, execute tools, and access resources</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>MCP Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className={`mr-2 transition-colors ${
                  isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                }`}>
                  {tab.icon}
                </span>
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

// Placeholder components for Resources and Prompts tabs
const MCPResourceBrowser: React.FC = () => {
  return (
    <div className="text-center py-12 text-gray-500">
      <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
      <h3 className="text-lg font-medium text-gray-900 mb-2">MCP Resource Browser</h3>
      <p className="text-gray-600 mb-4">Browse and access resources from connected MCP servers</p>
      <p className="text-sm text-gray-500">This feature will be implemented in a future update</p>
    </div>
  );
};

const MCPPromptManager: React.FC = () => {
  return (
    <div className="text-center py-12 text-gray-500">
      <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      <h3 className="text-lg font-medium text-gray-900 mb-2">MCP Prompt Manager</h3>
      <p className="text-gray-600 mb-4">Manage and use prompt templates from MCP servers</p>
      <p className="text-sm text-gray-500">This feature will be implemented in a future update</p>
    </div>
  );
};

export default MCPDashboard;