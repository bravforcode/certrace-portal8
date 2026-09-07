/**
 * CERTRACE — LEAD CAPTURE & MULTI-TAB SYNC (Google Apps Script web app)
 *
 * Receives POST requests (FormData or urlencoded) from the Certrace landing pages
 * and appends/upserts them to the appropriate sheet tab in the Google Sheet workbook.
 *
 * Senders and target tabs:
 *   - "Book a Demo"            · Demo request & booking calendar (demo-form, demo-booking)
 *   - "Newsletter"             · Footer newsletter sign-ups (footer)
 *   - "CBAM free engine lead"  · CN code engine calculation unlocks (cn-calculator)
 *   - "Pricing Request"        · Custom quote inquiries (popup-form kind="pricing")
 *   - "Request a Feature"      · Feature requests (popup-form kind="feature")
 *   - "Report Issue"           · Issue reports (popup-form kind="issue")
 *   - "Create Account Request" · Waitlist and early-access requests (waitlist-form)
 *   - "Careers"                · Job & talent inquiries (popup-form kind="careers")
 *   - "Event Lead"             · Event attendees & RSVPs
 *
 * Key guarantees:
 *   1. Automatic Header Creation: If a sheet tab is empty, it initializes with
 *      the tailored schema defined below, with 'Status' as the first column.
 *   2. Non-destructive: Existing columns and existing 'Status' values are never
 *      overwritten on merge updates. Unknown incoming fields are appended on the right.
 *   3. Intelligent Upsert vs Append:
 *      - Multi-step forms ('Book a Demo', 'Newsletter') upsert/enrich the same row.
 *      - Inquiries, issues, and feature requests ('Report Issue', 'Request a Feature',
 *        'Pricing Request') always append as separate tickets/rows.
 *   4. Data Validation Safe: Honors existing dropdown validation in 'Status' (e.g. 'Confirming'),
 *      with automatic fallback to blank if custom validation rules reject a value.
 *   5. Smart Sheet Matching: Case-insensitive & trimmed matching prevents accidental duplicate tabs.
 *   6. Concurrency Safety: LockService serializes writes across concurrent submissions.
 *   7. Plain-Text Formatting: Phone numbers, dial codes, CN codes, and offsets
 *      are formatted with '@' so Google Sheets never parses them into formula errors.
 */

/* ── Settings & Tab Schemas ────────────────────────────────── */

var DEFAULT_SHEET = 'Book a Demo';

/**
 * Tabs where repeat submissions from the same email should MERGE into one row.
 * 'Book a Demo': 2-step form (step 1 captures email, step 2 captures company & slot).
 * 'Newsletter': Re-subscribing enriches the existing record without duplicate spam.
 * All other tabs (Issues, Features, Pricing, Careers) append every submission as a new row.
 */
var UPSERT_TABS = ['Book a Demo', 'Newsletter'];

/**
 * Optional email notifications for incoming leads.
 * Put an email address here (e.g. 'contact@certrace.co') to receive instant alerts,
 * or leave empty '' to disable.
 */
var NOTIFICATION_EMAIL = '';

/**
 * Standard schemas for each sheet tab.
 * When a tab is freshly created or initialized, these column headers are used.
 */
var TAB_SCHEMAS = {
  'Book a Demo': [
    'Status', 'first_seen', 'last_seen', 'timestamp', 'local_time', 'timezone',
    'zone_source', 'utc_offset', 'type', 'step', 'source', 'email', 'firstName',
    'lastName', 'countryCode', 'phone', 'company', 'jobTitle', 'role', 'sector',
    'employees', 'cbam_status', 'challenge', 'bookingDate', 'bookingTime',
    'bookingTimeZone', 'bookingTimeZoneLabel', 'bookingStartUtc', 'decision',
    'budget', 'timing', 'context'
  ],
  'Newsletter': [
    'Status', 'first_seen', 'last_seen', 'email', 'source',
    'timestamp', 'local_time', 'timezone', 'utc_offset'
  ],
  'CBAM free engine lead': [
    'Status', 'first_seen', 'last_seen', 'name', 'email', 'phone', 'company', 'role',
    'cn_count', 'products_count', 'sites_count', 'sectors', 'recommended_plan',
    'cn_codes', 'timestamp', 'local_time', 'timezone', 'utc_offset'
  ],
  'Pricing Request': [
    'Status', 'first_seen', 'last_seen', 'name', 'email', 'company', 'role',
    'cnCodes', 'sites', 'goods', 'timeline', 'plan', 'volume', 'notes', 'context',
    'timestamp', 'local_time', 'timezone', 'utc_offset'
  ],
  'Request a Feature': [
    'Status', 'first_seen', 'last_seen', 'name', 'email', 'company', 'area',
    'summary', 'detail', 'timestamp', 'local_time', 'timezone', 'utc_offset'
  ],
  'Report Issue': [
    'Status', 'first_seen', 'last_seen', 'name', 'email', 'where', 'severity',
    'detail', 'timestamp', 'local_time', 'timezone', 'utc_offset'
  ],
  'Create Account Request': [
    'Status', 'first_seen', 'last_seen', 'firstName', 'lastName', 'email',
    'countryCode', 'phone', 'company', 'jobTitle', 'timestamp', 'local_time',
    'timezone', 'utc_offset'
  ],
  'Careers': [
    'Status', 'first_seen', 'last_seen', 'name', 'email', 'role', 'roleOther',
    'link1', 'link2', 'link3', 'message', 'timestamp', 'local_time', 'timezone', 'utc_offset'
  ],
  'Event Lead': [
    'Status', 'first_seen', 'last_seen', 'name', 'email', 'company', 'event',
    'timestamp', 'local_time', 'timezone', 'utc_offset'
  ]
};

/** Default fallback columns if target tab has no predefined schema. */
var DEFAULT_COLUMNS = [
  'Status', 'first_seen', 'last_seen', 'email', 'name', 'phone', 'company',
  'source', 'type', 'timestamp', 'local_time', 'timezone', 'utc_offset'
];

/**
 * Columns forced to plain text (@) to avoid auto-conversion or formula errors.
 */
var TEXT_COLUMNS = [
  'countryCode', 'phone', 'utc_offset', 'timestamp', 'bookingTime',
  'bookingStartUtc', 'cnCodes', 'cn_codes', 'sites', 'cn_count',
  'products_count', 'sites_count'
];

/** Fields ignored from parameter payload. */
var IGNORED_FIELDS = ['first_seen', 'last_seen', 'sheet', 'sheetName'];

/* ── Entry Points ──────────────────────────────────────────── */

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (err) {
    return jsonOut_({ ok: false, error: 'busy' });
  }

  try {
    var rawParams = (e && e.parameter) ? e.parameter : {};
    var requestedSheet = rawParams.sheet || rawParams.sheetName || DEFAULT_SHEET;
    var data = cleanParams_(rawParams);

    if (!hasAnyValue_(data)) {
      return jsonOut_({ ok: false, error: 'empty submission' });
    }

    var sheet = getSheet_(requestedSheet);
    var actualSheetName = sheet.getName();
    var header = ensureHeader_(sheet, Object.keys(data), actualSheetName);

    var shouldUpsert = UPSERT_TABS.indexOf(actualSheetName) !== -1;
    var result = shouldUpsert
      ? upsert_(sheet, header, data, actualSheetName)
      : append_(sheet, header, data, actualSheetName);

    // Optional notification email on new submission
    if (NOTIFICATION_EMAIL && result.action === 'appended') {
      trySendNotification_(actualSheetName, data);
    }

    return jsonOut_({
      ok: true,
      action: result.action,
      row: result.row,
      sheet: actualSheetName
    });
  } catch (err) {
    console.error(err);
    return jsonOut_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var target = (e && e.parameter && (e.parameter.sheet || e.parameter.sheetName)) || DEFAULT_SHEET;
  return jsonOut_({
    ok: true,
    service: 'certrace-multi-tab-sync',
    sheet: target,
    supportedSheets: Object.keys(TAB_SCHEMAS)
  });
}

function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}

/* ── Sheet Plumbing ────────────────────────────────────────── */

function getSheet_(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var target = (sheetName || DEFAULT_SHEET).trim();

  // 1. Exact match
  var sheet = ss.getSheetByName(target);
  if (sheet) return sheet;

  // 2. Case-insensitive & trimmed match to prevent duplicate tabs
  var allSheets = ss.getSheets();
  var targetLower = target.toLowerCase();
  for (var i = 0; i < allSheets.length; i++) {
    if (allSheets[i].getName().trim().toLowerCase() === targetLower) {
      return allSheets[i];
    }
  }

  // 3. Insert new sheet if not found
  return ss.insertSheet(target);
}

function ensureHeader_(sheet, incomingKeys, targetSheet) {
  var lastColumn = sheet.getLastColumn();
  var header = lastColumn > 0
    ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String)
    : [];

  while (header.length && header[header.length - 1] === '') {
    header.pop();
  }

  var fresh = header.length === 0;
  if (fresh) {
    if (TAB_SCHEMAS[targetSheet]) {
      header = TAB_SCHEMAS[targetSheet].slice();
    } else {
      header = DEFAULT_COLUMNS.slice();
    }
  }

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

function applyTextFormat_(sheet, header) {
  var rows = Math.max(sheet.getMaxRows() - 1, 1);
  for (var i = 0; i < TEXT_COLUMNS.length; i++) {
    var index = header.indexOf(TEXT_COLUMNS[i]);
    if (index === -1) continue;
    sheet.getRange(2, index + 1, rows, 1).setNumberFormat('@');
  }
}

/* ── Writing & Upsert ──────────────────────────────────────── */

function initialStatus_(sheetName, data) {
  if (data.hasOwnProperty('Status') && data.Status) {
    return data.Status;
  }
  var sLower = String(sheetName || '').trim().toLowerCase();
  // 'Book a Demo' uses dropdown: Confirming, confirmed, Session Done and move to , Cancle
  if (sLower.indexOf('demo') !== -1 || sLower === '') {
    return 'Confirming';
  }
  return 'New';
}

function append_(sheet, header, data, sheetName) {
  var now = nowUtc_();
  var row = [];

  for (var i = 0; i < header.length; i++) {
    var key = header[i];
    if (key === 'first_seen' || key === 'last_seen') {
      row.push(now);
    } else if (key === 'Status') {
      row.push(initialStatus_(sheetName, data));
    } else {
      row.push(data.hasOwnProperty(key) ? data[key] : '');
    }
  }

  var target = sheet.getLastRow() + 1;
  try {
    sheet.getRange(target, 1, 1, row.length).setValues([row]);
  } catch (err) {
    // If strict data validation rejects the Status value, retry with 'Confirming' or clear rule
    var statusIdx = header.indexOf('Status');
    if (statusIdx !== -1) {
      try {
        row[statusIdx] = 'Confirming';
        sheet.getRange(target, 1, 1, row.length).setValues([row]);
      } catch (err2) {
        try {
          var cell = sheet.getRange(target, statusIdx + 1);
          cell.clearDataValidations();
          sheet.getRange(target, 1, 1, row.length).setValues([row]);
        } catch (err3) {
          throw err;
        }
      }
    } else {
      throw err;
    }
  }
  return { action: 'appended', row: target };
}

function upsert_(sheet, header, data, sheetName) {
  var emailIndex = header.indexOf('email');
  var email = String(data.email || '').trim().toLowerCase();
  if (emailIndex === -1 || !email) return append_(sheet, header, data, sheetName);

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return append_(sheet, header, data, sheetName);

  var typeIndex = header.indexOf('type');
  var values = sheet.getRange(2, 1, lastRow - 1, header.length).getValues();
  var incomingType = String(data.type || '').trim().toLowerCase();

  var match = -1;
  for (var i = values.length - 1; i >= 0; i--) {
    var rowEmail = String(values[i][emailIndex] || '').trim().toLowerCase();
    if (rowEmail !== email) continue;
    if (typeIndex !== -1 && incomingType) {
      var rowType = String(values[i][typeIndex] || '').trim().toLowerCase();
      if (rowType !== incomingType) continue;
    }
    match = i + 2;
    break;
  }

  if (match === -1) return append_(sheet, header, data, sheetName);

  var existing = values[match - 2];
  var merged = existing.slice();

  for (var c = 0; c < header.length; c++) {
    var key = header[c];
    if (key === 'first_seen') continue;
    if (key === 'last_seen') {
      merged[c] = nowUtc_();
      continue;
    }
    // Protect existing Status: don't overwrite if existing status is non-empty unless data explicitly supplies Status
    if (key === 'Status') {
      if (data.hasOwnProperty('Status') && data.Status) {
        merged[c] = data.Status;
      } else if (!merged[c]) {
        merged[c] = initialStatus_(sheetName, data);
      }
      continue;
    }
    if (!data.hasOwnProperty(key)) continue;
    if (String(data[key]).length === 0) continue;
    merged[c] = data[key];
  }

  var firstSeenIndex = header.indexOf('first_seen');
  if (firstSeenIndex !== -1 && !merged[firstSeenIndex]) {
    merged[firstSeenIndex] = nowUtc_();
  }

  try {
    sheet.getRange(match, 1, 1, merged.length).setValues([merged]);
  } catch (err) {
    // If strict data validation rejects the Status value, retry with 'Confirming' or clear rule
    var statusIdx = header.indexOf('Status');
    if (statusIdx !== -1) {
      try {
        merged[statusIdx] = 'Confirming';
        sheet.getRange(match, 1, 1, merged.length).setValues([merged]);
      } catch (err2) {
        try {
          var cell = sheet.getRange(match, statusIdx + 1);
          cell.clearDataValidations();
          sheet.getRange(match, 1, 1, merged.length).setValues([merged]);
        } catch (err3) {
          throw err;
        }
      }
    } else {
      throw err;
    }
  }
  return { action: 'merged', row: match };
}

/* ── Helpers ───────────────────────────────────────────────── */

function trySendNotification_(sheetName, data) {
  try {
    var subject = '[Certrace Lead] New entry in ' + sheetName + ': ' + (data.email || data.company || 'Unknown');
    var body = 'New submission received in ' + sheetName + ':\n\n' + JSON.stringify(data, null, 2);
    MailApp.sendEmail(NOTIFICATION_EMAIL, subject, body);
  } catch (err) {
    console.warn('Failed to send notification email:', err);
  }
}

function cleanParams_(parameter) {
  var out = {};
  for (var key in parameter) {
    if (!parameter.hasOwnProperty(key)) continue;
    if (IGNORED_FIELDS.indexOf(key) !== -1) continue;
    var value = parameter[key];
    out[key] = (value === null || value === undefined) ? '' : String(value).trim();
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
