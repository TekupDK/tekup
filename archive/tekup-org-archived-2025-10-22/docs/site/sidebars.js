/**
 * TekUp Comprehensive Documentation Sidebars
 * @type {import('@docusaurus/plugin-content-docs').SidebarsConfig}
 */
const sidebars = {
  // Main documentation sidebar
  mainSidebar: [
    'getting-started',
    {
      type: 'category',
      label: 'Architecture',
      collapsed: false,
      items: [
        'architecture/overview',
        'architecture/system-design',
        'architecture/multi-tenancy',
        'architecture/security',
        'architecture/scalability',
        'architecture/data-flow',
        'architecture/integration-patterns',
      ],
    },
    {
      type: 'category',
      label: 'Applications',
      collapsed: false,
      items: [
        {
          type: 'category',
          label: 'Core Applications',
          items: [
            'apps/flow-api',
            'apps/flow-web',
            'apps/voice-agent',
          ],
        },
        {
          type: 'category',
          label: 'Business Applications',
          items: [
            'apps/tekup-crm-api',
            'apps/tekup-crm-web',
            'apps/tekup-lead-platform',
            'apps/tekup-lead-platform-web',
            'apps/business-metrics-dashboard',
          ],
        },
        {
          type: 'category',
          label: 'Specialized Applications',
          items: [
            'apps/inbox-ai',
            'apps/secure-platform',
            'apps/voicedk-api',
            'apps/danish-enterprise',
            'apps/essenza-pro',
            'apps/essenza-pro-backend',
            'apps/foodtruck-os',
            'apps/foodtruck-os-backend',
            'apps/rendetalje-os',
            'apps/rendetalje-os-backend',
            'apps/mcp-studio-backend',
            'apps/mcp-studio-enterprise',
            'apps/agents-hub',
            'apps/agentrooms-backend',
            'apps/agentrooms-frontend',
            'apps/tekup-mobile',
            'apps/website',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Shared Packages',
      collapsed: true,
      items: [
        'packages/overview',
        'packages/shared',
        'packages/api-client',
        'packages/auth',
        'packages/config',
        'packages/ui',
        'packages/testing',
        'packages/sso',
        'packages/consciousness',
        'packages/ai-consciousness',
        'packages/evolution-engine',
        'packages/eslint-config',
      ],
    },
    {
      type: 'category',
      label: 'Development',
      collapsed: true,
      items: [
        'development/setup',
        'development/environment',
        'development/testing',
        'development/deployment',
        'development/contributing',
        'development/standards',
        'development/tooling',
      ],
    },
    {
      type: 'category',
      label: 'External Services',
      collapsed: true,
      items: [
        'services/overview',
        'services/openai',
        'services/gemini',
        'services/stripe',
        'services/convertkit',
        'services/hubspot',
        'services/monitoring',
        'services/health-checks',
      ],
    },
  ],

  // API Reference sidebar
  apiSidebar: [
    'api-overview',
    {
      type: 'category',
      label: 'Core APIs',
      collapsed: false,
      items: [
        'flow-api',
      ],
    },
    {
      type: 'category',
      label: 'Business APIs',
      collapsed: false,
      items: [
        'tekup-crm-api',
        'tekup-lead-platform',
        'rendetalje-os-backend',
      ],
    },
    {
      type: 'category',
      label: 'Security APIs',
      collapsed: false,
      items: [
        'secure-platform',
      ],
    },
    {
      type: 'category',
      label: 'AI APIs',
      collapsed: false,
      items: [
        'voicedk-api',
      ],
    },
    {
      type: 'category',
      label: 'Interactive Testing',
      collapsed: true,
      items: [
        {
          type: 'link',
          label: 'API Explorer',
          href: '/api-explorer',
        },
        {
          type: 'link',
          label: 'Postman Collections',
          href: '/postman',
        },
        {
          type: 'link',
          label: 'OpenAPI Specifications',
          href: '/openapi',
        },
      ],
    },
  ],

  // Guides sidebar
  guidesSidebar: [
    'guides-overview',
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/quick-start',
        'getting-started/installation',
        'getting-started/configuration',
        'getting-started/first-app',
      ],
    },
    {
      type: 'category',
      label: 'Deployment',
      items: [
        'deployment/overview',
        'deployment/local-development',
        'deployment/staging',
        'deployment/production',
        'deployment/docker',
        'deployment/kubernetes',
        'deployment/monitoring',
      ],
    },
    {
      type: 'category',
      label: 'Integration',
      items: [
        'integration/overview',
        'integration/api-integration',
        'integration/websocket-integration',
        'integration/webhook-setup',
        'integration/external-services',
        'integration/authentication',
        'integration/error-handling',
      ],
    },
    {
      type: 'category',
      label: 'Troubleshooting',
      items: [
        'troubleshooting/overview',
        'troubleshooting/common-issues',
        'troubleshooting/api-errors',
        'troubleshooting/deployment-issues',
        'troubleshooting/performance',
        'troubleshooting/debugging',
      ],
    },
    {
      type: 'category',
      label: 'Best Practices',
      items: [
        'best-practices/overview',
        'best-practices/code-quality',
        'best-practices/security',
        'best-practices/performance',
        'best-practices/testing',
        'best-practices/documentation',
      ],
    },
  ],

  // Whitepapers sidebar
  whitepapersidebar: [
    'whitepapers-overview',
    {
      type: 'category',
      label: 'System Architecture',
      items: [
        'architecture/comprehensive-overview',
        'architecture/microservices-design',
        'architecture/event-driven-architecture',
        'architecture/data-architecture',
        'architecture/technology-decisions',
      ],
    },
    {
      type: 'category',
      label: 'AI/ML Integration',
      items: [
        'ai/ai-architecture',
        'ai/gemini-live-integration',
        'ai/voice-processing',
        'ai/natural-language-understanding',
        'ai/machine-learning-models',
        'ai/ai-automation',
      ],
    },
    {
      type: 'category',
      label: 'Security & Compliance',
      items: [
        'security/security-architecture',
        'security/authentication-authorization',
        'security/data-protection',
        'security/compliance-frameworks',
        'security/incident-response',
        'security/audit-procedures',
      ],
    },
    {
      type: 'category',
      label: 'Performance & Scalability',
      items: [
        'performance/performance-analysis',
        'performance/scalability-patterns',
        'performance/optimization-strategies',
        'performance/monitoring-observability',
        'performance/capacity-planning',
      ],
    },
    {
      type: 'category',
      label: 'Business Strategy',
      items: [
        'business/platform-strategy',
        'business/market-analysis',
        'business/product-roadmap',
        'business/competitive-analysis',
        'business/roi-analysis',
      ],
    },
  ],
};

module.exports = sidebars;