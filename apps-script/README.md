# Apps Script — lead capture

`lead-capture.gs` is the Google Apps Script web app behind the landing-page
forms. It lives here so the source is version-controlled; the copy that
actually runs is pasted into the Apps Script editor attached to the sheet.

**Keep the two in sync.** If you edit it in the Apps Script editor, paste the
change back here.

## Deploy

1. Open the Google Sheet that should receive the leads.
2. **Extensions ▸ Apps Script**.
3. Replace everything in `Code.gs` with the contents of `lead-capture.gs`.
4. **Deploy ▸ New deployment ▸ Web app**
   - *Execute as*: **Me**
   - *Who has access*: **Anyone** — the landing pages post without a Google
     login, so anything narrower rejects them.
5. Copy the `/exec` URL.
6. Put that URL into `landingpage/certrace-landing/lib/sheet-sync.ts`, the
   only page code that posts to it.

Changing the script later needs **Deploy ▸ Manage deployments ▸ edit ▸ New
version**. Saving alone does not update the live `/exec` URL.

## Checking it works

Run `testWrite_` from the editor (Run ▸ testWrite_). It writes one real row
using the same path a form post takes, so it exercises the header creation,
the text formatting and the sheet permissions. Delete the row afterwards.

Opening the `/exec` URL in a browser returns a small JSON status — useful for
confirming the deployment is live.

Failures from real submissions show up under **Executions** in the Apps Script
console. The pages post with `mode: 'no-cors'` and cannot read the response, so
that log is the only place an error is visible.

## Confirmation email

Everyone who submits a form gets a short "we've received your details" email,
sent through **Resend** from `Certrace <contact@certrace.co>` — the same
account and verified domain the backend's product emails use. The settings are
the `CONFIRMATION` block at the top of `lead-capture.gs`; the wording is
`CONFIRMATION_COPY`, one entry per tab.

**Setup:** in the Apps Script editor, **Project Settings ▸ Script Properties ▸
Add script property**, name `RESEND_API_KEY`, value the Resend API key (the
same one as the backend's `RESEND_API_KEY`, or a separate send-only key). The
key is never written into the `.gs` file. Without it, confirmations are skipped
with a warning in the Executions log; the row is still written.

- **Language** — the landing page posts a `lang` field (the site language the
  visitor was reading in). Thai and English copy exist; any other language gets
  the English email.
- **When it sends** — once per new row. A repeat post that merges into an
  existing row (re-subscribing, resending the demo form) sends nothing. The
  booking dialog is the exception: it merges into the demo row but gets its
  own email, the first time, repeating the booked slot back.
- **Abuse guard** — the `/exec` URL is public, so one address gets at most one
  email per kind every `cooldownMinutes` (default 10), and all addresses
  together get at most `maxPerHour` (15) and `maxPerDay` (50). The ceiling
  matters more than the cooldown: this Resend account also sends the backend's
  password-reset codes and supplier emails, and a loop over made-up addresses
  would otherwise spend the whole plan's quota. Keep `maxPerDay` well under the
  Resend plan's daily limit. Past the ceiling the row is still written and the
  skip is logged under **Executions**. The count lives in the Script Property
  `CONFIRMATION_BUDGET`. A send Resend rejects hands the cooldown back.
- **What visitor text reaches the email** — the first name, only if it looks
  like a name (40 characters or fewer, no link, address or digits), and the
  booked date, time and zone. Nothing else the form carries is read back.
- **Failures** — a rejected send (unverified domain, over the plan's quota) is
  logged with Resend's own reason under **Executions**. In the Resend dashboard
  these emails carry the tag `category=form_confirmation`.
- **Previewing the copy** — set `TEST_TO` inside `testConfirmations_` and run
  it from the editor. It sends every confirmation, English and Thai, to that
  address and writes nothing to the sheet.
- **Turning it off** — set `CONFIRMATION.enabled` to `false`.

The first deploy after this change asks for a new permission (**Connect to an
external service**, for the call to Resend); approve it.

## What a post can write

The `/exec` URL takes posts from anyone, so the script limits what one can do:

- **Tabs** — only the form tabs in `FORM_TABS`. Any other `sheet` value,
  including the hand-kept `Event Lead`, gets `{ok: false, error: "unknown sheet"}`
  and nothing is written or created. A new form needs its tab added there.
- **Formulas** — a value starting with `=`, `+`, `-` or `@` is written with
  Sheets' leading apostrophe, so it is stored and shown as text and never runs.
  The apostrophe is not visible in the cell. `TEXT_COLUMNS` don't need it,
  because they are already formatted as plain text.
- **Field names** — must look like one: a letter, then letters, digits or `_`,
  40 characters at most. Anything else is dropped.
- **Width and length** — a tab stops gaining columns at `MAX_COLUMNS` (60), and
  a value is cut at `MAX_VALUE_LENGTH` (5000 characters).

## Tests

```
node apps-script/lead-capture.test.mjs
```

Runs the script against in-memory fakes of the Apps Script services. It checks
the limits above and the confirmation ceiling, and touches neither Google nor
Resend.

## Columns

The header is created on the first post. Existing column order is never
rearranged, and any field a form sends that has no column gets one appended on
the right (within the limits above) — so adding an input to a form does not
lose data while waiting for this file to be updated.

`first_seen` / `last_seen` are the server's clock in UTC. `timestamp` is the
browser's. They will differ slightly, and by a lot if someone's device clock is
wrong — sort on the server ones.

### Reading `zone_source`

| value | meaning |
| :-- | :-- |
| `detected` | the browser reported the zone; the city name is real |
| `fallback` | the browser gave nothing usable, so `timezone` is a default (`Asia/Bangkok`) and is **not** the lead's location |

On `fallback`, read `utc_offset` instead. It is measured from the device either
way, so it stays trustworthy even when the zone name is a guess.

## Repeat submissions

`UPSERT_ON_EMAIL` (default `true`) merges a repeat submission from the same
email + type into the existing row instead of adding a second one. This is what
makes the two-step waitlist form work: step 1 captures the email immediately,
step 2 fills in the rest of the same row.

Only non-empty values are written on a merge, so a later submission enriches
the row rather than blanking fields it does not carry.

Set it to `false` to keep every submission as its own row.

## Reading a booking

A booking is recorded four ways, because a slot time on its own is not a time:

| column | example | use |
| :-- | :-- | :-- |
| `bookingDate` | `2026-08-20` | the day, in the visitor's zone |
| `bookingTime` | `14:00` | the slot, in the visitor's zone |
| `bookingTimeZone` | `Europe/Berlin` | which zone those two are in |
| `bookingStartUtc` | `2026-08-20T12:00:00.000Z` | the actual instant |

`bookingStartUtc` is the one to put in a calendar. The other three are what the
visitor saw, and reading them without `bookingTimeZone` will book the call at
the wrong hour.

`bookingTimeZoneLabel` is the human form (`Berlin, Germany (GMT+1)`), read at
the slot's own instant — so on a day a zone changes offset it names the offset
that actually applies to the call, not the one that ended overnight.

The endpoint the Next landing posts to is set in
`landingpage/certrace-landing/lib/sheet-sync.ts`; the static pages have their
own, and the two may point at different sheets.
