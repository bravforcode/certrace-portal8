"use client";

/* ════════════════════════════════════════════════════════════
   TRACE — the company profile, as the exporter fills it in

   This is the input; certrace.co/trace is the output. Everything a buyer
   sees on the public profile is set here: the company (logo, tagline, about,
   facts, photos) and its factories — every own installation, each shown or
   hidden, with its industry, what it does and which verified products to
   list. One profile for the whole company, so switching the current
   installation does not change this page.

   Left, the form in kit cards; right, a live preview of the directory card
   the public page draws. Mock storage (lib/trace-profile.ts).
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Factory, ImagePlus, Plus, Trash2, X } from "lucide-react";
import {
  Card,
  Checkbox,
  Eyebrow,
  Field,
  PageHeader,
  SaveButton,
  Switch,
  cn,
  inputClass,
  useSaveState,
} from "@/components/ui";
import { IndustryIcon } from "@/components/trace/industry-icon";
import { Select, type Option } from "@/components/controls";
import { COUNTRIES } from "@/lib/config";
import { useActiveInstallation } from "@/lib/active-installation";
import { getInstallation } from "@/lib/installations";
import {
  MAX_PHOTOS,
  SAMPLE_PRODUCTS,
  TAGLINE_MAX,
  TRACE_SECTORS,
  initialsOf,
  readProfile,
  saveProfile,
  slugify,
  type TraceFactory,
  type TraceProfile,
  type TraceSector,
} from "@/lib/trace-profile";

/* Every country, with its flag (public/flags, flag-icons — MIT). The Select
   names each one in the language on screen and searches by name. */
const COUNTRY_OPTIONS: Option[] = COUNTRIES.map((c) => ({
  value: c.code,
  label: c.name,
  icon: (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/${c.code.toLowerCase()}.svg`}
      alt=""
      loading="lazy"
      className="h-[12px] w-4 flex-none rounded-[2px] object-cover ring-1 ring-black/10"
    />
  ),
}));

type Site = { id: string; name: string; city: string; country: string; sample?: boolean };

/* With no own installation yet, two sample factories show how a company
   with more than one plant reads — clearly tagged, never published. */
const SAMPLE_SITES: Site[] = [
  { id: "SAMPLE-01", name: "Chonburi plant", city: "Chonburi", country: "TH", sample: true },
  { id: "SAMPLE-02", name: "Rayong plant", city: "Rayong", country: "TH", sample: true },
];

const readFile = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });

const newFactory = (id: string): TraceFactory => ({
  installationId: id,
  shown: true,
  sector: "Iron & Steel",
  activity: "",
  products: SAMPLE_PRODUCTS["Iron & Steel"].map((p) => p.cn),
});

export default function TracePage() {
  const { options, loading } = useActiveInstallation();
  const [p, setP] = React.useState<TraceProfile | null>(null);
  const { state, run } = useSaveState();

  React.useEffect(() => setP(readProfile()), []);

  // Every own installation, whichever one is current.
  const sites = React.useMemo<Site[]>(() => {
    const own = options
      .filter((o) => o.self)
      .map((o) => {
        const rec = getInstallation(o.id);
        return {
          id: o.id,
          name: o.name,
          city: rec?.city ?? "",
          country: rec?.country ?? "",
        };
      });
    return own.length > 0 ? own : SAMPLE_SITES;
  }, [options]);

  if (!p || loading) return <PageHeader eyebrow="Trace" title="Company profile" />;

  const set = (patch: Partial<TraceProfile>) => setP({ ...p, ...patch });
  const factoryOf = (id: string) =>
    p.factories.find((f) => f.installationId === id) ?? newFactory(id);
  const setFactory = (id: string, patch: Partial<TraceFactory>) => {
    const cur = factoryOf(id);
    const rest = p.factories.filter((f) => f.installationId !== id);
    set({ factories: [...rest, { ...cur, ...patch }] });
  };
  const shownSites = sites.filter((s) => factoryOf(s.id).shown);
  const slug = p.slug || slugify(p.name);

  const save = () => run(() => saveProfile({ ...p, slug }));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Trace"
        title="Company profile"
        lead="What buyers see when they search Certrace Trace. One profile for the whole company — every installation is listed under it, whichever one is current."
        actions={
          <>
            <label className="flex items-center gap-2.5 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[13px] text-black/65">
              <Switch
                checked={p.published}
                onChange={(v) => set({ published: v })}
                ariaLabel="Show on Trace"
              />
              {p.published ? "Listed on Trace" : "Hidden"}
            </label>
            <SaveButton state={state} onClick={save} idleLabel="Save profile" />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          {/* ── Company ─────────────────────────────────── */}
          <Card className="p-6">
            <Eyebrow>Company</Eyebrow>
            <div className="mt-5 flex items-center gap-4">
              <Logo p={p} className="h-16 w-16 text-lg" />
              <div className="flex flex-wrap gap-2">
                <UploadButton
                  label={p.logo ? "Replace logo" : "Upload logo"}
                  onFiles={async (files) => set({ logo: await readFile(files[0]!) })}
                />
                {p.logo && (
                  <button
                    type="button"
                    onClick={() => set({ logo: "" })}
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] uppercase tracking-[0.1em] text-black/45 hover:text-black"
                  >
                    <Trash2 size={13} strokeWidth={1.5} /> Remove
                  </button>
                )}
              </div>
            </div>
            <p className="mt-2 text-xs text-black/35">
              Square PNG or SVG. Without one, your initials are shown.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Field label="Company name">
                <input
                  className={inputClass}
                  value={p.name}
                  onChange={(e) => set({ name: e.target.value })}
                  placeholder="e.g. Happy Steel Co., Ltd."
                />
              </Field>
              <Field label="Profile address" hint={`certrace.co/trace/${slug || "…"}`}>
                <input
                  className={inputClass}
                  value={p.slug}
                  onChange={(e) => set({ slug: slugify(e.target.value) })}
                  placeholder={slugify(p.name) || "company-name"}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field
                  label="Tagline"
                  hint={`${p.tagline.length} / ${TAGLINE_MAX} — one line on the directory card`}
                >
                  <input
                    className={inputClass}
                    value={p.tagline}
                    maxLength={TAGLINE_MAX}
                    onChange={(e) => set({ tagline: e.target.value })}
                    placeholder="What you make, and for whom"
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="About" hint="Shown on your profile page. A blank line starts a new paragraph.">
                  <textarea
                    rows={5}
                    className={cn(inputClass, "resize-y leading-relaxed")}
                    value={p.about}
                    onChange={(e) => set({ about: e.target.value })}
                    placeholder="Who you are, what your plants do, and why your data can be trusted."
                  />
                </Field>
              </div>
            </div>
          </Card>

          {/* ── Facts ───────────────────────────────────── */}
          <Card className="p-6">
            <Eyebrow>Facts</Eyebrow>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Head office — city">
                <input className={inputClass} value={p.city} onChange={(e) => set({ city: e.target.value })} />
              </Field>
              <Field label="Head office — country">
                <Select
                  value={p.country}
                  onChange={(v) => set({ country: v })}
                  options={COUNTRY_OPTIONS}
                  searchable
                  searchPlaceholder="Search countries…"
                  placeholder="Choose a country"
                  ariaLabel="Head office — country"
                />
              </Field>
              <Field label="Founded" optional>
                <input
                  className={inputClass}
                  inputMode="numeric"
                  value={p.founded}
                  onChange={(e) => set({ founded: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                  placeholder="2004"
                />
              </Field>
              <Field label="Employees" optional>
                <input className={inputClass} value={p.employees} onChange={(e) => set({ employees: e.target.value })} placeholder="320" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Export markets" optional>
                  <input
                    className={inputClass}
                    value={p.exportMarkets}
                    onChange={(e) => set({ exportMarkets: e.target.value })}
                    placeholder="EU, UK, Japan"
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Certifications value={p.certifications} onChange={(v) => set({ certifications: v })} />
              </div>
            </div>
          </Card>

          {/* ── Photos ──────────────────────────────────── */}
          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <Eyebrow>Photos</Eyebrow>
              <span className="font-mono text-[11px] text-black/35">
                {p.photos.length} / {MAX_PHOTOS}
              </span>
            </div>
            <p className="mt-2 text-sm text-black/45">
              The first photo is the cover on the directory card. Plant, line, products, lab, dispatch.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {p.photos.map((src, i) => (
                <div key={i} className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-black/[0.07] bg-[#fafaf8]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                  {i === 0 && (
                    <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 font-pixel text-[9px] uppercase tracking-[0.16em] text-black/55">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label={`Remove photo ${i + 1}`}
                    onClick={() => set({ photos: p.photos.filter((_, j) => j !== i) })}
                    className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-black/55 opacity-0 transition-opacity hover:text-black group-hover:opacity-100 focus:opacity-100"
                  >
                    <X size={13} strokeWidth={1.75} />
                  </button>
                </div>
              ))}
              {p.photos.length < MAX_PHOTOS && (
                <UploadTile
                  multiple
                  onFiles={async (files) => {
                    const room = MAX_PHOTOS - p.photos.length;
                    const urls = await Promise.all(files.slice(0, room).map(readFile));
                    set({ photos: [...p.photos, ...urls] });
                  }}
                />
              )}
            </div>
          </Card>

          {/* ── Factories ───────────────────────────────── */}
          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <Eyebrow>Factories</Eyebrow>
              <span className="font-mono text-[11px] text-black/35">
                {shownSites.length} of {sites.length} shown
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-black/45">
              Every installation of your company. Each one shows on the profile with its industry and the products verified there.
            </p>
            <div className="mt-5 space-y-3">
              {sites.map((s, i) => (
                <FactoryEditor
                  key={s.id}
                  n={i + 1}
                  site={s}
                  f={factoryOf(s.id)}
                  onChange={(patch) => setFactory(s.id, patch)}
                />
              ))}
            </div>
          </Card>
        </div>

        {/* ── Preview ─────────────────────────────────────── */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-3 flex items-center justify-between">
            <Eyebrow>Preview</Eyebrow>
            <span className="text-[11px] text-black/35">Your public page · mobile</span>
          </div>
          <PhonePreview payload={toPublic(p, shownSites, factoryOf)} />
        </div>
      </div>
    </div>
  );
}

/* ── Pieces ────────────────────────────────────────────────── */

function Logo({ p, className }: { p: TraceProfile; className?: string }) {
  return p.logo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={p.logo} alt="" className={cn("flex-none rounded-full border border-black/[0.07] bg-white object-contain", className)} />
  ) : (
    <span
      className={cn(
        "grid flex-none place-items-center rounded-full border border-black/[0.07] bg-[#f0eee8] font-[family-name:var(--font-plex)] font-light text-black/55",
        className,
      )}
    >
      {initialsOf(p.name)}
    </span>
  );
}

function UploadButton({ label, onFiles }: { label: string; onFiles: (f: File[]) => void }) {
  const ref = React.useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2 text-[11px] uppercase tracking-[0.1em] text-black/60 transition-colors hover:border-black/25 hover:bg-black/[0.04] hover:text-black"
      >
        <ImagePlus size={13} strokeWidth={1.5} /> {label}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
    </>
  );
}

function UploadTile({ onFiles, multiple }: { onFiles: (f: File[]) => void; multiple?: boolean }) {
  const ref = React.useRef<HTMLInputElement>(null);
  return (
    <button
      type="button"
      onClick={() => ref.current?.click()}
      className="flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-black/15 text-[11px] uppercase tracking-[0.1em] text-black/40 transition-colors hover:border-black/30 hover:text-black"
    >
      <Plus size={16} strokeWidth={1.5} />
      Add photo
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple={multiple}
        hidden
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
    </button>
  );
}

function Certifications({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = React.useState("");
  const add = () => {
    const v = draft.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setDraft("");
  };
  return (
    <Field label="Certifications" optional hint="Press Enter to add — e.g. ISO 9001, ISO 14001, IATF 16949.">
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2 transition-colors focus-within:border-black/25">
        {value.map((c) => (
          <span key={c} className="inline-flex items-center gap-1 rounded-full bg-black/[0.04] py-1 pl-2.5 pr-1.5 font-pixel text-[10px] uppercase tracking-[0.14em] text-black/55">
            {c}
            <button
              type="button"
              aria-label={`Remove ${c}`}
              onClick={(e) => {
                e.preventDefault();
                onChange(value.filter((x) => x !== c));
              }}
              className="grid h-4 w-4 place-items-center rounded-full text-black/40 hover:bg-black/[0.06] hover:text-black"
            >
              <X size={10} strokeWidth={2} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={add}
          placeholder={value.length ? "" : "ISO 9001"}
          className="min-w-[120px] flex-1 bg-transparent py-1 text-sm text-black/70 placeholder:text-black/25 focus:outline-none"
        />
      </div>
    </Field>
  );
}

function FactoryEditor({
  n,
  site,
  f,
  onChange,
}: {
  n: number;
  site: Site;
  f: TraceFactory;
  onChange: (patch: Partial<TraceFactory>) => void;
}) {
  const products = SAMPLE_PRODUCTS[f.sector];
  return (
    <div className={cn("rounded-xl border transition-colors", f.shown ? "border-black/[0.08]" : "border-dashed border-black/10 bg-black/[0.015]")}>
      <div className="flex items-center gap-3 px-4 py-3.5">
        <span className="font-mono text-[10.5px] text-black/30">{String(n).padStart(2, "0")}</span>
        <Factory size={16} strokeWidth={1.5} className="flex-none text-black/40" />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className={cn("truncate text-[14px]", f.shown ? "text-black/85" : "text-black/45")}>{site.name}</span>
          </span>
          <span className="block truncate font-mono text-[10.5px] text-black/35">
            {site.id}
            {site.city ? ` · ${site.city}` : ""}
            {site.country ? `, ${site.country}` : ""}
          </span>
        </span>
        <label className="flex flex-none items-center gap-2 text-[12px] text-black/50">
          <span className="hidden sm:inline">{f.shown ? "Shown" : "Hidden"}</span>
          <Switch checked={f.shown} onChange={(v) => onChange({ shown: v })} ariaLabel={`Show ${site.name} on the profile`} />
        </label>
      </div>

      {f.shown && (
        <div className="space-y-5 border-t border-black/[0.06] px-4 py-5">
          <div>
            <span className="mb-2 block text-[11px] uppercase tracking-[0.1em] text-black/55">Industry</span>
            <div role="radiogroup" aria-label="Industry" className="flex flex-wrap gap-1.5">
              {TRACE_SECTORS.map((x: TraceSector) => {
                const on = f.sector === x;
                return (
                  <button
                    key={x}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => onChange({ sector: x, products: SAMPLE_PRODUCTS[x].map((p) => p.cn) })}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-[12px] transition-colors",
                      on
                        ? "border-transparent bg-[#111] text-white"
                        : "border-black/10 text-black/55 hover:border-black/25 hover:text-black",
                    )}
                  >
                    <IndustryIcon sector={x} className="h-3.5 w-3.5" />
                    {x}
                  </button>
                );
              })}
            </div>
          </div>

          <Field label="What the site does" optional hint="A few words, e.g. Cold forging, heat treatment, plating.">
            <input className={inputClass} value={f.activity} onChange={(e) => onChange({ activity: e.target.value })} />
          </Field>

          <div>
            <span className="mb-2 block text-[11px] uppercase tracking-[0.1em] text-black/55">Verified products to list</span>
            <div className="space-y-2.5">
              {products.map((p) => (
                <Checkbox
                  key={p.cn}
                  checked={f.products.includes(p.cn)}
                  onChange={(v) =>
                    onChange({
                      products: v ? [...f.products, p.cn] : f.products.filter((c) => c !== p.cn),
                    })
                  }
                  label={
                    <span>
                      <span className="font-mono text-[12.5px] text-black/80">{p.cn}</span>{" "}
                      <span className="text-black/60">{p.name}</span>
                    </span>
                  }
                  hint={`Verification ${p.verificationId}`}
                />
              ))}
            </div>
            <p className="mt-3 text-xs text-black/35">
              Only badges are public. The figures are shared when a buyer asks and you approve.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Preview ─────────────────────────────────────────────────
   The landing site's own profile page (/trace/preview), framed at phone
   width and filled by message — so the preview IS the public page, not a
   copy of it. The landing side checks this portal's origin before it reads
   anything (its lib/trace-preview.ts). */

const LANDING_URL = (process.env.NEXT_PUBLIC_LANDING_URL ?? "http://localhost:3000").replace(/\/$/, "");
const LANDING_ORIGIN = new URL(LANDING_URL).origin;
const PHONE_W = 390;
const PHONE_H = 780;

/** The profile in the shape the landing page draws (its TraceSupplier). */
function toPublic(p: TraceProfile, sites: Site[], factoryOf: (id: string) => TraceFactory) {
  return {
    name: p.name || "Company name",
    initials: initialsOf(p.name),
    tagline: p.tagline,
    about: p.about,
    city: p.city,
    country: p.country,
    founded: p.founded,
    employees: p.employees,
    exportMarkets: p.exportMarkets,
    certifications: p.certifications,
    photos: p.photos,
    logo: p.logo,
    installations: sites.map((s) => {
      const f = factoryOf(s.id);
      return {
        id: s.id,
        name: s.name,
        city: s.city,
        country: s.country,
        sector: f.sector,
        activity: f.activity,
        products: SAMPLE_PRODUCTS[f.sector]
          .filter((x) => f.products.includes(x.cn))
          .map((x) => ({
            cn: x.cn,
            name: x.name,
            period: "2025",
            verifier: "Sample Verification GmbH",
            verifiedOn: "2026-04-28",
            validUntil: "2027-04-30",
            verificationId: x.verificationId,
            actualData: true,
            belowDefault: false,
          })),
      };
    }),
  };
}

function PhonePreview({ payload }: { payload: ReturnType<typeof toPublic> }) {
  const frame = React.useRef<HTMLIFrameElement>(null);
  const box = React.useRef<HTMLDivElement>(null);
  // Counts "ready" notes: the page sends one on every load, and each one wants the profile again.
  const [ready, setReady] = React.useState(0);
  const [scale, setScale] = React.useState(0.85);
  // Bumped by Retry: a new key reloads the frame.
  const [attempt, setAttempt] = React.useState(0);
  // No "ready" note within a few seconds means the public site is not reachable.
  const [stuck, setStuck] = React.useState(false);
  React.useEffect(() => {
    if (ready) return;
    setStuck(false);
    const id = window.setTimeout(() => setStuck(true), 8000);
    return () => window.clearTimeout(id);
  }, [ready, attempt]);

  // Fit the 390px phone into whatever width the column has.
  React.useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(Math.min(1, el.clientWidth / PHONE_W)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The page says when it is listening; only then is a message worth sending.
  React.useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== LANDING_ORIGIN || e.source !== frame.current?.contentWindow) return;
      if ((e.data as { type?: string })?.type === "certrace:trace-preview-ready") setReady((n) => n + 1);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const json = JSON.stringify(payload);
  React.useEffect(() => {
    if (!ready) return;
    const id = window.setTimeout(() => {
      frame.current?.contentWindow?.postMessage(
        { type: "certrace:trace-preview", profile: JSON.parse(json) },
        LANDING_ORIGIN,
      );
    }, 150);
    return () => window.clearTimeout(id);
  }, [ready, json]);

  return (
    <div ref={box} className="w-full">
      <div
        className="relative mx-auto overflow-hidden rounded-[28px] border border-black/[0.08] bg-[#F5F4F0]"
        style={{ width: PHONE_W * scale, height: PHONE_H * scale }}
      >
        <iframe
          key={attempt}
          ref={frame}
          title="Public profile preview"
          src={`${LANDING_URL}/trace/preview`}
          className="absolute left-0 top-0 origin-top-left border-0"
          style={{ width: PHONE_W, height: PHONE_H, transform: `scale(${scale})` }}
        />
        {!ready && (
          <div className="absolute inset-0 grid place-items-center bg-[#F5F4F0] px-6 text-center">
            {stuck ? (
              <div>
                <p className="text-[13px] text-black/55">
                  The public site isn&apos;t reachable, so the preview can&apos;t load.
                </p>
                <button
                  type="button"
                  onClick={() => setAttempt((n) => n + 1)}
                  className="mt-3 inline-flex items-center rounded-xl border border-black/10 px-4 py-2 text-[11px] uppercase tracking-[0.1em] text-black/60 transition-colors hover:border-black/25 hover:text-black"
                >
                  Retry
                </button>
              </div>
            ) : (
              <span className="text-[11px] uppercase tracking-[0.1em] text-black/30">Loading preview…</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
