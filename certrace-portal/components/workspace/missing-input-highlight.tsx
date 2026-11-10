"use client";
import { useT } from "@/lib/i18n";
import { Chip } from "@/components/ui";

/** Red identifies an outstanding required answer, never the age of a field. */
export const missingInputPanelClass = "ring-2 ring-[#dc2626] bg-[#fef2f2]";
export const missingInputFieldClass =
  "border-[#dc2626] ring-1 ring-[#dc2626] bg-[#fef2f2]";

export function MissingInputBadge() {
  const t = useT();
  return (
    <Chip tone="err" filled>
      {t("Missing input")}
    </Chip>
  );
}
