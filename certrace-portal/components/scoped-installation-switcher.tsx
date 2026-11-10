"use client";

/* The page-level installation switch on Workspace and Convert. Picking a site
   writes it into the URL (`?installation=`) and makes it the stored default. */

import * as React from "react";
import { Factory } from "lucide-react";
import { Select } from "./controls";
import { useT } from "@/lib/i18n";
import { useScopedInstallation } from "@/lib/scoped-installation";

export function ScopedInstallationSwitcher({ className }: { className?: string }) {
  const t = useT();
  const { options, scoped, loading, setScoped } = useScopedInstallation();

  if (!loading && options.length === 0) return null;

  return (
    <div className={className ?? "flex min-w-0 items-center gap-2"}>
      <Factory size={14} strokeWidth={1.5} className="flex-none text-black/40" />
      <div className="min-w-[180px] max-w-[280px]">
        <Select
          ariaLabel={t("Switch installation")}
          value={scoped?.id ?? ""}
          onChange={setScoped}
          options={options.map((o) => ({
            value: o.id,
            label: o.name,
            hint: o.self ? t("your site") : undefined,
          }))}
          placeholder={t("Choose an installation")}
        />
      </div>
    </div>
  );
}
