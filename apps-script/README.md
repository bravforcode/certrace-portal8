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
6. Put that URL into the pages that post to it:
   - `index.html` — the `SCRIPT_URL` variable in the waitlist block
   - `static-landing/index.html` — `CONFIG.SCRIPT_URL`

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
  email per kind every `cooldownMinutes` (default 10). A send Resend rejects
  does not start the cooldown.
- **Failures** — a rejected send (unverified domain, over the plan's quota) is
  logged with Resend's own reason under **Executions**. In the Resend dashboard
  these emails carry the tag `category=form_confirmation`.
- **Previewing the copy** — set `TEST_TO` inside `testConfirmations_` and run
  it from the editor. It sends every confirmation, English and Thai, to that
  address and writes nothing to the sheet.
- **Turning it off** — set `CONFIRMATION.enabled` to `false`.

The first deploy after this change asks for a new permission (**Connect to an
external service**, for the call to Resend); approve it.

## Columns

The header is created on the first post. Existing column order is never
rearranged, and any field a form sends that has no column gets one appended on
the right — so adding an input to a form does not lose data while waiting for
this file to be updated.

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
