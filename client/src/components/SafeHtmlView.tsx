import React from "react";
import { sanitizeHtml } from "../lib/sanitize";

interface SafeHtmlViewProps {
  html?: string | null;
  className?: string;
}

/**
 * Renders sanitized HTML safely. Use for email/newsletter content.
 * - Sanitizes with a strict allowlist to prevent XSS.
 * - Preserves common formatting tags, lists, tables, links, and images.
 */
export function SafeHtmlView({ html, className }: SafeHtmlViewProps) {
  const safe = React.useMemo(() => sanitizeHtml(html || ""), [html]);

  if (!safe) return null;

  return (
    <div
      className={className}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}

export default SafeHtmlView;
