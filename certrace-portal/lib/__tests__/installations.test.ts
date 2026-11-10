/* ════════════════════════════════════════════════════════════
   ONE RECORD PER SITE, AND NOBODY ELSE'S IDENTITY IN IT

   The installation reference is the record's key: `saveInstallation` upserts
   BY reference, so any code path that seeds a new record from the wrong one
   does not merely pre-fill a field — it hands two sites the same key and lets
   the second silently replace the first. A year of workspaces stays pointed at
   the reference and quietly describes a different plant.

   That failure has been fixed once already, for the exporter's own site (see
   the `emptyInstallation` comment in lib/installations.ts). These pin it shut:
   a blank record is blank, a supplier's plant carries the supplier's identity
   and never the exporter's, and the record a workspace fabricates when the
   store has never seen it takes its ownership from the workspace.
   ════════════════════════════════════════════════════════════ */

import { test } from "node:test";
import assert from "node:assert/strict";

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(k: string) {
    return this.map.has(k) ? this.map.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
  clear() {
    this.map.clear();
  }
}

const g = globalThis as unknown as { window?: unknown; localStorage?: unknown };
const storage = new MemoryStorage();
g.window = { localStorage: storage };
g.localStorage = storage;

const {
  emptyInstallation,
  getInstallation,
  installationForWorkspace,
  installationsForSupplier,
  listInstallations,
  ownInstallations,
  referenceError,
  referenceTaken,
  saveInstallation,
} = await import("../installations");
const { getOrgIdentity } = await import("../org");

const filled = (
  over: Partial<Awaited<ReturnType<typeof emptyInstallation>>> = {},
) => ({
  ...emptyInstallation(false),
  id: "TH-SOMEWHERE-01",
  name: "A plant",
  street: "1 Road",
  postcode: "20000",
  city: "A town",
  country: "TH",
  unlocode: "THABC",
  lat: "13.0",
  lng: "100.0",
  ...over,
});

/* ── A blank record is blank ────────────────────────────────── */

test("a new own installation carries no reference and no company name", () => {
  storage.clear();
  storage.setItem(
    "certrace:profile",
    JSON.stringify({
      companyName: "Exporter Ltd",
      installationId: "TH-EXPORTER-01",
      jurisdiction: "TH",
    }),
  );
  const blank = emptyInstallation(true);
  const org = getOrgIdentity();

  assert.equal(
    blank.id,
    "",
    "the reference is the record's key — it is never seeded",
  );
  assert.notEqual(
    blank.id,
    org.installationId,
    "and specifically never the org profile's operator reference",
  );
  assert.equal(blank.name, "", "a company is not an installation");
  assert.notEqual(blank.name, org.name);
  assert.equal(blank.self, true);
  assert.equal(blank.supplierId, "", "an own site never points at a supplier");
  // Country is the one seeded field, because it backs a <Select>.
  assert.equal(blank.country, org.origin);
});

test("a new supplier installation carries nothing of the exporter's", () => {
  storage.clear();
  storage.setItem(
    "certrace:profile",
    JSON.stringify({
      companyName: "Exporter Ltd",
      installationId: "TH-EXPORTER-01",
      jurisdiction: "TH",
    }),
  );
  const blank = emptyInstallation(false);
  const org = getOrgIdentity();

  assert.equal(blank.id, "");
  assert.notEqual(blank.id, org.installationId);
  assert.equal(blank.name, "");
  assert.equal(blank.self, false);
});

/* ── THE REGRESSION: own site, then a supplier's, one session ── */

test("an own site and a supplier's site are two records with two references", () => {
  storage.clear();

  const own = saveInstallation(
    filled({
      id: "TH-RAYONG-01",
      name: "Rayong Works Line 2",
      self: true,
      city: "Rayong",
      economicActivity: "EAF billet casting",
    }),
  );

  // The supplier's plant is created next, in the same session, exactly as the
  // Suppliers page and the new-workspace flow do it.
  const supplierBlank = {
    ...emptyInstallation(false),
    supplierId: "sup-gjsteel",
  };
  assert.equal(
    supplierBlank.id,
    "",
    "the form opens with an EMPTY reference, not the site just saved",
  );
  assert.notEqual(supplierBlank.id, own.id);
  assert.equal(supplierBlank.name, "", "nor the name");

  const theirs = saveInstallation({
    ...filled({
      ...supplierBlank,
      id: "TH-CHONBURI-77",
      name: "G J Steel Chonburi Mill",
      city: "Chonburi",
      economicActivity: "Hot rolling",
    }),
    supplierId: "sup-gjsteel",
  });

  assert.equal(
    listInstallations().length,
    2,
    "two sites, two records — neither overwrote the other",
  );
  assert.notEqual(theirs.id, own.id);
  assert.notEqual(theirs.name, own.name);

  const readBack = getInstallation("TH-CHONBURI-77")!;
  assert.equal(
    readBack.name,
    "G J Steel Chonburi Mill",
    "the supplier record does not read back as the exporter's",
  );
  assert.equal(readBack.self, false);
  assert.equal(readBack.supplierId, "sup-gjsteel");
  // Every identity field is the supplier's own, not a copy of the site above.
  assert.equal(readBack.city, "Chonburi");
  assert.equal(readBack.economicActivity, "Hot rolling");
  assert.notEqual(readBack.city, own.city);
  assert.equal(
    getInstallation("TH-RAYONG-01")!.name,
    "Rayong Works Line 2",
    "and the exporter's own site is untouched",
  );
  assert.equal(
    getInstallation("TH-RAYONG-01")!.economicActivity,
    "EAF billet casting",
  );

  assert.deepEqual(
    ownInstallations().map((i) => i.id),
    ["TH-RAYONG-01"],
  );
  assert.deepEqual(
    installationsForSupplier("sup-gjsteel").map((i) => i.id),
    ["TH-CHONBURI-77"],
  );
});

/* ── And a genuine duplicate is still refused ────────────────── */

test("the uniqueness check still catches two records that really do share a reference", () => {
  storage.clear();
  saveInstallation(
    filled({ id: "TH-RAYONG-01", name: "Rayong Works Line 2", self: true }),
  );

  assert.equal(referenceTaken("TH-RAYONG-01"), true);
  assert.match(
    referenceError("TH-RAYONG-01", "TH")!,
    /already belongs to another installation/,
  );
  // Editing that same site does not report its own reference as taken.
  assert.equal(referenceError("TH-RAYONG-01", "TH", "TH-RAYONG-01"), null);
});

/* ── The record a workspace fabricates ──────────────────────── */

test("a workspace's blank installation takes its ownership from the workspace", () => {
  storage.clear();

  const supplierSide = installationForWorkspace({
    installationId: "TH-CHONBURI-77",
    installationName: "G J Steel Chonburi Mill",
    selfSupplied: false,
    supplierId: "sup-gjsteel",
  });
  assert.equal(
    supplierSide.id,
    "TH-CHONBURI-77",
    "the workspace's own reference, never the org profile's",
  );
  assert.equal(supplierSide.self, false);
  assert.equal(
    supplierSide.supplierId,
    "sup-gjsteel",
    "the plant still belongs to the company it belongs to",
  );

  const ownSide = installationForWorkspace({
    installationId: "TH-RAYONG-01",
    installationName: "Rayong Works Line 2",
    selfSupplied: true,
  });
  assert.equal(
    ownSide.self,
    true,
    "an own site round-tripped through this screen stays an own site",
  );
  assert.equal(ownSide.supplierId, "", "and never picks up a supplier");
});

test("a stored record wins over the fabricated one", () => {
  storage.clear();
  saveInstallation(
    filled({
      id: "TH-CHONBURI-77",
      name: "G J Steel Chonburi Mill",
      supplierId: "sup-gjsteel",
      city: "Chonburi",
    }),
  );

  const got = installationForWorkspace({
    installationId: "TH-CHONBURI-77",
    installationName: "Stale name from the workspace",
    supplierId: "sup-gjsteel",
  });
  assert.equal(
    got.name,
    "G J Steel Chonburi Mill",
    "the record on file is the answer, not the workspace's denormalised copy",
  );
  assert.equal(got.city, "Chonburi");
});

test("saving an own site through the workspace screen does not demote it", () => {
  storage.clear();
  saveInstallation(
    filled({ id: "TH-RAYONG-01", name: "Rayong Works Line 2", self: true }),
  );

  // What autosave does on that screen: read the record, write it back.
  const shown = installationForWorkspace({
    installationId: "TH-RAYONG-01",
    installationName: "Rayong Works Line 2",
    selfSupplied: true,
  });
  saveInstallation(shown);

  assert.equal(
    getInstallation("TH-RAYONG-01")!.self,
    true,
    "still one of the exporter's own sites",
  );
  assert.equal(ownInstallations().length, 1);
});
