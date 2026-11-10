"use client";
import * as React from "react";
import type { PDFDocumentProxy, PDFDocumentLoadingTask } from "pdfjs-dist";

/** Use the same local renderer as extraction, including in browsers without a PDF plugin. */
export function PdfSourcePreview({
  url,
  file,
  page,
  onPage,
}: {
  url: string;
  file: Blob;
  page: number;
  onPage: (page: number) => void;
}) {
  const [document, setDocument] = React.useState<PDFDocumentProxy | null>(null);
  const [error, setError] = React.useState("");
  const [rendered, setRendered] = React.useState(0);
  const holder = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    let active = true;
    let task: PDFDocumentLoadingTask | undefined;
    setDocument(null);
    setError("");
    setRendered(0);
    void (async () => {
      try {
        const data = await file.arrayBuffer();
        const moduleUrl = "/pdf.min.mjs";
        const pdfjs = (await import(
          /* webpackIgnore: true */ moduleUrl
        )) as typeof import("pdfjs-dist");
        if (!active) return;
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        task = pdfjs.getDocument({ data: new Uint8Array(data) });
        const doc = await task.promise;
        if (active) setDocument(doc);
      } catch (e) {
        if (active) setError((e as Error).message);
      }
    })();
    return () => {
      active = false;
      void task?.destroy();
    };
  }, [file]);
  React.useEffect(() => {
    if (!document) return;
    const container = holder.current;
    let active = true;
    let cancel: (() => void) | undefined;
    setRendered(0);
    setError("");
    void (async () => {
      try {
        const pdfPage = await document.getPage(page);
        if (!active) return;
        // A separate canvas per render prevents a cancelled page drawing over its replacement.
        const canvas = window.document.createElement("canvas");
        const base = pdfPage.getViewport({ scale: 1 });
        const viewport = pdfPage.getViewport({
          scale: Math.min(2, 1400 / Math.max(base.width, base.height)),
        });
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        canvas.className = "w-full bg-white";
        canvas.setAttribute("aria-label", `Original PDF page ${page}`);
        canvas.setAttribute("role", "img");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw Error("Page preview is unavailable.");
        const rendering = pdfPage.render({
          canvas,
          canvasContext: ctx,
          viewport,
        });
        cancel = () => rendering.cancel();
        await rendering.promise;
        if (active) {
          container?.replaceChildren(canvas);
          setRendered(page);
        }
      } catch (e) {
        if (active) setError((e as Error).message);
      }
    })();
    return () => {
      active = false;
      cancel?.();
      container?.replaceChildren();
    };
  }, [document, page]);
  return (
    <div className="flex h-[650px] flex-col overflow-hidden rounded-lg border bg-neutral-100">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-white p-2 text-xs">
        <button
          type="button"
          disabled={page <= 1 || !document}
          onClick={() => onPage(page - 1)}
          className="rounded border px-2 py-1 disabled:opacity-40"
        >
          Previous page
        </button>
        <span>
          Page {page}
          {document ? ` of ${document.numPages}` : ""}
        </span>
        <button
          type="button"
          disabled={!document || page >= document.numPages}
          onClick={() => onPage(page + 1)}
          className="rounded border px-2 py-1 disabled:opacity-40"
        >
          Next page
        </button>
        <a href={url} target="_blank" rel="noreferrer" className="underline">
          Open original PDF
        </a>
      </div>
      {error ? (
        <p role="alert" className="p-3 text-sm text-[#dc2626]">
          {error}. Open the original PDF to review it.
        </p>
      ) : (
        rendered !== page && (
          <p role="status" className="p-3 text-sm">
            Rendering source page…
          </p>
        )
      )}
      <div
        ref={holder}
        className="overflow-auto p-2"
        data-testid="pdf-source-page"
        data-rendered-page={rendered}
      />
    </div>
  );
}
