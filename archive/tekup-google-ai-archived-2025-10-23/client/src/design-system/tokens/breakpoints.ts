/**
 * RenOS Design System - Breakpoint Tokens
 * Inspired by: Tailwind CSS, Bootstrap 5
 * 
 * Mobile-first responsive breakpoints
 * Matches common device sizes
 */

export const breakpoints = {
  // Mobile first
  sm: '640px',    // Small devices (large phones)
  md: '768px',    // Medium devices (tablets)
  lg: '1024px',   // Large devices (desktops)
  xl: '1280px',   // Extra large devices (large desktops)
  '2xl': '1536px', // 2X Extra large devices (huge screens)
} as const;

// Numeric breakpoints (for JS usage)
export const breakpointsNum = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// Media queries (ready-to-use)
export const mediaQueries = {
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`,
  
  // Max-width queries (for mobile-only styles)
  smDown: `@media (max-width: ${breakpoints.sm})`,
  mdDown: `@media (max-width: ${breakpoints.md})`,
  lgDown: `@media (max-width: ${breakpoints.lg})`,
  xlDown: `@media (max-width: ${breakpoints.xl})`,
} as const;

// Type-safe breakpoint access
export type Breakpoint = keyof typeof breakpoints;
