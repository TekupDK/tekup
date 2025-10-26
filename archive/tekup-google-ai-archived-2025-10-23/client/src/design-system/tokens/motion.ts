/**
 * RenOS Design System - Motion Tokens
 * Inspired by: Cursor, Linear, Framer Motion
 * 
 * Standardized animation durations and easing curves
 * Creates consistent, polished UI feel
 */

export const motion = {
  // Duration (in milliseconds)
  duration: {
    instant: 100,   // Instant feedback (hover states)
    fast: 200,      // Quick transitions (tooltips, dropdowns)
    base: 300,      // Standard transitions (modals, page changes)
    slow: 500,      // Deliberate animations (complex state changes)
    slower: 700,    // Special effects (reveal animations)
  },

  // Easing Curves (cubic-bezier)
  easing: {
    // Standard easing
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',

    // Custom easing (inspired by Cursor)
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',  // Bouncy
    smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',    // Smooth and natural
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',             // Sharp and decisive
  },

  // Presets (ready-to-use)
  presets: {
    // Fade
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.2, ease: 'cubic-bezier(0, 0, 0.2, 1)' },
    },

    // Slide up
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
      transition: { duration: 0.3, ease: 'cubic-bezier(0, 0, 0.2, 1)' },
    },

    // Scale
    scale: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
      transition: { duration: 0.2, ease: 'cubic-bezier(0, 0, 0.2, 1)' },
    },

    // Hover
    hover: {
      scale: 1.02,
      transition: { duration: 0.1 },
    },

    // Tap
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 },
    },
  },
} as const;

// Type-safe motion access
export type MotionDuration = keyof typeof motion.duration;
export type MotionEasing = keyof typeof motion.easing;
export type MotionPreset = keyof typeof motion.presets;
