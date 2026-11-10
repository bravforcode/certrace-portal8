"use client";

import { CeraMark } from "@/components/cera/cera-mark";
import { useCera } from "@/components/cera/cera-provider";
import { useT } from "@/lib/i18n";

/* On narrow screens the pill shows only the mark so the header controls fit. */
export function CeraButton() {
  const t = useT();
  const cera = useCera();

  return (
    <button
      type="button"
      onClick={cera.toggle}
      aria-label={t("Cera Intelligence")}
      title={t("Cera Intelligence")}
      className="cera-pill"
    >
      <CeraMark className="h-[14px] w-auto" />
      <span>{t("Cera Intelligence")}</span>
    </button>
  );
}
