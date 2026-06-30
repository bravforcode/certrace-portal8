"use client";

import * as React from "react";
import { Check, ArrowRight, ArrowLeft } from "lucide-react";
import { Card, Button, Eyebrow, Chip, StatusDot, Field, inputClass, cn } from "@/components/ui";

const SECTIONS = [
  {
    title: "Your facility",
    fields: [
      { label: "Company name", placeholder: "Thai Metal Pro Co., Ltd", hint: "" },
      { label: "Production site / installation", placeholder: "Rayong plant 2", hint: "Where these goods are produced." },
    ],
  },
  {
    title: "Product & volume",
    fields: [
      { label: "Material supplied", placeholder: "Steel billet", hint: "" },
      { label: "Volume this period (tonnes)", placeholder: "1,200", hint: "For the requested reporting period." },
    ],
  },
  {
    title: "Emissions data",
    fields: [
      { label: "Direct (Scope 1) emissions", placeholder: "e.g. 1.84 tCO₂e / tonne", hint: "Leave blank to use a default factor." },
      { label: "Electricity (Scope 2) source", placeholder: "Grid / on-site solar", hint: "" },
    ],
  },
];

export default function SupplierFormPage() {
  const [step, setStep] = React.useState(0);
  const [submitted, setSubmitted] = React.useState(false);
  const last = step === SECTIONS.length - 1;

  if (submitted) {
    return (
      <Shell>
        <div className="mx-auto max-w-md py-16 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#ecfdf5] text-[#047857]">
            <Check size={28} strokeWidth={1.5} />
          </span>
          <h1 className="mt-5 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">
            Submitted. Thank you.
          </h1>
          <p className="mt-3 text-sm text-black/45">
            Your data is timestamped and sent to Siam Steel Export Co. You don't need an account, and there's nothing to
            pay. We'll only contact you if something needs a quick fix.
          </p>
          <div className="mt-6 inline-flex items-center gap-2">
            <StatusDot tone="ok" pulse glow />
            <span className="font-mono text-[12px] text-[#16a34a]">response recorded</span>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto max-w-lg py-10">
        <Eyebrow>CBAM · Q1 2026 data request</Eyebrow>
        <h1 className="mt-2 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">
          One short form. No account.
        </h1>
        <p className="mt-2 text-sm text-black/45">
          Siam Steel Export Co. needs verified carbon data to keep shipping to the EU. Takes about 5 minutes.
        </p>

        {/* progress */}
        <div className="mt-6 flex items-center gap-1.5">
          {SECTIONS.map((s, i) => (
            <span
              key={s.title}
              className={cn("h-1 flex-1 rounded-full transition-colors", i <= step ? "bg-[#111]" : "bg-black/[0.08]")}
            />
          ))}
        </div>

        <Card className="mt-6 p-6">
          <div key={step} className="ct-enter space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-plex)] text-xl font-light text-[#111]">{SECTIONS[step].title}</h2>
              <span className="font-mono text-[11px] text-black/35">
                {step + 1} / {SECTIONS.length}
              </span>
            </div>
            {SECTIONS[step].fields.map((f) => (
              <Field key={f.label} label={f.label} hint={f.hint || undefined}>
                <input className={inputClass} placeholder={f.placeholder} />
              </Field>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-black/[0.06] pt-5">
            <Button variant="ghost" size="sm" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              <ArrowLeft size={14} strokeWidth={1.5} /> Back
            </Button>
            {last ? (
              <Button size="sm" onClick={() => setSubmitted(true)}>
                Submit data <Check size={14} strokeWidth={2} />
              </Button>
            ) : (
              <Button size="sm" onClick={() => setStep((s) => s + 1)}>
                Continue <ArrowRight size={14} strokeWidth={1.5} />
              </Button>
            )}
          </div>
        </Card>

        <p className="mt-5 text-center text-[11px] text-black/30">
          Powered by Certrace · suppliers are always free
        </p>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      <header className="border-b border-black/[0.06]">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between px-6">
          <span className="font-pixel text-[12px] uppercase tracking-[0.25em] text-black/70">Certrace</span>
          <Chip tone="ok">secure form</Chip>
        </div>
      </header>
      <main className="px-6">{children}</main>
    </div>
  );
}
