"use client";
import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useActiveInstallation,
  type InstallationChoice,
} from "./active-installation";

/* The installation a page-level switcher is looking at: the URL's
   `?installation=` if it names a known site (so a shared link opens the same
   site for everyone), else the stored active installation, else the exporter's
   own site, else the first one known. */
export function resolveScoped(
  options: InstallationChoice[],
  urlId: string | null,
  storedId: string | null,
): InstallationChoice | null {
  const find = (id: string | null) =>
    id ? options.find((o) => o.id === id) : undefined;
  return (
    find(urlId) ??
    find(storedId) ??
    options.find((o) => o.self) ??
    options[0] ??
    null
  );
}

export function useScopedInstallation() {
  const { options, active, loading, setActive } = useActiveInstallation();
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const scoped = useMemo(
    () =>
      resolveScoped(options, params.get("installation"), active?.id ?? null),
    [options, params, active],
  );
  const setScoped = useCallback(
    (id: string) => {
      const next = new URLSearchParams(params);
      next.set("installation", id);
      router.replace(`${path}?${next}`, { scroll: false });
      setActive(id);
    },
    [params, path, router, setActive],
  );
  return { options, scoped, loading, setScoped };
}
