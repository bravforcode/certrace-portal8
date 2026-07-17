# Certrace portal security posture

Status: frontend-only readiness demo. No real supplier, evidence, identity, approval, verifier, or filing data may be entrusted to this build.

## Controls in this repository

- React renders user strings without unsafe HTML sinks.
- Baseline response headers include a restrictive CSP, `nosniff`, frame denial, a strict referrer policy, a restrictive permissions policy, HSTS, and `no-store`.
- The FastAPI placeholder calculation endpoint fails closed with `503 backend_not_configured`; CORS is absent by default and accepts only a validated explicit origin allowlist.
- Version-2 browser records are labelled `readiness_demo`. Older or structurally invalid records are removed from active state and recorded only as metadata under `legacy_unverified`; they are never silently promoted into the MRV model.
- Evidence bytes and data URLs are not persisted. Local file references contain safe metadata only and cannot satisfy a regulatory evidence requirement.
- Unknown CN codes, incompatible units, missing effective regulatory data, missing certificate prices, critical deterministic findings, and missing accredited-verifier evidence fail closed.
- Regulatory arithmetic in `lib/mrv` uses decimal strings, typed units, exact decimal operations, and reproducible traces.
- Structured plant inputs are validated before any direct/indirect result is exposed; stale approvals are ignored after a critical finding or dataset change.
- CI uses commit-pinned actions, tracked-source secret-pattern checks, CodeQL, lint/type/test/build gates, and production dependency audits. The current Node and Python production audits report no known vulnerabilities.
- Browser-generated documents are draft previews with a local checksum, not sealed or immutable audit records.

## Known demo limitations

1. The same-browser demo token is reversible `base64url(declarationId|supplierId)`. It is an identifier, not authentication, authorization, or a secret.
2. Browser localStorage is mutable, visible to any user of that browser profile, capacity-limited, and unavailable in another browser/device. It cannot establish tenant isolation, delivery, review identity, version immutability, retention, or an audit trail.
3. Login, roles, reviewer confirmation, and typed attestations are presentation fixtures. They are not server-enforced identities or signatures.
4. No email or notification provider is configured. Local timestamps and toasts must not claim delivery.
5. No official O3CI write API/schema is configured. The portal produces only a manual-entry worksheet/checklist; it cannot push, validate, or file Registry data.
6. The static CSP blocks external scripts, frames, plugins, unexpected connections and form targets. Next.js bootstrap scripts still require `'unsafe-inline'`; replacing this with per-response nonces/hashes remains a production deployment requirement.

## Blocking production requirements

- [ ] Server-issued, short-lived, scoped, revocable supplier tokens and rate-limited resolution.
- [ ] Authoritative authentication, tenant isolation, and server-enforced role/action authorization.
- [ ] Transactional email/notification provider with delivery and bounce events.
- [ ] Encrypted private evidence storage with signature/MIME checks, filename controls, malware scanning, quarantine, signed access, and size/rate limits.
- [ ] Immutable version snapshots, append-only audit events, trusted timestamps/signatures, and enforced retention/deletion policy.
- [ ] Reviewed regulatory-data ingestion and maker-checker publication controls.
- [ ] Accredited-verifier identity/accreditation/report integration.
- [ ] An official, supported O3CI/CBAM Registry integration contract if the Commission exposes one.
- [ ] Secret management, monitoring, incident response, backups, disaster recovery, and privacy/data-processing controls.
- [ ] A production nonce/hash-based CSP and deployment-level verification of all security headers.

See `CBAM-DEFINITIVE-PERIOD-READINESS.md` for the regulatory workflow and legal actor boundary.
