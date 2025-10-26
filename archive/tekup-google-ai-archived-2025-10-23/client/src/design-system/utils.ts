/**
 * RenOS Design System - Utility Functions
 * 
 * Helper functions for className management and styling
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with proper precedence
 * Combines clsx and tailwind-merge for optimal className handling
 * 
 * @example
 * cn('px-2 py-1', 'px-4') // => 'py-1 px-4'
 * cn('text-red-500', condition && 'text-blue-500') // => conditional classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Create a data attribute object
 * Useful for custom attributes
 * 
 * @example
 * dataAttr('state', 'active') // => { 'data-state': 'active' }
 */
export function dataAttr(key: string, value: string | boolean | undefined) {
  return {
    [`data-${key}`]: value,
  };
}

/**
 * Format class names with BEM-like structure
 * 
 * @example
 * bem('button', 'primary', 'disabled') // => 'button button--primary button--disabled'
 */
export function bem(
  block: string,
  ...modifiers: (string | boolean | undefined)[]
) {
  const classes = [block];
  
  modifiers.forEach((modifier) => {
    if (modifier && typeof modifier === 'string') {
      classes.push(`${block}--${modifier}`);
    }
  });
  
  return classes.join(' ');
}
