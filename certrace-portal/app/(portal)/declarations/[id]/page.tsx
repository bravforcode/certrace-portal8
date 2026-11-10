"use client";

export const runtime = "edge";

/* ════════════════════════════════════════════════════════════
   A DECLARATION

   Two views over the same declaration, and the DEFAULT one is the hierarchy:

     Reports  — buyer at the top, then one annual report per supplier ×
                product, each opening its verification workspace. This is the
                dispatch board, and it is what somebody opening a declaration
                on a Tuesday actually wants: who owes what, press remind, done.

     Workflow — the full five-step flow: supplier submissions, the AI check,
                cost and carbon, sign-off, the Registry XML and dispatch to the
                buyer. Everything that happens once the reports are complete.

   The workflow used to be the whole page. It is a genuinely good screen and
   nothing has been taken out of it — but it opens on step 1 of 5 and asks the
   exporter to think about filing before anybody has sent them a meter reading,
   which is the wrong question in January and the wrong question in July.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { useRouter } from "next/navigation";
import { DeclarationHierarchy } from "@/components/declaration-hierarchy";
import { DeclarationWorkflow } from "@/components/declaration-workflow";
import { cn } from "@/components/ui";
import { useDeclaration } from "@/lib/declarations-query";
import { ErrorState, LoadingState } from "@/components/query-state";
import { useT } from "@/lib/i18n";

type View = "reports" | "workflow";

export default function DeclarationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = useT();
  const { id } = React.use(params);
  const router = useRouter();
  const { data: declaration, isError, refetch } = useDeclaration(id);
  const [view, setView] = React.useState<View>("reports");

  React.useEffect(() => {
    if (declaration === null) router.replace("/declarations");
  }, [declaration, router]);

  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (!declaration) return <LoadingState />;

  return (
    <div className="space-y-5">
      <nav
        className="flex gap-1 border-b border-black/[0.06] pb-px"
        aria-label={t("Declaration view")}
      >
        {(
          [
            ["reports", "Reports"],
            ["workflow", "Review & filing"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setView(key)}
            className={cn(
              "rounded-t-xl border-b-2 px-3 py-2.5 text-[13px] transition-colors",
              view === key
                ? "border-[#111] text-black"
                : "border-transparent text-black/45 hover:text-black/75",
            )}
          >
            {label}
          </button>
        ))}
      </nav>

      {view === "reports" ? (
        <DeclarationHierarchy
          declaration={declaration}
          onOpenFullWorkflow={() => setView("workflow")}
        />
      ) : (
        <DeclarationWorkflow declaration={declaration} />
      )}
    </div>
  );
}
