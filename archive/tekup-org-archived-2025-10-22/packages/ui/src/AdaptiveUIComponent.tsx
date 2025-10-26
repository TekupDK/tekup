import React, { useEffect, useState, useRef } from 'react';
import { AdaptiveUI } from './AdaptiveUI';
import { UILayout, UIComponent } from './AdaptiveUI';

interface AdaptiveUIComponentProps {
  initialLayout?: UILayout;
  autoEvolve?: boolean;
  evolutionInterval?: number;
  showMetrics?: boolean;
  showControls?: boolean;
}

export const AdaptiveUIComponent: React.FC<AdaptiveUIComponentProps> = ({
import { createLogger } from '@tekup/shared';
const logger = createLogger('packages-ui-src-AdaptiveUIComp');

  initialLayout,
  autoEvolve = true,
  evolutionInterval = 30000, // 30 seconds
  showMetrics = true,
  showControls = true
}) => {
  const [adaptiveUI] = useState(() => new AdaptiveUI());
  const [currentLayout, setCurrentLayout] = useState<UILayout | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [evolutionCount, setEvolutionCount] = useState(0);
  const [metrics, setMetrics] = useState<any>(null);
  const [testResults, setTestResults] = useState<any[]>([]);
  const evolutionTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize with default or provided layout
    const layout = initialLayout || adaptiveUI.getCurrentLayout();
    setCurrentLayout(layout);

    // Start behavior tracking
    startTracking();

    // Setup auto-evolution if enabled
    if (autoEvolve) {
      setupAutoEvolution();
    }

    return () => {
      stopTracking();
      if (evolutionTimerRef.current) {
        clearInterval(evolutionTimerRef.current);
      }
    };
  }, []);

  const startTracking = () => {
    // In a real implementation, this would start the BehaviorTracker
    setIsTracking(true);
    logger.info('Behavior tracking started');
  };

  const stopTracking = () => {
    setIsTracking(false);
    logger.info('Behavior tracking stopped');
  };

  const setupAutoEvolution = () => {
    evolutionTimerRef.current = setInterval(() => {
      evolveInterface();
    }, evolutionInterval);
  };

  const evolveInterface = () => {
    try {
      adaptiveUI.evolveInterface();
      const newLayout = adaptiveUI.getCurrentLayout();
      setCurrentLayout(newLayout);
      setEvolutionCount(prev => prev + 1);
      
      // Get updated metrics
      const newMetrics = adaptiveUI.testVariations();
      setMetrics(newMetrics);
      
      logger.info('Interface evolved:', newLayout.id);
    } catch (error) {
      logger.error('Error evolving interface:', error);
    }
  };

  const generateNewLayout = () => {
    try {
      const newLayout = adaptiveUI.generateOptimalLayout();
      setCurrentLayout(newLayout);
      logger.info('New layout generated:', newLayout.id);
    } catch (error) {
      logger.error('Error generating layout:', error);
    }
  };

  const runABTest = () => {
    try {
      const results = adaptiveUI.testVariations();
      setTestResults(results);
      logger.info('A/B test completed:', results);
    } catch (error) {
      logger.error('Error running A/B test:', error);
    }
  };

  const renderComponent = (component: UIComponent) => {
    const style = {
      position: 'absolute' as const,
      left: `${component.position.x}%`,
      top: `${component.position.y}%`,
      width: `${component.size.width}%`,
      height: `${component.size.height}%`,
      backgroundColor: currentLayout?.styling.colors.surface || '#f8fafc',
      border: `1px solid ${currentLayout?.styling.colors.secondary || '#64748b'}`,
      borderRadius: '8px',
      padding: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: currentLayout?.styling.typography.fontSize.small || '0.875rem',
      fontFamily: currentLayout?.styling.typography.fontFamily || 'Inter, sans-serif',
      transition: 'all 0.3s ease-in-out'
    };

    const renderContent = () => {
      switch (component.type) {
        case 'button':
          return (
            <button
              style={{
                ...style,
                backgroundColor: currentLayout?.styling.colors.primary || '#3b82f6',
                color: 'white',
                border: 'none',
                cursor: 'pointer'
              }}
              onClick={() => logger.info(`Clicked ${component.id}`)}
            >
              {component.properties.text || component.id}
            </button>
          );
        
        case 'navigation':
          return (
            <div style={style}>
              <strong>{component.properties.title || component.id}</strong>
            </div>
          );
        
        case 'content':
          return (
            <div style={style}>
              {component.properties.content || component.id}
            </div>
          );
        
        case 'input':
          return (
            <input
              type="text"
              placeholder={component.properties.placeholder || component.id}
              style={style}
            />
          );
        
        case 'card':
          return (
            <div style={style}>
              <h3>{component.properties.title || component.id}</h3>
              <p>{component.properties.description || 'Card content'}</p>
            </div>
          );
        
        default:
          return (
            <div style={style}>
              {component.id}
            </div>
          );
      }
    };

    return (
      <div key={component.id} style={style}>
        {renderContent()}
      </div>
    );
  };

  if (!currentLayout) {
    return <div>Loading Adaptive UI...</div>;
  }

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      height: '100vh',
      backgroundColor: currentLayout.styling.colors.background,
      fontFamily: currentLayout.styling.typography.fontFamily,
      color: currentLayout.styling.colors.text
    }}>
      {/* Header */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        backgroundColor: currentLayout.styling.colors.surface,
        borderBottom: `1px solid ${currentLayout.styling.colors.secondary}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 100
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: currentLayout.styling.typography.fontSize.large,
          fontWeight: currentLayout.styling.typography.fontWeight.bold
        }}>
          Adaptive UI Demo
        </h1>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem' }}>
            Evolution: {evolutionCount}
          </span>
          <span style={{ 
            fontSize: '0.875rem',
            color: isTracking ? '#10b981' : '#ef4444'
          }}>
            {isTracking ? '● Tracking' : '○ Stopped'}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        position: 'absolute',
        top: '60px',
        left: 0,
        right: 0,
        bottom: showMetrics ? '200px' : 0,
        position: 'relative'
      }}>
        {currentLayout.components.map(renderComponent)}
      </div>

      {/* Controls Panel */}
      {showControls && (
        <div style={{
          position: 'absolute',
          bottom: showMetrics ? '200px' : 0,
          left: 0,
          right: 0,
          height: '60px',
          backgroundColor: currentLayout.styling.colors.surface,
          borderTop: `1px solid ${currentLayout.styling.colors.secondary}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px'
        }}>
          <button
            onClick={evolveInterface}
            style={{
              padding: '8px 16px',
              backgroundColor: currentLayout.styling.colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: currentLayout.styling.typography.fontSize.small
            }}
          >
            Evolve Interface
          </button>
          
          <button
            onClick={generateNewLayout}
            style={{
              padding: '8px 16px',
              backgroundColor: currentLayout.styling.colors.accent,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: currentLayout.styling.typography.fontSize.small
            }}
          >
            Generate New Layout
          </button>
          
          <button
            onClick={runABTest}
            style={{
              padding: '8px 16px',
              backgroundColor: currentLayout.styling.colors.secondary,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: currentLayout.styling.typography.fontSize.small
            }}
          >
            Run A/B Test
          </button>
          
          <button
            onClick={() => setIsTracking(!isTracking)}
            style={{
              padding: '8px 16px',
              backgroundColor: isTracking ? '#ef4444' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: currentLayout.styling.typography.fontSize.small
            }}
          >
            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </button>
        </div>
      )}

      {/* Metrics Panel */}
      {showMetrics && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '200px',
          backgroundColor: currentLayout.styling.colors.surface,
          borderTop: `1px solid ${currentLayout.styling.colors.secondary}`,
          padding: '20px',
          overflow: 'auto'
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: currentLayout.styling.typography.fontSize.base }}>
            Performance Metrics & Test Results
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Current Metrics */}
            <div>
              <h4 style={{ margin: '0 0 10px 0', fontSize: currentLayout.styling.typography.fontSize.small }}>
                Current Layout Metrics
              </h4>
              {metrics && (
                <div style={{ fontSize: '0.875rem' }}>
                  <div>Load Time: {metrics.loadTime?.toFixed(2)}ms</div>
                  <div>Render Time: {metrics.renderTime?.toFixed(2)}ms</div>
                  <div>Interaction Latency: {metrics.interactionLatency?.toFixed(2)}ms</div>
                  <div>User Satisfaction: {(metrics.userSatisfaction * 100).toFixed(1)}%</div>
                  <div>Conversion Rate: {(metrics.conversionRate * 100).toFixed(1)}%</div>
                </div>
              )}
            </div>
            
            {/* A/B Test Results */}
            <div>
              <h4 style={{ margin: '0 0 10px 0', fontSize: currentLayout.styling.typography.fontSize.small }}>
                A/B Test Results
              </h4>
              {testResults.length > 0 ? (
                <div style={{ fontSize: '0.875rem' }}>
                  {testResults.map((result, index) => (
                    <div key={index} style={{ 
                      marginBottom: '8px',
                      padding: '8px',
                      backgroundColor: result.winner ? '#dcfce7' : '#fef3c7',
                      borderRadius: '4px',
                      border: result.winner ? '1px solid #10b981' : '1px solid #f59e0b'
                    }}>
                      <div><strong>{result.variationId}</strong></div>
                      <div>Users: {result.userCount}</div>
                      <div>Conversion: {(result.conversionRate * 100).toFixed(1)}%</div>
                      <div>Confidence: {(result.confidence * 100).toFixed(1)}%</div>
                      {result.winner && <div style={{ color: '#10b981', fontWeight: 'bold' }}>🏆 Winner</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.875rem', color: currentLayout.styling.colors.secondary }}>
                  No test results yet. Run an A/B test to see results.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};