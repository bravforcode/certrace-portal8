"use client";

export const runtime = "edge";

/* The Smart Link form for one Convert checklist item. The exporter copies the link
   from Convert; the person who opens it fills the same fields as Fill in, with no
   account, and the answers land in the exporter's workbook CBAM tab. The server
   decides which item and workbook the token reaches and rejects any other key. */

import * as React from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CertraceLogo } from "@/components/logo";
import { Button, cn, inputClass } from "@/components/ui";
import { isDeadLink } from "@/lib/api/errors";
import { resolveItemLink, submitItemLink, type ItemLinkField } from "@/lib/api/item-links";

export default function ItemLinkPage() {
  const token = decodeURIComponent(useParams<{ token: string }>().token);
  const q = useQuery({ queryKey: ["item-link", token], queryFn: () => resolveItemLink(token), retry: false });

  let body: React.ReactNode;
  if (q.isPending) body = <p className="text-sm text-black/50">Opening the form…</p>;
  else if (q.isError)
    body = (
      <p className="text-sm text-black/55">
        {isDeadLink(q.error) ? "This link looks invalid or expired. Ask the sender for a new one." : "Could not open the form. Reload the page."}
      </p>
    );
  else if (q.data.fields.length === 0) body = <p className="text-sm text-black/55">This form has no fields yet.</p>;
  else body = <ItemForm token={token} title={q.data.label} year={q.data.year} fields={q.data.fields} />;

  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      <header className="border-b border-black/[0.06]">
        <div className="mx-auto flex h-16 max-w-2xl items-center px-6">
          <CertraceLogo className="h-[18px] w-auto" />
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-12">{body}</main>
    </div>
  );
}

function ItemForm({ token, title, year, fields }: { token: string; title: string; year: number; fields: ItemLinkField[] }) {
  const initial = React.useMemo(() => Object.fromEntries(fields.map((f) => [f.key, f.value])), [fields]);
  const [values, setValues] = React.useState<Record<string, string>>(initial);
  const save = useMutation({
    mutationFn: (changed: Record<string, string | null>) => submitItemLink(token, changed),
  });

  const sections = React.useMemo(() => {
    const out = new Map<string, ItemLinkField[]>();
    for (const f of fields) out.set(f.section, [...(out.get(f.section) ?? []), f]);
    return [...out];
  }, [fields]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const changed: Record<string, string | null> = {};
    for (const f of fields) {
      const v = (values[f.key] ?? "").trim();
      if (v !== (initial[f.key] ?? "").trim()) changed[f.key] = v === "" ? null : v;
    }
    if (Object.keys(changed).length) save.mutate(changed);
  };

  return (
    <form onSubmit={submit} className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-plex)] text-2xl font-light tracking-tight text-[#111]">{title}</h1>
        <p className="mt-1 text-sm text-black/50">Reporting year {year}. Your answers go straight to the requester.</p>
      </div>
      {sections.map(([section, list]) => (
        <fieldset key={section} className="space-y-4">
          <legend className="text-[12px] uppercase tracking-[0.08em] text-black/45">{section}</legend>
          {list.map((f) => (
            <label key={f.key} className="block space-y-1.5">
              <span className="text-[13px] text-black/65">
                {f.label}
                {f.unit && <span className="text-black/35"> ({f.unit})</span>}
                {f.optional && <span className="text-black/35"> · optional</span>}
              </span>
              {f.kind === "select" && f.options?.length ? (
                <select className={inputClass} value={values[f.key] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}>
                  <option value="">—</option>
                  {f.options.map((o) => (
                    <option key={o} value={o}>{f.optionLabels?.[o] ?? o.trim()}</option>
                  ))}
                </select>
              ) : (
                <input
                  className={inputClass}
                  type={f.kind === "number" ? "number" : f.kind === "date" ? "date" : "text"}
                  step={f.kind === "number" ? "any" : undefined}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                />
              )}
            </label>
          ))}
        </fieldset>
      ))}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={save.isPending}>{save.isPending ? "Sending…" : "Send answers"}</Button>
        {(save.isSuccess || save.isError) && (
          <span role="status" className={cn("text-[13px]", save.isSuccess ? "text-emerald-700" : "text-red-600")}>
            {save.isSuccess ? "Sent. Thank you." : "Not sent. Try again."}
          </span>
        )}
      </div>
    </form>
  );
}
