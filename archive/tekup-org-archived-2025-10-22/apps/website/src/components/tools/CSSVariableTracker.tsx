import React, { useState, useEffect } from 'react';

interface CSSVariable {
  name: string;
  value: string;
  originalValue: string;
  usageCount: number;
  definedIn: string[];
  usedIn: string[];
  computedValue: string;
  type: 'color' | 'dimension' | 'string' | 'number' | 'unknown';
  scope: 'global' | 'component' | 'element';
}

interface VariableIssue {
  variable: string;
  type: 'unused' | 'override' | 'invalid' | 'circular';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
}

export const CSSVariableTracker: React.FC = () => {
  const [variables, setVariables] = useState<CSSVariable[]>([]);
  const [issues, setIssues] = useState<VariableIssue[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | CSSVariable['type']>('all');
  const [filterScope, setFilterScope] = useState<'all' | CSSVariable['scope']>('all');
  const [selectedVariable, setSelectedVariable] = useState<CSSVariable | null>(null);

  // Analyze CSS variables
  const analyzeVariables = async () => {
    setIsAnalyzing(true);
    const foundVariables: CSSVariable[] = [];
    const foundIssues: VariableIssue[] = [];
    const variableUsage = new Map<string, number>();

    try {
      // Collect all CSS variables from stylesheets
      const stylesheets = Array.from(document.styleSheets);
      
      for (const stylesheet of stylesheets) {
        try {
          const rules = Array.from(stylesheet.cssRules || []);
          
          for (const rule of rules) {
            if (rule instanceof CSSStyleRule) {
              const style = rule.style;
              
              // Find CSS variable definitions
              for (let i = 0; i < style.length; i++) {
                const property = style[i];
                if (property.startsWith('--')) {
                  const value = style.getPropertyValue(property);
                  const computedValue = getComputedStyle(document.documentElement).getPropertyValue(property);
                  
                  const existingVar = foundVariables.find(v => v.name === property);
                  if (existingVar) {
                    existingVar.definedIn.push(rule.selectorText);
                  } else {
                    foundVariables.push({
                      name: property,
                      value: value.trim(),
                      originalValue: value.trim(),
                      usageCount: 0,
                      definedIn: [rule.selectorText],
                      usedIn: [],
                      computedValue: computedValue.trim(),
                      type: detectVariableType(value),
                      scope: detectScope(rule.selectorText)
                    });
                  }
                }
              }

              // Find CSS variable usage
              const cssText = rule.cssText;
              const varMatches = cssText.match(/var\(([^)]+)\)/g);
              if (varMatches) {
                varMatches.forEach(match => {
                  const varName = match.match(/var\(\s*(--[^,)]+)/)?.[1];
                  if (varName) {
                    const count = variableUsage.get(varName) || 0;
                    variableUsage.set(varName, count + 1);
                    
                    const variable = foundVariables.find(v => v.name === varName);
                    if (variable && !variable.usedIn.includes(rule.selectorText)) {
                      variable.usedIn.push(rule.selectorText);
                    }
                  }
                });
              }
            }
          }
        } catch (e) {
          console.warn('Cannot access stylesheet:', stylesheet);
        }
      }

      // Update usage counts
      foundVariables.forEach(variable => {
        variable.usageCount = variableUsage.get(variable.name) || 0;
      });

      // Analyze for issues
      foundVariables.forEach(variable => {
        // Unused variables
        if (variable.usageCount === 0) {
          foundIssues.push({
            variable: variable.name,
            type: 'unused',
            severity: 'low',
            description: `Variable ${variable.name} is defined but never used`,
            suggestion: 'Consider removing unused CSS variables to reduce bundle size'
          });
        }

        // Invalid values
        if (variable.value === '' || variable.computedValue === '') {
          foundIssues.push({
            variable: variable.name,
            type: 'invalid',
            severity: 'high',
            description: `Variable ${variable.name} has an invalid or empty value`,
            suggestion: 'Check the variable definition for syntax errors'
          });
        }

        // Multiple definitions (overrides)
        if (variable.definedIn.length > 1) {
          foundIssues.push({
            variable: variable.name,
            type: 'override',
            severity: 'medium',
            description: `Variable ${variable.name} is defined in multiple places`,
            suggestion: 'Consider consolidating variable definitions to avoid conflicts'
          });
        }

        // Circular references (simplified check)
        if (variable.value.includes(`var(${variable.name})`)) {
          foundIssues.push({
            variable: variable.name,
            type: 'circular',
            severity: 'high',
            description: `Variable ${variable.name} contains a circular reference`,
            suggestion: 'Remove circular references to prevent infinite loops'
          });
        }
      });

      setVariables(foundVariables);
      setIssues(foundIssues);
    } catch (error) {
      console.error('Error analyzing CSS variables:', error);
    }

    setIsAnalyzing(false);
  };

  const detectVariableType = (value: string): CSSVariable['type'] => {
    const trimmedValue = value.trim();
    
    // Color values
    if (trimmedValue.match(/^#[0-9a-fA-F]+$/) || 
        trimmedValue.match(/^rgb\(/) || 
        trimmedValue.match(/^hsl\(/) ||
        trimmedValue.match(/^color\(/) ||
        ['transparent', 'inherit', 'initial', 'currentColor'].includes(trimmedValue)) {
      return 'color';
    }
    
    // Dimension values
    if (trimmedValue.match(/^\d+(\.\d+)?(px|em|rem|vh|vw|%|pt|pc|in|cm|mm|ex|ch|vmin|vmax)$/)) {
      return 'dimension';
    }
    
    // Number values
    if (trimmedValue.match(/^\d+(\.\d+)?$/)) {
      return 'number';
    }
    
    // String values (quoted)
    if (trimmedValue.match(/^["'].*["']$/)) {
      return 'string';
    }
    
    return 'unknown';
  };

  const detectScope = (selector: string): CSSVariable['scope'] => {
    if (selector === ':root' || selector === 'html') {
      return 'global';
    }
    if (selector.includes('.') || selector.includes('[')) {
      return 'component';
    }
    return 'element';
  };

  const getVariablePreview = (variable: CSSVariable) => {
    switch (variable.type) {
      case 'color':
        return (
          <div 
            className="w-6 h-6 rounded border border-gray-600"
            style={{ backgroundColor: variable.computedValue || variable.value }}
            title={variable.computedValue || variable.value}
          />
        );
      case 'dimension':
        return (
          <div className="text-xs bg-blue-600 px-2 py-1 rounded text-white">
            {variable.computedValue || variable.value}
          </div>
        );
      case 'number':
        return (
          <div className="text-xs bg-green-600 px-2 py-1 rounded text-white">
            {variable.computedValue || variable.value}
          </div>
        );
      default:
        return (
          <div className="text-xs bg-gray-600 px-2 py-1 rounded text-white truncate max-w-24">
            {(variable.computedValue || variable.value).substring(0, 10)}
            {(variable.computedValue || variable.value).length > 10 ? '...' : ''}
          </div>
        );
    }
  };

  const copyVariableToClipboard = (variable: CSSVariable) => {
    const varReference = `var(${variable.name})`;
    navigator.clipboard.writeText(varReference);
  };

  const filteredVariables = variables.filter(variable => {
    const matchesSearch = variable.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         variable.value.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || variable.type === filterType;
    const matchesScope = filterScope === 'all' || variable.scope === filterScope;
    
    return matchesSearch && matchesType && matchesScope;
  });

  const getIssueIcon = (type: VariableIssue['type']) => {
    switch (type) {
      case 'unused': return '🚫';
      case 'override': return '⚠️';
      case 'invalid': return '❌';
      case 'circular': return '🔄';
    }
  };

  const getIssueColor = (severity: VariableIssue['severity']) => {
    switch (severity) {
      case 'high': return 'border-red-500 bg-red-900/10';
      case 'medium': return 'border-yellow-500 bg-yellow-900/10';
      case 'low': return 'border-blue-500 bg-blue-900/10';
    }
  };

  return (
    <div className="css-variable-tracker bg-gray-800 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">📝 CSS Variable Tracker</h3>
          <p className="text-sm text-gray-400">Track and analyze CSS custom properties (variables)</p>
        </div>
        <button
          onClick={analyzeVariables}
          disabled={isAnalyzing}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
        >
          {isAnalyzing ? 'Analyzing...' : '🔍 Analyze Variables'}
        </button>
      </div>

      {/* Summary Stats */}
      {variables.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-purple-900/20 rounded p-3 text-center">
            <div className="text-2xl font-bold text-purple-400">{variables.length}</div>
            <div className="text-xs text-purple-200">Total Variables</div>
          </div>
          <div className="bg-green-900/20 rounded p-3 text-center">
            <div className="text-2xl font-bold text-green-400">
              {variables.filter(v => v.usageCount > 0).length}
            </div>
            <div className="text-xs text-green-200">Used</div>
          </div>
          <div className="bg-red-900/20 rounded p-3 text-center">
            <div className="text-2xl font-bold text-red-400">
              {variables.filter(v => v.usageCount === 0).length}
            </div>
            <div className="text-xs text-red-200">Unused</div>
          </div>
          <div className="bg-blue-900/20 rounded p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">
              {variables.filter(v => v.scope === 'global').length}
            </div>
            <div className="text-xs text-blue-200">Global</div>
          </div>
          <div className="bg-yellow-900/20 rounded p-3 text-center">
            <div className="text-2xl font-bold text-yellow-400">{issues.length}</div>
            <div className="text-xs text-yellow-200">Issues</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search variables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            className="px-3 py-2 bg-gray-700 text-white rounded text-sm"
          >
            <option value="all">All Types</option>
            <option value="color">Colors</option>
            <option value="dimension">Dimensions</option>
            <option value="number">Numbers</option>
            <option value="string">Strings</option>
            <option value="unknown">Unknown</option>
          </select>
          <select
            value={filterScope}
            onChange={(e) => setFilterScope(e.target.value as typeof filterScope)}
            className="px-3 py-2 bg-gray-700 text-white rounded text-sm"
          >
            <option value="all">All Scopes</option>
            <option value="global">Global</option>
            <option value="component">Component</option>
            <option value="element">Element</option>
          </select>
        </div>
      </div>

      {/* Variables List */}
      {filteredVariables.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-4 space-y-4">
          <h4 className="text-lg font-medium text-white">Variables ({filteredVariables.length})</h4>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredVariables.map((variable, index) => (
              <div 
                key={index}
                className={`bg-gray-800 rounded p-4 transition-all hover:bg-gray-750 ${
                  selectedVariable?.name === variable.name ? 'ring-2 ring-cyan-500' : ''
                }`}
                role="button"
                tabIndex={0}
                aria-label={`Select CSS variable ${variable.name}`}
                onClick={() => setSelectedVariable(variable)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedVariable(variable); } }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <code className="text-cyan-400 bg-gray-700 px-2 py-1 rounded text-sm">
                      {variable.name}
                    </code>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      variable.scope === 'global' ? 'bg-purple-600 text-white' :
                      variable.scope === 'component' ? 'bg-blue-600 text-white' :
                      'bg-orange-600 text-white'
                    }`}>
                      {variable.scope}
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      variable.type === 'color' ? 'bg-green-600 text-white' :
                      variable.type === 'dimension' ? 'bg-blue-600 text-white' :
                      variable.type === 'number' ? 'bg-purple-600 text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      {variable.type}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {getVariablePreview(variable)}
                    <div className="text-sm text-gray-400">
                      Used {variable.usageCount} times
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyVariableToClipboard(variable);
                      }}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                      title="Copy var() reference"
                    >
                      📋
                    </button>
                  </div>
                </div>

                <div className="text-sm text-gray-300">
                  <span className="text-gray-400">Value:</span> {variable.value}
                </div>
                
                {variable.computedValue !== variable.value && (
                  <div className="text-sm text-gray-300">
                    <span className="text-gray-400">Computed:</span> {variable.computedValue}
                  </div>
                )}

                <div className="text-xs text-gray-400 mt-2">
                  Defined in: {variable.definedIn.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issues */}
      {issues.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-4 space-y-4">
          <h4 className="text-lg font-medium text-white">Issues ({issues.length})</h4>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {issues.map((issue, index) => (
              <div key={index} className={`border-l-4 p-3 rounded ${getIssueColor(issue.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span>{getIssueIcon(issue.type)}</span>
                    <div>
                      <div className="text-sm font-medium text-white">
                        {issue.description}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {issue.suggestion}
                      </div>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    issue.severity === 'high' ? 'bg-red-600 text-white' :
                    issue.severity === 'medium' ? 'bg-yellow-600 text-white' :
                    'bg-blue-600 text-white'
                  }`}>
                    {issue.severity.toUpperCase()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Variable Details Panel */}
      {selectedVariable && (
        <div className="bg-gray-900 rounded-lg p-4">
          <h4 className="text-lg font-medium text-white mb-4">Variable Details</h4>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <span className="text-gray-400 text-sm">Name:</span>
                <div className="text-white font-mono">{selectedVariable.name}</div>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Value:</span>
                <div className="text-white font-mono">{selectedVariable.value}</div>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Computed Value:</span>
                <div className="text-white font-mono">{selectedVariable.computedValue}</div>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Type:</span>
                <div className="text-white capitalize">{selectedVariable.type}</div>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Scope:</span>
                <div className="text-white capitalize">{selectedVariable.scope}</div>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Usage Count:</span>
                <div className="text-white">{selectedVariable.usageCount}</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <span className="text-gray-400 text-sm">Defined In:</span>
                <div className="space-y-1 mt-1">
                  {selectedVariable.definedIn.map((selector, index) => (
                    <div key={index} className="text-sm bg-gray-700 px-2 py-1 rounded font-mono">
                      {selector}
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedVariable.usedIn.length > 0 && (
                <div>
                  <span className="text-gray-400 text-sm">Used In:</span>
                  <div className="space-y-1 mt-1 max-h-32 overflow-y-auto">
                    {selectedVariable.usedIn.map((selector, index) => (
                      <div key={index} className="text-sm bg-gray-700 px-2 py-1 rounded font-mono">
                        {selector}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Help */}
      <div className="bg-green-900/20 border border-green-500/20 rounded-lg p-4">
        <h4 className="text-lg font-medium text-green-400 mb-2">💡 CSS Variables Best Practices</h4>
        <ul className="text-sm text-green-200 space-y-1">
          <li>• Define global variables in <code className="bg-green-800 px-1 rounded">:root</code></li>
          <li>• Use semantic names like <code className="bg-green-800 px-1 rounded">--primary-color</code> instead of <code className="bg-green-800 px-1 rounded">--blue</code></li>
          <li>• Group related variables with consistent naming</li>
          <li>• Provide fallback values: <code className="bg-green-800 px-1 rounded">var(--color, #000)</code></li>
          <li>• Remove unused variables to reduce bundle size</li>
          <li>• Use CSS variables for theming and dynamic styling</li>
        </ul>
      </div>
    </div>
  );
};