import type {
  FieldTarget,
  PageReading,
  Proposal,
  AutofillResult,
} from "./autofill-types";
const normalize = (s: string) =>
  s.normalize("NFKC").replace(/\s+/g, " ").trim();
const unit = (s: string) =>
  s
    .toLowerCase()
    .replace(/\s/g, "")
    .replace("tonnes", "t")
    .replace("tonne", "t")
    .replace("litres", "l")
    .replace("liters", "l");
export function normalizeValue(
  target: FieldTarget,
  value: unknown,
  sourceUnit: string,
): Proposal["value"] {
  if (target.kind === "string[]") {
    if (
      !Array.isArray(value) ||
      value.length > 50 ||
      value.some((v) => typeof v !== "string" || v.length > 1000)
    )
      throw Error("Expected a list of text values");
    if (target.options && value.some((v) => !target.options!.includes(v)))
      throw Error("Choose allowed list values");
    return value;
  }
  if (target.kind === "boolean") {
    if (typeof value !== "boolean") throw Error("Expected true or false");
    return value;
  }
  if (target.kind === "number" || target.kind === "decimalText") {
    if (typeof value !== "number" && typeof value !== "string")
      throw Error("Expected a number");
    // Decimal commas and ambiguous separators require correction, never a guessed conversion.
    const raw = String(value).trim();
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw))
      throw Error("Ambiguous number format; enter a decimal number");
    let n = Number(raw);
    if (!Number.isFinite(n)) throw Error("Invalid number");
    if (target.unit && sourceUnit && unit(target.unit) !== unit(sourceUnit)) {
      const factors: Record<string, number> = {
        "kwh>mwh": 0.001,
        "mwh>kwh": 1000,
        "kg>t": 0.001,
        "t>kg": 1000,
        "%>fraction": 0.01,
        "fraction>%": 100,
      };
      const factor = factors[`${unit(sourceUnit)}>${unit(target.unit)}`];
      if (factor === undefined)
        throw Error(
          `Cannot convert ${sourceUnit} to ${target.unit} without more information`,
        );
      n *= factor;
    }
    if (target.unit && !sourceUnit)
      throw Error(`Source unit required (${target.unit})`);
    if (
      (target.min !== undefined && n < target.min) ||
      (target.max !== undefined && n > target.max)
    )
      throw Error("Value outside the allowed range");
    return target.kind === "decimalText" ? String(n) : n;
  }
  if (typeof value !== "string" || !value.trim() || value.length > 6000)
    throw Error("Expected nonempty text (maximum 6,000 characters)");
  if (
    target.format === "date" &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      !Number.isFinite(Date.parse(value)) ||
      new Date(value).toISOString().slice(0, 10) !== value)
  )
    throw Error("Invalid calendar date");
  if (target.format === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    throw Error("Invalid email");
  if (target.options && !target.options.includes(value))
    throw Error("Choose an allowed value");
  return value;
}
export function validateMapping(
  raw: unknown,
  targets: FieldTarget[],
  pages: PageReading[],
): Omit<AutofillResult, "model" | "inputTokens" | "outputTokens"> {
  if (!raw || typeof raw !== "object")
    throw Error("The model returned an invalid mapping");
  const data = raw as Record<string, unknown>;
  if (!Array.isArray(data.proposals) || data.proposals.length > 120)
    throw Error("Invalid or oversized proposal list");
  const known = new Map(targets.map((t) => [t.id, t]));
  const proposals: Proposal[] = [];
  const unresolved = Array.isArray(data.unresolved)
    ? data.unresolved
        .filter((s): s is string => typeof s === "string")
        .map((s) => s.slice(0, 500))
        .slice(0, 30)
    : [];
  for (const item of data.proposals) {
    if (!item || typeof item !== "object") {
      unresolved.push("An invalid proposal was discarded.");
      continue;
    }
    const r = item as Record<string, unknown>;
    const target = known.get(String(r.targetId));
    if (!target) {
      unresolved.push(
        "A proposal referenced an unknown or protected report field and was discarded.",
      );
      continue;
    }
    const page = pages.find((p) => p.page === r.page);
    const quote =
      typeof r.quote === "string" ? r.quote.trim().slice(0, 2000) : "";
    const original =
      typeof r.original === "string" ? r.original.slice(0, 6000) : "";
    const sourceUnit =
      typeof r.sourceUnit === "string" ? r.sourceUnit.slice(0, 80) : "";
    const warnings: string[] = [];
    let blocked = false;
    if (!page || !quote) {
      warnings.push("Missing source page or evidence excerpt.");
      blocked = true;
    } else if (page.image)
      warnings.push("Read visually: compare the value with the original page.");
    else if (!normalize(page.text).includes(normalize(quote))) {
      warnings.push(
        "The evidence excerpt does not match the extracted page text.",
      );
      blocked = true;
    }
    if (original && quote && !normalize(quote).includes(normalize(original))) {
      warnings.push("The original value is not present in the cited excerpt.");
      blocked = true;
    }
    if (!original) {
      warnings.push("Missing original source value.");
      blocked = true;
    }
    if (
      sourceUnit &&
      (target.kind === "number" || target.kind === "decimalText")
    ) {
      const escaped = normalize(sourceUnit).replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&",
      );
      if (
        !new RegExp(`(?:^|[^a-z])${escaped}(?:$|[^a-z])`, "i").test(
          normalize(quote),
        )
      ) {
        warnings.push("The cited excerpt does not show the source unit.");
        blocked = true;
      }
    }
    if (target.kind === "number" || target.kind === "decimalText") {
      const raw = original.trim();
      const numeric =
        /^[+-]?(?:\d{1,3}(?:[, ]\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?|\.\d+)$/.test(
          raw,
        )
          ? Number(raw.replace(/[, ]/g, ""))
          : NaN;
      if (!Number.isFinite(numeric) || numeric !== Number(r.value)) {
        warnings.push(
          "The proposed number does not match the original source value.",
        );
        blocked = true;
      }
    } else if (
      target.kind === "string" &&
      !target.options &&
      !target.format &&
      typeof r.value === "string" &&
      !normalize(quote).includes(normalize(r.value))
    ) {
      warnings.push(
        "The proposed text is not present in the excerpt; enter interpretations manually.",
      );
      blocked = true;
    }

    if (
      target.kind === "string[]" &&
      !target.options &&
      Array.isArray(r.value) &&
      r.value.some(
        (v) =>
          typeof v !== "string" || !normalize(quote).includes(normalize(v)),
      )
    ) {
      warnings.push("A list item is not present in the cited excerpt.");
      blocked = true;
    }
    if (
      target.path.at(-1) === "unit" &&
      target.current &&
      r.value !== target.current
    ) {
      warnings.push(
        "Changing an existing unit requires manual editing and a new reading.",
      );
      blocked = true;
    }
    if (target.shared)
      warnings.push(
        "Shared company/installation input: this may affect other reports.",
      );
    if (target.label.includes("new row"))
      warnings.push(
        "Creates a new row. Check that the same record is not already entered.",
      );
    let value: Proposal["value"] =
      typeof r.value === "string" ||
      typeof r.value === "number" ||
      typeof r.value === "boolean"
        ? r.value
        : "";
    try {
      value = normalizeValue(target, r.value, sourceUnit);
    } catch (e) {
      warnings.push((e as Error).message);
      blocked = true;
    }
    if (
      target.current !== null &&
      target.current !== "" &&
      JSON.stringify(target.current) !== JSON.stringify(value)
    )
      warnings.push(
        "Replaces an existing value. Compare both values before selecting.",
      );
    proposals.push({
      id: crypto.randomUUID(),
      target,
      value,
      original,
      sourceUnit,
      page: Number(r.page),
      quote,
      explanation:
        typeof r.explanation === "string" ? r.explanation.slice(0, 500) : "",
      warnings,
      blocked,
    });
  }
  for (const p of proposals)
    if (proposals.filter((q) => q.target.id === p.target.id).length > 1)
      p.warnings.push("Multiple proposals for this field. Select only one.");
  const needsVision = Array.isArray(data.needsVision)
    ? [
        ...new Set(
          data.needsVision.filter(
            (p): p is number =>
              typeof p === "number" &&
              pages.some((v) => v.page === p && !v.image),
          ),
        ),
      ].slice(0, 6)
    : [];
  return { proposals, unresolved, needsVision };
}
