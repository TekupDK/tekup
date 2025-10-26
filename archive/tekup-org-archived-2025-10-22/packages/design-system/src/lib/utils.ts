import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function for merging Tailwind CSS classes with clsx
 * Optimized for the TekUp futuristic design system
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate neon glow effect with custom color
 */
export function neonGlow(color: string = 'var(--neon-blue)', intensity: number = 0.3) {
  return {
    boxShadow: `0 0 20px hsl(${color} / ${intensity}), 0 0 40px hsl(${color} / ${intensity * 0.3})`
  };
}

/**
 * Generate glassmorphism background
 */
export function glassmorphism(opacity: number = 0.1) {
  return {
    backdropFilter: 'blur(24px) saturate(1.8)',
    backgroundColor: `hsl(var(--glass-border) / ${opacity})`,
    border: '1px solid hsl(var(--glass-border) / 0.2)',
    boxShadow: 'var(--shadow-glass)'
  };
}
