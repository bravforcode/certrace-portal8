"use client";

/* ════════════════════════════════════════════════════════════
   DOCUMENT PREVIEW

   The document on the left, what Certrace read from it on the right. The
   intake card asks the reader to "check this against the document", and a
   new tab put the document one window away from the number being checked.

   PDFs render in an iframe from a blob: URL (middleware.ts allows
   frame-src blob: for this), images in an <img>. The URL is made when the
   preview opens and revoked when it closes. Anything else — or a file too
   large to have been kept in the browser — says so rather than showing an
   empty frame.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Check, ExternalLink, Minus } from "lucide-react";
import { Button, Modal, cn } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { CONFIDENCE_FLOOR } from "@/lib/workspace-evidence";
import type { IntakeDoc } from "@/lib/smart-intake";

function blobUrlFrom(dataUrl: string): string | null {
  try {
    const [meta, b64] = dataUrl.split(",");
    const mime = /:(.*?);/.exec(meta)?.[1] ?? "application/octet-stream";
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], { type: mime }));
  } catch {
    return null;
  }
}

export function DocumentPreview({
  doc,
  open,
  onClose,
  labelFor,
  heading,
}: {
  /* Structural, so the Supplier Portal's intake cards can use it too. */
  doc: Pick<IntakeDoc, "fileName" | "mimeType" | "fileDataUrl" | "detection" | "fields">;
  open: boolean;
  onClose: () => void;
  /** translated label for an extracted field key */
  labelFor: (key: string) => string;
  /** one line under the title — what it is and where it goes */
  heading?: string;
}) {
  const t = useT();
  const [url, setUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || !doc.fileDataUrl) return;
    const made = blobUrlFrom(doc.fileDataUrl);
    setUrl(made);
    return () => {
      if (made) URL.revokeObjectURL(made);
      setUrl(null);
    };
  }, [open, doc.fileDataUrl]);

  const isPdf = doc.mimeType === "application/pdf" || doc.fileName.toLowerCase().endsWith(".pdf");
  const isImage = doc.mimeType.startsWith("image/");
  const d = doc.detection;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={doc.fileName}
      lead={heading}
      width="max-w-6xl"
      footer={
        <>
          {url && (
            <Button size="sm" variant="secondary" onClick={() => window.open(url, "_blank", "noopener")}>
              <ExternalLink size={13} /> {t("Open in a new tab")}
            </Button>
          )}
          <Button size="sm" onClick={onClose}>
            {t("Close")}
          </Button>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-h-[50vh] overflow-hidden rounded-xl border border-black/[0.08] bg-[#f5f4f0]">
          {!doc.fileDataUrl ? (
            <p className="p-6 text-[13px] text-black/50">{t("This file is too large to keep in the browser, so there is nothing to show.")}</p>
          ) : !url ? null : isPdf ? (
            <iframe src={url} title={doc.fileName} className="h-[65vh] w-full bg-white" />
          ) : isImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- a blob: URL, not an optimisable asset
            <img src={url} alt={doc.fileName} className="mx-auto max-h-[65vh] object-contain" />
          ) : (
            <p className="p-6 text-[13px] text-black/50">{t("No preview for this file type. Open it in a new tab instead.")}</p>
          )}
        </div>

        <aside className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.1em] text-black/45">{t("What Certrace read")}</div>
          {d?.summary && <p className="mt-2 text-[12.5px] leading-relaxed text-black/60">{t(d.summary)}</p>}
          {doc.fields.length === 0 ? (
            <p className="mt-3 text-[12.5px] text-black/45">{t("No values were read from this document.")}</p>
          ) : (
            <ul className="mt-3 divide-y divide-black/[0.06]">
              {doc.fields.map((f) => {
                const low = f.confidence < CONFIDENCE_FLOOR;
                return (
                  <li key={f.key} className={cn("py-2", low && "rounded-lg bg-[#fffbeb] px-2")}>
                    <div className="flex items-center justify-between gap-2 text-[11.5px] text-black/50">
                      <span>{labelFor(f.key)}</span>
                      <span className={cn("font-mono", low ? "text-[#b45309]" : "text-[#047857]")}>{Math.round(f.confidence * 100)}%</span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="font-mono text-[13px] text-black/85">
                        {f.value} {f.unit ?? ""}
                      </span>
                      <span className={cn("inline-flex items-center gap-1 text-[10.5px]", f.accepted ? "text-[#047857]" : "text-black/35")}>
                        {f.accepted ? <Check size={11} /> : <Minus size={11} />}
                        {f.accepted ? t("kept") : t("not kept")}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>
    </Modal>
  );
}
