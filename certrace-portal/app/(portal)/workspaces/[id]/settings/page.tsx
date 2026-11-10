"use client";

export const runtime = "edge";

/* Workspace archive settings. */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Archive, Check } from "lucide-react";
import { Button, cn } from "@/components/ui";
import { toast } from "@/components/toast";
import { SectionCard } from "@/components/workspace/chrome";
import { useWorkspace } from "@/components/workspace/provider";
import { workspaceTitle } from "@/lib/workspace";
import { useArchiveWorkspace } from "@/lib/workspaces-query";
import { useT } from "@/lib/i18n";

export default function WorkspaceSettingsPage() {
  const t = useT();
  const { workspace } = useWorkspace();
  const router = useRouter();
  const archiveWorkspace = useArchiveWorkspace();
  const [armed, setArmed] = React.useState(false);

  const archive = () => {
    if (!armed) {
      setArmed(true);
      return;
    }
    archiveWorkspace.mutate(workspace.id, {
      onSuccess: () => {
        toast({
          message: "Product report archived",
          detail:
            "It is out of the estate but nothing was deleted — restore it from Archived.",
          tone: "info",
        });
        router.push("/workspaces");
      },
    });
  };

  return (
    <div className="space-y-5">
      {/* There is deliberately NO "supplier link" card here any more.

         A workspace-wide link is the wrong object: the ask is always "send me
         March", never "send me the year", and a link that opens on whichever
         month the reader happens to land on is a link that collects the wrong
         month. Each month's box on the Monthly data tab carries its own link,
         and it appears there only after that month has been sent — so a link
         that exists is always a link somebody has actually been given. */}

      {/* ── Putting it away ──────────────────────────────────
         ARCHIVE, NOT DELETE. This card used to destroy the workspace and
         everything hanging off it, permanently, from this settings screen.
         But the readings, the MMD and the
         precursor chain are the evidence behind a declaration that has
         already been filed — a verifier coming back to a closed year is the
         ordinary case. What an exporter actually wants when a year is over is
         for it to stop appearing on the dashboard, which is what archiving
         does and what deleting was being used for. */}
      <SectionCard
        title={t("Archive this product report")}
        helpTitle={t("What archiving does")}
        help={
          <>
            <p>
              {t(
                "It leaves the active estate: off the dashboard, out of the Inbox, and no longer counted in Reports or Carbon & Cost. Its monthly readings, MMD drafts and precursor rows are untouched.",
              )}
            </p>
            <p className="mt-2">
              {t(
                "You can still open it, and you can restore it at any time from",
              )}{" "}
              <strong>{t("Archived")}</strong> {t("on the Verification page.")}
            </p>
          </>
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] leading-relaxed text-black/50">
            {t("{title} — nothing is deleted, and you can restore it later.", {
              title: workspaceTitle(workspace, t),
            })}
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={archive}
            className={cn("flex-none", armed && "border-black/30 text-black")}
          >
            {armed ? (
              <Check size={13} strokeWidth={2} />
            ) : (
              <Archive size={13} strokeWidth={1.5} />
            )}
            {armed
              ? t("Click to confirm archive")
              : t("Archive product report")}
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}
