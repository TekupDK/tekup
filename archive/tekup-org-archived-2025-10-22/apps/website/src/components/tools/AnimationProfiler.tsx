import React, { useState, useEffect, useRef } from 'react';

interface AnimationData {
  name: string;
  duration: number;
  iterations: number;
  fps: number[];
  averageFps: number;
  droppedFrames: number;
  cpuUsage: number;
  memoryUsage: number;
  element: HTMLElement;
  status: 'running' | 'paused' | 'finished' | 'idle';
}

interface PerformanceMetrics {
  timestamp: number;
  fps: number;
  cpuUsage: number;
  memoryUsage: number;
}

export const AnimationProfiler: React.FC = () => {
  const [animations, setAnimations] = useState<AnimationData[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics[]>([]);
  const [selectedAnimation, setSelectedAnimation] = useState<string | null>(null);
  const monitoringRef = useRef<number>();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Monitor animation performance
  useEffect(() => {
    if (isMonitoring) {
      const monitor = () => {
        const animElements = document.querySelectorAll('*');
        const activeAnimations: AnimationData[] = [];

        animElements.forEach((element) => {
          const animations = (element as HTMLElement).getAnimations?.();
          if (animations && animations.length > 0) {
            animations.forEach((animation) => {
              const animData: AnimationData = {
                name: animation.animationName || animation.id || 'unnamed',
                duration: animation.effect?.getTiming().duration as number || 0,
                iterations: animation.effect?.getTiming().iterations as number || 1,
                fps: [],
                averageFps: 0,
                droppedFrames: 0,
                cpuUsage: 0,
                memoryUsage: 0,
                element: element as HTMLElement,
                status: animation.playState as AnimationData['status']
              };

              // Measure FPS
              measureAnimationFPS(animation, animData);
              activeAnimations.push(animData);
            });
          }
        });

        setAnimations(activeAnimations);
        
        // Record performance metrics
        const metrics: PerformanceMetrics = {
          timestamp: Date.now(),
          fps: calculateCurrentFPS(),
          cpuUsage: estimateCPUUsage(),
          memoryUsage: getMemoryUsage()
        };

        setPerformanceData(prev => {
          const newData = [...prev, metrics];
          return newData.slice(-100); // Keep last 100 data points
        });

        monitoringRef.current = requestAnimationFrame(monitor);
      };

      monitoringRef.current = requestAnimationFrame(monitor);
    } else if (monitoringRef.current) {
      cancelAnimationFrame(monitoringRef.current);
    }

    return () => {
      if (monitoringRef.current) {
        cancelAnimationFrame(monitoringRef.current);
      }
    };
  }, [isMonitoring]);

  // Draw performance graph
  useEffect(() => {
    if (canvasRef.current && performanceData.length > 0) {
      drawPerformanceGraph();
    }
  }, [performanceData]);

  const measureAnimationFPS = (animation: Animation, animData: AnimationData) => {
    let frameCount = 0;
    let lastTime = performance.now();
    const fpsValues: number[] = [];

    const measureFrame = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      
      if (deltaTime >= 16.67) { // ~60fps threshold
        const fps = 1000 / deltaTime;
        fpsValues.push(fps);
        frameCount++;
        lastTime = currentTime;

        if (fps < 50) {
          animData.droppedFrames++;
        }
      }

      if (animation.playState === 'running') {
        requestAnimationFrame(measureFrame);
      }
    };

    if (animation.playState === 'running') {
      requestAnimationFrame(measureFrame);
    }

    animData.fps = fpsValues;
    animData.averageFps = fpsValues.length > 0 
      ? fpsValues.reduce((sum, fps) => sum + fps, 0) / fpsValues.length 
      : 0;
  };

  const calculateCurrentFPS = (): number => {
    // Simplified FPS calculation
    return 60; // Placeholder - would need more complex implementation
  };

  const estimateCPUUsage = (): number => {
    // Simplified CPU usage estimation
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      Math.random();
    }
    const end = performance.now();
    return Math.min((end - start) * 10, 100);
  };

  const getMemoryUsage = (): number => {
    // @ts-ignore - performance.memory is not in all browsers
    if (performance.memory) {
      // @ts-ignore
      return (performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize) * 100;
    }
    return 0;
  };

  const drawPerformanceGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let i = 0; i < width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let i = 0; i < height; i += 25) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    if (performanceData.length < 2) return;

    const dataLength = performanceData.length;
    const xStep = width / (dataLength - 1);

    // Draw FPS line
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    performanceData.forEach((data, index) => {
      const x = index * xStep;
      const y = height - (data.fps / 60) * height;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw CPU usage line
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    performanceData.forEach((data, index) => {
      const x = index * xStep;
      const y = height - (data.cpuUsage / 100) * height;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw Memory usage line
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    performanceData.forEach((data, index) => {
      const x = index * xStep;
      const y = height - (data.memoryUsage / 100) * height;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
  };

  const highlightAnimationElement = (animation: AnimationData) => {
    // Remove previous highlights
    document.querySelectorAll('.animation-highlight').forEach(el => {
      el.classList.remove('animation-highlight');
    });

    // Add highlight to current element
    if (animation.element) {
      animation.element.classList.add('animation-highlight');
      animation.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    setSelectedAnimation(animation.name);
  };

  const pauseAnimation = (animation: AnimationData) => {
    const animations = animation.element.getAnimations?.();
    animations?.forEach(anim => {
      if (anim.animationName === animation.name) {
        anim.pause();
      }
    });
  };

  const resumeAnimation = (animation: AnimationData) => {
    const animations = animation.element.getAnimations?.();
    animations?.forEach(anim => {
      if (anim.animationName === animation.name) {
        anim.play();
      }
    });
  };

  const getPerformanceStatus = (animation: AnimationData) => {
    if (animation.averageFps >= 55) return { status: 'excellent', color: 'text-green-400', bg: 'bg-green-900/20' };
    if (animation.averageFps >= 45) return { status: 'good', color: 'text-yellow-400', bg: 'bg-yellow-900/20' };
    if (animation.averageFps >= 30) return { status: 'poor', color: 'text-orange-400', bg: 'bg-orange-900/20' };
    return { status: 'critical', color: 'text-red-400', bg: 'bg-red-900/20' };
  };

  return (
    <div className="animation-profiler bg-gray-800 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">🎬 Animation Performance Profiler</h3>
          <p className="text-sm text-gray-400">Monitor CSS animations and their performance impact</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isMonitoring 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isMonitoring ? '⏹️ Stop Monitoring' : '▶️ Start Monitoring'}
          </button>
          <div className="text-sm text-gray-400">
            Active: {animations.length} animations
          </div>
        </div>
      </div>

      {/* Performance Graph */}
      <div className="bg-gray-900 rounded-lg p-4">
        <h4 className="text-lg font-medium text-white mb-3">Real-time Performance Metrics</h4>
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={800}
            height={200}
            className="w-full border border-gray-700 rounded bg-gray-950"
          />
          <div className="absolute top-2 right-2 flex flex-col gap-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-green-500"></div>
              <span className="text-gray-300">FPS</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-yellow-500"></div>
              <span className="text-gray-300">CPU %</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-purple-500"></div>
              <span className="text-gray-300">Memory %</span>
            </div>
          </div>
        </div>
      </div>

      {/* Animation List */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-white">Active Animations</h4>
        
        {animations.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            {isMonitoring ? 'No animations detected' : 'Start monitoring to detect animations'}
          </div>
        ) : (
          <div className="grid gap-4">
            {animations.map((animation, index) => {
              const perfStatus = getPerformanceStatus(animation);
              
              return (
                <div
                  key={`${animation.name}-${index}`}
                  className={`border border-gray-600 rounded-lg p-4 transition-all ${
                    selectedAnimation === animation.name ? 'ring-2 ring-cyan-500 bg-gray-700/50' : 'bg-gray-750'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${perfStatus.bg} ${perfStatus.color}`}>
                        {perfStatus.status.toUpperCase()}
                      </div>
                      <h5 className="font-medium text-white">{animation.name}</h5>
                      <div className={`px-2 py-1 rounded text-xs ${
                        animation.status === 'running' ? 'bg-green-900/20 text-green-400' :
                        animation.status === 'paused' ? 'bg-yellow-900/20 text-yellow-400' :
                        'bg-gray-600 text-gray-300'
                      }`}>
                        {animation.status}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => highlightAnimationElement(animation)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs transition-colors"
                        title="Highlight Element"
                      >
                        🎯
                      </button>
                      {animation.status === 'running' ? (
                        <button
                          onClick={() => pauseAnimation(animation)}
                          className="p-2 bg-yellow-600 hover:bg-yellow-700 rounded text-white text-xs transition-colors"
                          title="Pause Animation"
                        >
                          ⏸️
                        </button>
                      ) : animation.status === 'paused' ? (
                        <button
                          onClick={() => resumeAnimation(animation)}
                          className="p-2 bg-green-600 hover:bg-green-700 rounded text-white text-xs transition-colors"
                          title="Resume Animation"
                        >
                          ▶️
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Duration:</span>
                      <div className="font-mono text-white">
                        {animation.duration ? `${(animation.duration / 1000).toFixed(2)}s` : 'infinite'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Average FPS:</span>
                      <div className={`font-mono ${perfStatus.color}`}>
                        {animation.averageFps.toFixed(1)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Dropped Frames:</span>
                      <div className={`font-mono ${animation.droppedFrames > 5 ? 'text-red-400' : 'text-green-400'}`}>
                        {animation.droppedFrames}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Iterations:</span>
                      <div className="font-mono text-white">
                        {animation.iterations === Infinity ? '∞' : animation.iterations}
                      </div>
                    </div>
                  </div>

                  {animation.fps.length > 0 && (
                    <div className="mt-3">
                      <span className="text-gray-400 text-sm">FPS History:</span>
                      <div className="flex items-end gap-1 mt-2 h-8">
                        {animation.fps.slice(-20).map((fps, i) => (
                          <div
                            key={i}
                            className={`w-2 rounded-t ${
                              fps >= 55 ? 'bg-green-500' :
                              fps >= 45 ? 'bg-yellow-500' :
                              fps >= 30 ? 'bg-orange-500' :
                              'bg-red-500'
                            }`}
                            style={{ height: `${Math.max((fps / 60) * 100, 5)}%` }}
                            title={`${fps.toFixed(1)} FPS`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Performance Tips */}
      <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4">
        <h4 className="text-lg font-medium text-blue-400 mb-2">💡 Performance Tips</h4>
        <ul className="text-sm text-blue-200 space-y-1">
          <li>• Use <code className="bg-blue-800 px-1 rounded">transform</code> and <code className="bg-blue-800 px-1 rounded">opacity</code> for smooth animations</li>
          <li>• Avoid animating properties that trigger layout or paint (width, height, etc.)</li>
          <li>• Use <code className="bg-blue-800 px-1 rounded">will-change</code> property to optimize expensive animations</li>
          <li>• Consider using CSS <code className="bg-blue-800 px-1 rounded">transform3d()</code> to enable hardware acceleration</li>
          <li>• Limit simultaneous animations and use <code className="bg-blue-800 px-1 rounded">animation-fill-mode</code> appropriately</li>
        </ul>
      </div>

      {/* Add CSS for highlighting */}
      <style jsx global>{`
        .animation-highlight {
          outline: 3px solid #06b6d4 !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 0 6px rgba(6, 182, 212, 0.2) !important;
          transition: all 0.3s ease !important;
        }
      `}</style>
    </div>
  );
};