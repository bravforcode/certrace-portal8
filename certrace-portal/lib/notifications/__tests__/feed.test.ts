/* ════════════════════════════════════════════════════════════
   THE BELL'S RULES

   When each situation notifies, who it is from, and what a click does. The rule that matters most is
   the last: about the reader's work it goes somewhere, from Certrace or the system it opens a message —
   and never both, never neither.
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
g.window = { localStorage: storage, dispatchEvent: () => true };
g.localStorage = storage;

const { buildFeed, DEADLINE_TIERS, HAPPENED_DAYS } = await import("../feed");
const { sampleDashboard } = await import(
  "../../cbam/__tests__/fixtures/dashboard-sample"
);
const { UPDATES } = await import("../../cera/updates");
const { ANNOUNCEMENTS } = await import("../announcements");
const { PREF_DEFAULTS, ALL_ON } = await import("../../notification-prefs");
const { deviceFrom } = await import("../events");

type Input = Parameters<typeof buildFeed>[0];
const NOW = new Date("2026-10-26T09:00:00Z");

const input = (over: Partial<Input> = {}): Input => ({
  now: NOW,
  dash: sampleDashboard(NOW),
  trial: { onTrial: false },
  caps: [],
  planName: "Standard",
  events: [],
  updates: UPDATES,
  announcements: ANNOUNCEMENTS,
  prefs: ALL_ON,
  ...over,
});

test("every notice either goes somewhere or says something — never both, never neither", () => {
  const feed = buildFeed(input());
  assert.ok(feed.length > 5, "the fixture provides several actionable notices");
  for (const n of feed) {
    assert.ok(
      Boolean(n.href) !== Boolean(n.message),
      `${n.id} must have exactly one of href and message`,
    );
  }
});

test("about the reader's work a click goes to the page; from Certrace it opens a message", () => {
  const feed = buildFeed(input());
  const work = feed.filter(
    (n) =>
      n.id.startsWith("month:") ||
      n.id.startsWith("invite:") ||
      n.id.startsWith("concern:"),
  );
  const certrace = feed.filter(
    (n) =>
      n.id.startsWith("news:") ||
      n.id.startsWith("deadline:") ||
      n.id.startsWith("product:"),
  );
  assert.ok(work.length > 0 && certrace.length > 0);
  assert.ok(work.every((n) => n.href && !n.message));
  assert.ok(certrace.every((n) => n.message && !n.href));
});

test("a late month does not create a bell notice", () => {
  const dash = sampleDashboard(NOW);
  const feed = buildFeed(input({ dash }));
  assert.ok(
    dash.actions.some((a) => a.type === "monthly_data" && a.daysUntilDue < 0),
  );
  assert.ok(
    feed.every(
      (n) => !n.id.startsWith("month:") && !n.id.startsWith("months:"),
    ),
  );
});

test("the worst things come first, and things that merely happened come last, newest first", () => {
  const feed = buildFeed(input());
  const ranks = feed.map((n) => n.rank);
  assert.deepEqual(
    ranks,
    [...ranks].sort((a, b) => a - b),
  );
  const info = feed.filter((n) => n.rank === 3);
  const times = info.map((n) => n.at);
  assert.deepEqual(times, [...times].sort().reverse());
});

test("a group that is switched off is not drawn — except security, which cannot be", () => {
  const events = [
    {
      id: "sign_in:1",
      kind: "sign_in" as const,
      at: NOW.toISOString(),
      detail: "Chrome · macOS",
    },
  ];
  const on = buildFeed(input({ events }));
  assert.ok(on.some((n) => n.group === "regulation"));
  assert.ok(on.some((n) => n.group === "security"));

  const off = buildFeed(
    input({
      events,
      prefs: {
        ...ALL_ON,
        regulation: false,
        suppliers: false,
        security: false,
      },
    }),
  );
  assert.ok(!off.some((n) => n.group === "regulation"));
  assert.ok(!off.some((n) => n.group === "suppliers"));
  assert.ok(
    off.some((n) => n.group === "security"),
    "security stays on whatever the saved choices say",
  );
});

test("product announcements are off until somebody turns them on", () => {
  assert.equal(PREF_DEFAULTS.product, false);
  const quiet = buildFeed(input({ prefs: PREF_DEFAULTS }));
  assert.ok(!quiet.some((n) => n.group === "product"));
  const loud = buildFeed(input({ prefs: ALL_ON }));
  assert.ok(loud.some((n) => n.group === "product"));
});

test("the declaration date speaks once per step of the countdown, not once a day", () => {
  const at = (days: number) => ({
    ...sampleDashboard(NOW),
    daysToDeadline: days,
  });
  const id = (days: number) =>
    buildFeed(input({ dash: at(days) })).find((n) =>
      n.id.startsWith("deadline:"),
    )?.id;
  assert.equal(id(340), "deadline:365");
  assert.equal(id(300), "deadline:365");
  assert.equal(id(269), "deadline:270");
  assert.equal(id(31), "deadline:60");
  assert.equal(id(30), "deadline:30");
  assert.equal(id(1), "deadline:1");
  assert.equal(
    id(400),
    undefined,
    "more than a year out there is nothing to say",
  );
  assert.ok(
    DEADLINE_TIERS.every((t, i, a) => i === 0 || a[i - 1] > t),
    "the steps run down",
  );
  const tone = (days: number) =>
    buildFeed(input({ dash: at(days) })).find((n) =>
      n.id.startsWith("deadline:"),
    );
  assert.equal(tone(200)?.tone, "info");
  assert.equal(tone(200)?.rank, 3);
  assert.equal(tone(60)?.tone, "warn");
  assert.equal(tone(60)?.rank, 1);
  assert.equal(tone(20)?.tone, "err");
  assert.equal(tone(20)?.rank, 0);
});

test("the trial speaks at 14, 7, 3 and 1 days, and when it has ended; an account on a plan hears nothing of it", () => {
  const trial = (daysLeft: number, ended = false) => ({
    onTrial: true as const,
    ended,
    daysUsed: 30 - daysLeft,
    daysLeft,
    totalDays: 30,
    startedOn: NOW,
    endsOn: NOW,
    fraction: 0.5,
  });
  const get = (t: Input["trial"]) =>
    buildFeed(input({ trial: t })).find((n) => n.id.startsWith("trial:"));
  assert.equal(get({ onTrial: false }), undefined);
  assert.equal(
    get(trial(25)),
    undefined,
    "twenty-five days left is not worth a notice",
  );
  assert.equal(get(trial(14))?.id, "trial:14");
  assert.equal(get(trial(5))?.id, "trial:7");
  assert.equal(get(trial(2))?.id, "trial:3");
  assert.equal(get(trial(1))?.id, "trial:1");
  assert.equal(get(trial(1))?.tone, "err");
  const ended = get(trial(0, true));
  assert.equal(ended?.id, "trial:ended");
  assert.equal(ended?.rank, 0);
  assert.ok(ended?.message?.cta?.href === "/billing");
});

test("a limit on the plan is a message once it is reached, never before — and seats are the team page's", () => {
  const cap = (
    key: "cnCodes" | "sites" | "years" | "seats",
    used: number,
    limit: number | null,
  ) => ({
    key,
    used,
    cap: limit,
    atCap: limit != null && used >= limit,
    overCap: limit != null && used > limit,
    label: `${used}/${limit}`,
    fraction: limit ? Math.min(1, used / limit) : 0,
  });
  const feed = buildFeed(
    input({
      caps: [
        cap("cnCodes", 5, 5),
        cap("sites", 1, 3),
        cap("seats", 3, 3),
        cap("years", 2, null),
      ],
    }),
  );
  const caps = feed.filter((n) => n.id.startsWith("cap:"));
  assert.deepEqual(
    caps.map((n) => n.id),
    ["cap:cnCodes:5"],
  );
  assert.ok(caps[0].message?.cta?.href === "/billing");
  assert.equal(caps[0].group, "billing");
});

test("what has happened is news for two weeks, and a sign-in for a month", () => {
  const dash = sampleDashboard(NOW);
  const old = {
    ...dash,
    activity: dash.activity.map((e, i) => ({
      ...e,
      at: new Date(
        NOW.getTime() - (HAPPENED_DAYS + 1 + i) * 86_400_000,
      ).toISOString(),
    })),
  };
  const feed = buildFeed(input({ dash: old }));
  assert.ok(
    !feed.some((n) => n.kind === "event" && !n.id.startsWith("package:")),
    "activity older than a fortnight is not in the bell",
  );

  const day = 86_400_000;
  const events = [
    {
      id: "sign_in:new",
      kind: "sign_in" as const,
      at: new Date(NOW.getTime() - 2 * day).toISOString(),
      detail: "Chrome · macOS",
    },
    {
      id: "sign_in:old",
      kind: "sign_in" as const,
      at: new Date(NOW.getTime() - 40 * day).toISOString(),
      detail: "Safari · iOS",
    },
  ];
  const ids = buildFeed(input({ events })).map((n) => n.id);
  assert.ok(ids.includes("sign_in:new"));
  assert.ok(!ids.includes("sign_in:old"));
});

test("rule changes are news for about six weeks after they land and two weeks before, and read as the digest does", () => {
  const news = buildFeed(input()).filter((n) => n.id.startsWith("news:"));
  assert.ok(news.length > 0 && news.length <= 5);
  for (const n of news) {
    const u = UPDATES.find((x) => x.id === n.updateId);
    assert.ok(u, "each is an entry of the rules digest");
    const days =
      (new Date(`${u.date}T09:00:00Z`).getTime() - NOW.getTime()) / 86_400_000;
    assert.ok(days >= -46 && days <= 15, `${u.id} is ${days} days away`);
    assert.equal(n.message?.cta?.ask, "What's new in CBAM?");
    assert.equal(n.group, "regulation");
  }
  // nothing from 2025 is news in 2026-10
  assert.ok(!news.some((n) => n.updateId === "simplification-2025"));
});

test("a pile of unbound documents is one notice; a few are named", () => {
  const dash = sampleDashboard(NOW);
  const doc = dash.actions.find((a) => a.type === "document_unbound");
  assert.ok(doc);
  const many = {
    ...dash,
    actions: [
      ...dash.actions,
      ...Array.from({ length: 5 }, (_, i) => ({
        ...doc,
        label: `Doc ${i} — uploaded, needs binding`,
        say: undefined,
        deepLink: `/workspaces/ws${i}/mmd`,
      })),
    ],
  };
  const feed = buildFeed(input({ dash: many }));
  assert.equal(feed.filter((n) => n.id.startsWith("doc-unbound:")).length, 1);
  assert.equal(feed.find((n) => n.id === "doc-unbound:many")?.title.vars?.n, 6);
  const few = buildFeed(input());
  assert.ok(
    few.some(
      (n) => n.id.startsWith("doc-unbound:") && n.id !== "doc-unbound:many",
    ),
  );
});

test("one situation is one notice: ids are unique", () => {
  const ids = buildFeed(input()).map((n) => n.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("a worry in the chain is a notice, but late months and stale invitations are left to the action queue", () => {
  const dash = sampleDashboard(NOW);
  const feed = buildFeed(input({ dash }));
  const concerns = feed.filter((n) => n.concern);
  assert.ok(concerns.length <= 4);
  assert.ok(
    concerns.every(
      (n) =>
        ![
          "late_months",
          "precursor_stale",
          "months_to_send",
          "low_completeness",
        ].includes(n.concern!.kind),
    ),
  );
  assert.ok(concerns.every((n) => n.concern!.severity !== "low"));
  assert.equal(
    new Set(concerns.map((n) => n.concern!.partyId)).size,
    concerns.length,
    "a party with several worries is one notice",
  );
});

test("a sign-in names the machine, not the person", () => {
  assert.equal(
    deviceFrom(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    ),
    "Chrome · macOS",
  );
  assert.equal(
    deviceFrom(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    ),
    "Safari · iOS",
  );
  assert.equal(
    deviceFrom(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36 Edg/130.0",
    ),
    "Edge · Windows",
  );
  assert.equal(deviceFrom(""), "");
});

test("late months stay out of the bell whether they are individual or grouped", () => {
  const dash = sampleDashboard(NOW);
  const base = dash.actions.find(
    (a) => a.type === "monthly_data" && a.daysUntilDue < 0,
  );
  assert.ok(base);
  const mk = (month: string, days: number) => ({
    ...base,
    workspaceId: "ws-x",
    workspaceLabel: "Cold-rolled coil",
    daysUntilDue: -days,
    label: `${month} data`,
    deepLink: `/workspaces/ws-x/monthly/${month}`,
  });
  const many = {
    ...dash,
    actions: [
      mk("2026-03", 194),
      mk("2026-04", 164),
      mk("2026-05", 133),
      mk("2026-06", 103),
    ],
  };
  const feed = buildFeed(input({ dash: many }));
  const grouped = feed.filter(
    (n) => n.id.startsWith("months:") || n.id.startsWith("month:"),
  );
  assert.equal(grouped.length, 0);

  const two = { ...dash, actions: [mk("2026-03", 194), mk("2026-04", 164)] };
  const each = buildFeed(input({ dash: two })).filter((n) =>
    n.id.startsWith("month:"),
  );
  assert.equal(each.length, 0);
});
