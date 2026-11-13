import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { db } from "../src/lib/db";
import { account, admin, call, cleanup } from "./helpers";

// No AI provider: the review falls back to its "unavailable" warning, so clean cells go to the team.
// bun runs every test file in one process, so the old value is put back for the Cera tests that follow.
const provider = process.env.CERTRACE_CERA_PROVIDER;
beforeAll(() => {
  process.env.CERTRACE_CERA_PROVIDER = "none";
});
afterAll(async () => {
  if (provider === undefined) delete process.env.CERTRACE_CERA_PROVIDER;
  else process.env.CERTRACE_CERA_PROVIDER = provider;
  await cleanup();
});

const clean = {
  "cbam:0:a-i9": "2026-01-01",
  "cbam:0:a-l9": "2026-12-31",
  "cbam:0:c-h26": "120.5",
};
const fill = (cookie: string, installationId: string) =>
  call(
    `/api/v1/workbooks/${installationId}/2026/cells`,
    "PATCH",
    { cells: clean },
    cookie,
  );
const submit = (cookie: string, installationId: string) =>
  call(
    "/api/v1/preverifications",
    "POST",
    { installationId, year: 2026, standardId: "cbam" },
    cookie,
  );
/** Uses already spent: rows that reached the team, on other installations of the same company. */
const spend = (companyId: string, n: number) =>
  db.preverifications.createMany({
    data: Array.from({ length: n }, (_, i) => ({
      company_id: companyId,
      installation_id: `spent-${i}`,
      year: 2026,
      standard_id: "cbam",
      status: "approved",
      workbook_revision: 1,
      ai_findings: [],
      submitted_by: companyId,
    })),
  });

describe("pre-verification submit (PostgreSQL)", () => {
  test("the fourth charged submission is refused with 402, before any AI call", async () => {
    // The plan includes three for the whole company; a new installation or year does not reset it.
    const a = await account();
    await spend(a.user.id, 3);
    await fill(a.cookie, "plant-a");
    const r = await submit(a.cookie, "plant-a");
    expect(r.status).toBe(402);
    expect((await r.json()).detail.code).toBe("QUOTA_EXCEEDED");
  });

  test("credits an admin grants raise the quota, and the grant is audited", async () => {
    // A sales-managed top-up must let the customer submit again without a code change.
    const a = await account();
    const boss = await admin();
    await spend(a.user.id, 3);
    await fill(a.cookie, "plant-b");
    const grant = await call(
      "/api/admin/preverifications/credits",
      "POST",
      { companyId: a.user.id, add: 2, note: "invoice 42" },
      boss.cookie,
    );
    expect(grant.status).toBe(200);
    expect((await grant.json()).credits).toBe(2);
    const r = await submit(a.cookie, "plant-b");
    expect(r.status).toBe(200);
    const view = await (
      await call(
        "/api/v1/preverifications?installationId=plant-b&year=2026&standardId=cbam",
        "GET",
        undefined,
        a.cookie,
      )
    ).json();
    expect(view.quota).toBe(5);
    expect(view.used).toBe(4);
    const audit = await db.account_audit_events.findFirst({
      where: { user_id: a.user.id, event: "preverification.credits_granted" },
    });
    expect(audit).not.toBeNull();
  });

  test("a customer cannot grant credits", async () => {
    const a = await account();
    const r = await call(
      "/api/admin/preverifications/credits",
      "POST",
      { companyId: a.user.id, add: 5, note: "" },
      a.cookie,
    );
    expect(r.status).toBe(403);
  });

  test("two submits racing for the last use: only one is charged", async () => {
    // Without the lock both pass the early check during the AI review and usage ends above the quota.
    const a = await account();
    await spend(a.user.id, 2);
    await fill(a.cookie, "plant-c");
    await fill(a.cookie, "plant-d");
    const results = await Promise.all([
      submit(a.cookie, "plant-c"),
      submit(a.cookie, "plant-d"),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 402]);
    const charged = await db.preverifications.count({
      where: { company_id: a.user.id, status: { not: "ai_flagged" } },
    });
    expect(charged).toBe(3);
  });
  test("marking a file reviewed keeps a pending submission decidable and lists the file", async () => {
    // A review is Certrace's note on a file, not a data change; it must not mark the submission stale.
    const a = await account();
    const boss = await admin();
    await call(
      "/api/v1/workbooks/plant-r/2026/meta",
      "PUT",
      {
        meta: {
          status: "ready",
          files: [
            {
              id: "inv",
              name: "inv.pdf",
              size: 10,
              type: "application/pdf",
              description: "Fuel invoices",
            },
          ],
        },
      },
      a.cookie,
    );
    await fill(a.cookie, "plant-r");
    const submitted = await (await submit(a.cookie, "plant-r")).json();
    expect(submitted.status).toBe("team_review");
    const review = await call(
      `/api/admin/workbooks/${a.user.id}/plant-r/2026/files/inv/review`,
      "PUT",
      { reviewed: true },
      boss.cookie,
    );
    expect(review.status).toBe(200);
    const detail = await (
      await call(
        `/api/admin/preverifications/${submitted.id}`,
        "GET",
        undefined,
        boss.cookie,
      )
    ).json();
    expect(detail.stale).toBe(false);
    expect(detail.files).toHaveLength(1);
    expect(detail.files[0].name).toBe("inv.pdf");
    expect(typeof detail.files[0].reviewedAt).toBe("string");
  });
});

describe("workbook files (PostgreSQL)", () => {
  const base = "/api/v1/workbooks/plant-f/2026";
  const file = (id: string, extra = {}) => ({
    id,
    name: `${id}.pdf`,
    size: 10,
    type: "application/pdf",
    description: "Fuel invoices",
    ...extra,
  });

  test("two people adding files at once both keep theirs", async () => {
    // putMeta replaces the whole list; the append route locks the row so neither upload is lost.
    const a = await account();
    await call(
      base + "/meta",
      "PUT",
      { meta: { status: "ready", files: [file("a")] } },
      a.cookie,
    );
    const [r1, r2] = await Promise.all([
      call(base + "/files", "POST", { files: [file("b")] }, a.cookie),
      call(base + "/files", "POST", { files: [file("c")] }, a.cookie),
    ]);
    expect([r1.status, r2.status]).toEqual([200, 200]);
    const wb = await (await call(base, "GET", undefined, a.cookie)).json();
    expect(wb.meta.files.map((f: { id: string }) => f.id).sort()).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  test("only an admin marks a file reviewed; a customer's reviewedAt is ignored", async () => {
    // The green dots tell the customer Certrace checked the file, so the customer cannot set them.
    const a = await account();
    const boss = await admin();
    await call(
      base + "/meta",
      "PUT",
      {
        meta: {
          status: "ready",
          files: [file("x", { reviewedAt: "2026-01-01T00:00:00.000Z" })],
        },
      },
      a.cookie,
    );
    let wb = await (await call(base, "GET", undefined, a.cookie)).json();
    expect(wb.meta.files[0].reviewedAt).toBeUndefined();

    const path = `/api/admin/workbooks/${a.user.id}/plant-f/2026/files/x/review`;
    expect((await call(path, "PUT", { reviewed: true }, a.cookie)).status).toBe(
      403,
    );
    expect(
      (await call(path, "PUT", { reviewed: true }, boss.cookie)).status,
    ).toBe(200);
    wb = await (await call(base, "GET", undefined, a.cookie)).json();
    expect(typeof wb.meta.files[0].reviewedAt).toBe("string");

    // A later customer save keeps the stored review instead of dropping it.
    await call(
      base + "/meta",
      "PUT",
      { meta: { status: "ready", files: [file("x")] } },
      a.cookie,
    );
    wb = await (await call(base, "GET", undefined, a.cookie)).json();
    expect(typeof wb.meta.files[0].reviewedAt).toBe("string");
  });
});
