'use client';

interface AgentFiltersProps {
  selectedCategory: string;
  selectedPricing: string;
  onCategoryChange: (category: string) => void;
  onPricingChange: (pricing: string) => void;
}

export const AgentFilters = ({
  selectedCategory,
  selectedPricing,
  onCategoryChange,
  onPricingChange,
}: AgentFiltersProps) => {
  const categories = [
    { value: 'all', label: 'All Categories', count: 156 },
    { value: 'productivity', label: 'Productivity', count: 45 },
    { value: 'analytics', label: 'Analytics', count: 32 },
    { value: 'communication', label: 'Communication', count: 28 },
    { value: 'automation', label: 'Automation', count: 35 },
    { value: 'ai-ml', label: 'AI & ML', count: 12 },
    { value: 'integration', label: 'Integration', count: 24 },
  ];

  const pricingModels = [
    { value: 'all', label: 'All Pricing' },
    { value: 'free', label: 'Free' },
    { value: 'freemium', label: 'Freemium' },
    { value: 'subscription', label: 'Subscription' },
    { value: 'usage', label: 'Pay per Use' },
  ];

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Categories</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => onCategoryChange(category.value)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                selectedCategory === category.value
                  ? 'bg-blue-100 text-blue-800 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{category.label}</span>
                <span className="text-xs text-gray-400">{category.count}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Pricing Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Pricing</h3>
        <div className="space-y-2">
          {pricingModels.map((pricing) => (
            <button
              key={pricing.value}
              onClick={() => onPricingChange(pricing.value)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                selectedPricing === pricing.value
                  ? 'bg-blue-100 text-blue-800 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {pricing.label}
            </button>
          ))}
        </div>
      </div>

      {/* Developer Tools */}
      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">For Developers</h3>
        <div className="space-y-2">
          <a
            href="/developer/portal"
            className="block w-full text-left px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100"
          >
            Developer Portal
          </a>
          <a
            href="/developer/docs"
            className="block w-full text-left px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100"
          >
            API Documentation
          </a>
          <a
            href="/developer/sdk"
            className="block w-full text-left px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100"
          >
            SDK & Tools
          </a>
          <a
            href="/developer/publish"
            className="block w-full text-left px-3 py-2 rounded-md text-sm text-blue-600 hover:bg-blue-50 font-medium"
          >
            Publish Agent
          </a>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Marketplace Stats</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Total Agents</span>
            <span className="font-medium">156</span>
          </div>
          <div className="flex justify-between">
            <span>Active Developers</span>
            <span className="font-medium">89</span>
          </div>
          <div className="flex justify-between">
            <span>Monthly Installs</span>
            <span className="font-medium">12.5K</span>
          </div>
          <div className="flex justify-between">
            <span>Enterprise Users</span>
            <span className="font-medium">234</span>
          </div>
        </div>
      </div>
    </div>
  );
};