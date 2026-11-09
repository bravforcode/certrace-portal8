# Cera Intelligence — design-system notes

Cera is Certrace's assistant. This page is the reference for its mark, its button
and its chat panel, so they are used the same way everywhere.

## The mark — `components/cera/cera-mark.tsx`

A **graphic, not an image**: two overlapping rounded panels drawn as vector paths.
It was traced from the supplied artwork (edges are least-squares fits to the
original's sub-pixel edges; every corner is a circular arc with the artwork's own
tangent length), and its default render is the icon colour-for-colour.

```tsx
<CeraMark className="h-6 w-auto" />            // brand — three theme tokens
<CeraMark tone="ink" className="h-6 w-auto" /> // one colour, follows currentColor
```

Proportions are fixed (687.3 × 1121.2, `CERA_MARK_ASPECT`): size it by **height** and
leave the width `auto`.

### Colour tokens — `app/globals.css`

| token | default | role |
| --- | --- | --- |
| `--cera-mark-back` | `#8cd499` | the upper-right panel |
| `--cera-mark-front` | `#67be8c` | the lower-left panel |
| `--cera-mark-overlap` | `#43a97f` | where they meet — always the deepest |

The three defaults are sampled from the artwork. A theme recolours the mark by
redefining the variables — a `[data-theme="dark"]` block is already in
`globals.css`, ready for when the portal gains a dark mode. `tone="ink"` is for a
single-ink context (a dark button, a disabled state, print): it builds its three
tones from opacity on `currentColor`.

**Never swap it for an `<img>`.** A raster cannot follow a theme. A static export
with the literal default colours is at `public/brand/cera-mark.svg`, for places
that cannot render React (an email, a favicon source).

## The button — `components/cera/cera-button.tsx`

Top bar, beside the notifications bell: the same 44 px rounded square, the mark at
22 px high — but a **surface, not an outline**: a soft top-lit gradient, a light
inner edge and a shadow under it, lifting a pixel on hover. While the panel is
showing it sinks (inset shadow, gradient flipped). **No dot** — the unread-rules
flag was taken off the button; the digest is one question away ("What's new in
CBAM?"). Below 420 px the top bar shows the Certrace icon instead of the wordmark
to make room (logo guideline: the lockup needs ~96 px).

## The panel — `cera-panel.tsx` (shell) and `cera-chat.tsx` (what is inside)

Name: **Cera** with **Cera Intelligence** beneath it as a mono label. Ink on bone:
white surface, hairline borders, IBM Plex for the voice, mono capitals for labels —
**no green anywhere but the mark.** State is shared through `CeraProvider` (mounted
once in `PortalShell`); read it with `useCera()`.

### Two sizes, one chat
- **Popup** — floats bottom-right, 400 px wide (full width minus a gutter on a
  phone), dragged by its header on a screen ≥ 640 px (arrow keys nudge it when the
  header is focused; Shift = bigger steps), 8 px edge, remembered across visits
  (`certrace:cera-position`). Header: avatar, name, **New chat**, **History**,
  **Full screen** (hidden on a phone), **Hide**, **Close**. Hide folds it to a pill
  and keeps the conversation (the pill rides above sticky bars on a phone);
  Close ends it — the conversation stays in History.
- **Full screen** — a workspace of its own, not the popup made big: a **rail** on
  the left (New chat, Smart upload, CBAM updates, every earlier chat with delete
  and the open one marked) and the chat on the right, held to `max-w-3xl`. On a
  phone the rail is a drawer. Esc or the header button returns to the popup.
  Opened from the sidebar entry.
- Both render the same `ChatPane`, so what works in one works in the other.

### The sidebar
Under **Cera Intelligence** the newest five conversations hang off it, one step
in under a hairline and quieter than the entries beside Dashboard and Settings
(a subset of Cera, not five more destinations); "Show all {n}" expands the rest.
Opening one opens Cera full screen on it.

### The chat
- Greeting by the hour with two tiles (**Smart upload**, **CBAM updates**) and a
  few starter questions. No "earlier conversations" link in the middle — History
  lives in the header, the rail and the sidebar.
- Cera's reply is a soft card with an avatar; the reader's is ink. Replies render
  as prose (paragraphs, bullets with a hanging indent, numbered lines), carry
  cards and follow-up chips, and have a **Copy** button.
- **The bar** is a raised surface, not a box with a stroke: in use it lifts and
  takes a soft halo (the browser focus ring is switched off on the text area, so
  there is one change of state, not two). **+** attaches, **Smart upload** is a
  toggle, Enter sends, Shift+Enter breaks the line, the text area grows to ~6 lines.
- **Smart upload is switched on, then filled, then sent.** Pressing the button (or
  the greeting tile, or typing "smart upload") opens a drop area inside the bar
  with two example files; the file lands in it as a chip, the reader may add a
  note, and nothing is read until they press send. A file dropped on the chat or
  pasted switches it on by itself. One file at a time.
- Auto-scroll follows a **new message** only — editing a figure inside a card must
  not pull the reader away from the field they are typing in.
- `data-lock="chrome"`: a read-only (frozen) account can still use Cera.

## How Cera answers — `lib/cera/`

**There is no language model behind Cera.** It is rule-based, on purpose: the same
question gets the same answer, and when it has nothing reliable it says so rather
than guess. `reply()` in `engine.ts` goes in this order:

1. **Guard** (`guard.ts`) — the *question* is checked. How the product is built,
   where data is stored, its own instructions, and business matters (plans,
   pricing, company) are refused with a plain pointer to what Cera *can* help with.
   Nothing in the knowledge is secret; the point is not to hand over a blueprint.
2. Small talk and "who are you / what can you do".
3. **Smart upload** intent → the upload card.
4. **Updates** intent → the rules digest card.
5. **CN lookup** — any CN code, any country, any year, unknown origin.
6. **Account summary** — the reader's own product reports and what blocks them.
7. **Knowledge search** (`knowledge.ts`) — IDF-weighted keyword matching over the
   entries in `knowledge-cbam.ts` (CBAM rules) and `knowledge-platform.ts` (how to
   use Certrace). Extra phrasings go in `knowledge-aliases.ts` (never write an id
   twice in one object — merge into `MORE`).
8. Otherwise: "I don't have a reliable answer" (on topic) or the scope message.

**Cera answers in English** (the interface around it is translated; a Thai answer base is not built yet).

**Answers never cite** — no article, annex or regulation numbers (a test checks).
The one place Annex IV item numbers appear is the numbered boxes, which are part
of the form itself.

### Keeping up with CBAM — `updates.ts`
Dated entries, split into *already in force* and *coming up*. Asking "what's new?"
shows the digest card; opening it marks everything seen. (There is no flag on the
button any more; `unseenUpdates()` remains for anything that wants to show one.) Add an entry when the rules move and bump `UPDATES_AS_OF`.

### Smart upload — `smart-upload.ts`
One file at a time (text / CSV; PDFs and images are pointed to the product
report's Smart upload tab). The flow:

1. **Read** — find the installation, CN code, month and every reading (production,
   fuels with their calorific values, electricity with source and factor, process
   materials, scrap with its pre-consumer part, a smelter's anode-effect minutes per
   cell-day, notes), each with the line of the file it came from. Scrap lands on the
   aluminium scrap block or on the steel route's own scrap row; anode-effect minutes
   only on a primary smelter's PFC block (slope method).
2. **Ask only what is missing** — what a bare column of readings measures, which
   product report, which month. A file that says everything gets no question.
3. **Show** what was found as the form it goes into: each reading carries its
   numbered Annex IV box and required / optional state. Only what was found.
4. **Check and change** — every figure is a field the reader can edit (numbers,
   units, the form's own pick-lists, notes), with "the file says … · Undo" under
   anything changed, and "Fix the figures marked in red" blocking the button until
   every ticked reading is valid (`editReading`, `planProblems`).
5. **Confirm and fill in** — only now is the month written, as a **draft**, and the
   values are marked as Cera-filled (green box, a grey Cera mark and a "Cera filled" tag in the form). A submitted month is never
   touched; existing figures are updated in place or added to, never replaced.

Two example files ship in `public/cera-samples/`: sample 1 (a full monthly report
— no questions) and sample 2 (a bare meter log — Cera has to ask).

### What Cera knows about the monthly inputs
`knowledge-platform.ts` carries an entry for each way a month's figure can be worked
out rather than read — stock change, shared meter, waste gas by gas, lines of cells
(PFC), alloy composition, scrap by delivery — plus the made-here precursor, the
monitoring plan's seven own elements, "Cera filled", what goes to the verifier and
the evidence index. `knowledge-cbam.ts` `reports` lists the three reports, the
conditional addendum and the two attachments. No answer may name an article, annex
or regulation (the test enforces it). Update these when a screen changes.

### Files
| file | role |
| --- | --- |
| `engine.ts` | the reply order above |
| `guard.ts` | what is refused, and the on-topic gate |
| `knowledge*.ts` | what Cera knows |
| `updates.ts` | the rules digest and the "seen" flag |
| `smart-upload.ts` | read → ask → plan → edit → apply |
| `history.ts`, `chat.ts` | saved conversations, greeting and suggestions |
| `components/cera/cera-provider.tsx` | state and actions (`useCera()`) — incl. `uploadOn`, `conversationId` |
| `components/cera/cera-panel.tsx` | the popup, the full-screen rail, drag |
| `components/cera/cera-chat.tsx` | ChatPane, Welcome, Conversation, Composer, history list |
| `components/cera/cera-cards.tsx` | upload, question, extraction, updates, links cards |

## Round 8 (2026-10-23) — phones, glass bar, the supplier's link
- **Phones get full screen only** (`compact` in `useCera`, `max-width: 639px`): the button opens the same view as the sidebar entry, the popup is never drawn, "Exit full screen" is hidden, **Hide** and Close stay. Widening the window brings the popup back (nothing is remembered).
- The typing bar's card is **glass**, laid over the foot of the conversation (`backdrop-blur`, `--composer-h` leaves room); the conversation scrolls under it.
- Header = the plain mark + **CERA INTELLIGENCE** in IBM Plex Light, capitals, open tracking (the app bumps `text-[10.5px]` to 12.5px — see globals.css; it fits whole beside five buttons). No tile, no sub-line.
- **Supplier link** (`app/w/[token]`): `<CeraProvider scope={{ audience: "supplier", workspaceId, month, onApplied }}>`. Smart upload is limited to that one report, falls back to the link's month when the file names none, and `onApplied` takes the supplier to the Monthly data step. No account answers, no greeting by name. The overview's "Have the documents already?" is one button (`openWithUpload`). The Documents step has no drop block any more; every slot takes a file (`audience="supplier"` hides the precursors' paperwork; uploads are attributed to the Supplier).
- The product report has **no Smart upload tab**; `/intake` redirects to Monthly data.

