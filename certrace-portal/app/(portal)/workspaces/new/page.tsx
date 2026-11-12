"use client";

/* ════════════════════════════════════════════════════════════
   NEW WORKSPACE — four steps, one page each

   It used to be a single dialog holding an installation form, the whole
   catalogue, two dropdowns and a duplicate warning. Everything was
   correct and the screen was unreadable: a first-time exporter met every
   decision at once and had no way to tell which of them mattered.

   So it is a flow now, and the split is by WHO AND WHAT rather than by field
   count:

     1 · Supplier      who produces this good — very often the exporter itself
     2 · Country & good  where it is made, and which CBAM good — any of the 570
                         CN codes in scope, each showing the EU rate for that country
     3 · Route & year  how it is produced (every route the EU recognises for
                       that CN code), and the year being reported
     4 · Schedule      when each month is asked for and when it falls due

   STEP 1 IS THE ONE THAT CHANGED SHAPE. A Thai exporter of rolled coil is very
   often the producing installation themselves, and the old flow made them
   enter their own plant as though it were a third party. The step offers the
   two answers side by side — our own site, or somebody else's — and when they
   have not registered their own site yet, lets them fill it in right here
   rather than sending them to Settings and back. The same record is what
   Settings → Organisation shows, so it is entered once.

   NEITHER ANSWER IS PRE-SELECTED, even when the exporter has a registered own
   site. It used to default to "this installation is us" ticked, which is right
   most of the time and silent when it is wrong: an exporter creating a
   workspace for a supplier's plant would carry the tick through four steps and
   file a year of somebody else's data under their own installation reference.
   A question with two real answers is asked, not assumed.

   ADDING A DIFFERENT INSTALLATION IS A POPUP, not a swap of the field. The
   picker stays where it is and the dialog closes back onto it with the new
   site selected, so the exporter never loses the place they were standing.

   The regulatory wording — route names, what each route implies, the
   catalogue — is carried through unchanged from lib/workspace.ts and
   lib/config.ts. This screen decides ORDER and EMPHASIS, not content.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Factory,
  Plus,
  Users,
  X,
} from "lucide-react";
import { setActiveInstallationId } from "@/lib/active-installation";
import { useScopedInstallation } from "@/lib/scoped-installation";
import { Button, Card, Eyebrow, Field, HelpTip, cn } from "@/components/ui";
import { Select } from "@/components/controls";
import { toast } from "@/components/toast";
import { ProductPicker, RowTag } from "@/components/workspace/product-picker";
import {
  InstallationFields,
  InstallationModal,
  canSaveInstallation,
} from "@/components/workspace/installation-form";
import { installationHref } from "@/components/workspace/installation-menu";
import { AnnexLegend } from "@/components/precursor/annex-fields";
import { SupplierModal } from "@/components/workspace/supplier-form";
import {
  COUNTRIES,
  countryNameShown as countryName,
  getCatalogProduct,
  isEuOrExempt,
  productType,
} from "@/lib/config";
import { CnRatePanel } from "@/components/workspace/cn-rate-panel";
import { lookupDefault } from "@/lib/cbam/eu-rates";
import { routeOptionsFor } from "@/lib/cbam/routes";
import { useDefaultsReady } from "@/lib/cbam/use-rates";
import {
  emptyInstallation,
  getInstallation,
  installationsForSupplier,
  isInstallationComplete,
  type Installation,
} from "@/lib/installations";
import {
  useInstallationsForSupplier,
  useInvalidateInstallations,
  useOwnInstallations,
  useSaveInstallation,
} from "@/lib/installations-query";
import { getSupplierCompany } from "@/lib/supplier-companies";
import {
  useInvalidateSupplierCompanies,
  useSavePrecursorSupplier,
  useSupplierCompanies,
} from "@/lib/suppliers-query";
import { uid as workspaceId } from "@/lib/workspace";
import {
  useCaps,
  useCreateWorkspace,
  useDeleteWorkspaceDraft,
  useSaveWorkspaceDraft,
  useWorkspaces,
} from "@/lib/workspaces-query";
import { PlanCapNotice } from "@/components/plan-cap-notice";
import { getSupplier } from "@/lib/precursor-suppliers";
import { useT } from "@/lib/i18n";
import { useProfile } from "@/lib/profile";
import type { ProductCategory } from "@/lib/config";
import {
  draftId,
  getWorkspaceDraft,
  isWorthSaving,
  type WorkspaceWizardSnapshot,
} from "@/lib/workspace-drafts";

const THIS_YEAR = new Date().getFullYear();
const YEARS = [
  THIS_YEAR - 2,
  THIS_YEAR - 1,
  THIS_YEAR,
  THIS_YEAR + 1,
  THIS_YEAR + 2,
];

const STEPS = [
  { key: "supplier", label: "Supplier" },
  { key: "good", label: "Country & good" },
  { key: "route", label: "Route & year" },
  { key: "schedule", label: "Schedule" },
] as const;

/* ── Section heading ──────────────────────────────────────────
   The help tip sits BESIDE the heading, never in the card's top-right corner.
   A "?" floated to the far edge of a card reads as help for the card, and the
   thing it actually explains is the sentence at the other end of the row. */
function Heading({
  children,
  help,
  helpTitle,
}: {
  children: React.ReactNode;
  help?: React.ReactNode;
  helpTitle?: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <h2 className="font-[family-name:var(--font-plex)] text-xl font-light tracking-tight text-[#111]">
        {children}
      </h2>
      {help && <HelpTip title={helpTitle}>{help}</HelpTip>}
    </div>
  );
}

function Stepper({ step, goto }: { step: number; goto: (i: number) => void }) {
  const t = useT();
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.12em] text-black/40">
          {t("Step {n} of {total}", { n: step + 1, total: STEPS.length })}
        </span>
        <span className="font-pixel text-[11px] uppercase tracking-[0.16em] text-black/65 sm:hidden">
          {t(STEPS[step].label)}
        </span>
      </div>
      <div className="flex gap-1.5">
        {STEPS.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => i <= step && goto(i)}
            disabled={i > step}
            className="min-w-0 flex-1 text-left"
          >
            <span
              className={cn(
                "block h-1 overflow-hidden rounded-full transition-colors",
                i <= step ? "bg-[#111]" : "bg-black/[0.1]",
              )}
            />
            <span
              className={cn(
                "mt-2 hidden truncate text-[10px] uppercase tracking-[0.08em] sm:block",
                i === step ? "text-black/70" : "text-black/30",
              )}
            >
              {t(s.label)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* useSearchParams() opts the tree into client-side rendering, and Next refuses
   to prerender a page that reads it without a Suspense boundary above it —
   `?draft=` is read here, so the boundary lives at the route root. */
export default function NewWorkspacePage() {
  return (
    <React.Suspense fallback={null}>
      <NewWorkspaceFlow />
    </React.Suspense>
  );
}

/** The organisation's sector (Settings → Organisation) and the part of the catalogue it lives in. */
const SECTOR_CATEGORY: Record<string, ProductCategory | undefined> = {
  steel: "Iron & Steel",
  aluminium: "Aluminium",
  cement: "Cement",
  fertiliser: "Fertilisers",
  hydrogen: "Hydrogen",
};

function NewWorkspaceFlow() {
  const t = useT();
  const { profile } = useProfile();
  const router = useRouter();
  const params = useSearchParams();
  const resumeId = params.get("draft");
  /* Arrived from a precursor's Tree node ("Create workspace for this
     precursor") rather than the normal entry points — carried through to
     create() so the finished workspace can be stamped back onto the row
     that sent us here. Read once: this page's URL never changes under us. */
  const [fromPrecursor] = React.useState(() => {
    const precursorId = params.get("precursorId");
    const parentWorkspaceId = params.get("parentWorkspaceId");
    if (!precursorId || !parentWorkspaceId) return null;
    return {
      precursorId,
      parentWorkspaceId,
      supplier: getSupplier(parentWorkspaceId, precursorId),
    };
  });

  /* Arrived from an installation's own page ("New product report" on its Products tab or its menu): the site is already answered, so the
     first step is too. Read once, like the precursor above. Closing the flow puts the reader back on that installation. */
  const [fromInstallationId] = React.useState(() => params.get("installation"));

  const [step, setStep] = React.useState(0);
  const [id] = React.useState(() => resumeId ?? draftId());

  /* "" until the exporter answers. See the header: pre-ticking "us" is how a
     supplier's year lands under the exporter's own installation reference. */
  const [supplierChoice, setSupplierChoice] = React.useState<
    "" | "self" | "other"
  >("");
  const [installationId, setInstallationId] = React.useState("");
  const [installationName, setInstallationName] = React.useState("");

  /* ONE INSTALLATION, OR A NEW ONE. Step 1 offers the current installation
     (lib/active-installation.ts) or filling in a new installation's details —
     nothing else. "" is the older flows (a resumed draft, a precursor, an
     installation's own page), which keep the full picker below. */
  const { scoped: current } = useScopedInstallation();
  const [pick, setPick] = React.useState<"" | "current" | "new">("");
  const fillNew = pick === "new";

  /* THE EXPORTER'S OWN SITES, PLURAL. A company with a billet plant and a
     rolling mill has two, and the flow that assumed one made the second be
     entered as a third party — so its months went "out" to a supplier who was
     the exporter themselves. */
  const ownData = useOwnInstallations().data;
  const own = React.useMemo(() => ownData ?? [], [ownData]);
  const [ownDraft, setOwnDraft] = React.useState<Installation>(() =>
    emptyInstallation(true),
  );
  const [addingOwn, setAddingOwn] = React.useState(false);

  /* ── The supplier axis ──────────────────────────────────────
     A third-party installation belongs to a company, and the company is asked
     for FIRST. Picking a plant without knowing whose it is was how two plants
     of one mill ended up as two unrelated sites with no screen able to answer
     "everything outstanding at G J Steel". */
  const [supplierId, setSupplierId] = React.useState("");
  const suppliers = useSupplierCompanies().data ?? [];
  const [addingSupplier, setAddingSupplier] = React.useState(false);
  const [adding, setAdding] = React.useState(false);

  const [productId, setProductId] = React.useState("");
  /* The country the goods are made in — the country the EU's default values are
     read for. It starts as the chosen installation's own country, and stops
     following it the moment the exporter touches it. */
  const [country, setCountry] = React.useState("TH");
  const [countryTouched, setCountryTouched] = React.useState(false);
  const [route, setRoute] = React.useState("");
  const [year, setYear] = React.useState(THIS_YEAR);

  const [dueDay, setDueDay] = React.useState(15);
  const [creating, setCreating] = React.useState(false);

  const [creationId] = React.useState(workspaceId);
  const createWs = useCreateWorkspace(creationId);
  const saveDraft = useSaveWorkspaceDraft();
  const deleteDraft = useDeleteWorkspaceDraft();
  const saveOwnSite = useSaveInstallation();
  const savePrecursor = useSavePrecursorSupplier();
  const invalidateInstallations = useInvalidateInstallations();
  const invalidateSupplierCompanies = useInvalidateSupplierCompanies();

  /* ── What the plan still has room for ─────────────────────
     A workspace spends a CN CODE and a REPORTING YEAR — but only when it
     brings a NEW one. A second plant making the same good in the same year
     costs nothing: the code is already bought, the year is already open. So
     the check is set membership against the live estate, not a workspace
     count, and re-using either is never blocked.

     Measured after mount, because the estate lives in localStorage. */
  const liveWorkspaces = useWorkspaces().data;
  const caps = useCaps().data;
  const estate = React.useMemo(
    () =>
      liveWorkspaces && caps
        ? {
            codes: new Set(
              liveWorkspaces.map((w) => w.cnCode.trim()).filter(Boolean),
            ),
            years: new Set(liveWorkspaces.map((w) => w.year)),
            codeCap: caps.cnCodes,
            yearCap: caps.years,
          }
        : null,
    [liveWorkspaces, caps],
  );

  const isSelf = supplierChoice === "self";

  /* The own-site edit buffer is seeded from the query once it lands. */
  const ownFirst = ownData?.[0];
  React.useEffect(() => {
    if (ownFirst) setOwnDraft(ownFirst);
  }, [ownFirst]);

  /* Seed the wizard from a resumed draft — or the precursor that sent us. */
  React.useEffect(() => {
    const draft = resumeId ? getWorkspaceDraft(resumeId) : null;
    if (draft) {
      const s = draft.snapshot;
      // Drafts written before the choice became explicit carry only `isSelf`.
      setSupplierChoice(s.supplierChoice ?? (s.isSelf ? "self" : "other"));
      setInstallationId(s.installationId);
      setInstallationName(s.installationName);
      setSupplierId(s.supplierId ?? "");
      setProductId(s.productId);
      setRoute(s.route);
      if (s.country) {
        setCountry(s.country);
        setCountryTouched(true);
      }
      setYear(s.year);
      // Drafts saved under the old two-field schedule carry requestDay +
      // dueAfterDays; their real deadline was the sum. See scheduleFor().
      setDueDay(
        s.dueDay ?? Math.min(28, (s.requestDay ?? 5) + (s.dueAfterDays ?? 7)),
      );
      setStep(Math.min(s.step, STEPS.length - 1));
    } else if (fromInstallationId && getInstallation(fromInstallationId)) {
      const site = getInstallation(fromInstallationId)!;
      if (site.self) setSupplierChoice("self");
      else {
        setSupplierChoice("other");
        setSupplierId(site.supplierId);
      }
      setInstallationId(site.id);
      setInstallationName(site.name);
      setStep(1);
    } else if (fromPrecursor) {
      // No draft to resume — prefill what the precursor row already knows.
      // The row's own installation/company were never entered as a real
      // SupplierCompany/Installation record (it has no contact email, which
      // those require), so step 1 still has to be filled in by hand; this
      // only spares the good and the route where they're already on file.
      const productId = params.get("productId");
      const route = params.get("route");
      setSupplierChoice("other");
      if (productId) setProductId(productId);
      if (route) setRoute(route);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId]);

  const supplier = supplierId
    ? (suppliers.find((s) => s.id === supplierId) ??
      getSupplierCompany(supplierId))
    : null;

  /* The plants belonging to the chosen supplier. A query rather than a filter
     off the known-installations list, because a plant added in the popup a
     second ago must be in the picker the moment the save invalidates. */
  const supplierPlants = useInstallationsForSupplier(supplierId).data ?? [];

  /* Changing supplier drops the plant chosen under the previous one — carrying
     it through would file a year of one mill's data against another. */
  React.useEffect(() => {
    if (supplierChoice !== "other") return;
    setInstallationId((prev) =>
      prev && !installationsForSupplier(supplierId).some((i) => i.id === prev)
        ? ""
        : prev,
    );
    setInstallationName((prev) => (installationId ? prev : ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierId, supplierChoice]);

  const product = productId ? getCatalogProduct(productId) : undefined;

  /* The chosen installation's country, so the Country field starts on the right
     answer — a Thai plant's goods are Thai unless the exporter says otherwise. */
  const chosenInstallation = React.useMemo(
    () =>
      own.find((o) => o.id === installationId) ??
      supplierPlants.find((o) => o.id === installationId) ??
      null,
    [own, supplierPlants, installationId],
  );
  const installationCountry =
    chosenInstallation?.country ||
    (isSelf && own.length === 0 ? ownDraft.country : "");
  React.useEffect(() => {
    if (!countryTouched && installationCountry)
      setCountry(installationCountry.toUpperCase());
  }, [installationCountry, countryTouched]);

  /* Every route the EU names for this CN code, in the reporting year — and the
     one it built this country's default value on, so the exporter can see which
     answer is the EU's own assumption. */
  const defaultsReady = useDefaultsReady(country);
  const euRoute = React.useMemo(
    () =>
      product && defaultsReady
        ? (lookupDefault(product.cnCode, country)?.rates.route ?? "")
        : "",
    [product, country, defaultsReady],
  );
  const routes = React.useMemo(
    () => (product ? routeOptionsFor(product, { year, euRoute }) : []),
    [product, year, euRoute],
  );

  /* Null until measured — an unmeasured estate never blocks, so a slow load
     cannot stop a workspace the account is entitled to. */
  const codeBlocked = Boolean(
    estate &&
      product &&
      !estate.codes.has(product.cnCode) &&
      estate.codeCap.atCap,
  );
  const yearBlocked = Boolean(
    estate && !estate.years.has(year) && estate.yearCap.atCap,
  );
  const planBlocked = codeBlocked || yearBlocked;

  // Routes are filtered to the product's category, so a stale choice from a
  // previously selected product is dropped rather than silently carried over
  // into a sector where it means nothing.
  React.useEffect(() => {
    if (route && !routes.some((r) => r.id === route)) setRoute("");
    // One answer is not a question: an EU good with a single route has it chosen.
    else if (!route && routes.length === 1) setRoute(routes[0].id);
  }, [route, routes]);

  /* When "this installation is us" is chosen and the exporter has exactly ONE
     registered own site, the picker is not a question — that site is the
     answer. With two or more it IS a question, and pre-selecting one would be
     the same silent mis-scoping the supplier choice above exists to avoid. */
  React.useEffect(() => {
    if (!isSelf || own.length !== 1 || fillNew) return;
    setInstallationId(own[0].id);
    setInstallationName(own[0].name);
  }, [isSelf, own, fillNew]);

  /* Switching to "somebody else" must drop the own-site that was filled in
     behind the other answer, or the summary on the last step still names it. */
  React.useEffect(() => {
    if (supplierChoice !== "other") return;
    setInstallationId((prev) => (own.some((o) => o.id === prev) ? "" : prev));
    setInstallationName((prev) =>
      own.some((o) => o.name === prev) ? "" : prev,
    );
  }, [supplierChoice, own]);

  /* Nothing registered yet — the inline form below is the way in, rather than
     sending a first-time exporter to Settings and back. */
  const ownNeedsFilling = isSelf && (own.length === 0 || fillNew);

  const chooseCurrent = () => {
    if (!current) return;
    setPick("current");
    if (current.self) {
      setSupplierChoice("self");
      setSupplierId("");
    } else {
      setSupplierChoice("other");
      setSupplierId(current.supplierId ?? "");
    }
    setInstallationId(current.id);
    setInstallationName(current.name);
  };
  const chooseNew = () => {
    setPick("new");
    setSupplierChoice("self");
    setSupplierId("");
    setInstallationId("");
    setInstallationName("");
    setOwnDraft(emptyInstallation(true));
  };

  const snapshot = (): WorkspaceWizardSnapshot => ({
    installationId,
    installationName,
    isSelf,
    supplierChoice,
    supplierId,
    productId,
    route,
    country,
    year,
    dueDay,
    step,
  });

  const canContinue =
    step === 0
      ? supplierChoice === "self"
        ? ownNeedsFilling
          ? canSaveInstallation(ownDraft, saveOwnSite.variables?.id)
          : Boolean(installationId.trim())
        : supplierChoice === "other"
          ? // BOTH are required: a plant with no supplier above it is the gap
            // this step exists to close.
            Boolean(
              supplierId && installationId.trim() && installationName.trim(),
            )
          : false
      : step === 1
        ? Boolean(productId) &&
          Boolean(country) &&
          !isEuOrExempt(country) &&
          !codeBlocked
        : step === 2
          ? Boolean(route) && !yearBlocked
          : true;

  const commitOwnIfNeeded = async () => {
    if (!isSelf || !ownNeedsFilling) return;
    if (!canSaveInstallation(ownDraft, saveOwnSite.variables?.id)) return;
    const saved = await saveOwnSite.mutateAsync({ ...ownDraft, self: true });
    setInstallationId(saved.id);
    setInstallationName(saved.name);
    // A site filled in here becomes the current installation, so the report lands where Verification is looking.
    setActiveInstallationId(saved.id);
  };

  const waiting = creating || saveOwnSite.isPending || saveDraft.isPending;
  const next = async () => {
    if (!canContinue || waiting) return;
    try {
      if (step === 0) await commitOwnIfNeeded();
      setStep((s) => Math.min(STEPS.length - 1, s + 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      /* The existing mutation error notice keeps this step available. */
    }
  };

  const back = () => {
    setStep((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* WHERE CLOSING GOES BACK TO IS WHERE IT WAS OPENED FROM.

     Track report on a precursor opens this flow on top of a supply chain the
     reader was in the middle of reading, so closing it has to put them back
     on that chain — with the row they pressed it on scrolled into view (the
     ?node= the chain page already understands). Sending them to the estate
     list instead lost their place and made "I only wanted to look" cost four
     clicks to undo. Every other way in still lands on the estate, which is
     where those came from. */
  const exitTarget = fromPrecursor
    ? `/workspaces/${fromPrecursor.parentWorkspaceId}/precursors`
    : fromInstallationId && getInstallation(fromInstallationId)
      ? installationHref(fromInstallationId, "products")
      : "/workspaces";

  /* Closing saves rather than discards. Four steps is long enough that
     somebody will be interrupted, and the dashboard surfaces the draft. */
  const close = async () => {
    if (waiting) return;
    const s = snapshot();
    if (isWorthSaving(s)) {
      try {
        await saveDraft.mutateAsync({
          id,
          updatedAt: Date.now(),
          snapshot: s,
          display: {
            installationName: installationName || "Unnamed installation",
            productName: product?.name ?? "No good chosen yet",
            year,
            step: step + 1,
            stepCount: STEPS.length,
          },
        });
      } catch {
        return;
      }
      toast({
        message: "Saved as a draft",
        detail:
          "It is waiting at the top of your verification product reports.",
        tone: "info",
      });
    }
    router.push(exitTarget);
  };

  /* Creating shows its progress IN THE BUTTON, not in a toast.

     A popup that announces "Product report created" while the router is already
     navigating to that workspace tells the reader something they are about to
     see for themselves, and it lands over the top of the screen they asked
     for. The button spins, then the workspace opens — the arrival is the
     confirmation. */
  const create = () => {
    if (
      !installationId.trim() ||
      !productId ||
      !route ||
      waiting ||
      planBlocked
    )
      return;
    setCreating(true);
    window.setTimeout(async () => {
      try {
        const ws = await createWs.mutateAsync({
          installationId: installationId.trim(),
          installationName: installationName.trim(),
          productId,
          productionRoute: route,
          country,
          year,
          selfSupplied: isSelf,
          // Denormalised at creation, like productName and cnCode: a supplier can
          // be renamed, and a workspace already handed to a verifier must keep
          // saying what it said.
          supplierId: isSelf ? undefined : supplierId || undefined,
          supplierName: isSelf ? undefined : supplier?.name,
          schedule: { dueDay },
        });
        // Stamp the link back onto the precursor row that sent us here, so its
        // Tree card offers "Open workspace" from now on rather than a second
        // "Create workspace" for the same entity.
        if (fromPrecursor?.supplier) {
          await savePrecursor.mutateAsync({
            ...fromPrecursor.supplier,
            linkedWorkspaceId: ws.id,
          });
        }
        await deleteDraft.mutateAsync(id);
        /* WHERE THE FINISHED REPORT OPENS DEPENDS ON WHAT WAS JUST CREATED.

               A new product report at an installation opens on THAT INSTALLATION'S
               Overview: the reports open with the site's one-time information (the 17
               answers), and until it is there the new report reads Blocked — so the
               reader's next move is the Overview, not the empty report. The report is one
               click away in the arrival link below the tabs.

               From "Track report" on a precursor it creates that precursor's own report,
               and the report is the four tabs — the same page `TrackReportAction` (components/chain-actions.tsx)
               resolves to from then on, so the first visit and every later one are the same
               page. That one still opens the report. */
        router.push(
          fromPrecursor
            ? `/workspaces/${ws.id}`
            : `${installationHref(ws.installationId)}?createdProduct=${encodeURIComponent(ws.id)}`,
        );
      } catch {
        /* Existing save errors retain the wizard for retry. */
      } finally {
        setCreating(false);
      }
    }, 550);
  };

  const isLast = step === STEPS.length - 1;

  return (
    <div className="mx-auto max-w-3xl space-y-7 pb-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Eyebrow>{t("New product report")}</Eyebrow>
          <h1 className="mt-2 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">
            {t("What are we getting verified?")}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-black/45">
            {t(
              "One installation, one CN code, one reporting year. Everything a verifier asks about is scoped that way.",
            )}
          </p>
          {fromPrecursor && (
            <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-black/45">
              {t("Creating this on behalf of")}{" "}
              <strong className="text-black/70">
                {fromPrecursor.supplier?.name || "this precursor"}
              </strong>{" "}
              {t(
                "— once its data is in and Readiness is complete, its Monitoring Methodology Documentation can be downloaded from here and handed to an external verifier.",
              )}
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={waiting}
          onClick={close}
          aria-label={
            fromPrecursor
              ? "Close and save draft — back to the supply chain"
              : "Close and save draft"
          }
          className="mt-1 flex-none text-black/35 hover:text-black"
        >
          <X size={20} strokeWidth={1.5} />
        </button>
      </div>

      <Stepper
        step={step}
        goto={(i) => {
          if (!waiting) setStep(i);
        }}
      />

      <div key={STEPS[step].key} className="ct-enter min-h-[380px]">
        {/* ── 1 · Supplier ───────────────────────────────────── */}
        {step === 0 && (
          <Card className="p-5 sm:p-6">
            <Heading
              helpTitle={t("Who produces this good")}
              help={
                <>
                  <p>
                    {t(
                      "A product report covers one producing installation. Often that is your own plant — an exporter who rolls their own coil is the supplier too.",
                    )}
                  </p>
                  <p className="mt-2">
                    {t(
                      "Pick your own site and the monthly data lands in your inbox. Pick another supplier and they get a link each month.",
                    )}
                  </p>
                </>
              }
            >
              {t("Who produces this good")}
            </Heading>

            {pick !== "" || supplierChoice === "" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {current && (
                  <ChoiceCard
                    active={pick === "current"}
                    onClick={chooseCurrent}
                    icon={<Factory size={16} strokeWidth={1.5} />}
                    title={current.name}
                    body={t(
                      "Your current installation ({id}). Switch installation from your profile menu to file at another site.",
                      { id: current.id },
                    )}
                  />
                )}
                <ChoiceCard
                  active={pick === "new"}
                  onClick={chooseNew}
                  icon={<Plus size={16} strokeWidth={1.5} />}
                  title={t("Fill in installation details")}
                  body={t(
                    "A site that is not registered yet. Enter its details here — it is saved and becomes your current installation.",
                  )}
                />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <ChoiceCard
                  active={supplierChoice === "self"}
                  onClick={() => setSupplierChoice("self")}
                  icon={<Factory size={16} strokeWidth={1.5} />}
                  title={t("We produce it ourselves")}
                  body={t(
                    "Your own installation. Each month lands in your inbox — nothing goes to a third party.",
                  )}
                />
                <ChoiceCard
                  active={supplierChoice === "other"}
                  onClick={() => setSupplierChoice("other")}
                  icon={<Users size={16} strokeWidth={1.5} />}
                  title={t("Another supplier produces it")}
                  body={t(
                    "Their installation. They get a link each month and fill it in without an account.",
                  )}
                />
              </div>
            )}

            {supplierChoice === "" ? (
              <p className="mt-5 text-[12.5px] leading-relaxed text-black/40">
                {t(
                  "Choose one to carry on. Everything after this is scoped to the site you pick.",
                )}
              </p>
            ) : pick === "current" && current ? (
              <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-black/[0.08] bg-white p-4">
                <Building2
                  size={14}
                  strokeWidth={1.5}
                  className="flex-none text-black/40"
                />
                <span className="min-w-0 flex-1 truncate text-[14px] text-black/85">
                  {current.name}
                </span>
                <RowTag>{current.id}</RowTag>
                <span className="inline-flex flex-none items-center gap-1.5 rounded-full border border-[rgba(5,150,105,0.18)] bg-[#ecfdf5] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-[#047857]">
                  <Check size={11} strokeWidth={2} /> {t("Current")}
                </span>
              </div>
            ) : isSelf ? (
              /* ── Our own site ───────────────────────────────
                 One registered site: shown as the answer. Several: a picker,
                 because a company with two plants making the same good would
                 otherwise silently file one under the other. */
              <div className="mt-5">
                {ownNeedsFilling ? (
                  <>
                    <p className="mb-4 text-[12.5px] leading-relaxed text-black/50">
                      {fillNew
                        ? t(
                            "Enter the installation's details. It is saved to your organisation, so you only enter it once.",
                          )
                        : t(
                            "You have not registered your own installation yet. Fill it in here — it is saved to your organisation and appears in Settings, so you only enter it once.",
                          )}
                    </p>
                    <AnnexLegend className="mb-5" showNeed showNoItem noVr />
                    <InstallationFields
                      value={ownDraft}
                      onChange={setOwnDraft}
                      existingId={saveOwnSite.variables?.id}
                      disabled={waiting}
                      annexTags
                    />
                  </>
                ) : (
                  <>
                    {own.length > 1 && (
                      <Field
                        label={t("Which of your sites")}
                        hint={t(
                          "You operate more than one. Everything after this is scoped to the one you pick.",
                        )}
                      >
                        <Select
                          value={installationId}
                          onChange={(v) => {
                            setInstallationId(v);
                            setInstallationName(
                              own.find((o) => o.id === v)?.name ?? "",
                            );
                          }}
                          options={own.map((o) => ({
                            value: o.id,
                            label: o.name,
                            hint: o.id,
                          }))}
                          placeholder={t("Choose one of your sites")}
                          ariaLabel={t("Your installation")}
                          searchable={own.length > 8}
                        />
                      </Field>
                    )}

                    {(() => {
                      const chosen =
                        own.find((o) => o.id === installationId) ??
                        (own.length === 1 ? own[0] : null);
                      if (!chosen) return null;
                      const gaps = !isInstallationComplete(chosen);
                      return (
                        <div
                          className={cn(
                            "rounded-xl border border-black/[0.08] bg-white p-4",
                            own.length > 1 && "mt-4",
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <Building2
                                  size={14}
                                  strokeWidth={1.5}
                                  className="flex-none text-black/40"
                                />
                                <span className="truncate text-[14px] text-black/85">
                                  {chosen.name}
                                </span>
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                <RowTag>{chosen.id}</RowTag>
                                <RowTag>{chosen.country}</RowTag>
                                {chosen.unlocode && (
                                  <RowTag>{chosen.unlocode}</RowTag>
                                )}
                              </div>
                              <p className="mt-2 text-[12px] leading-relaxed text-black/45">
                                {[chosen.street, chosen.city, chosen.postcode]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                              {gaps && (
                                <p className="mt-2 text-[11.5px] text-[#b45309]">
                                  {t(
                                    "Some details a verifier asks for are still missing. You can carry on and finish them in Settings.",
                                  )}
                                </p>
                              )}
                            </div>
                            <span className="inline-flex flex-none items-center gap-1.5 rounded-full border border-[rgba(5,150,105,0.18)] bg-[#ecfdf5] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-[#047857]">
                              <Check size={11} strokeWidth={2} />{" "}
                              {t("Your site")}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    <button
                      type="button"
                      onClick={() => setAddingOwn(true)}
                      className="mt-3 inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.1em] text-black/45 underline decoration-black/20 underline-offset-2 hover:text-black"
                    >
                      <Plus size={13} strokeWidth={1.5} />{" "}
                      {t("Add another site of ours")}
                    </button>
                  </>
                )}
              </div>
            ) : (
              /* ── Somebody else's site ───────────────────────
                 SUPPLIER FIRST, THEN THEIR PLANT. The plant picker only
                 appears once a company is chosen, and it only ever lists that
                 company's plants — which is what stops one mill's year being
                 filed against another's installation reference. */
              <div className="mt-5 space-y-5">
                <div>
                  <Field
                    label={t("Supplier")}
                    hint={t(
                      "The company you buy from. Their plants are underneath.",
                    )}
                  >
                    <Select
                      value={supplierId}
                      onChange={setSupplierId}
                      options={suppliers.map((s) => ({
                        value: s.id,
                        label: s.name,
                        hint: s.country,
                      }))}
                      placeholder={
                        suppliers.length
                          ? "Choose a supplier"
                          : "No suppliers yet"
                      }
                      ariaLabel={t("Supplier")}
                      searchable={suppliers.length > 8}
                    />
                  </Field>
                  <button
                    type="button"
                    onClick={() => setAddingSupplier(true)}
                    className="mt-3 inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.1em] text-black/45 underline decoration-black/20 underline-offset-2 hover:text-black"
                  >
                    <Plus size={13} strokeWidth={1.5} />{" "}
                    {t("Create a new supplier")}
                  </button>
                </div>

                {supplier && (
                  <div className="border-t border-black/[0.06] pt-5">
                    <Field
                      label={t("Their installation")}
                      hint={`Which of ${supplier.name}'s plants makes this good.`}
                    >
                      <Select
                        value={installationId}
                        onChange={(v) => {
                          setInstallationId(v);
                          setInstallationName(
                            supplierPlants.find((o) => o.id === v)?.name ?? "",
                          );
                        }}
                        options={supplierPlants.map((o) => ({
                          value: o.id,
                          label: o.name,
                          hint: o.id,
                        }))}
                        placeholder={
                          supplierPlants.length
                            ? "Choose an installation"
                            : "No installations for this supplier yet"
                        }
                        ariaLabel={t("Supplier installation")}
                        searchable={supplierPlants.length > 8}
                      />
                    </Field>

                    <button
                      type="button"
                      onClick={() => setAdding(true)}
                      className="mt-3 inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.1em] text-black/45 underline decoration-black/20 underline-offset-2 hover:text-black"
                    >
                      <Plus size={13} strokeWidth={1.5} /> Add an installation
                      for {supplier.name}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Adding a supplier closes back onto the picker with the new
                company selected, so the exporter never loses their place. */}
            <SupplierModal
              open={addingSupplier}
              onClose={() => setAddingSupplier(false)}
              onSaved={(saved) => {
                invalidateSupplierCompanies();
                setSupplierId(saved.id);
                setInstallationId("");
                setInstallationName("");
              }}
            />

            {/* A plant added here is owned by the chosen supplier — the dialog
                is never asked which one, because the step already knows. */}
            <InstallationModal
              open={adding}
              onClose={() => setAdding(false)}
              allowSelfToggle={false}
              supplierId={supplierId}
              title={
                supplier
                  ? `Add an installation for ${supplier.name}`
                  : "Add an installation"
              }
              onSaved={(saved) => {
                invalidateInstallations();
                setInstallationId(saved.id);
                setInstallationName(saved.name);
              }}
            />

            <InstallationModal
              open={addingOwn}
              onClose={() => setAddingOwn(false)}
              allowSelfToggle={false}
              self
              title={t("Add another site of ours")}
              lead={t(
                "A second plant you operate yourself. Its months land in your own inbox, exactly like the first.",
              )}
              onSaved={(saved) => {
                invalidateInstallations();
                setInstallationId(saved.id);
                setInstallationName(saved.name);
              }}
            />
          </Card>
        )}

        {/* ── 2 · Country & good ─────────────────────────────── */}
        {step === 1 && (
          <Card className="p-5 sm:p-6">
            <Heading
              helpTitle={t("Choosing the good")}
              help={
                <>
                  <p>
                    {t(
                      "The country decides which EU default values apply — the EU sets a different number for the same CN code in Thailand, Vietnam or India.",
                    )}
                  </p>
                  <p className="mt-2">
                    {t(
                      "Search by the CN code on your customs declaration — typing the first digits narrows the list. The rate on each row is the EU default value for your country in the reporting year.",
                    )}
                  </p>
                  <p className="mt-2">
                    {t(
                      "The type tag on each row is what decides the shape of the rest of the product report: a precursor has nothing above it, a finished product carries precursors.",
                    )}
                  </p>
                </>
              }
            >
              {t("Which country and which good")}
            </Heading>

            <div className="mb-5 max-w-sm">
              <Field
                label={t("Country of production")}
                hint={
                  isEuOrExempt(country)
                    ? t(
                        "Goods made in the EU, Iceland, Liechtenstein, Norway or Switzerland are outside CBAM — no default value applies.",
                      )
                    : t(
                        "Where the goods are made. The EU default values on the list below are read for this country.",
                      )
                }
              >
                <Select
                  value={country}
                  onChange={(v) => {
                    setCountry(v);
                    setCountryTouched(true);
                  }}
                  options={COUNTRIES.filter((c) => !isEuOrExempt(c.code)).map(
                    (c) => ({ value: c.code, label: c.name, hint: c.code }),
                  )}
                  placeholder={t("Choose a country")}
                  ariaLabel={t("Country of production")}
                  searchable
                  searchPlaceholder={t("Country name…")}
                />
              </Field>
            </div>

            <ProductPicker
              value={productId}
              onChange={setProductId}
              country={country}
              year={year}
              defaultCategory={SECTOR_CATEGORY[profile.sector]}
            />

            {product && (
              <CnRatePanel
                className="mt-5"
                product={product}
                country={country}
                year={year}
              />
            )}

            {/* Named after the pick, not before it: every code already in the
                estate is still free to choose, so warning up front would be
                wrong on most of the list. */}
            {codeBlocked && estate && (
              <>
                <p className="mt-5 text-[13px] leading-relaxed text-black/55">
                  {t("CN {code} would be a new code on your plan.", {
                    code: product?.cnCode ?? "",
                  })}{" "}
                  {t(
                    "Codes you already report — and any number of sites or years reporting them — cost nothing more.",
                  )}
                </p>
                <PlanCapNotice cap={estate.codeCap} className="mt-3" />
              </>
            )}
          </Card>
        )}

        {/* ── 3 · Route & year ───────────────────────────────── */}
        {step === 2 && (
          <Card className="p-5 sm:p-6">
            <Heading
              helpTitle={t("Production route")}
              help={
                <>
                  <p>
                    {t(
                      "The route decides which precursors are even possible above this good, and it is the first thing a verifier checks the MMD’s boundary description against.",
                    )}
                  </p>
                  <p className="mt-2">
                    {t(
                      "It is declared once per product report: a route that changes mid-year is a re-baseline, and that is a second product report.",
                    )}
                  </p>
                </>
              }
            >
              {t("How it is produced")}
            </Heading>

            {product && (
              <div className="mb-5 flex flex-wrap items-center gap-1.5">
                <RowTag>CN {product.cnCode}</RowTag>
                <RowTag>{t(productType(product))}</RowTag>
                <span className="text-[12px] text-black/45">
                  {t(product.name)}
                </span>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={t("Production route")}
                hint={
                  routes.length === 1
                    ? t(
                        "The EU recognises one route for this good, so it is chosen for you.",
                      )
                    : t("{n} routes the EU recognises for CN {code}.", {
                        n: routes.length,
                        code: product?.cnCode ?? "",
                      })
                }
              >
                <Select
                  value={route}
                  onChange={setRoute}
                  placeholder={t("Choose a route")}
                  options={routes.map((r) => ({
                    value: r.id,
                    label: `${t(r.label)}${r.letter ? ` (${r.letter})` : ""}`,
                    hint: `${r.isEuDefault ? `${t("EU default for {country}", { country: countryName(country) })} · ` : ""}${t(r.hint)}`,
                  }))}
                  ariaLabel={t("Production route")}
                />
              </Field>
              <Field
                label={t("Reporting year")}
                hint={t(
                  "The product report covers 1 January to 31 December of this year.",
                )}
              >
                <Select
                  value={String(year)}
                  onChange={(v) => setYear(Number(v))}
                  options={YEARS.map((y) => ({
                    value: String(y),
                    label: String(y),
                  }))}
                  ariaLabel={t("Reporting year")}
                />
              </Field>
            </div>

            {yearBlocked && estate && (
              <>
                <p className="mt-5 text-[13px] leading-relaxed text-black/55">
                  {t(
                    "{year} would be a new reporting year. Archiving a finished year frees its slot — nothing behind it is deleted.",
                    { year },
                  )}
                </p>
                <PlanCapNotice cap={estate.yearCap} className="mt-3" />
              </>
            )}

            {/* The route's implications, once one is chosen. This is the answer
                to "is aluminium different from steel?" — it is, and the
                difference is which precursors exist above the good and where
                the carbon actually sits. */}
            {route &&
              (() => {
                const r = routes.find((x) => x.id === route);
                if (!r) return null;
                return (
                  <>
                    <dl className="mt-5 grid gap-3 rounded-xl border border-black/[0.07] bg-[#faf9f7] p-4 sm:grid-cols-3">
                      {[
                        ["Standard name", r.standardName],
                        ["Precursors this implies", r.precursors],
                        ["Where the emissions are", r.dominantSource],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <dt className="text-[10px] uppercase tracking-[0.1em] text-black/40">
                            {t(k)}
                          </dt>
                          <dd className="mt-1 text-[12px] leading-relaxed text-black/60">
                            {t(v)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-3 text-[12px] leading-relaxed text-black/45">
                      {t("In the EU communication template this route reads")}{" "}
                      <strong className="font-medium text-black/65">
                        “{r.templateRoute}”
                      </strong>
                      .
                      {r.letter
                        ? ` ${t("Benchmark route")} ${r.letter} — ${r.letterLabel}.`
                        : ""}
                      {r.benchmark?.default != null
                        ? ` ${t("Free-allocation benchmark")} ${r.benchmark.default.toFixed(3)} tCO₂e/t${r.benchmark.process != null ? ` (${t("process benchmark")} ${r.benchmark.process.toFixed(3)})` : ""}.`
                        : ""}
                      {r.isEuDefault
                        ? ` ${t("This is the route the EU built the default value for {country} on.", { country: countryName(country) })}`
                        : ""}
                    </p>
                    {product && (
                      <CnRatePanel
                        className="mt-4"
                        product={product}
                        country={country}
                        year={year}
                        routeLetter={r.letter ?? (euRoute || undefined)}
                      />
                    )}
                  </>
                );
              })()}
          </Card>
        )}

        {/* ── 4 · Schedule ───────────────────────────────────── */}
        {step === 3 && (
          <Card className="p-5 sm:p-6">
            <Heading
              helpTitle={t("The monthly ask")}
              help={
                <>
                  <p>
                    {t(
                      "The same three sections — MMD, monthly data and precursors — are needed for every month of the year, so this is a schedule rather than a form.",
                    )}
                  </p>
                  <p className="mt-2">
                    {t(
                      "A month can only be asked for once it has ENDED, so the request is dated the last day of the month it covers. That is fixed — asking earlier is impossible, and asking later only shortens the time the other end has.",
                    )}
                  </p>
                </>
              }
            >
              {t("The monthly ask")}
            </Heading>

            {isSelf && (
              <p className="mb-5 text-[13px] leading-relaxed text-black/50">
                {t(
                  "This installation is yours, so each month appears in your own inbox once you send it — nothing goes to a third party.",
                )}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={t("Request dated")}
                hint={t(
                  "Fixed — a month cannot be reported before it has ended.",
                )}
              >
                <div className="flex h-[42px] items-center rounded-xl border border-black/[0.08] bg-black/[0.02] px-3.5 text-[13px] text-black/50">
                  {t("The last day of the month")}
                </div>
              </Field>
            </div>

            <dl className="mt-6 grid gap-3 rounded-xl border border-black/[0.07] bg-white p-4 sm:grid-cols-2">
              {!isSelf && (
                <Summary label={t("Supplier")} value={supplier?.name ?? "—"} />
              )}
              <Summary
                label={t("Installation")}
                value={`${installationName || "—"} · ${installationId || "—"}`}
              />
              <Summary
                label={t("Country of production")}
                value={countryName(country)}
              />
              <Summary
                label={t("Good")}
                value={
                  product ? `${t(product.name)} · CN ${product.cnCode}` : "—"
                }
              />
              <Summary
                label={t("Route")}
                value={routes.find((r) => r.id === route)?.label ?? "—"}
              />
              <Summary
                label={t("Reporting year")}
                value={`1 Jan ${year} to 31 Dec ${year}`}
              />
            </dl>
          </Card>
        )}
      </div>

      {/* Nav. No hint text here: what is missing is said next to the field
          that is missing it, not summarised in the corner of a footer.

          STEP 1 CARRIES CANCEL in the same slot Back occupies everywhere else,
          so the left-hand control is always "the way out of this step" and the
          reader never has to look for it in two places. The X in the header
          does the same thing, but a wizard whose only exit is a 20px glyph
          diagonally opposite the primary button is a wizard people finish by
          accident.

          It is `sticky bottom-0` on a page whose <main> scrolls, which is what
          keeps Continue / Create workspace on screen without scrolling to the
          end of a long step — the catalogue in step 2 and the installation form
          in step 1 are both taller than a laptop viewport. The negative margins
          let the bar's background reach the page gutters so content passing
          underneath is covered rather than showing in a 4px strip either side. */}
      <div className="sticky bottom-0 z-20 -mx-4 flex items-center justify-between gap-3 border-t border-black/[0.06] bg-[#f5f4f0]/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        {step > 0 ? (
          <Button variant="ghost" size="sm" disabled={waiting} onClick={back}>
            <ArrowLeft size={14} strokeWidth={1.5} /> {t("Back")}
          </Button>
        ) : (
          <Button variant="ghost" size="sm" disabled={waiting} onClick={close}>
            {t("Cancel")}
          </Button>
        )}
        {isLast ? (
          <Button
            onClick={create}
            disabled={
              waiting ||
              planBlocked ||
              !installationId.trim() ||
              !productId ||
              !route
            }
          >
            {creating ? (
              <>
                <span
                  className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/25 border-t-white/80"
                  aria-hidden
                />
                {t("Creating…")}
              </>
            ) : (
              <>
                {t("Create product report")}{" "}
                <ArrowRight size={15} strokeWidth={1.5} />
              </>
            )}
          </Button>
        ) : (
          <Button onClick={next} disabled={!canContinue || waiting}>
            {t(waiting ? "Saving…" : "Continue")}{" "}
            <ArrowRight size={15} strokeWidth={1.5} />
          </Button>
        )}
      </div>
    </div>
  );
}

/* ── Choice card ──────────────────────────────────────────────
   Two answers, both visible, neither pre-selected. A radio pair would do the
   same job in a third of the space and read as a setting; this is the question
   the whole workspace hangs off, so it gets the room to say what each answer
   means before it is chosen. */
function ChoiceCard({
  active,
  onClick,
  icon,
  title,
  body,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex h-full flex-col rounded-xl border p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20",
        active
          ? "border-[#111] bg-[#f0eee8]"
          : "border-black/[0.08] bg-white hover:border-black/25 hover:bg-[#fafaf8]",
      )}
    >
      <span className="flex items-center gap-2">
        <span
          className={cn(
            "flex-none",
            active ? "text-black/70" : "text-black/35",
          )}
        >
          {icon}
        </span>
        <span
          className={cn(
            "text-[13px]",
            active ? "text-black/85" : "text-black/70",
          )}
        >
          {title}
        </span>
        {active && (
          <Check
            size={14}
            strokeWidth={2}
            className="ml-auto flex-none text-[#111]"
          />
        )}
      </span>
      <span className="mt-1.5 block text-[12px] leading-relaxed text-black/45">
        {body}
      </span>
    </button>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.1em] text-black/40">
        {label}
      </dt>
      <dd className="mt-1 text-[12.5px] leading-relaxed text-black/65">
        {value}
      </dd>
    </div>
  );
}
