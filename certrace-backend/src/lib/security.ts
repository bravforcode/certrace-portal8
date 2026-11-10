import {
  createHash,
  randomBytes,
  pbkdf2Sync,
  timingSafeEqual,
} from "node:crypto";
import { db } from "./db";
import { fail } from "./errors";
export const hash = (value: string | Uint8Array) =>
  createHash("sha256").update(value).digest("hex");
export const token = () => randomBytes(32).toString("base64url");
export async function verifyPassword(password: string, stored: string) {
  if (stored.startsWith("pbkdf2_sha256$")) {
    const [, iterations, salt, digest] = stored.split("$");
    if (!iterations || !salt || !digest) return false;
    const rounds = Number(iterations);
    if (!Number.isInteger(rounds) || rounds < 1 || rounds > 2000000)
      return false;
    const actual = pbkdf2Sync(
      password,
      Buffer.from(salt, "hex"),
      rounds,
      32,
      "sha256",
    );
    const expected = Buffer.from(digest, "hex");
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  }
  try {
    return await Bun.password.verify(password, stored);
  } catch {
    return false;
  }
}
export async function rateLimit(key: string, limit: number, seconds = 60) {
  const now = new Date();
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO rate_limits(key,count,expires_at) VALUES (${hash(key)},1,${new Date(+now + seconds * 1000)})
    ON CONFLICT(key) DO UPDATE SET
      count = CASE WHEN rate_limits.expires_at < ${now} THEN 1 ELSE rate_limits.count + 1 END,
      expires_at = CASE WHEN rate_limits.expires_at < ${now} THEN EXCLUDED.expires_at ELSE rate_limits.expires_at END
    RETURNING count`;
  if ((rows[0]?.count ?? limit + 1) > limit)
    fail(429, "RATE_LIMITED", "Too many attempts. Please try again later.");
}
