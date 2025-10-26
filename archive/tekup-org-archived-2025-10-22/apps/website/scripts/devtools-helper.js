// Enhanced DevTools Helper for CSS Development with Tailwind CSS 4.1
// To use: Copy and paste into Chrome DevTools Console or save as Snippet

window.TekupCSSTools = {
    // CSS Performance Profiler
    performanceProfiler: {
        startProfiler() {
            console.log('🚀 Starting CSS Performance Profiler...');
            this.startTime = performance.now();
            this.initialStyles = document.querySelectorAll('style, link[rel="stylesheet"]').length;
            this.observer = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    if (entry.name.includes('.css') || entry.initiatorType === 'css') {
                        console.log(`📊 CSS Resource: ${entry.name}, Duration: ${entry.duration}ms`);
                    }
                });
            });
            this.observer.observe({entryTypes: ['resource', 'measure']});
        },

        stopProfiler() {
            const endTime = performance.now();
            const duration = endTime - this.startTime;
            const finalStyles = document.querySelectorAll('style, link[rel="stylesheet"]').length;
            
            console.log(`⏱️ CSS Profiling Complete:
            - Total Duration: ${duration}ms
            - Style Sheets: ${this.initialStyles} → ${finalStyles}
            - New Styles: ${finalStyles - this.initialStyles}`);
            
            if (this.observer) this.observer.disconnect();
        },

        analyzeCSS() {
            const stylesheets = Array.from(document.styleSheets);
            const stats = {
                totalRules: 0,
                tailwindClasses: 0,
                customRules: 0,
                mediaQueries: 0,
                animationRules: 0
            };

            stylesheets.forEach(sheet => {
                try {
                    const rules = Array.from(sheet.cssRules || sheet.rules || []);
                    stats.totalRules += rules.length;
                    
                    rules.forEach(rule => {
                        if (rule.type === CSSRule.MEDIA_RULE) stats.mediaQueries++;
                        if (rule.type === CSSRule.KEYFRAMES_RULE) stats.animationRules++;
                        if (rule.selectorText && rule.selectorText.includes('.')) {
                            if (rule.selectorText.match(/\.(bg-|text-|p-|m-|flex|grid)/)) {
                                stats.tailwindClasses++;
                            } else {
                                stats.customRules++;
                            }
                        }
                    });
                } catch (e) {
                    console.warn('Cannot access stylesheet:', sheet.href);
                }
            });

            console.table(stats);
            return stats;
        }
    },

    // Tailwind Class Generator
    tailwindGenerator: {
        generateClasses(type, values) {
            const generators = {
                spacing: (vals) => vals.map(v => [`p-${v}`, `m-${v}`, `px-${v}`, `py-${v}`, `mx-${v}`, `my-${v}`]).flat(),
                colors: (vals) => vals.map(v => [`bg-${v}`, `text-${v}`, `border-${v}`]).flat(),
                sizes: (vals) => vals.map(v => [`w-${v}`, `h-${v}`, `min-w-${v}`, `min-h-${v}`, `max-w-${v}`, `max-h-${v}`]).flat(),
                flex: () => ['flex', 'flex-col', 'flex-row', 'flex-wrap', 'justify-center', 'justify-between', 'justify-around', 'items-center', 'items-start', 'items-end'],
                grid: (vals) => vals.map(v => [`grid-cols-${v}`, `grid-rows-${v}`, `col-span-${v}`, `row-span-${v}`]).flat()
            };

            const classes = generators[type]?.(values) || [];
            console.log(`🎨 Generated ${type} classes:`, classes);
            
            // Copy to clipboard
            navigator.clipboard.writeText(classes.join(' ')).then(() => {
                console.log('📋 Classes copied to clipboard!');
            });

            return classes;
        },

        suggestClasses(element) {
            const computed = getComputedStyle(element);
            const suggestions = [];

            // Analyze current styles and suggest Tailwind equivalents
            if (computed.display === 'flex') {
                suggestions.push('flex');
                if (computed.flexDirection === 'column') suggestions.push('flex-col');
                if (computed.justifyContent === 'center') suggestions.push('justify-center');
                if (computed.alignItems === 'center') suggestions.push('items-center');
            }

            if (computed.display === 'grid') {
                suggestions.push('grid');
                const cols = computed.gridTemplateColumns.split(' ').length;
                if (cols <= 12) suggestions.push(`grid-cols-${cols}`);
            }

            // Color suggestions
            const bg = computed.backgroundColor;
            const text = computed.color;
            if (bg !== 'rgba(0, 0, 0, 0)') suggestions.push('bg-[custom]');
            if (text !== 'rgb(0, 0, 0)') suggestions.push('text-[custom]');

            console.log('💡 Suggested Tailwind classes for element:', suggestions);
            return suggestions;
        }
    },

    // P3 Color Space Utilities
    p3Colors: {
        convertToP3(hex) {
            // Convert hex to RGB
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;

            // Simple P3 conversion (approximation)
            const p3 = `color(display-p3 ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)})`;
            console.log(`🌈 P3 Color: ${hex} → ${p3}`);
            
            navigator.clipboard.writeText(p3);
            return p3;
        },

        generateP3Palette(baseHex, count = 5) {
            const palette = [];
            const baseHue = this.hexToHsl(baseHex)[0];
            
            for (let i = 0; i < count; i++) {
                const hue = (baseHue + (i * 30)) % 360;
                const hex = this.hslToHex(hue, 70, 50);
                const p3 = this.convertToP3(hex);
                palette.push({ hex, p3, hue });
            }

            console.log('🎨 P3 Color Palette Generated:', palette);
            return palette;
        },

        hexToHsl(hex) {
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;

            if (max === min) {
                h = s = 0; // achromatic
            } else {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }

            return [h * 360, s * 100, l * 100];
        },

        hslToHex(h, s, l) {
            l /= 100;
            const a = s * Math.min(l, 1 - l) / 100;
            const f = n => {
                const k = (n + h / 30) % 12;
                const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
                return Math.round(255 * color).toString(16).padStart(2, '0');
            };
            return `#${f(0)}${f(8)}${f(4)}`;
        }
    },

    // Container Query Debugger
    containerQueries: {
        highlightContainers() {
            const containers = document.querySelectorAll('[style*="container-type"], .container');
            containers.forEach((container, index) => {
                container.style.outline = `3px solid hsl(${index * 60}, 70%, 50%)`;
                container.style.position = 'relative';
                
                const label = document.createElement('div');
                label.textContent = `Container ${index + 1}: ${container.offsetWidth}px`;
                label.style.cssText = `
                    position: absolute;
                    top: -20px;
                    left: 0;
                    background: hsl(${index * 60}, 70%, 50%);
                    color: white;
                    padding: 2px 6px;
                    font-size: 10px;
                    z-index: 9999;
                `;
                container.appendChild(label);
            });

            console.log(`📦 Highlighted ${containers.length} container query elements`);
        },

        testQueries(element = document.body) {
            const observer = new ResizeObserver(entries => {
                entries.forEach(entry => {
                    const { width, height } = entry.contentRect;
                    console.log(`📏 Container size changed: ${width}px × ${height}px`);
                    
                    // Apply container query breakpoints
                    const breakpoints = {
                        sm: 320,
                        md: 768,
                        lg: 1024,
                        xl: 1280
                    };

                    Object.entries(breakpoints).forEach(([key, value]) => {
                        element.classList.toggle(`cq-${key}`, width >= value);
                    });
                });
            });

            observer.observe(element);
            console.log('👀 Container query observer started');
            return observer;
        }
    },

    // CSS Grid Inspector
    gridInspector: {
        inspectGrid(selector = '.grid, [style*="display: grid"], [style*="display:grid"]') {
            const grids = document.querySelectorAll(selector);
            
            grids.forEach((grid, index) => {
                const computed = getComputedStyle(grid);
                const info = {
                    element: grid,
                    columns: computed.gridTemplateColumns,
                    rows: computed.gridTemplateRows,
                    gap: computed.gap,
                    areas: computed.gridTemplateAreas
                };

                // Visual overlay
                const overlay = document.createElement('div');
                overlay.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(255, 0, 0, 0.1);
                    border: 2px solid red;
                    pointer-events: none;
                    z-index: 9998;
                `;

                grid.style.position = 'relative';
                grid.appendChild(overlay);

                console.log(`🔍 Grid ${index + 1} Analysis:`, info);
            });

            return grids;
        },

        showGridLines() {
            const style = document.createElement('style');
            style.textContent = `
                .grid-debug, [style*="display: grid"], [style*="display:grid"] {
                    position: relative;
                }
                .grid-debug::before, [style*="display: grid"]::before, [style*="display:grid"]::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-image: 
                        repeating-linear-gradient(0deg, rgba(255,0,0,0.1) 0px, rgba(255,0,0,0.1) 1px, transparent 1px, transparent 20px),
                        repeating-linear-gradient(90deg, rgba(255,0,0,0.1) 0px, rgba(255,0,0,0.1) 1px, transparent 1px, transparent 20px);
                    pointer-events: none;
                    z-index: 9997;
                }
            `;
            document.head.appendChild(style);
            console.log('📐 Grid lines overlay enabled');
        }
    },

    // Flexbox Debugger
    flexboxDebugger: {
        inspectFlex(selector = '.flex, [style*="display: flex"], [style*="display:flex"]') {
            const flexContainers = document.querySelectorAll(selector);
            
            flexContainers.forEach((flex, index) => {
                const computed = getComputedStyle(flex);
                const info = {
                    element: flex,
                    direction: computed.flexDirection,
                    wrap: computed.flexWrap,
                    justify: computed.justifyContent,
                    align: computed.alignItems,
                    gap: computed.gap
                };

                // Add visual indicators
                flex.style.outline = '2px solid blue';
                
                const children = Array.from(flex.children);
                children.forEach((child, childIndex) => {
                    child.style.outline = '1px dashed lightblue';
                    child.setAttribute('data-flex-item', childIndex + 1);
                });

                console.log(`🔧 Flex Container ${index + 1} Analysis:`, info);
            });

            return flexContainers;
        },

        highlightFlexIssues() {
            const flexItems = document.querySelectorAll('.flex > *, [style*="display: flex"] > *, [style*="display:flex"] > *');
            
            flexItems.forEach(item => {
                const computed = getComputedStyle(item);
                const parent = item.parentElement;
                const parentComputed = getComputedStyle(parent);

                // Check for common flex issues
                if (computed.minWidth === 'auto' && parentComputed.flexDirection === 'row') {
                    item.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
                    console.warn('⚠️ Potential flex shrinking issue:', item);
                }

                if (computed.overflow === 'visible' && item.scrollWidth > item.offsetWidth) {
                    item.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
                    console.warn('⚠️ Content overflow in flex item:', item);
                }
            });
        }
    },

    // Animation Performance Monitor
    animationMonitor: {
        startMonitoring() {
            const animations = document.getAnimations();
            console.log(`🎬 Monitoring ${animations.length} animations`);

            this.observer = new PerformanceObserver(list => {
                list.getEntries().forEach(entry => {
                    if (entry.entryType === 'measure' && entry.name.includes('animation')) {
                        console.log(`⚡ Animation Performance: ${entry.name}, Duration: ${entry.duration}ms`);
                    }
                });
            });

            this.observer.observe({ entryTypes: ['measure'] });
            
            // Monitor frame rate
            this.frameCount = 0;
            this.lastTime = performance.now();
            this.monitorFrames();
        },

        monitorFrames() {
            this.frameCount++;
            const now = performance.now();
            
            if (now - this.lastTime >= 1000) {
                const fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
                if (fps < 55) {
                    console.warn(`⚠️ Low FPS detected: ${fps}fps`);
                } else {
                    console.log(`✅ FPS: ${fps}fps`);
                }
                this.frameCount = 0;
                this.lastTime = now;
            }

            if (this.monitoring) {
                requestAnimationFrame(() => this.monitorFrames());
            }
        },

        stopMonitoring() {
            this.monitoring = false;
            if (this.observer) this.observer.disconnect();
            console.log('⏹️ Animation monitoring stopped');
        }
    },

    // Quick Actions
    quickActions: {
        injectTailwindPlayground() {
            const playground = document.createElement('div');
            playground.id = 'tailwind-playground';
            playground.innerHTML = `
                <div style="
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    width: 300px;
                    background: white;
                    border: 1px solid #ccc;
                    border-radius: 8px;
                    padding: 16px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 10000;
                    font-family: monospace;
                    font-size: 12px;
                ">
                    <h4 style="margin: 0 0 10px 0; font-weight: bold;">Tailwind Playground</h4>
                    <textarea id="tailwind-input" placeholder="Enter Tailwind classes..." style="
                        width: 100%;
                        height: 60px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        padding: 8px;
                        margin-bottom: 8px;
                        resize: vertical;
                    "></textarea>
                    <div id="tailwind-preview" style="
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        padding: 8px;
                        min-height: 40px;
                        background: #f9f9f9;
                    ">Preview will appear here</div>
                    <button onclick="window.TekupCSSTools.quickActions.closeTailwindPlayground()" style="
                        position: absolute;
                        top: 8px;
                        right: 8px;
                        background: none;
                        border: none;
                        font-size: 16px;
                        cursor: pointer;
                    ">×</button>
                </div>
            `;
            document.body.appendChild(playground);

            // Add event listener for real-time preview
            const input = document.getElementById('tailwind-input');
            const preview = document.getElementById('tailwind-preview');
            
            input.addEventListener('input', (e) => {
                preview.className = e.target.value;
                preview.textContent = `Classes: ${e.target.value}`;
            });

            console.log('🎮 Tailwind Playground injected');
        },

        closeTailwindPlayground() {
            const playground = document.getElementById('tailwind-playground');
            if (playground) playground.remove();
        },

        extractAllColors() {
            const elements = document.querySelectorAll('*');
            const colors = new Set();

            elements.forEach(el => {
                const computed = getComputedStyle(el);
                [computed.color, computed.backgroundColor, computed.borderColor].forEach(color => {
                    if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'rgb(0, 0, 0)') {
                        colors.add(color);
                    }
                });
            });

            const colorArray = Array.from(colors);
            console.log(`🎨 Extracted ${colorArray.length} unique colors:`, colorArray);
            navigator.clipboard.writeText(colorArray.join('\n'));
            return colorArray;
        }
    },

    // Initialize all tools
    init() {
        console.log(`
🚀 Tekup CSS Tools Loaded!

Available tools:
- performanceProfiler: CSS performance monitoring
- tailwindGenerator: Generate and suggest Tailwind classes
- p3Colors: P3 color space utilities
- containerQueries: Container query debugging
- gridInspector: CSS Grid analysis tools  
- flexboxDebugger: Flexbox debugging utilities
- animationMonitor: Animation performance tracking
- quickActions: Quick development actions

Usage examples:
- TekupCSSTools.performanceProfiler.startProfiler()
- TekupCSSTools.tailwindGenerator.generateClasses('spacing', [1,2,4,8])
- TekupCSSTools.p3Colors.convertToP3('#ff0000')
- TekupCSSTools.quickActions.injectTailwindPlayground()
        `);

        // Auto-start some tools
        this.containerQueries.highlightContainers();
        this.performanceProfiler.analyzeCSS();
    }
};

// Auto-initialize
if (typeof window !== 'undefined') {
    window.TekupCSSTools.init();
}

// Export for snippet usage
window.TekupCSSTools;