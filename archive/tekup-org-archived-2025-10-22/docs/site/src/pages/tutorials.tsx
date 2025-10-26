import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './tutorials.module.css';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  code?: string;
  component?: React.ReactNode;
  validation?: () => boolean;
  hint?: string;
  resources?: Array<{
    title: string;
    url: string;
    type: 'docs' | 'example' | 'video';
  }>;
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  category: string;
  prerequisites?: string[];
  steps: TutorialStep[];
}

const tutorials: Tutorial[] = [
  {
    id: 'getting-started',
    title: 'Getting Started with TekUp UI',
    description: 'Learn the basics of using TekUp UI components in your React application',
    difficulty: 'beginner',
    estimatedTime: '15 minutes',
    category: 'Basics',
    steps: [
      {
        id: 'installation',
        title: 'Install TekUp UI',
        description: 'First, install the TekUp UI package in your React project',
        code: `npm install @tekup/ui
# or
yarn add @tekup/ui
# or
pnpm add @tekup/ui`,
        hint: 'Make sure you have React 18+ installed in your project',
        resources: [
          {
            title: 'Installation Guide',
            url: '/docs/installation',
            type: 'docs'
          }
        ]
      },
      {
        id: 'import',
        title: 'Import Components',
        description: 'Import the components you need from the TekUp UI library',
        code: `import { Button, Card, Alert } from '@tekup/ui';

function MyComponent() {
  return (
    <div>
      <Button variant="primary">Click me</Button>
    </div>
  );
}`,
        hint: 'You can import individual components or use named imports',
        resources: [
          {
            title: 'Component API Reference',
            url: '/api/components',
            type: 'docs'
          }
        ]
      },
      {
        id: 'basic-usage',
        title: 'Basic Component Usage',
        description: 'Create a simple layout using TekUp UI components',
        code: `import { Button, Card, Alert } from '@tekup/ui';

function Dashboard() {
  const [showAlert, setShowAlert] = useState(false);

  return (
    <div className="container">
      <Card title="Welcome to TekUp" subtitle="Get started with our components">
        <p>This is a basic example of using TekUp UI components.</p>
        
        <Button 
          variant="primary" 
          onClick={() => setShowAlert(true)}
        >
          Show Alert
        </Button>
        
        {showAlert && (
          <Alert 
            type="success" 
            title="Success!"
            dismissible
            onDismiss={() => setShowAlert(false)}
          >
            You've successfully used TekUp UI components!
          </Alert>
        )}
      </Card>
    </div>
  );
}`,
        component: (
          <div className="alert alert--success">
            <strong>Interactive Example:</strong> Try the component playground to see this in action!
          </div>
        ),
        resources: [
          {
            title: 'Component Playground',
            url: '/component-playground',
            type: 'example'
          }
        ]
      }
    ]
  },
  {
    id: 'api-integration',
    title: 'Building an API Integration',
    description: 'Learn how to integrate TekUp APIs with your frontend application',
    difficulty: 'intermediate',
    estimatedTime: '30 minutes',
    category: 'Integration',
    prerequisites: ['Basic React knowledge', 'Understanding of REST APIs'],
    steps: [
      {
        id: 'setup-client',
        title: 'Setup API Client',
        description: 'Configure the TekUp API client for your application',
        code: `import { ApiClient } from '@tekup/api-client';

// Initialize the API client
const apiClient = new ApiClient({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000',
  apiKey: process.env.REACT_APP_API_KEY,
  timeout: 10000
});

export default apiClient;`,
        hint: 'Store your API keys in environment variables for security',
        resources: [
          {
            title: 'API Client Documentation',
            url: '/docs/api-client',
            type: 'docs'
          },
          {
            title: 'Environment Variables Guide',
            url: '/docs/environment-setup',
            type: 'docs'
          }
        ]
      },
      {
        id: 'fetch-data',
        title: 'Fetch Data from API',
        description: 'Create a React hook to fetch data from TekUp APIs',
        code: `import { useState, useEffect } from 'react';
import apiClient from './apiClient';

export function useApiData(endpoint) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await apiClient.get(endpoint);
        setData(response.data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [endpoint]);

  return { data, loading, error };
}`,
        hint: 'This custom hook can be reused across your application',
        resources: [
          {
            title: 'React Hooks Guide',
            url: 'https://reactjs.org/docs/hooks-intro.html',
            type: 'docs'
          }
        ]
      },
      {
        id: 'display-data',
        title: 'Display API Data',
        description: 'Use TekUp UI components to display the fetched data',
        code: `import { Card, Alert, Button } from '@tekup/ui';
import { useApiData } from './hooks/useApiData';

function UserDashboard() {
  const { data: users, loading, error } = useApiData('/api/users');

  if (loading) {
    return (
      <Card>
        <div className="text-center">
          <Button loading disabled>Loading users...</Button>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert type="danger" title="Error loading data">
        {error}
      </Alert>
    );
  }

  return (
    <div>
      <h2>User Dashboard</h2>
      {users?.map(user => (
        <Card key={user.id} title={user.name} subtitle={user.email}>
          <p>Role: {user.role}</p>
          <p>Last login: {new Date(user.lastLogin).toLocaleDateString()}</p>
        </Card>
      ))}
    </div>
  );
}`,
        component: (
          <div className="alert alert--info">
            <strong>Try it out:</strong> Use the API Explorer to test these endpoints first!
          </div>
        ),
        resources: [
          {
            title: 'API Explorer',
            url: '/api-explorer',
            type: 'example'
          }
        ]
      }
    ]
  },
  {
    id: 'advanced-patterns',
    title: 'Advanced Integration Patterns',
    description: 'Learn advanced patterns for building robust applications with TekUp',
    difficulty: 'advanced',
    estimatedTime: '45 minutes',
    category: 'Advanced',
    prerequisites: ['React experience', 'API integration knowledge', 'TypeScript basics'],
    steps: [
      {
        id: 'error-boundaries',
        title: 'Implement Error Boundaries',
        description: 'Create error boundaries to handle component failures gracefully',
        code: `import React from 'react';
import { Alert, Button } from '@tekup/ui';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send error to monitoring service
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert type="danger" title="Something went wrong">
          <p>An unexpected error occurred. Please try refreshing the page.</p>
          <Button 
            variant="outline" 
            onClick={() => this.setState({ hasError: false })}
          >
            Try Again
          </Button>
        </Alert>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;`,
        hint: 'Wrap your main components with error boundaries for better user experience',
        resources: [
          {
            title: 'Error Boundaries Documentation',
            url: 'https://reactjs.org/docs/error-boundaries.html',
            type: 'docs'
          }
        ]
      },
      {
        id: 'websocket-integration',
        title: 'Real-time WebSocket Integration',
        description: 'Implement real-time features using WebSocket connections',
        code: `import { useState, useEffect, useCallback } from 'react';
import { Alert, Badge } from '@tekup/ui';

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
}

export function useWebSocket(url: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  useEffect(() => {
    const ws = new WebSocket(url);
    
    ws.onopen = () => {
      setConnectionStatus('connected');
      setSocket(ws);
    };
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setLastMessage(message);
    };
    
    ws.onclose = () => {
      setConnectionStatus('disconnected');
      setSocket(null);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('disconnected');
    };

    return () => {
      ws.close();
    };
  }, [url]);

  const sendMessage = useCallback((message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }, [socket]);

  return { connectionStatus, lastMessage, sendMessage };
}

// Usage in component
function RealTimeNotifications() {
  const { connectionStatus, lastMessage } = useWebSocket('ws://localhost:4000/ws');

  return (
    <div>
      <div className="margin-bottom--md">
        <Badge variant={connectionStatus === 'connected' ? 'success' : 'danger'}>
          {connectionStatus}
        </Badge>
      </div>
      
      {lastMessage && (
        <Alert type="info" title="New Message">
          {JSON.stringify(lastMessage.payload, null, 2)}
        </Alert>
      )}
    </div>
  );
}`,
        hint: 'WebSocket connections should be managed carefully to avoid memory leaks',
        resources: [
          {
            title: 'WebSocket Integration Guide',
            url: '/docs/websocket-integration',
            type: 'docs'
          }
        ]
      }
    ]
  }
];

export default function Tutorials(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Filter tutorials
  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesSearch = tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tutorial.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'all' || tutorial.difficulty === filterDifficulty;
    const matchesCategory = filterCategory === 'all' || tutorial.category === filterCategory;
    
    return matchesSearch && matchesDifficulty && matchesCategory;
  });

  // Get unique categories and difficulties
  const categories = [...new Set(tutorials.map(t => t.category))];
  const difficulties = [...new Set(tutorials.map(t => t.difficulty))];

  const markStepComplete = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  };

  const resetTutorial = () => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
  };

  const nextStep = () => {
    if (selectedTutorial && currentStep < selectedTutorial.steps.length - 1) {
      const currentStepId = selectedTutorial.steps[currentStep].id;
      markStepComplete(currentStepId);
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const progress = selectedTutorial ? (completedSteps.size / selectedTutorial.steps.length) * 100 : 0;

  return (
    <Layout
      title="Interactive Tutorials"
      description="Step-by-step interactive tutorials for learning TekUp platform development">
      <div className="container margin-vert--lg">
        <div className="row">
          <div className="col col--12">
            <h1>📚 Interactive Tutorials</h1>
            <p className="lead">
              Learn TekUp platform development with hands-on, step-by-step tutorials. 
              Each tutorial includes interactive examples, code snippets, and practical exercises.
            </p>
          </div>
        </div>

        {!selectedTutorial ? (
          <>
            {/* Filters */}
            <div className="row margin-top--lg">
              <div className="col col--12">
                <div className="card">
                  <div className="card__body">
                    <div className="row">
                      <div className="col col--4">
                        <input
                          type="text"
                          className={styles.searchInput}
                          placeholder="Search tutorials..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <div className="col col--4">
                        <select
                          className={styles.filterSelect}
                          value={filterDifficulty}
                          onChange={(e) => setFilterDifficulty(e.target.value)}>
                          <option value="all">All Difficulties</option>
                          {difficulties.map(difficulty => (
                            <option key={difficulty} value={difficulty}>
                              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col col--4">
                        <select
                          className={styles.filterSelect}
                          value={filterCategory}
                          onChange={(e) => setFilterCategory(e.target.value)}>
                          <option value="all">All Categories</option>
                          {categories.map(category => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tutorial Grid */}
            <div className="row margin-top--lg">
              {filteredTutorials.map((tutorial) => (
                <div key={tutorial.id} className="col col--6 margin-bottom--lg">
                  <div className={`card ${styles.tutorialCard}`} onClick={() => setSelectedTutorial(tutorial)}>
                    <div className="card__header">
                      <div className="row">
                        <div className="col col--8">
                          <h3>{tutorial.title}</h3>
                        </div>
                        <div className="col col--4 text--right">
                          <span className={`badge badge--${
                            tutorial.difficulty === 'beginner' ? 'success' : 
                            tutorial.difficulty === 'intermediate' ? 'warning' : 'danger'
                          }`}>
                            {tutorial.difficulty}
                          </span>
                        </div>
                      </div>
                      <p className="text--secondary margin-bottom--sm">{tutorial.description}</p>
                      <div className="margin-bottom--sm">
                        <small className="text--secondary">
                          ⏱️ {tutorial.estimatedTime} • 📂 {tutorial.category} • 📝 {tutorial.steps.length} steps
                        </small>
                      </div>
                    </div>
                    <div className="card__body">
                      {tutorial.prerequisites && (
                        <div className="margin-bottom--md">
                          <strong>Prerequisites:</strong>
                          <ul className="margin-top--sm">
                            {tutorial.prerequisites.map((prereq, index) => (
                              <li key={index}>{prereq}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <button className="button button--primary button--block">
                        Start Tutorial →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredTutorials.length === 0 && (
              <div className="row margin-top--lg">
                <div className="col col--12">
                  <div className="alert alert--info text--center">
                    <h4>No tutorials found</h4>
                    <p>Try adjusting your search criteria or filters.</p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Tutorial View */
          <div className="row margin-top--lg">
            <div className="col col--3">
              {/* Tutorial Navigation */}
              <div className="card">
                <div className="card__header">
                  <button
                    className="button button--outline button--sm"
                    onClick={() => setSelectedTutorial(null)}>
                    ← Back to Tutorials
                  </button>
                  <h4 className="margin-top--sm">{selectedTutorial.title}</h4>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill} 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <small className="text--secondary">
                    {completedSteps.size} of {selectedTutorial.steps.length} steps completed
                  </small>
                </div>
                <div className="card__body">
                  <div className={styles.stepList}>
                    {selectedTutorial.steps.map((step, index) => (
                      <div
                        key={step.id}
                        className={`${styles.stepItem} ${
                          index === currentStep ? styles.stepItemActive : ''
                        } ${
                          completedSteps.has(step.id) ? styles.stepItemCompleted : ''
                        }`}
                        onClick={() => goToStep(index)}>
                        <div className={styles.stepNumber}>
                          {completedSteps.has(step.id) ? '✓' : index + 1}
                        </div>
                        <div className={styles.stepTitle}>
                          {step.title}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="margin-top--md">
                    <button
                      className="button button--outline button--sm button--block"
                      onClick={resetTutorial}>
                      🔄 Reset Tutorial
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="col col--9">
              {/* Current Step Content */}
              <div className="card">
                <div className="card__header">
                  <div className="row">
                    <div className="col col--8">
                      <h3>
                        Step {currentStep + 1}: {selectedTutorial.steps[currentStep].title}
                      </h3>
                    </div>
                    <div className="col col--4 text--right">
                      <span className="badge badge--secondary">
                        {currentStep + 1} / {selectedTutorial.steps.length}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="card__body">
                  <p className="lead margin-bottom--lg">
                    {selectedTutorial.steps[currentStep].description}
                  </p>

                  {selectedTutorial.steps[currentStep].code && (
                    <div className="margin-bottom--lg">
                      <h5>Code Example</h5>
                      <pre className={styles.codeBlock}>
                        <code>{selectedTutorial.steps[currentStep].code}</code>
                      </pre>
                      <button
                        className="button button--outline button--sm margin-top--sm"
                        onClick={() => navigator.clipboard.writeText(selectedTutorial.steps[currentStep].code || '')}>
                        📋 Copy Code
                      </button>
                    </div>
                  )}

                  {selectedTutorial.steps[currentStep].component && (
                    <div className="margin-bottom--lg">
                      <h5>Interactive Example</h5>
                      <div className={styles.interactiveExample}>
                        {selectedTutorial.steps[currentStep].component}
                      </div>
                    </div>
                  )}

                  {selectedTutorial.steps[currentStep].hint && (
                    <div className="alert alert--info margin-bottom--lg">
                      <strong>💡 Hint:</strong> {selectedTutorial.steps[currentStep].hint}
                    </div>
                  )}

                  {selectedTutorial.steps[currentStep].resources && (
                    <div className="margin-bottom--lg">
                      <h5>Additional Resources</h5>
                      <ul>
                        {selectedTutorial.steps[currentStep].resources!.map((resource, index) => (
                          <li key={index}>
                            <a href={resource.url} target="_blank" rel="noopener noreferrer">
                              {resource.type === 'docs' && '📖'}
                              {resource.type === 'example' && '🔗'}
                              {resource.type === 'video' && '🎥'}
                              {' '}{resource.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="row">
                    <div className="col col--6">
                      {currentStep > 0 && (
                        <button
                          className="button button--outline"
                          onClick={prevStep}>
                          ← Previous Step
                        </button>
                      )}
                    </div>
                    <div className="col col--6 text--right">
                      {currentStep < selectedTutorial.steps.length - 1 ? (
                        <button
                          className="button button--primary"
                          onClick={nextStep}>
                          Next Step →
                        </button>
                      ) : (
                        <button
                          className="button button--success"
                          onClick={() => {
                            markStepComplete(selectedTutorial.steps[currentStep].id);
                            alert('🎉 Tutorial completed! Great job!');
                          }}>
                          Complete Tutorial ✓
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="row margin-top--lg">
          <div className="col col--12">
            <div className="alert alert--info">
              <h4>📚 Interactive Tutorial Features</h4>
              <ul>
                <li><strong>🎯 Step-by-step Learning:</strong> Structured progression through complex topics</li>
                <li><strong>💻 Live Code Examples:</strong> Copy-paste ready code snippets</li>
                <li><strong>🔗 Interactive Components:</strong> See components in action</li>
                <li><strong>📊 Progress Tracking:</strong> Visual progress indicators and completion status</li>
                <li><strong>🔍 Smart Filtering:</strong> Find tutorials by difficulty, category, or topic</li>
                <li><strong>📖 Additional Resources:</strong> Links to documentation and examples</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}