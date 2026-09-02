# Certrace Portal — Security Posture

Status: **frontend-only MVP with mock data.** Nothing in this build persists on
a server, so the practical attack surface today is small — but the moment a
backend lands, the items in "Production requirements" become blocking.

## What is already in place

- **No XSS sinks.** No `dangerouslySetInnerHTML` anywhere; all user-entered
  strings render through React's default escaping. XML output escapes
  `<>&'"`; PDF output routes every string through a cp1252 whitelist.
- **Security headers** on every route (`next.config.ts`): `nosniff`,
  `X-Frame-Options: DENY`, strict referrer policy, locked-down
  `Permissions-Policy`, HSTS.
- **Uploads never leave the browser.** File objects live in memory /
  localStorage metadata only — names and sizes, not contents — so there is no
  upload pipeline to attack yet.
- **No secrets in the repo.** No API keys, tokens or `.env` values; demo
  identities are fixtures in `lib/data.ts`.
- **Deterministic outputs + dataset hash.** The PDF package embeds a sha-256
  of the dataset it was generated from, so a tampered copy is detectable
  against the source.

## Known MVP limitations (accepted, documented)

1. **Smart Link tokens are forgeable.** `base64url(declId|supplierId)` is an
   identifier, not a credential (`lib/supplier.ts`). Fine while all data is
   mock; unacceptable with real supplier data.
2. **All state is client-side localStorage.** Any user of the same browser
   profile can read/alter it; there is no server-side authority for approvals,
   versions or the audit trail. The hash-chained audit design in
   `docs/EXPORTER-PORTAL-REDESIGN.md` §15 needs a server to be meaningful.
3. **Login is a mock.** No real session, no RBAC enforcement — roles are
   display-only fixtures.
4. **No CSP yet.** Dev-mode Next.js needs inline scripts; ship a nonce-based
   `Content-Security-Policy` from the production host/CDN config.

## Production requirements (blocking before real data)

- [ ] Server-issued **signed Smart Link tokens** (HMAC/JWT): expiry, single
      declaration+supplier scope, revocation on revision close.
- [ ] **Server-side RBAC** for every role in the redesign doc §10 — the UI
      hides actions today; production must *enforce* on the API.
- [ ] **Append-only audit store** (hash-chained rows or WORM storage) — audit
      events must not be client-mutable.
- [ ] **Upload pipeline**: content-type allowlist (PDF/images/XLSX), size
      caps, antivirus scan, private bucket with signed URLs, filename
      sanitisation on the server.
- [ ] **Immutable version snapshots** persisted server-side at submit/approve.
- [ ] **Rate limiting + brute-force protection** on token resolution.
- [ ] Nonce-based **CSP**, plus `frame-ancestors 'none'` replacing
      X-Frame-Options.
- [ ] **PII & retention**: supplier contact data under a retention schedule;
      CBAM/ETS-style multi-year retention for sealed packages only.
- [ ] Secrets in a managed store (not env files in the repo).
