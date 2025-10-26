import React, { useState, useEffect, useRef } from 'react';

interface Breakpoint {
  name: string;
  width: number;
  height: number;
  scale: number;
  device: string;
  orientation: 'portrait' | 'landscape';
}

interface BreakpointIssue {
  breakpoint: string;
  element: HTMLElement;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

const COMMON_BREAKPOINTS: Breakpoint[] = [
  { name: 'Mobile (XS)', width: 320, height: 568, scale: 0.5, device: 'iPhone SE', orientation: 'portrait' },
  { name: 'Mobile (SM)', width: 375, height: 667, scale: 0.5, device: 'iPhone 8', orientation: 'portrait' },
  { name: 'Mobile (MD)', width: 414, height: 896, scale: 0.5, device: 'iPhone 11 Pro', orientation: 'portrait' },
  { name: 'Tablet (SM)', width: 768, height: 1024, scale: 0.4, device: 'iPad', orientation: 'portrait' },
  { name: 'Tablet (LG)', width: 1024, height: 1366, scale: 0.3, device: 'iPad Pro', orientation: 'portrait' },
  { name: 'Desktop (SM)', width: 1280, height: 800, scale: 0.3, device: 'Laptop', orientation: 'landscape' },
  { name: 'Desktop (MD)', width: 1440, height: 900, scale: 0.25, device: 'MacBook Pro', orientation: 'landscape' },
  { name: 'Desktop (LG)', width: 1920, height: 1080, scale: 0.2, device: 'Desktop', orientation: 'landscape' },
  { name: 'Desktop (XL)', width: 2560, height: 1440, scale: 0.15, device: 'Wide Monitor', orientation: 'landscape' },
];

const TAILWIND_BREAKPOINTS = {
  'sm': 640,
  'md': 768,
  'lg': 1024,
  'xl': 1280,
  '2xl': 1536,
};

export const ResponsiveBreakpointTester: React.FC = () => {
  const [selectedBreakpoint, setSelectedBreakpoint] = useState<Breakpoint>(COMMON_BREAKPOINTS[4]);
  const [customBreakpoint, setCustomBreakpoint] = useState({ width: 1200, height: 800 });
  const [issues, setIssues] = useState<BreakpointIssue[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAllBreakpoints, setShowAllBreakpoints] = useState(false);
  const [testUrl, setTestUrl] = useState('http://localhost:3000');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [currentTailwindBreakpoint, setCurrentTailwindBreakpoint] = useState<string>('');

  // Update current Tailwind breakpoint
  useEffect(() => {
    const width = selectedBreakpoint.width;
    let currentBp = 'xs';
    
    Object.entries(TAILWIND_BREAKPOINTS).forEach(([bp, minWidth]) => {
      if (width >= minWidth) {
        currentBp = bp;
      }
    });
    
    setCurrentTailwindBreakpoint(currentBp);
  }, [selectedBreakpoint]);

  const analyzeResponsiveIssues = async () => {
    setIsAnalyzing(true);
    const foundIssues: BreakpointIssue[] = [];

    try {
      // Test across multiple breakpoints
      for (const breakpoint of COMMON_BREAKPOINTS) {
        const iframe = iframeRef.current;
        if (!iframe || !iframe.contentDocument) continue;

        // Temporarily resize to test breakpoint
        iframe.style.width = `${breakpoint.width}px`;
        iframe.style.height = `${breakpoint.height}px`;

        // Wait for layout to settle
        await new Promise(resolve => setTimeout(resolve, 500));

        const doc = iframe.contentDocument;
        const elements = doc.querySelectorAll('*');

        elements.forEach((element) => {
          const htmlElement = element as HTMLElement;
          const computedStyle = window.getComputedStyle(htmlElement);
          const rect = htmlElement.getBoundingClientRect();

          // Check for horizontal overflow
          if (rect.width > breakpoint.width) {
            foundIssues.push({
              breakpoint: breakpoint.name,
              element: htmlElement,
              issue: 'horizontal-overflow',
              severity: 'high',
              description: `Element width (${Math.round(rect.width)}px) exceeds viewport width (${breakpoint.width}px)`
            });
          }

          // Check for text that's too small on mobile
          if (breakpoint.width <= 768) {
            const fontSize = parseFloat(computedStyle.fontSize);
            if (fontSize < 14 && htmlElement.textContent && htmlElement.textContent.trim().length > 0) {
              foundIssues.push({
                breakpoint: breakpoint.name,
                element: htmlElement,
                issue: 'small-text',
                severity: 'medium',
                description: `Text size (${fontSize}px) may be too small for mobile devices`
              });
            }
          }

          // Check for touch targets that are too small
          if (breakpoint.width <= 768 && (htmlElement.tagName === 'BUTTON' || htmlElement.tagName === 'A')) {
            if (rect.width < 44 || rect.height < 44) {
              foundIssues.push({
                breakpoint: breakpoint.name,
                element: htmlElement,
                issue: 'small-touch-target',
                severity: 'high',
                description: `Touch target (${Math.round(rect.width)}×${Math.round(rect.height)}px) is smaller than recommended 44×44px`
              });
            }
          }

          // Check for elements positioned off-screen
          if (rect.left < 0 || rect.top < 0) {
            foundIssues.push({
              breakpoint: breakpoint.name,
              element: htmlElement,
              issue: 'offscreen-element',
              severity: 'medium',
              description: `Element is positioned outside viewport bounds`
            });
          }

          // Check for hidden scrollbars
          if (htmlElement.scrollWidth > htmlElement.clientWidth || 
              htmlElement.scrollHeight > htmlElement.clientHeight) {
            foundIssues.push({
              breakpoint: breakpoint.name,
              element: htmlElement,
              issue: 'hidden-scroll',
              severity: 'low',
              description: `Element has scrollable content that may not be visible`
            });
          }
        });
      }

      // Reset iframe size
      const iframe = iframeRef.current;
      if (iframe) {
        iframe.style.width = `${selectedBreakpoint.width}px`;
        iframe.style.height = `${selectedBreakpoint.height}px`;
      }

    } catch (error) {
      console.error('Error analyzing responsive issues:', error);
    }

    setIssues(foundIssues);
    setIsAnalyzing(false);
  };

  const rotateDevice = () => {
    const newOrientation = selectedBreakpoint.orientation === 'portrait' ? 'landscape' : 'portrait';
    setSelectedBreakpoint({
      ...selectedBreakpoint,
      width: selectedBreakpoint.height,
      height: selectedBreakpoint.width,
      orientation: newOrientation
    });
  };

  const setCustomSize = () => {
    setSelectedBreakpoint({
      name: 'Custom',
      width: customBreakpoint.width,
      height: customBreakpoint.height,
      scale: 0.3,
      device: 'Custom Size',
      orientation: customBreakpoint.width > customBreakpoint.height ? 'landscape' : 'portrait'
    });
  };

  const getIssueSeverityColor = (severity: BreakpointIssue['severity']) => {
    switch (severity) {
      case 'high': return 'text-red-400 bg-red-900/20';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20';
      case 'low': return 'text-blue-400 bg-blue-900/20';
    }
  };

  const groupedIssues = issues.reduce((acc, issue) => {
    if (!acc[issue.breakpoint]) {
      acc[issue.breakpoint] = [];
    }
    acc[issue.breakpoint].push(issue);
    return acc;
  }, {} as Record<string, BreakpointIssue[]>);

  return (
    <div className="responsive-tester bg-gray-800 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">📱 Responsive Breakpoint Tester</h3>
          <p className="text-sm text-gray-400">Test your designs across different screen sizes and devices</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowAllBreakpoints(!showAllBreakpoints)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {showAllBreakpoints ? 'Hide Grid' : 'Show All'}
          </button>
          <button
            onClick={analyzeResponsiveIssues}
            disabled={isAnalyzing}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
          >
            {isAnalyzing ? 'Analyzing...' : '🔍 Analyze Issues'}
          </button>
        </div>
      </div>

      {/* Breakpoint Controls */}
      <div className="bg-gray-900 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-medium text-white">Device Selection</h4>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Tailwind:</span>
            <span className="px-2 py-1 bg-purple-600 text-white rounded text-sm font-mono">
              {currentTailwindBreakpoint}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {COMMON_BREAKPOINTS.map((breakpoint) => (
            <button
              key={breakpoint.name}
              onClick={() => setSelectedBreakpoint(breakpoint)}
              className={`p-3 rounded-lg text-sm transition-colors ${
                selectedBreakpoint.name === breakpoint.name
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              <div className="font-medium">{breakpoint.name}</div>
              <div className="text-xs opacity-75">{breakpoint.device}</div>
              <div className="text-xs opacity-75">{breakpoint.width}×{breakpoint.height}</div>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Custom:</label>
            <input
              type="number"
              value={customBreakpoint.width}
              onChange={(e) => setCustomBreakpoint({ ...customBreakpoint, width: parseInt(e.target.value) || 0 })}
              className="w-16 px-2 py-1 bg-gray-700 text-white rounded text-sm"
              placeholder="W"
            />
            <span className="text-gray-400">×</span>
            <input
              type="number"
              value={customBreakpoint.height}
              onChange={(e) => setCustomBreakpoint({ ...customBreakpoint, height: parseInt(e.target.value) || 0 })}
              className="w-16 px-2 py-1 bg-gray-700 text-white rounded text-sm"
              placeholder="H"
            />
            <button
              onClick={setCustomSize}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors"
            >
              Apply
            </button>
          </div>

          <button
            onClick={rotateDevice}
            className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm transition-colors"
            title="Rotate Device"
          >
            🔄 Rotate
          </button>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">URL:</label>
            <input
              type="url"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              className="px-2 py-1 bg-gray-700 text-white rounded text-sm w-48"
              placeholder="http://localhost:3000"
            />
          </div>
        </div>
      </div>

      {showAllBreakpoints ? (
        /* Grid View */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {COMMON_BREAKPOINTS.map((breakpoint) => (
            <div key={breakpoint.name} className="space-y-2">
              <div className="text-sm font-medium text-white text-center">
                {breakpoint.name}
                <div className="text-xs text-gray-400">{breakpoint.width}×{breakpoint.height}</div>
              </div>
              <div 
                className="border-2 border-gray-600 rounded-lg overflow-hidden bg-white"
                style={{
                  width: '100%',
                  aspectRatio: `${breakpoint.width} / ${breakpoint.height}`,
                  maxHeight: '200px'
                }}
              >
                <iframe
                  src={testUrl}
                  className="w-full h-full"
                  style={{
                    transform: `scale(${Math.min(200 / breakpoint.width, 200 / breakpoint.height)})`,
                    transformOrigin: 'top left',
                    width: `${breakpoint.width}px`,
                    height: `${breakpoint.height}px`
                  }}
                  title={`${breakpoint.name} Preview`}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Single Device View */
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-medium text-white">{selectedBreakpoint.name}</h4>
                <p className="text-sm text-gray-400">
                  {selectedBreakpoint.device} • {selectedBreakpoint.width}×{selectedBreakpoint.height} • 
                  {selectedBreakpoint.orientation}
                </p>
              </div>
              <div className="text-sm text-gray-400">
                Scale: {(selectedBreakpoint.scale * 100).toFixed(0)}%
              </div>
            </div>

            <div className="flex justify-center">
              <div 
                className="border-4 border-gray-600 rounded-lg overflow-hidden bg-white shadow-2xl"
                style={{
                  width: `${selectedBreakpoint.width * selectedBreakpoint.scale}px`,
                  height: `${selectedBreakpoint.height * selectedBreakpoint.scale}px`,
                }}
              >
                <iframe
                  ref={iframeRef}
                  src={testUrl}
                  className="w-full h-full"
                  style={{
                    width: `${selectedBreakpoint.width}px`,
                    height: `${selectedBreakpoint.height}px`,
                    transform: `scale(${selectedBreakpoint.scale})`,
                    transformOrigin: 'top left'
                  }}
                  title="Responsive Preview"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Issues Analysis */}
      {issues.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-4 space-y-4">
          <h4 className="text-lg font-medium text-white">🔍 Responsive Issues Found</h4>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-red-900/20 rounded p-3">
              <div className="text-2xl font-bold text-red-400">
                {issues.filter(i => i.severity === 'high').length}
              </div>
              <div className="text-sm text-red-400">High Priority</div>
            </div>
            <div className="bg-yellow-900/20 rounded p-3">
              <div className="text-2xl font-bold text-yellow-400">
                {issues.filter(i => i.severity === 'medium').length}
              </div>
              <div className="text-sm text-yellow-400">Medium Priority</div>
            </div>
            <div className="bg-blue-900/20 rounded p-3">
              <div className="text-2xl font-bold text-blue-400">
                {issues.filter(i => i.severity === 'low').length}
              </div>
              <div className="text-sm text-blue-400">Low Priority</div>
            </div>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {Object.entries(groupedIssues).map(([breakpoint, breakpointIssues]) => (
              <div key={breakpoint} className="space-y-2">
                <h5 className="font-medium text-white">{breakpoint} ({breakpointIssues.length} issues)</h5>
                <div className="space-y-2 pl-4">
                  {breakpointIssues.map((issue, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded border-l-4 ${
                        issue.severity === 'high' ? 'border-red-500 bg-red-900/10' :
                        issue.severity === 'medium' ? 'border-yellow-500 bg-yellow-900/10' :
                        'border-blue-500 bg-blue-900/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`px-2 py-1 rounded text-xs ${getIssueSeverityColor(issue.severity)}`}>
                          {issue.issue.toUpperCase()}
                        </div>
                        <div className="text-xs text-gray-400">
                          {issue.element.tagName.toLowerCase()}
                          {issue.element.className && `.${issue.element.className.split(' ')[0]}`}
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 mt-2">{issue.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Breakpoint Tips */}
      <div className="bg-green-900/20 border border-green-500/20 rounded-lg p-4">
        <h4 className="text-lg font-medium text-green-400 mb-2">💡 Responsive Design Tips</h4>
        <ul className="text-sm text-green-200 space-y-1">
          <li>• Use Tailwind's responsive prefixes (sm:, md:, lg:, xl:, 2xl:) for breakpoint-specific styles</li>
          <li>• Design mobile-first, then enhance for larger screens</li>
          <li>• Test touch targets - minimum 44×44px for mobile interactions</li>
          <li>• Ensure text is at least 16px on mobile to prevent zoom on iOS</li>
          <li>• Use flexible units (rem, %, vw, vh) instead of fixed pixels</li>
          <li>• Consider container queries for component-level responsiveness</li>
        </ul>
      </div>
    </div>
  );
};