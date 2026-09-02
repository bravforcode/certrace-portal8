# The Legal / Compliance seat

`certrace-compliance2` is `certrace-portal7` — the exporter portal — scoped so the only
person who can sign in is **Legal / Compliance**. Architecture and design follow
`certrace-member`: one `SEAT_ROLE` constant, one `GRANTS` table, every screen asking
`can()`, and every refusal naming the person who *can* do the thing.

Local git only. Two commits: a byte-faithful baseline of portal7, then the scoping — so
`git diff <baseline> <scoping>` is the exact answer to "what does this seat change".

---

## The one place this departs from the product's own words

`/team` in the owner build describes the seat as:

> "Legal / compliance — Everything a member can do, plus reviewing and signing packages
> off before they leave."

Read literally that makes the reviewer a **superset** of the person they check, and it is
still not what this build does. So the seat is defined by **subtraction**:

```
member  —  runs the estate: builds workspaces, chases suppliers, archives
legal   —  assures the filing: confirms, sends back, signs off
both    —  the figures
```

They overlap **completely on reading** — you cannot attest to what you may not see. The
role description on `/team` was corrected to match what is actually enforced, rather than
left contradicting it.

### The figures are shared, by decision

`enterFigures` was withheld for most of this build and is **granted** in the version that
shipped: the account holder asked for it in as many words — compliance corrects a reading
the way a member does.

- **Gained.** A reviewer who spots a transposed digit fixes it, instead of bouncing the
  month and paying for one typo four times over.
- **Given up.** The product no longer *guarantees* that the hand which typed a figure and
  the hand which signed for it are different. It still should be; that is now this
  company's practice to keep, not something the portal holds for them.
- **What survives it.** The trail, which portal7 already had: the first keystroke into a
  submitted month calls `markExporterEdited` — the month is stamped `editedByExporter`
  ("edited by you" in the months list) and the supplier's `attestation` is dropped, because
  it attested to a figure that has since moved. `/account` states this on the same card
  that grants the edit.

The line moved rather than disappeared. It no longer runs between reading and writing; it
runs between the **figures** (shared) and the **estate** they live in — which workspaces
exist, which suppliers are asked, what is archived — plus the account itself. A month is a
fact to be corrected. The rest are decisions, and decisions are not this seat's.

## The model — `lib/seat.ts`

`SEAT_ROLE = "legal"`, and a `GRANTS` table built from five named sets:

| set | capabilities | held by |
|---|---|---|
| `ANY_SEAT` | `editOwnProfile` `viewTeam` `downloadPack` | everyone |
| `ASSURE` | `reviewMonth` `signOffPack` | **this seat**, owner |
| `RECORD` | `enterFigures` | **this seat**, member, owner |
| `ORIGINATE` | `buildWorkspaces` `archiveWorkspace` `chaseSuppliers` | member, owner |
| `ACCOUNT` | `manageSeats` `editOrganisation` `billing` `deleteWorkspace` | owner |

`ASSURE ∩ ORIGINATE = ∅` still holds and is asserted directly, and so is the tighter
claim that `RECORD` is **exactly** the overlap — one capability wide, so a later edit
cannot widen "compliance can write" from *a figure* into *a workspace*
(`lib/__tests__/seat.test.ts`, 16 tests; 434 pass in total).

`deleteWorkspace` stays in the table for the store's backstop and appears on no screen:
nothing in this product deletes a workspace outright — the owner included. Archive is the
only way one leaves the estate, so `/account` does not list deletion as something to ask
the owner for.

Also exported: `SIGNED_IN_SEAT`, `DATA_OWNER` (who to send a month back to),
`ACCOUNT_OWNER`, and `SEAT_DESTINATION` — deliberately the same `/account` route the
trial lock uses, so a reader never has to learn two "why did that not work" screens.

## Three layers of enforcement

1. **`components/seat-lock.tsx`** — a capture-phase guard, modelled on portal7's own
   trial lock. It blocks **fields only, never buttons**: reading this product is done
   with buttons (open a month, expand a fuel row, switch a tab), and freezing those
   would grey out the reviewer's own job. Opt out with `data-seat="allow"`.
   Unlike the trial lock it **speaks** — a toast naming whose figure it is — because a
   reviewer clicking into March's reading has not made a mistake.
   **It arms on `can("enterFigures")`, so as shipped it stands down**: the seat holds
   that capability and no field in the product is frozen. Not dead code — a permission
   mechanism obeying the table, exactly like the `refuseWrite` backstops, which are also
   no-ops for a granted capability. The `data-seat="allow"` markers stay for the same
   reason. Its **route** half is still live.
2. **`refuseWrite(cap)` in `lib/seat.ts`**, called at the top of the store mutations that
   originate data. The layer that actually guarantees it.
3. **Route guards** — `/workspaces/new` and `/onboarding` → `/account`.

Plus per-screen `can()` for named controls: the New-workspace CTAs, **Add precursor**,
archive/restore, and the pack sign-off. The month **Edit** button asks `can()` too and now
answers yes — that is the grant showing up where it matters, and the check stays so the
affordance disappears rather than lying if the grant is ever narrowed.

### Traps this build hit

- **`data-lock="scope"` was referenced by portal7's trial lock and applied to nothing.**
  A React portal mounts on `<body>`, so `closest('main')` never reaches a dialog, and
  every field inside every modal escaped **both** guards. `Modal` (`components/ui.tsx`)
  and `Portal` (`components/controls.tsx`) now carry it — which fixes the trial lock too.
- **A searchable `Select`'s own filter box is portaled**, so it cannot inherit an
  ancestor's `data-seat="allow"`. It is marked `data-lock="allow"` at source: it filters
  a list and never stores anything.
- **The supplier smart links (`/w /s /p /self`) run this same app and these same stores.**
  A gate on the seat alone silently stops every supplier submitting — and looks like a
  broken form, not a permission. `refuseWrite` is path-scoped out of them.
- **No browser means no seat.** `refuseWrite` refuses nothing under SSR or `node:test`;
  otherwise every inherited test that seeds a fixture by calling `createWorkspace` or
  `saveEvidence` directly fails. It did, which is how the rule was found.
- **Seed in a lazy `useState` initialiser, not an effect** — a parent's effects run
  *after* its children's, so an effect-based seed lands after every page has already read
  an empty store (`components/seat-fixture-boot.tsx`).

## `lib/seat-fixture.ts` — the account this seat walks into

This seat cannot create a workspace or send a supplier request, and a reading can only be
corrected in a month that already exists — so an empty account would stay empty forever.
The fixture writes, once per browser, the estate as Operations would have left it: two workspaces, ten months of readings, and a review
conversation part-way through — two months awaiting review, one sent back, five
confirmed, one pack signed. It writes **raw store keys**, deliberately going around the
gate: fixture data is the state this seat *found*, not this seat acting.

## Identity

Signed in as **Pimchanok S.**, Legal & Compliance Manager — not Wasawat K., the owner.
`USER.name` is the provenance stamp written into every sign-off, so identity and
permission have to be the same person. Three places define it: `USER` and `SEATS` in
`lib/data.ts`, `DEFAULT_PROFILE` in `lib/profile.tsx`, and the `compliance` entry in
`lib/exporter-review.ts` — which listed the *account owner* as the compliance reviewer,
a collapse of duties written into portal7's seed data: one person owning the account,
entering its figures and signing them off. Sharing the figures with this seat narrowed
that gap; it did not close it, which is the point of the trade recorded above.

## Inherited, not introduced

`npx tsc --noEmit` reports two errors in `lib/__tests__/electricity-sources.test.ts`.
Both are present in an untouched portal7 and are left alone.

## Running it

```bash
cd ~/certrace-compliance2 && npm run dev -- --port 3009
```

Launch config `certrace-compliance2` (port 3009). `npm test` → 434 pass.
