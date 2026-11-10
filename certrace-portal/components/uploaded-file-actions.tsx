"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { Modal } from "@/components/ui";
import { toast } from "@/components/toast";
import { saveBlobAs } from "@/lib/api/files";
import { useT } from "@/lib/i18n";

export function UploadedFileActions({
  fileName,
  mimeType,
  loadFile,
}: {
  fileName: string;
  mimeType?: string;
  loadFile: () => Promise<Blob | undefined>;
}) {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [url, setUrl] = React.useState<string | null>(null);
  const requestId = React.useRef(0);
  const previewUrl = React.useRef<string | null>(null);
  const isPdf =
    mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");

  React.useEffect(
    () => () => {
      requestId.current += 1;
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    },
    [],
  );

  const close = () => {
    requestId.current += 1;
    setOpen(false);
    setLoading(false);
    setUrl(null);
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = null;
  };

  const file = async () => {
    const blob = await loadFile();
    if (!blob)
      throw new Error("The original file is unavailable. Upload it again.");
    return blob;
  };

  const download = async () => {
    try {
      saveBlobAs(await file(), fileName);
    } catch (cause) {
      toast({
        message: t("That file could not be downloaded."),
        detail: cause instanceof Error ? cause.message : undefined,
        tone: "warn",
      });
    }
  };

  const preview = async () => {
    if (!isPdf) return download();
    const currentRequest = ++requestId.current;
    setOpen(true);
    setLoading(true);
    try {
      const blob = await file();
      if (currentRequest !== requestId.current) return;
      const made = URL.createObjectURL(
        blob.type === "application/pdf"
          ? blob
          : new Blob([blob], { type: "application/pdf" }),
      );
      previewUrl.current = made;
      setUrl(made);
    } catch (cause) {
      if (currentRequest !== requestId.current) return;
      close();
      toast({
        message: "Could not open this file",
        detail: cause instanceof Error ? cause.message : undefined,
        tone: "warn",
      });
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void preview()}
        className="min-w-0 flex-1 truncate text-left underline decoration-black/20 underline-offset-2 hover:text-black hover:decoration-black/50"
        title={isPdf ? "Open PDF" : t("Download this file")}
      >
        {fileName}
      </button>
      <button
        type="button"
        onClick={() => void download()}
        className="flex-none rounded p-1 text-black/40 hover:bg-black/[0.04] hover:text-black"
        aria-label={`${t("Download this file")}: ${fileName}`}
      >
        <Download size={12} strokeWidth={1.5} />
      </button>
      <Modal
        open={open}
        onClose={close}
        title={fileName}
        width="max-w-5xl"
        footer={
          <button
            type="button"
            onClick={() => void download()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-2 text-[12px] text-black/70 hover:border-black/25"
          >
            <Download size={13} /> {t("Download this file")}
          </button>
        }
      >
        {loading ? (
          <p className="py-8 text-center text-[13px] text-black/45">
            {t("Loading…")}
          </p>
        ) : (
          url && (
            <iframe
              src={url}
              title={fileName}
              className="h-[70vh] w-full rounded-lg border border-black/10 bg-white"
            />
          )
        )}
      </Modal>
    </>
  );
}
