import React from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

interface OpenAPISpec {
  name: string;
  title: string;
  description: string;
  category: string;
  version: string;
  port: number;
  specUrl: string;
  swaggerUrl: string;
}

const openApiSpecs: OpenAPISpec[] = [
  {
    name: 'flow-api',
    title: 'Flow API',
    description: 'Core backend API service for multi-tenant incident response',
    category: 'Core APIs',
    version: '0.1.1',
    port: 4000,
    specUrl: '/openapi/flow-api.json',
    swaggerUrl: 'http://localhost:4000/api/docs'
  },
  {
    name: 'tekup-crm-api',
    title: 'TekUp CRM API',
    description: 'Customer relationship management API',
    category: 'Business APIs',
    version: '1.0.0',
    port: 3002,
    specUrl: '/openapi/tekup-crm-api.json',
    swaggerUrl: 'http://localhost:3002/api/docs'
  },
  {
    name: 'tekup-lead-platform',
    title: 'Lead Platform API',
    description: 'Lead generation and management API',
    category: 'Business APIs',
    version: '1.0.0',
    port: 3003,
    specUrl: '/openapi/tekup-lead-platform.json',
    swaggerUrl: 'http://localhost:3003/api/docs'
  },
  {
    name: 'secure-platform',
    title: 'Secure Platform API',
    description: 'Security and compliance API',
    category: 'Security APIs',
    version: '1.0.0',
    port: 4010,
    specUrl: '/openapi/secure-platform.json',
    swaggerUrl: 'http://localhost:4010/api/docs'
  },
  {
    name: 'voicedk-api',
    title: 'VoiceDK API',
    description: 'Danish voice AI processing API',
    category: 'AI APIs',
    version: '1.0.0',
    port: 3002,
    specUrl: '/openapi/voicedk-api.json',
    swaggerUrl: 'http://localhost:3002/api/docs'
  },
  {
    name: 'rendetalje-os-backend',
    title: 'Rendetalje OS Backend',
    description: 'Construction management backend API',
    category: 'Business APIs',
    version: '1.0.0',
    port: 3006,
    specUrl: '/openapi/rendetalje-os-backend.json',
    swaggerUrl: 'http://localhost:3006/api/docs'
  }
];

export default function OpenAPISpecs(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();

  const groupedSpecs = openApiSpecs.reduce((acc, spec) => {
    if (!acc[spec.category]) {
      acc[spec.category] = [];
    }
    acc[spec.category].push(spec);
    return acc;
  }, {} as Record<string, OpenAPISpec[]>);

  return (
    <Layout
      title="OpenAPI Specifications"
      description="Download OpenAPI 3.0 specifications for all TekUp platform APIs">
      <div className="container margin-vert--lg">
        <div className="row">
          <div className="col col--12">
            <h1>📋 OpenAPI Specifications</h1>
            <p className="lead">
              Download OpenAPI 3.0 specifications for all TekUp platform APIs. 
              These specifications can be used to generate client libraries, documentation, and testing tools.
            </p>
          </div>
        </div>

        <div className="row margin-top--lg">
          <div className="col col--8">
            {Object.entries(groupedSpecs).map(([category, specs]) => (
              <div key={category} className="margin-bottom--xl">
                <h2>{category}</h2>
                <div className="row">
                  {specs.map((spec) => (
                    <div key={spec.name} className="col col--12 margin-bottom--md">
                      <div className="card">
                        <div className="card__header">
                          <div className="row">
                            <div className="col col--8">
                              <h3>{spec.title}</h3>
                              <p className="margin-bottom--none text--secondary">
                                {spec.description}
                              </p>
                            </div>
                            <div className="col col--4 text--right">
                              <span className="badge badge--primary">v{spec.version}</span>
                              <br />
                              <small className="text--secondary">Port: {spec.port}</small>
                            </div>
                          </div>
                        </div>
                        <div className="card__body">
                          <div className="button-group">
                            <a
                              href={spec.specUrl}
                              className="button button--primary"
                              download>
                              Download JSON
                            </a>
                            <a
                              href={spec.swaggerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="button button--secondary">
                              Open Swagger UI
                            </a>
                            <button
                              className="button button--outline"
                              onClick={() => {
                                navigator.clipboard.writeText(`https://docs.tekup.org${spec.specUrl}`);
                                alert('Specification URL copied to clipboard!');
                              }}>
                              Copy URL
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
                <h3>🛠️ Code Generation</h3>
              </div>
              <div className="card__body">
                <p>Generate client libraries using OpenAPI Generator:</p>
                
                <h4>JavaScript/TypeScript</h4>
                <pre className="code-block">
                  <code>{`npx @openapitools/openapi-generator-cli generate \\
  -i https://docs.tekup.org/openapi/flow-api.json \\
  -g typescript-axios \\
  -o ./generated-client`}</code>
                </pre>

                <h4>Python</h4>
                <pre className="code-block">
                  <code>{`npx @openapitools/openapi-generator-cli generate \\
  -i https://docs.tekup.org/openapi/flow-api.json \\
  -g python \\
  -o ./generated-client`}</code>
                </pre>

                <h4>PHP</h4>
                <pre className="code-block">
                  <code>{`npx @openapitools/openapi-generator-cli generate \\
  -i https://docs.tekup.org/openapi/flow-api.json \\
  -g php \\
  -o ./generated-client`}</code>
                </pre>
              </div>
            </div>

            <div className="card margin-top--md">
              <div className="card__header">
                <h3>🔍 Validation Tools</h3>
              </div>
              <div className="card__body">
                <h4>Swagger Editor</h4>
                <p>Validate and edit specifications online:</p>
                <a
                  href="https://editor.swagger.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button button--outline button--block">
                  Open Swagger Editor
                </a>

                <h4>CLI Validation</h4>
                <pre className="code-block margin-top--md">
                  <code>{`# Install swagger-codegen
npm install -g swagger-codegen

# Validate specification
swagger-codegen validate -i /path/to/spec.json`}</code>
                </pre>
              </div>
            </div>

            <div className="card margin-top--md">
              <div className="card__header">
                <h3>📚 Resources</h3>
              </div>
              <div className="card__body">
                <ul>
                  <li>
                    <a href="https://swagger.io/specification/" target="_blank" rel="noopener noreferrer">
                      OpenAPI 3.0 Specification
                    </a>
                  </li>
                  <li>
                    <a href="https://openapi-generator.tech/" target="_blank" rel="noopener noreferrer">
                      OpenAPI Generator
                    </a>
                  </li>
                  <li>
                    <a href="https://swagger.io/tools/" target="_blank" rel="noopener noreferrer">
                      Swagger Tools
                    </a>
                  </li>
                  <li>
                    <a href="/api" rel="noopener noreferrer">
                      API Documentation
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="row margin-top--lg">
          <div className="col col--12">
            <div className="alert alert--info">
              <h4>💡 Usage Examples</h4>
              <div className="row">
                <div className="col col--6">
                  <h5>Import into Insomnia</h5>
                  <ol>
                    <li>Open Insomnia</li>
                    <li>Click "Create" → "Import from URL"</li>
                    <li>Paste the specification URL</li>
                    <li>Click "Fetch and Import"</li>
                  </ol>
                </div>
                <div className="col col--6">
                  <h5>Use with Postman</h5>
                  <ol>
                    <li>Open Postman</li>
                    <li>Click "Import" → "Link"</li>
                    <li>Paste the specification URL</li>
                    <li>Click "Continue" and "Import"</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}