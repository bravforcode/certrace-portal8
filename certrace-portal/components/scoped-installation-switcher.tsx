"use client";

/* The page-level installation switch on Workspace and Convert. Picking a site
   writes it into the URL (`?installation=`) and makes it the stored default.
   The last row adds a new installation. */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Factory, Plus } from "lucide-react";
import { Select } from "./controls";
import { ButtonLink } from "./ui";
import { useT } from "@/lib/i18n";
import { useScopedInstallation } from "@/lib/scoped-installation";

const ADD = "__add_installation__";
const ADD_HREF = "/settings?tab=installation&add=installation";

export function ScopedInstallationSwitcher({
  className,
}: {
  className?: string;
}) {
  const t = useT();
  const router = useRouter();
  const { options, scoped, loading, setScoped } = useScopedInstallation();

  // With no site yet there is nothing to switch, so the only action is adding one.
  if (!loading && options.length === 0)
    return (
      <div className={className ?? "flex min-w-0 items-center gap-2"}>
        <ButtonLink href={ADD_HREF} variant="secondary" size="sm">
          <Plus size={13} strokeWidth={1.5} aria-hidden />{" "}
          {t("Add installation")}
        </ButtonLink>
      </div>
    );

  return (
    <div className={className ?? "flex min-w-0 items-center gap-2"}>
      <div className="min-w-[200px] max-w-[300px]">
        <Select
          ariaLabel={t("Switch installation")}
          value={scoped?.id ?? ""}
          onChange={(v) =>
            // The /workspaces/new wizard is switched off (next.config redirects it); Settings opens its add-site form.
            v === ADD ? router.push(ADD_HREF) : setScoped(v)
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
