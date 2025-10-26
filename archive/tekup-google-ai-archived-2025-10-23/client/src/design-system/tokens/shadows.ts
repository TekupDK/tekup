/**
 * RenOS Design System - Shadow Tokens
 * Inspired by: Cursor, Linear, Material Design 3
 * 
 * Elevation system for depth and hierarchy
 * Optimized for dark mode
 */

export const shadows = {
  // Elevation levels
  none: 'none',
  
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  
  // Colored shadows (for CTAs and highlights)
  brandGlow: '0 0 20px rgba(14, 165, 233, 0.3)',
  successGlow: '0 0 20px rgba(34, 197, 94, 0.3)',
  dangerGlow: '0 0 20px rgba(239, 68, 68, 0.3)',
  
  // Inner shadow
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
} as const;

// Type-safe shadow access
export type Shadow = keyof typeof shadows;
