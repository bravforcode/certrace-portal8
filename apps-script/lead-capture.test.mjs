/* lead-capture.gs, run in Node against in-memory fakes of the Apps Script
   services it touches (sheet, lock, cache, properties, UrlFetchApp).

   The /exec URL is public, so these cover what a stranger posting to it can
   and cannot do. Nothing here talks to Google or Resend.

     node apps-script/lead-capture.test.mjs

   The fakes are only as faithful as they need to be. The one behaviour they
   copy on purpose: getValues returns a quote-prefixed text cell WITHOUT its
   apostrophe, which is what makes the upsert re-protection test meaningful. */

import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const src = fs.readFileSync(
  process.argv[2] || new URL("./lead-capture.gs", import.meta.url),
  "utf8",
);

function makeEnv() {
  const sheets = new Map(); // name -> { cells: string[][] , formats: Map }
  const sent = [];
  const cache = new Map();
  const props = new Map([["RESEND_API_KEY", "re_test"]]);
  let resendOk = true;

  function sheetObj(name) {
    const st = sheets.get(name);
    const lastRow = () => st.cells.length;
    const lastCol = () => st.cells.reduce((m, r) => Math.max(m, r.length), 0);
    const range = (r, c, nr = 1, nc = 1) => ({
      getValues: () =>
        Array.from({ length: nr }, (_, i) =>
          Array.from({ length: nc }, (_, j) => {
            const v = (st.cells[r - 1 + i] || [])[c - 1 + j];
            // Sheets returns a quote-prefixed text cell WITHOUT the apostrophe.
            return typeof v === "string" && v.startsWith("'") ? v.slice(1) : v ?? "";
          }),
        ),
      setValues: (vals) => {
        vals.forEach((row, i) => {
          st.cells[r - 1 + i] = st.cells[r - 1 + i] || [];
          row.forEach((v, j) => (st.cells[r - 1 + i][c - 1 + j] = v));
        });
      },
      setFontWeight() {},
      setNumberFormat() {},
      clearDataValidations() {},
    });
    return {
      getName: () => name,
      getLastRow: lastRow,
      getLastColumn: lastCol,
      getMaxRows: () => 1000,
      getRange: range,
      setFrozenRows() {},
    };
  }

  const ctx = {
    console: { warn() {}, error() {}, log() {} },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({
        getSheetByName: (n) => (sheets.has(n) ? sheetObj(n) : null),
        getSheets: () => [...sheets.keys()].map(sheetObj),
        getNumSheets: () => sheets.size,
        insertSheet: (n) => {
          sheets.set(n, { cells: [] });
          return sheetObj(n);
        },
      }),
    },
    CacheService: {
      getScriptCache: () => ({
        get: (k) => cache.get(k) ?? null,
        put: (k, v) => cache.set(k, v),
        remove: (k) => cache.delete(k),
      }),
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => props.get(k) ?? null,
        setProperty: (k, v) => props.set(k, v),
      }),
    },
    Utilities: {
      formatDate: (d, _tz, fmt) => {
        const iso = d.toISOString();
        if (fmt === "yyyyMMdd") return iso.slice(0, 10).replace(/-/g, "");
        if (fmt === "yyyyMMddHH") return iso.slice(0, 13).replace(/[-T]/g, "");
        return iso.slice(0, 19) + "Z";
      },
    },
    UrlFetchApp: {
      fetch: (_url, opts) => {
        const body = JSON.parse(opts.payload);
        if (resendOk) sent.push(body);
        return { getResponseCode: () => (resendOk ? 200 : 429), getContentText: () => "" };
      },
    },
    MailApp: { sendEmail() {} },
    ContentService: {
      MimeType: { JSON: "json", TEXT: "text" },
      createTextOutput: (t) => ({ setMimeType: () => ({ text: t }) }),
    },
  };
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  const post = (params) => JSON.parse(ctx.doPost({ parameter: params }).text);
  return { ctx, sheets, sent, cache, props, post, setResend: (ok) => (resendOk = ok) };
}

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test("an unknown or hand-kept tab is refused, nothing is created", () => {
  const env = makeEnv();
  assert.equal(env.post({ sheet: "Totally New Tab", email: "a@b.co" }).error, "unknown sheet");
  assert.equal(env.post({ sheet: "Event Lead", email: "a@b.co" }).error, "unknown sheet");
  assert.equal(env.sheets.size, 0);
});

test("a form tab still works, case-insensitively, and the default is Book a Demo", () => {
  const env = makeEnv();
  assert.equal(env.post({ sheet: "careers", email: "a@b.co", name: "Ann" }).sheet, "Careers");
  assert.equal(env.post({ email: "c@d.co", type: "demo_lead" }).sheet, "Book a Demo");
});

test("formula-looking values are stored as text, also after an upsert rewrite", () => {
  const env = makeEnv();
  env.post({ sheet: "Newsletter", email: "x@y.co", source: "=IMPORTXML(\"https://evil\",\"//a\")" });
  const header = env.sheets.get("Newsletter").cells[0];
  const row = env.sheets.get("Newsletter").cells[1];
  assert.equal(row[header.indexOf("source")], "'=IMPORTXML(\"https://evil\",\"//a\")");
  // Re-subscribe merges into the same row: the old value comes back from
  // getValues without its apostrophe and must be protected again.
  env.post({ sheet: "Newsletter", email: "x@y.co" });
  const again = env.sheets.get("Newsletter").cells[1];
  assert.equal(again[header.indexOf("source")], "'=IMPORTXML(\"https://evil\",\"//a\")");
  for (const v of again) if (typeof v === "string") assert.ok(!/^[=+\-@]/.test(v), v);
});

test("text columns keep their value untouched (formatted '@' already)", () => {
  const env = makeEnv();
  env.post({ sheet: "Careers", email: "a@b.co", phone: "+66 81 234 5678" });
  const [header, row] = env.sheets.get("Careers").cells;
  // phone is not in the Careers schema, so it was appended — still a TEXT_COLUMN.
  assert.equal(row[header.indexOf("phone")], "+66 81 234 5678");
});

test("field names that are not names never become headers", () => {
  const env = makeEnv();
  env.post({ sheet: "Careers", email: "a@b.co", "=HYPERLINK(1)": "x", ["a".repeat(60)]: "y", lang: "th" });
  const header = env.sheets.get("Careers").cells[0];
  assert.ok(header.includes("lang"));
  assert.ok(!header.some((h) => h.startsWith("=") || h.length > 40));
});

test("made-up fields stop adding columns at MAX_COLUMNS", () => {
  const env = makeEnv();
  for (let i = 0; i < 10; i++) {
    const params = { sheet: "Report Issue", email: `a${i}@b.co` };
    for (let j = 0; j < 20; j++) params[`junk${i}_${j}`] = "z";
    env.post(params);
  }
  assert.equal(env.sheets.get("Report Issue").cells[0].length, 60);
});

test("values are capped in length", () => {
  const env = makeEnv();
  env.post({ sheet: "Report Issue", email: "a@b.co", detail: "x".repeat(20000) });
  const [header, row] = env.sheets.get("Report Issue").cells;
  assert.equal(row[header.indexOf("detail")].length, 5000);
});

test("confirmations stop at the hourly ceiling across different addresses", () => {
  const env = makeEnv();
  for (let i = 0; i < 40; i++) env.post({ sheet: "Report Issue", email: `victim${i}@b.co` });
  assert.equal(env.sent.length, 15);
  assert.equal(env.sheets.get("Report Issue").cells.length, 41, "every row is still written");
});

test("the daily ceiling holds across hours", () => {
  const env = makeEnv();
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  env.props.set("CONFIRMATION_BUDGET", JSON.stringify({ day: today, dayCount: 50, hour: "x", hourCount: 0 }));
  env.post({ sheet: "Report Issue", email: "a@b.co" });
  assert.equal(env.sent.length, 0);
});

test("the per-address cooldown still applies, and a refused send gives it back", () => {
  const env = makeEnv();
  env.setResend(false);
  env.post({ sheet: "Report Issue", email: "a@b.co" });
  assert.equal(env.sent.length, 0);
  env.setResend(true);
  env.post({ sheet: "Report Issue", email: "a@b.co" });
  assert.equal(env.sent.length, 1, "the failed send did not burn the cooldown");
  env.post({ sheet: "Report Issue", email: "a@b.co" });
  assert.equal(env.sent.length, 1, "inside the cooldown");
});

test("a name carrying a link or number is dropped from the greeting", () => {
  const env = makeEnv();
  env.post({ sheet: "Report Issue", email: "a@b.co", name: "Your account is locked, visit evil.com" });
  env.post({ sheet: "Report Issue", email: "b@b.co", name: "Call 02 123 4567" });
  env.post({ sheet: "Report Issue", email: "c@b.co", name: "สมชาย" });
  assert.match(env.sent[0].text, /^Hi,/);
  assert.match(env.sent[1].text, /^Hi,/);
  assert.match(env.sent[2].text, /^Hi สมชาย,/);
});

test("the booking subject carries only a date, time and zone", () => {
  const env = makeEnv();
  env.post({ email: "a@b.co", type: "demo_lead" });
  env.post({
    email: "a@b.co", type: "demo_booking", bookingDate: "2026-08-20", bookingTime: "14:00",
    bookingTimeZone: "Asia/Bangkok", bookingTimeZoneLabel: "Click https://evil.example now",
  });
  const booking = env.sent.find((m) => /2026-08-20/.test(m.subject + m.text));
  assert.ok(booking, "booking confirmation sent");
  assert.ok(!/evil/.test(booking.subject + booking.text));
  assert.match(booking.subject + booking.text, /2026-08-20 14:00 \(Asia\/Bangkok\)/);
});

let failed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    console.log("ok   ", name);
  } catch (err) {
    failed++;
    console.log("FAIL ", name, "\n     ", err.message);
  }
}
console.log(`${tests.length - failed}/${tests.length} passed`);
process.exit(failed ? 1 : 0);
