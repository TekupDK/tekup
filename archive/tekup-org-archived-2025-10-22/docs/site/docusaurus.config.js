// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const {themes} = require('prism-react-renderer');
const lightCodeTheme = themes.github;
const darkCodeTheme = themes.dracula;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'TekUp Documentation',
  tagline: 'Comprehensive AI-Powered Business Platform Documentation',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://docs.tekup.org',
  // Set the /<baseUrl>/ pathname under which your site is served
  baseUrl: '/',

  // GitHub pages deployment config
  organizationName: 'TekUp-org',
  projectName: 'tekup-org',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Multi-language support (Danish/English)
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'da'],
    localeConfigs: {
      en: {
        label: 'English',
        direction: 'ltr',
        htmlLang: 'en-US',
      },
      da: {
        label: 'Dansk',
        direction: 'ltr',
        htmlLang: 'da-DK',
      },
    },
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/TekUp-org/tekup-org/tree/main/docs/site/',
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
          remarkPlugins: [],
          rehypePlugins: [],
        },
        blog: {
          showReadingTime: true,
          editUrl: 'https://github.com/TekUp-org/tekup-org/tree/main/docs/site/',
          blogTitle: 'TekUp Blog',
          blogDescription: 'Latest updates and insights from TekUp',
          postsPerPage: 'ALL',
          feedOptions: {
            type: 'all',
            copyright: `Copyright © ${new Date().getFullYear()} TekUp.`,
          },
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  plugins: [
    // API Documentation plugin
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'api',
        path: 'api',
        routeBasePath: 'api',
        sidebarPath: require.resolve('./sidebars.js'),
        editUrl: 'https://github.com/TekUp-org/tekup-org/tree/main/docs/site/',
      },
    ],
    // Guides plugin
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'guides',
        path: 'guides',
        routeBasePath: 'guides',
        sidebarPath: require.resolve('./sidebars.js'),
        editUrl: 'https://github.com/TekUp-org/tekup-org/tree/main/docs/site/',
      },
    ],
    // Whitepapers plugin
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'whitepapers',
        path: 'whitepapers',
        routeBasePath: 'whitepapers',
        sidebarPath: require.resolve('./sidebars.js'),
        editUrl: 'https://github.com/TekUp-org/tekup-org/tree/main/docs/site/',
      },
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/tekup-social-card.jpg',
      
      // Announcement bar for important updates
      announcementBar: {
        id: 'support_us',
        content:
          '⭐️ If you like TekUp, give it a star on <a target="_blank" rel="noopener noreferrer" href="https://github.com/TekUp-org/tekup-org">GitHub</a>! ⭐️',
        backgroundColor: '#fafbfc',
        textColor: '#091E42',
        isCloseable: false,
      },

      // Color mode configuration
      colorMode: {
        defaultMode: 'light',
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },

      navbar: {
        title: 'TekUp',
        logo: {
          alt: 'TekUp Logo',
          src: 'img/logo.svg',
          srcDark: 'img/logo-dark.svg',
          width: 32,
          height: 32,
        },
        hideOnScroll: true,
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'mainSidebar',
            position: 'left',
            label: 'Documentation',
          },
          {
            to: '/api',
            label: 'API Reference',
            position: 'left',
          },
          {
            to: '/guides',
            label: 'Guides',
            position: 'left',
          },
          {
            to: '/whitepapers',
            label: 'Whitepapers',
            position: 'left',
          },
          {
            type: 'dropdown',
            label: 'Interactive Tools',
            position: 'left',
            items: [
              {
                to: '/api-explorer',
                label: '🚀 API Explorer',
              },
              {
                to: '/component-playground',
                label: '🎨 Component Playground',
              },
              {
                to: '/tutorials',
                label: '📚 Interactive Tutorials',
              },
              {
                to: '/search',
                label: '🔍 Advanced Search',
              },
            ],
          },
          {
            to: '/blog', 
            label: 'Blog', 
            position: 'left'
          },
          {
            type: 'search',
            position: 'right',
          },
          {
            type: 'localeDropdown',
            position: 'right',
          },
          {
            href: 'https://github.com/TekUp-org/tekup-org',
            className: 'header-github-link',
            'aria-label': 'GitHub repository',
            position: 'right',
          },
        ],
      },

      footer: {
        style: 'dark',
        links: [
          {
            title: 'Documentation',
            items: [
              {
                label: 'Getting Started',
                to: '/docs/getting-started',
              },
              {
                label: 'Architecture',
                to: '/docs/architecture',
              },
              {
                label: 'Applications',
                to: '/docs/category/applications',
              },
              {
                label: 'API Reference',
                to: '/api',
              },
            ],
          },
          {
            title: 'Guides',
            items: [
              {
                label: 'Deployment',
                to: '/guides/deployment',
              },
              {
                label: 'Integration',
                to: '/guides/integration',
              },
              {
                label: 'Troubleshooting',
                to: '/guides/troubleshooting',
              },
              {
                label: 'Best Practices',
                to: '/guides/best-practices',
              },
            ],
          },
          {
            title: 'Resources',
            items: [
              {
                label: 'Whitepapers',
                to: '/whitepapers',
              },
              {
                label: 'Blog',
                to: '/blog',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/TekUp-org/tekup-org',
              },
              {
                label: 'Support',
                href: 'https://github.com/TekUp-org/tekup-org/issues',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Discord',
                href: 'https://discord.gg/tekup',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/tekup_org',
              },
              {
                label: 'LinkedIn',
                href: 'https://linkedin.com/company/tekup',
              },
            ],
          },
        ],
        logo: {
          alt: 'TekUp Logo',
          src: 'img/logo.svg',
          width: 160,
          height: 51,
        },
        copyright: `Copyright © ${new Date().getFullYear()} TekUp. Built with Docusaurus.`,
      },

      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
        additionalLanguages: [
          'bash',
          'diff',
          'json',
          'javascript',
          'typescript',
          'jsx',
          'tsx',
          'yaml',
          'docker',
          'sql',
          'prisma',
        ],
      },

      // Search configuration (Algolia)
      algolia: {
        appId: 'YOUR_APP_ID',
        apiKey: 'YOUR_SEARCH_API_KEY',
        indexName: 'tekup-docs',
        contextualSearch: true,
        externalUrlRegex: 'external\\.com|domain\\.com',
        searchParameters: {},
        searchPagePath: 'search',
      },

      // Table of contents configuration
      tableOfContents: {
        minHeadingLevel: 2,
        maxHeadingLevel: 5,
      },

      // Docs configuration
      docs: {
        sidebar: {
          hideable: true,
          autoCollapseCategories: true,
        },
      },
    }),

  // Markdown configuration
  markdown: {
    mermaid: true,
  },

  themes: ['@docusaurus/theme-mermaid'],

  // Custom webpack configuration for better performance
  webpack: {
    jsLoader: (isServer) => ({
      loader: require.resolve('swc-loader'),
      options: {
        jsc: {
          parser: {
            syntax: 'typescript',
            tsx: true,
          },
          target: 'es2017',
        },
        module: {
          type: isServer ? 'commonjs' : 'es6',
        },
      },
    }),
  },
};

module.exports = config;