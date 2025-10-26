'use client';

import { MarketplaceAgent } from './agent-marketplace';
import { useState } from 'react';

interface AgentCardProps {
  agent: MarketplaceAgent;
  featured?: boolean;
}

export const AgentCard = ({ agent, featured = false }: AgentCardProps) => {
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      // Simulate agent installation
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(`${agent.name} installed successfully!`);
    } catch (error) {
      alert('Installation failed. Please try again.');
    } finally {
      setIsInstalling(false);
    }
  };

  const formatPrice = () => {
    switch (agent.pricing.model) {
      case 'free':
        return 'Free';
      case 'freemium':
        return `Free / $${agent.pricing.price}/mo`;
      case 'subscription':
        return `$${agent.pricing.price}/mo`;
      case 'usage':
        return `$${agent.pricing.price} per use`;
      default:
        return 'Contact for pricing';
    }
  };

  const getCategoryIcon = () => {
    const icons = {
      productivity: '⚡',
      analytics: '📊',
      communication: '💬',
      automation: '🤖',
      'ai-ml': '🧠',
      integration: '🔗',
    };
    return icons[agent.category] || '🔧';
  };

  const getCategoryColor = () => {
    const colors = {
      productivity: 'bg-blue-100 text-blue-800',
      analytics: 'bg-green-100 text-green-800',
      communication: 'bg-purple-100 text-purple-800',
      automation: 'bg-orange-100 text-orange-800',
      'ai-ml': 'bg-pink-100 text-pink-800',
      integration: 'bg-gray-100 text-gray-800',
    };
    return colors[agent.category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden ${featured ? 'ring-2 ring-blue-500' : ''}`}>
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{getCategoryIcon()}</div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">{agent.name}</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>by {agent.developer.name}</span>
                {agent.developer.verified && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    ✓ Verified
                  </span>
                )}
              </div>
            </div>
          </div>
          {featured && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Featured
            </span>
          )}
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{agent.description}</p>

        {/* Category and Rating */}
        <div className="flex items-center justify-between mb-4">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor()}`}>
            {agent.category}
          </span>
          <div className="flex items-center space-x-1">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-4 h-4 ${
                    star <= agent.rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-gray-600">({agent.downloads})</span>
          </div>
        </div>

        {/* Capabilities */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {agent.capabilities.slice(0, 3).map((capability) => (
              <span
                key={capability}
                className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
              >
                {capability}
              </span>
            ))}
            {agent.capabilities.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                +{agent.capabilities.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Integrations */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-1">Integrations:</div>
          <div className="flex flex-wrap gap-1">
            {agent.integrations.slice(0, 4).map((integration) => (
              <span
                key={integration}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700"
              >
                {integration}
              </span>
            ))}
            {agent.integrations.length > 4 && (
              <span className="text-xs text-gray-500">
                +{agent.integrations.length - 4} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold text-gray-900">
            {formatPrice()}
          </div>
          <div className="space-x-2">
            {agent.demoUrl && (
              <a
                href={agent.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-100"
              >
                Demo
              </a>
            )}
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isInstalling ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Installing...
                </>
              ) : (
                'Install'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};