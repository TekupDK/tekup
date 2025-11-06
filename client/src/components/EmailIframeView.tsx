import { trpc } from "@/lib/trpc";
import React from "react";
import { sanitizeEmailHtml } from "../lib/sanitize";

interface Props {
  html?: string | null;
  messageId: string;
  className?: string;
}

function rewriteExternalImages(inputHtml: string, enabled: boolean): string {
  if (enabled) return inputHtml;
  // Replace external images with placeholders (preserve original in data-src)
  try {
    const doc = document.implementation.createHTMLDocument("email");
    const container = doc.createElement("div");
    container.innerHTML = inputHtml;
    container.querySelectorAll("img").forEach(img => {
      const el = img as HTMLImageElement;
      const src = el.getAttribute("src") || "";
      if (/^https?:\/\//i.test(src)) {
        el.setAttribute("data-src", src);
        el.setAttribute("src", "");
        el.setAttribute(
          "alt",
          el.getAttribute("alt") || "External image blocked"
        );
      }
    });
    return container.innerHTML;
  } catch {
    return inputHtml;
  }
}

export default function EmailIframeView({ html, messageId, className }: Props) {
  const [imagesEnabled, setImagesEnabled] = React.useState(false);
  const [docHtml, setDocHtml] = React.useState("");
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);
  const getByCid = trpc.inbox.email.getAttachmentByCid.useMutation();

  React.useEffect(() => {
    const process = async () => {
      const baseHtml = sanitizeEmailHtml(html || "", { allowStyleAttr: true });
      // Resolve cid images
      let working = baseHtml;
      try {
        const parser = new DOMParser();
        const parsed = parser.parseFromString(baseHtml, "text/html");
        const cidImgs = Array.from(parsed.querySelectorAll("img")).filter(im =>
          im.getAttribute("src")?.startsWith("cid:")
        ) as HTMLImageElement[];
        const uniqueCids = Array.from(
          new Set(
            cidImgs.map(im =>
              (im.getAttribute("src") || "").replace(/^cid:/, "")
            )
          )
        );
        const cidMap = new Map<string, string>();
        for (const cid of uniqueCids) {
          try {
            const res = await getByCid.mutateAsync({ messageId, cid });
            if (res?.dataUrl) cidMap.set(cid, res.dataUrl);
          } catch {
            // ignore failures
          }
        }
        cidImgs.forEach(im => {
          const raw = (im.getAttribute("src") || "").replace(/^cid:/, "");
          const rep = cidMap.get(raw);
          if (rep) im.setAttribute("src", rep);
        });
        working = parsed.documentElement.outerHTML;
      } catch {
        // fall back silently
      }

      // Optionally block external images until user enables
      const finalHtml = rewriteExternalImages(working, imagesEnabled);

      // Build srcdoc with base and small CSS to make images responsive
      // CSP headers block scripts and restrict resource loading for XSS prevention
      const srcDoc = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data: cid:; style-src 'unsafe-inline'; font-src https: data:;" />
<base target="_blank" />
<style>
  body{margin:0;padding:12px;background:transparent;color:#e5e5e5;}
  body > div{color:#e5e5e5;}
  img{max-width:100%;height:auto;}
  table{max-width:100%;color:inherit;}
  a { color: #60a5fa; text-decoration: underline; }
</style>
</head>
<body>
${finalHtml}
</body>
</html>`;
      setDocHtml(srcDoc);
    };
    process();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html, messageId, imagesEnabled]);

  // Auto-resize iframe height
  React.useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const onLoad = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return;
        const h = Math.max(
          doc.body.scrollHeight,
          doc.documentElement.scrollHeight
        );
        iframe.style.height = `${h + 8}px`;
      } catch {
        // ignore if cross-origin restrictions apply
      }
    };
    iframe.addEventListener("load", onLoad);
    return () => iframe.removeEventListener("load", onLoad);
  }, [docHtml]);

  return (
    <div className={className}>
      {/* Image toggle for privacy */}
      <div className="mb-2 text-xs text-muted-foreground">
        Billeder:{" "}
        {imagesEnabled ? (
          <button className="underline" onClick={() => setImagesEnabled(false)}>
            deaktiver
          </button>
        ) : (
          <button className="underline" onClick={() => setImagesEnabled(true)}>
            aktiver
          </button>
        )}
      </div>
      <iframe
        ref={iframeRef}
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="no-referrer"
        srcDoc={docHtml}
        style={{ width: "100%", border: "none" }}
        loading="lazy"
        aria-label="E-mail indhold"
        title="Email content"
      />
    </div>
  );
}
