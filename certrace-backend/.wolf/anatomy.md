# anatomy.md

> Auto-maintained by OpenWolf. Last scanned: 2026-11-13T08:22:09.671Z
> Files: 5 tracked | Anatomy hits: 0 | Misses: 0

## ../../../Users/menum/AppData/Local/Temp/claude/64d537baf603f96c/00828282-ea26-4a08-9dc4-4c94036a81c7/scratchpad/

- `mint.ts` — Dev-only: prints a refresh token (the session cookie value) for the local test account. (~111 tok)
- `shots.cjs` — Dev-only screenshot run against the local portal (localhost:3000) and backend (localhost:8000). (~2243 tok)

## ../../../Users/menum/AppData/Local/Temp/claude/6da0b079e6e8af05/879cb07d-9f63-49e7-809e-764e92cc9918/scratchpad/scripts/


## ../.wolf/


## ../certrace-portal/lib/api/

- `workbooks.ts` — Mirrors the backend's `meta` schema: a year is "syncing" while its files are sorted, then "ready". (~659 tok)

## ../certrace-portal/lib/workbook/

- `use-workbook.ts` — A copy marks itself ready when done; the workspace timer only rescues one abandoned for this long. (~5170 tok)

## ../docs/superpowers/plans/


## ../scripts/


## scripts/


## src/modules/cera/


## src/modules/links/


## src/modules/workbooks/

- `service.ts` — Locks the row so concurrent patches apply one after another and none is lost. (~2083 tok)

## test/

