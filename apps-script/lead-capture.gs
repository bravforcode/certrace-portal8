/**
 * CERTRACE — LEAD CAPTURE (Google Apps Script web app)
 *
 * Receives the FormData posts from the landing pages and appends them to a
 * sheet. Deployed as a web app; the client posts with `mode: 'no-cors'`, so it
 * never reads the response — everything here has to succeed or fail silently
 * on its own.
 *
 * Senders and the fields they carry:
 *
 *   index.html · waitlist
 *     email, source, timestamp + timezone, zone_source, utc_offset, local_time
 *
 *   static-landing/index.html · HOOK #1 (email captured before the popup)
 *     email, source, step=email, timestamp + the four locale fields
 *
 *   static-landing/index.html · HOOK #2 (full profile)
 *     + company, role, cbam_status, challenge, step=details
 *
 *   Next landing · demo_lead / demo_booking (currently unwired — see README)
 *     firstName, lastName, countryCode, phone, company, jobTitle, sector,
 *     employees, bookingDate, bookingTime, decision, budget, timing, context
 *
 * Three things this script is careful about:
 *
 *   1. Unknown fields are never dropped. A field with no column gets one
 *      appended, so adding an input to a form does not silently lose data
 *      until someone remembers to edit this file.
 *
 *   2. Concurrent submits cannot clobber each other. Two people submitting in
 *      the same second would otherwise both read the same last row and one
 *      would overwrite the other — hence LockService.
 *
 *   3. Phone numbers survive. A bare "+66" written into a cell is parsed as a
 *      formula and lands as #ERROR!, so identifier columns are forced to
 *      plain-text format before anything is written.
 */

/* ── Settings ──────────────────────────────────────────────── */

/** Tab to write to. Created on first post if missing. */
var SHEET_NAME = 'Leads';

/**
 * Merge repeat submissions from the same person into one row instead of
 * appending a second one. Matched on email + type, so a waitlist signup and a
 * demo booking from the same person stay on separate rows. This is what makes
 * the two-step form work: step 1 creates the row, step 2 fills in the rest.
 *
 * Set to false if you would rather keep every submission as its own row.
 */
var UPSERT_ON_EMAIL = true;

/**
 * Column order for a fresh sheet. Anything the forms send that is not listed
 * here still gets a column — appended on the right, in arrival order.
 *
 * Read left to right: when it arrived, where they are, who they are, what they
 * told us, what they booked.
 */
var BASE_COLUMNS = [
  'first_seen',      // server clock, UTC — set once, never rewritten
  'last_seen',       // server clock, UTC — updated on every merge
  'timestamp',       // client clock, ISO UTC
  'local_time',      // the same moment in the lead's own zone
  'timezone',        // IANA id, e.g. Asia/Kolkata
  'zone_source',     // 'detected' | 'fallback' — see the note below
  'utc_offset',      // e.g. UTC+05:30
  'type',            // demo_lead | demo_booking | (blank for waitlist)
  'step',            // email | details
  'source',
  'email',
  'firstName',
  'lastName',
  'countryCode',
  'phone',
  'company',
  'jobTitle',
  'role',
  'sector',
  'employees',
  'cbam_status',
  'challenge',
  'bookingDate',
  'bookingTime',
  'bookingTimeZone',
  'decision',
  'budget',
  'timing',
  'context'
];

/**
 * Columns whose contents are identifiers rather than numbers. Forced to plain
 * text so "+66" stays "+66" and a phone number keeps its leading zero.
 */
var TEXT_COLUMNS = ['countryCode', 'phone', 'utc_offset', 'timestamp', 'bookingTime'];

/** Never write these to the sheet even if a client sends them. */
var IGNORED_FIELDS = ['first_seen', 'last_seen'];

/* ── Entry points ──────────────────────────────────────────── */

function doPost(e) {
  // Serialised end to end: read, decide, write. Apps Script runs concurrent
  // requests in separate executions, so without this two submissions in the
  // same moment can resolve to the same target row.
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (err) {
    return jsonOut_({ ok: false, error: 'busy' });
  }

  try {
    var data = cleanParams_(e && e.parameter ? e.parameter : {});
    if (!hasAnyValue_(data)) return jsonOut_({ ok: false, error: 'empty submission' });

    var sheet = getSheet_();
    var header = ensureHeader_(sheet, Object.keys(data));
    var result = UPSERT_ON_EMAIL ? upsert_(sheet, header, data) : append_(sheet, header, data);

    return jsonOut_({ ok: true, action: result.action, row: result.row });
  } catch (err) {
    // Surfaced in Executions (Apps Script console). The client is posting
    // no-cors and cannot see any of this.
    console.error(err);
    return jsonOut_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/** Opening the deployment URL in a browser should say something useful. */
function doGet() {
  return jsonOut_({ ok: true, service: 'certrace-lead-capture', sheet: SHEET_NAME });
}

/* ── Sheet plumbing ────────────────────────────────────────── */

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  return sheet;
}

/**
 * Return the header row, creating it or widening it as needed.
 *
 * An empty sheet gets BASE_COLUMNS. An existing sheet keeps its column order
 * untouched — reordering would silently misalign every historical row — and
 * any field with no column gets one appended on the right.
 */
function ensureHeader_(sheet, incomingKeys) {
  var lastColumn = sheet.getLastColumn();
  var header = lastColumn > 0
    ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String)
    : [];

  // Trailing blanks would make indexOf lookups land on the wrong column.
  while (header.length && header[header.length - 1] === '') header.pop();

  var fresh = header.length === 0;
  if (fresh) header = BASE_COLUMNS.slice();

  var added = [];
  for (var i = 0; i < incomingKeys.length; i++) {
    var key = incomingKeys[i];
    if (header.indexOf(key) === -1 && IGNORED_FIELDS.indexOf(key) === -1) {
      header.push(key);
      added.push(key);
    }
  }

  if (fresh || added.length) {
    sheet.getRange(1, 1, 1, header.length).setValues([header]);
  }
  if (fresh) {
    sheet.getRange(1, 1, 1, header.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  applyTextFormat_(sheet, header);
  return header;
}

/** Force identifier columns to plain text, so Sheets stops parsing them. */
function applyTextFormat_(sheet, header) {
  var rows = Math.max(sheet.getMaxRows() - 1, 1);
  for (var i = 0; i < TEXT_COLUMNS.length; i++) {
    var index = header.indexOf(TEXT_COLUMNS[i]);
    if (index === -1) continue;
    sheet.getRange(2, index + 1, rows, 1).setNumberFormat('@');
  }
}

/* ── Writing ───────────────────────────────────────────────── */

function append_(sheet, header, data) {
  var now = nowUtc_();
  var row = [];
  for (var i = 0; i < header.length; i++) {
    var key = header[i];
    if (key === 'first_seen' || key === 'last_seen') row.push(now);
    else row.push(data.hasOwnProperty(key) ? data[key] : '');
  }
  var target = sheet.getLastRow() + 1;
  sheet.getRange(target, 1, 1, row.length).setValues([row]);
  return { action: 'appended', row: target };
}

/**
 * Merge into the existing row for this email + type, or append a new one.
 *
 * Only non-empty incoming values are written, so a later submission enriches
 * the row rather than blanking the fields it does not carry — step 2 of the
 * waitlist form sends no `source`, and that must not erase step 1's.
 */
function upsert_(sheet, header, data) {
  var emailIndex = header.indexOf('email');
  var email = String(data.email || '').trim().toLowerCase();
  if (emailIndex === -1 || !email) return append_(sheet, header, data);

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return append_(sheet, header, data);

  var typeIndex = header.indexOf('type');
  var values = sheet.getRange(2, 1, lastRow - 1, header.length).getValues();
  var incomingType = String(data.type || '').trim().toLowerCase();

  var match = -1;
  for (var i = values.length - 1; i >= 0; i--) { // newest first
    var rowEmail = String(values[i][emailIndex] || '').trim().toLowerCase();
    if (rowEmail !== email) continue;
    if (typeIndex !== -1) {
      var rowType = String(values[i][typeIndex] || '').trim().toLowerCase();
      if (rowType !== incomingType) continue;
    }
    match = i + 2; // sheet row number
    break;
  }

  if (match === -1) return append_(sheet, header, data);

  var existing = values[match - 2];
  var merged = existing.slice();
  for (var c = 0; c < header.length; c++) {
    var key = header[c];
    if (key === 'first_seen') continue;               // set once, on creation
    if (key === 'last_seen') { merged[c] = nowUtc_(); continue; }
    if (!data.hasOwnProperty(key)) continue;
    if (String(data[key]).length === 0) continue;     // never blank a filled cell
    merged[c] = data[key];
  }
  // An existing sheet created before this script may have no first_seen column
  // at all; only backfill it when the column is actually there.
  var firstSeenIndex = header.indexOf('first_seen');
  if (firstSeenIndex !== -1 && !merged[firstSeenIndex]) merged[firstSeenIndex] = nowUtc_();

  sheet.getRange(match, 1, 1, merged.length).setValues([merged]);
  return { action: 'merged', row: match };
}

/* ── Helpers ───────────────────────────────────────────────── */

function cleanParams_(parameter) {
  var out = {};
  for (var key in parameter) {
    if (!parameter.hasOwnProperty(key)) continue;
    if (IGNORED_FIELDS.indexOf(key) !== -1) continue;
    var value = parameter[key];
    out[key] = value === null || value === undefined ? '' : String(value).trim();
  }
  return out;
}

function hasAnyValue_(data) {
  for (var key in data) {
    if (data.hasOwnProperty(key) && String(data[key]).length > 0) return true;
  }
  return false;
}

function nowUtc_() {
  return Utilities.formatDate(new Date(), 'UTC', "yyyy-MM-dd'T'HH:mm:ss'Z'");
}

function jsonOut_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ── Manual test ───────────────────────────────────────────────
   Run this from the editor (Run ▸ testWrite_) to check the sheet, header and
   permissions without touching the live forms. It writes a real row — delete
   it afterwards. */

function testWrite_() {
  var response = doPost({
    parameter: {
      email: 'test@example.com',
      source: 'manual_test',
      step: 'details',
      company: 'Test Co',
      countryCode: '+66',
      phone: '0812345678',
      timestamp: new Date().toISOString(),
      timezone: 'Asia/Bangkok',
      zone_source: 'detected',
      utc_offset: 'UTC+07:00',
      local_time: '15 Aug 2026, 13:28'
    }
  });
  console.log(response.getContent());
}
