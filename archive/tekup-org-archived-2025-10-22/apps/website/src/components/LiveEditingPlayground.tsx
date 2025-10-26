import React, { useState, useEffect, useCallback, useRef } from 'react';

// Tailwind CSS classes for autocomplete
const TAILWIND_CLASSES = [
  'bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500',
  'text-white', 'text-black', 'text-gray-500', 'text-blue-500', 'text-red-500',
  'p-4', 'p-8', 'm-4', 'm-8', 'px-4', 'py-4', 'mx-4', 'my-4',
  'flex', 'flex-col', 'flex-row', 'justify-center', 'justify-between', 'items-center',
  'grid', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'gap-4', 'gap-8',
  'rounded-lg', 'rounded-full', 'border', 'border-2', 'shadow-lg', 'shadow-xl',
  'hover:scale-105', 'transition-all', 'duration-300', 'ease-in-out',
  'w-full', 'w-1/2', 'w-1/3', 'w-1/4', 'h-full', 'h-screen', 'min-h-screen',
  // Tailwind CSS 4.1 specific classes
  'glass', 'glass-dark', 'glass-card', 'transform-3d', 'perspective-1000',
  'animate-fade-in', 'animate-slide-in-right', 'animate-glow',
  'bg-p3-blue', 'bg-p3-red', 'bg-p3-green', 'text-p3-cyan'
];

// CSS Variables for the editor
const CSS_VARIABLES = [
  '--primary-color', '--secondary-color', '--accent-color', '--bg-color',
  '--text-color', '--border-radius', '--shadow', '--transition-duration',
  '--font-size', '--line-height', '--spacing', '--container-width'
];

/**
 * 🎨 Live Editing Playground
 * Perfect for testing design changes in real-time
 */
export const LiveEditingPlayground: React.FC = () => {
  // View mode state
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>('split');
  const [activeTab, setActiveTab] = useState<'css' | 'html' | 'variables' | 'animation'>('css');
  
  // Code state
  const [cssCode, setCssCode] = useState(`
/* Test your CSS here with Tailwind CSS 4.1 features! */
:root {
  --primary-color: color(display-p3 0.2 0.5 1);
  --secondary-color: color(display-p3 0.9 0.3 0.7);
  --glass-bg: rgba(255, 255, 255, 0.1);
}

.live-test {
  background: var(--primary-color);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  border-radius: 1rem;
  color: white;
  text-align: center;
  transition: all 0.3s ease;
  transform: scale(1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: animate-fade-in 0.5s ease-in-out;
}

.live-test:hover {
  transform: scale(1.05) translateZ(20px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  animation: animate-glow 1s ease-in-out infinite alternate;
}

@container (min-width: 300px) {
  .live-test {
    padding: 3rem;
  }
}
  `.trim());

  const [htmlCode, setHtmlCode] = useState(`
<div class="live-test glass-card transform-3d perspective-1000">
  <h2 class="text-2xl font-bold mb-4 animate-slide-in-down">Live CSS Preview</h2>
  <p class="mb-4 animate-fade-in">Edit the CSS and see changes instantly with Tailwind CSS 4.1!</p>
  <button class="btn-primary animate-bounce-gentle">Test Button</button>
  <div class="mt-4 p-4 bg-p3-blue text-white rounded-lg">
    <span>P3 Wide Gamut Color</span>
  </div>
</div>
  `.trim());
  
  // CSS Variables state
  const [cssVariables, setCssVariables] = useState({
    '--primary-color': 'color(display-p3 0.2 0.5 1)',
    '--secondary-color': 'color(display-p3 0.9 0.3 0.7)',
    '--accent-color': '#ff6b6b',
    '--bg-color': '#f8f9fa',
    '--text-color': '#333',
    '--border-radius': '12px',
    '--shadow': '0 4px 12px rgba(0,0,0,0.1)',
    '--transition-duration': '0.3s',
  });
  
  // Animation timeline state
  const [animationTimeline, setAnimationTimeline] = useState([
    { time: 0, property: 'opacity', value: '0' },
    { time: 0.5, property: 'opacity', value: '1' },
    { time: 1, property: 'transform', value: 'scale(1.1)' }
  ]);
  
  // Autocomplete state
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompletePosition, setAutocompletePosition] = useState({ x: 0, y: 0 });
  const [filteredClasses, setFilteredClasses] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState('');
  
  // Refs
  const cssTextareaRef = useRef<HTMLTextAreaElement>(null);
  const htmlTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Tailwind class autocomplete handler
  const handleTextareaInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>, type: 'html' | 'css') => {
    const textarea = e.target;
    const text = textarea.value;
    const cursorPosition = textarea.selectionStart;
    
    if (type === 'html') {
      setHtmlCode(text);
      
      // Check for class attribute editing
      const beforeCursor = text.substring(0, cursorPosition);
      const classMatch = beforeCursor.match(/class=["']([^"']*?)$/i);
      
      if (classMatch) {
        const currentClasses = classMatch[1];
        const words = currentClasses.split(' ');
        const currentWord = words[words.length - 1];
        
        if (currentWord.length > 0) {
          const filtered = TAILWIND_CLASSES.filter(cls => 
            cls.toLowerCase().includes(currentWord.toLowerCase())
          ).slice(0, 10);
          
          setFilteredClasses(filtered);
          setCurrentWord(currentWord);
          setShowAutocomplete(true);
          
          // Position autocomplete
          const rect = textarea.getBoundingClientRect();
          setAutocompletePosition({
            x: rect.left + 10,
            y: rect.top + 30
          });
        } else {
          setShowAutocomplete(false);
        }
      } else {
        setShowAutocomplete(false);
      }
    } else {
      setCssCode(text);
    }
  }, []);
  
  // Insert autocomplete suggestion
  const insertAutocompleteSuggestion = useCallback((suggestion: string) => {
    const textarea = htmlTextareaRef.current;
    if (!textarea) return;
    
    const text = textarea.value;
    const cursorPosition = textarea.selectionStart;
    const beforeCursor = text.substring(0, cursorPosition);
    const afterCursor = text.substring(cursorPosition);
    
    // Replace the current word with the suggestion
    const newBeforeCursor = beforeCursor.replace(new RegExp(currentWord + '$'), suggestion);
    const newText = newBeforeCursor + afterCursor;
    
    setHtmlCode(newText);
    setShowAutocomplete(false);
    
    // Set cursor position after the inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newBeforeCursor.length, newBeforeCursor.length);
    }, 0);
  }, [currentWord]);
  
  // CSS Variables updater
  const updateCSSVariable = useCallback((variable: string, value: string) => {
    setCssVariables(prev => ({ ...prev, [variable]: value }));
  }, []);
  
  // Generate CSS from variables
  const generateVariableCSS = useCallback(() => {
    const variableDeclarations = Object.entries(cssVariables)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join('\n');
    
    return `:root {\n${variableDeclarations}\n}`;
  }, [cssVariables]);
  
  // Animation timeline to CSS keyframes
  const generateAnimationCSS = useCallback(() => {
    if (animationTimeline.length === 0) return '';
    
    const keyframes = animationTimeline
      .map(frame => `  ${Math.round(frame.time * 100)}% { ${frame.property}: ${frame.value}; }`)
      .join('\n');
    
    return `@keyframes custom-animation {\n${keyframes}\n}\n\n.animated { animation: custom-animation 2s ease-in-out infinite; }`;
  }, [animationTimeline]);
  
  // Inject CSS dynamically with variables and animations
  useEffect(() => {
    const variableCSS = generateVariableCSS();
    const animationCSS = generateAnimationCSS();
    const combinedCSS = `${variableCSS}\n\n${animationCSS}\n\n${cssCode}`;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'live-css-playground';
    styleElement.textContent = combinedCSS;
    
    // Remove old style if exists
    const oldStyle = document.getElementById('live-css-playground');
    if (oldStyle) {
      oldStyle.remove();
    }
    
    document.head.appendChild(styleElement);
    
    return () => {
      styleElement.remove();
    };
  }, [cssCode, generateVariableCSS, generateAnimationCSS]);
  
  // Hide autocomplete on outside click
  useEffect(() => {
    const handleClickOutside = () => setShowAutocomplete(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">
            🎨 Enhanced Live Editing Playground
          </h1>
          <p className="text-gray-300 mb-4">
            Advanced CSS development with Tailwind CSS 4.1, P3 colors, animations, and more!
          </p>
          
          {/* View Mode Controls */}
          <div className="flex justify-center gap-2 mb-4">
            {['split', 'editor', 'preview'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as typeof viewMode)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === mode
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)} View
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6" style={{
          gridTemplateColumns: viewMode === 'split' ? '1fr 1fr' : '1fr',
          gridTemplateRows: viewMode === 'split' ? '500px' : 'auto'
        }}>
          {/* Editor Panel */}
          {(viewMode === 'split' || viewMode === 'editor') && (
            <div className="glass-card p-6 overflow-hidden">
              {/* Editor Tabs */}
              <div className="flex gap-2 mb-4 border-b border-gray-600 pb-2">
                {[
                  { key: 'css', label: '🎨 CSS', icon: '🎨' },
                  { key: 'html', label: '🏗️ HTML', icon: '🏗️' },
                  { key: 'variables', label: '⚙️ Variables', icon: '⚙️' },
                  { key: 'animation', label: '🎬 Animation', icon: '🎬' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                      activeTab === tab.key
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {tab.icon} {tab.label.split(' ')[1]}
                  </button>
                ))}
              </div>

              {/* CSS Editor Tab */}
              {activeTab === 'css' && (
                <div className="h-full">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-white">CSS Editor</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigator.clipboard.writeText(cssCode)}
                        className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500"
                      >
                        📋 Copy
                      </button>
                      <button
                        onClick={() => setCssCode('')}
                        className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-500"
                      >
                        🗑️ Clear
                      </button>
                    </div>
                  </div>
                  <textarea
                    ref={cssTextareaRef}
                    value={cssCode}
                    onChange={(e) => handleTextareaInput(e, 'css')}
                    className="w-full h-80 bg-gray-800 text-green-400 font-mono text-sm p-4 rounded-lg border border-gray-600 focus:border-blue-400 focus:outline-none resize-none overflow-auto"
                    placeholder="Write your CSS with Tailwind 4.1 features...\n\n/* Try P3 colors: */\n:root {\n  --p3-color: color(display-p3 1 0.5 0);\n}\n\n/* Glass morphism: */\n.glass {\n  backdrop-filter: blur(10px);\n  background: rgba(255, 255, 255, 0.1);\n}"
                    spellCheck={false}
                  />
                </div>
              )}

              {/* HTML Editor Tab */}
              {activeTab === 'html' && (
                <div className="h-full relative">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-white">HTML Editor with Tailwind Autocomplete</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigator.clipboard.writeText(htmlCode)}
                        className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500"
                      >
                        📋 Copy
                      </button>
                    </div>
                  </div>
                  <textarea
                    ref={htmlTextareaRef}
                    value={htmlCode}
                    onChange={(e) => handleTextareaInput(e, 'html')}
                    className="w-full h-80 bg-gray-800 text-blue-400 font-mono text-sm p-4 rounded-lg border border-gray-600 focus:border-blue-400 focus:outline-none resize-none overflow-auto"
                    placeholder="Write your HTML here... Type 'class=' to see Tailwind suggestions"
                    spellCheck={false}
                  />
                  
                  {/* Tailwind Autocomplete */}
                  {showAutocomplete && (
                    <div 
                      className="absolute z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-2xl max-h-48 overflow-auto"
                      style={{ 
                        left: autocompletePosition.x - 200, 
                        top: autocompletePosition.y 
                      }}
                    >
                      {filteredClasses.map((cls) => (
                        <button
                          key={cls}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm text-white hover:bg-blue-600 border-b border-gray-700 last:border-b-0"
                          onClick={() => insertAutocompleteSuggestion(cls)}
                          aria-label={`Insert class ${cls}`}
                        >
                          <span className="text-blue-400">{cls}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* CSS Variables Editor Tab */}
              {activeTab === 'variables' && (
                <div className="h-full overflow-auto">
                  <h3 className="text-lg font-semibold text-white mb-4">CSS Variables Editor</h3>
                  <div className="space-y-3">
                    {Object.entries(cssVariables).map(([variable, value]) => (
                      <div key={variable} className="flex items-center gap-3">
                        <label className="text-blue-300 font-mono text-sm w-32 flex-shrink-0">
                          {variable}
                        </label>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => updateCSSVariable(variable, e.target.value)}
                          className="flex-1 bg-gray-700 text-white p-2 text-sm rounded border border-gray-600 focus:border-blue-400 focus:outline-none"
                        />
                        {variable.includes('color') && (
                          <div 
                            className="w-8 h-8 rounded border border-gray-600"
                            style={{ backgroundColor: value.startsWith('color(display-p3') ? '#ff0000' : value }}
                          />
                        )}
                      </div>
                    ))}
                    
                    <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                      <h4 className="text-white font-semibold mb-2">Generated CSS:</h4>
                      <pre className="text-green-400 text-sm font-mono bg-gray-800 p-2 rounded overflow-auto max-h-32">
                        {generateVariableCSS()}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Animation Timeline Editor Tab */}
              {activeTab === 'animation' && (
                <div className="h-full overflow-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">Animation Timeline Editor</h3>
                    <button
                      onClick={() => setAnimationTimeline([...animationTimeline, { time: 1, property: 'transform', value: 'scale(1)' }])}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-500"
                    >
                      + Add Keyframe
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {animationTimeline.map((frame, index) => (
                      <div key={index} className="flex items-center gap-3 bg-gray-700 p-3 rounded-lg">
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          value={frame.time}
                          onChange={(e) => {
                            const newTimeline = [...animationTimeline];
                            newTimeline[index].time = parseFloat(e.target.value);
                            setAnimationTimeline(newTimeline);
                          }}
                          className="w-20 bg-gray-600 text-white p-2 text-sm rounded border border-gray-500 focus:border-blue-400 focus:outline-none"
                        />
                        <select
                          value={frame.property}
                          onChange={(e) => {
                            const newTimeline = [...animationTimeline];
                            newTimeline[index].property = e.target.value;
                            setAnimationTimeline(newTimeline);
                          }}
                          className="bg-gray-600 text-white p-2 text-sm rounded border border-gray-500 focus:border-blue-400 focus:outline-none"
                        >
                          <option value="opacity">opacity</option>
                          <option value="transform">transform</option>
                          <option value="background-color">background-color</option>
                          <option value="color">color</option>
                        </select>
                        <input
                          type="text"
                          value={frame.value}
                          onChange={(e) => {
                            const newTimeline = [...animationTimeline];
                            newTimeline[index].value = e.target.value;
                            setAnimationTimeline(newTimeline);
                          }}
                          className="flex-1 bg-gray-600 text-white p-2 text-sm rounded border border-gray-500 focus:border-blue-400 focus:outline-none"
                          placeholder="Value (e.g., scale(1.1), #ff0000, 0.5)"
                        />
                        <button
                          onClick={() => {
                            const newTimeline = animationTimeline.filter((_, i) => i !== index);
                            setAnimationTimeline(newTimeline);
                          }}
                          className="px-2 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-500"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                    
                    <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                      <h4 className="text-white font-semibold mb-2">Generated Animation CSS:</h4>
                      <pre className="text-purple-400 text-sm font-mono bg-gray-800 p-2 rounded overflow-auto max-h-32">
                        {generateAnimationCSS()}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preview Panel */}
          {(viewMode === 'split' || viewMode === 'preview') && (
            <div className="glass-card p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Live Preview 🔥</h2>
                <div className="flex gap-2">
                  <button className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500">
                    📱 Mobile
                  </button>
                  <button className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500">
                    💻 Desktop
                  </button>
                  <button className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500">
                    🔄 Refresh
                  </button>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-inner min-h-96 overflow-auto" style={{ containerType: 'inline-size' }}>
                <div dangerouslySetInnerHTML={{ __html: htmlCode }} />
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Quick Tools Section */}
        {viewMode !== 'preview' && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* P3 Color Palette */}
            <div className="glass-card p-4">
              <h3 className="text-lg font-semibold text-white mb-3">🌈 P3 Color Palette</h3>
              <div className="grid grid-cols-4 gap-2">
                {[ 
                  { name: 'P3 Red', value: 'color(display-p3 1 0 0)' },
                  { name: 'P3 Green', value: 'color(display-p3 0 1 0)' },
                  { name: 'P3 Blue', value: 'color(display-p3 0 0 1)' },
                  { name: 'P3 Cyan', value: 'color(display-p3 0 1 1)' },
                  { name: 'P3 Magenta', value: 'color(display-p3 1 0 1)' },
                  { name: 'P3 Yellow', value: 'color(display-p3 1 1 0)' },
                  { name: 'P3 Coral', value: 'color(display-p3 1 0.5 0.31)' },
                  { name: 'P3 Mint', value: 'color(display-p3 0 1 0.8)' }
                ].map((color, index) => (
                  <button
                    key={index}
                    type="button"
                    className="h-12 rounded hover:scale-110 transition-all duration-200 border border-gray-600"
                    style={{ background: `linear-gradient(45deg, ${color.value}, #ff0000)` }}
                    title={`${color.name}: ${color.value}`}
                    aria-label={`Copy ${color.name} value to clipboard`}
                    onClick={() => navigator.clipboard.writeText(color.value)}
                  />
                ))}
              </div>
            </div>

            {/* Quick Test Elements */}
            <div className="glass-card p-4">
              <h3 className="text-lg font-semibold text-white mb-3">🧪 Test Elements</h3>
              <div className="space-y-2">
                <div className="live-test text-sm p-2 rounded">Glassmorphism Test</div>
                <div className="live-test animated text-sm p-2 rounded">Animation Test</div>
                <div className="live-test text-sm p-2 rounded transform-3d">3D Transform Test</div>
              </div>
            </div>

            {/* DevTools Integration */}
            <div className="glass-card p-4">
              <h3 className="text-lg font-semibold text-white mb-3">🔧 DevTools</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    if (window.TekupCSSTools) {
                      window.TekupCSSTools.quickActions.injectTailwindPlayground();
                    }
                  }}
                  className="w-full text-left px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500"
                  aria-label="Launch DevTools Playground"
                >
                  🎮 Launch DevTools Playground
                </button>
                <button
                  onClick={() => {
                    if (window.TekupCSSTools) {
                      window.TekupCSSTools.gridInspector.inspectGrid();
                    }
                  }}
                  className="w-full text-left px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-500"
                >
                  📐 Inspect CSS Grid
                </button>
                <button
                  onClick={() => {
                    if (window.TekupCSSTools) {
                      window.TekupCSSTools.performanceProfiler.startProfiler();
                    }
                  }}
                  className="w-full text-left px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-500"
                >
                  ⚡ Start Performance Profiler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveEditingPlayground;