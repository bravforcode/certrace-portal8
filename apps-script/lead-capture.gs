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
 *   - "Event Lead"             · Event attendees & RSVPs. No form posts here:
 *                                this tab is filled in by hand at events, and the
 *                                schema below is what those columns should be.
 *
 * Key guarantees:
 *   1. Automatic Header Creation: If a sheet tab is empty, it initializes with
 *      the tailored schema defined below, with 'Status' as the first column.
 *   2. Non-destructive: Existing columns and existing 'Status' values are never
 *      overwritten on merge updates. Unknown incoming fields are appended on the right.
 *   3. Intelligent Upsert vs Append:
 *      - Multi-step forms ('Book a Demo', 'Newsletter') upsert/enrich the same row.
 *        The demo form and the booking dialog land on ONE row per email, with
 *        'step' counting how far that lead got (see DEMO_JOURNEY).
 *      - Inquiries, issues, and feature requests ('Report Issue', 'Request a Feature',
 *        'Pricing Request') always append as separate tickets/rows.
 *   4. Data Validation Safe: Honors existing dropdown validation in 'Status' (e.g. 'Confirming'),
 *      with automatic fallback to blank if custom validation rules reject a value.
 *   5. Smart Sheet Matching: Case-insensitive & trimmed matching prevents accidental duplicate tabs.
 *   6. Concurrency Safety: LockService serializes writes across concurrent submissions.
 *   7. Plain-Text Formatting: Phone numbers, dial codes, CN codes, and offsets
 *      are formatted with '@' so Google Sheets never parses them into formula errors.
 *   8. Confirmation Email: the person who submitted gets a "we've received your
 *      details" email, in the language they read the site in (see CONFIRMATION).
 */

/* ── Settings & Tab Schemas ────────────────────────────────── */

var DEFAULT_SHEET = 'Book a Demo';

/**
 * Tabs where repeat submissions from the same email should MERGE into one row.
 * 'Book a Demo': 2-step flow (step 1 is the contact form, step 2 the booking dialog).
 * 'Newsletter': Re-subscribing enriches the existing record without duplicate spam.
 * All other tabs (Issues, Features, Pricing, Careers) append every submission as a new row.
 */
var UPSERT_TABS = ['Book a Demo', 'Newsletter'];

/**
 * The 'Book a Demo' journey, in the order a visitor walks it: the contact form
 * posts 'demo_lead', then the booking dialog posts 'demo_booking' for the same
 * person minutes later. The upsert used to require an exact 'type' match, so
 * those two posts filed one visitor as two rows. They now merge onto one row,
 * with 'type' and 'step' holding the FURTHEST stage reached — a post that
 * arrives late, or out of order, never walks the record backwards.
 */
var DEMO_JOURNEY = ['demo_lead', 'demo_booking'];

/**
 * Optional email notifications for incoming leads.
 * Put an email address here (e.g. 'contact@certrace.co') to receive instant alerts,
 * or leave empty '' to disable.
 */
var NOTIFICATION_EMAIL = '';

/**
 * Confirmation email to the person who submitted a form ("we've received your
 * details"). Sent from the Google account the web app executes as, so the
 * daily MailApp quota applies: 100 recipients/day on a personal Gmail account,
 * 1,500 on Google Workspace. When the quota runs out the email is skipped —
 * the row is still written.
 *
 *   enabled         · false turns every confirmation off without a redeploy of the pages.
 *   senderName      · the "From" name the recipient sees.
 *   replyTo         · where a reply to the confirmation lands.
 *   cooldownMinutes · the same address gets at most one email per kind in this
 *                     window. The /exec URL is public, so without it anyone could
 *                     point the endpoint at a stranger's inbox and fire it in a loop.
 */
var CONFIRMATION = {
  enabled: true,
  senderName: 'Certrace',
  replyTo: 'contact@certrace.co',
  cooldownMinutes: 10
};

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
    'timestamp', 'local_time', 'timezone', 'zone_source', 'utc_offset'
  ],
  'CBAM free engine lead': [
    'Status', 'first_seen', 'last_seen', 'name', 'email', 'phone', 'company', 'role',
    'cn_count', 'products_count', 'sites_count', 'sectors', 'recommended_plan',
    'cn_codes', 'source', 'timestamp', 'local_time', 'timezone', 'zone_source',
    'utc_offset'
  ],
  'Pricing Request': [
    'Status', 'first_seen', 'last_seen', 'name', 'email', 'company', 'role',
    'cnCodes', 'sites', 'goods', 'timeline', 'plan', 'volume', 'notes', 'context',
    'source', 'timestamp', 'local_time', 'timezone', 'zone_source', 'utc_offset'
  ],
  'Request a Feature': [
    'Status', 'first_seen', 'last_seen', 'name', 'email', 'company', 'area',
    'areaOther', 'summary', 'detail', 'source', 'timestamp', 'local_time',
    'timezone', 'zone_source', 'utc_offset'
  ],
  'Report Issue': [
    'Status', 'first_seen', 'last_seen', 'name', 'email', 'where', 'whereOther',
    'severity', 'detail', 'source', 'timestamp', 'local_time', 'timezone',
    'zone_source', 'utc_offset'
  ],
  'Create Account Request': [
    'Status', 'first_seen', 'last_seen', 'firstName', 'lastName', 'email',
    'countryCode', 'phone', 'company', 'jobTitle', 'source', 'timestamp',
    'local_time', 'timezone', 'zone_source', 'utc_offset'
  ],
  'Careers': [
    'Status', 'first_seen', 'last_seen', 'name', 'email', 'role', 'roleOther',
    'link1', 'link2', 'link3', 'message', 'source', 'timestamp', 'local_time',
    'timezone', 'zone_source', 'utc_offset'
  ],
  'Event Lead': [
    'Status', 'first_seen', 'last_seen', 'name', 'email', 'company', 'event',
    'source', 'timestamp', 'local_time', 'timezone', 'zone_source', 'utc_offset'
  ]
};

/** Default fallback columns if target tab has no predefined schema. */
var DEFAULT_COLUMNS = [
  'Status', 'first_seen', 'last_seen', 'email', 'name', 'phone', 'company',
  'source', 'type', 'timestamp', 'local_time', 'timezone', 'zone_source',
  'utc_offset'
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
  var outcome = writeSubmission_(e);
  // Sent after the lock is released: MailApp takes a second or so, and a
  // concurrent submission should not queue behind somebody else's email.
  if (outcome.confirmation) {
    trySendConfirmation_(outcome.confirmation.kind, outcome.confirmation.data);
  }
  return jsonOut_(outcome.response);
}

function writeSubmission_(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (err) {
    return { response: { ok: false, error: 'busy' } };
  }

  try {
    var rawParams = (e && e.parameter) ? e.parameter : {};
    var requestedSheet = rawParams.sheet || rawParams.sheetName || DEFAULT_SHEET;
    var data = cleanParams_(rawParams);

    if (!hasAnyValue_(data)) {
      return { response: { ok: false, error: 'empty submission' } };
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

    var kind = confirmationKind_(actualSheetName, data, result);

    return {
      response: {
        ok: true,
        action: result.action,
        row: result.row,
        sheet: actualSheetName
      },
      confirmation: kind ? { kind: kind, data: data } : null
    };
  } catch (err) {
    console.error(err);
    return { response: { ok: false, error: String(err) } };
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
  // A missing tab is created at the END of the workbook rather than wherever
  // insertSheet's default would drop it, so a tab born from a live submission
  // never lands in the middle of the hand-kept tabs.
  return findSheet_(ss, target) || ss.insertSheet(target, ss.getNumSheets());
}

/**
 * Exact match first, then case-insensitive and trimmed, so a stray 'careers'
 * or ' Newsletter' can never open a second tab beside the real one.
 */
function findSheet_(ss, target) {
  var sheet = ss.getSheetByName(target);
  if (sheet) return sheet;

  var allSheets = ss.getSheets();
  var targetLower = String(target || '').trim().toLowerCase();
  for (var i = 0; i < allSheets.length; i++) {
    if (allSheets[i].getName().trim().toLowerCase() === targetLower) {
      return allSheets[i];
    }
  }
  return null;
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

/* ── One-off Setup ─────────────────────────────────────────── */

/**
 * Brings the workbook up to date with TAB_SCHEMAS: creates any tab that is
 * missing, and writes the header row on any tab that is still empty. Tabs that
 * already hold data are left exactly as they are — this never rewrites or
 * reorders an existing header.
 *
 * Run it by hand from the Apps Script editor (Run > setupTabs) after adding a
 * schema above. The alternative is waiting for a real submission to create the
 * tab, which files somebody's actual application into an unprepared sheet.
 *
 * Safe to run as often as you like: it only ever adds what is missing.
 *
 * Note it adds no dropdown to 'Status'. Only 'Book a Demo' has one today, and
 * its list is a sales process somebody decided on; the stages a job applicant
 * or an issue moves through are the same kind of decision, so they are left to
 * be set on the sheet rather than guessed at here.
 */
function setupTabs() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var names = Object.keys(TAB_SCHEMAS);
  var created = [];
  var initialized = [];

  for (var i = 0; i < names.length; i++) {
    var name = names[i];
    var sheet = findSheet_(ss, name);
    if (!sheet) {
      sheet = ss.insertSheet(name, ss.getNumSheets());
      created.push(name);
    } else if (sheet.getLastRow() === 0) {
      initialized.push(name);
    }
    ensureHeader_(sheet, [], sheet.getName());
  }

  var report = 'setupTabs: ' +
    (created.length ? 'created ' + created.join(', ') : 'no tabs missing') +
    '; ' +
    (initialized.length ? 'wrote headers on ' + initialized.join(', ') : 'no empty tabs to initialize');
  console.log(report);
  return report;
}

/* ── Writing & Upsert ──────────────────────────────────────── */

/** 1-based position in DEMO_JOURNEY; 0 for a type that is not part of it. */
function journeyStep_(type) {
  return DEMO_JOURNEY.indexOf(String(type || '').trim().toLowerCase()) + 1;
}

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
    } else if (key === 'step' && !data.step && journeyStep_(data.type)) {
      row.push(journeyStep_(data.type));
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
      var sameJourney = journeyStep_(rowType) > 0 && journeyStep_(incomingType) > 0;
      if (rowType !== incomingType && !sameJourney) continue;
    }
    match = i + 2;
    break;
  }

  if (match === -1) return append_(sheet, header, data, sheetName);

  var existing = values[match - 2];
  var merged = existing.slice();
  var stepIndex = header.indexOf('step');
  var previousStep = stepIndex !== -1 ? (Number(existing[stepIndex]) || 0) : 0;

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
    // 'type' and 'step' record how far this lead got, so a demo_lead landing
    // after its own demo_booking must not demote the row back to step 1.
    if (key === 'type' && journeyStep_(data.type)) {
      if (journeyStep_(data.type) >= journeyStep_(merged[c])) merged[c] = data.type;
      continue;
    }
    if (key === 'step' && journeyStep_(data.type)) {
      merged[c] = Math.max(journeyStep_(data.type), Number(merged[c]) || 0);
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
  return { action: 'merged', row: match, previousStep: previousStep };
}

/* ── Confirmation Email ────────────────────────────────────── */

/**
 * What the confirmation says, per kind and language. A kind is a tab name,
 * plus 'Book a Demo:booking' for the booking dialog, which has a time to
 * repeat back. Only 'en' and 'th' are written; any other site language falls
 * back to English rather than to a machine translation nobody has read.
 *
 * In 'lines', {when} is replaced with the booked slot as the visitor saw it.
 */
var CONFIRMATION_COPY = {
  'Book a Demo': {
    en: {
      subject: 'We\'ve received your Certrace demo request',
      lines: [
        'Thanks for your interest in Certrace. We\'ve received your details.',
        'Our team will be in touch shortly to arrange your demo.'
      ]
    },
    th: {
      subject: 'เราได้รับคำขอนัดเดโม Certrace ของคุณแล้ว',
      lines: [
        'ขอบคุณที่สนใจ Certrace เราได้รับข้อมูลของคุณเรียบร้อยแล้ว',
        'ทีมงานจะติดต่อกลับเพื่อนัดหมายเดโมโดยเร็วที่สุด'
      ]
    }
  },
  'Book a Demo:booking': {
    en: {
      subject: 'Your Certrace demo request: {when}',
      lines: [
        'We\'ve received your booking request for {when}.',
        'We\'ll confirm the time and send you a calendar invite with the meeting link.'
      ]
    },
    th: {
      subject: 'คำขอนัดเดโม Certrace ของคุณ: {when}',
      lines: [
        'เราได้รับคำขอนัดหมายของคุณสำหรับ {when} แล้ว',
        'ทีมงานจะยืนยันเวลาและส่งคำเชิญในปฏิทินพร้อมลิงก์การประชุมให้คุณ'
      ]
    }
  },
  'Newsletter': {
    en: {
      subject: 'You\'re subscribed to Certrace updates',
      lines: [
        'Thanks for subscribing. You\'ll receive Certrace product and CBAM updates at this address.'
      ]
    },
    th: {
      subject: 'คุณสมัครรับข่าวสารจาก Certrace เรียบร้อยแล้ว',
      lines: [
        'ขอบคุณที่สมัครรับข่าวสาร คุณจะได้รับอัปเดตเกี่ยวกับ Certrace และ CBAM ทางอีเมลนี้'
      ]
    }
  },
  'CBAM free engine lead': {
    en: {
      subject: 'We\'ve received your details — Certrace CBAM engine',
      lines: [
        'Thanks for using the Certrace CN code engine. We\'ve received your details.',
        'Our team may reach out to walk you through your results.'
      ]
    },
    th: {
      subject: 'เราได้รับข้อมูลของคุณแล้ว — Certrace CBAM engine',
      lines: [
        'ขอบคุณที่ใช้เครื่องมือตรวจสอบรหัส CN ของ Certrace เราได้รับข้อมูลของคุณเรียบร้อยแล้ว',
        'ทีมงานอาจติดต่อกลับเพื่ออธิบายผลลัพธ์ให้คุณ'
      ]
    }
  },
  'Pricing Request': {
    en: {
      subject: 'We\'ve received your Certrace pricing request',
      lines: [
        'Thanks for your pricing request. We\'ve received your details.',
        'We\'ll prepare a quote and get back to you shortly.'
      ]
    },
    th: {
      subject: 'เราได้รับคำขอใบเสนอราคา Certrace ของคุณแล้ว',
      lines: [
        'ขอบคุณสำหรับคำขอใบเสนอราคา เราได้รับข้อมูลของคุณเรียบร้อยแล้ว',
        'ทีมงานจะจัดทำใบเสนอราคาและติดต่อกลับโดยเร็วที่สุด'
      ]
    }
  },
  'Request a Feature': {
    en: {
      subject: 'Thanks for your Certrace feature request',
      lines: [
        'We\'ve received your feature request. Every one is read by the product team.',
        'If we need more detail, we\'ll reply to this address.'
      ]
    },
    th: {
      subject: 'ขอบคุณสำหรับข้อเสนอแนะฟีเจอร์ Certrace',
      lines: [
        'เราได้รับข้อเสนอแนะฟีเจอร์ของคุณแล้ว ทีมผลิตภัณฑ์จะอ่านทุกข้อเสนอ',
        'หากต้องการข้อมูลเพิ่มเติม เราจะติดต่อกลับทางอีเมลนี้'
      ]
    }
  },
  'Report Issue': {
    en: {
      subject: 'We\'ve received your Certrace issue report',
      lines: [
        'Thanks for reporting this. We\'ve received your issue report and will look into it.',
        'If we need more detail, we\'ll reply to this address.'
      ]
    },
    th: {
      subject: 'เราได้รับรายงานปัญหา Certrace ของคุณแล้ว',
      lines: [
        'ขอบคุณที่แจ้งปัญหา เราได้รับรายงานของคุณแล้วและจะตรวจสอบโดยเร็ว',
        'หากต้องการข้อมูลเพิ่มเติม เราจะติดต่อกลับทางอีเมลนี้'
      ]
    }
  },
  'Create Account Request': {
    en: {
      subject: 'You\'re on the Certrace early-access list',
      lines: [
        'Thanks for requesting a Certrace account. We\'ve received your details.',
        'We\'ll email you as soon as your access is ready.'
      ]
    },
    th: {
      subject: 'คุณอยู่ในรายชื่อทดลองใช้ Certrace แล้ว',
      lines: [
        'ขอบคุณที่ขอเปิดบัญชี Certrace เราได้รับข้อมูลของคุณเรียบร้อยแล้ว',
        'เราจะแจ้งทางอีเมลทันทีที่บัญชีของคุณพร้อมใช้งาน'
      ]
    }
  },
  'Careers': {
    en: {
      subject: 'We\'ve received your application — Certrace',
      lines: [
        'Thanks for your interest in joining Certrace. We\'ve received your details.',
        'We review every application and will get back to you if there\'s a fit.'
      ]
    },
    th: {
      subject: 'เราได้รับใบสมัครของคุณแล้ว — Certrace',
      lines: [
        'ขอบคุณที่สนใจร่วมงานกับ Certrace เราได้รับข้อมูลของคุณเรียบร้อยแล้ว',
        'เราพิจารณาทุกใบสมัคร และจะติดต่อกลับหากตำแหน่งเหมาะสม'
      ]
    }
  }
};

var CONFIRMATION_CHROME = {
  en: { greeting: 'Hi {name},', greetingAnon: 'Hi,', signoff: 'The Certrace team',
        footer: 'You\'re receiving this because this address was entered on certrace.co. If that wasn\'t you, you can ignore this email.' },
  th: { greeting: 'สวัสดีคุณ {name}', greetingAnon: 'สวัสดี', signoff: 'ทีมงาน Certrace',
        footer: 'คุณได้รับอีเมลนี้เนื่องจากมีการกรอกอีเมลนี้บน certrace.co หากไม่ใช่คุณ สามารถละเว้นอีเมลนี้ได้' }
};

/**
 * Which confirmation, if any, a write earns. One per new submission — a
 * repeat post that merges into an existing row (a re-subscribe, a resent
 * demo form) sends nothing — with one exception: the booking dialog merges
 * into the demo form's row, but it is the step that carries a time, so it gets
 * its own email the first time the row reaches it.
 */
function confirmationKind_(sheetName, data, result) {
  if (!CONFIRMATION.enabled) return null;
  if (sheetName === 'Book a Demo' && journeyStep_(data.type) === DEMO_JOURNEY.length) {
    var firstBooking = result.action === 'appended' || (result.previousStep || 0) < DEMO_JOURNEY.length;
    return firstBooking ? 'Book a Demo:booking' : null;
  }
  if (result.action !== 'appended') return null;
  return CONFIRMATION_COPY[sheetName] ? sheetName : null;
}

function trySendConfirmation_(kind, data) {
  try {
    var email = String(data.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

    var cache = CacheService.getScriptCache();
    var cacheKey = 'confirm:' + kind + ':' + email;
    if (cache.get(cacheKey)) return;

    if (MailApp.getRemainingDailyQuota() < 1) {
      console.warn('Confirmation skipped, MailApp daily quota used up:', kind, email);
      return;
    }

    var lang = String(data.lang || '').trim().toLowerCase().split('-')[0];
    if (!CONFIRMATION_COPY[kind][lang]) lang = 'en';
    var copy = CONFIRMATION_COPY[kind][lang];
    var chrome = CONFIRMATION_CHROME[lang];

    var vars = { when: bookingWhen_(data) };
    var subject = fill_(copy.subject, vars);
    var lines = copy.lines.map(function (line) { return fill_(line, vars); });
    var name = String(data.firstName || data.name || '').trim();
    var greeting = name ? fill_(chrome.greeting, { name: name }) : chrome.greetingAnon;

    var text = [greeting, ''].concat(lines, ['', chrome.signoff, '', '—', chrome.footer]).join('\n');
    var html =
      '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:560px">' +
      '<p>' + escapeHtml_(greeting) + '</p>' +
      lines.map(function (line) { return '<p>' + escapeHtml_(line) + '</p>'; }).join('') +
      '<p>' + escapeHtml_(chrome.signoff) + '</p>' +
      '<p style="margin-top:32px;font-size:12px;color:#777">' + escapeHtml_(chrome.footer) + '</p>' +
      '</div>';

    MailApp.sendEmail({
      to: email,
      subject: subject,
      body: text,
      htmlBody: html,
      name: CONFIRMATION.senderName,
      replyTo: CONFIRMATION.replyTo
    });
    cache.put(cacheKey, '1', CONFIRMATION.cooldownMinutes * 60);
  } catch (err) {
    // The row is already written; a failed email must not turn the post into an error.
    console.warn('Failed to send confirmation email:', err);
  }
}

/** The booked slot as the visitor picked it: "2026-08-20 14:00 (Berlin, Germany (GMT+1))". */
function bookingWhen_(data) {
  var when = [data.bookingDate, data.bookingTime].filter(Boolean).join(' ');
  var zone = data.bookingTimeZoneLabel || data.bookingTimeZone;
  return zone ? when + ' (' + zone + ')' : when;
}

function fill_(template, vars) {
  return String(template).replace(/\{(\w+)\}/g, function (m, key) {
    return vars.hasOwnProperty(key) ? vars[key] : m;
  });
}

function escapeHtml_(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Sends every confirmation to one address so the copy can be read before it
 * goes live. Run it from the editor after setting TEST_TO; it bypasses the
 * cooldown and writes nothing to the sheet.
 */
function testConfirmations_() {
  var TEST_TO = '';
  if (!TEST_TO) throw new Error('Set TEST_TO in testConfirmations_ first.');
  var kinds = Object.keys(CONFIRMATION_COPY);
  ['en', 'th'].forEach(function (lang) {
    kinds.forEach(function (kind) {
      CacheService.getScriptCache().remove('confirm:' + kind + ':' + TEST_TO);
      trySendConfirmation_(kind, {
        email: TEST_TO, firstName: 'Test', lang: lang,
        bookingDate: '2026-08-20', bookingTime: '14:00',
        bookingTimeZoneLabel: 'Bangkok, Thailand (GMT+7)'
      });
    });
  });
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
