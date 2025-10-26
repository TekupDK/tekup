// Global type declarations for enhanced CSS development tools

interface TekupCSSTools {
  performanceProfiler: {
    startProfiler(): void;
    stopProfiler(): void;
    analyzeCSS(): any;
  };
  tailwindGenerator: {
    generateClasses(type: string, values?: any[]): string[];
    suggestClasses(element: HTMLElement): string[];
  };
  p3Colors: {
    convertToP3(hex: string): string;
    generateP3Palette(baseHex: string, count?: number): any[];
  };
  containerQueries: {
    highlightContainers(): void;
    testQueries(element?: HTMLElement): ResizeObserver;
  };
  gridInspector: {
    inspectGrid(selector?: string): HTMLElement[];
    showGridLines(): void;
  };
  flexboxDebugger: {
    inspectFlex(selector?: string): HTMLElement[];
    highlightFlexIssues(): void;
  };
  animationMonitor: {
    startMonitoring(): void;
    stopMonitoring(): void;
  };
  quickActions: {
    injectTailwindPlayground(): void;
    closeTailwindPlayground(): void;
    extractAllColors(): string[];
  };
  init(): void;
}

declare global {
  interface Window {
    TekupCSSTools: TekupCSSTools;
  }
}

export {};