# anatomy.md

> Auto-maintained by OpenWolf. Last scanned: 2026-11-11T23:01:35.565Z
> Files: 12 tracked | Anatomy hits: 0 | Misses: 0

## ../../../Users/menum/AppData/Local/Temp/claude/6da0b079e6e8af05/879cb07d-9f63-49e7-809e-764e92cc9918/scratchpad/scripts/

- `inputs.py` (~314 tok)

## ../.wolf/

- `cerebrum.md` — Cerebrum (~854 tok)

## ../docs/superpowers/plans/

- `2026-11-12-report-lock-precheck-archive.md` — Report Lock, Pre-check, Verifier Handoff and Archive Plan (~11612 tok)

## scripts/

- `cera-probe.ts` — Manual probe: one real Cera turn against the configured provider. Prints the (~265 tok)

## src/modules/cera/

- `actions.ts` — Cera proposes actions; the server never executes them. The portal shows each (~2568 tok)
- `context.ts` — Knowledge entries most related to the query that fit in maxChars; all of it when it fits. (~1144 tok)
- `provider.ts` — The configured provider when its key is present; undefined means chat falls back to rules. (~949 tok)
- `service.ts` — Exports ChatInput, chatConfigured, CeraTurn, generateTurn + 3 more (~1800 tok)

## src/modules/links/

- `item-fields.ts` — `cell` is the installation workbook cell key (matches CELL_KEY in workbooks/model.ts). (~374 tok)

## test/

- `cera-actions.test.ts` — Declares realKey (~1834 tok)
- `cera-provider.test.ts` — API routes: GET (1 endpoints) (~1293 tok)
- `item-links.test.ts` — ItemField: mint (~2381 tok)
