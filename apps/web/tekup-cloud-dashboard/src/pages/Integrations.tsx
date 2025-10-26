import React from 'react';

export function Integrations() {
  const integrations = [
    {
      name: 'Billy.dk',
      description: 'Accounting and invoicing integration',
      status: 'connected',
      icon: '💰',
      color: 'green'
    },
    {
      name: 'TekupVault',
      description: 'Document management system',
      status: 'connected',
      icon: '📁',
      color: 'blue'
    },
    {
      name: 'Google Calendar',
      description: 'Calendar and scheduling integration',
      status: 'connected',
      icon: '📅',
      color: 'green'
    },
    {
      name: 'Gmail',
      description: 'Email integration and automation',
      status: 'pending',
      icon: '📧',
      color: 'yellow'
    },
    {
      name: 'Slack',
      description: 'Team communication integration',
      status: 'disconnected',
      icon: '💬',
      color: 'gray'
    },
    {
      name: 'Zapier',
      description: 'Workflow automation platform',
      status: 'disconnected',
      icon: '⚡',
      color: 'gray'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'disconnected':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Integrations</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Connect and manage your third-party integrations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">{integration.icon}</div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {integration.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {integration.description}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(integration.status)}`}>
                  {integration.status}
                </span>
              </div>
              
              <div className="mt-4 flex space-x-2">
                {integration.status === 'connected' ? (
                  <>
                    <button className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600">
                      Configure
                    </button>
                    <button className="flex-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-3 py-2 rounded text-sm font-medium hover:bg-red-200 dark:hover:bg-red-800">
                      Disconnect
                    </button>
                  </>
                ) : integration.status === 'pending' ? (
                  <button className="w-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-3 py-2 rounded text-sm font-medium hover:bg-yellow-200 dark:hover:bg-yellow-800">
                    Complete Setup
                  </button>
                ) : (
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium">
                    Connect
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add New Integration */}
        <div className="mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Add New Integration
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Can't find the integration you need? Request a new integration or explore our API documentation.
            </p>
            <div className="flex space-x-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium">
                Request Integration
              </button>
              <button className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600">
                View API Docs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}