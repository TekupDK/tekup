/**
 * RenOS Design System - Typography Tokens
 * Inspired by: Cursor, Linear, Stripe
 * 
 * Modular scale with responsive support
 * Professional font stack with system fallbacks
 */

export const typography = {
  // Font Families
  fontFamily: {
    sans: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", Consolas, Monaco, "Courier New", monospace',
  },

  // Font Sizes (Modular scale 1.25)
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px (default)
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
    '6xl': '3.75rem',   // 60px
    '7xl': '4.5rem',    // 72px
  },

  // Font Weights
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  // Line Heights (optimized for readability)
  lineHeight: {
    none: 1,
    tight: 1.2,   // Headlines
    snug: 1.4,    // Subheadlines
    normal: 1.6,  // Body text
    relaxed: 1.8, // Long-form content
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// Type-safe typography access
export type FontSize = keyof typeof typography.fontSize;
export type FontWeight = keyof typeof typography.fontWeight;
export type LineHeight = keyof typeof typography.lineHeight;
export type LetterSpacing = keyof typeof typography.letterSpacing;
