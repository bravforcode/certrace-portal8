"use client";

import Link from "next/link";
import { Card, PageHeader, Eyebrow, Field, inputClass, Chip, Button } from "@/components/ui";
import { toast } from "@/components/toast";
import { ORG } from "@/lib/data";
import { JURISDICTIONS } from "@/lib/config";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Settings"
        title="Organisation."
        lead="Locale, units and identity. These drive how every declaration is rendered and filed."
        actions={
          <Button size="sm" onClick={() => toast({ message: "Settings saved.", detail: "Applied to all future declarations." })}>
            Save changes
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <Eyebrow>Company</Eyebrow>
          <div className="mt-4 space-y-4">
            <Field label="Legal name">
              <input className={inputClass} defaultValue={ORG.name} />
            </Field>
            <Field label="Primary sector">
              <input className={inputClass} defaultValue={ORG.sector} />
            </Field>
            <Field label="Installation / facility ID" hint="Required for CBAM declarant identification.">
              <input className={inputClass} defaultValue={ORG.installationId} />
            </Field>
          </div>
        </Card>

        <Card className="p-6">
          <Eyebrow>Locale & units</Eyebrow>
          <div className="mt-4 space-y-4">
            <Field label="Operating jurisdiction" hint="Sets the localised emission-factor library and number formats.">
              <select className={inputClass} defaultValue="TH">
                {JURISDICTIONS.map((j) => (
                  <option key={j.code} value={j.code} disabled={!j.available}>
                    {j.name} {j.available ? `— ${j.factorSet}` : "— coming soon"}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Display currency">
              <select className={inputClass} defaultValue="THB">
                {[...new Set(JURISDICTIONS.map((j) => j.currency))].map((c) => (
                  <option key={c}>{c}</option>
                ))}
                <option>EUR</option>
              </select>
            </Field>
            <Field label="Emission unit">
              <select className={inputClass} defaultValue="tCO₂e">
                <option>tCO₂e</option>
                <option>kgCO₂e</option>
              </select>
            </Field>
            <Field label="Interface language">
              <select className={inputClass} defaultValue="English">
                <option>English</option>
                <option>ไทย (Thai)</option>
                <option>Tiếng Việt</option>
                <option>Bahasa Indonesia</option>
              </select>
            </Field>
          </div>
        </Card>
      </div>

      <Card warm className="flex flex-col items-start justify-between gap-3 p-6 sm:flex-row sm:items-center">
        <div>
          <Eyebrow>Plan</Eyebrow>
          <p className="mt-2 text-sm text-black/55">
            You&apos;re on <span className="text-[#111]">{ORG.planLabel}</span> — auditor portal seats + the full CBAM workflow.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Chip tone="ok">suppliers free</Chip>
          <Link href="/billing">
            <Button variant="secondary" size="sm">
              Manage plan
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
