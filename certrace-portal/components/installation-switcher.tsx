"use client";

/* The list of installations to switch between — the same rows in the account
   menu and in Settings → Installation. Picking one makes it the current
   installation (lib/active-installation.ts). */

import * as React from "react";
import Link from "next/link";
import { Check, Factory, Plus } from "lucide-react";
import { ButtonLink, EmptyState, cn } from "./ui";
import { useT } from "@/lib/i18n";
import { useActiveInstallation } from "@/lib/active-installation";

export function InstallationSwitcher({
  onPicked,
  compact = false,
}: {
  onPicked?: () => void;
  /** The account-menu size: smaller rows, capped height. */
  compact?: boolean;
}) {
  const t = useT();
  const { options, active, setActive, loading } = useActiveInstallation();

  /* Settings size: the kit's own empty state and button, like every other
     empty list in the portal. */
  if (!loading && options.length === 0 && !compact)
    return (
      <EmptyState
        icon={<Factory size={22} strokeWidth={1.5} />}
        title={t("No installation yet")}
        body={t("Add your first installation and it becomes the current one.")}
        action={
          <ButtonLink href="/workspaces/new" variant="secondary" size="sm">
            <Plus size={13} strokeWidth={1.5} /> {t("Add an installation")}
          </ButtonLink>
        }
      />
    );

  if (!loading && options.length === 0)
    return (
      <div
        className={cn(
          "text-black/45",
          compact ? "px-2.5 py-2 text-[12px]" : "text-[13px]",
        )}
      >
        {t("No installation yet.")}{" "}
        <Link
          href="/workspaces/new"
          onClick={onPicked}
          className="underline decoration-black/20 underline-offset-2 hover:text-black"
        >
          {t("Add one")}
        </Link>
      </div>
    );

  return (
    <div
      role="radiogroup"
      aria-label={t("Switch installation")}
      className={cn(compact ? "max-h-[220px] overflow-y-auto" : "space-y-2")}
    >
      {options.map((o) => {
        const on = active?.id === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => {
              setActive(o.id);
              onPicked?.();
            }}
            className={cn(
              "flex w-full items-center gap-2.5 text-left transition-colors",
              compact
                ? "rounded-lg px-2.5 py-2 text-[13px] hover:bg-[#fafaf8]"
                : "rounded-xl border bg-white px-4 py-3 text-[13.5px] hover:border-black/25",
              !compact && (on ? "border-black/30" : "border-black/[0.08]"),
              compact && on && "bg-black/[0.04]",
            )}
          >
            <Factory
              size={compact ? 14 : 16}
              strokeWidth={1.5}
              className="flex-none text-black/40"
            />
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  "block truncate",
                  on ? "text-black/85" : "text-black/65",
                )}
              >
                {o.name}
              </span>
              <span className="block truncate font-mono text-[10.5px] text-black/35">
                {o.id}
                {o.self ? ` · ${t("your site")}` : ""}
              </span>
            </span>
            {on && <Check size={14} strokeWidth={2} className="flex-none" />}
          </button>
        );
      })}
      {!compact && (
        <div className="pt-2">
          <ButtonLink href="/workspaces/new" variant="secondary" size="sm">
            <Plus size={13} strokeWidth={1.5} /> {t("Add an installation")}
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
