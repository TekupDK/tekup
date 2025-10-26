import React from 'react';

// Core AdaptiveUI system
export { AdaptiveUI } from './AdaptiveUI';
export { BehaviorTracker } from './BehaviorTracker';
export { LayoutGenerator } from './LayoutGenerator';
export { ABTester } from './ABTester';

// React component
export { AdaptiveUIComponent } from './AdaptiveUIComponent';

// Types and interfaces
export type {
  UserInteraction,
  BehaviorPattern,
  UILayout,
  UIComponent,
  LayoutGrid,
  StyleConfig,
  ColorPalette,
  TypographyConfig,
  SpacingConfig,
  AnimationConfig,
  PerformanceMetrics
} from './AdaptiveUI';

export type {
  UserSession
} from './BehaviorTracker';

export type {
  LayoutConfig,
  LayoutVariation
} from './LayoutGenerator';

export type {
  ABTestResult,
  TestConfig
} from './ABTester';

// Legacy button component
export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => {
  return <button {...props} />;
};
