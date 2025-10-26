export type AgentsHubConfig = {
  apiUrl: string;
  apiKey?: string;
};

export function getConfig(): AgentsHubConfig {
  return {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
    apiKey: process.env.NEXT_PUBLIC_TENANT_API_KEY
  };
}
