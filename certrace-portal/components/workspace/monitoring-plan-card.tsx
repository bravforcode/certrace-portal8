"use client";

/* ════════════════════════════════════════════════════════════
   MONITORING PLAN ELEMENTS — the seven answers nothing else asks

   Annex II point A.5 of Implementing Regulation (EU) 2025/2547 lists the 22
   elements a monitoring plan contains. The portal already holds most of them —
   the boundary, the instruments, the products, the precursors, the yes/no
   questions on the installation page. What it did not hold, and the monitoring
   plan report therefore printed as missing, is:

     A.5(8)      how the calculation factors are determined, and the sampling plan
     A.5(22)(b)  risk assessment of the data flow
     A.5(22)(c)  quality assurance of the information systems
     A.5(22)(d)  segregation of duties and competencies
     A.5(22)(f)  corrections and corrective action
     A.5(22)(g)  control of outsourced processes
     A.5(22)(h)  keeping records and managing document versions

   (22)(a) is the instruments' calibration, which is already in the instrument
   rows, and (22)(e) is the review in "Quality assurance". The box in front of
   each label is the monitoring-plan element it answers ("MP" + the number), the
   way the Annex IV boxes name the item they feed.

   Shared by the exporter's methodology page and the supplier's methodology step,
   so the two can never ask these differently.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { inputClass, cn } from "@/components/ui";
import { SectionCard } from "@/components/workspace/chrome";
import { TaggedField } from "@/components/precursor/annex-fields";
import type { ControlSystem, WorkspaceMmdContent } from "@/lib/workspace-mmd";
import { useT } from "@/lib/i18n";

type Row = { tag: string; key: keyof ControlSystem | "samplingPlan"; label: string; hint: string; placeholder: string };

/* Worked answers, Siam Steel. Shown as placeholders — greyed, never written into the box. */
const ROWS: Row[] = [
  {
    tag: "MP 8",
    key: "samplingPlan",
    label: "How the calculation factors are determined, and the sampling plan",
    hint: "For each source stream: where the factor comes from (laboratory analysis, supplier certificate or an EU standard value), how often the sample is taken, and by whom.",
    placeholder: "Natural gas: net calorific value and emission factor from the supplier's certificate of analysis for each delivery. Electrodes: carbon content from each lot's certificate. Where there is none, a sample goes to an ISO/IEC 17025 laboratory.",
  },
  {
    tag: "MP 22(b)",
    key: "riskAssessment",
    label: "Risk assessment of the data flow",
    hint: "Where an error could enter between the primary reading and the figure reported, and how likely each is.",
    placeholder: "Raw data is checked each month between the production floor and accounting and environment, to catch keying errors. Highest risk: weighbridge tickets typed into the ERP by hand; lowest: meter data pulled automatically from the SCADA.",
  },
  {
    tag: "MP 22(c)",
    key: "itSystems",
    label: "Quality assurance of the information systems",
    hint: "The systems that process the data, and how they are tested, controlled and maintained.",
    placeholder: "SAP production module and the SCADA historian. Changes are tested on a copy and approved by IT before they go live; access is by named user.",
  },
  {
    tag: "MP 22(d)",
    key: "segregationOfDuties",
    label: "Segregation of duties and competencies",
    hint: "Who records, who checks and who approves — and how people are trained for it.",
    placeholder: "Shift operators record; the production planner checks; the environmental manager approves. Annual training on the monitoring plan for all three.",
  },
  {
    tag: "MP 22(f)",
    key: "corrections",
    label: "Corrections and corrective action",
    hint: "What is done when a review finds an error or an instrument is out of tolerance.",
    placeholder: "The figure is corrected at source, the correction is logged with a reason, and the month is re-reviewed. An instrument out of tolerance is recalibrated before its readings are used again.",
  },
  {
    tag: "MP 22(g)",
    key: "outsourced",
    label: "Control of outsourced processes",
    hint: "Any part of the data flow done by someone else — a laboratory, a metering contractor. Write “None” if there is none.",
    placeholder: "Coal and electrode analysis by an accredited external laboratory; its certificates are checked against the order before the figures are used.",
  },
  {
    tag: "MP 22(h)",
    key: "records",
    label: "Keeping records and managing document versions",
    hint: "Where records are kept, for how long — at least six years after the reporting period — and how an old version of a document is told from the current one.",
    placeholder: "Weighbridge tickets, invoices and production reports are kept in the company's document system for at least six years after the reporting period; superseded versions are archived and never overwritten.",
  },
];

export function MonitoringPlanCard({
  value,
  onChange,
  disabled,
  anchor,
  title,
}: {
  value: WorkspaceMmdContent;
  onChange: (p: Partial<WorkspaceMmdContent>) => void;
  disabled?: boolean;
  anchor?: (id: string) => string | undefined;
  /** the exporter's page numbers its cards; the supplier's step does not */
  title?: string;
}) {
  const t = useT();
  const read = (r: Row) => (r.key === "samplingPlan" ? value.samplingPlan : value.controlSystem[r.key]) ?? "";
  const write = (r: Row, v: string) => (r.key === "samplingPlan" ? onChange({ samplingPlan: v }) : onChange({ controlSystem: { ...value.controlSystem, [r.key]: v } }));

  return (
    <SectionCard
      title={title ?? t("Monitoring plan elements")}
      blurb={t("What Annex II A.5 asks of the monitoring plan that nothing above already answers.")}
      helpTitle={t("Monitoring plan elements")}
      help={
        <>
          <p>{t("The monitoring plan is the document the verifier reads first. Its template has 22 elements; most are read straight from your boundary, instruments, products and the installation page.")}</p>
          <p className="mt-2">{t("These seven are descriptions only you can write. A line or two each is enough — what you do, not a policy manual.")}</p>
        </>
      }
    >
      <div className="grid gap-x-4 gap-y-5 md:grid-cols-2">
        {ROWS.map((r) => (
          <TaggedField key={r.key} id={anchor?.(`mmd-${r.key}`)} tag={r.tag} need="required" label={t(r.label)} hint={t(r.hint)} className={cn(r.key === "samplingPlan" && "md:col-span-2")}>
            <textarea
              className={cn(inputClass, "min-h-[84px] resize-y", !read(r).trim() && "border-[#f59e0b]/50")}
              value={read(r)}
              disabled={disabled}
              placeholder={r.placeholder}
              onChange={(e) => write(r, e.target.value)}
            />
          </TaggedField>
        ))}
      </div>
    </SectionCard>
  );
}
