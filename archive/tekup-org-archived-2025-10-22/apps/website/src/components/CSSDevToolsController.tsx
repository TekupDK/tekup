import React, { useState, useEffect } from 'react';
import CSSGridInspector from './CSSGridInspector';
import FlexboxDebugger from './FlexboxDebugger';
import ColorPaletteManager from './ColorPaletteManager';
import CSSPerformanceAnalyzer from './CSSPerformanceAnalyzer';

interface CSSDevToolsControllerProps {
  isActive?: boolean;
}

export const CSSDevToolsController: React.FC<CSSDevToolsControllerProps> = ({ 
  isActive: propIsActive = false 
}) => {
  const [isOpen, setIsOpen] = useState(propIsActive);
  const [activeTools, setActiveTools] = useState({
    gridInspector: false,
    flexboxDebugger: false,
    colorPalette: false,
    performanceAnalyzer: false,
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + D to toggle main panel
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      
      // Individual tool shortcuts (when main panel is open)
      if (isOpen) {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
          switch (e.key) {
            case 'G':
              e.preventDefault();
              toggleTool('gridInspector');
              break;
            case 'F':
              e.preventDefault();
              toggleTool('flexboxDebugger');
              break;
            case 'C':
              e.preventDefault();
              toggleTool('colorPalette');
              break;
            case 'P':
              e.preventDefault();
              toggleTool('performanceAnalyzer');
              break;
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen]);

  const toggleTool = (tool: keyof typeof activeTools) => {
    setActiveTools(prev => ({
      ...prev,
      [tool]: !prev[tool]
    }));
  };

  const closeAllTools = () => {
    setActiveTools({
      gridInspector: false,
      flexboxDebugger: false,
      colorPalette: false,
      performanceAnalyzer: false,
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-3 rounded-full shadow-2xl transition-all duration-200 hover:scale-110 group"
        title="Open CSS Development Tools (Ctrl+Shift+D)"
      >
        <div className="flex items-center justify-center w-8 h-8">
          🛠️
        </div>
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          CSS Dev Tools
        </div>
      </button>
    );
  }

  return (
    <>
      {/* Main Control Panel */}
      <div className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white rounded-lg shadow-2xl border border-gray-700 w-80">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="font-semibold text-blue-400">🛠️ CSS Development Tools</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Grid Inspector */}
            <button
              onClick={() => toggleTool('gridInspector')}
              className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                activeTools.gridInspector
                  ? 'border-blue-500 bg-blue-900/30 text-blue-300'
                  : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500'
              }`}
              title="CSS Grid Inspector (Ctrl+Shift+G)"
            >
              <div className="text-2xl mb-1">🔍</div>
              <div className="text-sm font-medium">Grid Inspector</div>
              <div className="text-xs text-gray-400">Analyze CSS Grid layouts</div>
            </button>

            {/* Flexbox Debugger */}
            <button
              onClick={() => toggleTool('flexboxDebugger')}
              className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                activeTools.flexboxDebugger
                  ? 'border-green-500 bg-green-900/30 text-green-300'
                  : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500'
              }`}
              title="Flexbox Debugger (Ctrl+Shift+F)"
            >
              <div className="text-2xl mb-1">🔧</div>
              <div className="text-sm font-medium">Flexbox Debug</div>
              <div className="text-xs text-gray-400">Debug flex layouts</div>
            </button>

            {/* Color Palette Manager */}
            <button
              onClick={() => toggleTool('colorPalette')}
              className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                activeTools.colorPalette
                  ? 'border-purple-500 bg-purple-900/30 text-purple-300'
                  : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500'
              }`}
              title="Color Palette Manager (Ctrl+Shift+C)"
            >
              <div className="text-2xl mb-1">🎨</div>
              <div className="text-sm font-medium">Color Palette</div>
              <div className="text-xs text-gray-400">Manage P3 colors</div>
            </button>

            {/* Performance Analyzer */}
            <button
              onClick={() => toggleTool('performanceAnalyzer')}
              className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                activeTools.performanceAnalyzer
                  ? 'border-yellow-500 bg-yellow-900/30 text-yellow-300'
                  : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500'
              }`}
              title="Performance Analyzer (Ctrl+Shift+P)"
            >
              <div className="text-2xl mb-1">⚡</div>
              <div className="text-sm font-medium">Performance</div>
              <div className="text-xs text-gray-400">Analyze CSS metrics</div>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="text-sm font-medium text-gray-300 mb-2">Quick Actions:</div>
            <div className="flex gap-2">
              <button
                onClick={closeAllTools}
                className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-500 transition-colors"
              >
                Close All
              </button>
              <button
                onClick={() => {
                  if (window.TekupCSSTools) {
                    window.TekupCSSTools.quickActions.extractAllColors();
                  }
                }}
                className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500 transition-colors"
              >
                Extract Colors
              </button>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="text-sm font-medium text-gray-300 mb-2">Keyboard Shortcuts:</div>
            <div className="text-xs text-gray-400 space-y-1">
              <div><kbd className="bg-gray-700 px-1 rounded">Ctrl+Shift+D</kbd> Toggle panel</div>
              <div><kbd className="bg-gray-700 px-1 rounded">Ctrl+Shift+G</kbd> Grid inspector</div>
              <div><kbd className="bg-gray-700 px-1 rounded">Ctrl+Shift+F</kbd> Flexbox debugger</div>
              <div><kbd className="bg-gray-700 px-1 rounded">Ctrl+Shift+C</kbd> Color palette</div>
              <div><kbd className="bg-gray-700 px-1 rounded">Ctrl+Shift+P</kbd> Performance</div>
            </div>
          </div>

          {/* Status */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="text-xs text-gray-400">
              Active Tools: {Object.values(activeTools).filter(Boolean).length}/4
            </div>
          </div>
        </div>
      </div>

      {/* Individual Tool Components */}
      <CSSGridInspector 
        isActive={activeTools.gridInspector} 
        onToggle={() => toggleTool('gridInspector')} 
      />
      
      <FlexboxDebugger 
        isActive={activeTools.flexboxDebugger} 
        onToggle={() => toggleTool('flexboxDebugger')} 
      />
      
      <ColorPaletteManager 
        isActive={activeTools.colorPalette} 
        onToggle={() => toggleTool('colorPalette')} 
      />
      
      <CSSPerformanceAnalyzer 
        isActive={activeTools.performanceAnalyzer} 
        onToggle={() => toggleTool('performanceAnalyzer')} 
      />
    </>
  );
};

export default CSSDevToolsController;