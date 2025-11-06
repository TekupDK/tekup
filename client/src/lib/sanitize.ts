/**
 * XSS Prevention Utilities
 *
 * Provides safe markdown/content sanitization using DOMPurify
 */

import DOMPurify from "dompurify";

/**
 * Sanitize HTML content to prevent XSS attacks
 *
 * @param dirty - Unsanitized HTML string
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return "";

  return DOMPurify.sanitize(dirty, {
    // Allow common markdown HTML tags
    ALLOWED_TAGS: [
      "p",
      "div",
      "span",
      "br",
      "hr",
      "strong",
      "em",
      "u",
      "s",
      "code",
      "pre",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
      "img",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
    ],
    // Allow common markdown attributes
    ALLOWED_ATTR: ["href", "src", "alt", "title", "class"],
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
  if (!text) return "";

  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize HTML for rich email rendering inside a sandboxed iframe.
 * - Removes scripts and event handlers
 * - Keeps style tags (emails rely heavily on CSS)
 * - Optionally keeps style attributes but filters dangerous patterns
 */
export function sanitizeEmailHtml(
  html: string,
  options?: { allowStyleAttr?: boolean }
) {
  if (!html) return "";
  const allowStyleAttr = options?.allowStyleAttr ?? true;
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "html",
      "head",
      "meta",
      "title",
      "body",
      "style",
      "p",
      "div",
      "span",
      "br",
      "hr",
      "strong",
      "em",
      "u",
      "s",
      "code",
      "pre",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
      "img",
      "picture",
      "source",
      "table",
      "thead",
      "tbody",
      "tfoot",
      "tr",
      "th",
      "td",
      "section",
      "article",
      "header",
      "footer",
      "nav",
    ],
    ALLOWED_ATTR: [
      "href",
      "src",
      "alt",
      "title",
      "class",
      ...(allowStyleAttr ? (["style"] as const) : []),
      "width",
      "height",
      "align",
      "valign",
      "border",
      "cellpadding",
      "cellspacing",
      "dir",
    ],
    FORBID_TAGS: ["script"],
    // DOMPurify types expect strings here; we enforce via SAFE_FOR_TEMPLATES and post-filter
    FORBID_ATTR: [
      "onerror",
      "onload",
      "onclick",
      "onmouseover",
      "onfocus",
      "onmouseenter",
      "onmouseleave",
    ],
    KEEP_CONTENT: true,
  });

  if (!allowStyleAttr) return sanitized;

  // Post-filter inline styles to drop dangerous patterns
  // Remove url(), expression, -moz-binding, behavior
  const dangerous = /url\s*\(|expression\s*\(|-moz-binding|behavior\s*:/i;
  try {
    const doc = document.implementation.createHTMLDocument("email");
    const container = doc.createElement("div");
    container.innerHTML = sanitized;
    container.querySelectorAll("[style]").forEach(el => {
      const style = (el as HTMLElement).getAttribute("style") || "";
      if (dangerous.test(style)) {
        (el as HTMLElement).removeAttribute("style");
      }
    });
    return container.innerHTML;
  } catch {
    // If DOM not available (SSR), return as-is
    return sanitized;
  }
}
