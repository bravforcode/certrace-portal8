import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { db } from "../src/lib/db";
import { account, cleanup } from "./helpers";
import {
  currentLegalNoticeKey,
  sendLegalUpdateNotices,
} from "../scripts/notify-legal-update";

const savedDelivery = process.env.CERTRACE_EMAIL_DELIVERY;
const keysUsed = new Set<string>();

beforeAll(() => {
  // "off" makes sendEmail a no-op, so the test exercises the send path without mail.
  process.env.CERTRACE_EMAIL_DELIVERY = "off";
});

afterAll(async () => {
  if (keysUsed.size)
    await db.email_deliveries.deleteMany({
      where: { kind: { in: [...keysUsed] } },
    });
  if (savedDelivery === undefined) delete process.env.CERTRACE_EMAIL_DELIVERY;
  else process.env.CERTRACE_EMAIL_DELIVERY = savedDelivery;
  await cleanup();
});

async function pendingFor(key: string) {
  return db.users.count({
    where: { status: "ACTIVE", email_deliveries: { none: { kind: key } } },
  });
}

describe("legal update notice script", () => {
  test("dry run counts only users without a row for this version and sends nothing", async () => {
    await account(true);
    const key = await currentLegalNoticeKey();
    keysUsed.add(key);
    const expected = await pendingFor(key);
    const rowsBefore = await db.email_deliveries.count({
      where: { kind: key },
    });

    const result = await sendLegalUpdateNotices({ dry: true });

    expect(result).toEqual({ key, recipients: expected, sent: 0, failed: 0 });
    expect(await db.email_deliveries.count({ where: { kind: key } })).toBe(
      rowsBefore,
    );
  });

  test("a second real run sends nothing", async () => {
    await account(true);
    const key = await currentLegalNoticeKey();
    keysUsed.add(key);
    const expected = await pendingFor(key);

    const first = await sendLegalUpdateNotices({ dry: false });
    const second = await sendLegalUpdateNotices({ dry: false });

    expect(first).toEqual({
      key,
      recipients: expected,
      sent: expected,
      failed: 0,
    });
    expect(second).toEqual({ key, recipients: 0, sent: 0, failed: 0 });
  });

  test("a new legal version gets a new key, so the script sends again", async () => {
    // A new version is passed as its own key rather than flipping is_current, which
    // would change the current legal documents for every suite sharing this database.
    const newKey = `legal_updated:test-${crypto.randomUUID()}`;
    keysUsed.add(newKey);
    const expected = await db.users.count({ where: { status: "ACTIVE" } });

    const result = await sendLegalUpdateNotices({ dry: false, key: newKey });

    expect(expected).toBeGreaterThanOrEqual(1);
    expect(result).toEqual({
      key: newKey,
      recipients: expected,
      sent: expected,
      failed: 0,
    });
    expect(await sendLegalUpdateNotices({ dry: false, key: newKey })).toEqual({
      key: newKey,
      recipients: 0,
      sent: 0,
      failed: 0,
    });
  });
});
