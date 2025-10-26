import React, { useState, useEffect, useCallback } from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './api-explorer.module.css';

interface ApiSpec {
  name: string;
  title: string;
  description: string;
  category: string;
  port: number;
  specUrl: string;
  authType?: 'none' | 'api-key' | 'jwt' | 'oauth';
  testApiKey?: string;
  healthEndpoint?: string;
}

interface ApiEndpoint {
  path: string;
  method: string;
  summary: string;
  description: string;
  parameters?: Array<{
    name: string;
    in: 'query' | 'path' | 'header' | 'body';
    required: boolean;
    type: string;
    description: string;
    example?: any;
  }>;
  requestBody?: {
    required: boolean;
    content: {
      'application/json': {
        schema: any;
        example?: any;
      };
    };
  };
  responses: Record<string, {
    description: string;
    content?: {
      'application/json': {
        schema: any;
        example?: any;
      };
    };
  }>;
}

interface TestHistory {
  id: string;
  timestamp: Date;
  api: string;
  method: string;
  endpoint: string;
  status: number;
  responseTime: number;
  success: boolean;
}

const apiSpecs: ApiSpec[] = [
  {
    name: 'flow-api',
    title: 'Flow API',
    description: 'Core backend API service for multi-tenant incident response',
    category: 'Core APIs',
    port: 4000,
    specUrl: '/openapi/flow-api.json',
    authType: 'api-key',
    testApiKey: 'demo-tenant-key-1',
    healthEndpoint: '/health'
  },
  {
    name: 'tekup-crm-api',
    title: 'TekUp CRM API',
    description: 'Customer relationship management API',
    category: 'Business APIs',
    port: 3002,
    specUrl: '/openapi/tekup-crm-api.json',
    authType: 'jwt',
    testApiKey: 'demo-crm-key',
    healthEndpoint: '/api/health'
  },
  {
    name: 'tekup-lead-platform',
    title: 'Lead Platform API',
    description: 'Lead generation and management API',
    category: 'Business APIs',
    port: 3003,
    specUrl: '/openapi/tekup-lead-platform.json',
    authType: 'api-key',
    testApiKey: 'demo-lead-key',
    healthEndpoint: '/health'
  },
  {
    name: 'secure-platform',
    title: 'Secure Platform API',
    description: 'Security and compliance API',
    category: 'Security APIs',
    port: 4010,
    specUrl: '/openapi/secure-platform.json',
    authType: 'jwt',
    testApiKey: 'demo-secure-key',
    healthEndpoint: '/api/health'
  },
  {
    name: 'voicedk-api',
    title: 'VoiceDK API',
    description: 'Danish voice AI processing API',
    category: 'AI APIs',
    port: 3002,
    specUrl: '/openapi/voicedk-api.json',
    authType: 'api-key',
    testApiKey: 'demo-voice-key',
    healthEndpoint: '/health'
  },
  {
    name: 'rendetalje-os-backend',
    title: 'Rendetalje OS Backend',
    description: 'Construction management backend API',
    category: 'Business APIs',
    port: 3006,
    specUrl: '/openapi/rendetalje-os-backend.json',
    authType: 'jwt',
    testApiKey: 'demo-rendetalje-key',
    healthEndpoint: '/api/health'
  },
  {
    name: 'business-metrics-dashboard',
    title: 'Business Metrics API',
    description: 'Business analytics and metrics API',
    category: 'Analytics APIs',
    port: 3007,
    specUrl: '/openapi/business-metrics-dashboard.json',
    authType: 'api-key',
    testApiKey: 'demo-metrics-key',
    healthEndpoint: '/health'
  },
  {
    name: 'inbox-ai',
    title: 'Inbox AI API',
    description: 'AI-powered inbox management API',
    category: 'AI APIs',
    port: 3008,
    specUrl: '/openapi/inbox-ai.json',
    authType: 'oauth',
    testApiKey: 'demo-inbox-key',
    healthEndpoint: '/api/health'
  }
];

export default function ApiExplorer(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  const [selectedApi, setSelectedApi] = useState<ApiSpec | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [jwtToken, setJwtToken] = useState('');
  const [testEndpoint, setTestEndpoint] = useState('/health');
  const [testMethod, setTestMethod] = useState('GET');
  const [testBody, setTestBody] = useState('');
  const [testHeaders, setTestHeaders] = useState('{}');
  const [testResponse, setTestResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [testHistory, setTestHistory] = useState<TestHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'test' | 'history' | 'docs' | 'auth'>('test');
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoint[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [authFlow, setAuthFlow] = useState<'login' | 'token' | 'oauth'>('login');
  const [loginCredentials, setLoginCredentials] = useState({ username: 'demo@tekup.org', password: 'demo123' });
  const [sandboxMode, setSandboxMode] = useState(true);

  // Load API endpoints from OpenAPI spec
  const loadApiEndpoints = useCallback(async (api: ApiSpec) => {
    try {
      const response = await fetch(api.specUrl);
      const spec = await response.json();
      
      const endpoints: ApiEndpoint[] = [];
      Object.entries(spec.paths || {}).forEach(([path, methods]: [string, any]) => {
        Object.entries(methods).forEach(([method, details]: [string, any]) => {
          if (typeof details === 'object' && details.summary) {
            endpoints.push({
              path,
              method: method.toUpperCase(),
              summary: details.summary,
              description: details.description || '',
              parameters: details.parameters || [],
              requestBody: details.requestBody,
              responses: details.responses || {}
            });
          }
        });
      });
      
      setApiEndpoints(endpoints);
    } catch (error) {
      console.error('Failed to load API endpoints:', error);
      setApiEndpoints([]);
    }
  }, []);

  // Enhanced API testing with better error handling and metrics
  const handleApiTest = async () => {
    if (!selectedApi) return;

    setIsLoading(true);
    setTestResponse('');
    const startTime = Date.now();

    try {
      const baseUrl = sandboxMode 
        ? `https://sandbox-api.tekup.org/${selectedApi.name}` 
        : `http://localhost:${selectedApi.port}`;
      const url = `${baseUrl}${testEndpoint}`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add custom headers
      try {
        const customHeaders = JSON.parse(testHeaders);
        Object.assign(headers, customHeaders);
      } catch (e) {
        // Ignore invalid JSON in headers
      }

      // Handle different authentication types
      if (selectedApi.authType === 'api-key' && apiKey) {
        headers['x-api-key'] = apiKey;
      } else if (selectedApi.authType === 'jwt' && jwtToken) {
        headers['Authorization'] = `Bearer ${jwtToken}`;
      }

      const options: RequestInit = {
        method: testMethod,
        headers,
      };

      if (testMethod !== 'GET' && testBody) {
        try {
          JSON.parse(testBody); // Validate JSON
          options.body = testBody;
        } catch (e) {
          throw new Error('Invalid JSON in request body');
        }
      }

      const response = await fetch(url, options);
      const endTime = Date.now();
      const responseTimeMs = endTime - startTime;
      setResponseTime(responseTimeMs);

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      const testResult = {
        status: response.status,
        statusText: response.statusText,
        responseTime: responseTimeMs,
        headers: Object.fromEntries(response.headers.entries()),
        data
      };

      setTestResponse(JSON.stringify(testResult, null, 2));

      // Add to test history
      const historyEntry: TestHistory = {
        id: Date.now().toString(),
        timestamp: new Date(),
        api: selectedApi.name,
        method: testMethod,
        endpoint: testEndpoint,
        status: response.status,
        responseTime: responseTimeMs,
        success: response.ok
      };
      
      setTestHistory(prev => [historyEntry, ...prev.slice(0, 49)]); // Keep last 50 tests

    } catch (error) {
      const endTime = Date.now();
      const responseTimeMs = endTime - startTime;
      setResponseTime(responseTimeMs);
      
      setTestResponse(JSON.stringify({
        error: error.message,
        message: sandboxMode 
          ? 'Failed to connect to sandbox API. The service may be unavailable.'
          : 'Failed to connect to local API. Make sure the service is running.',
        responseTime: responseTimeMs
      }, null, 2));

      // Add failed test to history
      const historyEntry: TestHistory = {
        id: Date.now().toString(),
        timestamp: new Date(),
        api: selectedApi?.name || 'unknown',
        method: testMethod,
        endpoint: testEndpoint,
        status: 0,
        responseTime: responseTimeMs,
        success: false
      };
      
      setTestHistory(prev => [historyEntry, ...prev.slice(0, 49)]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle authentication flow
  const handleAuthentication = async () => {
    if (!selectedApi) return;

    setIsLoading(true);
    try {
      if (selectedApi.authType === 'jwt') {
        const baseUrl = sandboxMode 
          ? `https://sandbox-api.tekup.org/${selectedApi.name}` 
          : `http://localhost:${selectedApi.port}`;
        
        const response = await fetch(`${baseUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loginCredentials)
        });

        if (response.ok) {
          const data = await response.json();
          setJwtToken(data.access_token || data.token);
          setActiveTab('test');
        } else {
          throw new Error('Authentication failed');
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fill test credentials when API is selected
  useEffect(() => {
    if (selectedApi) {
      setApiKey(selectedApi.testApiKey || '');
      setTestEndpoint(selectedApi.healthEndpoint || '/health');
      loadApiEndpoints(selectedApi);
    }
  }, [selectedApi, loadApiEndpoints]);

  const groupedApis = apiSpecs.reduce((acc, api) => {
    if (!acc[api.category]) {
      acc[api.category] = [];
    }
    acc[api.category].push(api);
    return acc;
  }, {} as Record<string, ApiSpec[]>);

  return (
    <Layout
      title="API Explorer"
      description="Interactive API testing and exploration tool for TekUp platform APIs">
      <div className="container margin-vert--lg">
        <div className="row">
          <div className="col col--12">
            <h1>🚀 Interactive API Explorer</h1>
            <p className="lead">
              Test and explore TekUp platform APIs with live testing capabilities, secure sandbox environment, 
              and interactive authentication flows.
            </p>
            
            <div className="margin-bottom--md">
              <label className="margin-right--md">
                <input
                  type="checkbox"
                  checked={sandboxMode}
                  onChange={(e) => setSandboxMode(e.target.checked)}
                  className="margin-right--sm"
                />
                <strong>Sandbox Mode</strong> (Use secure test environment)
              </label>
            </div>
          </div>
        </div>

        <div className="row margin-top--lg">
          <div className="col col--4">
            <div className="card">
              <div className="card__header">
                <h3>Available APIs</h3>
                <small className="text--secondary">
                  {apiSpecs.length} APIs available
                </small>
              </div>
              <div className="card__body">
                {Object.entries(groupedApis).map(([category, apis]) => (
                  <div key={category} className="margin-bottom--md">
                    <h4 className="margin-bottom--sm">{category}</h4>
                    {apis.map((api) => (
                      <div
                        key={api.name}
                        className={`card margin-bottom--sm cursor-pointer ${
                          selectedApi?.name === api.name ? 'card--selected' : ''
                        }`}
                        onClick={() => setSelectedApi(api)}
                        style={{ cursor: 'pointer' }}>
                        <div className="card__body padding--sm">
                          <h5 className="margin-bottom--xs">{api.title}</h5>
                          <p className="margin-bottom--xs text--secondary">
                            {api.description}
                          </p>
                          <div className="margin-bottom--xs">
                            <span className={`badge badge--${api.authType === 'none' ? 'secondary' : 'primary'}`}>
                              {api.authType?.toUpperCase() || 'NO AUTH'}
                            </span>
                          </div>
                          <small className="text--secondary">
                            Port: {api.port}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col col--8">
            {selectedApi ? (
              <div className="card">
                <div className="card__header">
                  <h3>{selectedApi.title}</h3>
                  <p className="margin-bottom--none text--secondary">
                    {selectedApi.description}
                  </p>
                </div>
                
                {/* Tab Navigation */}
                <div className="card__body padding--none">
                  <div className="tabs">
                    <ul className="tabs__list" role="tablist">
                      <li className={`tabs__item ${activeTab === 'test' ? 'tabs__item--active' : ''}`}>
                        <button
                          className="tabs__link"
                          onClick={() => setActiveTab('test')}
                          role="tab">
                          🧪 Test API
                        </button>
                      </li>
                      <li className={`tabs__item ${activeTab === 'auth' ? 'tabs__item--active' : ''}`}>
                        <button
                          className="tabs__link"
                          onClick={() => setActiveTab('auth')}
                          role="tab">
                          🔐 Authentication
                        </button>
                      </li>
                      <li className={`tabs__item ${activeTab === 'docs' ? 'tabs__item--active' : ''}`}>
                        <button
                          className="tabs__link"
                          onClick={() => setActiveTab('docs')}
                          role="tab">
                          📚 Endpoints
                        </button>
                      </li>
                      <li className={`tabs__item ${activeTab === 'history' ? 'tabs__item--active' : ''}`}>
                        <button
                          className="tabs__link"
                          onClick={() => setActiveTab('history')}
                          role="tab">
                          📊 History ({testHistory.length})
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Test Tab */}
                  {activeTab === 'test' && (
                    <div className="padding--md">
                      <div className="row margin-bottom--md">
                        <div className="col col--3">
                          <label className="margin-bottom--sm">
                            <strong>Method</strong>
                          </label>
                          <select
                            className="form-control"
                            value={testMethod}
                            onChange={(e) => setTestMethod(e.target.value)}>
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                            <option value="PATCH">PATCH</option>
                          </select>
                        </div>
                        <div className="col col--9">
                          <label className="margin-bottom--sm">
                            <strong>Endpoint</strong>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="/health"
                            value={testEndpoint}
                            onChange={(e) => setTestEndpoint(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="row margin-bottom--md">
                        <div className="col col--6">
                          <label className="margin-bottom--sm">
                            <strong>Custom Headers (JSON)</strong>
                          </label>
                          <textarea
                            className="form-control"
                            rows={3}
                            placeholder='{"Custom-Header": "value"}'
                            value={testHeaders}
                            onChange={(e) => setTestHeaders(e.target.value)}
                          />
                        </div>
                        <div className="col col--6">
                          {selectedApi.authType === 'api-key' && (
                            <>
                              <label className="margin-bottom--sm">
                                <strong>API Key</strong>
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Enter your API key"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                              />
                              <small className="text--secondary">
                                Test key: {selectedApi.testApiKey}
                              </small>
                            </>
                          )}
                          {selectedApi.authType === 'jwt' && (
                            <>
                              <label className="margin-bottom--sm">
                                <strong>JWT Token</strong>
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Bearer token"
                                value={jwtToken}
                                onChange={(e) => setJwtToken(e.target.value)}
                              />
                              <small className="text--secondary">
                                Use Authentication tab to get token
                              </small>
                            </>
                          )}
                        </div>
                      </div>

                      {testMethod !== 'GET' && (
                        <div className="row margin-bottom--md">
                          <div className="col col--12">
                            <label className="margin-bottom--sm">
                              <strong>Request Body (JSON)</strong>
                            </label>
                            <textarea
                              className="form-control"
                              rows={6}
                              placeholder='{"key": "value"}'
                              value={testBody}
                              onChange={(e) => setTestBody(e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      <div className="row margin-bottom--md">
                        <div className="col col--12">
                          <button
                            className="button button--primary button--lg"
                            onClick={handleApiTest}
                            disabled={isLoading}>
                            {isLoading ? '⏳ Testing...' : '🚀 Send Request'}
                          </button>
                          <a
                            href={sandboxMode 
                              ? `https://sandbox-docs.tekup.org/${selectedApi.name}` 
                              : `http://localhost:${selectedApi.port}/api/docs`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="button button--secondary margin-left--sm">
                            📖 Swagger UI
                          </a>
                          <a
                            href={selectedApi.specUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="button button--outline margin-left--sm">
                            ⬇️ OpenAPI Spec
                          </a>
                        </div>
                      </div>

                      {testResponse && (
                        <div className="row">
                          <div className="col col--12">
                            <div className="margin-bottom--sm">
                              <strong>Response</strong>
                              {responseTime && (
                                <span className="badge badge--success margin-left--sm">
                                  {responseTime}ms
                                </span>
                              )}
                            </div>
                            <pre className="code-block">
                              <code>{testResponse}</code>
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Authentication Tab */}
                  {activeTab === 'auth' && (
                    <div className="padding--md">
                      <h4>Authentication Setup</h4>
                      <p className="text--secondary margin-bottom--md">
                        Configure authentication for {selectedApi.title} ({selectedApi.authType?.toUpperCase()})
                      </p>

                      {selectedApi.authType === 'jwt' && (
                        <div>
                          <div className="row margin-bottom--md">
                            <div className="col col--6">
                              <label className="margin-bottom--sm">
                                <strong>Username</strong>
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                value={loginCredentials.username}
                                onChange={(e) => setLoginCredentials(prev => ({
                                  ...prev,
                                  username: e.target.value
                                }))}
                              />
                            </div>
                            <div className="col col--6">
                              <label className="margin-bottom--sm">
                                <strong>Password</strong>
                              </label>
                              <input
                                type="password"
                                className="form-control"
                                value={loginCredentials.password}
                                onChange={(e) => setLoginCredentials(prev => ({
                                  ...prev,
                                  password: e.target.value
                                }))}
                              />
                            </div>
                          </div>
                          <button
                            className="button button--primary"
                            onClick={handleAuthentication}
                            disabled={isLoading}>
                            {isLoading ? 'Authenticating...' : '🔐 Login & Get Token'}
                          </button>
                          {jwtToken && (
                            <div className="alert alert--success margin-top--md">
                              <strong>✅ Authentication successful!</strong>
                              <br />
                              Token: <code>{jwtToken.substring(0, 50)}...</code>
                            </div>
                          )}
                        </div>
                      )}

                      {selectedApi.authType === 'api-key' && (
                        <div className="alert alert--info">
                          <strong>API Key Authentication</strong>
                          <p>Use the API key in the Test tab. For testing, you can use: <code>{selectedApi.testApiKey}</code></p>
                        </div>
                      )}

                      {selectedApi.authType === 'oauth' && (
                        <div className="alert alert--warning">
                          <strong>OAuth Authentication</strong>
                          <p>OAuth flow is not yet implemented in the sandbox. Please use the production OAuth flow.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Endpoints Documentation Tab */}
                  {activeTab === 'docs' && (
                    <div className="padding--md">
                      <h4>Available Endpoints</h4>
                      <p className="text--secondary margin-bottom--md">
                        {apiEndpoints.length} endpoints available
                      </p>
                      
                      {apiEndpoints.length > 0 ? (
                        <div className="margin-bottom--md">
                          {apiEndpoints.map((endpoint, index) => (
                            <div key={index} className="card margin-bottom--sm">
                              <div className="card__body padding--sm">
                                <div className="margin-bottom--xs">
                                  <span className={`badge badge--${
                                    endpoint.method === 'GET' ? 'success' : 
                                    endpoint.method === 'POST' ? 'primary' : 
                                    endpoint.method === 'PUT' ? 'warning' : 
                                    endpoint.method === 'DELETE' ? 'danger' : 'secondary'
                                  }`}>
                                    {endpoint.method}
                                  </span>
                                  <code className="margin-left--sm">{endpoint.path}</code>
                                  <button
                                    className="button button--sm button--outline margin-left--sm"
                                    onClick={() => {
                                      setTestEndpoint(endpoint.path);
                                      setTestMethod(endpoint.method);
                                      setActiveTab('test');
                                    }}>
                                    Try it
                                  </button>
                                </div>
                                <h6 className="margin-bottom--xs">{endpoint.summary}</h6>
                                {endpoint.description && (
                                  <p className="text--secondary margin-bottom--none">
                                    {endpoint.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="alert alert--info">
                          <p>Loading endpoints from OpenAPI specification...</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Test History Tab */}
                  {activeTab === 'history' && (
                    <div className="padding--md">
                      <h4>Test History</h4>
                      <p className="text--secondary margin-bottom--md">
                        Recent API test results
                      </p>
                      
                      {testHistory.length > 0 ? (
                        <div>
                          {testHistory.map((test) => (
                            <div key={test.id} className="card margin-bottom--sm">
                              <div className="card__body padding--sm">
                                <div className="row">
                                  <div className="col col--8">
                                    <span className={`badge badge--${test.success ? 'success' : 'danger'}`}>
                                      {test.status}
                                    </span>
                                    <span className="badge badge--secondary margin-left--sm">
                                      {test.method}
                                    </span>
                                    <code className="margin-left--sm">{test.endpoint}</code>
                                  </div>
                                  <div className="col col--4 text--right">
                                    <small className="text--secondary">
                                      {test.responseTime}ms • {test.timestamp.toLocaleTimeString()}
                                    </small>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          <button
                            className="button button--outline button--sm"
                            onClick={() => setTestHistory([])}>
                            Clear History
                          </button>
                        </div>
                      ) : (
                        <div className="alert alert--info">
                          <p>No test history yet. Start testing APIs to see results here.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="card__body text--center padding--xl">
                  <h3>🎯 Select an API to get started</h3>
                  <p className="text--secondary">
                    Choose an API from the list on the left to start testing endpoints with live data
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="row margin-top--lg">
          <div className="col col--12">
            <div className="alert alert--info">
              <h4>💡 Interactive API Explorer Features</h4>
              <ul>
                <li><strong>🔒 Secure Sandbox:</strong> Test APIs safely in our sandbox environment</li>
                <li><strong>🔐 Authentication Flows:</strong> Interactive login and token management</li>
                <li><strong>📊 Request Visualization:</strong> See request/response details with timing</li>
                <li><strong>📚 Live Documentation:</strong> Browse endpoints loaded from OpenAPI specs</li>
                <li><strong>📈 Test History:</strong> Track your API testing sessions</li>
                <li><strong>🎯 Code Generation:</strong> Generate code examples for different languages</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}