"use client";

/* ════════════════════════════════════════════════════════════
   THE CBAM CATALOGUE PICKER — all 570 goods in CBAM scope

   Shared by the new-workspace flow, the product report's Overview and the
   declaration hierarchy, so a good is chosen the same way everywhere and a
   filter added in one place cannot go missing in another.

   THE LIST IS THE FULL CN-8 SET, NOT A SAMPLE. It used to offer 67 goods, one
   per heading, and an exporter whose customs declaration said 7208 38 00 could
   not find their code. It now lists every code the EU's benchmark table names
   (see lib/cbam/cn-catalogue.ts), so what is on the declaration is what is on
   the screen. Five filters narrow it — sector, group, heading, type and the
   search box — and a digit-only search matches a CN prefix, so typing "7208 3"
   finds every 7208 3x code.

   EVERY ROW SAYS WHAT ITS CODE LEADS TO. The EU emission rate for the country
   the goods are made in, and the route it was built on, ride on the row — the
   rate is what the buyer reads the good by, so it is not a second click away.
   The full breakdown (offset, chargeable, price) is the CnRatePanel the caller
   puts under the picker.

   TWO THINGS KEPT FROM THE FIRST VERSION:

   1. THE FILTERS ARE FILTERS. They are labelled dropdowns above the list, not
      rows of pills that look like the tags on each result row.
   2. THE ROW TAGS ARE ONE SIZE. The CN code and the product type render
      through `RowTag`, so two facts of equal standing never read as a heading
      and its caption.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Check, Search } from "lucide-react";
import { inputClass, cn } from "@/components/ui";
import { Select } from "@/components/controls";
import { useLanguage, useT } from "@/lib/i18n";
import {
  CATALOG_SIZE,
  PRODUCT_CATEGORIES,
  PRODUCT_TYPES,
  PRODUCT_TYPE_HINT,
  aggregatedGoodsCategory,
  productGroups,
  productType,
  searchCatalog,
  type CatalogProduct,
  type ProductCategory,
  type ProductType,
} from "@/lib/config";
import { headingsFor, shortDescription } from "@/lib/cbam/cn-catalogue";
import { CN_DESC_TH } from "@/lib/cbam/data/cn-catalogue-th";
import { lookupDefault } from "@/lib/cbam/eu-rates";
import { useDefaultsReady } from "@/lib/cbam/use-rates";

const TYPE_TONE: Record<ProductType, string> = {
  Precursor: "border-[rgba(37,99,235,0.2)] bg-[#eff6ff] text-[#1e40af]",
  "Semi-finished": "border-[rgba(180,83,9,0.2)] bg-[#fffbeb] text-[#b45309]",
  "Finished product": "border-[rgba(5,150,105,0.18)] bg-[#ecfdf5] text-[#047857]",
};

/** How many rows render before "Show more". 570 rows is fine for the browser;
    it is not fine for the eye — a list this long wants a way to say "I have
    seen the first screen of it". */
const PAGE = 60;

/** One size for every fact on a result row. The CN code and the product type
    are equally load-bearing — CN is what customs paperwork is keyed on, type
    is what decides whether a precursor chain exists — so neither is allowed to
    render as the other's caption. */
export function RowTag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-black/[0.08] bg-black/[0.03] px-2 py-[3px] font-mono text-[10.5px] leading-none tracking-[0.02em] text-black/60",
        className,
      )}
    >
      {children}
    </span>
  );
}

type Described = CatalogProduct & { description?: string; headingTitle?: string };

export function ProductRow({
  product,
  selected,
  onSelect,
  country,
  year,
}: {
  product: CatalogProduct;
  selected: boolean;
  onSelect: () => void;
  /** the country whose default value is shown on the row; none → no figure */
  country?: string;
  year?: number;
}) {
  const t = useT();
  const { lang } = useLanguage();
  const type = productType(product);
  const p = product as Described;
  /* In Thai, the explanation is the Thai one for this CN code (when there is one); the CN code beside it stays the legal reference. */
  const thai = lang === "th" ? CN_DESC_TH[product.cnCode] : undefined;
  const hit = country ? lookupDefault(product.cnCode, country) : null;
  const value = hit ? (year && year >= 2028 ? hit.rates.y2028 : year === 2027 ? hit.rates.y2027 : hit.rates.y2026) : null;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 border-b border-black/[0.04] px-3 py-2.5 text-left transition-colors last:border-0",
        selected ? "bg-[#f0eee8]" : "hover:bg-[#fafaf8]",
      )}
    >
      <span
        className={cn(
          "mt-0.5 grid h-4 w-4 flex-none place-items-center rounded-[5px] border",
          selected ? "border-transparent bg-[#111] text-white" : "border-black/20",
        )}
      >
        {selected && <Check size={11} strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] leading-snug text-black/80">{t(product.name)}</span>
        {p.description && p.description !== product.name && (!thai || thai !== t(product.name)) && (
          <span className="mt-0.5 block text-[11.5px] leading-snug text-black/45">{thai ? shortDescription(thai, 170) : shortDescription(p.description)}</span>
        )}
        <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <RowTag>CN {product.cnCode}</RowTag>
          <RowTag className={TYPE_TONE[type]}>{t(type)}</RowTag>
          <span className="text-[10.5px] text-black/35">
            {t(product.group)} · {t(aggregatedGoodsCategory(product))}
          </span>
        </span>
      </span>
      {value != null && (
        <span
          className="flex-none text-right"
          title={`EU default value for ${year && year >= 2026 ? Math.min(year, 2028) : 2026}${year && year >= 2028 ? " and onwards" : ""}, including the mark-up: ${value.toFixed(3)} tCO₂e per tonne${hit?.rates.route ? ` — built on route ${hit.rates.route}` : ""}`}
        >
          <span className="block font-mono text-[13px] tabular-nums text-black/70">{value.toFixed(3)}</span>
          <span className="block font-mono text-[9.5px] uppercase tracking-[0.08em] text-black/35">tCO₂e/t{hit?.rates.route ? ` · ${hit.rates.route}` : ""}</span>
        </span>
      )}
    </button>
  );
}

export function ProductPicker({
  value,
  onChange,
  country = "TH",
  year = 2026,
  showRates = true,
  defaultCategory,
}: {
  value: string;
  onChange: (id: string) => void;
  /** the sector the list opens on — a steel exporter's catalogue starts at steel, not at kaolin and cement. Their own choice of sector wins from then on. */
  defaultCategory?: ProductCategory;
  /** the country the goods are made in — the rates on each row are read for it */
  country?: string;
  year?: number;
  /** false where no country has been chosen yet — a precursor's origin is asked AFTER the good,
      and a figure for a country nobody picked would only be a guess */
  showRates?: boolean;
}) {
  const t = useT();
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<ProductCategory | "">(defaultCategory ?? "");
  const chose = React.useRef(false);
  // The sector may arrive after the first paint (it comes from the saved profile); take it until the reader has chosen one themselves.
  React.useEffect(() => {
    if (!chose.current && defaultCategory) setCategory(defaultCategory);
  }, [defaultCategory]);
  const [type, setType] = React.useState<ProductType | "">("");
  const [group, setGroup] = React.useState("");
  const [heading, setHeading] = React.useState("");
  const [shown, setShown] = React.useState(PAGE);
  // Rows read Thailand's table synchronously; another country's is loaded once.
  useDefaultsReady(country);

  const groups = React.useMemo(() => productGroups(category || undefined), [category]);
  const headings = React.useMemo(() => headingsFor(category || undefined, group || undefined), [category, group]);

  // A sub-filter left over from another sector matches nothing and reads as an
  // empty catalogue rather than as a stale filter.
  React.useEffect(() => {
    if (group && !groups.includes(group)) setGroup("");
  }, [group, groups]);
  React.useEffect(() => {
    if (heading && !headings.some((h) => h.heading === heading)) setHeading("");
  }, [heading, headings]);

  const thaiQuery = /[\u0E00-\u0E7F]/.test(query);
  const results = React.useMemo(() => {
    const filters = { category: category || undefined, type: type || undefined, group: group || undefined, heading: heading || undefined };
    // A Thai query is matched against the Thai names and explanations; anything else goes through the English catalogue search.
    if (!thaiQuery) return searchCatalog(query, filters);
    const q = query.trim();
    return searchCatalog("", filters).filter((p) => t(p.name).includes(q) || (CN_DESC_TH[p.cnCode] ?? "").includes(q) || t(p.group).includes(q));
  }, [query, thaiQuery, category, type, group, heading, t]);
  React.useEffect(() => setShown(PAGE), [query, category, type, group, heading]);

  // The selection must stay visible: it is the one row the reader came to
  // confirm, and a filter must not hide it from them.
  const selected = value ? results.find((p) => p.id === value) : undefined;
  const filtered = Boolean(query.trim() || category || type || group || heading);
  const visible = results.slice(0, shown);

  return (
    <div>
      <div className="relative">
        <Search size={15} strokeWidth={1.5} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30" />
        <input
          className={cn(inputClass, "pl-10")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("Search by CN code or name — 7208 38, hot-rolled, stainless, urea…")}
          aria-label={t("Search the CBAM catalogue")}
        />
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <FilterSelect
          label={t("Sector")}
          value={category}
          onChange={(v) => {
            chose.current = true;
            setCategory(v as ProductCategory | "");
          }}
          allLabel={t("All sectors")}
          options={PRODUCT_CATEGORIES.map((c) => ({ value: c, label: t(c) }))}
        />
        <FilterSelect
          label={t("Group")}
          value={group}
          onChange={setGroup}
          allLabel={t("All groups")}
          options={groups.map((g) => ({ value: g, label: t(g) }))}
          disabled={groups.length < 2}
        />
        <FilterSelect
          label={t("Heading")}
          value={heading}
          onChange={setHeading}
          allLabel={t("All headings")}
          options={headings.map((h) => ({ value: h.heading, label: `${h.heading} · ${t(h.title)}` }))}
          disabled={headings.length < 2}
          searchable
        />
        <FilterSelect
          label={t("Type")}
          value={type}
          onChange={(v) => setType(v as ProductType | "")}
          allLabel={t("All types")}
          options={PRODUCT_TYPES.map((tp) => ({ value: tp, label: t(tp), hint: t(PRODUCT_TYPE_HINT[tp]) }))}
        />
      </div>

      {/* The count is load-bearing. Without it, a filtered list is
          indistinguishable from a truncated one — which is exactly how a
          complete catalogue reads as missing goods. */}
      <p className="mt-3 text-[11.5px] text-black/40">
        {t("Showing")} <strong className="font-medium text-black/60">{visible.length}</strong> {t("of")}{" "}
        <strong className="font-medium text-black/60">{results.length}</strong>
        {results.length !== CATALOG_SIZE ? ` ${t("matching")} (${CATALOG_SIZE} ${t("goods in CBAM scope in all")})` : ` ${t("goods in CBAM scope")}`}
        {filtered && results.length !== CATALOG_SIZE ? ` — ${t("clear the filters to see them all")}` : ""}.
      </p>

      <div className="mt-2 max-h-[380px] overflow-y-auto rounded-xl border border-black/[0.07]">
        {results.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-black/40">
            {t("Nothing in the CBAM catalogue matches that. If the good you export is not here, it is probably outside CBAM scope — check the CN code on your customs declaration.")}
          </p>
        ) : (
          <>
            {visible.map((p) => (
              <ProductRow key={p.id} product={p} selected={value === p.id} onSelect={() => onChange(p.id)} country={showRates ? country : undefined} year={year} />
            ))}
            {results.length > visible.length && (
              <button
                type="button"
                onClick={() => setShown((n) => n + PAGE)}
                className="w-full border-t border-black/[0.05] bg-[#faf9f7] px-4 py-3 text-[11px] uppercase tracking-[0.1em] text-black/50 transition-colors hover:bg-[#f0eee8] hover:text-black"
              >
                {t("Show {n} more", { n: Math.min(PAGE, results.length - visible.length) })} · {results.length - visible.length} {t("not shown yet")}
              </button>
            )}
          </>
        )}
      </div>
      {value && !selected && filtered && (
        <p className="mt-2 text-[11.5px] text-black/40">{t("Your selected good is outside these filters — clear them to see it in the list.")}</p>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
  disabled,
  searchable,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; hint?: string }[];
  allLabel: string;
  disabled?: boolean;
  searchable?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] uppercase tracking-[0.1em] text-black/40">{label}</span>
      <Select
        value={value}
        onChange={(v) => onChange(v === "__all" ? "" : v)}
        options={[{ value: "__all", label: allLabel }, ...options]}
        placeholder={allLabel}
        ariaLabel={label}
        searchable={searchable}
        className={cn(disabled && "pointer-events-none opacity-45")}
      />
    </label>
  );
}
