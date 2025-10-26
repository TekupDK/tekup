import React, { useState, useEffect } from 'react';
import { onActivate } from '@/lib/a11y';

interface FlexInfo {
  element: HTMLElement;
  direction: string;
  wrap: string;
  justifyContent: string;
  alignItems: string;
  alignContent: string;
  gap: string;
  children: FlexChildInfo[];
}

interface FlexChildInfo {
  element: HTMLElement;
  flexGrow: string;
  flexShrink: string;
  flexBasis: string;
  alignSelf: string;
  order: string;
  computedWidth: number;
  computedHeight: number;
}

interface FlexboxDebuggerProps {
  isActive: boolean;
  onToggle: () => void;
}

export const FlexboxDebugger: React.FC<FlexboxDebuggerProps> = ({ isActive, onToggle }) => {
  const [flexElements, setFlexElements] = useState<FlexInfo[]>([]);
  const [selectedFlex, setSelectedFlex] = useState<number | null>(null);
  const [showIssues, setShowIssues] = useState(true);

  // Scan for flexbox elements
  const scanForFlexboxes = () => {
    const flexes = document.querySelectorAll('[style*="display: flex"], [style*="display:flex"], .flex');
    const flexInfos: FlexInfo[] = [];

    flexes.forEach((flex) => {
      const element = flex as HTMLElement;
      const computed = getComputedStyle(element);
      
      if (computed.display === 'flex' || computed.display === 'inline-flex') {
        const children: FlexChildInfo[] = Array.from(element.children).map((child) => {
          const childElement = child as HTMLElement;
          const childComputed = getComputedStyle(childElement);
          
          return {
            element: childElement,
            flexGrow: childComputed.flexGrow,
            flexShrink: childComputed.flexShrink,
            flexBasis: childComputed.flexBasis,
            alignSelf: childComputed.alignSelf,
            order: childComputed.order,
            computedWidth: childElement.getBoundingClientRect().width,
            computedHeight: childElement.getBoundingClientRect().height,
          };
        });

        flexInfos.push({
          element,
          direction: computed.flexDirection,
          wrap: computed.flexWrap,
          justifyContent: computed.justifyContent,
          alignItems: computed.alignItems,
          alignContent: computed.alignContent,
          gap: computed.gap,
          children,
        });
      }
    });

    setFlexElements(flexInfos);
  };

  // Create flexbox overlay
  const createFlexOverlay = (flexInfo: FlexInfo, index: number) => {
    const { element, children } = flexInfo;
    const rect = element.getBoundingClientRect();
    
    // Remove existing overlay
    const existingOverlay = document.getElementById(`flex-overlay-${index}`);
    if (existingOverlay) existingOverlay.remove();

    // Create main container overlay
    const overlay = document.createElement('div');
    overlay.id = `flex-overlay-${index}`;
    overlay.style.cssText = `
      position: fixed;
      top: ${rect.top + window.scrollY}px;
      left: ${rect.left + window.scrollX}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      pointer-events: none;
      z-index: 9999;
      border: 2px solid #10b981;
      background: rgba(16, 185, 129, 0.1);
    `;

    // Add container label
    const label = document.createElement('div');
    label.style.cssText = `
      position: absolute;
      top: -20px;
      left: 0;
      background: #10b981;
      color: white;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: monospace;
      white-space: nowrap;
    `;
    label.textContent = `Flex Container (${flexInfo.direction})`;
    overlay.appendChild(label);

    // Highlight flex children
    children.forEach((child, childIndex) => {
      const childRect = child.element.getBoundingClientRect();
      const childOverlay = document.createElement('div');
      
      childOverlay.style.cssText = `
        position: absolute;
        top: ${childRect.top - rect.top}px;
        left: ${childRect.left - rect.left}px;
        width: ${childRect.width}px;
        height: ${childRect.height}px;
        border: 1px solid #f59e0b;
        background: rgba(245, 158, 11, 0.15);
      `;

      // Add child info label
      const childLabel = document.createElement('div');
      childLabel.style.cssText = `
        position: absolute;
        top: 2px;
        left: 2px;
        background: rgba(245, 158, 11, 0.9);
        color: white;
        font-size: 8px;
        padding: 1px 3px;
        border-radius: 2px;
        font-family: monospace;
        line-height: 1.2;
      `;
      childLabel.innerHTML = `
        Item ${childIndex + 1}<br>
        ${child.flexGrow !== '0' ? `grow:${child.flexGrow}` : ''} 
        ${child.flexShrink !== '1' ? `shrink:${child.flexShrink}` : ''}
        ${child.order !== '0' ? `order:${child.order}` : ''}
      `.trim();

      childOverlay.appendChild(childLabel);
      overlay.appendChild(childOverlay);
    });

    document.body.appendChild(overlay);
  };

  // Clear all overlays
  const clearOverlays = () => {
    flexElements.forEach((_, index) => {
      const overlay = document.getElementById(`flex-overlay-${index}`);
      if (overlay) overlay.remove();
    });
  };

  // Detect flexbox issues
  const detectFlexIssues = (flexInfo: FlexInfo) => {
    const issues: string[] = [];
    const { element, children, direction } = flexInfo;
    const containerRect = element.getBoundingClientRect();

    children.forEach((child, index) => {
      // Check for overflow
      if (child.computedWidth > containerRect.width && direction === 'row') {
        issues.push(`Item ${index + 1}: Width exceeds container (${Math.round(child.computedWidth)}px > ${Math.round(containerRect.width)}px)`);
      }

      // Check for unwanted shrinking
      if (child.flexShrink === '1' && child.computedWidth < 50 && direction === 'row') {
        issues.push(`Item ${index + 1}: May be shrinking too much (${Math.round(child.computedWidth)}px width)`);
      }

      // Check for flex basis vs computed size mismatch
      if (child.flexBasis !== 'auto' && child.flexBasis !== '0px') {
        const basisValue = parseFloat(child.flexBasis);
        const actualSize = direction === 'row' ? child.computedWidth : child.computedHeight;
        if (Math.abs(basisValue - actualSize) > 10) {
          issues.push(`Item ${index + 1}: Flex basis (${child.flexBasis}) differs from actual size (${Math.round(actualSize)}px)`);
        }
      }
    });

    // Check container overflow
    const totalChildWidth = children.reduce((sum, child) => sum + child.computedWidth, 0);
    if (totalChildWidth > containerRect.width && direction === 'row' && flexInfo.wrap === 'nowrap') {
      issues.push('Container: Children overflow without wrapping');
    }

    return issues;
  };

  // Handle flex selection
  const selectFlex = (index: number) => {
    clearOverlays();
    setSelectedFlex(index === selectedFlex ? null : index);
    
    if (index !== selectedFlex) {
      createFlexOverlay(flexElements[index], index);
    }
  };

  useEffect(() => {
    if (isActive) {
      scanForFlexboxes();
      
      const handleResize = () => {
        if (selectedFlex !== null) {
          clearOverlays();
          setTimeout(() => {
            if (flexElements[selectedFlex]) {
              createFlexOverlay(flexElements[selectedFlex], selectedFlex);
            }
          }, 100);
        }
      };

      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        clearOverlays();
      };
    } else {
      clearOverlays();
    }
  }, [isActive, selectedFlex, flexElements]);

  const handleRescan = () => {
    clearOverlays();
    setSelectedFlex(null);
    scanForFlexboxes();
  };

  if (!isActive) return null;

  return (
    <div className="fixed top-4 right-96 z-50 bg-gray-900 text-white rounded-lg shadow-2xl border border-gray-700 w-80">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="font-semibold text-green-400">🔧 Flexbox Debugger</h3>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="p-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleRescan}
            className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-500 transition-colors"
          >
            🔄 Rescan
          </button>
          <button
            onClick={() => setShowIssues(!showIssues)}
            className={`px-3 py-2 text-white text-sm rounded transition-colors ${
              showIssues ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-gray-600 hover:bg-gray-500'
            }`}
          >
            {showIssues ? '👁️' : '👁️‍🗨️'} Issues
          </button>
          <button
            onClick={clearOverlays}
            className="px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-500 transition-colors"
          >
            Clear
          </button>
        </div>

        {flexElements.length === 0 ? (
          <p className="text-gray-400 text-sm">No Flexbox elements found. Try scanning again.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {flexElements.map((flex, index) => {
              const issues = detectFlexIssues(flex);
              
              return (
                <button
                  key={index}
                  type="button"
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    selectedFlex === index
                      ? 'border-green-500 bg-green-900/30'
                      : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                  }`}
                  onClick={() => selectFlex(index)}
                  onKeyDown={onActivate(() => selectFlex(index))}
                  aria-pressed={selectedFlex === index}
                  aria-label={`Select flex container ${index + 1}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm text-green-300">
                      Flex {index + 1} {issues.length > 0 && '⚠️'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {flex.element.tagName.toLowerCase()}
                      {flex.element.className && `.${flex.element.className.split(' ')[0]}`}
                    </span>
                  </div>

                  <div className="text-xs text-gray-300 space-y-1">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-blue-400">Direction:</span> {flex.direction}
                      </div>
                      <div>
                        <span className="text-purple-400">Wrap:</span> {flex.wrap}
                      </div>
                      <div>
                        <span className="text-yellow-400">Justify:</span> {flex.justifyContent.replace('-', '-')}
                      </div>
                      <div>
                        <span className="text-green-400">Align:</span> {flex.alignItems}
                      </div>
                    </div>
                    {flex.gap !== 'normal' && flex.gap !== '0px' && (
                      <div>
                        <span className="text-orange-400">Gap:</span> {flex.gap}
                      </div>
                    )}
                    <div>
                      <span className="text-pink-400">Children:</span> {flex.children.length}
                    </div>
                  </div>

                  {/* Show issues if enabled */}
                  {showIssues && issues.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-yellow-600/30">
                      <div className="text-xs text-yellow-400 mb-1">⚠️ Issues Found:</div>
                      <div className="space-y-1">
                        {issues.map((issue, issueIndex) => (
                          <div key={issueIndex} className="text-xs text-yellow-300 bg-yellow-900/20 rounded px-2 py-1">
                            {issue}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expanded view for selected flex */}
                  {selectedFlex === index && (
                    <div className="mt-2 pt-2 border-t border-gray-600">
                      <div className="text-xs text-gray-400 mb-2">Flex Children:</div>
                      <div className="space-y-1">
                        {flex.children.map((child, childIndex) => (
                          <div key={childIndex} className="bg-gray-700 rounded p-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-orange-300 font-mono">Item {childIndex + 1}</span>
                              <span className="text-xs text-gray-400">
                                {Math.round(child.computedWidth)}×{Math.round(child.computedHeight)}px
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-1 text-xs">
                              {child.flexGrow !== '0' && (
                                <div><span className="text-blue-300">Grow:</span> {child.flexGrow}</div>
                              )}
                              {child.flexShrink !== '1' && (
                                <div><span className="text-red-300">Shrink:</span> {child.flexShrink}</div>
                              )}
                              {child.flexBasis !== 'auto' && (
                                <div><span className="text-green-300">Basis:</span> {child.flexBasis}</div>
                              )}
                              {child.order !== '0' && (
                                <div><span className="text-purple-300">Order:</span> {child.order}</div>
                              )}
                              {child.alignSelf !== 'auto' && (
                                <div><span className="text-yellow-300">Align:</span> {child.alignSelf}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-700 text-xs text-gray-400">
        💡 Click on a flexbox to inspect it. Green = container, Orange = items.
      </div>
    </div>
  );
};

export default FlexboxDebugger;