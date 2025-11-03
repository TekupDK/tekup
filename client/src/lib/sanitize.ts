/**
 * XSS Prevention Utilities
 * 
 * Provides safe markdown/content sanitization using DOMPurify
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * 
 * @param dirty - Unsanitized HTML string
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';
  
  return DOMPurify.sanitize(dirty, {
    // Allow common markdown HTML tags
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    // Allow common markdown attributes
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
    // Allow data attributes for special features (if needed)
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize plain text (removes all HTML)
 * 
 * @param text - Text that may contain HTML
 * @returns Plain text with HTML removed
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

