"use client";

/* Kebab (⋯) menu for a verification workspace — the same control on the
   dashboard cards, the table rows and the workspace header, so the actions
   live in the same place everywhere: Open · Copy link · Archive.

   THERE IS NO DELETE. A workspace is the evidence behind a declaration that
   has already been filed, and a verifier asking about it two years later is
   the ordinary case — a menu item that destroys a year of readings does not
   belong one slip away from "Copy link". Archiving takes it out of the estate
   instead: off the dashboard, the inbox and the reports, still readable, and
   restorable from the archive on the estate screen.

   Archive still arms on the first click and only fires on the second. It is
   recoverable, but it removes a card the reader is looking at, and a card
   that vanishes on a mis-click is disorienting whether or not it can be got
   back. No browser confirm() popup — the button says what the second click
   will do. */

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  EllipsisVertical,
  ExternalLink,
  Link2,
  Archive,
  ArchiveRestore,
  Check,
  Copy,
} from "lucide-react";
import { cn } from "@/components/ui";
import { Dropdown } from "@/components/controls";
import { toast } from "@/components/toast";
import { workspaceTitle, type VerificationWorkspace } from "@/lib/workspace";
import {
  useArchiveWorkspace,
  useRestoreWorkspace,
} from "@/lib/workspaces-query";
import { useT } from "@/lib/i18n";
import { DuplicateDialog } from "@/components/workspace/duplicate-dialog";

function MenuItems({
  workspace,
  close,
  afterChange,
  onDuplicate,
}: {
  workspace: VerificationWorkspace;
  close: () => void;
  afterChange?: () => void;
  onDuplicate: () => void;
}) {
  const t = useT();
  const router = useRouter();
  const [armed, setArmed] = React.useState(false);
  const archiveWs = useArchiveWorkspace();
  const restoreWs = useRestoreWorkspace();
  const saving = archiveWs.isPending || restoreWs.isPending;
  const archived = Boolean(workspace.archivedAt);
  const item =
    "flex w-full items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-left text-[12.5px] text-black/65 transition-colors hover:bg-[#fafaf8] hover:text-black";

  const copy = (text: string, message: string, detail: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard)
      navigator.clipboard.writeText(text);
    toast({ message, detail, tone: "info" });
    close();
  };

  const archive = async () => {
    if (saving) return;
    if (!armed) {
      setArmed(true);
      return;
    }
    try {
      await archiveWs.mutateAsync(workspace.id);
      toast({
        message: "Product report archived",
        detail:
          "It is out of the estate but nothing was deleted — restore it from Archived.",
        tone: "info",
      });
      close();
      afterChange?.();
    } catch {
      /* The existing mutation error notice leaves this action retryable. */
    }
  };

  /* Restoring is one click. It puts something BACK — the worst case is a card
     reappearing, which the same menu undoes. */
  const restore = async () => {
    if (saving) return;
    try {
      await restoreWs.mutateAsync(workspace.id);
      toast({
        message: "Product report restored",
        detail: "It is back in the estate, exactly as it was.",
        tone: "ok",
      });
      close();
      afterChange?.();
    } catch {
      /* The existing mutation error notice leaves this action retryable. */
    }
  };

  return (
    <div>
      <button
        onClick={() => router.push(`/workspaces/${workspace.id}`)}
        className={item}
      >
        <ExternalLink
          size={13}
          strokeWidth={1.5}
          className="flex-none text-black/40"
        />{" "}
        {t("Open product report")}
      </button>
      <button
        onClick={() =>
          copy(
            `${window.location.origin}/workspaces/${workspace.id}`,
            "Link copied",
            "Anyone on your team with a seat can open it.",
          )
        }
        className={item}
      >
        <Link2
          size={13}
          strokeWidth={1.5}
          className="flex-none text-black/40"
        />{" "}
        {t("Copy link")}
      </button>
      {/* No "copy supplier link" here.

          A workspace-level supplier link had to guess a month, and the guess
          was "the last one that has ended" — so an exporter chasing April in
          June copied a link that opened May. The link now belongs to the month
          it asks for: each month's box on the Monthly data tab carries its own,
          and only once that month has been sent. */}
      {!archived && (
        <button
          onClick={() => {
            close();
            onDuplicate();
          }}
          className={item}
        >
          <Copy
            size={13}
            strokeWidth={1.5}
            className="flex-none text-black/40"
          />{" "}
          {t("Duplicate report")}
        </button>
      )}
      <div className="mx-2 my-1 h-px bg-black/[0.06]" />
      {archived ? (
        <button onClick={restore} disabled={saving} className={item}>
          <ArchiveRestore
            size={13}
            strokeWidth={1.5}
            className="flex-none text-black/40"
          />{" "}
          {t("Restore product report")}
        </button>
      ) : (
        <button
          onClick={archive}
          disabled={saving}
          className={cn(item, armed && "bg-[#faf9f7] text-black")}
        >
          {armed ? (
            <Check size={13} strokeWidth={2} className="flex-none" />
          ) : (
            <Archive
              size={13}
              strokeWidth={1.5}
              className="flex-none text-black/40"
            />
          )}
          {armed ? t("Click to confirm archive") : t("Archive product report")}
        </button>
      )}
    </div>
  );
}

export function WorkspaceMenu({
  workspace,
  afterChange,
  size = "sm",
  className,
}: {
  workspace: VerificationWorkspace;
  /** re-read the list — a card has just left it, or come back to it */
  afterChange?: () => void;
  size?: "sm" | "md";
  className?: string;
}) {
  const t = useT();
  const [duplicating, setDuplicating] = React.useState(false);
  return (
    <>
      <Dropdown
        align="right"
        width="w-64"
        className={className}
        trigger={(open) => (
          <span
            role="presentation"
            aria-label={t("Actions for {workspace}", {
              workspace: workspaceTitle(workspace, t),
            })}
            title={t("More actions")}
            className={cn(
              "grid place-items-center rounded-lg transition-colors",
              size === "sm" ? "h-7 w-7" : "h-9 w-9 rounded-xl border",
              open
                ? size === "sm"
                  ? "bg-black/[0.06] text-black"
                  : "border-black/25 bg-black/[0.04] text-black"
                : size === "sm"
                  ? "text-black/30 hover:bg-black/[0.05] hover:text-black"
                  : "border-black/10 text-black/45 hover:border-black/25 hover:text-black",
            )}
          >
            <EllipsisVertical
              size={size === "sm" ? 14 : 15}
              strokeWidth={1.5}
            />
          </span>
        )}
      >
        {(close) => (
          <MenuItems
            workspace={workspace}
            close={close}
            afterChange={afterChange}
            onDuplicate={() => setDuplicating(true)}
          />
        )}
      </Dropdown>
      {duplicating && (
        <DuplicateDialog
          workspace={workspace}
          open={duplicating}
          onClose={() => setDuplicating(false)}
        />
      )}
    </>
  );
}
