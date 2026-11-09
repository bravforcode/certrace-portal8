"use client";

/* Kebab (⋯) menu for an INSTALLATION row — the control that makes the row
   "one thing you can act on" rather than a heading. It opens the installation —
   whose Overview is where the information entered once per site is edited, and
   saves itself — and carries the shortcuts to its other tabs.

   `remove` adds the last item, for the screens that list the exporter's own
   sites (Settings). It follows the declaration menu's convention — red, armed
   by the first click and fired by the second — and it is DISABLED, with the
   reason, while any product report still names the site: removing the record
   would take the operator details, the address and the monitoring plan out from
   under the reports and the report set that read them. */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ClipboardCheck, EllipsisVertical, ExternalLink, LayoutGrid, Plus, Trash2 } from "lucide-react";
import { cn } from "@/components/ui";
import { Dropdown } from "@/components/controls";
import { useT } from "@/lib/i18n";

export const installationHref = (id: string, tab: "" | "products" | "readiness" = ""): string =>
  `/workspaces/installation/${encodeURIComponent(id)}${tab ? `/${tab}` : ""}`;

export type InstallationRemoval = {
  /** Product reports (active and archived) that still name this site. */
  reports: number;
  onRemove: () => void;
};

function Items({ installationId, close, remove }: { installationId: string; close: () => void; remove?: InstallationRemoval }) {
  const t = useT();
  const router = useRouter();
  const [armed, setArmed] = React.useState(false);
  const item =
    "flex w-full items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-left text-[12.5px] text-black/65 transition-colors hover:bg-[#fafaf8] hover:text-black";
  const go = (href: string) => () => {
    close();
    router.push(href);
  };
  return (
    <div>
      <button onClick={go(installationHref(installationId))} className={item}>
        <ExternalLink size={13} strokeWidth={1.5} className="flex-none text-black/40" /> {t("Open installation")}
      </button>
      <button onClick={go(installationHref(installationId, "products"))} className={item}>
        <LayoutGrid size={13} strokeWidth={1.5} className="flex-none text-black/40" /> {t("Product reports")}
      </button>
      <button onClick={go(installationHref(installationId, "readiness"))} className={item}>
        <ClipboardCheck size={13} strokeWidth={1.5} className="flex-none text-black/40" /> {t("Readiness and report set")}
      </button>
      <div className="mx-2 my-1 h-px bg-black/[0.06]" />
      <button onClick={go(`/workspaces/new?installation=${encodeURIComponent(installationId)}`)} className={item}>
        <Plus size={13} strokeWidth={1.5} className="flex-none text-black/40" /> {t("New product report")}
      </button>
      {remove && (
        <>
          <div className="mx-2 my-1 h-px bg-black/[0.06]" />
          {remove.reports > 0 ? (
            <div className="px-3 py-2">
              <span className="flex items-center gap-2.5 text-[12.5px] text-black/30">
                <Trash2 size={13} strokeWidth={1.5} className="flex-none" /> {t("Remove site")}
              </span>
              <p className="mt-1 pl-[23px] text-[11.5px] leading-snug text-black/40">
                {remove.reports === 1
                  ? t("Still used by a product report. Remove that report first.")
                  : t("Still used by {n} product reports. Remove those reports first.", { n: remove.reports })}
              </p>
            </div>
          ) : (
            <button
              onClick={() => {
                if (!armed) {
                  setArmed(true);
                  return;
                }
                remove.onRemove();
                close();
              }}
              className={cn(item, "text-[#dc2626] hover:bg-[#fef2f2] hover:text-[#dc2626]")}
            >
              {armed ? <Check size={13} strokeWidth={2} className="flex-none" /> : <Trash2 size={13} strokeWidth={1.5} className="flex-none" />}
              {armed ? t("Click again to confirm") : t("Remove site")}
            </button>
          )}
        </>
      )}
    </div>
  );
}

export function InstallationMenu({
  installationId,
  name,
  className,
  remove,
}: {
  installationId: string;
  name: string;
  className?: string;
  remove?: InstallationRemoval;
}) {
  const t = useT();
  return (
    <Dropdown
      align="right"
      width="w-64"
      className={className}
      trigger={(open) => (
        <span
          role="presentation"
          aria-label={t("Actions for {workspace}", { workspace: name })}
          title={t("More actions")}
          className={cn(
            "grid h-8 w-8 place-items-center rounded-lg transition-colors",
            open ? "bg-black/[0.06] text-black" : "text-black/35 hover:bg-black/[0.05] hover:text-black",
          )}
        >
          <EllipsisVertical size={15} strokeWidth={1.5} />
        </span>
      )}
    >
      {(close) => <Items installationId={installationId} close={close} remove={remove} />}
    </Dropdown>
  );
}
