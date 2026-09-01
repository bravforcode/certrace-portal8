/* ════════════════════════════════════════════════════════════
   THE CBAM GOODS CATALOGUE — 569 CN codes, 18 aggregated goods

   Lifted from the exporter portal's own reference table
   (lib/cbam/template-reference.ts), which is itself transcribed from the
   Commission's communication workbook. It is the same list the product
   calculates against, which is the point: the free engine on the pricing
   page has to agree with the thing it is a preview of.

   WHY THE MAPPING MATTERS AND A PREFIX WOULD NOT. Chapter 72 alone holds
   crude steel, pig iron, DRI, ferro-alloys and finished steel products. A
   `startsWith("72")` would file all of them under one heading, and the
   heading decides which default values apply, which sector parameters are
   mandatory, and whether indirect emissions are reported at all. Getting it
   wrong is not a labelling error, it is a different filing.

   Codes are stored WITHOUT separators, as the workbook stores them.
   `normaliseCn` strips spaces and dots before matching, so "7207 11 90",
   "7207.11.90" and "72071190" all resolve to the same good.

   LANGUAGE. The good labels stay in English in every locale — they are the
   regulation's own nomenclature, the same rule the site already applies to
   the standards in the marquee band and to the drawn portal screens. The
   sector names around them are translated, because those are ours.
   ════════════════════════════════════════════════════════════ */

export type SectorId =
  | "steel"
  | "aluminium"
  | "cement"
  | "fertilisers"
  | "hydrogen"
  | "electricity";

export type CbamGood = {
  id: string;
  /** as the Commission workbook spells it */
  label: string;
  sector: SectorId;
  /** tonnes for everything except electricity, which is MWh */
  unit: "t" | "MWh";
  /** every eight-digit CN code that resolves to this good */
  codes: string[];
};

/* Codes travel as one space-separated string per good and are split once at
   module load — 569 quoted array entries is a great deal of punctuation to
   ship, and to read, for no gain. */
const RAW: { id: string; label: string; sector: SectorId; unit: "t" | "MWh"; codes: string }[] = [
  {
    id: "cement",
    label: "Cement",
    sector: "cement",
    unit: "t",
    codes: "25232100 25232900 25239000",
  },
  {
    id: "cement_clinker",
    label: "Cement clinker",
    sector: "cement",
    unit: "t",
    codes: "25231000",
  },
  {
    id: "calcined_clays",
    label: "Calcined clays",
    sector: "cement",
    unit: "t",
    codes: "25070080",
  },
  {
    id: "aluminous_cement",
    label: "Aluminous cement",
    sector: "cement",
    unit: "t",
    codes: "25233000",
  },
  {
    id: "iron_or_steel_products",
    label: "Iron or steel products",
    sector: "steel",
    unit: "t",
    codes:
      "72051000 72052100 72052900 72081000 72082500 72082600 72082700 " +
      "72083600 72083700 72083800 72083900 72084000 72085120 72085191 " +
      "72085198 72085210 72085291 72085299 72085310 72085390 72085400 " +
      "72089020 72089080 72091500 72091610 72091690 72091710 72091790 " +
      "72091810 72091891 72091899 72092500 72092610 72092690 72092710 " +
      "72092790 72092810 72092890 72099020 72099080 72101100 72101220 " +
      "72101280 72102000 72103000 72104100 72104900 72105000 72106100 " +
      "72106900 72107010 72107080 72109030 72109040 72109080 72111300 " +
      "72111400 72111900 72112320 72112330 72112380 72112900 72119020 " +
      "72119080 72121010 72121090 72122000 72123000 72124020 72124080 " +
      "72125020 72125030 72125040 72125061 72125069 72125090 72126000 " +
      "72131000 72132000 72139110 72139120 72139141 72139149 72139170 " +
      "72139190 72139910 72139990 72141000 72142000 72143000 72149110 " +
      "72149190 72149910 72149931 72149939 72149950 72149971 72149979 " +
      "72149995 72151000 72155011 72155019 72155080 72159000 72161000 " +
      "72162100 72162200 72163110 72163190 72163211 72163219 72163291 " +
      "72163299 72163310 72163390 72164010 72164090 72165010 72165091 " +
      "72165099 72166110 72166190 72166900 72169110 72169180 72169900 " +
      "72171010 72171031 72171039 72171050 72171090 72172010 72172030 " +
      "72172050 72172090 72173041 72173049 72173050 72173090 72179020 " +
      "72179050 72179090 72191100 72191210 72191290 72191310 72191390 " +
      "72191410 72191490 72192110 72192190 72192210 72192290 72192300 " +
      "72192400 72193100 72193210 72193290 72193310 72193390 72193410 " +
      "72193490 72193510 72193590 72199020 72199080 72201100 72201200 " +
      "72202021 72202029 72202041 72202049 72202081 72202089 72209020 " +
      "72209080 72210010 72210090 72221111 72221119 72221181 72221189 " +
      "72221910 72221990 72222011 72222019 72222021 72222029 72222031 " +
      "72222039 72222081 72222089 72223051 72223091 72223097 72224010 " +
      "72224050 72224090 72230011 72230019 72230091 72230099 72251100 " +
      "72251910 72251990 72253010 72253030 72253090 72254012 72254015 " +
      "72254040 72254060 72254090 72255020 72255080 72259100 72259200 " +
      "72259900 72261100 72261910 72261980 72262000 72269120 72269191 " +
      "72269199 72269200 72269910 72269930 72269970 72271000 72272000 " +
      "72279010 72279050 72279095 72281020 72281050 72281090 72282010 " +
      "72282091 72282099 72283020 72283041 72283049 72283061 72283069 " +
      "72283070 72283089 72284010 72284090 72285020 72285040 72285061 " +
      "72285069 72285080 72286020 72286080 72287010 72287090 72288000 " +
      "72292000 72299020 72299050 72299090 73011000 73012000 73021010 " +
      "73021022 73021028 73021040 73021050 73021090 73023000 73024000 " +
      "73029000 73030010 73030090 73041100 73041910 73041930 73041990 " +
      "73042200 73042300 73042400 73042910 73042930 73042990 73043120 " +
      "73043180 73043950 73043982 73043983 73043988 73044100 73044983 " +
      "73044985 73044989 73045110 73045181 73045189 73045930 73045982 " +
      "73045983 73045989 73049000 73051100 73051200 73051900 73052000 " +
      "73053100 73053900 73059000 73061100 73061900 73062100 73062900 " +
      "73063012 73063018 73063041 73063049 73063072 73063077 73063080 " +
      "73064020 73064080 73065021 73065029 73065080 73066110 73066192 " +
      "73066199 73066910 73066990 73069000 73071110 73071190 73071910 " +
      "73071990 73072100 73072210 73072290 73072310 73072390 73072910 " +
      "73072980 73079100 73079210 73079290 73079311 73079319 73079391 " +
      "73079399 73079910 73079980 73081000 73082000 73083000 73084000 " +
      "73089051 73089059 73089098 73090010 73090030 73090051 73090059 " +
      "73090090 73101000 73102111 73102119 73102191 73102199 73102910 " +
      "73102990 73110011 73110013 73110019 73110030 73110091 73110099 " +
      "73181100 73181210 73181290 73181300 73181410 73181491 73181499 " +
      "73181520 73181535 73181542 73181548 73181552 73181558 73181562 " +
      "73181568 73181575 73181582 73181588 73181595 73181631 73181639 " +
      "73181640 73181660 73181692 73181699 73181900 73182100 73182200 " +
      "73182300 73182400 73182900 73261100 73261910 73261990 73262000 " +
      "73269030 73269040 73269050 73269060 73269092 73269094 73269096 " +
      "73269098",
  },
  {
    id: "crude_steel",
    label: "Crude steel",
    sector: "steel",
    unit: "t",
    codes:
      "72061000 72069000 72071111 72071114 72071116 72071190 72071210 " +
      "72071290 72071912 72071919 72071980 72072011 72072015 72072017 " +
      "72072019 72072032 72072039 72072052 72072059 72072080 72181000 " +
      "72189110 72189180 72189911 72189919 72189920 72189980 72241010 " +
      "72241090 72249002 72249003 72249005 72249007 72249014 72249018 " +
      "72249031 72249038 72249090",
  },
  {
    id: "direct_reduced_iron",
    label: "Direct reduced iron",
    sector: "steel",
    unit: "t",
    codes: "72031000 72039000",
  },
  {
    id: "pig_iron",
    label: "Pig iron",
    sector: "steel",
    unit: "t",
    codes: "72011011 72011019 72011030 72011090 72012000 72015010 72015090",
  },
  {
    id: "alloys",
    label: "Alloys (FeMn, FeCr, FeNi)",
    sector: "steel",
    unit: "t",
    codes:
      "72021120 72021180 72021900 72024110 72024190 72024910 72024950 " +
      "72024990 72026000",
  },
  {
    id: "sintered_ore",
    label: "Sintered Ore",
    sector: "steel",
    unit: "t",
    codes: "26011200",
  },
  {
    id: "hydrogen",
    label: "Hydrogen",
    sector: "hydrogen",
    unit: "t",
    codes: "28041000",
  },
  {
    id: "ammonia",
    label: "Ammonia",
    sector: "fertilisers",
    unit: "t",
    codes: "28141000 28142000",
  },
  {
    id: "nitric_acid",
    label: "Nitric acid",
    sector: "fertilisers",
    unit: "t",
    codes: "28080000",
  },
  {
    id: "urea",
    label: "Urea",
    sector: "fertilisers",
    unit: "t",
    codes: "31021010 31021090",
  },
  {
    id: "mixed_fertilisers",
    label: "Mixed fertilisers",
    sector: "fertilisers",
    unit: "t",
    codes:
      "28342100 31022100 31022900 31023010 31023090 31024010 31024090 " +
      "31025000 31026000 31028000 31029000 31051000 31052010 31052090 " +
      "31053000 31054000 31055100 31055900 31059020 31059080",
  },
  {
    id: "aluminium_products",
    label: "Aluminium products",
    sector: "aluminium",
    unit: "t",
    codes:
      "76031000 76032000 76041010 76041090 76042100 76042910 76042990 " +
      "76051100 76051900 76052100 76052900 76061130 76061150 76061191 " +
      "76061193 76061199 76061211 76061219 76061230 76061250 76061292 " +
      "76061293 76061299 76069100 76069200 76071111 76071119 76071190 " +
      "76071910 76071990 76072010 76072091 76072099 76081000 76082020 " +
      "76082081 76082089 76090000 76101000 76109010 76109090 76110000 " +
      "76121000 76129020 76129030 76129080 76130000 76141000 76149000 " +
      "76161000 76169100 76169910 76169990",
  },
  {
    id: "unwrought_aluminium",
    label: "Unwrought aluminium",
    sector: "aluminium",
    unit: "t",
    codes: "76011010 76011090 76012030 76012040 76012080",
  },
  {
    id: "electricity",
    label: "Electricity (export to EU)",
    sector: "electricity",
    unit: "MWh",
    codes: "27160000",
  },
];

export const CBAM_GOODS: CbamGood[] = RAW.map((g) => ({
  ...g,
  codes: g.codes.split(" ").filter(Boolean),
}));

/** Every CN code in the annex, in numeric order. */
export const ALL_CN_CODES: string[] = CBAM_GOODS.flatMap((g) => g.codes).sort();

const INDEX: Record<string, CbamGood> = Object.fromEntries(
  CBAM_GOODS.flatMap((g) => g.codes.map((c) => [c, g] as const)),
);

/** Anything a person might type — spaces, dots, dashes — down to eight digits. */
export const normaliseCn = (input: string): string =>
  String(input ?? "").replace(/[^0-9]/g, "").slice(0, 8);

/** The good a CN code belongs to, or null if it is not a CBAM good at all. */
export function lookupCn(input: string): CbamGood | null {
  return INDEX[normaliseCn(input)] ?? null;
}

/** Type-ahead: codes starting with what has been typed so far. */
export function suggestCn(input: string, limit = 8): { code: string; good: CbamGood }[] {
  const digits = normaliseCn(input);
  if (!digits) return [];
  const out: { code: string; good: CbamGood }[] = [];
  for (const code of ALL_CN_CODES) {
    if (code.startsWith(digits)) {
      out.push({ code, good: INDEX[code] });
      if (out.length >= limit) break;
    }
  }
  return out;
}

/** 7207 11 90 — grouped the way a customs declaration prints it. */
export const formatCn = (code: string): string =>
  code.length === 8 ? `${code.slice(0, 4)} ${code.slice(4, 6)} ${code.slice(6, 8)}` : code;
