import React from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

interface PostmanCollection {
  name: string;
  title: string;
  description: string;
  category: string;
  downloadUrl: string;
  importUrl: string;
}

const postmanCollections: PostmanCollection[] = [
  {
    name: 'flow-api',
    title: 'Flow API',
    description: 'Core backend API service for multi-tenant incident response',
    category: 'Core APIs',
    downloadUrl: '/postman/flow-api.json',
    importUrl: 'https://docs.tekup.org/postman/flow-api.json'
  },
  {
    name: 'tekup-crm-api',
    title: 'TekUp CRM API',
    description: 'Customer relationship management API',
    category: 'Business APIs',
    downloadUrl: '/postman/tekup-crm-api.json',
    importUrl: 'https://docs.tekup.org/postman/tekup-crm-api.json'
  },
  {
    name: 'tekup-lead-platform',
    title: 'Lead Platform API',
    description: 'Lead generation and management API',
    category: 'Business APIs',
    downloadUrl: '/postman/tekup-lead-platform.json',
    importUrl: 'https://docs.tekup.org/postman/tekup-lead-platform.json'
  },
  {
    name: 'secure-platform',
    title: 'Secure Platform API',
    description: 'Security and compliance API',
    category: 'Security APIs',
    downloadUrl: '/postman/secure-platform.json',
    importUrl: 'https://docs.tekup.org/postman/secure-platform.json'
  },
  {
    name: 'voicedk-api',
    title: 'VoiceDK API',
    description: 'Danish voice AI processing API',
    category: 'AI APIs',
    downloadUrl: '/postman/voicedk-api.json',
    importUrl: 'https://docs.tekup.org/postman/voicedk-api.json'
  },
  {
    name: 'rendetalje-os-backend',
    title: 'Rendetalje OS Backend',
    description: 'Construction management backend API',
    category: 'Business APIs',
    downloadUrl: '/postman/rendetalje-os-backend.json',
    importUrl: 'https://docs.tekup.org/postman/rendetalje-os-backend.json'
  }
];

export default function PostmanCollections(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();

  const groupedCollections = postmanCollections.reduce((acc, collection) => {
    if (!acc[collection.category]) {
      acc[collection.category] = [];
    }
    acc[collection.category].push(collection);
    return acc;
  }, {} as Record<string, PostmanCollection[]>);

  return (
    <Layout
      title="Postman Collections"
      description="Download and import Postman collections for TekUp platform APIs">
      <div className="container margin-vert--lg">
        <div className="row">
          <div className="col col--12">
            <h1>📮 Postman Collections</h1>
            <p className="lead">
              Download pre-configured Postman collections for all TekUp platform APIs. 
              These collections include example requests, authentication setup, and environment variables.
            </p>
          </div>
        </div>

        <div className="row margin-top--lg">
          <div className="col col--8">
            {Object.entries(groupedCollections).map(([category, collections]) => (
              <div key={category} className="margin-bottom--xl">
                <h2>{category}</h2>
                <div className="row">
                  {collections.map((collection) => (
                    <div key={collection.name} className="col col--6 margin-bottom--md">
                      <div className="card">
                        <div className="card__header">
                          <h3>{collection.title}</h3>
                        </div>
                        <div className="card__body">
                          <p>{collection.description}</p>
                          <div className="button-group">
                            <a
                              href={collection.downloadUrl}
                              className="button button--primary"
                              download>
                              Download Collection
                            </a>
                            <button
                              className="button button--secondary"
                              onClick={() => {
                                navigator.clipboard.writeText(collection.importUrl);
                                alert('Import URL copied to clipboard!');
                              }}>
                              Copy Import URL
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="col col--4">
            <div className="card">
              <div className="card__header">
                <h3>🚀 Quick Start Guide</h3>
              </div>
              <div className="card__body">
                <h4>Method 1: Direct Import</h4>
                <ol>
                  <li>Open Postman</li>
                  <li>Click "Import" button</li>
                  <li>Select "Link" tab</li>
                  <li>Paste the import URL</li>
                  <li>Click "Continue" and "Import"</li>
                </ol>

                <h4>Method 2: File Download</h4>
                <ol>
                  <li>Download the collection file</li>
                  <li>Open Postman</li>
                  <li>Click "Import" button</li>
                  <li>Drag and drop the file</li>
                  <li>Click "Import"</li>
                </ol>

                <div className="alert alert--info margin-top--md">
                  <h4>💡 Pro Tips</h4>
                  <ul>
                    <li>Set up environment variables for API keys</li>
                    <li>Use <code>demo-tenant-key-1</code> for testing</li>
                    <li>Check the collection variables for base URLs</li>
                    <li>Enable SSL certificate verification in settings</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="card margin-top--md">
              <div className="card__header">
                <h3>🔧 Environment Setup</h3>
              </div>
              <div className="card__body">
                <p>Create a Postman environment with these variables:</p>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Variable</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>baseUrl</code></td>
                      <td><code>http://localhost:4000</code></td>
                    </tr>
                    <tr>
                      <td><code>api_key</code></td>
                      <td><code>demo-tenant-key-1</code></td>
                    </tr>
                    <tr>
                      <td><code>jwt_token</code></td>
                      <td><code>your-jwt-token</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="row margin-top--lg">
          <div className="col col--12">
            <div className="alert alert--warning">
              <h4>⚠️ Important Notes</h4>
              <ul>
                <li>Make sure the API services are running locally before testing</li>
                <li>Update the base URLs in collection variables for production testing</li>
                <li>Never commit real API keys to version control</li>
                <li>Use environment-specific variables for different deployment stages</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}