/**
 * Safe Streamdown Wrapper
 *
 * Wraps Streamdown component with XSS protection using DOMPurify
 * Sanitizes markdown content before it's rendered to DOM
 */

import { sanitizeText } from "@/lib/sanitize";
import { Streamdown } from "streamdown";

interface SafeStreamdownProps {
  content: string;
}

/**
 * Safe wrapper for Streamdown that sanitizes content before rendering
 *
 * Note: Streamdown internally renders markdown to HTML.
 * We sanitize the input text to prevent XSS in the markdown source.
 * Streamdown will then safely convert it to HTML.
 */
export function SafeStreamdown({ content }: SafeStreamdownProps) {
  // Sanitize input content - removes any potential HTML/scripts from markdown
  // Streamdown will then safely convert the clean markdown to HTML
  const sanitizedContent = sanitizeText(content);

  return <Streamdown>{sanitizedContent}</Streamdown>;
}
