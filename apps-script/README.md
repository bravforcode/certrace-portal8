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

## Known gap

The Next.js landing (`landingpage/certrace-landing`) used to post here too —
`demo_lead` on form submit and `demo_booking` on slot selection. That sync was
removed in `1b2d2b1` and has not been restored, so demo bookings currently go
nowhere.

The booking columns (`bookingDate`, `bookingTime`, `bookingTimeZone`,
`decision`, `budget`, `timing`, `context`) are already in the header for when
it is wired back up. Note that the old version never sent the booking's time
zone even though the dialog collects one — a slot time without its zone is not
a time.
