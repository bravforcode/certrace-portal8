import { afterAll, expect, spyOn, test } from "bun:test";
import { app } from "../src/app";
import { db } from "../src/lib/db";
import { legalVersionIds } from "./fixtures/legal";

/* Registration hashes the password before its transaction opens. The
   transaction has a 5 s timeout; a hash that runs inside it expires under load
   and the account is never created (a 500). The hash is slowed past that
   timeout here so the test fails if the hash ever moves back inside. */
const users: string[] = [];

afterAll(async () => {
  await db.users.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});

test("registration succeeds when hashing takes longer than the transaction timeout", async () => {
  const realHash = Bun.password.hash.bind(Bun.password);
  const slow = spyOn(Bun.password, "hash").mockImplementation(async (value) => {
    await new Promise((resolve) => setTimeout(resolve, 6_000));
    return realHash(value);
  });
  try {
    const response = await app.handle(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: `test-${crypto.randomUUID()}@example.invalid`,
          password: "test-password-123",
          ...(await legalVersionIds()),
          termsAccepted: true,
          privacyAccepted: true,
          marketingOptIn: false,
        }),
      }),
    );
    expect(response.status).toBe(201);
    users.push(((await response.json()) as { user: { id: string } }).user.id);
  } finally {
    slow.mockRestore();
  }
}, 30_000);
