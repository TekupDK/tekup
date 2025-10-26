/**
 * TekUp Documentation Sidebars
 * @type {import('@docusaurus/plugin-content-docs').SidebarsConfig}
 */
const sidebars = {
  // Main documentation sidebar
  tutorialSidebar: [
    'getting-started',
    {
      type: 'category',
      label: 'Architecture',
      items: ['architecture', 'multi-tenancy', 'security'],
    },
    {
      type: 'category',
      label: 'Applications',
      items: [
        'apps/flow-api',
        'apps/flow-web', 
        'apps/crm',
        'apps/mobile',
        'apps/inbox-ai',
        'apps/voice-agent',
        'apps/secure-platform',
      ],
    },
    {
      type: 'category',
      label: 'Shared Packages',
      items: [
        'packages/shared',
        'packages/api-client',
        'packages/auth',
        'packages/config',
        'packages/ui',
        'packages/testing',
      ],
    },
    {
      type: 'category',
      label: 'Development',
      items: [
        'development/setup',
        'development/testing',
        'development/deployment',
        'development/contributing',
      ],
    },
  ],

  // API Reference sidebar
  apiSidebar: [
    {
      type: 'category',
      label: 'Flow API',
      items: [
        'api/flow/overview',
        'api/flow/authentication',
        'api/flow/leads',
        'api/flow/tenants',
        'api/flow/events',
      ],
    },
    {
      type: 'category',
      label: 'CRM API',
      items: [
        'api/crm/overview',
        'api/crm/contacts',
        'api/crm/companies',
        'api/crm/workflows',
      ],
    },
    {
      type: 'category',
      label: 'Secure Platform API',
      items: [
        'api/secure/overview',
        'api/secure/compliance',
        'api/secure/monitoring',
      ],
    },
  ],
};

module.exports = sidebars;
