import { afterAll, describe, expect, test } from "bun:test";
import path from "node:path";
import { account, cleanup } from "./helpers";
import { db } from "../src/lib/db";

afterAll(cleanup);

const script = path.resolve(import.meta.dir, "../scripts/grant-admin.ts");

// Runs the real script in a child process, the way an operator would on the server.
async function grant(email: string) {
  const proc = Bun.spawn([process.execPath, script, email], {
    env: process.env,
    stdout: "ignore",
    stderr: "ignore",
  });
  return proc.exited;
}

describe("grant-admin", () => {
  test("an unknown email exits 1", async () => {
    expect(await grant(`nobody-${crypto.randomUUID()}@example.invalid`)).toBe(1);
  });

  test("a never-approved account becomes admin, ready and approved", async () => {
    const a = await account(false);
    expect(await grant(a.email)).toBe(0);
    const u = await db.users.findUniqueOrThrow({ where: { id: a.user.id } });
    expect(u.is_admin).toBe(true);
    expect(u.ready).toBe(true);
    expect(u.approved_at).not.toBeNull();
    expect(Date.now() - u.trial_started_at.getTime()).toBeLessThan(60_000);
  });

  test("an approved account with ready=false is set ready and keeps its original approval", async () => {
    const a = await account(false);
    const original = new Date("2020-01-01T00:00:00Z");
    await db.users.update({
      where: { id: a.user.id },
      data: { approved_at: original, trial_started_at: original, ready: false },
    });
    expect(await grant(a.email)).toBe(0);
    const u = await db.users.findUniqueOrThrow({ where: { id: a.user.id } });
    expect(u.is_admin).toBe(true);
    expect(u.ready).toBe(true);
    expect(u.approved_at?.toISOString()).toBe(original.toISOString());
    expect(u.trial_started_at.toISOString()).toBe(original.toISOString());
  });
});
