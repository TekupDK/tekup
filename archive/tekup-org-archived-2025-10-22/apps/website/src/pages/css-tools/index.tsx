import React, { useState, useEffect } from 'react';
import { CSSGridInspector } from '../../components/tools/CSSGridInspector';
import { FlexboxDebugger } from '../../components/tools/FlexboxDebugger';
import { ColorPaletteManager } from '../../components/tools/ColorPaletteManager';
import { AnimationProfiler } from '../../components/tools/AnimationProfiler';
import { ResponsiveBreakpointTester } from '../../components/tools/ResponsiveBreakpointTester';
import { SpecificityCalculator } from '../../components/tools/SpecificityCalculator';
import { LiveEditingPlayground } from '../../components/dev/LiveEditingPlayground';

type Tool = 
  | 'overview'
  | 'live-editor' 
  | 'color-palette' 
  | 'animation-profiler'
  | 'grid-inspector' 
  | 'flexbox-debugger'
  | 'responsive-tester'
  | 'specificity-calculator'
  | 'performance-metrics'
  | 'style-guide';

interface ToolCard {
  id: Tool;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: 'editor' | 'analyzer' | 'debugger' | 'tester';
}

const CSS_TOOLS: ToolCard[] = [
  {
    id: 'live-editor',
    title: 'Live CSS Editor',
    description: 'Real-time CSS editing with Tailwind autocomplete and hot reload',
    icon: '✏️',
    color: 'from-purple-600 to-pink-600',
    category: 'editor'
  },
  {
    id: 'color-palette',
    title: 'Color Palette Manager',
    description: 'P3 wide gamut color management and palette generation',
    icon: '🎨',
    color: 'from-green-600 to-teal-600',
    category: 'editor'
  },
  {
    id: 'animation-profiler',
    title: 'Animation Profiler',
    description: 'Monitor CSS animations and performance metrics',
    icon: '🎬',
    color: 'from-blue-600 to-cyan-600',
    category: 'analyzer'
  },
  {
    id: 'grid-inspector',
    title: 'CSS Grid Inspector',
    description: 'Visual grid layout debugging and inspection',
    icon: '📐',
    color: 'from-orange-600 to-red-600',
    category: 'debugger'
  },
  {
    id: 'flexbox-debugger',
    title: 'Flexbox Debugger',
    description: 'Flexbox layout visualization and debugging tools',
    icon: '📏',
    color: 'from-indigo-600 to-purple-600',
    category: 'debugger'
  },
  {
    id: 'responsive-tester',
    title: 'Responsive Tester',
    description: 'Test designs across multiple breakpoints and devices',
    icon: '📱',
    color: 'from-pink-600 to-rose-600',
    category: 'tester'
  },
  {
    id: 'specificity-calculator',
    title: 'Specificity Calculator',
    description: 'Analyze CSS selector specificity and conflicts',
    icon: '🎯',
    color: 'from-yellow-600 to-orange-600',
    category: 'analyzer'
  },
  {
    id: 'performance-metrics',
    title: 'Performance Metrics',
    description: 'CSS performance analysis and optimization insights',
    icon: '⚡',
    color: 'from-emerald-600 to-green-600',
    category: 'analyzer'
  }
];

const KEYBOARD_SHORTCUTS = [
  { key: 'Ctrl + 1', action: 'Live Editor', tool: 'live-editor' },
  { key: 'Ctrl + 2', action: 'Color Palette', tool: 'color-palette' },
  { key: 'Ctrl + 3', action: 'Animation Profiler', tool: 'animation-profiler' },
  { key: 'Ctrl + 4', action: 'Grid Inspector', tool: 'grid-inspector' },
  { key: 'Ctrl + 5', action: 'Flexbox Debugger', tool: 'flexbox-debugger' },
  { key: 'Ctrl + 6', action: 'Responsive Tester', tool: 'responsive-tester' },
  { key: 'Ctrl + 7', action: 'Specificity Calculator', tool: 'specificity-calculator' },
  { key: 'Ctrl + 0', action: 'Dashboard Overview', tool: 'overview' },
  { key: 'Esc', action: 'Back to Overview', tool: 'overview' },
];

export default function CSSToolsDashboard() {
  const [activeTool, setActiveTool] = useState<Tool>('overview');
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | ToolCard['category']>('all');

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        const shortcut = KEYBOARD_SHORTCUTS.find(s => 
          s.key.toLowerCase().includes(event.key) && 
          (event.ctrlKey || event.metaKey)
        );
        
        if (shortcut) {
          event.preventDefault();
          setActiveTool(shortcut.tool as Tool);
        }
      }
      
      if (event.key === 'Escape') {
        event.preventDefault();
        setActiveTool('overview');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredTools = CSS_TOOLS.filter(tool => {
    const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          CSS Development Dashboard
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Comprehensive toolkit for modern CSS development with Tailwind CSS 4.1, 
          P3 color spaces, and advanced debugging capabilities.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-lg p-6 border border-purple-500/20">
          <div className="text-3xl font-bold text-purple-400">8</div>
          <div className="text-sm text-purple-200">Tools Available</div>
        </div>
        <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 rounded-lg p-6 border border-blue-500/20">
          <div className="text-3xl font-bold text-blue-400">4</div>
          <div className="text-sm text-blue-200">Categories</div>
        </div>
        <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 rounded-lg p-6 border border-green-500/20">
          <div className="text-3xl font-bold text-green-400">P3</div>
          <div className="text-sm text-green-200">Color Space</div>
        </div>
        <div className="bg-gradient-to-br from-orange-900/50 to-red-900/50 rounded-lg p-6 border border-orange-500/20">
          <div className="text-3xl font-bold text-orange-400">4.1</div>
          <div className="text-sm text-orange-200">Tailwind CSS</div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'editor', 'analyzer', 'debugger', 'tester'].map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                selectedCategory === category
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`group relative overflow-hidden rounded-xl p-6 text-left transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-gray-600 hover:border-gray-400`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl">{tool.icon}</span>
                <div className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                  tool.category === 'editor' ? 'bg-purple-900/50 text-purple-300' :
                  tool.category === 'analyzer' ? 'bg-blue-900/50 text-blue-300' :
                  tool.category === 'debugger' ? 'bg-orange-900/50 text-orange-300' :
                  'bg-green-900/50 text-green-300'
                }`}>
                  {tool.category}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
                  {tool.title}
                </h3>
                <p className="text-sm text-gray-400 mt-2">
                  {tool.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Keyboard Shortcuts */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">⌨️ Keyboard Shortcuts</h3>
          <button
            onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
            className="text-cyan-400 hover:text-cyan-300"
          >
            {showKeyboardShortcuts ? 'Hide' : 'Show'}
          </button>
        </div>
        
        {showKeyboardShortcuts && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {KEYBOARD_SHORTCUTS.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-700 rounded p-3">
                <span className="text-gray-300">{shortcut.action}</span>
                <kbd className="px-2 py-1 bg-gray-600 rounded text-xs font-mono text-gray-200">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips and Features */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-lg p-6 border border-blue-500/20">
          <h3 className="text-xl font-semibold text-blue-400 mb-4">🚀 Features</h3>
          <ul className="space-y-2 text-blue-200">
            <li>• Real-time CSS editing with hot reload</li>
            <li>• P3 wide gamut color space support</li>
            <li>• Advanced layout debugging tools</li>
            <li>• Responsive design testing</li>
            <li>• Performance monitoring and analysis</li>
            <li>• Tailwind CSS 4.1 integration</li>
          </ul>
        </div>
        
        <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-lg p-6 border border-purple-500/20">
          <h3 className="text-xl font-semibold text-purple-400 mb-4">💡 Tips</h3>
          <ul className="space-y-2 text-purple-200">
            <li>• Use keyboard shortcuts for quick navigation</li>
            <li>• Test across multiple devices and breakpoints</li>
            <li>• Monitor animation performance regularly</li>
            <li>• Keep CSS specificity under control</li>
            <li>• Leverage P3 colors for modern displays</li>
            <li>• Use container queries for component layouts</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderActiveTool = () => {
    switch (activeTool) {
      case 'live-editor':
        return <LiveEditingPlayground />;
      case 'color-palette':
        return <ColorPaletteManager />;
      case 'animation-profiler':
        return <AnimationProfiler />;
      case 'grid-inspector':
        return <CSSGridInspector />;
      case 'flexbox-debugger':
        return <FlexboxDebugger />;
      case 'responsive-tester':
        return <ResponsiveBreakpointTester />;
      case 'specificity-calculator':
        return <SpecificityCalculator />;
      case 'performance-metrics':
        return (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">⚡ Performance Metrics</h3>
            <p className="text-gray-400 mb-4">
              Advanced CSS performance analysis and optimization insights coming soon...
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-700 rounded p-4 text-center">
                <div className="text-2xl font-bold text-green-400">92%</div>
                <div className="text-sm text-gray-300">CSS Coverage</div>
              </div>
              <div className="bg-gray-700 rounded p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">1.2s</div>
                <div className="text-sm text-gray-300">Load Time</div>
              </div>
              <div className="bg-gray-700 rounded p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">284KB</div>
                <div className="text-sm text-gray-300">Bundle Size</div>
              </div>
            </div>
          </div>
        );
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Top Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveTool('overview')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeTool === 'overview'
                  ? 'bg-cyan-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              <span>🏠</span>
              <span>Dashboard</span>
            </button>
            
            {activeTool !== 'overview' && (
              <div className="flex items-center space-x-2 text-gray-400">
                <span>/</span>
                <span className="text-cyan-400 font-medium">
                  {CSS_TOOLS.find(tool => tool.id === activeTool)?.title || 'Tool'}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <span>⚙️</span>
            </button>
            <button 
              onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Toggle Keyboard Shortcuts"
            >
              <span>⌨️</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {renderActiveTool()}
        </div>
      </main>

      {/* Tool Sidebar (when tool is active) */}
      {activeTool !== 'overview' && (
        <div className="fixed top-20 right-6 bg-gray-800 rounded-lg p-4 border border-gray-600 shadow-xl">
          <h4 className="font-medium text-white mb-3">Quick Tools</h4>
          <div className="space-y-2">
            {CSS_TOOLS.slice(0, 4).map(tool => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  activeTool === tool.id
                    ? 'bg-cyan-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="mr-2">{tool.icon}</span>
                {tool.title.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}