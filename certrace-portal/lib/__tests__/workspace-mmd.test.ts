/* The MMD's three cards, and the rules that make each one answerable.

   These pin the behaviour the card split exists for: an electricity meter must
   not satisfy a fuel's instrument requirement, a CEMS must carry its QAL2
   record, and on-site generation cannot be finalised without confirming its
   fuel is declared. Each of those was unenforceable when instruments were one
   undifferentiated list. */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  directMethodSummary,
  electricityInstrument,
  emptyGap,
  emptyMeasurement,
  emptyMmd,
  isOwnGeneration,
  migrateMmd,
  mmdIssues,
  nextRowMethod,
  type MeasurementMethodRow,
  type WorkspaceMmdContent,
} from "../workspace-mmd";

const base = (
  over: Partial<WorkspaceMmdContent> = {},
): WorkspaceMmdContent => ({
  ...emptyMmd("2026-01-01", "2026-12-31"),
  ...over,
});

const fieldsOf = (c: WorkspaceMmdContent) => mmdIssues(c).map((i) => i.field);
const has = (c: WorkspaceMmdContent, field: string) =>
  fieldsOf(c).includes(field);

/* ── The split ─────────────────────────────────────────────── */

test("an electricity meter does not satisfy a declared fuel", () => {
  const c = base({
    fuelTypeIds: ["natural_gas"],
    fuelInstruments: [],
    electricitySupply: "grid_pea",
    electricityInstruments: [
      {
        ...electricityInstrument(),
        instrument: "PEA meter",
        readingFrequency: "monthly",
        lastCalibration: "2026-03-01",
      },
    ],
  });
  assert.ok(has(c, "fuelInstruments"), "the fuel card is still incomplete");
});

test("no fuel declared means no fuel instrument is demanded", () => {
  // A plant that burns nothing has nothing to meter. Demanding a row from it
  // would be a gate it cannot pass.
  const c = base({ fuelTypeIds: [], fuelInstruments: [] });
  assert.equal(has(c, "fuelInstruments"), false);
});

test("setting an electricity supply demands a meter for it", () => {
  const c = base({ electricitySupply: "grid_pea", electricityInstruments: [] });
  assert.ok(has(c, "electricityInstruments"));
});

test("no supply set means no electricity meter is demanded", () => {
  const c = base({ electricitySupply: "", electricityInstruments: [] });
  assert.equal(has(c, "electricityInstruments"), false);
});

/* ── Data gaps — per-gap reviewer and gap date, not one shared field ── */

test("a freshly added gap is missing both a reviewer of record and a date reviewed", () => {
  const c = base({
    dataGaps: [
      {
        ...emptyGap(),
        periodStart: "2026-03-01",
        periodEnd: "2026-03-15",
        reason: "Meter failed",
        estimationMethod: "Mean of Feb/Apr",
      },
    ],
  });
  const gapId = c.dataGaps[0].id;
  assert.ok(has(c, `gap:${gapId}:reviewerName`));
  assert.ok(has(c, `gap:${gapId}:gapDate`));
});

test("naming a reviewer without a date reviewed still leaves the date issue open", () => {
  const c = base({
    dataGaps: [
      {
        ...emptyGap(),
        periodStart: "2026-03-01",
        periodEnd: "2026-03-15",
        reason: "Meter failed",
        estimationMethod: "Mean of Feb/Apr",
        reviewerName: "N. Sae-Ngow",
      },
    ],
  });
  const gapId = c.dataGaps[0].id;
  assert.equal(has(c, `gap:${gapId}:reviewerName`), false, "a name was given");
  assert.ok(
    has(c, `gap:${gapId}:gapDate`),
    "a name with no date is not evidence a review happened",
  );
});

test("a gap with both a reviewer and a date reviewed raises neither issue", () => {
  const c = base({
    dataGaps: [
      {
        ...emptyGap(),
        periodStart: "2026-03-01",
        periodEnd: "2026-03-15",
        reason: "Meter failed",
        estimationMethod: "Mean of Feb/Apr",
        reviewerName: "N. Sae-Ngow",
        gapDate: "2026-04-02",
      },
    ],
  });
  const gapId = c.dataGaps[0].id;
  assert.equal(has(c, `gap:${gapId}:reviewerName`), false);
  assert.equal(has(c, `gap:${gapId}:gapDate`), false);
});

test("two gaps in the same document can each name a different reviewer of record", () => {
  const c = base({
    dataGaps: [
      {
        ...emptyGap(),
        periodStart: "2026-03-01",
        periodEnd: "2026-03-15",
        reason: "Gas meter failed",
        estimationMethod: "Mean of Feb/Apr",
        reviewerName: "Person A",
        gapDate: "2026-04-01",
      },
      {
        ...emptyGap(),
        periodStart: "2026-06-01",
        periodEnd: "2026-06-05",
        reason: "Weighbridge offline",
        estimationMethod: "Prior week's average",
        reviewerName: "Person B",
        gapDate: "2026-07-01",
      },
    ],
  });
  assert.equal(c.dataGaps[0].reviewerName, "Person A");
  assert.equal(c.dataGaps[1].reviewerName, "Person B");
  assert.equal(
    fieldsOf(c).filter(
      (f) => f.includes(":reviewerName") || f.includes(":gapDate"),
    ).length,
    0,
    "both gaps are fully reviewed, independently of each other",
  );
});

/* ── CEMS, fuels only, and PER ROW ─────────────────────────────
   Annex II B.2 of IR (EU) 2025/2547 allows calculation-based and
   measurement-based methods to be combined within one installation, one
   choice per source stream. These pin that the QAL2 demand follows the ROW
   that chose measurement, not the document. */

const cemsRow = (
  over: Partial<MeasurementMethodRow> = {},
): MeasurementMethodRow => ({
  ...emptyMeasurement("Stack CO₂", "measurement"),
  instrument: "Sick GMS840",
  readingFrequency: "continuous",
  lastCalibration: "2026-02-12",
  ...over,
});

/** A calculation-based fuel row that is complete on its own terms. */
const invoicedRow = (
  over: Partial<MeasurementMethodRow> = {},
): MeasurementMethodRow => ({
  ...emptyMeasurement("Diesel delivered", "calculation"),
  instrument: "Delivery notes, 5,000 L tank",
  readingFrequency: "per_delivery",
  lastCalibration: "2026-01-20",
  ...over,
});

test("measurement-based fuel rows must carry a QAL2 reference and a measurement point", () => {
  const c = base({
    fuelTypeIds: ["natural_gas"],
    fuelInstruments: [cemsRow()],
  });
  const fields = fieldsOf(c).join(" ");
  assert.match(fields, /:cems/, "QAL2 reference is required");
  assert.match(fields, /:point/, "measurement point is required");
});

test("a complete CEMS row raises neither", () => {
  const c = base({
    fuelTypeIds: ["natural_gas"],
    fuelInstruments: [
      cemsRow({
        cemsCalibrationRef: "QAL2-2026-0148",
        measurementPointLocation: "Stack S-1, port 8 m",
      }),
    ],
  });
  const fields = fieldsOf(c).join(" ");
  assert.doesNotMatch(fields, /:cems|:point/);
});

test("calculation-based rows are never asked for CEMS fields", () => {
  const c = base({
    fuelTypeIds: ["natural_gas"],
    fuelInstruments: [invoicedRow()],
  });
  const fields = fieldsOf(c).join(" ");
  assert.doesNotMatch(
    fields,
    /:cems|:point/,
    "a rotary gas meter has no QAL2 record",
  );
});

/* THE CASE THE CARD-LEVEL SETTING COULD NOT EXPRESS. A CEMS on the main
   furnace and a standby genset invoiced by delivery note, at the same time. */
test("one boundary can hold a measurement-based row and a calculation-based row at once", () => {
  const c = base({
    boundaryDescription: "EAF melt shop",
    processesIncluded: ["Melting (EAF)"],
    fuelTypeIds: ["natural_gas", "diesel"],
    fuelInstruments: [
      cemsRow({
        cemsCalibrationRef: "QAL2-2026-0148",
        measurementPointLocation: "Stack S-1, port 8 m",
      }),
      invoicedRow(),
    ],
    electricitySupply: "grid_pea",
    electricityMeteringPoint: "115 kV incomer, meter PEA-88214",
    electricityInstruments: [
      {
        ...electricityInstrument(),
        instrument: "PEA revenue meter",
        readingFrequency: "monthly",
        lastCalibration: "2026-01-05",
      },
    ],
    reviewerName: "N. Sae-Ngow",
    // Required by Annex II A.5(13), so a complete methodology carries one.
    diagramFileName: "rayong-line-2-boundary.pdf",
  });
  assert.deepEqual(
    mmdIssues(c),
    [],
    "a mixed boundary is complete — Annex II B.2 permits it",
  );
});

test("the calculation-based row is not dragged into the CEMS demand by its neighbour", () => {
  const c = base({
    fuelTypeIds: ["natural_gas", "diesel"],
    fuelInstruments: [cemsRow(), invoicedRow()],
  });
  const cemsIssues = mmdIssues(c).filter((i) => /:cems|:point/.test(i.field));
  assert.equal(
    cemsIssues.length,
    2,
    "only the measurement-based row owes a QAL2 reference and a measurement point",
  );
  assert.ok(
    cemsIssues.every((i) => i.field.includes(c.fuelInstruments[0].id)),
    "and both belong to the CEMS row",
  );
});

/* An electricity meter is never a CEMS, whatever its row says — the method
   describes how DIRECT emissions are determined, and there is no analyser on
   an incoming feeder. */
test("electricity rows are never asked for CEMS fields", () => {
  const c = base({
    electricitySupply: "grid_pea",
    electricityInstruments: [
      {
        ...electricityInstrument(),
        instrument: "PEA meter",
        readingFrequency: "monthly",
        lastCalibration: "2026-01-05",
        // Even set to measurement by hand, which the UI does not offer.
        directMethod: "measurement",
      },
    ],
  });
  const fields = fieldsOf(c).join(" ");
  assert.doesNotMatch(fields, /:cems|:point/);
});

/* ── What the outputs print ────────────────────────────────── */

test("the printed method describes the rows, not a single field", () => {
  assert.equal(
    directMethodSummary(base({ fuelInstruments: [invoicedRow()] })),
    "Calculation-based",
  );
  assert.equal(
    directMethodSummary(base({ fuelInstruments: [cemsRow()] })),
    "Measurement-based",
  );
  // The regulation's own units: calculation applies to source streams,
  // measurement to emission sources (Annex II B.2, Equation 4).
  assert.match(
    directMethodSummary(base({ fuelInstruments: [cemsRow(), invoicedRow()] })),
    /^Combined — 1 calculation-based source stream and 1 measurement-based emission source \(Annex II B\.2/,
  );
});

/* The diagram is a REQUIRED element of the monitoring plan — Annex II
   A.5(13) — not a Certrace convenience, which is what it was treated as
   before the Annex was read rather than summarised. */
test("a methodology with no installation diagram is not complete", () => {
  assert.ok(fieldsOf(base()).includes("diagram"));
  assert.equal(
    fieldsOf(base({ diagramFileName: "boundary.pdf" })).includes("diagram"),
    false,
  );
});

test("a new row opens on the method the previous row used", () => {
  assert.equal(nextRowMethod([], "calculation"), "calculation");
  assert.equal(
    nextRowMethod([], "measurement"),
    "measurement",
    "the document's seed answers when there is no row yet",
  );
  assert.equal(
    nextRowMethod([invoicedRow(), cemsRow()], "calculation"),
    "measurement",
    "the last row answers once there is one",
  );
});

/* ── "Other" obliges a description ──────────────────────────────
   Every closed list on this document ends in an escape hatch, and every one
   of them is only useful if the escape hatch is answered. A value saved as a
   bare "other" is a category a verifier cannot act on and Certrace cannot
   aggregate — so each pair is gated, and each is cleared by filling the box. */

const otherFields = (c: WorkspaceMmdContent) =>
  mmdIssues(c).map((i) => i.field);

/* The unanswered "Other" reports against the BOX THAT ANSWERS IT, not against
   the dropdown that opened it. Two rules pointing at one field key is how a
   form ends up marking the picker red when the empty box is underneath it. */
test('"Other fuel" selected and not described blocks; describing it clears it', () => {
  const blank = base({ fuelTypeIds: ["other"], fuelTypesOther: "" });
  assert.ok(otherFields(blank).includes("fuelTypesOther"));

  const named = base({
    fuelTypeIds: ["other"],
    fuelTypesOther: "Rice husk pellets, 14.2 MJ/kg, from Surin",
  });
  assert.equal(otherFields(named).includes("fuelTypesOther"), false);
});

test('electricity supply "Other" selected and not described blocks; describing it clears it', () => {
  const blank = base({
    electricitySupply: "other",
    electricitySupplyOther: "",
  });
  assert.ok(otherFields(blank).includes("electricitySupplyOther"));

  const named = base({
    electricitySupply: "other",
    electricitySupplyOther: "Shared 22 kV feeder, sub-metered at our boundary",
  });
  assert.equal(otherFields(named).includes("electricitySupplyOther"), false);
});

/* A fuel list that is EMPTY is not rescued by a description. The month's rows
   hold ids; a line of prose in the Other box matches none of them. */
test("at least one fuel must be picked from the list", () => {
  assert.ok(
    otherFields(
      base({ fuelTypeIds: [], fuelTypesOther: "Natural gas and diesel" }),
    ).includes("fuelTypes"),
  );
  assert.equal(
    otherFields(base({ fuelTypeIds: ["natural_gas"] })).includes("fuelTypes"),
    false,
  );
});

test('an exclusion on an "other" ground must write the ground out', () => {
  const blank = base({
    exclusions: [
      {
        id: "x1",
        process: "Boiler house",
        ground: "other",
        groundOther: "",
        note: "Meter B-4",
      },
    ],
  });
  assert.ok(otherFields(blank).includes("exclusion:x1:groundOther"));

  const written = base({
    exclusions: [
      {
        id: "x1",
        process: "Boiler house",
        ground: "other",
        groundOther: "Steam sold to the neighbouring plant",
        note: "Meter B-4",
      },
    ],
  });
  assert.equal(
    otherFields(written).includes("exclusion:x1:groundOther"),
    false,
  );
});

test('an "Other" reading frequency must say how often', () => {
  const row = {
    ...emptyMeasurement("Gas volume"),
    instrument: "Elster RVG",
    lastCalibration: "2026-03-15",
    readingFrequency: "other",
  };
  const blank = base({
    fuelTypeIds: ["natural_gas"],
    fuelInstruments: [{ ...row, id: "r1" }],
  });
  assert.ok(otherFields(blank).includes("measurement:r1:frequency"));

  const said = base({
    fuelTypeIds: ["natural_gas"],
    fuelInstruments: [
      {
        ...row,
        id: "r1",
        readingFrequencyOther: "At each ladle tap, roughly 18 times a day",
      },
    ],
  });
  assert.equal(otherFields(said).includes("measurement:r1:frequency"), false);
});

/* ── Card 3 · the double-count gate ────────────────────────── */

test("own generation is recognised from the supply category", () => {
  assert.equal(isOwnGeneration("own_gas_chp"), true);
  assert.equal(isOwnGeneration("own_solar"), true);
  assert.equal(isOwnGeneration("grid_pea"), false);
  assert.equal(isOwnGeneration("ppa_renewable"), false);
  assert.equal(isOwnGeneration(""), false);
  assert.equal(isOwnGeneration("other"), false);
});

test("on-site generation blocks until the fuel is confirmed declared", () => {
  const unconfirmed = base({
    electricitySupply: "own_gas_chp",
    ownGenerationFuelDeclared: false,
  });
  assert.ok(has(unconfirmed, "ownGenerationFuelDeclared"));

  const confirmed = base({
    electricitySupply: "own_gas_chp",
    ownGenerationFuelDeclared: true,
  });
  assert.equal(has(confirmed, "ownGenerationFuelDeclared"), false);
});

test("grid supply never raises the double-count gate", () => {
  const c = base({
    electricitySupply: "grid_pea",
    ownGenerationFuelDeclared: false,
  });
  assert.equal(has(c, "ownGenerationFuelDeclared"), false);
});

/* ── Migration ─────────────────────────────────────────────── */

test("a pre-split draft keeps its instruments, under fuels", () => {
  const legacy = {
    boundaryDescription: "x",
    measurements: [emptyMeasurement("Natural gas volume")],
  } as Parameters<typeof migrateMmd>[0];
  const c = migrateMmd(legacy, "2026-01-01", "2026-12-31");
  assert.equal(c.fuelInstruments.length, 1, "carried across");
  assert.equal(c.fuelInstruments[0].parameter, "Natural gas volume");
  assert.deepEqual(
    c.electricityInstruments,
    [],
    "electricity starts empty and seeds itself",
  );
  assert.equal(c.ownGenerationFuelDeclared, false);
});

/* THE METHOD CAME DOWN FROM THE CARD. A record written while `directMethod`
   was one value for the whole boundary has rows with none of their own, and
   reloading it must not turn a measurement-based MMD into a calculation-based
   one with its CEMS fields orphaned. */
test("a card-level directMethod migrates down onto every fuel row", () => {
  const legacy = {
    directMethod: "measurement",
    fuelTypeIds: ["natural_gas"],
    fuelInstruments: [
      {
        id: "m1",
        parameter: "Stack CO₂",
        instrument: "Sick GMS840",
        readingFrequency: "continuous",
        lastCalibration: "2026-02-12",
        factorSource: "eu_standard",
      },
      {
        id: "m2",
        parameter: "Diesel",
        instrument: "Delivery notes",
        readingFrequency: "per_delivery",
        lastCalibration: "2026-01-20",
        factorSource: "eu_standard",
      },
    ],
  } as unknown as Parameters<typeof migrateMmd>[0];

  const c = migrateMmd(legacy, "2026-01-01", "2026-12-31");
  assert.deepEqual(
    c.fuelInstruments.map((r) => r.directMethod),
    ["measurement", "measurement"],
    "both rows keep the method the document was validated against",
  );
  // And the demand it was validated against still stands on both.
  const fields = fieldsOf(c).join(" ");
  assert.match(fields, /m1:cems/);
  assert.match(fields, /m2:cems/);
});

test("a row that already carries a method keeps it — re-migrating is a no-op", () => {
  const mixed = base({
    fuelTypeIds: ["natural_gas"],
    fuelInstruments: [cemsRow({ id: "a" }), invoicedRow({ id: "b" })],
    directMethod: "measurement",
  });
  const once = migrateMmd(mixed, "2026-01-01", "2026-12-31");
  const twice = migrateMmd(once, "2026-01-01", "2026-12-31");
  assert.deepEqual(
    twice.fuelInstruments.map((r) => r.directMethod),
    ["measurement", "calculation"],
    "the card's seed does not overwrite a row that has already chosen",
  );
});

test("an old electricity row migrates to calculation, never to the card's method", () => {
  const legacy = {
    directMethod: "measurement",
    electricitySupply: "grid_pea",
    electricityInstruments: [
      {
        id: "e1",
        parameter: "Electricity consumption",
        instrument: "PEA meter",
        readingFrequency: "monthly",
        lastCalibration: "2026-01-05",
        factorSource: "eu_standard",
      },
    ],
  } as unknown as Parameters<typeof migrateMmd>[0];

  const c = migrateMmd(legacy, "2026-01-01", "2026-12-31");
  assert.equal(
    c.electricityInstruments[0].directMethod,
    "calculation",
    "a revenue meter is not a CEMS",
  );
  assert.doesNotMatch(fieldsOf(c).join(" "), /e1:cems|e1:point/);
});

test("a draft written after the split is untouched by migration", () => {
  const current = base({
    fuelInstruments: [emptyMeasurement("A")],
    electricityInstruments: [electricityInstrument()],
  });
  const c = migrateMmd(current, "2026-01-01", "2026-12-31");
  assert.equal(c.fuelInstruments.length, 1);
  assert.equal(c.electricityInstruments.length, 1);
});

test("the seeded electricity row names its own parameter", () => {
  assert.equal(electricityInstrument().parameter, "Electricity consumption");
  assert.equal(
    emptyMeasurement().parameter,
    "",
    "the fuel card does not presume one",
  );
});
