/**
 * 🛠️ TekUp DevTools Helper
 * Inject this in browser console for advanced live editing
 */

// TekUp Live Editing Console Helper - Enhanced 2025 Edition
window.TekUpDevTools = {
  
  // Quick CSS injection
  css: (styles) => {
    const styleId = 'tekup-live-css';
    let styleEl = document.getElementById(styleId);
    
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    
    styleEl.textContent = styles;
    console.log('✅ CSS injected successfully');
  },
  
  // Live color palette testing
  testColors: () => {
    const colors = [
      '--ai-primary: rgb(51, 204, 255)',
      '--ai-secondary: rgb(153, 51, 255)',
      '--ai-accent: rgb(255, 102, 204)',
      '--holo-1: rgb(77, 230, 179)',
      '--holo-2: rgb(230, 77, 153)',
      '--holo-3: rgb(179, 128, 230)'
    ];
    
    const testStyles = `
      :root { ${colors.join('; ')}; }
      .color-test { 
        display: flex; 
        gap: 1rem; 
        padding: 2rem; 
        position: fixed; 
        top: 20px; 
        right: 20px; 
        z-index: 9999;
        background: rgba(0,0,0,0.8);
        border-radius: 1rem;
      }
      .color-test div { 
        width: 40px; 
        height: 40px; 
        border-radius: 8px; 
        cursor: pointer;
        transition: transform 0.2s;
      }
      .color-test div:hover { transform: scale(1.2); }
    `;
    
    this.css(testStyles);
    
    // Add color test UI
    if (!document.getElementById('color-test-ui')) {
      const colorTestUI = document.createElement('div');
      colorTestUI.id = 'color-test-ui';
      colorTestUI.className = 'color-test';
      
      colors.forEach((color, i) => {
        const colorDiv = document.createElement('div');
        colorDiv.style.backgroundColor = `var(--${color.split(':')[0].trim()})`;
        colorDiv.title = color;
        colorDiv.onclick = () => {
          navigator.clipboard.writeText(color);
          console.log('📋 Copied:', color);
        };
        colorTestUI.appendChild(colorDiv);
      });
      
      document.body.appendChild(colorTestUI);
      
      // Auto-remove after 10 seconds
      setTimeout(() => {
        colorTestUI?.remove();
      }, 10000);
    }
    
    console.log('🎨 Color palette test activated (10s)');
  },
  
  // Component state inspector
  inspectReact: () => {
    // Check if React DevTools is available
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log('⚛️ React DevTools detected');
      console.log('Fiber instances:', window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers);
    } else {
      console.log('❌ React DevTools not installed');
      console.log('💡 Install React Developer Tools browser extension');
    }
  },
  
  // Live animation testing
  testAnimations: () => {
    const animationCSS = `
      .anim-test {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 200px;
        height: 200px;
        background: linear-gradient(45deg, var(--ai-primary), var(--ai-secondary));
        border-radius: 20px;
        z-index: 9999;
        animation: tekup-pulse 2s ease-in-out infinite;
      }
      
      @keyframes tekup-pulse {
        0%, 100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
        50% { transform: translate(-50%, -50%) scale(1.2) rotate(180deg); }
      }
    `;
    
    this.css(animationCSS);
    
    if (!document.getElementById('anim-test')) {
      const animDiv = document.createElement('div');
      animDiv.id = 'anim-test';
      animDiv.className = 'anim-test';
      animDiv.onclick = () => animDiv.remove();
      document.body.appendChild(animDiv);
      
      setTimeout(() => animDiv?.remove(), 5000);
      console.log('✨ Animation test active (5s) - click to remove');
    }
  },
  
  // Grid overlay for layout testing
  showGrid: () => {
    const gridCSS = `
      .tekup-grid {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 9998;
        opacity: 0.5;
        background-image: 
          linear-gradient(rgba(255,0,0,0.3) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,0,0,0.3) 1px, transparent 1px);
        background-size: 20px 20px;
      }
    `;
    
    this.css(gridCSS);
    
    const gridId = 'tekup-grid-overlay';
    let gridEl = document.getElementById(gridId);
    
    if (!gridEl) {
      gridEl = document.createElement('div');
      gridEl.id = gridId;
      gridEl.className = 'tekup-grid';
      document.body.appendChild(gridEl);
      console.log('📐 Grid overlay ON - call showGrid() again to toggle');
    } else {
      gridEl.remove();
      console.log('📐 Grid overlay OFF');
    }
  },
  
  // CSS Performance Profiler
  profileCSS: () => {
    const startTime = performance.now();
    const styles = document.styleSheets;
    const stats = {
      totalStyleSheets: styles.length,
      totalRules: 0,
      tailwindClasses: 0,
      customProperties: 0,
      mediaQueries: 0,
      animations: 0
    };
    
    try {
      for (let sheet of styles) {
        if (sheet.cssRules) {
          stats.totalRules += sheet.cssRules.length;
          for (let rule of sheet.cssRules) {
            if (rule.cssText.includes('--')) stats.customProperties++;
            if (rule.cssText.includes('@media')) stats.mediaQueries++;
            if (rule.cssText.includes('@keyframes')) stats.animations++;
            if (rule.selectorText && rule.selectorText.includes('.')) {
              // Count potential Tailwind classes
              const selectors = rule.selectorText.split(',');
              selectors.forEach(sel => {
                if (sel.match(/\.(bg-|text-|p-|m-|flex|grid|w-|h-)/)) {
                  stats.tailwindClasses++;
                }
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn('Some stylesheets could not be analyzed due to CORS restrictions');
    }
    
    const endTime = performance.now();
    stats.analysisTime = `${(endTime - startTime).toFixed(2)}ms`;
    
    console.log('🚀 CSS Performance Profile:', stats);
    return stats;
  },
  
  // Tailwind Class Generator
  generateTailwind: (type, values) => {
    const generators = {
      spacing: (vals) => vals.map(v => [`p-${v}`, `m-${v}`, `px-${v}`, `py-${v}`, `mx-${v}`, `my-${v}`]).flat(),
      colors: (vals) => vals.map(v => [`bg-${v}`, `text-${v}`, `border-${v}`, `ring-${v}`]).flat(),
      sizing: (vals) => vals.map(v => [`w-${v}`, `h-${v}`, `min-w-${v}`, `min-h-${v}`, `max-w-${v}`, `max-h-${v}`]).flat(),
      flex: () => ['flex', 'flex-col', 'flex-row', 'flex-wrap', 'flex-nowrap', 'justify-center', 'justify-between', 'justify-around', 'items-center', 'items-start', 'items-end'],
      grid: (vals) => [`grid-cols-${vals[0] || 12}`, `grid-rows-${vals[1] || 6}`, 'grid', 'gap-4', 'col-span-2', 'row-span-2']
    };
    
    const classes = generators[type] ? generators[type](values) : [];
    console.log(`🎨 Generated ${type} classes:`, classes);
    
    // Copy to clipboard
    navigator.clipboard.writeText(classes.join(' '));
    console.log('📋 Classes copied to clipboard!');
    
    return classes;
  },
  
  // P3 Color Space Utilities
  p3Colors: {
    convert: (hex) => {
      // Convert hex to P3 color space
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      
      const p3Color = `color(display-p3 ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)})`;
      console.log(`🎨 P3 Color: ${p3Color}`);
      navigator.clipboard.writeText(p3Color);
      return p3Color;
    },
    
    test: () => {
      const testDiv = document.createElement('div');
      testDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        width: 300px;
        height: 100px;
        background: color(display-p3 1 0.5 0.8);
        border: 2px solid color(display-p3 0.2 0.8 0.4);
        border-radius: 10px;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-family: system-ui;
      `;
      testDiv.textContent = 'P3 Wide Gamut Colors!';
      testDiv.onclick = () => testDiv.remove();
      document.body.appendChild(testDiv);
      
      setTimeout(() => testDiv?.remove(), 5000);
      console.log('🌈 P3 color test active (click or wait 5s)');
    }
  },
  
  // Container Query Debugger
  debugContainers: () => {
    const containerCSS = `
      .container-debug {
        outline: 2px dashed #ff6b6b !important;
        position: relative !important;
      }
      .container-debug::before {
        content: attr(data-container-size);
        position: absolute;
        top: -20px;
        left: 0;
        background: #ff6b6b;
        color: white;
        padding: 2px 6px;
        font-size: 12px;
        font-family: monospace;
        border-radius: 3px;
        z-index: 1000;
      }
    `;
    
    this.css(containerCSS);
    
    // Find and highlight container query elements
    const containers = document.querySelectorAll('[style*="container"], .container, [class*="@"]');
    containers.forEach(el => {
      el.classList.add('container-debug');
      const rect = el.getBoundingClientRect();
      el.setAttribute('data-container-size', `${Math.round(rect.width)}x${Math.round(rect.height)}px`);
    });
    
    console.log(`🔍 Found ${containers.length} potential container query elements`);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      containers.forEach(el => {
        el.classList.remove('container-debug');
        el.removeAttribute('data-container-size');
      });
    }, 10000);
  },
  
  // Quick help
  help: () => {
    console.log(`
🚀 TekUp DevTools Helper Commands - Enhanced 2025 Edition:

=== CORE TOOLS ===
TekUpDevTools.css('your css here')     - Inject live CSS
TekUpDevTools.testColors()             - Test color palette
TekUpDevTools.testAnimations()         - Test animations
TekUpDevTools.showGrid()               - Toggle layout grid
TekUpDevTools.inspectReact()           - Check React setup

=== NEW 2025 FEATURES ===
TekUpDevTools.profileCSS()             - Analyze CSS performance
TekUpDevTools.generateTailwind(type, values) - Generate Tailwind classes
TekUpDevTools.p3Colors.convert('#hex') - Convert to P3 color space
TekUpDevTools.p3Colors.test()          - Test P3 wide gamut colors
TekUpDevTools.debugContainers()        - Highlight container queries
TekUpDevTools.help()                   - Show this help

=== EXAMPLES ===
TekUpDevTools.generateTailwind('colors', ['red-500', 'blue-600'])
TekUpDevTools.generateTailwind('flex')
TekUpDevTools.p3Colors.convert('#ff6b6b')

💡 Tips:
- All changes are temporary and reset on page refresh
- Use browser's Elements tab to inspect changes
- Right-click elements and select "Inspect" for targeted editing
- Use Ctrl+Shift+T/G/A for quick keyboard shortcuts
    `);
  }
};

// Auto-initialize
console.log('🛠️ TekUp DevTools loaded! Type TekUpDevTools.help() for commands');

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl+Shift+T = Test colors
  if (e.ctrlKey && e.shiftKey && e.key === 'T') {
    e.preventDefault();
    window.TekUpDevTools.testColors();
  }
  
  // Ctrl+Shift+G = Toggle grid
  if (e.ctrlKey && e.shiftKey && e.key === 'G') {
    e.preventDefault();
    window.TekUpDevTools.showGrid();
  }
  
  // Ctrl+Shift+A = Test animations
  if (e.ctrlKey && e.shiftKey && e.key === 'A') {
    e.preventDefault();
    window.TekUpDevTools.testAnimations();
  }
  
  // Ctrl+Shift+P = Profile CSS performance
  if (e.ctrlKey && e.shiftKey && e.key === 'P') {
    e.preventDefault();
    window.TekUpDevTools.profileCSS();
  }
  
  // Ctrl+Shift+C = Debug containers
  if (e.ctrlKey && e.shiftKey && e.key === 'C') {
    e.preventDefault();
    window.TekUpDevTools.debugContainers();
  }
  
  // Ctrl+Shift+3 = Test P3 colors (3 for P3)
  if (e.ctrlKey && e.shiftKey && e.key === '3') {
    e.preventDefault();
    window.TekUpDevTools.p3Colors.test();
  }
});

console.log('⌨️ Enhanced shortcuts: Ctrl+Shift+T/G/A/P/C/3');
