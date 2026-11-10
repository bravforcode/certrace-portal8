/* The double-division regression, pinned.

   Both conventions must land on the same indirect SEE. A legacy 0.45 MWh/t
   value at 10,500 t of output and a new 4,725 MWh absolute value describe the
   same installation, so with the same grid factor they must produce the same
   0.2249550 tCO₂e/t — and the number must never be divided by output twice. */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readElectricity,
  ELEC_UNIT_FIELD,
  OUTPUT_FIELD,
  stampElectricityUnit,
  planElectricityMigration,
} from "../electricity-migration";
import { toAbsoluteMWh, UnitError } from "../units";

const Q_PROD = 10_500;
const EF = 0.4999; // tCO₂/MWh — Thailand grid, EGAT/TGO 2023
const EXPECTED_SEE_IND = 0.224955;

const seeInd = (mwhAbsolute: number, production: number) =>
  (mwhAbsolute * EF) / production;

test("legacy MWh/t and new absolute MWh produce the same indirect SEE", () => {
  const legacy = {
    "rebar::elec-consumed": "0.45",
    "rebar::production-output": String(Q_PROD),
    // no unit tag at all — this is what "collected before the change" looks like
  };
  const migrated = {
    "rebar::elec-consumed": "4725",
    "rebar::production-output": String(Q_PROD),
    [`rebar::${ELEC_UNIT_FIELD}`]: "MWh_absolute",
  };

  const a = readElectricity(legacy, "rebar");
  const b = readElectricity(migrated, "rebar");

  assert.equal(a.legacy, true);
  assert.equal(b.legacy, false);
  assert.equal(a.mwhAbsolute, 4725);
  assert.equal(b.mwhAbsolute, 4725);

  assert.ok(Math.abs(seeInd(a.mwhAbsolute!, Q_PROD) - EXPECTED_SEE_IND) < 1e-6);
  assert.ok(Math.abs(seeInd(b.mwhAbsolute!, Q_PROD) - EXPECTED_SEE_IND) < 1e-6);
});

test("a per-tonne value is never divided by production a second time", () => {
  // The bug: 0.45 MWh/t treated as absolute, then divided by 10,500.
  const wrong = seeInd(0.45, Q_PROD);
  assert.ok(
    wrong < EXPECTED_SEE_IND / 1000,
    "the old path understates by ~4 orders of magnitude",
  );

  const reading = readElectricity(
    {
      "rebar::elec-consumed": "0.45",
      [`rebar::${OUTPUT_FIELD}`]: String(Q_PROD),
    },
    "rebar",
  );
  assert.equal(reading.mwhAbsolute, 4725);
  assert.notEqual(reading.mwhAbsolute, 0.45);
});

test("a legacy value with no output to convert with is blocked, not guessed", () => {
  const reading = readElectricity({ "rebar::elec-consumed": "0.45" }, "rebar");
  assert.equal(reading.blockedOnOutput, true);
  assert.equal(reading.mwhAbsolute, null);
});

test("toAbsoluteMWh refuses a legacy conversion without production", () => {
  assert.throws(() => toAbsoluteMWh(0.45, "MWh_per_tonne", 0), UnitError);
  assert.equal(toAbsoluteMWh(4725, "MWh_absolute", 0), 4725);
});

test("stamping the unit takes a value out of the migration plan", () => {
  const products = [{ id: "rebar", name: "Reinforcing bar (rebar)" }];
  const values: Record<string, string> = {
    "rebar::elec-consumed": "0.45",
    [`rebar::${OUTPUT_FIELD}`]: String(Q_PROD),
    "rebar::elec-factor": "0.4999 tCO₂/MWh — EGAT/TGO 2023",
  };

  const before = planElectricityMigration(values, products);
  assert.equal(before.clean, false);
  assert.equal(before.rows.length, 1);
  assert.equal(before.rows[0].beforeMWhPerTonne, 0.45);
  assert.equal(before.rows[0].afterMWhAbsolute, 4725);
  assert.ok(
    Math.abs(before.rows[0].indirectPerTonne! - EXPECTED_SEE_IND) < 1e-6,
  );

  const after = planElectricityMigration(
    { ...values, ...stampElectricityUnit("rebar") },
    products,
  );
  assert.equal(after.clean, true);
});
