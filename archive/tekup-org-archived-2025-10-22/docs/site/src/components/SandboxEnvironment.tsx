import React, { useState, useEffect, useCallback } from 'react';
import styles from './SandboxEnvironment.module.css';

interface SandboxConfig {
  apiEndpoint: string;
  apiKey: string;
  environment: 'sandbox' | 'development' | 'production';
  features: string[];
}

interface SandboxEnvironmentProps {
  children: React.ReactNode;
  config?: Partial<SandboxConfig>;
  onConfigChange?: (config: SandboxConfig) => void;
}

const defaultConfig: SandboxConfig = {
  apiEndpoint: 'https://sandbox-api.tekup.org',
  apiKey: 'sandbox-demo-key-12345',
  environment: 'sandbox',
  features: ['api-testing', 'component-preview', 'real-time-updates']
};

export const SandboxEnvironment: React.FC<SandboxEnvironmentProps> = ({
  children,
  config: initialConfig,
  onConfigChange
}) => {
  const [config, setConfig] = useState<SandboxConfig>({
    ...defaultConfig,
    ...initialConfig
  });
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  // Simulate sandbox connection
  const connectToSandbox = useCallback(async () => {
    setConnectionStatus('connecting');
    
    try {
      // Simulate API call to sandbox
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful connection
      setIsConnected(true);
      setConnectionStatus('connected');
      
      console.log('Connected to TekUp Sandbox Environment:', config);
    } catch (error) {
      setIsConnected(false);
      setConnectionStatus('disconnected');
      console.error('Failed to connect to sandbox:', error);
    }
  }, [config]);

  // Auto-connect when config changes
  useEffect(() => {
    if (config.environment === 'sandbox') {
      connectToSandbox();
    }
  }, [config, connectToSandbox]);

  // Notify parent of config changes
  useEffect(() => {
    onConfigChange?.(config);
  }, [config, onConfigChange]);

  const updateConfig = (updates: Partial<SandboxConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const toggleFeature = (feature: string) => {
    setConfig(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  return (
    <div className={styles.sandboxEnvironment}>
      {/* Sandbox Status Bar */}
      <div className={styles.statusBar}>
        <div className={styles.statusInfo}>
          <span className={`${styles.statusIndicator} ${styles[connectionStatus]}`}>
            {connectionStatus === 'connected' && '🟢'}
            {connectionStatus === 'connecting' && '🟡'}
            {connectionStatus === 'disconnected' && '🔴'}
          </span>
          <span className={styles.statusText}>
            Sandbox Environment: {connectionStatus}
          </span>
        </div>
        
        <div className={styles.statusActions}>
          <select
            className={styles.environmentSelect}
            value={config.environment}
            onChange={(e) => updateConfig({ environment: e.target.value as SandboxConfig['environment'] })}>
            <option value="sandbox">Sandbox</option>
            <option value="development">Development</option>
            <option value="production">Production (Read-only)</option>
          </select>
          
          <button
            className="button button--outline button--sm"
            onClick={connectToSandbox}
            disabled={connectionStatus === 'connecting'}>
            {connectionStatus === 'connecting' ? 'Connecting...' : 'Reconnect'}
          </button>
        </div>
      </div>

      {/* Sandbox Configuration Panel */}
      <div className={styles.configPanel}>
        <details className={styles.configDetails}>
          <summary className={styles.configSummary}>
            ⚙️ Sandbox Configuration
          </summary>
          
          <div className={styles.configContent}>
            <div className="row">
              <div className="col col--6">
                <div className="margin-bottom--md">
                  <label className={styles.configLabel}>
                    <strong>API Endpoint</strong>
                  </label>
                  <input
                    type="text"
                    className={styles.configInput}
                    value={config.apiEndpoint}
                    onChange={(e) => updateConfig({ apiEndpoint: e.target.value })}
                    placeholder="https://sandbox-api.tekup.org"
                  />
                </div>
                
                <div className="margin-bottom--md">
                  <label className={styles.configLabel}>
                    <strong>API Key</strong>
                  </label>
                  <input
                    type="password"
                    className={styles.configInput}
                    value={config.apiKey}
                    onChange={(e) => updateConfig({ apiKey: e.target.value })}
                    placeholder="Enter sandbox API key"
                  />
                  <small className="text--secondary">
                    Use 'sandbox-demo-key-12345' for testing
                  </small>
                </div>
              </div>
              
              <div className="col col--6">
                <div className="margin-bottom--md">
                  <label className={styles.configLabel}>
                    <strong>Enabled Features</strong>
                  </label>
                  <div className={styles.featureToggles}>
                    {['api-testing', 'component-preview', 'real-time-updates', 'error-simulation', 'performance-monitoring'].map(feature => (
                      <label key={feature} className={styles.featureToggle}>
                        <input
                          type="checkbox"
                          checked={config.features.includes(feature)}
                          onChange={() => toggleFeature(feature)}
                        />
                        <span className="margin-left--sm">
                          {feature.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="margin-top--md">
              <div className="alert alert--info">
                <strong>🏖️ Sandbox Environment Features:</strong>
                <ul className="margin-top--sm margin-bottom--none">
                  <li><strong>Safe Testing:</strong> All operations are isolated and won't affect production data</li>
                  <li><strong>Mock Data:</strong> Pre-populated with realistic test data for exploration</li>
                  <li><strong>Rate Limiting:</strong> Relaxed rate limits for testing and development</li>
                  <li><strong>Error Simulation:</strong> Trigger specific error scenarios for testing</li>
                  <li><strong>Real-time Updates:</strong> WebSocket connections for live data updates</li>
                </ul>
              </div>
            </div>
          </div>
        </details>
      </div>

      {/* Sandbox Content */}
      <div className={styles.sandboxContent}>
        {isConnected ? (
          <div className={styles.connectedContent}>
            {children}
          </div>
        ) : (
          <div className={styles.disconnectedContent}>
            <div className="text--center padding--xl">
              <h4>🔌 Sandbox Disconnected</h4>
              <p className="text--secondary">
                Connect to the sandbox environment to start testing and exploring TekUp features.
              </p>
              <button
                className="button button--primary"
                onClick={connectToSandbox}
                disabled={connectionStatus === 'connecting'}>
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect to Sandbox'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sandbox Footer */}
      {isConnected && (
        <div className={styles.sandboxFooter}>
          <small className="text--secondary">
            🏖️ Sandbox Mode Active • API: {config.apiEndpoint} • Features: {config.features.length} enabled
          </small>
        </div>
      )}
    </div>
  );
};

export default SandboxEnvironment;