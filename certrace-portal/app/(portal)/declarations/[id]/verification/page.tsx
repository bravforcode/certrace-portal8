"use client";

export const runtime = "edge";

/* ════════════════════════════════════════════════════════════
   VERIFICATION DOSSIER — what the verifier actually opens

   Ordered by the seven assertions a verifier works through, not by how the
   portal happens to store things. Read top to bottom, each assertion states
   the question, the evidence expected against it, whether it is currently
   answerable, and where the answer lives.

   The design target is blunt: a verifier opening this should not need to
   email the exporter a single question. Anything marked unanswered here is a
   question they WILL ask, surfaced now while it is cheap to fix.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, Link2, CircleCheck, TriangleAlert, CircleX, Copy, EyeOff } from "lucide-react";
import { Card, Button, Eyebrow, Chip, cn } from "@/components/ui";
import { toast } from "@/components/toast";
import { ReadinessScore } from "@/components/cbam/readiness-score";
import { getDeclaration, USER, type Declaration } from "@/lib/data";
import { loadExporterState, rollup as buildRollup } from "@/lib/exporter-review";
import { computeReadiness } from "@/lib/cbam/readiness-input";
import { buildDossier, verifierShareToken, type Dossier } from "@/lib/cbam/dossier";
import { activeSnapshot, type CalculationSnapshot } from "@/lib/cbam/freeze";
import { latestVersion, type MmdVersion } from "@/lib/cbam/mmd";
import { displayDate } from "@/lib/cbam/boundary";
import { REGISTRY_SCHEMA_STATUS } from "@/lib/cbam/reference";
import { useT } from "@/lib/i18n";

const STATUS_META = {
  answered: { label: "answered", tone: "ok" as const, Icon: CircleCheck, cls: "text-[#047857]" },
  qualified: { label: "qualified", tone: "warn" as const, Icon: TriangleAlert, cls: "text-[#b45309]" },
  unanswered: { label: "unanswered", tone: "err" as const, Icon: CircleX, cls: "text-[#dc2626]" },
};

export default function VerificationDossierPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useT();
  const { id } = React.use(params);
  const router = useRouter();
  const [decl, setDecl] = React.useState<Declaration | null>(null);
  const [dossier, setDossier] = React.useState<Dossier | null>(null);
  const [snapshot, setSnapshot] = React.useState<CalculationSnapshot | null>(null);
  const [mmd, setMmd] = React.useState<MmdVersion | null>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    const found = getDeclaration(id);
    if (!found) {
      router.replace("/declarations");
      return;
    }
    setDecl(found);
    const roll = buildRollup(found, loadExporterState(found.id));
    const snap = activeSnapshot(found.id);
    const mmdVersion = latestVersion(found.id);
    setDossier(
      buildDossier(found.id, computeReadiness(found, roll, USER.name), {
        mmdFinalised: Boolean(mmdVersion),
        frozen: Boolean(snap),
      }),
    );
    setSnapshot(snap);
    setMmd(mmdVersion);
  }, [id, router]);

  if (!decl || !dossier) return null;

  const copyLink = async () => {
    const url = `${window.location.origin}/verify/${verifierShareToken(decl.id)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ message: "Could not copy", detail: url, tone: "err" });
    }
  };

  return (
    <div className="space-y-7">
      <div className="space-y-4">
        <Link href={`/declarations/${decl.id}`} className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-black/40 hover:text-black">
          <ArrowLeft size={13} strokeWidth={1.5} /> {decl.title ?? decl.name}
        </Link>
        <div className="flex flex-col gap-4 border-b border-black/[0.06] pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>{t("Verification dossier")}</Eyebrow>
            <h1 className="mt-2 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111] md:text-4xl">
              {t("What the verifier opens")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-black/45">
              {t("Ordered by the seven assertions a verifier works through. Anything marked unanswered below is a question they will ask — cheaper to close now than during the engagement.")}
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={copyLink}>
            {copied ? <CircleCheck size={13} strokeWidth={2} /> : <Link2 size={13} strokeWidth={1.5} />}
            {copied ? "Copied" : "Copy verifier link"}
          </Button>
        </div>
      </div>

      <ReadinessScore declarationId={decl.id} readiness={dossier.readiness} by={USER.name} compact />

      {dossier.selfContained ? (
        <Card className="border-[#059669]/25 p-5">
          <p className="flex items-start gap-2 text-[13px] leading-relaxed text-black/70">
            <CircleCheck size={15} strokeWidth={1.8} className="mt-0.5 flex-none text-[#047857]" />
            {t("Every assertion is answerable from what is in the portal. That is the definition of a dossier that passes easily.")}
          </p>
        </Card>
      ) : (
        <Card warm className="border-[#d97706]/25 p-5">
          <p className="flex items-start gap-2 text-[13px] leading-relaxed text-black/70">
            <TriangleAlert size={15} strokeWidth={1.8} className="mt-0.5 flex-none text-[#b45309]" />
            {dossier.sections.filter((s) => s.status !== "answered").length} of the seven assertions cannot be answered from the portal
            yet. Each one below says what is missing and where it goes.
          </p>
        </Card>
      )}

      {/* The package contents, before the assertions — a verifier wants to
          know what they have been handed before they start testing it. */}
      <Card className="p-6">
        <h2 className="text-[15px] text-black/80">{t("What is in the package")}</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Item
            label={t("Monitoring methodology")}
            value={mmd ? `Version ${mmd.n}` : "Not finalised"}
            sub={mmd ? displayDate(new Date(mmd.finalisedAt).toISOString()) : "Verifiers read this first"}
            ok={Boolean(mmd)}
          />
          <Item
            label={t("Frozen calculation")}
            value={snapshot ? `Version ${snapshot.version}` : "Not frozen"}
            sub={snapshot ? `${snapshot.engineVersion}` : "Figures can still drift"}
            ok={Boolean(snapshot)}
          />
          <Item
            label={t("Dataset hash")}
            value={snapshot ? `${snapshot.contentHash.slice(0, 14)}…` : "—"}
            sub={snapshot ? "sha-256 over inputs + outputs" : "Available once frozen"}
            ok={Boolean(snapshot)}
          />
          <Item
            label={t("Sign-off")}
            value={snapshot ? `${snapshot.preparerId} → ${snapshot.approverId}` : "—"}
            sub={snapshot ? "preparer → approver" : "Recorded at freeze"}
            ok={Boolean(snapshot)}
          />
        </dl>
      </Card>

      {/* The seven assertions */}
      <div className="space-y-4">
        {dossier.sections.map((s, i) => {
          const meta = STATUS_META[s.status];
          const Icon = meta.Icon;
          return (
            <Card key={s.id} className={cn("p-6", s.status === "unanswered" && "border-[#dc2626]/20")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-xl border border-black/10 font-mono text-[12px] text-black/45">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[15px] text-black/80">{s.title}</h2>
                      <span className={cn("inline-flex items-center gap-1.5 text-[11px]", meta.cls)}>
                        <Icon size={12} strokeWidth={1.8} /> {meta.label}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] italic text-black/55">“{s.question}”</p>
                    <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-black/45">{s.expectedEvidence}</p>
                  </div>
                </div>
                <div className="flex flex-none flex-wrap gap-1.5">
                  {s.links.map((l) => (
                    <Link
                      key={l.path}
                      href={l.path}
                      className="rounded-lg border border-black/10 px-2.5 py-1.5 text-[11px] text-black/55 hover:border-black/25 hover:text-black"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>

              {s.findings.length > 0 && (
                <ul className="mt-4 space-y-1.5 border-t border-black/[0.06] pt-4">
                  {s.findings.map((f, j) => (
                    <li key={j} className={cn("text-[12.5px] leading-relaxed", f.severity === "error" ? "text-[#dc2626]" : "text-[#b45309]")}>
                      <span className="font-mono text-[10px] opacity-60">{f.id}</span> · {f.message}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>

      {/* What the verifier will NOT see */}
      <Card warm className="p-6">
        <div className="flex items-start gap-3">
          <EyeOff size={15} strokeWidth={1.5} className="mt-0.5 flex-none text-black/45" />
          <div>
            <h2 className="text-[15px] text-black/80">{t("What the verifier link does not carry")}</h2>
            <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-black/50">
              {t("Certificate exposure, carbon-price spend and supplier cost stay on your side of the line. The verifier sees provenance, attestations and the derivation behind every figure — which is everything their opinion depends on and nothing of your commercial position. Suppliers can withhold their process from a buyer; they can never withhold it from the verifier.")}
            </p>
            <p className="mt-3 text-[11.5px] leading-relaxed text-black/35">
              {t("MVP note: the verifier link is an encoding, not authentication. Production links must be server-issued, signed, expiring and revocable — see docs/SECURITY.md.")}
            </p>
          </div>
        </div>
      </Card>

      <p className="pb-4 text-[11.5px] leading-relaxed text-black/35">{REGISTRY_SCHEMA_STATUS.warning}</p>
    </div>
  );
}

function Item({ label, value, sub, ok }: { label: string; value: string; sub: string; ok: boolean }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.12em] text-black/35">{label}</dt>
      <dd className={cn("mt-1 text-[13px]", ok ? "text-black/75" : "text-[#b45309]")}>{value}</dd>
      <dd className="mt-0.5 font-mono text-[10px] text-black/30">{sub}</dd>
    </div>
  );
}
