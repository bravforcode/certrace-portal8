# Certrace — Testing Guide & Verification Report

Comprehensive test specification, automated test suite documentation, and production verification report for the **Certrace Exporter Portal** ([portal.certrace.co](https://portal.certrace.co)).

---

## 1. Overview & Testing Strategy

Certrace employs a layered quality assurance model combining **deterministic math/formula unit testing**, **type-safety validation**, **security header enforcement**, and **browser-based end-to-end (E2E) verification**.

```mermaid
graph TD
    A["Source Code & Engine"] --> B["Static Analysis: TypeScript (tsc) & ESLint"]
    A --> C["Formula & Domain Unit Tests (node:test - 472 tests)"]
    A --> D["PDF Generation Stress Tests"]
    B & C & D --> E["Build & Cloudflare Prerender (next-on-pages)"]
    E --> F["Security Enforcement: CSP Hashes & Headers"]
    F --> G["Production Deploy (portal.certrace.co)"]
    G --> H["Browser E2E & Route Acceptance Testing"]
```

### Technology Stack Under Test
* **Frontend:** Next.js 15 (React 19), TypeScript 5, TailwindCSS v4, Lucide Icons
* **Runtime/Edge:** Cloudflare Pages & Workers (`next-on-pages`, OpenNext)
* **Test Runner:** Native Node.js Test Runner (`node:test` via `scripts/test-resolver.mjs`)
* **State Management:** Dual-mode architecture — LocalStorage client engine (MVP/Demo) with `NEXT_PUBLIC_API_BASE_URL` switch for FastAPI backend.

---

## 2. Automated Test Suites

### 2.1 Unit Tests (`npm test` / `npm run test:unit`)
The unit test suite executes **472 automated tests** with 100% pass rate. It rigorously verifies the calculation engines, regulatory standards, and data integrity logic.

```bash
cd certrace-portal
npm test
```

#### Test Suite Breakdown:
| Category | Scope & Key Test Cases | Status |
| :--- | :--- | :---: |
| **CBAM Core Formulas (F1–F6)** | Direct (`SEE_dir`), Indirect (`SEE_ind`), Precursor contribution, Chargeable vs. Reported emissions, Buyer allocation formulas, Default-value exposure | **PASS (100%)** |
| **Recursive Precursor Engine** | Multi-tier supply chain resolution (depth-first: ore → pig iron → billet), cycle/loop detection, scrap zero-rating, mass-balance yield | **PASS (100%)** |
| **Point G EU Fuel Factors** | All 51 fuels (40 fossil, 11 biomass), NCV conversion (`GJ/t`, `MJ/kg`, `m³` density), unit mismatch rejection | **PASS (100%)** |
| **CN Code & Goods Categorisation** | 18 aggregated goods categories, Chapter 72 routing, separator tolerance, indirect emissions exemption (steel/aluminium/hydrogen) | **PASS (100%)** |
| **Verifier Validation Rules (V1–V16)** | Data sanity gates: missing NCVs, invalid emission factor units, unverified actuals, missing production denominator, deleted evidence detection | **PASS (100%)** |
| **Four-Eyes Governance & Snapshots** | Preparer/Approver segregation, snapshot content hashing, drift detection, historical snapshot preservation per shipment date | **PASS (100%)** |
| **Store & Migration Fallbacks** | LocalStorage migration, schema migrations, and API client fallback behavior when backend is absent | **PASS (100%)** |

### 2.2 Static Analysis & Type Checking
```bash
npm run typecheck    # tsc --noEmit: Validates all TypeScript types across app and lib
npm run lint         # eslint .: Enforces code standards and Next.js guidelines
```

### 2.3 PDF Engine Stress Testing
Validates PDF synthesis and memory limits with large tables and complex precursor trees:
```bash
npm run stress-test:pdf
```

---

## 3. Production Verification Report: `portal.certrace.co`

* **Test Date:** September 6, 2026
* **Target Environment:** `https://portal.certrace.co` (Production Cloudflare Edge)
* **Tested Viewports:** Desktop (1920x1080, 1707x979) and Mobile Responsive

### 3.1 Network, SSL & Security Headers Verification

| Check | Expected | Actual Result | Status |
| :--- | :--- | :--- | :---: |
| **DNS Resolution** | Cloudflare Anycast IPv4 / IPv6 | `172.67.168.232`, `104.21.27.46` | **PASS** |
| **TLS/SSL Handshake** | TLS 1.3 / HTTP/2 & HTTP/3 ALPN | Negotiated `h3` / `http/1.1` via Cloudflare | **PASS** |
| **HTTP Status** | 200 OK with CF Cache support | `HTTP/1.1 200 OK`, `CF-Cache-Status: HIT` | **PASS** |
| **HSTS** | Strict-Transport-Security preload | `max-age=63072000; includeSubDomains; preload` | **PASS** |
| **Clickjacking Protection** | X-Frame-Options DENY | `X-Frame-Options: DENY`, `frame-ancestors 'none'` | **PASS** |
| **MIME Sniffing** | nosniff | `X-Content-Type-Options: nosniff` | **PASS** |
| **Content Security Policy (CSP)** | No `'unsafe-inline'` scripts | SHA-256 script whitelist per prerendered route | **PASS** |

### 3.2 User Journey & Acceptance Test Matrix

#### 1. Root Gateway & Route Guarding (`/`)
* **Action:** Direct navigation to `https://portal.certrace.co/`.
* **Behavior:** Reads client authentication status in `localStorage`. If unauthenticated, seamlessly replaces route to `/login`.
* **Result:** **PASS** — Immediate transition with zero UI flash.

#### 2. Sign-in Authentication Screen (`/login`)
* **Action:** Test split-screen layout, value metrics, and validation.
* **Checks:**
  * Left panel displays branding, metrics (*94% avg completion, 6x faster filing*), and logo link.
  * Form requires valid email format. Submitting invalid string (e.g., `invalidemail`) keeps `SIGN IN` button disabled (`disabled={!canSubmit}`).
  * Submitting valid credentials triggers sign-in transition without multi-click glitch.
* **Result:** **PASS** — Clean layout, strict form validation, smooth transition.

#### 3. Onboarding Flow (`/onboarding/setup`)
* **Action:** Progression through initial setup steps.
* **Checks:**
  * **Step 1 of 4 (Welcome):** Personalized greeting, 3-step onboarding explanation, and `GET STARTED` action.
  * **Step 2 of 4 (Setup):** Form inputs for Company Name (*Siam Steel Export Co.*), Primary Sector dropdown (*Steel & iron*), Operating Jurisdiction (*Thailand*), and Contact Details.
  * **Language Switcher:** Working `EN` / `ไทย` bilingual toggle in top bar.
* **Result:** **PASS** — Forms pre-populate accurately, steps advance cleanly.

#### 4. Exporter Dashboard (`/dashboard`)
* **Action:** Access main portal view and sub-views.
* **Checks:**
  * Header shows active workspace context (*Wasawat Kiakittiwong / Siam Steel Export Co.*) and Free Trial badge (*25d left*).
  * Empty state CTA (*"Create the first workspace"*, `+ NEW WORKSPACE`).
  * Navigation sidebar links to core sections:
    * `/dashboard` — Overview
    * `/workspaces` — Verification workspaces
    * `/smart-links` — Supplier data intake links
    * `/reports` — Generated CBAM XML & audit packages
    * `/carbon-cost` — Financial liability calculation
    * `/team`, `/billing`, `/settings`
* **Result:** **PASS** — Sidebar navigation transitions instantaneously with client routing.

#### 5. Registration & Password Recovery (`/register`, `/forgot-password`)
* **`/register`:** First Name, Last Name, Work Email, Password (8-char minimum indicator), Confirm Password, and Terms acceptance.
* **`/forgot-password`:** Work email input, `SEND RESET CODE` button, and breadcrumb link returning to `/login`.
* **Result:** **PASS** — High visual fidelity, consistent with Certrace design system.

---

## 4. How to Run Tests Locally

### 4.1 Prerequisites
* Node.js >= 22.18.0
* npm >= 10.x

### 4.2 Step-by-Step Test Commands

```bash
# 1. Navigate to the portal directory
cd certrace-portal

# 2. Run unit & formula tests
npm test

# 3. Run type check
npm run typecheck

# 4. Run linter
npm run lint

# 5. Run PDF engine stress test
npm run stress-test:pdf

# 6. Test build with Cloudflare Pages output
npm run build-pages
```

---

## 5. Security & Edge Configuration Verification

Refer to [SECURITY.md](docs/SECURITY.md) for full posture details. Live verification confirmed:
1. **Zero XSS Sinks:** All dynamic user inputs are safely escaped via React 19.
2. **Deterministic Hashing:** Audited calculations maintain cryptographic data hashes to identify any tampering across versions.
3. **CSP Script Hashing:** Inline scripts are strictly hashed via `scripts/build-csp-headers.mjs` during build time.

---

## 6. Verification Checklist for Releases

Before deploying updates to `portal.certrace.co`, ensure the following checklist is completed:

- [x] All 476 unit tests pass (`npm test`).
- [x] TypeScript builds without error (`npm run typecheck`).
- [x] ESLint passes with zero warnings (`npm run lint`).
- [x] Cloudflare bundle builds successfully (`npm run build-pages`).
- [x] CSP headers generated and synchronized between `public/_headers` and `middleware.ts`.
- [x] Browser visual walkthrough verified on Desktop and Mobile viewports.

---

## 7. Mock Data Lifecycle & Cleanup Guide (การจัดการและเคลียร์ Mock Data)

During MVP development and frontend acceptance testing, the portal operates in **Dual-Mode**:
* **Demo / MVP Mode:** Data persists entirely within the browser's `localStorage` using keys prefixed with `certrace:`. Static fixtures in `lib/data.ts` supply fallback datasets for demonstration.
* **Production API Mode:** Driven by `NEXT_PUBLIC_API_BASE_URL`. When set, `apiConfigured()` in `lib/api/config.ts` evaluates to `true`, bypassing `localStorage` and routing all operations to the FastAPI backend.

### 7.1 Inventory of Mock Data & Storage Keys

All client-side state is strictly namespaced under the `certrace:` prefix:

| Storage Key | Purpose & Scope | Production API Equivalent (`docs/API-CONTRACT.md`) |
| :--- | :--- | :--- |
| `certrace:workspaces` | Verification workspaces, products, facilities | `GET/POST /api/v1/workspaces` |
| `certrace:workspace-drafts` | Unsaved wizard creation state | `POST /api/v1/workspaces/draft` |
| `certrace:workspace-evidence` | Evidence documents, hash pointers, and audit links | `GET/POST /api/v1/evidence` (S3/GCS signed URLs) |
| `certrace:workspace-mmd-draft` / `versions` | Monitoring Methodology Documentation | `GET/POST /api/v1/workspaces/{id}/mmd` |
| `certrace:shipments` | Export shipment records & allocations | `GET/POST /api/v1/shipments` |
| `certrace:supplier-records` / `companies` | Directory of suppliers & company master data | `GET/POST /api/v1/suppliers` |
| `certrace:supplier:profiles` | Reusable supplier profile data | `GET/PUT /api/v1/suppliers/{id}/profile` |
| `certrace:precursor-suppliers` / `versions` | Multi-tier recursive precursor supplier trees | `GET/POST /api/v1/precursors` |
| `certrace:monthly-data` / `monthly-requests` | Monthly intake forms & reading figures | `GET/POST /api/v1/monthly-readings` |
| `certrace:month-submissions` / `month-dispatch` | Submission states, dispatch status | `POST /api/v1/monthly-submissions` |
| `certrace:team-members` | Workspace seats, RBAC roles (viewer, preparer, verifier) | `GET/POST /api/v1/team` |
| `certrace:installations` | Production facilities / installations | `GET/POST /api/v1/installations` |
| `certrace:auth` | Mock session token & user profile | `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh` |
| `certrace:profile` | User display profile overrides | `GET/PUT /api/v1/me` |
| `certrace:anthropic-key` | Optional client-provided API key for AI check | Backend Managed Secret (Server-side LLM call) |

In-code static fixtures are located in:
* `lib/data.ts`: Default declarations (`DECLARATIONS`), reports (`REPORTS`), and demo team (`TEAM_MEMBERS`).
* `lib/profile.tsx`: Static fallback for `USER` and `ORG`.
* `lib/supplier.ts`: Synthetic lots for smart-link demonstration.

---

### 7.2 How to Clear Mock Data in the Browser

#### Option A: One-Liner in Browser Developer Tools (F12 > Console)
To completely wipe all Certrace mock data and start from a clean slate:
```javascript
Object.keys(localStorage)
  .filter(k => k.startsWith("certrace:"))
  .forEach(k => localStorage.removeItem(k));
console.log("Certrace mock data cleared.");
location.reload();
```

#### Option B: Reset Business Estate While Keeping Auth Session
If you want to clear all workspaces, suppliers, and shipments but stay signed in:
```javascript
const KEEP = new Set(["certrace:auth", "certrace:anthropic-key"]);
Object.keys(localStorage)
  .filter(k => k.startsWith("certrace:") && !KEEP.has(k))
  .forEach(k => localStorage.removeItem(k));
location.reload();
```

#### Option C: Programmatic Cleanup Utility (`lib/mock-cleanup.ts`)
The portal includes a programmatic cleanup utility in `lib/mock-cleanup.ts`:
```typescript
import { clearMockData, resetToCleanEstate, inspectMockData } from "@/lib/mock-cleanup";

// Inspect mock data keys and byte sizes
const stats = inspectMockData();

// Wipe all mock data including session
clearMockData();

// Wipe estate data but preserve session
resetToCleanEstate();
```
*(In browser environments, helper functions are automatically available globally on `window.__certraceClearMock()` and `window.__certraceResetEstate()`)*.

---

### 7.3 Production Backend Transition (ขั้นตอนตัด Mock Data เข้าสู่ระบบจริง)

To permanently disable mock data and connect to the live FastAPI backend:

1. **Configure Backend Origin:**
   Add `NEXT_PUBLIC_API_BASE_URL` in `.env.local` (for development) or Cloudflare Pages Environment Variables:
   ```bash
   NEXT_PUBLIC_API_BASE_URL=https://api.certrace.co
   ```

2. **Update Content-Security-Policy (CSP):**
   Ensure `connect-src` in `middleware.ts` and `public/_headers` whitelists the backend origin:
   ```http
   connect-src 'self' https://api.certrace.co https://api.anthropic.com;
   ```

3. **Verify Automatic Cutover (`apiConfigured()`):**
   Every store file in `lib/` adheres to the dual-mode seam:
   ```typescript
   if (!apiConfigured()) return loadFromLocalStorage();
   return await getFromApi();
   ```
   When `NEXT_PUBLIC_API_BASE_URL` is set, `apiConfigured()` returns `true`, and all queries immediately bypass local mock data.

4. **Verify Backend Contract Alignment:**
   Confirm backend implementation against `docs/API-CONTRACT.md` for:
   * `/api/v1/auth/*` (Login, Token Refresh, Current User)
   * `/api/v1/workspaces/*` (Workspaces CRUD & Snapshots)
   * `/api/v1/suppliers/*` (Suppliers, Precursors, Smart Links)
   * `/api/v1/declarations/*` & `/api/v1/reports/*`

