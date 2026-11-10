import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { db } from "../src/lib/db";
import { account, cleanup } from "./helpers";
import { sendLegalUpdateNotices } from "../scripts/notify-legal-update";

const savedDelivery = process.env.CERTRACE_EMAIL_DELIVERY;

beforeAll(() => {
  // "off" makes sendEmail a no-op, so the test exercises the send path without mail.
  process.env.CERTRACE_EMAIL_DELIVERY = "off";
});

afterAll(async () => {
  if (savedDelivery === undefined) delete process.env.CERTRACE_EMAIL_DELIVERY;
  else process.env.CERTRACE_EMAIL_DELIVERY = savedDelivery;
  await cleanup();
});

describe("legal update notice script", () => {
  test("dry run counts every active user and sends nothing", async () => {
    await account(true);
    await account(true);
    const active = await db.users.count({ where: { status: "ACTIVE" } });

    const result = await sendLegalUpdateNotices({ dry: true });

    expect(result).toEqual({ recipients: active, failed: 0 });
  });

  test("a legal notice never writes a once-delivery row, so later versions still reach users", async () => {
    await account(true);
    const before = await db.email_deliveries.count({
      where: { kind: "legal_updated" },
    });

    const first = await sendLegalUpdateNotices({ dry: false });
    const second = await sendLegalUpdateNotices({ dry: false });

    const after = await db.email_deliveries.count({
      where: { kind: "legal_updated" },
    });
    expect(first.failed).toBe(0);
    expect(second).toEqual(first);
    expect(after).toBe(before);
  });
});
