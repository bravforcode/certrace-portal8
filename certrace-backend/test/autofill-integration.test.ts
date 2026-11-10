import { legalVersionIds } from "./fixtures/legal";
import { afterAll, describe, test, expect } from "bun:test";
import { app } from "../src/app";
import { db } from "../src/lib/db";
import { hash } from "../src/lib/security";
import { fixture } from "./fixtures/autofill";
import { saveReportBatch, listReports } from "../src/modules/reporting/service";
import {
  startRun,
  getRun,
  applyRun,
  ownedRun,
} from "../src/modules/evidence/autofill-service";
import type { AutofillResult } from "../src/modules/evidence/autofill-types";
const ids: string[] = [];
async function account() {
  const r = await app.handle(
    new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: `autofill-${crypto.randomUUID()}@example.invalid`,
        password: "test-password-123",
        ...(await legalVersionIds()),
        termsAccepted: true,
        privacyAccepted: true,
        marketingOptIn: false,
      }),
    }),
  );
  expect(r.status).toBe(201);
  const body = await r.json();
  ids.push(body.user.id);
  return body.user.id as string;
}
afterAll(async () => {
  for (const id of ids) await db.users.delete({ where: { id } });
});
describe("autofill database workflow", () => {
  test("temporary Smart upload applies reviewed values without saving the source file or a broken evidence link", async () => {
    const user = await account();
    await saveReportBatch(
      user,
      fixture().map((r) => ({ ...r, revision: 0 })),
    );
    const data = Buffer.from("March 2026 finished product produced 4,820.5 t");
    const originalKey = process.env.DEEPSEEK_API_KEY;
    try {
      process.env.DEEPSEEK_API_KEY = "test-do-not-call-provider";
      const started = await startRun(
        user,
        {
          workspaceId: "ws",
          document: {
            data,
            filename: "production.txt",
            content_type: "text/plain",
            sha256: hash(data),
          },
        },
        async (pages, targets, context) => {
          expect(pages).toEqual([{ page: 1, text: data.toString() }]);
          expect(context).not.toHaveProperty("currentDocumentEvidenceId");
          expect(context).toMatchObject({ month: "2026-03" });
          expect(
            targets.some((target) => target.path.at(-1) === "evidence"),
          ).toBe(false);
          const target = targets.find(
            (target) => target.path.at(-1) === "productionTonnes",
          )!;
          return {
            proposals: [
              {
                id: crypto.randomUUID(),
                target,
                value: 4820.5,
                original: "4,820.5",
                sourceUnit: "t",
                page: 1,
                quote: data.toString(),
                explanation: "Finished product output",
                warnings: [],
                blocked: false,
              },
            ],
            unresolved: [],
            needsVision: [],
            model: "fake-test-model",
            inputTokens: 10,
            outputTokens: 10,
          };
        },
        async (bytes, media) => {
          expect(bytes.equals(data)).toBe(true);
          expect(media).toBe("text/plain");
          return [{ page: 1, text: data.toString() }];
        },
      );
      expect(started.sourceStored).toBe(false);
      expect(await db.account_files.count({ where: { user_id: user } })).toBe(
        0,
      );
      let ready = await getRun(user, started.id);
      for (let i = 0; ready.status === "running" && i < 30; i++) {
        await Bun.sleep(10);
        ready = await getRun(user, started.id);
      }
      expect(ready.status).toBe("review");
      expect("model" in ready.result).toBe(false);
      expect("inputTokens" in ready.result).toBe(false);
      expect(ready.month).toBe("2026-03");
      expect(ready.monthInferred).toBe(true);
      await applyRun(user, started.id, [{ id: ready.result.proposals[0]!.id }]);
      const reports = await listReports(user);
      const monthly = reports.find((r) => r.key === "certrace:monthly-data")!;
      expect((monthly.value as any).ws[0].productionTonnes).toBe(4820.5);
      expect(reports.some((r) => r.key === "certrace:workspace-evidence")).toBe(
        false,
      );
      expect(await db.account_files.count({ where: { user_id: user } })).toBe(
        0,
      );
    } finally {
      if (originalKey === undefined) delete process.env.DEEPSEEK_API_KEY;
      else process.env.DEEPSEEK_API_KEY = originalKey;
    }
  }, 30_000);
  test("cache respects filename-inferred months and distinct stored evidence", async () => {
    const user = await account();
    await saveReportBatch(
      user,
      fixture().map((r) => ({ ...r, revision: 0 })),
    );
    const data = Buffer.from("Production 120 tonnes");
    const document = { data, content_type: "text/plain", sha256: hash(data) };
    const mapper = async (): Promise<AutofillResult> => ({
      proposals: [],
      unresolved: [],
      needsVision: [],
      model: "fixture",
      inputTokens: 0,
      outputTokens: 0,
    });
    const originalKey = process.env.DEEPSEEK_API_KEY;
    try {
      process.env.DEEPSEEK_API_KEY = "test-do-not-call-provider";
      const read = async (filename: string, fileId?: string) => {
        const input = fileId
          ? { fileId }
          : { document: { ...document, filename } };
        const run = await startRun(
          user,
          { workspaceId: "ws", ...input },
          mapper,
        );
        let ready = await getRun(user, run.id);
        for (let i = 0; ready.status === "running" && i < 100; i++) {
          await Bun.sleep(10);
          ready = await getRun(user, run.id);
        }
        expect(ready.status).toBe("review");
        return ready;
      };
      const jan = await read("January_2026.txt");
      const feb = await read("February_2026.txt");
      expect([jan.month, feb.month]).toEqual(["2026-01", "2026-02"]);
      expect((await read("February_2026.txt")).id).toBe(feb.id);
      for (const id of ["first", "second"]) {
        await db.account_files.create({
          data: {
            ...document,
            filename: "February_2026.txt",
            user_id: user,
            id,
          },
        });
        expect((await read("February_2026.txt", id)).fileId).toBe(id);
      }
    } finally {
      if (originalKey === undefined) delete process.env.DEEPSEEK_API_KEY;
      else process.env.DEEPSEEK_API_KEY = originalKey;
    }
  });
  test("a failed mapping stores a safe provider-specific reason for review", async () => {
    const user = await account();
    await saveReportBatch(
      user,
      fixture().map((r) => ({ ...r, revision: 0 })),
    );
    const data = Buffer.from("Finished product produced 4,820.5 t");
    const fileId = `autofill-${hash(data)}`;
    await db.account_files.create({
      data: {
        user_id: user,
        id: fileId,
        filename: "production.txt",
        content_type: "text/plain",
        data,
        sha256: hash(data),
      },
    });
    const originalKey = process.env.DEEPSEEK_API_KEY;
    try {
      process.env.DEEPSEEK_API_KEY = "test-do-not-call-provider";
      const started = await startRun(
        user,
        { workspaceId: "ws", fileId, month: "2026-03" },
        async () => {
          throw Object.assign(new Error("private provider response"), {
            statusCode: 401,
          });
        },
      );
      let run = await getRun(user, started.id);
      for (let i = 0; run.status === "running" && i < 30; i++) {
        await Bun.sleep(10);
        run = await getRun(user, started.id);
      }
      expect(run.status).toBe("failed");
      expect(run.error).toContain("contact support");
      expect(run.error).not.toContain("private provider response");
      expect(
        (await listReports(user)).some(
          (r) => r.key === "certrace:monthly-data",
        ),
      ).toBe(false);
    } finally {
      if (originalKey === undefined) delete process.env.DEEPSEEK_API_KEY;
      else process.env.DEEPSEEK_API_KEY = originalKey;
    }
  }, 30_000);
  test("reads UTF-8 account files without an OCR key and waits for review", async () => {
    const user = await account();
    await saveReportBatch(
      user,
      fixture().map((r) => ({ ...r, revision: 0 })),
    );
    const data = Buffer.from("ไฟฟ้า 120 kWh");
    const fileId = `autofill-${hash(data)}`;
    await db.account_files.create({
      data: {
        user_id: user,
        id: fileId,
        filename: "reading.txt",
        content_type: "text/plain",
        data,
        sha256: hash(data),
      },
    });
    const originalKey = process.env.DEEPSEEK_API_KEY;
    const originalOcrKey = process.env.NOVITA_API_KEY;
    try {
      process.env.DEEPSEEK_API_KEY = "test-do-not-call-provider";
      delete process.env.NOVITA_API_KEY;
      const started = await startRun(
        user,
        { workspaceId: "ws", fileId },
        async (pages) => {
          expect(pages).toEqual([{ page: 1, text: "ไฟฟ้า 120 kWh" }]);
          return {
            proposals: [],
            unresolved: ["No unambiguous destination"],
            needsVision: [],
            model: "fake-test-model",
            inputTokens: 10,
            outputTokens: 10,
          };
        },
      );
      let ready = await getRun(user, started.id);
      for (let i = 0; ready.status === "running" && i < 30; i++) {
        await Bun.sleep(10);
        ready = await getRun(user, started.id);
      }
      expect(ready.status).toBe("review");
      expect(ready.result.unresolved).toEqual(["No unambiguous destination"]);
      expect(
        (await listReports(user)).some(
          (r) => r.key === "certrace:report-inputs:v1",
        ),
      ).toBe(false);
    } finally {
      if (originalKey === undefined) delete process.env.DEEPSEEK_API_KEY;
      else process.env.DEEPSEEK_API_KEY = originalKey;
      if (originalOcrKey === undefined) delete process.env.NOVITA_API_KEY;
      else process.env.NOVITA_API_KEY = originalOcrKey;
    }
  }, 30_000);
  test("caches a reading, preserves source evidence, writes only after review, and isolates accounts", async () => {
    const user = await account();
    const other = await account();
    await saveReportBatch(
      user,
      fixture().map((r) => ({ ...r, revision: 0 })),
    );
    const data = Buffer.from("%PDF-test reading source");
    const fileId = `autofill-${hash(data)}`;
    await db.account_files.create({
      data: {
        user_id: user,
        id: fileId,
        filename: "source.pdf",
        content_type: "application/pdf",
        data,
        sha256: hash(data),
      },
    });
    let calls = 0;
    const mapper: Parameters<typeof startRun>[2] = async (pages, targets) => {
      calls++;
      expect(pages).toEqual([
        { page: 1, text: "Contact: evidence@example.com" },
      ]);
      const target = targets.find(
        (t) => t.path[1] === "0.5" && t.path.at(-1) === "email",
      )!;
      return {
        proposals: [
          {
            id: crypto.randomUUID(),
            target,
            value: "evidence@example.com",
            original: "evidence@example.com",
            sourceUnit: "",
            page: 1,
            quote: "Contact: evidence@example.com",
            explanation: "",
            warnings: [],
            blocked: false,
          },
        ],
        unresolved: [],
        needsVision: [],
        model: "fake-test-model",
        inputTokens: 10,
        outputTokens: 10,
      } satisfies AutofillResult;
    };
    const originalKey = process.env.DEEPSEEK_API_KEY;
    const originalOcrKey = process.env.NOVITA_API_KEY;
    try {
      process.env.DEEPSEEK_API_KEY = "test-do-not-call-provider";
      process.env.NOVITA_API_KEY = "test-do-not-call-provider";
      const input = {
        workspaceId: "ws",
        fileId,
      };
      const reader: Parameters<typeof startRun>[3] = async (bytes, media) => {
        expect(bytes.equals(data)).toBe(true);
        expect(media).toBe("application/pdf");
        return [{ page: 1, text: "Contact: evidence@example.com" }];
      };
      const first = await startRun(user, input, mapper, reader);
      const duplicate = await startRun(user, input, mapper, reader);
      expect(duplicate.id).toBe(first.id);
      expect(calls).toBe(1);
      let ready = await getRun(user, first.id);
      for (let i = 0; ready.status === "running" && i < 30; i++) {
        await Bun.sleep(10);
        ready = await getRun(user, first.id);
      }
      expect(ready.status).toBe("review");
      expect(
        (await listReports(user)).find(
          (r) => r.key === "certrace:report-inputs:v1",
        ),
      ).toBeUndefined();
      await expect(ownedRun(other, first.id)).rejects.toThrow();
      await expect(
        applyRun(other, first.id, [{ id: ready.result.proposals[0]!.id }]),
      ).rejects.toThrow();
      await applyRun(user, first.id, [{ id: ready.result.proposals[0]!.id }]);
      const rows = await listReports(user);
      const value = rows.find((r) => r.key === "certrace:report-inputs:v1")!
        .value as any;
      expect(value["company:self"]["0.5"].rows[0].values.email).toBe(
        "evidence@example.com",
      );
      const evidence = rows.find(
        (r) => r.key === "certrace:workspace-evidence",
      )!.value as any;
      expect(evidence.ws[0].localFileId).toBe(fileId);
      expect((await getRun(user, first.id)).status).toBe("applied");
      const revision = rows.find(
        (r) => r.key === "certrace:report-inputs:v1",
      )!.revision;
      await applyRun(user, first.id, [{ id: ready.result.proposals[0]!.id }]);
      expect(
        (await listReports(user)).find(
          (r) => r.key === "certrace:report-inputs:v1",
        )!.revision,
      ).toBe(revision);
    } finally {
      if (originalKey === undefined) delete process.env.DEEPSEEK_API_KEY;
      else process.env.DEEPSEEK_API_KEY = originalKey;
      if (originalOcrKey === undefined) delete process.env.NOVITA_API_KEY;
      else process.env.NOVITA_API_KEY = originalOcrKey;
    }
  }, 30_000);
});
