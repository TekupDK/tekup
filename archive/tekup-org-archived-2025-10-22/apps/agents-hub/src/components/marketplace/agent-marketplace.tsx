'use client';

import { useState, useEffect } from 'react';
import { AgentCard } from './agent-card';
import { AgentFilters } from './agent-filters';
import { AgentSearch } from './agent-search';

export interface MarketplaceAgent {
  id: string;
  name: string;
  description: string;
  category: 'productivity' | 'analytics' | 'communication' | 'automation' | 'ai-ml' | 'integration';
  developer: {
    name: string;
    verified: boolean;
    rating: number;
  };
  pricing: {
    model: 'free' | 'freemium' | 'subscription' | 'usage';
    price?: number;
    currency: string;
  };
  capabilities: string[];
  integrations: string[];
  rating: number;
  downloads: number;
  lastUpdated: Date;
  featured: boolean;
  screenshots: string[];
  demoUrl?: string;
  documentationUrl?: string;
}

export const AgentMarketplace = () => {
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-agents-hub-src-components');

  const [agents, setAgents] = useState<MarketplaceAgent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<MarketplaceAgent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPricing, setSelectedPricing] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMarketplaceAgents();
  }, []);

  useEffect(() => {
    filterAgents();
  }, [agents, searchQuery, selectedCategory, selectedPricing]);

  const loadMarketplaceAgents = async () => {
    try {
      // In production, this would fetch from your marketplace API
      const mockAgents: MarketplaceAgent[] = [
        {
          id: 'email-assistant',
          name: 'Smart Email Assistant',
          description: 'AI-powered email management with automated responses and scheduling',
          category: 'productivity',
          developer: {
            name: 'TekUp',
            verified: true,
            rating: 4.8,
          },
          pricing: {
            model: 'subscription',
            price: 29,
            currency: 'USD',
          },
          capabilities: ['email-parsing', 'auto-response', 'scheduling', 'sentiment-analysis'],
          integrations: ['gmail', 'outlook', 'calendar'],
          rating: 4.7,
          downloads: 1250,
          lastUpdated: new Date('2025-01-15'),
          featured: true,
          screenshots: ['/api/placeholder/400/300'],
          demoUrl: 'https://demo.tekup.org/email-assistant',
          documentationUrl: 'https://docs.tekup.org/email-assistant',
        },
        {
          id: 'data-analyzer',
          name: 'Business Data Analyzer',
          description: 'Automated data analysis and reporting for business intelligence',
          category: 'analytics',
          developer: {
            name: 'DataCorp',
            verified: true,
            rating: 4.5,
          },
          pricing: {
            model: 'usage',
            price: 0.10,
            currency: 'USD',
          },
          capabilities: ['data-processing', 'visualization', 'reporting', 'forecasting'],
          integrations: ['excel', 'powerbi', 'tableau', 'sql'],
          rating: 4.6,
          downloads: 890,
          lastUpdated: new Date('2025-01-10'),
          featured: false,
          screenshots: ['/api/placeholder/400/300'],
          documentationUrl: 'https://docs.datacorp.com/analyzer',
        },
        {
          id: 'customer-support',
          name: 'AI Customer Support',
          description: 'Intelligent customer support agent with multi-language capabilities',
          category: 'communication',
          developer: {
            name: 'SupportAI',
            verified: false,
            rating: 4.2,
          },
          pricing: {
            model: 'freemium',
            price: 49,
            currency: 'USD',
          },
          capabilities: ['chat-support', 'ticket-routing', 'knowledge-base', 'multilingual'],
          integrations: ['zendesk', 'intercom', 'slack', 'teams'],
          rating: 4.3,
          downloads: 2100,
          lastUpdated: new Date('2025-01-12'),
          featured: true,
          screenshots: ['/api/placeholder/400/300'],
          demoUrl: 'https://demo.supportai.com',
        },
        {
          id: 'workflow-automator',
          name: 'Workflow Automator',
          description: 'Create and manage complex business workflows with AI assistance',
          category: 'automation',
          developer: {
            name: 'AutoFlow',
            verified: true,
            rating: 4.9,
          },
          pricing: {
            model: 'subscription',
            price: 99,
            currency: 'USD',
          },
          capabilities: ['workflow-design', 'process-automation', 'integration-management', 'monitoring'],
          integrations: ['zapier', 'microsoft-flow', 'salesforce', 'hubspot'],
          rating: 4.8,
          downloads: 567,
          lastUpdated: new Date('2025-01-14'),
          featured: true,
          screenshots: ['/api/placeholder/400/300'],
          documentationUrl: 'https://docs.autoflow.com',
        },
      ];

      setAgents(mockAgents);
      setLoading(false);
    } catch (error) {
      logger.error('Failed to load marketplace agents:', error);
      setLoading(false);
    }
  };

  const filterAgents = () => {
    let filtered = agents;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(agent =>
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.capabilities.some(cap => cap.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(agent => agent.category === selectedCategory);
    }

    // Pricing filter
    if (selectedPricing !== 'all') {
      filtered = filtered.filter(agent => agent.pricing.model === selectedPricing);
    }

    setFilteredAgents(filtered);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white">
        <h1 className="text-4xl font-bold mb-4">AI Agent Marketplace</h1>
        <p className="text-xl opacity-90 max-w-2xl mx-auto">
          Discover, deploy, and manage AI agents to automate your business processes
        </p>
        <div className="mt-6 flex justify-center space-x-4 text-sm">
          <div className="bg-white/20 px-4 py-2 rounded-full">
            {agents.length} Agents Available
          </div>
          <div className="bg-white/20 px-4 py-2 rounded-full">
            50+ Integrations
          </div>
          <div className="bg-white/20 px-4 py-2 rounded-full">
            Enterprise Ready
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <AgentSearch 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>
        <div>
          <AgentFilters
            selectedCategory={selectedCategory}
            selectedPricing={selectedPricing}
            onCategoryChange={setSelectedCategory}
            onPricingChange={setSelectedPricing}
          />
        </div>
      </div>

      {/* Featured Agents */}
      {selectedCategory === 'all' && !searchQuery && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Featured Agents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents
              .filter(agent => agent.featured)
              .map(agent => (
                <AgentCard key={agent.id} agent={agent} featured />
              ))}
          </div>
        </div>
      )}

      {/* All Agents */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {searchQuery || selectedCategory !== 'all' ? 'Search Results' : 'All Agents'}
          </h2>
          <div className="text-sm text-gray-600">
            {filteredAgents.length} agent{filteredAgents.length !== 1 ? 's' : ''} found
          </div>
        </div>
        
        {filteredAgents.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-gray-500 text-lg">No agents found matching your criteria</div>
            <button 
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedPricing('all');
              }}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map(agent => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </div>

      {/* Call to Action for Developers */}
      <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-lg p-8 text-white text-center">
        <h3 className="text-2xl font-bold mb-4">Build Your Own AI Agent</h3>
        <p className="text-lg opacity-90 mb-6">
          Join our developer community and monetize your AI innovations
        </p>
        <div className="space-x-4">
          <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100">
            Developer Portal
          </button>
          <button className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10">
            API Documentation
          </button>
        </div>
      </div>
    </div>
  );
};