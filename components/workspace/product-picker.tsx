"use client";

/* ════════════════════════════════════════════════════════════
   THE CBAM CATALOGUE PICKER

   Shared by the new-workspace flow, the workspace overview and the
   declaration hierarchy, so a good is chosen the same way everywhere and a
   filter added in one place cannot go missing in another.

   TWO THINGS THIS SCREEN GETS RIGHT THAT THE FIRST VERSION DID NOT:

   1. THE FILTERS ARE FILTERS. Product type and sub-group used to render as
      rows of pills that were visually identical to the TAGS on each result
      row — so "Precursor" appeared twice on the screen, once as something you
      press and once as something describing a good, in the same shape. People
      pressed the tag. They are now two labelled dropdowns above the list,
      which is what they always were behaviourally.

   2. THE ROW TAGS ARE ONE SIZE. The CN code was a small mono chip and the
      product type was a large tracked pill, side by side on the same line, so
      two facts of equal standing looked like a caption next to a heading.
      Both now render through `RowTag` at one size.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Check, Search } from "lucide-react";
import { inputClass, cn } from "@/components/ui";
import { Select } from "@/components/controls";
import { useT } from "@/lib/i18n";
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

const TYPE_TONE: Record<ProductType, string> = {
  Precursor: "border-[rgba(37,99,235,0.2)] bg-[#eff6ff] text-[#1e40af]",
  "Semi-finished": "border-[rgba(180,83,9,0.2)] bg-[#fffbeb] text-[#b45309]",
  "Finished product": "border-[rgba(5,150,105,0.18)] bg-[#ecfdf5] text-[#047857]",
};

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

export function ProductRow({ product, selected, onSelect }: { product: CatalogProduct; selected: boolean; onSelect: () => void }) {
  const type = productType(product);
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
        <span className="block text-[13px] leading-snug text-black/80">{product.name}</span>
        <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <RowTag>CN {product.cnCode}</RowTag>
          <RowTag className={TYPE_TONE[type]}>{type}</RowTag>
          <span className="text-[10.5px] text-black/35">
            {product.group} · {aggregatedGoodsCategory(product)}
          </span>
        </span>
      </span>
    </button>
  );
}

export function ProductPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const t = useT();
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<ProductCategory | "">("");
  const [type, setType] = React.useState<ProductType | "">("");
  const [group, setGroup] = React.useState("");

  const groups = React.useMemo(() => productGroups(category || undefined), [category]);

  // A sub-group filter left over from another sector matches nothing and reads
  // as an empty catalogue rather than as a stale filter.
  React.useEffect(() => {
    if (group && !groups.includes(group)) setGroup("");
  }, [group, groups]);

  const results = React.useMemo(
    () => searchCatalog(query, { category: category || undefined, type: type || undefined, group: group || undefined }),
    [query, category, type, group],
  );

  const filtered = Boolean(query.trim() || category || type || group);

  return (
    <div>
      <div className="relative">
        <Search size={15} strokeWidth={1.5} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30" />
        <input
          className={cn(inputClass, "pl-10")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("Search by name or CN code — billet, tinplate, 7207…")}
          aria-label={t("Search the CBAM catalogue")}
        />
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <FilterSelect
          label={t("Sector")}
          value={category}
          onChange={(v) => setCategory(v as ProductCategory | "")}
          allLabel={t("All sectors")}
          options={PRODUCT_CATEGORIES.map((c) => ({ value: c, label: c }))}
        />
        <FilterSelect
          label={t("Type")}
          value={type}
          onChange={(v) => setType(v as ProductType | "")}
          allLabel={t("All types")}
          options={PRODUCT_TYPES.map((tp) => ({ value: tp, label: tp, hint: PRODUCT_TYPE_HINT[tp] }))}
        />
        <FilterSelect
          label={t("Group")}
          value={group}
          onChange={setGroup}
          allLabel={t("All groups")}
          options={groups.map((g) => ({ value: g, label: g }))}
          disabled={groups.length < 2}
        />
      </div>

      {/* The count is load-bearing. Without it, a filtered list is
          indistinguishable from a truncated one — which is exactly how a
          complete 67-good catalogue read as missing 55 goods. */}
      <p className="mt-3 text-[11.5px] text-black/40">
        {t("Showing")} <strong className="font-medium text-black/60">{results.length}</strong> of {CATALOG_SIZE} goods in CBAM scope
        {filtered && results.length !== CATALOG_SIZE ? " — clear the filters to see them all" : ""}.
      </p>

      <div className="mt-2 max-h-[320px] overflow-y-auto rounded-xl border border-black/[0.07]">
        {results.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-black/40">
            {t("Nothing in the CBAM catalogue matches that. If the good you export is not here, it is probably outside CBAM scope — check the CN code on your customs declaration.")}
          </p>
        ) : (
          results.map((p) => <ProductRow key={p.id} product={p} selected={value === p.id} onSelect={() => onChange(p.id)} />)
        )}
      </div>
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; hint?: string }[];
  allLabel: string;
  disabled?: boolean;
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
        className={cn(disabled && "pointer-events-none opacity-45")}
      />
    </label>
  );
}
