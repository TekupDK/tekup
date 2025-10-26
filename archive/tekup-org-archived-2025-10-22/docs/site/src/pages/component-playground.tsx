import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './component-playground.module.css';

// Mock @tekup/ui components for demonstration
const TekUpButton: React.FC<{
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}> = ({ variant = 'primary', size = 'md', disabled = false, loading = false, children, onClick }) => {
  const baseClasses = 'button';
  const variantClasses = {
    primary: 'button--primary',
    secondary: 'button--secondary',
    outline: 'button--outline',
    ghost: 'button--link'
  };
  const sizeClasses = {
    sm: 'button--sm',
    md: '',
    lg: 'button--lg'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      disabled={disabled || loading}
      onClick={onClick}>
      {loading && <span className={styles.spinner}>⏳</span>}
      {children}
    </button>
  );
};

const TekUpCard: React.FC<{
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  hoverable?: boolean;
  bordered?: boolean;
}> = ({ title, subtitle, children, hoverable = false, bordered = true }) => {
  return (
    <div className={`card ${hoverable ? styles.cardHoverable : ''} ${!bordered ? styles.cardBorderless : ''}`}>
      {(title || subtitle) && (
        <div className="card__header">
          {title && <h3>{title}</h3>}
          {subtitle && <p className="text--secondary">{subtitle}</p>}
        </div>
      )}
      <div className="card__body">
        {children}
      </div>
    </div>
  );
};

const TekUpAlert: React.FC<{
  type?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}> = ({ type = 'info', title, children, dismissible = false, onDismiss }) => {
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed) return null;

  return (
    <div className={`alert alert--${type}`}>
      <div className="alert__content">
        {title && <h4>{title}</h4>}
        {children}
      </div>
      {dismissible && (
        <button className="alert__close" onClick={handleDismiss}>
          ×
        </button>
      )}
    </div>
  );
};

const TekUpBadge: React.FC<{
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}> = ({ variant = 'primary', size = 'md', children }) => {
  return (
    <span className={`badge badge--${variant} ${size === 'sm' ? styles.badgeSm : size === 'lg' ? styles.badgeLg : ''}`}>
      {children}
    </span>
  );
};

interface ComponentExample {
  name: string;
  description: string;
  category: string;
  component: React.ComponentType<any>;
  props: Array<{
    name: string;
    type: string;
    default?: any;
    description: string;
    options?: any[];
  }>;
  examples: Array<{
    title: string;
    description: string;
    code: string;
    props: Record<string, any>;
  }>;
}

const componentExamples: ComponentExample[] = [
  {
    name: 'Button',
    description: 'Interactive button component with multiple variants and states',
    category: 'Form Controls',
    component: TekUpButton,
    props: [
      {
        name: 'variant',
        type: 'string',
        default: 'primary',
        description: 'Button style variant',
        options: ['primary', 'secondary', 'outline', 'ghost']
      },
      {
        name: 'size',
        type: 'string',
        default: 'md',
        description: 'Button size',
        options: ['sm', 'md', 'lg']
      },
      {
        name: 'disabled',
        type: 'boolean',
        default: false,
        description: 'Disable the button'
      },
      {
        name: 'loading',
        type: 'boolean',
        default: false,
        description: 'Show loading state'
      }
    ],
    examples: [
      {
        title: 'Primary Button',
        description: 'Default primary button style',
        code: '<TekUpButton variant="primary">Click me</TekUpButton>',
        props: { variant: 'primary', children: 'Click me' }
      },
      {
        title: 'Loading State',
        description: 'Button with loading indicator',
        code: '<TekUpButton loading={true}>Loading...</TekUpButton>',
        props: { loading: true, children: 'Loading...' }
      },
      {
        title: 'Large Outline',
        description: 'Large outline button variant',
        code: '<TekUpButton variant="outline" size="lg">Large Button</TekUpButton>',
        props: { variant: 'outline', size: 'lg', children: 'Large Button' }
      }
    ]
  },
  {
    name: 'Card',
    description: 'Flexible content container with optional header and interactive states',
    category: 'Layout',
    component: TekUpCard,
    props: [
      {
        name: 'title',
        type: 'string',
        description: 'Card title'
      },
      {
        name: 'subtitle',
        type: 'string',
        description: 'Card subtitle'
      },
      {
        name: 'hoverable',
        type: 'boolean',
        default: false,
        description: 'Enable hover effects'
      },
      {
        name: 'bordered',
        type: 'boolean',
        default: true,
        description: 'Show card border'
      }
    ],
    examples: [
      {
        title: 'Basic Card',
        description: 'Simple card with content',
        code: '<TekUpCard>Card content goes here</TekUpCard>',
        props: { children: 'Card content goes here' }
      },
      {
        title: 'Card with Header',
        description: 'Card with title and subtitle',
        code: '<TekUpCard title="Card Title" subtitle="Card subtitle">Content</TekUpCard>',
        props: { title: 'Card Title', subtitle: 'Card subtitle', children: 'Content' }
      },
      {
        title: 'Hoverable Card',
        description: 'Interactive card with hover effects',
        code: '<TekUpCard hoverable={true}>Hover over me!</TekUpCard>',
        props: { hoverable: true, children: 'Hover over me!' }
      }
    ]
  },
  {
    name: 'Alert',
    description: 'Contextual feedback messages with different severity levels',
    category: 'Feedback',
    component: TekUpAlert,
    props: [
      {
        name: 'type',
        type: 'string',
        default: 'info',
        description: 'Alert type/severity',
        options: ['info', 'success', 'warning', 'danger']
      },
      {
        name: 'title',
        type: 'string',
        description: 'Alert title'
      },
      {
        name: 'dismissible',
        type: 'boolean',
        default: false,
        description: 'Allow dismissing the alert'
      }
    ],
    examples: [
      {
        title: 'Info Alert',
        description: 'Informational message',
        code: '<TekUpAlert type="info">This is an info message</TekUpAlert>',
        props: { type: 'info', children: 'This is an info message' }
      },
      {
        title: 'Success with Title',
        description: 'Success message with title',
        code: '<TekUpAlert type="success" title="Success!">Operation completed</TekUpAlert>',
        props: { type: 'success', title: 'Success!', children: 'Operation completed' }
      },
      {
        title: 'Dismissible Warning',
        description: 'Warning that can be dismissed',
        code: '<TekUpAlert type="warning" dismissible={true}>Warning message</TekUpAlert>',
        props: { type: 'warning', dismissible: true, children: 'Warning message' }
      }
    ]
  },
  {
    name: 'Badge',
    description: 'Small status indicators and labels',
    category: 'Data Display',
    component: TekUpBadge,
    props: [
      {
        name: 'variant',
        type: 'string',
        default: 'primary',
        description: 'Badge color variant',
        options: ['primary', 'secondary', 'success', 'warning', 'danger']
      },
      {
        name: 'size',
        type: 'string',
        default: 'md',
        description: 'Badge size',
        options: ['sm', 'md', 'lg']
      }
    ],
    examples: [
      {
        title: 'Status Badge',
        description: 'Primary status badge',
        code: '<TekUpBadge variant="primary">Active</TekUpBadge>',
        props: { variant: 'primary', children: 'Active' }
      },
      {
        title: 'Success Badge',
        description: 'Success indicator',
        code: '<TekUpBadge variant="success">Completed</TekUpBadge>',
        props: { variant: 'success', children: 'Completed' }
      },
      {
        title: 'Large Warning',
        description: 'Large warning badge',
        code: '<TekUpBadge variant="warning" size="lg">Warning</TekUpBadge>',
        props: { variant: 'warning', size: 'lg', children: 'Warning' }
      }
    ]
  }
];

export default function ComponentPlayground(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  const [selectedComponent, setSelectedComponent] = useState<ComponentExample | null>(null);
  const [selectedExample, setSelectedExample] = useState<number>(0);
  const [customProps, setCustomProps] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'props'>('preview');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter components based on search
  const filteredComponents = useMemo(() => {
    if (!searchTerm) return componentExamples;
    return componentExamples.filter(comp =>
      comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  // Group components by category
  const groupedComponents = useMemo(() => {
    return filteredComponents.reduce((acc, comp) => {
      if (!acc[comp.category]) {
        acc[comp.category] = [];
      }
      acc[comp.category].push(comp);
      return acc;
    }, {} as Record<string, ComponentExample[]>);
  }, [filteredComponents]);

  // Initialize custom props when component changes
  useEffect(() => {
    if (selectedComponent) {
      const initialProps: Record<string, any> = {};
      selectedComponent.props.forEach(prop => {
        if (prop.default !== undefined) {
          initialProps[prop.name] = prop.default;
        }
      });
      setCustomProps(initialProps);
      setSelectedExample(0);
    }
  }, [selectedComponent]);

  // Render component with current props
  const renderComponent = () => {
    if (!selectedComponent) return null;

    const Component = selectedComponent.component;
    const example = selectedComponent.examples[selectedExample];
    const props = activeTab === 'props' ? customProps : example.props;

    try {
      return <Component {...props} />;
    } catch (error) {
      return (
        <div className="alert alert--danger">
          <strong>Render Error:</strong> {error.message}
        </div>
      );
    }
  };

  // Generate code string for current props
  const generateCode = () => {
    if (!selectedComponent) return '';

    const props = activeTab === 'props' ? customProps : selectedComponent.examples[selectedExample].props;
    const propsString = Object.entries(props)
      .filter(([key, value]) => key !== 'children')
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return `${key}="${value}"`;
        } else if (typeof value === 'boolean') {
          return value ? key : `${key}={false}`;
        } else {
          return `${key}={${JSON.stringify(value)}}`;
        }
      })
      .join(' ');

    const children = props.children;
    const componentName = `TekUp${selectedComponent.name}`;

    if (children) {
      return `<${componentName}${propsString ? ' ' + propsString : ''}>${children}</${componentName}>`;
    } else {
      return `<${componentName}${propsString ? ' ' + propsString : ''} />`;
    }
  };

  return (
    <Layout
      title="Component Playground"
      description="Interactive playground for TekUp UI components with live examples and code generation">
      <div className="container margin-vert--lg">
        <div className="row">
          <div className="col col--12">
            <h1>🎨 Component Playground</h1>
            <p className="lead">
              Explore and test TekUp UI components interactively. Modify props, see live previews, 
              and generate code examples for your applications.
            </p>
          </div>
        </div>

        <div className="row margin-top--lg">
          <div className="col col--4">
            <div className="card">
              <div className="card__header">
                <h3>Components</h3>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search components..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="card__body">
                {Object.entries(groupedComponents).map(([category, components]) => (
                  <div key={category} className="margin-bottom--md">
                    <h4 className="margin-bottom--sm">{category}</h4>
                    {components.map((component) => (
                      <div
                        key={component.name}
                        className={`${styles.componentItem} ${
                          selectedComponent?.name === component.name ? styles.componentItemSelected : ''
                        }`}
                        onClick={() => setSelectedComponent(component)}>
                        <h5 className="margin-bottom--xs">{component.name}</h5>
                        <p className="margin-bottom--none text--secondary">
                          {component.description}
                        </p>
                      </div>
                    ))}
                  </div>
                ))}
                
                {filteredComponents.length === 0 && (
                  <div className="text--center padding--md">
                    <p className="text--secondary">No components found matching "{searchTerm}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col col--8">
            {selectedComponent ? (
              <div className="card">
                <div className="card__header">
                  <h3>{selectedComponent.name}</h3>
                  <p className="margin-bottom--none text--secondary">
                    {selectedComponent.description}
                  </p>
                </div>

                {/* Tab Navigation */}
                <div className="card__body padding--none">
                  <div className="tabs">
                    <ul className="tabs__list" role="tablist">
                      <li className={`tabs__item ${activeTab === 'preview' ? 'tabs__item--active' : ''}`}>
                        <button
                          className="tabs__link"
                          onClick={() => setActiveTab('preview')}
                          role="tab">
                          👁️ Preview
                        </button>
                      </li>
                      <li className={`tabs__item ${activeTab === 'code' ? 'tabs__item--active' : ''}`}>
                        <button
                          className="tabs__link"
                          onClick={() => setActiveTab('code')}
                          role="tab">
                          💻 Code
                        </button>
                      </li>
                      <li className={`tabs__item ${activeTab === 'props' ? 'tabs__item--active' : ''}`}>
                        <button
                          className="tabs__link"
                          onClick={() => setActiveTab('props')}
                          role="tab">
                          ⚙️ Props
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Preview Tab */}
                  {activeTab === 'preview' && (
                    <div className="padding--md">
                      <div className="margin-bottom--md">
                        <h4>Examples</h4>
                        <div className={styles.exampleTabs}>
                          {selectedComponent.examples.map((example, index) => (
                            <button
                              key={index}
                              className={`button button--sm ${
                                selectedExample === index ? 'button--primary' : 'button--outline'
                              }`}
                              onClick={() => setSelectedExample(index)}>
                              {example.title}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className={styles.previewArea}>
                        <div className="margin-bottom--sm">
                          <strong>Live Preview</strong>
                          <p className="text--secondary margin-bottom--md">
                            {selectedComponent.examples[selectedExample].description}
                          </p>
                        </div>
                        <div className={styles.componentPreview}>
                          {renderComponent()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Code Tab */}
                  {activeTab === 'code' && (
                    <div className="padding--md">
                      <div className="margin-bottom--md">
                        <h4>Generated Code</h4>
                        <p className="text--secondary">
                          Copy this code to use the component in your application
                        </p>
                      </div>
                      
                      <pre className={styles.codeBlock}>
                        <code>{generateCode()}</code>
                      </pre>

                      <div className="margin-top--md">
                        <button
                          className="button button--primary button--sm"
                          onClick={() => navigator.clipboard.writeText(generateCode())}>
                          📋 Copy Code
                        </button>
                      </div>

                      <div className="margin-top--lg">
                        <h5>Import Statement</h5>
                        <pre className={styles.codeBlock}>
                          <code>{`import { ${selectedComponent.name} } from '@tekup/ui';`}</code>
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Props Tab */}
                  {activeTab === 'props' && (
                    <div className="padding--md">
                      <div className="margin-bottom--md">
                        <h4>Component Props</h4>
                        <p className="text--secondary">
                          Modify props to see how they affect the component
                        </p>
                      </div>

                      <div className="row">
                        <div className="col col--6">
                          {selectedComponent.props.map((prop) => (
                            <div key={prop.name} className="margin-bottom--md">
                              <label className="margin-bottom--sm">
                                <strong>{prop.name}</strong>
                                <span className="text--secondary"> ({prop.type})</span>
                              </label>
                              <p className="text--secondary margin-bottom--sm">
                                {prop.description}
                              </p>
                              
                              {prop.options ? (
                                <select
                                  className={styles.propInput}
                                  value={customProps[prop.name] || prop.default || ''}
                                  onChange={(e) => setCustomProps(prev => ({
                                    ...prev,
                                    [prop.name]: e.target.value
                                  }))}>
                                  {prop.options.map(option => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              ) : prop.type === 'boolean' ? (
                                <label className={styles.checkboxLabel}>
                                  <input
                                    type="checkbox"
                                    checked={customProps[prop.name] || false}
                                    onChange={(e) => setCustomProps(prev => ({
                                      ...prev,
                                      [prop.name]: e.target.checked
                                    }))}
                                  />
                                  <span className="margin-left--sm">
                                    {customProps[prop.name] ? 'true' : 'false'}
                                  </span>
                                </label>
                              ) : (
                                <input
                                  type="text"
                                  className={styles.propInput}
                                  value={customProps[prop.name] || ''}
                                  placeholder={prop.default?.toString() || `Enter ${prop.name}`}
                                  onChange={(e) => setCustomProps(prev => ({
                                    ...prev,
                                    [prop.name]: e.target.value
                                  }))}
                                />
                              )}
                            </div>
                          ))}

                          <div className="margin-bottom--md">
                            <label className="margin-bottom--sm">
                              <strong>children</strong>
                              <span className="text--secondary"> (ReactNode)</span>
                            </label>
                            <textarea
                              className={styles.propInput}
                              rows={3}
                              value={customProps.children || ''}
                              placeholder="Component content"
                              onChange={(e) => setCustomProps(prev => ({
                                ...prev,
                                children: e.target.value
                              }))}
                            />
                          </div>
                        </div>

                        <div className="col col--6">
                          <div className={styles.previewArea}>
                            <div className="margin-bottom--sm">
                              <strong>Live Preview</strong>
                            </div>
                            <div className={styles.componentPreview}>
                              {renderComponent()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="card__body text--center padding--xl">
                  <h3>🎯 Select a component to explore</h3>
                  <p className="text--secondary">
                    Choose a component from the list on the left to see live examples, 
                    modify props, and generate code snippets.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="row margin-top--lg">
          <div className="col col--12">
            <div className="alert alert--info">
              <h4>🎨 Component Playground Features</h4>
              <ul>
                <li><strong>🔍 Interactive Search:</strong> Find components quickly by name, description, or category</li>
                <li><strong>👁️ Live Preview:</strong> See components render in real-time as you modify props</li>
                <li><strong>💻 Code Generation:</strong> Get ready-to-use code snippets with current prop values</li>
                <li><strong>⚙️ Props Editor:</strong> Modify component properties with intuitive form controls</li>
                <li><strong>📚 Multiple Examples:</strong> Explore different use cases and configurations</li>
                <li><strong>📋 Copy to Clipboard:</strong> Easily copy generated code to your projects</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}