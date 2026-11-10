import { afterAll, describe, expect, test } from "bun:test";
import { account, call, cleanup } from "./helpers";

afterAll(cleanup);

describe("login", () => {
  // A universal password lets anyone who learns it sign in as any customer.
  // Run with CERTRACE_MASTER_PASSWORD set on the command line: config is read at import.
  test("CERTRACE_MASTER_PASSWORD no longer signs in to another account", async () => {
    const a = await account();
    const r = await call("/api/auth/login", "POST", {
      email: a.email,
      password: "universal-password-1",
    });
    expect(r.status).toBe(401);
  });
});
