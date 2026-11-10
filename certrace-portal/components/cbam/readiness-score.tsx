"use client";

/* The readiness score — one number that answers "am I ready to call the
   verifier?".

   The highest-leverage surface in the product, and the reason is boring: an
   exporter cannot act on sixteen rules, and they can act on "three things are
   blocking you, here they are, each one is a click away". Every failing rule
   links to the screen that fixes it — a finding with no route to a fix is a
   complaint, not a check.

   Warnings can be accepted, with a recorded reason. Errors cannot: they are
   the ones that produce a filing that is wrong. */

import * as React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  TriangleAlert,
  CircleCheck,
  ChevronRight,
  PenLine,
} from "lucide-react";
import {
  Card,
  Button,
  Eyebrow,
  Chip,
  Progress,
  inputClass,
  cn,
} from "@/components/ui";
import { toast } from "@/components/toast";
import {
  canOverride,
  listOverrides,
  saveOverride,
  type Readiness,
  type RuleResult,
  type Override,
} from "@/lib/cbam/validate";
import { useT } from "@/lib/i18n";

export function ReadinessScore({
  declarationId,
  readiness,
  by,
  compact,
}: {
  declarationId: string;
  readiness: Readiness;
  by: string;
  /** headline only — used inside the declaration workspace */
  compact?: boolean;
}) {
  const t = useT();
  const [overrides, setOverrides] = React.useState<Override[]>([]);
  const [openRule, setOpenRule] = React.useState<string | null>(null);
  const [justification, setJustification] = React.useState("");

  React.useEffect(
    () => setOverrides(listOverrides(declarationId)),
    [declarationId],
  );

  const overridden = new Set(overrides.map((o) => o.ruleId));
  const tone =
    readiness.verdict === "ready"
      ? "ok"
      : readiness.verdict === "nearly"
        ? "warn"
        : "err";

  const accept = (rule: RuleResult) => {
    if (!justification.trim()) {
      toast({
        message: "A reason is required",
        detail:
          "An accepted warning travels into the dossier with its justification — that is what makes it defensible.",
        tone: "err",
      });
      return;
    }
    setOverrides(
      saveOverride(declarationId, {
        ruleId: rule.id,
        justification: justification.trim(),
        by,
        at: Date.now(),
      }),
    );
    setJustification("");
    setOpenRule(null);
    toast({
      message: `${rule.id} accepted`,
      detail:
        "Recorded with your reason and included in the verification dossier.",
      tone: "ok",
    });
  };

  return (
    <Card highlight className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 flex-none place-items-center rounded-xl border border-black/10 text-black/55">
            <ShieldCheck size={16} strokeWidth={1.5} />
          </span>
          <div>
            <Eyebrow>{t("Verification readiness")}</Eyebrow>
            <div className="mt-1.5 flex items-baseline gap-3">
              <span className="font-[family-name:var(--font-plex)] text-4xl font-light text-[#111]">
                {readiness.score}
              </span>
              <Chip tone={tone}>{readiness.verdict}</Chip>
            </div>
            <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-black/45">
              {readiness.blocked
                ? `${readiness.errors} finding${readiness.errors === 1 ? "" : "s"} would fail on inspection. Each one links to the screen that fixes it.`
                : readiness.warnings > 0
                  ? `Nothing blocks a filing. ${readiness.warnings} reservation${readiness.warnings === 1 ? "" : "s"} a verifier will raise — resolve or accept with a reason.`
                  : "All sixteen checks pass. A verifier opening this dossier can answer every assertion without asking you a question."}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <Progress value={readiness.score} tone={tone} />
      </div>

      {!compact && (
        <div className="mt-6 space-y-2">
          {readiness.rules.map((rule) => {
            const accepted = rule.status === "warn" && overridden.has(rule.id);
            return (
              <div
                key={rule.id}
                className={cn(
                  "rounded-xl border p-3",
                  rule.status === "fail"
                    ? "border-[#dc2626]/25 bg-[#fef2f2]"
                    : rule.status === "warn" && !accepted
                      ? "border-[#d97706]/25 bg-[#fffbeb]"
                      : "border-black/[0.07] bg-white",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2.5">
                    {rule.status === "pass" || accepted ? (
                      <CircleCheck
                        size={14}
                        strokeWidth={1.8}
                        className="mt-0.5 flex-none text-[#047857]"
                      />
                    ) : (
                      <TriangleAlert
                        size={14}
                        strokeWidth={1.8}
                        className={cn(
                          "mt-0.5 flex-none",
                          rule.status === "fail"
                            ? "text-[#dc2626]"
                            : "text-[#b45309]",
                        )}
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] text-black/35">
                          {rule.id}
                        </span>
                        <span className="text-[13px] text-black/75">
                          {rule.title}
                        </span>
                        {accepted && (
                          <span className="text-[10px] uppercase tracking-[0.1em] text-[#047857]">
                            {t("accepted")}
                          </span>
                        )}
                      </div>
                      {rule.findings.length > 0 && (
                        <ul className="mt-1.5 space-y-1">
                          {rule.findings.slice(0, 3).map((f, i) => (
                            <li
                              key={i}
                              className="text-[12px] leading-relaxed text-black/55"
                            >
                              {f.message}
                            </li>
                          ))}
                          {rule.findings.length > 3 && (
                            <li className="text-[11px] text-black/35">
                              + {rule.findings.length - 3} more
                            </li>
                          )}
                        </ul>
                      )}
                      {accepted && (
                        <p className="mt-1.5 text-[11.5px] italic leading-relaxed text-black/45">
                          “
                          {
                            overrides.find((o) => o.ruleId === rule.id)
                              ?.justification
                          }
                          ” — {overrides.find((o) => o.ruleId === rule.id)?.by}
                        </p>
                      )}
                    </div>
                  </div>

                  {rule.status !== "pass" && (
                    <div className="flex flex-none items-center gap-2">
                      {rule.status === "warn" &&
                        !accepted &&
                        rule.findings.some((f) => canOverride(f.severity)) && (
                          <button
                            onClick={() =>
                              setOpenRule(openRule === rule.id ? null : rule.id)
                            }
                            className="inline-flex items-center gap-1.5 text-[11px] text-black/45 hover:text-black"
                          >
                            <PenLine size={11} strokeWidth={1.5} />{" "}
                            {t("Accept with a reason")}
                          </button>
                        )}
                      <Link
                        href={rule.screen.path}
                        className="inline-flex items-center gap-1 rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-[11px] text-black/60 hover:border-black/25 hover:text-black"
                      >
                        {rule.screen.label}{" "}
                        <ChevronRight size={11} strokeWidth={1.5} />
                      </Link>
                    </div>
                  )}
                </div>

                {openRule === rule.id && (
                  <div className="mt-3 border-t border-black/[0.08] pt-3">
                    <input
                      className={inputClass}
                      value={justification}
                      placeholder={t(
                        "Why is this acceptable? The reason goes into the dossier.",
                      )}
                      onChange={(e) => setJustification(e.target.value)}
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-white"
                        onClick={() => accept(rule)}
                      >
                        {t("Record and accept")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setOpenRule(null)}
                      >
                        {t("Cancel")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
