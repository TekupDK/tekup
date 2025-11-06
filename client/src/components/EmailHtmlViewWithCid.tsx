import { trpc } from "@/lib/trpc";
import React from "react";
import { sanitizeHtml } from "../lib/sanitize";

interface Props {
  html?: string | null;
  messageId: string;
  className?: string;
}

/**
 * Renders sanitized HTML and resolves cid: images via a tRPC call to fetch attachments.
 * Also constrains images to container width for better UX.
 */
export default function EmailHtmlViewWithCid({
  html,
  messageId,
  className,
}: Props) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const safe = React.useMemo(() => sanitizeHtml(html || ""), [html]);
  const getByCid = trpc.inbox.email.getAttachmentByCid.useMutation();

  React.useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    // Constrain all images for layout safety
    const imgs = Array.from(root.querySelectorAll("img")) as HTMLImageElement[];
    imgs.forEach(img => {
      img.style.maxWidth = "100%";
      img.style.height = "auto";
    });

    // Resolve cid images
    const cidImgs = imgs.filter(img => img.src.startsWith("cid:"));
    if (cidImgs.length === 0) return;

    const resolved = new Map<string, string>();
    let cancelled = false;

    (async () => {
      for (const img of cidImgs) {
        const cid = img.src.replace(/^cid:/, "").trim();
        if (!cid) continue;
        if (resolved.has(cid)) {
          img.src = resolved.get(cid)!;
          continue;
        }
        try {
          const res = await getByCid.mutateAsync({ messageId, cid });
          if (cancelled) return;
          if (res?.dataUrl) {
            resolved.set(cid, res.dataUrl);
            img.src = res.dataUrl;
          }
        } catch (e) {
          // Fallback: hide broken cid images
          img.alt = img.alt || "Image could not be loaded";
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [safe, messageId]);

  if (!safe) return null;

  return (
    <div
      ref={containerRef}
      className={className}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
