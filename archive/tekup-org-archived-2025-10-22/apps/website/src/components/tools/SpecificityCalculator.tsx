import React, { useState, useEffect } from 'react';

interface SpecificityData {
  selector: string;
  specificity: number;
  breakdown: {
    inline: number;
    ids: number;
    classes: number;
    elements: number;
  };
  elements: HTMLElement[];
  issues: SpecificityIssue[];
}

interface SpecificityIssue {
  type: 'high-specificity' | 'important-usage' | 'selector-conflict' | 'specificity-war';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
}

interface ConflictGroup {
  selector1: SpecificityData;
  selector2: SpecificityData;
  conflictType: 'override' | 'equal' | 'proximity';
}

export const SpecificityCalculator: React.FC = () => {
  const [inputSelector, setInputSelector] = useState('');
  const [calculatedSpecificity, setCalculatedSpecificity] = useState<SpecificityData | null>(null);
  const [allSelectors, setAllSelectors] = useState<SpecificityData[]>([]);
  const [conflicts, setConflicts] = useState<ConflictGroup[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sortBy, setSortBy] = useState<'specificity' | 'selector' | 'issues'>('specificity');
  const [filterLevel, setFilterLevel] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Calculate specificity for a given selector
  const calculateSpecificity = (selector: string): SpecificityData['breakdown'] => {
    // Remove pseudo-elements and pseudo-classes for calculation
    const cleanSelector = selector.replace(/::/g, ' ').replace(/:/g, ' ');
    
    // Count IDs
    const ids = (cleanSelector.match(/#[\w-]+/g) || []).length;
    
    // Count classes, attributes, and pseudo-classes
    const classes = (cleanSelector.match(/\.[\w-]+|\[[\w-]+[^\]]*\]|:[\w-]+/g) || []).length;
    
    // Count element selectors
    const elements = (cleanSelector.match(/(?:^|\s)(?!#|\.|:|\[)[a-zA-Z][\w-]*/g) || []).length;
    
    return {
      inline: 0, // We can't detect inline styles from CSS selectors
      ids,
      classes,
      elements
    };
  };

  // Convert breakdown to specificity number
  const getSpecificityNumber = (breakdown: SpecificityData['breakdown']): number => {
    return breakdown.inline * 1000 + breakdown.ids * 100 + breakdown.classes * 10 + breakdown.elements;
  };

  // Analyze selector for issues
  const analyzeSelector = (selector: string, breakdown: SpecificityData['breakdown']): SpecificityIssue[] => {
    const issues: SpecificityIssue[] = [];
    const specificity = getSpecificityNumber(breakdown);

    // High specificity warning
    if (specificity > 300) {
      issues.push({
        type: 'high-specificity',
        severity: 'high',
        description: `Very high specificity (${specificity}). This will be difficult to override.`,
        suggestion: 'Consider using CSS classes instead of IDs or reducing nesting depth.'
      });
    } else if (specificity > 100) {
      issues.push({
        type: 'high-specificity',
        severity: 'medium',
        description: `High specificity (${specificity}). May cause override difficulties.`,
        suggestion: 'Try to keep specificity below 100 for maintainable CSS.'
      });
    }

    // Check for !important usage (simplified check)
    if (selector.includes('!important')) {
      issues.push({
        type: 'important-usage',
        severity: 'high',
        description: 'Usage of !important detected.',
        suggestion: 'Avoid !important by restructuring CSS specificity instead.'
      });
    }

    // Overly complex selector
    if (selector.split(' ').length > 4) {
      issues.push({
        type: 'selector-conflict',
        severity: 'medium',
        description: 'Selector has many descendant combinators.',
        suggestion: 'Consider using more specific class names to reduce nesting.'
      });
    }

    return issues;
  };

  // Calculate specificity for input selector
  const handleCalculate = () => {
    if (!inputSelector.trim()) return;

    const breakdown = calculateSpecificity(inputSelector);
    const specificity = getSpecificityNumber(breakdown);
    const issues = analyzeSelector(inputSelector, breakdown);

    const data: SpecificityData = {
      selector: inputSelector.trim(),
      specificity,
      breakdown,
      elements: [], // Would be populated in real DOM analysis
      issues
    };

    setCalculatedSpecificity(data);
    
    // Add to all selectors if not duplicate
    if (!allSelectors.some(s => s.selector === data.selector)) {
      setAllSelectors(prev => [...prev, data]);
    }
  };

  // Analyze all CSS in the document
  const analyzePageCSS = async () => {
    setIsAnalyzing(true);
    const selectors: SpecificityData[] = [];
    const foundConflicts: ConflictGroup[] = [];

    try {
      // Get all stylesheets
      const stylesheets = Array.from(document.styleSheets);
      
      for (const stylesheet of stylesheets) {
        try {
          const rules = Array.from(stylesheet.cssRules || []);
          
          for (const rule of rules) {
            if (rule instanceof CSSStyleRule) {
              const selectorText = rule.selectorText;
              const breakdown = calculateSpecificity(selectorText);
              const specificity = getSpecificityNumber(breakdown);
              const issues = analyzeSelector(selectorText, breakdown);

              // Find matching elements
              const elements = Array.from(document.querySelectorAll(selectorText)) as HTMLElement[];

              selectors.push({
                selector: selectorText,
                specificity,
                breakdown,
                elements,
                issues
              });
            }
          }
        } catch (e) {
          // Skip stylesheets that can't be accessed (CORS)
          console.warn('Cannot access stylesheet:', stylesheet);
        }
      }

      // Find conflicts
      for (let i = 0; i < selectors.length; i++) {
        for (let j = i + 1; j < selectors.length; j++) {
          const sel1 = selectors[i];
          const sel2 = selectors[j];

          // Check if they target the same elements
          const hasCommonElements = sel1.elements.some(el1 => 
            sel2.elements.some(el2 => el1 === el2)
          );

          if (hasCommonElements) {
            let conflictType: ConflictGroup['conflictType'] = 'proximity';

            if (sel1.specificity > sel2.specificity) {
              conflictType = 'override';
            } else if (sel1.specificity === sel2.specificity) {
              conflictType = 'equal';
            }

            foundConflicts.push({
              selector1: sel1,
              selector2: sel2,
              conflictType
            });
          }
        }
      }

      setAllSelectors(selectors);
      setConflicts(foundConflicts);
    } catch (error) {
      console.error('Error analyzing CSS:', error);
    }

    setIsAnalyzing(false);
  };

  // Filter and sort selectors
  const filteredSelectors = allSelectors
    .filter(selector => {
      if (filterLevel === 'all') return true;
      
      const hasHighIssues = selector.issues.some(issue => issue.severity === 'high');
      const hasMediumIssues = selector.issues.some(issue => issue.severity === 'medium');
      const hasLowIssues = selector.issues.some(issue => issue.severity === 'low');

      switch (filterLevel) {
        case 'high': return hasHighIssues;
        case 'medium': return hasMediumIssues;
        case 'low': return hasLowIssues;
        default: return true;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'specificity': return b.specificity - a.specificity;
        case 'selector': return a.selector.localeCompare(b.selector);
        case 'issues': return b.issues.length - a.issues.length;
        default: return 0;
      }
    });

  const getSpecificityColor = (specificity: number) => {
    if (specificity >= 300) return 'text-red-400';
    if (specificity >= 100) return 'text-orange-400';
    if (specificity >= 50) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getSpecificityBar = (breakdown: SpecificityData['breakdown']) => {
    const total = breakdown.inline + breakdown.ids + breakdown.classes + breakdown.elements;
    if (total === 0) return null;

    return (
      <div className="flex h-2 rounded-full overflow-hidden bg-gray-700">
        {breakdown.inline > 0 && (
          <div 
            className="bg-red-500" 
            style={{ width: `${(breakdown.inline / total) * 100}%` }}
            title={`Inline: ${breakdown.inline}`}
          />
        )}
        {breakdown.ids > 0 && (
          <div 
            className="bg-orange-500" 
            style={{ width: `${(breakdown.ids / total) * 100}%` }}
            title={`IDs: ${breakdown.ids}`}
          />
        )}
        {breakdown.classes > 0 && (
          <div 
            className="bg-yellow-500" 
            style={{ width: `${(breakdown.classes / total) * 100}%` }}
            title={`Classes: ${breakdown.classes}`}
          />
        )}
        {breakdown.elements > 0 && (
          <div 
            className="bg-green-500" 
            style={{ width: `${(breakdown.elements / total) * 100}%` }}
            title={`Elements: ${breakdown.elements}`}
          />
        )}
      </div>
    );
  };

  return (
    <div className="specificity-calculator bg-gray-800 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">🎯 CSS Specificity Calculator</h3>
          <p className="text-sm text-gray-400">Calculate and analyze CSS selector specificity</p>
        </div>
        <button
          onClick={analyzePageCSS}
          disabled={isAnalyzing}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
        >
          {isAnalyzing ? 'Analyzing...' : '🔍 Analyze Page CSS'}
        </button>
      </div>

      {/* Specificity Calculator */}
      <div className="bg-gray-900 rounded-lg p-4 space-y-4">
        <h4 className="text-lg font-medium text-white">Calculate Selector Specificity</h4>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={inputSelector}
            onChange={(e) => setInputSelector(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCalculate()}
            placeholder="Enter CSS selector (e.g., #nav .menu li a:hover)"
            className="flex-1 px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-cyan-500 focus:outline-none"
          />
          <button
            onClick={handleCalculate}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded transition-colors"
          >
            Calculate
          </button>
        </div>

        {calculatedSpecificity && (
          <div className="bg-gray-800 rounded p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="font-medium text-white">Selector: <code className="bg-gray-700 px-2 py-1 rounded">{calculatedSpecificity.selector}</code></h5>
              <div className={`text-2xl font-bold ${getSpecificityColor(calculatedSpecificity.specificity)}`}>
                {calculatedSpecificity.specificity}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{calculatedSpecificity.breakdown.inline}</div>
                <div className="text-gray-400">Inline</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">{calculatedSpecificity.breakdown.ids}</div>
                <div className="text-gray-400">IDs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{calculatedSpecificity.breakdown.classes}</div>
                <div className="text-gray-400">Classes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{calculatedSpecificity.breakdown.elements}</div>
                <div className="text-gray-400">Elements</div>
              </div>
            </div>

            {getSpecificityBar(calculatedSpecificity.breakdown)}

            {calculatedSpecificity.issues.length > 0 && (
              <div className="space-y-2">
                <h6 className="font-medium text-white">Issues:</h6>
                {calculatedSpecificity.issues.map((issue, index) => (
                  <div key={index} className={`p-2 rounded border-l-4 ${
                    issue.severity === 'high' ? 'border-red-500 bg-red-900/10' :
                    issue.severity === 'medium' ? 'border-yellow-500 bg-yellow-900/10' :
                    'border-blue-500 bg-blue-900/10'
                  }`}>
                    <div className="text-sm text-white">{issue.description}</div>
                    <div className="text-xs text-gray-400 mt-1">{issue.suggestion}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* All Selectors Analysis */}
      {allSelectors.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium text-white">
              All Selectors ({filteredSelectors.length})
            </h4>
            <div className="flex items-center gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-3 py-1 bg-gray-700 text-white rounded text-sm"
              >
                <option value="specificity">Sort by Specificity</option>
                <option value="selector">Sort by Selector</option>
                <option value="issues">Sort by Issues</option>
              </select>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value as typeof filterLevel)}
                className="px-3 py-1 bg-gray-700 text-white rounded text-sm"
              >
                <option value="all">All Issues</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredSelectors.map((selector, index) => (
              <div key={index} className="bg-gray-800 rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <code className="text-sm text-cyan-400 bg-gray-700 px-2 py-1 rounded">
                    {selector.selector}
                  </code>
                  <div className="flex items-center gap-4">
                    <div className={`text-lg font-bold ${getSpecificityColor(selector.specificity)}`}>
                      {selector.specificity}
                    </div>
                    {selector.elements.length > 0 && (
                      <div className="text-xs text-gray-400">
                        {selector.elements.length} elements
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-xs text-center">
                  <div className="text-red-400">{selector.breakdown.inline}</div>
                  <div className="text-orange-400">{selector.breakdown.ids}</div>
                  <div className="text-yellow-400">{selector.breakdown.classes}</div>
                  <div className="text-green-400">{selector.breakdown.elements}</div>
                </div>

                {getSpecificityBar(selector.breakdown)}

                {selector.issues.length > 0 && (
                  <div className="flex gap-1">
                    {selector.issues.map((issue, issueIndex) => (
                      <span
                        key={issueIndex}
                        className={`px-2 py-1 rounded text-xs ${
                          issue.severity === 'high' ? 'bg-red-600 text-white' :
                          issue.severity === 'medium' ? 'bg-yellow-600 text-white' :
                          'bg-blue-600 text-white'
                        }`}
                        title={issue.description}
                      >
                        {issue.type.replace('-', ' ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-4 space-y-4">
          <h4 className="text-lg font-medium text-white">
            Specificity Conflicts ({conflicts.length})
          </h4>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {conflicts.map((conflict, index) => (
              <div key={index} className="bg-gray-800 rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className={`px-2 py-1 rounded text-xs ${
                    conflict.conflictType === 'override' ? 'bg-red-600 text-white' :
                    conflict.conflictType === 'equal' ? 'bg-yellow-600 text-white' :
                    'bg-blue-600 text-white'
                  }`}>
                    {conflict.conflictType.toUpperCase()}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <code className="text-sm text-cyan-400 bg-gray-700 px-2 py-1 rounded">
                      {conflict.selector1.selector}
                    </code>
                    <div className={`font-bold ${getSpecificityColor(conflict.selector1.specificity)}`}>
                      {conflict.selector1.specificity}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <code className="text-sm text-cyan-400 bg-gray-700 px-2 py-1 rounded">
                      {conflict.selector2.selector}
                    </code>
                    <div className={`font-bold ${getSpecificityColor(conflict.selector2.specificity)}`}>
                      {conflict.selector2.specificity}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Specificity Guide */}
      <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4">
        <h4 className="text-lg font-medium text-blue-400 mb-2">💡 Specificity Guide</h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-200">
          <div>
            <h5 className="font-medium mb-2">Specificity Values:</h5>
            <ul className="space-y-1">
              <li>• Inline styles: <span className="text-red-400">1000</span></li>
              <li>• IDs: <span className="text-orange-400">100</span></li>
              <li>• Classes, attributes, pseudo-classes: <span className="text-yellow-400">10</span></li>
              <li>• Elements, pseudo-elements: <span className="text-green-400">1</span></li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-2">Best Practices:</h5>
            <ul className="space-y-1">
              <li>• Keep specificity low (under 100)</li>
              <li>• Avoid using IDs for styling</li>
              <li>• Prefer classes over nested selectors</li>
              <li>• Use !important sparingly</li>
              <li>• Follow BEM or similar methodology</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};