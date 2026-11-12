"use client";

/* The page-level installation switch on Workspace and Convert. Picking a site
   writes it into the URL (`?installation=`) and makes it the stored default.
   The last row adds a new installation. */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Factory, Plus } from "lucide-react";
import { Select } from "./controls";
import { useT } from "@/lib/i18n";
import { useScopedInstallation } from "@/lib/scoped-installation";

const ADD = "__add_installation__";

export function ScopedInstallationSwitcher({
  className,
}: {
  className?: string;
}) {
  const t = useT();
  const router = useRouter();
  const { options, scoped, loading, setScoped } = useScopedInstallation();

  if (!loading && options.length === 0) return null;

  return (
    <div className={className ?? "flex min-w-0 items-center gap-2"}>
      <div className="min-w-[200px] max-w-[300px]">
        <Select
          ariaLabel={t("Switch installation")}
          value={scoped?.id ?? ""}
          onChange={(v) =>
            // The /workspaces/new wizard is switched off (next.config redirects it); sites are added under Settings > Organisation.
            v === ADD ? router.push("/settings?tab=organisation") : setScoped(v)
          }
          options={[
            ...options.map((o) => ({
              value: o.id,
              label: o.name,
              hint: o.self ? t("your site") : undefined,
              icon: (
                <Factory
                  size={14}
                  strokeWidth={1.5}
                  className="flex-none text-black/40"
                  aria-hidden
                />
              ),
            })),
            {
              value: ADD,
              label: t("Add installation"),
              icon: (
                <Plus
                  size={14}
                  strokeWidth={1.5}
                  className="flex-none text-black/40"
                  aria-hidden
                />
              ),
            },
          ]}
          placeholder={t("Choose an installation")}
        />
      </div>
    </div>
  );
}
