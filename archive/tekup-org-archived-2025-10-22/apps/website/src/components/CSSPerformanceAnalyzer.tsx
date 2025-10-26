import React, { useState, useEffect, useRef } from 'react';

interface CSSMetrics {
  totalRules: number;
  selectors: number;
  properties: number;
  mediaQueries: number;
  keyframes: number;
  unusedRules: number;
  duplicateRules: number;
  specificityScore: number;
  bundleSize: number;
  loadTime: number;
  renderTime: number;
}

interface SelectorAnalysis {
  selector: string;
  specificity: number;
  usage: number;
  element: HTMLElement | null;
  isUnused: boolean;
  isDuplicate: boolean;
}

interface CSSPerformanceAnalyzerProps {
  isActive: boolean;
  onToggle: () => void;
}

export const CSSPerformanceAnalyzer: React.FC<CSSPerformanceAnalyzerProps> = ({ isActive, onToggle }) => {
  const [metrics, setMetrics] = useState<CSSMetrics | null>(null);
  const [selectorAnalysis, setSelectorAnalysis] = useState<SelectorAnalysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'selectors' | 'unused' | 'performance'>('overview');
  const [sortBy, setSortBy] = useState<'specificity' | 'usage' | 'alphabetical'>('specificity');

  // Calculate CSS specificity
  const calculateSpecificity = (selector: string): number => {
    const idCount = (selector.match(/#/g) || []).length;
    const classCount = (selector.match(/\./g) || []).length;
    const attrCount = (selector.match(/\[[^\]]*\]/g) || []).length;
    const pseudoCount = (selector.match(/:/g) || []).length - (selector.match(/::/g) || []).length * 2;
    const elementCount = selector.replace(/[#.:\[\]]/g, '').split(' ').filter(s => s.length > 0).length;
    
    // CSS specificity formula: inline(1000) + ids(100) + classes(10) + elements(1)
    return idCount * 100 + (classCount + attrCount + pseudoCount) * 10 + elementCount;
  };

  // Analyze all CSS rules
  const analyzeCSS = async () => {
    setIsAnalyzing(true);
    
    try {
      const startTime = performance.now();
      
      // Get all stylesheets
      const stylesheets = Array.from(document.styleSheets);
      let totalRules = 0;
      let selectors = 0;
      let properties = 0;
      let mediaQueries = 0;
      let keyframes = 0;
      let totalSpecificity = 0;
      
      const selectorMap = new Map<string, { count: number; rules: CSSRule[]; elements: HTMLElement[] }>();
      const selectorAnalysis: SelectorAnalysis[] = [];
      
      // Analyze each stylesheet
      for (const sheet of stylesheets) {
        try {
          const rules = Array.from(sheet.cssRules || sheet.rules || []);
          totalRules += rules.length;
          
          for (const rule of rules) {
            if (rule.type === CSSRule.STYLE_RULE) {
              const styleRule = rule as CSSStyleRule;
              const selectorText = styleRule.selectorText;
              
              selectors++;
              properties += styleRule.style.length;
              
              // Track selector usage
              const existing = selectorMap.get(selectorText) || { count: 0, rules: [], elements: [] };
              existing.count++;
              existing.rules.push(rule);
              
              // Find matching elements
              try {
                const elements = Array.from(document.querySelectorAll(selectorText));
                existing.elements = elements as HTMLElement[];
              } catch (e) {
                // Invalid selector
              }
              
              selectorMap.set(selectorText, existing);
              
              const specificity = calculateSpecificity(selectorText);
              totalSpecificity += specificity;
              
            } else if (rule.type === CSSRule.MEDIA_RULE) {
              mediaQueries++;
            } else if (rule.type === CSSRule.KEYFRAMES_RULE) {
              keyframes++;
            }
          }
        } catch (e) {
          console.warn('Cannot access stylesheet:', sheet.href, e);
        }
      }
      
      // Analyze selectors for duplicates and unused rules
      let unusedRules = 0;
      let duplicateRules = 0;
      
      selectorMap.forEach((data, selector) => {
        const isUnused = data.elements.length === 0;
        const isDuplicate = data.count > 1;
        
        if (isUnused) unusedRules++;
        if (isDuplicate) duplicateRules++;
        
        selectorAnalysis.push({
          selector,
          specificity: calculateSpecificity(selector),
          usage: data.elements.length,
          element: data.elements[0] || null,
          isUnused,
          isDuplicate,
        });
      });
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Estimate bundle size (approximate)
      let bundleSize = 0;
      stylesheets.forEach(sheet => {
        if (sheet.href && sheet.href.includes('.css')) {
          // This is an approximation - in a real app you'd fetch the actual size
          bundleSize += 50000; // Assume ~50KB per CSS file
        }
      });
      
      const newMetrics: CSSMetrics = {
        totalRules,
        selectors,
        properties,
        mediaQueries,
        keyframes,
        unusedRules,
        duplicateRules,
        specificityScore: Math.round(totalSpecificity / selectors),
        bundleSize,
        loadTime,
        renderTime: performance.now() - startTime,
      };
      
      setMetrics(newMetrics);
      setSelectorAnalysis(selectorAnalysis);
      
    } catch (error) {
      console.error('Error analyzing CSS:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Sort selectors
  const sortedSelectors = selectorAnalysis.sort((a, b) => {
    switch (sortBy) {
      case 'specificity':
        return b.specificity - a.specificity;
      case 'usage':
        return b.usage - a.usage;
      case 'alphabetical':
        return a.selector.localeCompare(b.selector);
      default:
        return 0;
    }
  });

  // Highlight element
  const highlightElement = (element: HTMLElement | null) => {
    // Clear previous highlights
    document.querySelectorAll('.css-analyzer-highlight').forEach(el => {
      el.classList.remove('css-analyzer-highlight');
    });

    if (element) {
      element.classList.add('css-analyzer-highlight');
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Remove highlight after 3 seconds
      setTimeout(() => {
        element.classList.remove('css-analyzer-highlight');
      }, 3000);
    }
  };

  useEffect(() => {
    if (isActive) {
      // Add highlight styles
      const style = document.createElement('style');
      style.textContent = `
        .css-analyzer-highlight {
          outline: 3px solid #f59e0b !important;
          outline-offset: 2px !important;
          background-color: rgba(245, 158, 11, 0.1) !important;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        style.remove();
        document.querySelectorAll('.css-analyzer-highlight').forEach(el => {
          el.classList.remove('css-analyzer-highlight');
        });
      };
    }
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white rounded-lg shadow-2xl border border-gray-700 w-96 max-h-96">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="font-semibold text-yellow-400">⚡ CSS Performance Analyzer</h3>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="p-4">
        {/* Action Buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={analyzeCSS}
            disabled={isAnalyzing}
            className={`flex-1 px-3 py-2 text-white text-sm rounded transition-colors ${
              isAnalyzing 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-yellow-600 hover:bg-yellow-500'
            }`}
          >
            {isAnalyzing ? '🔄 Analyzing...' : '🔍 Analyze CSS'}
          </button>
        </div>

        {/* Tabs */}
        {metrics && (
          <div className="flex gap-1 mb-4 p-1 bg-gray-800 rounded">
            {[
              { key: 'overview', label: '📊' },
              { key: 'selectors', label: '🎯' },
              { key: 'unused', label: '🗑️' },
              { key: 'performance', label: '⚡' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`flex-1 text-xs py-1 px-2 rounded transition-colors ${
                  activeTab === tab.key
                    ? 'bg-yellow-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-64">
          {!metrics ? (
            <div className="text-center text-gray-400 py-8">
              <p className="mb-2">📊 No analysis performed yet</p>
              <p className="text-xs">Click "Analyze CSS" to start</p>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-800 p-3 rounded">
                      <div className="text-2xl font-bold text-blue-400">{metrics.totalRules}</div>
                      <div className="text-xs text-gray-400">Total Rules</div>
                    </div>
                    <div className="bg-gray-800 p-3 rounded">
                      <div className="text-2xl font-bold text-green-400">{metrics.selectors}</div>
                      <div className="text-xs text-gray-400">Selectors</div>
                    </div>
                    <div className="bg-gray-800 p-3 rounded">
                      <div className="text-2xl font-bold text-purple-400">{metrics.properties}</div>
                      <div className="text-xs text-gray-400">Properties</div>
                    </div>
                    <div className="bg-gray-800 p-3 rounded">
                      <div className="text-2xl font-bold text-red-400">{metrics.unusedRules}</div>
                      <div className="text-xs text-gray-400">Unused Rules</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 p-3 rounded">
                    <div className="text-sm text-gray-300 mb-2">Quick Stats:</div>
                    <div className="text-xs space-y-1">
                      <div>📱 Media Queries: {metrics.mediaQueries}</div>
                      <div>🎬 Keyframes: {metrics.keyframes}</div>
                      <div>🔁 Duplicates: {metrics.duplicateRules}</div>
                      <div>🎯 Avg Specificity: {metrics.specificityScore}</div>
                      <div>⏱️ Analysis Time: {Math.round(metrics.loadTime)}ms</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Selectors Tab */}
              {activeTab === 'selectors' && (
                <div>
                  <div className="flex gap-2 mb-3">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                      className="flex-1 bg-gray-700 text-white border border-gray-600 rounded p-1 text-xs"
                    >
                      <option value="specificity">Sort by Specificity</option>
                      <option value="usage">Sort by Usage</option>
                      <option value="alphabetical">Sort A-Z</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    {sortedSelectors.slice(0, 20).map((selector, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`w-full text-left p-2 rounded text-xs border hover:bg-gray-700 ${
                          selector.isUnused ? 'border-red-500/30 bg-red-900/10' :
                          selector.isDuplicate ? 'border-yellow-500/30 bg-yellow-900/10' :
                          'border-gray-600 bg-gray-800/50'
                        }`}
                        onClick={() => highlightElement(selector.element)}
                        aria-label={`Highlight selector ${selector.selector}`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-mono text-blue-300 truncate">
                            {selector.selector}
                          </span>
                          <span className="text-gray-400 ml-2">
                            {selector.specificity}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">
                            {selector.usage} matches
                          </span>
                          <div className="flex gap-1">
                            {selector.isUnused && (
                              <span className="text-red-400 text-xs">Unused</span>
                            )}
                            {selector.isDuplicate && (
                              <span className="text-yellow-400 text-xs">Duplicate</span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                    
                    {sortedSelectors.length > 20 && (
                      <div className="text-center text-gray-400 text-xs py-2">
                        ... and {sortedSelectors.length - 20} more selectors
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Unused Tab */}
              {activeTab === 'unused' && (
                <div>
                  <div className="mb-3 p-2 bg-red-900/20 border border-red-500/30 rounded">
                    <div className="text-sm text-red-300">
                      🗑️ {metrics.unusedRules} unused selectors found
                    </div>
                    <div className="text-xs text-red-400 mt-1">
                      These selectors don't match any elements
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    {selectorAnalysis
                      .filter(s => s.isUnused)
                      .slice(0, 15)
                      .map((selector, index) => (
                        <div key={index} className="p-2 bg-red-900/10 border border-red-500/20 rounded text-xs">
                          <span className="font-mono text-red-300">{selector.selector}</span>
                          <div className="text-red-400 text-xs mt-1">
                            Specificity: {selector.specificity}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Performance Tab */}
              {activeTab === 'performance' && (
                <div className="space-y-3">
                  <div className="bg-gray-800 p-3 rounded">
                    <div className="text-sm text-gray-300 mb-2">Performance Metrics:</div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-400">Analysis Time:</span>
                        <span className="text-xs text-green-400">{Math.round(metrics.loadTime)}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-400">Estimated Bundle Size:</span>
                        <span className="text-xs text-yellow-400">~{Math.round(metrics.bundleSize / 1024)}KB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-400">Rules per Stylesheet:</span>
                        <span className="text-xs text-blue-400">{Math.round(metrics.totalRules / Math.max(document.styleSheets.length, 1))}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 p-3 rounded">
                    <div className="text-sm text-gray-300 mb-2">Optimization Suggestions:</div>
                    <div className="space-y-1 text-xs">
                      {metrics.unusedRules > 10 && (
                        <div className="text-red-400">⚠️ Remove {metrics.unusedRules} unused rules</div>
                      )}
                      {metrics.duplicateRules > 5 && (
                        <div className="text-yellow-400">⚠️ Consolidate {metrics.duplicateRules} duplicate rules</div>
                      )}
                      {metrics.specificityScore > 50 && (
                        <div className="text-orange-400">⚠️ High specificity detected (avg: {metrics.specificityScore})</div>
                      )}
                      {metrics.mediaQueries > 10 && (
                        <div className="text-blue-400">ℹ️ Consider consolidating media queries</div>
                      )}
                      {metrics.unusedRules === 0 && metrics.duplicateRules === 0 && (
                        <div className="text-green-400">✅ CSS looks optimized!</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="p-3 border-t border-gray-700 text-xs text-gray-400">
        💡 Click selectors to highlight matching elements on the page.
      </div>
    </div>
  );
};

export default CSSPerformanceAnalyzer;