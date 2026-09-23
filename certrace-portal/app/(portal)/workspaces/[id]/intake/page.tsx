"use client";

export const runtime = "edge";

/* ════════════════════════════════════════════════════════════
   SMART UPLOAD

   The exporter's door into lib/smart-intake.ts. No month editor is open on
   this page, so accepted values go straight to the store.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Laptop } from "lucide-react";
import { SmartIntake } from "@/components/intake/smart-intake";
import { useWorkspace } from "@/components/workspace/provider";
import { USER } from "@/lib/data";
import { storeMonthWriter } from "@/lib/smart-intake";
import { useInvalidateWorkspaceData } from "@/lib/workspace-data-query";
import { useT } from "@/lib/i18n";

export default function IntakePage() {
  const t = useT();
  const { workspace, refresh } = useWorkspace();
  const router = useRouter();
  const invalidate = useInvalidateWorkspaceData(workspace.id);
  const writer = React.useMemo(() => storeMonthWriter(workspace.id), [workspace.id]);

  return (
    <div className="space-y-4">
      {/* PROTOTYPE: on a phone the upload still works, but checking is easier
          on a computer — say so, and point at the phone view. */}
      <Link href="/monitor" className="flex items-center gap-3 rounded-2xl border border-black/[0.07] bg-[#faf9f7] px-4 py-3 text-[13px] leading-relaxed text-black/60 md:hidden">
        <Laptop size={16} className="flex-none text-black/40" />
        <span className="min-w-0 flex-1">{t("Adding and checking documents is easier on a computer. On a phone, use this page to keep track.")}</span>
        <span className="flex-none text-[13px] text-[#111]">{t("Monitor")} ›</span>
      </Link>
      <SmartIntake
        workspaceId={workspace.id}
        audience="exporter"
        writeMonth={writer}
        uploadedBy={USER.name}
        onFiled={() => {
          invalidate();
          refresh();
        }}
        /* Confirm lands where the values went: the first month filled, where
           they sit in blue. Documents that filled no value (a certificate)
           land on the evidence they became. */
        onComplete={({ docs, months }) => {
          if (months.length > 0) router.push(`/workspaces/${workspace.id}/monthly/${months[0]}`);
          else if (docs > 0) router.push(`/workspaces/${workspace.id}/evidence`);
        }}
      />
    </div>
  );
}
