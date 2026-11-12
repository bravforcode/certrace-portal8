/* ════════════════════════════════════════════════════════════
   THE INSTALLATION PROFILE — what is entered once per site

   Annex IV to Implementing Regulation (EU) 2025/2547 starts the operator's
   emissions report with facts that do not depend on the year or the product:

       1  the operator and the installation  — (a) operator name, (b) its
          registration number, (c) its full address in English, (d) the
          installation: name, CBAM Registry identifier, UN/LOCODE, address,
          coordinates of the main emission source
       2  a summary of the monitoring plan   — (b) non-CBAM processes,
          (d) the five main fuels, (e) the five main process-emission
          materials, (f) continuous measurement, (g) zero-rated fuels,
          (h) heat imported or exported
       3  electricity from several sources
       4  electricity produced inside the installation
       5  waste gases
       6  CO₂ transfer

   Items 2(a) and 2(c) — which CBAM production processes and routes, and which
   goods — are not asked here: they are what the site's product reports ARE.
   They are read from the reports, so they cannot disagree with them.

   Asked once, on the installation page, and printed on every report the site
   makes. Required / optional follows the regulation: the identity items and the
   yes/no questions are required (a "no" is an answer), the CBAM Registry
   identifier is optional because the regulation asks for it only where it
   exists, and a detail line is required only when the answer is yes.
   ════════════════════════════════════════════════════════════ */

import type {
  Installation,
  InstallationMonitoring,
  YesNo,
} from "../installations";

export type ProfileNeed = "required" | "optional";

export type ProfileField = {
  /** a key of Installation, or `monitoring.<key>` */
  key: string;
  label: string;
  hint?: string;
  tag: string;
  need: ProfileNeed;
  input: "text" | "textarea";
  placeholder?: string;
};

export type ProfileQuestion = {
  key: keyof InstallationMonitoring;
  detailKey: keyof InstallationMonitoring;
  label: string;
  detailLabel: string;
  tag: string;
  hint?: string;
};

export const OPERATOR_FIELDS: ProfileField[] = [
  {
    key: "operatorName",
    label: "Name of the operator",
    tag: "1(a)",
    need: "required",
    input: "text",
    hint: "The legal person that runs the installation.",
    placeholder: "Siam Steel Export Co., Ltd.",
  },
  {
    key: "operatorRegistrationNumber",
    label: "Corporate or activity registration number of the operator",
    tag: "1(b)",
    need: "required",
    input: "text",
    placeholder: "0105551234567",
  },
  {
    key: "operatorAddress",
    label: "Full address of the operator, in English",
    tag: "1(c)",
    need: "required",
    input: "textarea",
  },
  {
    key: "operatorStreet",
    label: "Operator street, number",
    tag: "1(c)",
    need: "optional",
    input: "text",
    hint: "The operator address in the parts the CBAM template asks for. Filled into the workbook for you.",
  },
  {
    key: "operatorCity",
    label: "Operator city",
    tag: "1(c)",
    need: "optional",
    input: "text",
  },
  {
    key: "operatorPostcode",
    label: "Operator postcode / ZIP",
    tag: "1(c)",
    need: "optional",
    input: "text",
  },
  {
    key: "operatorCountry",
    label: "Operator country",
    tag: "1(c)",
    need: "optional",
    input: "text",
    placeholder: "TH",
  },
  {
    key: "registryId",
    label: "Unique installation identifier in the CBAM Registry",
    tag: "1(d)",
    need: "optional",
    input: "text",
    hint: "Enter it once the CBAM Registry has issued it — the regulation asks for it where it exists.",
  },
];

export const MONITORING_TEXT: ProfileField[] = [
  {
    key: "monitoring.nonCbamProcesses",
    label: "Non-CBAM production processes carried out at the installation",
    tag: "2(b)",
    need: "required",
    input: "textarea",
    hint: "Write “None” if there are none.",
  },
  {
    key: "monitoring.topFuels",
    label: "The five most important fuels, by energy content",
    tag: "2(d)",
    need: "required",
    input: "textarea",
    hint: "For example natural gas, coal, diesel — most important first.",
  },
  {
    key: "monitoring.topMaterials",
    label:
      "The five most important materials leading to process emissions, by emissions",
    tag: "2(e)",
    need: "required",
    input: "textarea",
    hint: "For example limestone, electrodes, reducing agents. Write “None” if there are none.",
  },
];

export const MONITORING_QUESTIONS: ProfileQuestion[] = [
  {
    key: "cems",
    detailKey: "cemsDetail",
    label: "Is continuous emissions measurement used?",
    detailLabel:
      "Which greenhouse gases, and the five biggest sources it is applied to",
    tag: "2(f)",
  },
  {
    key: "zeroRatedFuels",
    detailKey: "zeroRatedDetail",
    label: "Are any zero-rated fuels used?",
    detailLabel: "Which fuels, and how zero-rating is demonstrated",
    tag: "2(g)",
  },
  {
    key: "heatTrade",
    detailKey: "heatDetail",
    label:
      "Is measurable heat imported from or exported to other installations?",
    detailLabel: "Which installations",
    tag: "2(h)",
  },
  {
    key: "electricityMixed",
    detailKey: "electricityDetail",
    label: "Is electricity consumed from different sources?",
    detailLabel:
      "Sources and quantities — and, where another installation supplies it, its name and country",
    tag: "3",
  },
  {
    key: "onsiteElectricity",
    detailKey: "onsiteElectricityDetail",
    label: "Is electricity produced inside the installation?",
    detailLabel:
      "Co-generation or separate generation; fossil or renewable; whether any is exported from a production process",
    tag: "4",
  },
  {
    key: "wasteGases",
    detailKey: "wasteGasDetail",
    label: "Are waste gases produced and used, or imported or exported?",
    detailLabel: "Which installations",
    tag: "5",
  },
  {
    key: "co2Transfer",
    detailKey: "co2TransferDetail",
    label: "Does CO₂ transfer apply?",
    detailLabel:
      "The responsible person and contact data of the receiving installation, infrastructure or entity",
    tag: "6",
  },
];

/** The trigger for the declarant-specific addendum (Annex IV point 1.1.1). */
export const ADDENDUM_QUESTION = {
  key: "electricityToEu" as const,
  label: "Is electricity from this installation imported into the EU?",
  tag: "1.1.1",
  hint: "Only then does the fourth report — the declarant-specific addendum — apply. Electricity is outside this portal's CN catalogue, so for most installations the answer is No.",
};

const get = (i: Installation, key: string): string => {
  if (key.startsWith("monitoring."))
    return String(
      (i.monitoring as Record<string, unknown>)[
        key.slice("monitoring.".length)
      ] ?? "",
    );
  return String((i as unknown as Record<string, unknown>)[key] ?? "");
};
const filled = (v: string) => v.trim() !== "";

export type ProfileGap = { tag: string; label: string };

/** What the installation still has to answer, required items only. */
export function profileGaps(i: Installation | null): ProfileGap[] {
  if (!i) return [{ tag: "1", label: "The installation record itself" }];
  const gaps: ProfileGap[] = [];
  for (const f of [...OPERATOR_FIELDS, ...MONITORING_TEXT]) {
    if (f.need === "required" && !filled(get(i, f.key)))
      gaps.push({ tag: f.tag, label: f.label });
  }
  // Item 1(d): the installation's own identity.
  if (!i.name.trim())
    gaps.push({ tag: "1(d)", label: "Name of the installation" });
  if (!i.unlocode.trim())
    gaps.push({ tag: "1(d)", label: "UN/LOCODE of the location" });
  if (!i.street.trim() || !i.city.trim())
    gaps.push({
      tag: "1(d)",
      label: "Full address of the installation, in English",
    });
  if (!i.lat.trim() || !i.lng.trim())
    gaps.push({
      tag: "1(d)",
      label: "Coordinates of the installation's main emission source",
    });

  const m = i.monitoring;
  for (const q of MONITORING_QUESTIONS) {
    const a: YesNo = m[q.key] as YesNo;
    if (a === "") gaps.push({ tag: q.tag, label: q.label });
    else if (a === "yes" && !filled(String(m[q.detailKey] ?? "")))
      gaps.push({ tag: q.tag, label: q.detailLabel });
  }
  return gaps;
}

export type ProfileStatus = {
  total: number;
  answered: number;
  gaps: ProfileGap[];
  complete: boolean;
};

export function profileStatus(i: Installation | null): ProfileStatus {
  const gaps = profileGaps(i);
  // Required items: 3 operator + 3 monitoring text + 4 identity + 7 questions.
  const total =
    OPERATOR_FIELDS.filter((f) => f.need === "required").length +
    MONITORING_TEXT.length +
    4 +
    MONITORING_QUESTIONS.length;
  return {
    total,
    answered: Math.max(0, total - gaps.length),
    gaps,
    complete: gaps.length === 0,
  };
}

/* ── The 17, as a checklist ─────────────────────────────────────
   The same 17 items `profileStatus` counts, laid out in the four groups the Overview page is made of, each with the field it
   is answered in — so "4 / 17" can say WHICH 13 are left and take the reader to the first of them. Built from the same
   fields and questions the page renders, so the list and the form cannot disagree. */
export type ProfileItem = {
  tag: string;
  label: string;
  anchor: string;
  done: boolean;
};
export type ProfileGroup = {
  key: "operator" | "installation" | "plan" | "questions";
  title: string;
  items: ProfileItem[];
  answered: number;
};

const anchorOf = (key: string) => `ip-${key.replace("monitoring.", "")}`;

export function profileGroups(i: Installation | null): ProfileGroup[] {
  const text = (k: string) => (i ? filled(get(i, k)) : false);
  const m = i?.monitoring;
  const operator: ProfileItem[] = OPERATOR_FIELDS.filter(
    (f) => f.need === "required",
  ).map((f) => ({
    tag: f.tag,
    label: f.label,
    anchor: anchorOf(f.key),
    done: text(f.key),
  }));
  const installation: ProfileItem[] = [
    {
      tag: "1(d)",
      label: "Name of the installation",
      anchor: "ip-name",
      done: Boolean(i?.name.trim()),
    },
    {
      tag: "1(d)",
      label: "UN/LOCODE of the location",
      anchor: "ip-unlocode",
      done: Boolean(i?.unlocode.trim()),
    },
    {
      tag: "1(d)",
      label: "Full address of the installation, in English",
      anchor: "ip-address",
      done: Boolean(i?.street.trim() && i?.city.trim()),
    },
    {
      tag: "1(d)",
      label: "Coordinates of the installation's main emission source",
      anchor: "ip-coords",
      done: Boolean(i?.lat.trim() && i?.lng.trim()),
    },
  ];
  const plan: ProfileItem[] = MONITORING_TEXT.map((f) => ({
    tag: f.tag,
    label: f.label,
    anchor: anchorOf(f.key),
    done: text(f.key),
  }));
  const questions: ProfileItem[] = MONITORING_QUESTIONS.map((q) => {
    const a = (m?.[q.key] ?? "") as YesNo;
    return {
      tag: q.tag,
      label: q.label,
      anchor: anchorOf(q.key),
      done:
        a === "no" || (a === "yes" && filled(String(m?.[q.detailKey] ?? ""))),
    };
  });
  const group = (
    key: ProfileGroup["key"],
    title: string,
    items: ProfileItem[],
  ): ProfileGroup => ({
    key,
    title,
    items,
    answered: items.filter((x) => x.done).length,
  });
  return [
    group("operator", "Operator", operator),
    group("installation", "Installation", installation),
    group("plan", "Summary of the monitoring plan", plan),
    group("questions", "Yes / no questions", questions),
  ];
}
