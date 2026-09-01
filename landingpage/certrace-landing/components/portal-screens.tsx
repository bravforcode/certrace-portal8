"use client";

/* ════════════════════════════════════════════════════════════
   THE TEN SCREENS — six features, four steps

   Each one is a real screen of the exporter portal, redrawn at panel size from
   the primitives in portal-ui.tsx. The pairing is deliberate: a feature on the
   marketing site should show the screen that delivers it, not an abstraction
   of it, so a reader who books a demo sees the same thing again.

     platform-invite     → Smart Links · "Every link you have issued"
     platform-profile    → Suppliers · "Who produces your goods."
     platform-quality    → the AI quality check on a submission
     platform-engine     → Workspace readiness · "Overall readiness"
     platform-benchmark  → Carbon & Cost · "What your numbers are worth"
     platform-report     → Reports · "One report per product."

     step 1 Create       → the new-workspace wizard, step 1 of 4
     step 2 Collect      → the supplier's own month form, on their link
     step 3 Review       → Carbon & Cost, with the exposure figure
     step 4 Always ready → the finished report package

   LANGUAGE. These stay in English in every locale, the same rule the site
   already applies to the live supplier table and the console output — see the
   scope note at the top of lib/content.ts. They depict a product surface, and
   a 7px caption does not survive being re-set in Thai or Devanagari.

   Every figure below is one the engine can actually produce, and the fixture
   is the portal's own: a Thai steel exporter filing CBAM for the EU.
   ════════════════════════════════════════════════════════════ */

import {
  Bar,
  Chips,
  Line,
  Note,
  Panel,
  PortalFrame,
  PortalHeader,
  Rows,
  StatusDot,
  Stepper,
  TileRow,
} from "./portal-ui";

/* ═══════════════════════════ THE SIX FEATURES ═══════════════ */

function InviteScreen() {
  return (
    <PortalFrame sidebar={false}>
      <PortalHeader eyebrow="SMART LINKS" title="Every link you have issued" />
      <Chips items={["Send now", "Late", "In process", "Done"]} active={0} />
      <Rows
        head={["What is being asked", "Status"]}
        rows={[
          {
            cells: [
              <span key="a" className="flex items-center gap-1.5">
                <StatusDot tone="warn" /> Bangkok Steel · March
              </span>,
              "Send now",
            ],
          },
          {
            cells: [
              <span key="b" className="flex items-center gap-1.5">
                <StatusDot tone="err" /> Eastern Aluminium · Feb
              </span>,
              "Late",
            ],
          },
          {
            cells: [
              <span key="c" className="flex items-center gap-1.5">
                <StatusDot tone="info" /> Chonburi Foundry · March
              </span>,
              "In process",
            ],
          },
          {
            cells: [
              <span key="d" className="flex items-center gap-1.5">
                <StatusDot tone="ok" /> EEC Galvanizing · March
              </span>,
              "Done",
            ],
          },
        ]}
      />
      <div className="mt-2">
        <Note>No account needed — whoever opens the link fills it in and sees nothing else.</Note>
      </div>
    </PortalFrame>
  );
}

function ProfileScreen() {
  return (
    <PortalFrame sidebar={false}>
      <PortalHeader eyebrow="SUPPLIERS" title="Who produces your goods." action="ADD SUPPLIER" />
      <div className="mb-2">
        <TileRow
          tiles={[
            { value: "8", label: "Suppliers", sub: "free on every plan" },
            { value: "11", label: "Installations", sub: "across every supplier" },
            { value: "6", label: "Goods", sub: "in verification" },
          ]}
        />
      </div>
      <Panel title="Bangkok Steel Co." action="FILL-ONCE PROFILE">
        <Line label="Installation address" value="saved" tone="ok" dot="ok" />
        <Line label="Production route · EAF" value="saved" tone="ok" dot="ok" />
        <Line label="Q3 2026 · buyer A" value="14/18 prefilled" tone="ok" />
        <Line label="Q3 2026 · buyer B" value="14/18 prefilled" tone="ok" />
      </Panel>
    </PortalFrame>
  );
}

function QualityScreen() {
  return (
    <PortalFrame sidebar={false}>
      <PortalHeader eyebrow="QUALITY CHECK" title="Checked on arrival" />
      <Panel title="Submission v2 · Bangkok Steel">
        <Line label="All required fields present" value="18 / 18" tone="ok" dot="ok" />
        <Line label="Mill test certificate" value="attached" tone="ok" dot="ok" />
        <Line label="Electricity vs Q1" value="↓ 34% · flagged" tone="warn" dot="warn" />
        <Line label="Indirect emissions unit" value="corrected" tone="info" dot="info" />
        <Line label="Direct emissions" value="impossibly high" tone="err" dot="err" />
      </Panel>
      <div className="mt-2">
        <Note tone="warn">
          Advisory only — the AI never decides a filed figure. You approve every correction.
        </Note>
      </div>
    </PortalFrame>
  );
}

function EngineScreen() {
  return (
    <PortalFrame sidebar={false}>
      <PortalHeader eyebrow="READINESS" title="Overall readiness" />
      <Panel title="Steel billet · Plant A · 2026" action="8 / 10 TABS">
        <div className="space-y-1.5">
          <Bar label="Monthly data · 12 months" value="complete" pct={100} tone="ok" />
          <Bar label="Precursor chain" value="complete" pct={100} tone="ok" />
          <Bar label="Evidence register" value="2 missing" pct={82} tone="warn" />
          <Bar label="Carbon price paid" value="not recorded" pct={0} tone="err" />
        </div>
      </Panel>
      <div className="mt-2">
        <Panel>
          <Line label="Default-value cap (20%)" value="11.4% — passed" tone="ok" dot="ok" />
          <Line label="Materiality check" value="within threshold" tone="ok" dot="ok" />
          <Line label="Scrap counted as zero" value="automatic" tone="ok" dot="ok" />
        </Panel>
      </div>
    </PortalFrame>
  );
}

function BenchmarkScreen() {
  return (
    <PortalFrame sidebar={false}>
      <PortalHeader eyebrow="CARBON & COST" title="What your numbers are worth" />
      <Panel title="Verified figure vs the EU default">
        <div className="space-y-1.5">
          <Bar label="EU default · 7207 11" value="1.31 t" pct={100} tone="err" />
          <Bar label="Your verified figure" value="0.90 t" pct={69} tone="ok" />
        </div>
        <div className="mt-2 border-t border-black/[0.06] pt-1.5">
          <Line label="Certificate cost avoided" value="€30.9 / t" tone="ok" />
          <Line label="Full-year projection" value="€412,000" />
        </div>
      </Panel>
      <div className="mt-2">
        <Note tone="ok">
          At €75.28 / tCO₂e — the Commission&apos;s published Q2 2026 price.
        </Note>
      </div>
    </PortalFrame>
  );
}

function ReportScreen() {
  return (
    <PortalFrame sidebar={false}>
      <PortalHeader eyebrow="REPORTS" title="One report per product." />
      <Panel title="Steel billet · Plant A · 2026" action="READY NOW">
        <Line label="CBAM communication package" value="24 pp" tone="ok" dot="ok" />
        <Line label="Monitoring methodology (MMD)" value="finalised" tone="ok" dot="ok" />
        <Line label="Verifier pack · workings shown" value="attached" tone="ok" dot="ok" />
        <Line label="Evidence register · 142 files" value="complete" tone="ok" dot="ok" />
        <Line label="Signed off · Somchai P." value="Energy Manager" tone="ok" dot="ok" />
      </Panel>
      <div className="mt-2">
        <Note tone="ok">Current as of 4 minutes ago. Nobody asked.</Note>
      </div>
    </PortalFrame>
  );
}

const FEATURE_SCREENS: Record<string, () => React.JSX.Element> = {
  invite: InviteScreen,
  profile: ProfileScreen,
  quality: QualityScreen,
  engine: EngineScreen,
  benchmark: BenchmarkScreen,
  report: ReportScreen,
};

export function FeatureScreen({ type }: { type: string }) {
  const Screen = FEATURE_SCREENS[type] ?? InviteScreen;
  return <Screen />;
}

/* ═══════════════════════════ THE FOUR STEPS ═════════════════ */

const WIZARD = ["Supplier", "Good", "Route & year", "Schedule"];

function StepCreate() {
  return (
    <PortalFrame active="Verification">
      <PortalHeader eyebrow="NEW WORKSPACE" title="What are we getting verified?" />
      <Stepper steps={WIZARD} at={0} />
      <div className="grid grid-cols-2 gap-1.5">
        <div className="rounded-lg border border-black/20 bg-[#f0eee8] p-2">
          <div className="text-[8px] text-black/70">We produce it ourselves</div>
          <div className="mt-1 text-[6.5px] leading-relaxed text-black/40">
            Your own installation. Each month lands in your inbox.
          </div>
        </div>
        <div className="rounded-lg border border-black/[0.07] bg-white p-2">
          <div className="text-[8px] text-black/70">Another supplier produces it</div>
          <div className="mt-1 text-[6.5px] leading-relaxed text-black/40">
            They get a link each month and fill it in without an account.
          </div>
        </div>
      </div>
      <div className="mt-2">
        <Panel>
          <Line label="Good · CN 7207 11 00" value="semi-finished steel" />
          <Line label="Production route" value="Scrap–EAF" />
          <Line label="Reporting year" value="2026" />
          <Line label="Due day each month" value="the 10th" />
        </Panel>
      </div>
    </PortalFrame>
  );
}

function StepCollect() {
  return (
    <PortalFrame active="Smart Links">
      <PortalHeader eyebrow="SUPPLIER FORM · MARCH 2026" title="One link. No account." />
      <Chips items={["Fuel", "Electricity", "Process", "Precursors", "Evidence"]} active={1} />
      <Panel title="Electricity" action="STEP 2 OF 5">
        <Line label="Consumed this month" value="1,840 MWh" />
        <Line label="Supply type" value="Grid" />
        <Line label="Emission factor source" value="National grid factor" />
        <Line label="Copied from February" value="4 fields" tone="info" dot="info" />
      </Panel>
      <div className="mt-2">
        <Note>
          Answers save as you type, in Thai or English, on a phone. Incomplete months cannot be
          submitted.
        </Note>
      </div>
    </PortalFrame>
  );
}

function StepReview() {
  return (
    <PortalFrame active="Carbon & Cost">
      <PortalHeader eyebrow="CARBON & COST" title="What your numbers are worth" />
      <div className="mb-2">
        <TileRow
          tiles={[
            { value: "0.90", label: "tCO₂e / t", sub: "verified" },
            { value: "1.31", label: "EU default", sub: "with mark-up", tone: "err" },
            { value: "31%", label: "Below default", sub: "per tonne", tone: "ok" },
          ]}
        />
      </div>
      <Panel title="Every supplier in the chain">
        <Line label="Bangkok Steel · billet" value="0.62 t · actual" tone="ok" dot="ok" />
        <Line label="Eastern Aluminium · ingot" value="1.04 t · actual" tone="ok" dot="ok" />
        <Line label="Rayong Ferro · alloy" value="2.03 t · default" tone="warn" dot="warn" />
        <Line label="Share still on default" value="11.4% of 20%" tone="ok" />
      </Panel>
    </PortalFrame>
  );
}

function StepReady() {
  return (
    <PortalFrame active="Reports">
      <PortalHeader eyebrow="REPORTS" title="One report per product." action="DOWNLOAD" />
      <Panel title="Steel billet · Plant A · 2026" action="READY NOW">
        <Line label="Communication package" value="24 pp" tone="ok" dot="ok" />
        <Line label="Verifier pack" value="workings shown" tone="ok" dot="ok" />
        <Line label="Evidence register" value="142 files" tone="ok" dot="ok" />
        <Line label="Every version kept" value="since January" tone="ok" dot="ok" />
      </Panel>
      <div className="mt-2">
        <Note tone="ok">
          Refreshed on every data change. The signature voids if a figure moves — so what you hand
          over is always the year you actually signed.
        </Note>
      </div>
    </PortalFrame>
  );
}

const STEP_SCREENS = [StepCreate, StepCollect, StepReview, StepReady];

export function StepScreen({ index }: { index: number }) {
  const Screen = STEP_SCREENS[index] ?? StepCreate;
  return <Screen />;
}
