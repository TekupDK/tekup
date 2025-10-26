import type { Config } from '@docusaurus/types';
const config: Config = {
  title: 'TekUp Docs',
  url: 'https://tekup-org.github.io',
  baseUrl: '/docs/',
  favicon: 'img/favicon.ico',
  organizationName: 'tekup-org',
  projectName: 'docs',
  presets: [['classic', { docs: { path: 'content', routeBasePath: '/' }, blog: false }]],
  staticDirectories: ['build']
};
export default config;
