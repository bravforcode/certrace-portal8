"use client";

import { CeraMark } from "@/components/cera/cera-mark";
import { useCera } from "@/components/cera/cera-provider";
import { useCeraMissing } from "@/components/cera/cera-missing";
import { useT } from "@/lib/i18n";

/* On narrow screens the pill shows only the mark so the header controls fit. */
export function CeraButton() {
  const t = useT();
  const cera = useCera();
  const missing = useCeraMissing()?.data.fields.length ?? 0;

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
      {missing > 0 && (
        <span
          title={t("{n} missing", { n: missing })}
          className="ml-1 min-w-[18px] rounded-full bg-[#111] px-1 font-mono text-[10px] leading-[18px] text-white"
        >
          {missing > 99 ? "99+" : missing}
        </span>
      )}
    </button>
  );
}
