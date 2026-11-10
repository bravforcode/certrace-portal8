"use client";

/* ════════════════════════════════════════════════════════════
   A MESSAGE FROM CERTREACE, OPENED

   Something that is not about the reader's own work has nowhere to take them, so it is opened
   where they are: the same dialog every other form in the portal uses, which is bounded by the
   screen and scrolls its body — so a long rule change reads on a phone, and the buttons stay on
   it. The page behind does not move.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { Button, ButtonLink, Chip, Modal } from "@/components/ui";
import { useNoticeText, useAgo } from "@/components/notifications/text";
import { useT } from "@/lib/i18n";
import type { Notice } from "@/lib/notifications/feed";

export function MessageDialog({
  notice,
  onClose,
  onAsk,
}: {
  notice: Notice | null;
  onClose: () => void;
  onAsk: (question: string) => void;
}) {
  const t = useT();
  const text = useNoticeText();
  const ago = useAgo();
  // Keep the last message while the dialog is closing, or it would empty out before it left.
  const [shown, setShown] = React.useState<Notice | null>(null);
  React.useEffect(() => {
    if (notice) setShown(notice);
  }, [notice]);
  const n = notice ?? shown;
  if (!n?.message) return null;
  const cta = n.message.cta;
  const source = text.source(n);

  return (
    <Modal
      open={notice != null}
      onClose={onClose}
      width="max-w-xl"
      eyebrow={
        n.group === "security" ? t("System message") : t("From Certrace")
      }
      title={text.title(n)}
      footer={
        <>
          <Button variant="ghost" data-lock="allow" onClick={onClose}>
            {t("Close")}
          </Button>
          {cta?.ask && (
            <Button data-lock="allow" onClick={() => onAsk(cta.ask as string)}>
              {t(cta.label)}
            </Button>
          )}
          {cta?.href && !cta.ask && (
            <ButtonLink href={cta.href} data-lock="allow" onClick={onClose}>
              {t(cta.label)}
            </ButtonLink>
          )}
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-black/45">
        {!n.undated && <span>{ago(n.at)}</span>}
        {n.tone === "err" && (
          <Chip tone="err" pulse={false}>
            {t("Needs you")}
          </Chip>
        )}
        {source && (
          <span className="min-w-0 [overflow-wrap:anywhere]">{source}</span>
        )}
      </div>
      <div className="mt-4 space-y-3.5">
        {text.body(n).map((p, i) => (
          <p
            key={i}
            className="text-[14px] leading-relaxed text-black/70 [overflow-wrap:anywhere]"
          >
            {p}
          </p>
        ))}
      </div>
      {n.group === "regulation" && (
        <p className="mt-5 border-t border-black/[0.06] pt-4 text-[12px] leading-relaxed text-black/40">
          {t(
            "This is the rules as Certrace has them, not a live feed. Check the official text before you rely on it.",
          )}{" "}
          <Link
            href="/regulations"
            onClick={onClose}
            className="text-black/55 underline underline-offset-2 hover:text-black"
          >
            {t("Open Coverage")}
          </Link>
        </p>
      )}
    </Modal>
  );
}
