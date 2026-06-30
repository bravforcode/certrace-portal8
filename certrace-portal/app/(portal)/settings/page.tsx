"use client";

import * as React from "react";
import Link from "next/link";
import { Card, PageHeader, Eyebrow, Field, inputClass, Chip, Button } from "@/components/ui";
import { Select } from "@/components/controls";
import { toast } from "@/components/toast";
import { ORG } from "@/lib/data";
import { JURISDICTIONS } from "@/lib/config";

export default function SettingsPage() {
  const [jurisdiction, setJurisdiction] = React.useState("TH");
  const [currency, setCurrency] = React.useState("THB");
  const [unit, setUnit] = React.useState("tCO₂e");
  const [language, setLanguage] = React.useState("English");
  const currencies = [...new Set(JURISDICTIONS.map((j) => j.currency)), "EUR"];

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
              <Select
                value={jurisdiction}
                onChange={setJurisdiction}
                options={JURISDICTIONS.map((j) => ({ value: j.code, label: j.name, hint: j.available ? j.factorSet : "coming soon" }))}
                ariaLabel="Operating jurisdiction"
              />
            </Field>
            <Field label="Display currency">
              <Select value={currency} onChange={setCurrency} options={currencies.map((c) => ({ value: c, label: c }))} ariaLabel="Display currency" />
            </Field>
            <Field label="Emission unit">
              <Select value={unit} onChange={setUnit} options={[{ value: "tCO₂e", label: "tCO₂e" }, { value: "kgCO₂e", label: "kgCO₂e" }]} ariaLabel="Emission unit" />
            </Field>
            <Field label="Interface language">
              <Select
                value={language}
                onChange={setLanguage}
                options={["English", "ไทย (Thai)", "Tiếng Việt", "Bahasa Indonesia"].map((l) => ({ value: l, label: l }))}
                ariaLabel="Interface language"
              />
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
