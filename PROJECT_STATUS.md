# 📊 สถานะโครงการและตารางเช็คลิสต์เตรียมเปิดตัว (Project Status & Launch Checklist)

ไฟล์นี้สรุปว่า **โค้ดในรีโปตอนนี้ทำอะไรได้จริงบ้าง** และเหลืออะไรที่ โบ๊ท กับ เฟิน ต้องลุยต่อก่อนปล่อยให้ Design Partner ใช้งานจริง

> อัปเดตล่าสุด: 23 ก.ย. 2026 — เช็คจากของจริงอีกรอบ: `api.certrace.co/readyz` ตอบ `ready: true, databaseConfigured: true` · `gh run list --workflow deploy.yml` + `gh run view --json jobs` · `gh secret list` / `gh variable list` · `gh pr list`
> **เปลี่ยนจาก 16 ก.ย.:** secret + GCP vars ตั้งครบแล้ว ท่อ deploy **ส่ง landing + portal ขึ้นเองได้จริง** (run ของ #105 `Deploy portal: success`)
> **backend production อยู่บน Render ไม่ใช่ Cloud Run** — `api.certrace.co` → CNAME `certrace.onrender.com` (header `rndr-id`, `x-render-origin-server`) job `Deploy backend to Cloud Run` ใน `deploy.yml` จึงเป็นอีกทางที่ยังไม่ได้ใช้ และมันล้มอยู่ (ดู R6)
> **R2 ยังเปิด แต่ต้นเหตุเปลี่ยน:** โค้ดแก้ถูกแล้ว ที่พอร์ทัลยังรับรหัสมั่วเพราะมีคนตั้ง `NEXT_PUBLIC_DEMO_MODE=1` ไว้ใน build env ฝั่ง Cloudflare เอง (ยืนยันล่าสุด 19 ก.ย.)
> สรุปสั้น: **ตัวบล็อกจริงมีข้อเดียว = ถอด demo flag ใน Cloudflare** ถอดแล้วเดิน E2E บน production ได้ทันที ที่เหลือ (R3, PR hardening, ตัดสินใจเรื่อง host ของ backend, อีเมล) ทำขนานกันได้

---

## 📈 ความคืบหน้าภาพรวม

ต้องแยกให้ชัดว่า "MVP" หมายถึงอะไร เพราะคำตอบต่างกันมาก:

| นิยามของ MVP | สถานะ | เหลืออะไร |
| :--- | :---: | :--- |
| **เปิดเดโมให้ลูกค้าดูได้** | 🟢 100% | ไม่เหลือ — `certrace.co` และ `portal.certrace.co` ขึ้นแล้ว ตอบ 200 ทั้งคู่ |
| **Design Partner ใช้งานจริง เก็บข้อมูลซัพพลายเออร์จริงได้** | 🟡 ~90% | ทั้งสามชั้นขึ้นของจริงแล้วและต่อถึงกัน แต่ **พอร์ทัลยังเปิด demo mode อยู่ (R2)** เหลือถอด flag → เดิน E2E บนโดเมนจริง → default factor ชุดจริง (R3) |

```
[████████████████████████████████████░░░░] 90%
```

ลดจาก 95% ของรอบ 16 ก.ย. เพราะรอบนั้นนับ R2 ว่าจบที่โค้ด แต่ของบนโดเมนจริงยังรับรหัสมั่วอยู่ และยังไม่รู้ว่า backend บน Render ตาม main ทันหรือเปล่า

---

## 🚨 เรื่องที่ต้องรู้ก่อนอย่างอื่น

**1) `portal.certrace.co` ยังใส่รหัสอะไรก็ล็อกอินผ่าน — เพราะ flag ใน Cloudflare ไม่ใช่เพราะโค้ด**

โค้ดแก้ครบแล้ว (default ใน [`next.config.ts`](certrace-portal/next.config.ts) เป็นค่าว่าง, `deploy.yml` ส่ง `API_URL` เข้า build) แต่ build env ฝั่ง Cloudflare มี `NEXT_PUBLIC_DEMO_MODE=1` ตั้งไว้โดยเจตนา (ยืนยันด้วยการล็อกอินรหัสมั่ว 19 ก.ย.) ใครเดาโดเมนถูกก็เข้าไปเห็นข้างในได้

> **โจ้:** ลบ `NEXT_PUBLIC_DEMO_MODE` ออกจาก build env ใน Cloudflare → rebuild → ลองล็อกอินด้วยรหัสมั่ว **ต้องไม่ผ่าน** ห้ามปิดข้อนี้ด้วยการอ่าน header

**2) backend production อยู่บน Render — ส่วน `deploy.yml` ส่งไป Cloud Run ซึ่งไม่ใช่ตัวที่ใช้งานจริง**

```
api.certrace.co → certrace.onrender.com → gcp-us-west1-1.origin.onrender.com
rndr-id: ... · x-render-origin-server: uvicorn
```

ฝั่ง Cloudflare (landing + portal) ส่งผ่าน CI ได้จริงแล้ว ส่วน backend มีสองทางที่ไม่ตรงกัน:

*   **Render (ตัวจริง)** — env (`RESEND_API_KEY`, `DATABASE_URL`, `CERTRACE_APP_BASE_URL` ฯลฯ) อยู่ใน Render dashboard ไม่ได้อยู่ในรีโป **ยังไม่รู้ว่า deploy แบบ auto จาก branch หรือกดเอง** (ไม่มี check ของ Render บนคอมมิต) และไม่รู้ว่า `alembic upgrade head` รันตอนไหน
*   **Cloud Run ใน `certrace-prod` (ไม่ได้ใช้)** — job `Deploy backend to Cloud Run` ครั้งเดียวที่รัน (merge #104, `35150974140`) ตายที่ `gcloud builds submit` เพราะ `certrace-deployer@` เข้า bucket `certrace-prod_cloudbuild` ไม่ได้ **ไม่กระทบ production** แต่จะแดงทุกครั้งที่ merge ของที่แตะ `certrace-backend/`

> ⚠️ **อย่าอ่านแค่สีของ run** เช็คด้วย `gh run view <id> --json jobs` ว่า `Deploy ...` เป็น `success` ไม่ใช่ `skipped`

---

## 🏛️ สรุปความพร้อมของแต่ละส่วน (Component Status)

| ส่วนประกอบ | ความพร้อม | ทำเสร็จแล้ว | งานที่ต้องทำต่อ |
| :--- | :---: | :--- | :--- |
| **Landing Page** | 🟢 100% | Next.js 15 หลายภาษา, ฟอร์มยิงเข้า Google Sheets แยกแท็บ, `certrace.co` ตอบ 200, deploy อัตโนมัติผ่าน `deploy.yml` แล้ว | — |
| **Outreach Scripts** | 🟢 100% | ยืนยันโดเมนบน Resend, ยิงเมลหา Design Partners ชุดแรกแล้ว | สแตนบายมอนิเตอร์ตอบกลับ |
| **Portal — หน้าจอ/UX** | 🟢 100% | ครบทุกหน้า, responsive, 2 ภาษา, เหลือพอร์ทัลเดียวแล้ว (โฟลเดอร์ซ้ำถูกลบ), empty/loading/error state ครบ | — |
| **Portal — การเชื่อมต่อข้อมูล** | 🟡 70% | auth, declarations, smart links, ไฟล์แนบ, reminder subjects ต่อ API จริงแล้วผ่าน [`lib/api/`](certrace-portal/lib/api) + TanStack Query | 🔴 **build env ใน Cloudflare ยังตั้ง `NEXT_PUBLIC_DEMO_MODE=1` → รับรหัสอะไรก็ได้ (R2)** · team / workspace / profile / monthly-requests ยังเป็น localStorage (ตั้งใจเลื่อน — ดู D2) · ไม่มี route guard และ `/api/auth/me` ไม่มีใครเรียก (ดู D4) |
| **Backend — Auth** | 🟢 100% | `register` `login` `me` `refresh` `logout` `change/forgot/reset-password` + JWT + refresh token + rate limit หน้าต่าง 15 นาที | — |
| **Backend — Smart Links** | 🟢 100% | สร้าง / resolve / save state / submit / ขอแก้ไข / ดูรายการที่ส่งมา — token ออกจากเซิร์ฟเวอร์ มีวันหมดอายุ | — |
| **Backend — เครื่องคำนวณ CBAM** | 🟢 100%* | คำนวณครบ **ทั้ง 4 เส้น** ของ fixture แล้ว (10 ก.ย.) — เชื้อเพลิงผ่านค่าความร้อน, process emission แบบ mass balance, indirect, precursor หลายชั้น พร้อม audit trace ทุกเส้น | \* ตัวเครื่องครบแล้ว แต่ยังต้องรอ **ค่า default factor ตัวจริง** (R3) ถึงจะใช้กับสินค้านอก 2 CN code ได้ |
| **Backend — อีเมลแจ้งเตือน** | 🟡 70% | เทมเพลต 7 แบบ, delivery log กันส่งซ้ำด้วย unique index, job เตือนตามตาราง, **ต่อ `DatabaseReminderSource` แล้ว** (migration `012_reminder_subjects`) · **Resend ส่งจริงจาก production แล้ว** (เมลรีเซ็ตถึงกล่องจริง 23 ก.ย.) | 🔴 job เตือนยังไม่มี scheduler สั่งรัน · เมลขอข้อมูลซัพพลายเออร์ (`SUPPLIER_DATA_REQUEST`) ไม่มีโค้ดเรียก · trial ยังไม่มี billing (ดู R4) |
| **Backend — ขึ้นของจริง** | 🟢 100% | `api.certrace.co/readyz` ตอบ 200 `{"status":"ready","databaseConfigured":true}` · preflight CORS อนุญาต `https://portal.certrace.co` จริง · validation ทำงาน (ยิง email ปลอมได้ 422) | รันอยู่บน **Render** (`certrace.onrender.com`) · ยืนยันว่า alembic เดินถึง `012` แล้วหรือยัง — ต้องยิงด้วย token จริง (ดู R1) · ยังไม่รู้วิธี deploy ของ Render (ดู R6) |
| **Deploy (ท่ออัตโนมัติ)** | 🟡 70% | [`deploy.yml`](.github/workflows/deploy.yml) เขียนครบ · secret + `GCP_*` ตั้งครบ 16 ก.ย. · **landing + portal ส่งขึ้นเองสำเร็จแล้ว** (run ของ #105) | backend production อยู่บน Render ไม่ได้ผ่าน `deploy.yml` · job Cloud Run (ไม่ได้ใช้) ล้มเรื่องสิทธิ์ GCP · ไม่มี var `EXPORTER_PORTAL_URL` (ดู R6) |
| **CI / คุณภาพโค้ด** | 🟡 85% | lint, typecheck, unit test, npm audit, pip-audit, CodeQL, secret scan, Playwright E2E — ตั้งแต่ PR #99 รันเฉพาะ job ที่ diff แตะจริง เพื่อประหยัดโควตา Free plan (2,000 นาที/เดือน) | รันเฉพาะ `pull_request` + `workflow_dispatch` เท่านั้น **push ตรงเข้า main ไม่ถูกเช็ค** ต้องสั่ง `workflow_dispatch` เอง |
| **เช็ค security header production** | 🟢 100% | [`security-headers.yml`](.github/workflows/security-headers.yml) ยิงถาม production ทุกคืน (cron `17 2 * * *`) เช็ค 5 header + HSTS ≥ 6 เดือน + ปฏิเสธ CSP ที่ยังมี `unsafe-inline` | — (บั๊ก HSTS แก้แล้ว ดู R7) |
| **Admin Portal** | ⚫ ลบแล้ว | ตัดออกจากขอบเขต MVP ตั้งแต่ต้น ไม่เคยอยู่ใน CI และไม่เคย deploy — ลบโฟลเดอร์ 10 ก.ย. และเก็บเศษที่เหลือออกอีกรอบใน PR #101 | — (ยังอยู่ใน git history ถ้าวันหนึ่งจะรื้อกลับมา) |

---

## ✅ 1. งานที่ทำเสร็จแล้วจริง (ยืนยันจากโค้ด)

*   **หลังบ้าน (FastAPI) — ส่วนที่รอบก่อนยังไม่มีเลย**
    *   [x] **Auth ครบวงจร** — [`app/routers/auth.py`](certrace-backend/app/routers/auth.py): สมัคร / ล็อกอิน / ต่ออายุ token / ออกจากระบบ / เปลี่ยน-ลืม-รีเซ็ตรหัสผ่าน ออก JWT จริง ([`app/core/tokens.py`](certrace-backend/app/core/tokens.py))
    *   [x] **Smart link ฝั่งเซิร์ฟเวอร์** — [`app/routers/links.py`](certrace-backend/app/routers/links.py) + migration `009_smart_links` ซัพพลายเออร์กรอกจากเครื่องตัวเอง แล้วผู้ส่งออกเห็นจริง
    *   [x] **Declarations ตามความหมายของพอร์ทัล** — CRUD ครบที่ [`app/routers/declarations.py`](certrace-backend/app/routers/declarations.py) (migration `006_portal_declarations`)
    *   [x] **อุดช่องโหว่ auth ทั้งสองจุดของรอบก่อน** — `/forgot-password` ส่งโค้ดทางอีเมลแล้ว ไม่คืน token ใน response อีก และ in-memory store ถูกล็อกไว้เฉพาะโหมดไม่มี `DATABASE_URL` เท่านั้น ถ้าต่อ DB แล้วล้มจะ raise ไม่ตกไปใช้ memory เงียบๆ ([`auth_service.py`](certrace-backend/app/services/auth_service.py) — อ่าน docstring บนหัวไฟล์)
    *   [x] **Schema เหลือชุดเดียว** — alembic เดินถึง `012_reminder_subjects` แล้ว (`011_uploaded_files` + `012_reminder_subjects` ขึ้น main ผ่าน PR #100) ส่วน `schema.sql` ที่เป็นซากถูกลบทิ้งแล้ว 10 ก.ย.
        > ⚠️ ไฟล์ migration อยู่ในรีโปไม่ได้แปลว่าฐานข้อมูลจริงเดินถึงแล้ว — **ไม่มีอะไรรัน `alembic upgrade head` ให้อัตโนมัติ** เคยพลาดมาแล้วกับ `009_smart_links` อาการคือ 500 `relation ... does not exist` ตอนยิง endpoint แรกที่แตะตาราง ไม่ใช่ start ไม่ขึ้น
    *   [x] **อีเมลแจ้งเตือน** — เทมเพลต, transport, delivery log กันส่งซ้ำ, ตารางเตือนซัพพลายเออร์ ([`services/reminders.py`](certrace-backend/app/services/reminders.py), [`services/reminder_schedule.py`](certrace-backend/app/services/reminder_schedule.py))
    *   [x] **ปิดช่องโหว่ auth ชุดใหญ่จาก audit** (ยืนยันจากโค้ดบน main 16 ก.ย.) — `_rate_limit_or_429` คุมครบทุกทาง: `register` 5 / `login` 10 / `change-password` 10 / `forgot-password` 5 / `reset-password` 10 ต่อหน้าต่าง 15 นาที คีย์ด้วยอีเมล (เป้าของการเดา) จึงไม่ต้องไว้ใจ proxy header · รหัสรีเซ็ตมี **สองรั้ว** คือหน้าต่างนี้กับ `MAX_RESET_ATTEMPTS` ต่อโค้ด (migration `007`) หน้าต่างชะลอสายน้ำ ส่วน cap ปิดยอดรวมข้ามหน้าต่าง · `change_password` ใช้ `Depends(current_account)` แล้ว ไม่เป็น credential oracle ที่ยิงได้โดยไม่ล็อกอินอีก
        > ⚠️ **เพดานที่รู้ตัว:** limiter เป็น dict ใน process เดียว บน `app.state` และ Dockerfile pin `uvicorn --workers 1` ไว้ — วันที่สเกลเกินหนึ่ง instance ลิมิตจะคูณตามจำนวน instance **เงียบๆ ไม่มีอะไรฟ้อง** ต้องย้ายไป Redis พร้อมกัน (อยู่ในรายการ post-MVP แล้ว)
    *   [x] **เทสต์ 14 ไฟล์** ครอบคลุม auth hardening, refresh, smart links, onboarding, notifications, reminders, parity
*   **หน้าบ้านพอร์ทัล (Next.js 15 + React 19)**
    *   [x] ครบทุกหน้าตามสถาปัตยกรรม CBAM definitive period + สลับภาษา TH/EN + empty/loading/error state
    *   [x] **ต่อ API จริงแล้ว** — [`lib/api/`](certrace-portal/lib/api) (auth, declarations, links, session, http) และ store ที่สำคัญเรียกผ่านมันแล้ว: [`declarations-store.ts`](certrace-portal/lib/declarations-store.ts), [`links-query.ts`](certrace-portal/lib/links-query.ts), [`auth-flow.ts`](certrace-portal/lib/auth-flow.ts)
    *   [x] Smart link ฝั่งซัพพลายเออร์ไม่มีสำเนา localStorage แล้ว — เซิร์ฟเวอร์เป็นคนเขียนคนเดียว, autosave ที่ล้มถูก retry, ที่ทำตอนออฟไลน์ถูกพักไว้แล้วส่งต่อเมื่อเน็ตกลับมา
    *   [x] ออกรายงาน PDF และ CBAM XML ฝั่ง client
    *   [x] **Unit test 497 ตัว ผ่านหมด** (`npm run test:unit` — รันจริงวันที่ 7 ก.ย.) + Playwright E2E 6 ไฟล์ (auth, dashboard, onboarding, smart links, reports, landing→portal)
*   **Deploy & CI**
    *   [x] [`deploy.yml`](.github/workflows/deploy.yml) — merge เข้า main แล้วส่งเฉพาะแอปที่ถูกแก้ขึ้น Cloudflare/Cloud Run แล้วยิงเช็ค header ที่ production จริง รวมถึงจับ CSP ที่ยังอนุญาต unsafe-inline — **ส่ง landing + portal ได้จริงแล้ว** ส่วน backend production อยู่บน Render ไม่ได้ส่งจากท่อนี้ (ดู 🚨 + R6)
    *   [x] `certrace.co`, `portal.certrace.co` และ **`api.certrace.co`** ตอบ 200 ทั้งสามตัว (ยิงเช็ค 16 ก.ย.)
    *   [x] [`security-headers.yml`](.github/workflows/security-headers.yml) — ยามกลางคืนแยกต่างหาก ไม่มี push trigger โดยตั้งใจ (push เข้า main จะเริ่ม deploy พอดี probe จะไปอ่าน build ที่กำลังจะถูกแทน)
    *   [x] [`ci.yml`](.github/workflows/ci.yml) — รันครั้งเดียวต่อการเปลี่ยนแปลง เฉพาะ job ที่ diff แตะจริง ข้าม draft PR (PR #99)
*   **Landing & Outreach**
    *   [x] ฟอร์มทุกตัวบน landing ยิงเข้า Google Sheets แยกตามแท็บ ผ่าน [`apps-script/lead-capture.gs`](apps-script/lead-capture.gs)
    *   [x] ยืนยันโดเมนอีเมลแบรนด์บน Resend และยิงเมลหา Design Partners ชุดแรกแล้ว

---

## 🔴 2. เหลืออะไร — เรียงตามที่บล็อกกันอยู่

#### **R1. Backend ขึ้นของจริงแล้ว — ✅ ปิด 16 ก.ย.**
รอบก่อนเขียนไว้ว่า `https://api.certrace.co/readyz` ได้ **403 จาก Cloudflare** (DNS record เปล่า) — ตอนนี้ได้ **200**:

```
{"service":"certrace-backend","status":"ready","ready":true,"databaseConfigured":true}
```

`databaseConfigured: true` แปลว่า `DATABASE_URL` เข้าไปถึง service จริง ไม่ได้ตกไปใช้ in-memory store และ preflight CORS ก็ตอบ `access-control-allow-origin: https://portal.certrace.co` ตรงตัว แปลว่า `CERTRACE_CORS_ALLOWED_ORIGINS` ตั้งถูกแล้ว

*   [x] Postgres ต่อแล้ว, secret ครบ, service ขึ้นแล้ว, domain mapping `api.certrace.co` ใช้งานได้
*   [x] CORS ตั้งถูก — ยืนยันด้วย preflight จริง ไม่ได้เดาจาก config
*   [x] เพิ่ม job deploy backend ใน [`deploy.yml`](.github/workflows/deploy.yml) — ทำแล้ว 10 ก.ย.
*   [ ] body size limit — เหตุผลเดิม "Cloud Run รับได้ 32 MiB" ใช้ไม่ได้แล้วเพราะตัวจริงอยู่บน Render หลัง Cloudflare proxy — อัปใบเซอร์ขนาดใกล้ 15 MB จริงหนึ่งครั้งตอน E2E ก็ปิดข้อนี้ได้
*   [ ] **ยังต้องยืนยัน: alembic เดินถึง `012` แล้วหรือยัง** — ยิง `/api/v1/links/<token>ปลอม` ได้ 404 (ไม่ใช่ 500) พิสูจน์ได้แค่ว่า `009_smart_links` ลงแล้ว ส่วน `011_uploaded_files` กับ `012_reminder_subjects` ต้องล็อกอินจริงแล้วยิง endpoint อัปโหลด/reminder ถึงจะรู้ **ถ้ายังไม่ได้รัน อาการจะโผล่ตอน Design Partner อัปใบเซอร์ใบแรก ไม่ใช่ตอนนี้**
*   [x] ตั้ง repository variable ฝั่ง GCP 4 ตัว (`GCP_PROJECT_ID`, `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_DEPLOY_SERVICE_ACCOUNT`, `GCP_RUNTIME_SERVICE_ACCOUNT`) — ตั้งครบ 16 ก.ย. (ใช้กับ Cloud Run ซึ่งไม่ใช่ production ดู R6)

> ⚠️ **สองตัวแปรที่ลืมแล้วเจ็บ** (เพิ่งเพิ่มเข้าตาราง env ของ README รอบนี้)
> `CERTRACE_JWT_SECRET` — ไม่มีแล้ว **แอปไม่ start เลย** ถ้ามี `DATABASE_URL` ([`main.py:68`](certrace-backend/app/main.py:68)) อาการคือ revision ไม่ผ่าน startup probe
> `CERTRACE_APP_BASE_URL` — อันนี้ร้ายกว่า เพราะ**ไม่มีอาการอะไรเลย** ไม่ตั้งแล้ว service ยังขึ้นปกติ ผ่าน probe ปกติ แต่ smart link ทุกอันที่ mint ออกไปจะชี้ไป `https://app.certrace.co` ตาม default ([`config.py:51`](certrace-backend/app/config.py:51)) ซึ่งเป็นโดเมนที่ไม่มีอยู่จริง กว่าจะรู้ตัวคือตอนซัพพลายเออร์กดลิงก์ในอีเมลที่เราส่งไปแล้ว — ต้องตั้งเป็น `https://portal.certrace.co`

#### **R2. พอร์ทัล production ยังรับรหัสอะไรก็ได้ — 🔴 โค้ดจบแล้ว เหลือถอด flag ใน Cloudflare (23 ก.ย.)**

> **สถานะ 23 ก.ย.:** ทุกอย่างฝั่งรีโปเสร็จแล้ว (`API_URL` ตั้งแล้ว, portal deploy ผ่าน CI แล้ว) ที่ยังรับรหัสมั่วเพราะ build env ใน Cloudflare ตั้ง `NEXT_PUBLIC_DEMO_MODE=1` ไว้ **เป็นการเลือกเปิดเอง ไม่ใช่ default หลุด** ทางออกมีทางเดียวคือลบ flag นั้น (backend พร้อมรับแล้ว)
>
> ⚠️ ระวัง: ถ้ามี `NEXT_PUBLIC_DEMO_MODE=1` ธงนี้จะเปิด demo mode แม้ `API_URL` จะตั้งไว้ — อย่าสรุปจากแค่การที่ build ชี้ไป `api.certrace.co` ต้องลองล็อกอินด้วยรหัสมั่วเท่านั้น
>
> ด้านล่างคือบันทึกของรอบ 16 ก.ย. เก็บไว้เป็นบทเรียน
**ข้อนี้เคยถูกปิดไปแล้วรอบเช้า แล้วปรากฏว่าปิดผิด** — ลองล็อกอิน `portal.certrace.co` ด้วยรหัสมั่ว **แล้วเข้าได้** นั่นแปลว่า `demoModeEnabled()` ยังเป็น true บนโดเมนจริง คือ `apiConfigured()` เป็น false คือ build ที่เสิร์ฟอยู่ **ไม่มี** `NEXT_PUBLIC_API_BASE_URL`

หลักฐานที่ใช้ปิดรอบก่อนคือ CSP ของ `/login` มี `connect-src ... https://api.certrace.co` ซึ่งค่านั้นมาจาก [`build-csp-headers.mjs:154`](certrace-portal/scripts/build-csp-headers.mjs:154) ที่อ่าน `NEXT_PUBLIC_API_BASE_URL` ตอน build จึงสรุปว่า build ต้องมีค่านี้แน่ๆ **เหตุผลถูก แต่ข้อสรุปผิด** และนี่คือบทเรียนของข้อนี้:

*   header กับ bundle **มาจากคนละที่** — header เสิร์ฟจาก asset layer ([`public/_headers`](certrace-portal/public/_headers)) ส่วนหน้าที่ล็อกอินได้มาจาก bundle ทั้งคู่ขึ้นด้วยมือ ไม่มีอะไรรับประกันว่ามาจาก build เดียวกัน
*   **หลักฐานทางอ้อมไม่ใช่การทดสอบ** ข้อนี้ทดสอบตรงๆ ได้ในสิบวินาที (กรอกรหัสมั่ว) แต่รอบก่อนเลือกอนุมานจาก header แทน

**ต้นเหตุจริงคือ default `"1"`** ใน [`next.config.ts:54`](certrace-portal/next.config.ts:54) — `env` block นี้ฝังค่าลง bundle ตอน build ทุก build ที่ไม่ได้สั่งเป็นอย่างอื่นจึงเปิด demo mode ให้เอง ไม่ใช่ "กับดักที่รอวันเกิด" อย่างที่เขียนไว้รอบก่อน แต่มันเกิดไปแล้ว

> ⚠️ **`NEXT_PUBLIC_*` ตั้งใน `wrangler.jsonc` ไม่มีผล** — Next ฝังค่าเหล่านี้เป็นค่าคงที่ตอน build ส่วน `vars` ของ wrangler เป็น runtime binding ของ Worker ที่มาถึงหลังการแทนค่าไปแล้ว

*   [x] **default เปลี่ยนเป็นค่าว่างแล้ว** ([`next.config.ts:54`](certrace-portal/next.config.ts:54)) — demo mode ต้องขอเองด้วย `NEXT_PUBLIC_DEMO_MODE=1` เท่านั้น
*   [x] **ตั้ง `NEXT_PUBLIC_API_BASE_URL` ใน env ของ step build** ใน [`deploy.yml`](.github/workflows/deploy.yml) — อ่านจาก repository **secret** `API_URL` ตั้งเฉพาะ portal, landing ได้ค่าว่าง
*   [x] **ไม่ใส่ค่า fallback** — ถ้า `API_URL` ว่าง job portal ตายที่ step `Fail early if the portal has no backend to point at` ก่อน build ด้วยซ้ำ เพราะ URL ที่ "ดูน่าจะถูก" ฝังลง bundle ไปแล้วแก้ไม่ได้จนกว่าจะ build ใหม่ และอาการจะไปโผล่ในเบราว์เซอร์ของลูกค้าไม่ใช่ใน log
*   [x] **secret `API_URL` บน GitHub** — ตั้งแล้ว 16 ก.ย. (`gh secret list` เห็น)
*   [x] **ลบ `vars` ทิ้งจาก [`wrangler.jsonc`](certrace-portal/wrangler.jsonc)** พร้อมคอมเมนต์อธิบายว่าทำไมห้ามเอากลับมา
*   [ ] **โจ้:** ลบ `NEXT_PUBLIC_DEMO_MODE` ออกจาก build env ของ Cloudflare แล้ว rebuild — **ข้อนี้ปิดได้ก็ต่อเมื่อลองกรอกรหัสมั่วแล้วไม่ผ่าน** ห้ามปิดด้วยการอ่าน header อีก
    > ถ้าหลัง deploy แล้วขึ้นว่า "ใช้งานไม่ได้" แทนที่จะเป็นรหัสผิด นั่นคือคนละอาการ: `apiConfigured()` เป็น false → env ไม่เข้า build หรือ backend ต่อไม่ติด แต่เป็นอาการที่ปลอดภัย (`authUnavailable()` ไม่ปล่อยใครเข้า)
*   [ ] **โบ๊ท & เฟิน:** รัน `npm run test:e2e:prod` ยิงโฟลว์จริงบนโดเมนจริง แล้วเดินด้วยมืออีกรอบ: สมัคร → สร้าง declaration → ส่งลิงก์ → เปิดจากอีกเครื่อง → กรอก → **อัปใบเซอร์** (ตัวนี้จะพิสูจน์ `011` ไปในตัว) → ส่งกลับ ← **นี่คืองานที่เหลือจริงของ R2**

#### **R3. ค่า EU default factor ยังเป็นไฟล์ตัวอย่าง**
[`default_factors.template.csv`](certrace-backend/default_factors.template.csv) มีแค่ **2 แถว** (เหล็ก 1 CN code, อะลูมิเนียม 1 CN code) สินค้าที่อยู่นอกสอง CN นี้จะได้ตัวเลขผิดทันที
*   [ ] **เฟิน:** ทำตาราง EU default values ให้ครบ CN code ที่เรารองรับ แล้ว import ด้วย `import_default_factors.py`
*   [ ] **เฟิน & โบ๊ท:** เอาตัวเลขจริงมากรอกเทียบกับที่เคยคำนวณใน Excel
*   [ ] **merge PR #107 ก่อน import** — ให้รับ EU default factor ที่ประกาศไว้ระดับหัวข้อ (ต่ำกว่า CN8 เต็ม) ได้ ไม่งั้นแถวพวกนั้นจะถูกปฏิเสธตอน import · ⚠️ #107 แตะ backend — หลัง merge ต้องยืนยันว่า Render deploy ตัวใหม่แล้ว (ดู R6)

#### **R4. อีเมลเตือนซัพพลายเออร์ — 🟡 โค้ดต่อ source จริงแล้ว แต่ยังไม่มีอะไรสั่งให้ส่ง (23 ก.ย.)**
[`app/jobs/send_reminders.py`](certrace-backend/app/jobs/send_reminders.py) เคยต่อกับ `NullSource` กลไกถูกหมดแล้ว (กันส่งซ้ำ, ปล่อย claim เมื่อส่งไม่สำเร็จ) ขาดแค่แหล่งข้อมูล — ตอนนี้มีแล้ว

> ⚠️ **สิ่งที่เจอตอนลงมือ:** ข้อนี้เขียนไว้ว่า "ย้าย `monthly-requests` ไปหลัง API" แต่ของจริงกระจายอยู่ **3 store** ไม่ใช่อันเดียว — `workspace` (เดือน+กำหนดส่ง), `supplier-companies` (**อีเมลที่จะส่งไปหา**) และ `month-dispatch` (ส่งไปหรือยัง) ส่วน `monthly-requests` เป็นของเก่าที่ workspace มาแทนแล้ว
> ถ้าย้ายทั้งกองก็คือทำ D2 ทั้งข้อ ซึ่งยังเป็นเรื่องที่ต้องตัดสินใจอยู่ เลยเลือกให้พอร์ทัล**ลงทะเบียนเฉพาะสิ่งที่ job ต้องใช้**ตอนกดส่งแทน

*   [x] ตาราง `reminder_subjects` + 5 endpoint ([API contract §8](docs/API-CONTRACT.md)) — พอร์ทัลบอกเซิร์ฟเวอร์ว่า "ขอเดือนนี้จากรายนี้ ส่งไปที่อีเมลนี้ ครบกำหนดวันนี้"
*   [x] `DatabaseReminderSource` แทน `NullSource` เมื่อมี `DATABASE_URL` — บันได/การ claim/ข้อความไม่ต้องแก้อะไรเลย ตรงตามที่ docstring เดิมเขียนไว้ว่าจะเหลือแค่ adapter เดียว
*   [x] พอร์ทัลต่อแล้ว — กดส่งเดือน = ลงทะเบียน + ทำเครื่องหมายว่าส่ง, ซัพพลายเออร์ตอบ = ปิดการตาม
*   [x] **ขึ้น main แล้ว** (16 ก.ย.) — PR #98 merge เข้า feature branch ไม่ใช่ main จึงดูเหมือนไม่เคยขึ้น ตัวที่พามาจริงคือ **PR #100** (`claude/r4-r5-to-main`)
*   [x] ~~ต้องรอ R1~~ — R1 ปิดแล้ว มีฐานข้อมูลจริงแล้ว endpoint ไม่ตอบ 503 อีก
*   [ ] **อีเมลเตือน trial ยังส่งไม่ได้** — plan/billing ยังไม่มีฝั่งเซิร์ฟเวอร์เลย ถ้าเดาวันหมดอายุเองจะกลายเป็นส่งเรื่องที่ระบบไม่ได้บังคับใช้จริง
*   [ ] **job ยังไม่มีอะไรสั่งให้รัน** (เช็ค 23 ก.ย.) — `python -m app.jobs.send_reminders` ไม่มี cron / scheduler ในรีโปเลย และบน Render ก็ยังไม่รู้ว่ามี Cron Job ตั้งไว้หรือเปล่า **เมลเตือนซัพพลายเออร์จึงยังไม่ส่งจริง** → ตั้ง Render Cron Job (หรือ scheduler ของ host ที่เลือกใน R6) รันทุกคืน แล้วเช็ค `notification_deliveries` หลังคืนแรก
*   [ ] **เมลแรกที่ขอข้อมูลซัพพลายเออร์ยังไม่ถูกส่งโดยระบบ** — มีเทมเพลต `SUPPLIER_DATA_REQUEST` แต่ไม่มี router ไหนเรียก ตอนนี้พอร์ทัลแค่ copy ลิงก์ลง clipboard ผู้ส่งออกต้องส่งเอง ตัดสินใจว่าจะต่อก่อนปล่อยไหม (~ครึ่งวัน)
*   [x] **Resend ส่งออกจาก production จริงแล้ว** (23 ก.ย.) — ตั้ง `RESEND_API_KEY` + `CERTRACE_EMAIL_SENDER` + `CERTRACE_EMAIL_REPLY_TO` + `CERTRACE_EMAIL_DELIVERY=resend` บน Render แล้ว redeploy → ยิง `POST /api/auth/forgot-password` ด้วยบัญชีของทีม ได้ 200 และ **เมลรีเซ็ตมาถึงกล่องจริง**
    > ตั้ง `CERTRACE_EMAIL_DELIVERY=resend` แบบ explicit โดยเจตนา — ถ้าวันไหน key หรือ sender หาย แอปจะ start ไม่ขึ้น ([`email.py`](certrace-backend/app/services/email.py)) แทนที่จะเลือก transport `off` แล้วเงียบ · ครอบคลุมแค่เมลรีเซ็ต/เปลี่ยนรหัสผ่าน ข้อ scheduler กับ `SUPPLIER_DATA_REQUEST` ด้านบนยังเปิดอยู่

#### **R5. อัปโหลดไฟล์ — ✅ ทำแล้ว 10 ก.ย.**
เดิมไฟล์เก็บเป็น base64 ใน localStorage ตันที่ ~1.5 MB ที่ใหญ่กว่านั้นเหลือแค่ชื่อ+ขนาด — ใบเซอร์จริงส่วนใหญ่ใหญ่กว่านั้นและหายไปเลย
*   [x] **ท่ออัปโหลดจริง** — endpoint ครบทั้งฝั่งผู้ส่งออกและซัพพลายเออร์ ([API contract §7](docs/API-CONTRACT.md)) ไฟล์ขึ้นไปเป็น raw body ไม่ใช่ base64
*   [x] **จำกัดชนิดและขนาด** — pdf / png / jpeg / csv / xlsx, ค่าเริ่มต้น 15 MB และ**เช็ค magic bytes** ว่าตรงกับชนิดที่ประกาศมาจริง
*   [x] **สิทธิ์** — token ของ smart link อ่านได้เฉพาะไฟล์ที่ตัวเองอัป, ไฟล์คนอื่นตอบ 404 ไม่ใช่ 403, ดาวน์โหลดเป็น attachment เสมอ
*   [x] **พอร์ทัลต่อแล้ว** — ซัพพลายเออร์อัปขึ้นเซิร์ฟเวอร์เมื่อมี backend / ตกกลับไป base64 ตอน demo mode และผู้ส่งออกกดโหลดไฟล์กลับมาได้
*   [x] **ขึ้น main แล้ว** (16 ก.ย.) — เหมือน R4 คือ PR #97 merge เข้า feature branch ตัวที่พามา main จริงคือ **PR #100** ตามด้วย **PR #102**
*   [ ] **ยังไม่เคยอัปไฟล์จริงผ่านโดเมนจริง** — ทางเดินนี้ยังไม่ถูกเดินสักครั้งบน production ถ้า `011_uploaded_files` ยังไม่ถูก migrate จะรู้ตัวตรงนี้ (ดู R1)
*   [ ] **ตัดสินใจ:** ตอนนี้ไบต์เก็บใน PostgreSQL ไม่ใช่ bucket — ตั้งใจ เพราะยังไม่มี bucket และ Design Partner ติดอยู่ตอนนี้ มี `ObjectStore` คั่นไว้ให้ย้ายทีหลังโดยไม่ต้องแก้ route
    > ราคาที่จ่าย: ไฟล์ 15 MB คือ 15 MB ในฐานข้อมูล ในทุก backup และในทุก dump ระดับไม่กี่ร้อยใบไม่มีปัญหา ระดับหลักหมื่นใบต้องย้ายจริง
*   [ ] Antivirus scan ยังไม่มี (อยู่ในรายการ post-MVP)

#### **R6. ท่อ deploy — 🟡 Cloudflare ส่งได้แล้ว, backend อยู่บน Render คนละทางกับ CI (23 ก.ย.)**
landing + portal ส่งผ่าน `deploy.yml` ได้จริง แต่ backend production คือ **Render** (`certrace.onrender.com`) ส่วน `deploy.yml` สร้างไว้ส่งไป **Cloud Run** ใน `certrace-prod` / `asia-southeast1` ซึ่งยังไม่เคยสำเร็จและไม่ได้เสิร์ฟ `api.certrace.co` — สองทางนี้ต้องเลือกให้เหลือทางเดียว

*   [ ] **เฟิน: ตัดสินใจว่า backend อยู่ที่ไหน** — อยู่ Render ต่อ หรือย้ายไป Cloud Run ตามที่ `deploy.yml` เขียนไว้
    *   **ถ้าอยู่ Render:** ปิด/ลบ job `Deploy backend to Cloud Run` (ไม่งั้นแดงทุก merge ที่แตะ backend) และเขียนลง README ว่า Render deploy แบบไหน (auto จาก `main`? กดเอง?) + migration รันตอนไหน
    *   **ถ้าย้าย Cloud Run:** ให้สิทธิ์ `certrace-deployer@certrace-prod.iam.gserviceaccount.com` ใช้ Cloud Build (ตายที่ `forbidden from accessing the bucket [certrace-prod_cloudbuild]` / ขาด `serviceusage.services.use`) → dispatch Deploy ให้ขึ้น → ย้าย env จาก Render ให้ครบ → สลับ DNS `api.certrace.co`
*   [x] ~~env อีเมลบน Render~~ — `RESEND_API_KEY` + sender + `CERTRACE_EMAIL_DELIVERY=resend` ตั้งแล้ว ส่งจริงผ่าน (ดู R4)
*   [x] **`CERTRACE_APP_BASE_URL=https://portal.certrace.co` ตั้งบน Render แล้ว** (23 ก.ย.) — ค่านี้ถูกอ่านตอน start ([`main.py:118`](certrace-backend/app/main.py:118)) และใช้แค่ตอนสร้าง smart link ([`links.py:306`](certrace-backend/app/routers/links.py:306)) ซึ่งต้องล็อกอิน จึงยังพิสูจน์จากข้างนอกไม่ได้
    > **ปิดให้ขาดตอนเดิน E2E (R2):** ลิงก์แรกที่สร้างต้องขึ้นต้นด้วย `https://portal.certrace.co/s/` ถ้าเห็น `app.certrace.co` แปลว่า Render ยังไม่ได้ restart หลังตั้งค่า
*   [x] **API docs ปิดอยู่บน production** — `/docs`, `/redoc`, `/openapi.json` ตอบ 404 ทั้งหมด (เช็ค 23 ก.ย.) · #110 ยังควร merge เพื่อให้ปิดเป็น default ไม่ต้องพึ่ง env
*   [ ] **โบ๊ท:** ใส่ `EXPORTER_PORTAL_URL=https://portal.certrace.co` เป็น repository **variable** — ตอนนี้ยังไม่มี step เช็ค security header หลัง deploy จึง `exit 0` ผ่านเฉยๆ (nightly probe ยังเขียวทุกคืน จึงไม่เร่ง)
*   [x] `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` + `API_URL` (secret) — ตั้งแล้ว 16 ก.ย.
    > หมายเหตุ `API_URL`: ค่านี้ไม่ลับจริง มันถูกฝังลง JS bundle ที่ใครก็โหลดไปอ่านได้ เก็บเป็น secret จึงได้แค่ mask ใน log — ถ้าอยากให้ debug ง่ายขึ้น ย้ายไป Variables แล้วสลับ `secrets.API_URL` เป็น `vars.API_URL` สองที่ใน `deploy.yml`
*   [x] `GCP_*` 4 ตัว — ตั้งแล้ว 16 ก.ย.
*   [x] โควตา Actions — มีบัตร + hard-stop budget $12 ตั้งแต่ 16 ก.ย. (ไลออนดูแล billing)
*   [x] merge ทดสอบแล้ว — #105 `Deploy portal: success` (ไม่ใช่ skipped) · #104 `Deploy portal` + `Deploy landing` success, job Cloud Run failure (ไม่กระทบ production)

#### **R7. เช็ค security header ที่ production — ✅ แก้บั๊ก HSTS แล้ว**
[`security-headers.yml`](.github/workflows/security-headers.yml) ยิงถามโดเมนจริงทุกคืน (cron `17 2 * * *`) เพราะ config ถูกไม่เท่ากับ production ถูก — `next.config.ts` ประกาศ header ครบมาหลายเดือนขณะที่หน้า prerender ออกไปโดยไม่มี header สักตัว เพราะ Cloudflare เสิร์ฟจาก asset layer ไม่เรียก Worker ไม่มีอะไรในรีโปจับได้

*   [x] **บั๊ก HSTS แก้แล้ว** — เดิมอ่าน `max-age` ตัวแรกที่เจอในทั้ง response ซึ่งไปเจอ `cache-control: ... max-age=0` ของพอร์ทัลก่อน ทำให้ **fail ทุกรอบ** ตอนนี้ล็อกให้อ่านจากบรรทัด `strict-transport-security:` เท่านั้น
*   [x] เกณฑ์ไม่ใช่แค่ "มี header" — HSTS ต้อง `max-age ≥ 15768000` (6 เดือน) และ `script-src` ที่ยังมี `unsafe-inline` ถือว่า fail (CSP ที่ผ่านทุกข้อแต่ยังปล่อย inline script รันได้ = ซื้อมาเปล่าๆ)
*   [x] ยิงทั้ง `/` ของสองโฮสต์ + `/login` โดยเจตนา — `/` คือหน้า prerender ซึ่งเป็นเคสที่เคยไม่มี header จริงๆ ถ้ายิงแต่ route ที่ render ตอน runtime จะผ่านหมดโดยไม่เจออะไร
*   [x] ไม่มี push trigger โดยตั้งใจ — push เข้า main จะเริ่ม deploy พอดี probe ที่ยิงตอนนั้นจะไปอ่าน build ที่กำลังจะถูกแทน

#### **R8. PR ค้าง 7 ตัว — CI เขียวและ mergeable ทุกตัว แต่ยังไม่มีใครรีวิวสักตัว (23 ก.ย.)**
merge เข้า main = portal/landing auto-deploy ทันที ให้ merge **ทีละตัว** แล้วเช็ค job ของ Deploy ทุกครั้ง ตัวที่แตะ backend ต้องเช็คฝั่ง Render แยกว่าขึ้นแล้ว (และ job Cloud Run จะแดงจนกว่า R6 จะตัดสินใจ)

| PR | เรื่อง | ก่อนปล่อย? |
| :--- | :--- | :--- |
| [#110](https://github.com/certrace/Certrace/pull/110) | ปิด interactive API docs บน production โดย default | ✅ ควรเข้า (hardening) |
| [#109](https://github.com/certrace/Certrace/pull/109) | ไฟล์ xlsx ต้องมีโครงสร้าง OOXML จริงถึงรับ | ✅ ควรเข้า (hardening) |
| [#108](https://github.com/certrace/Certrace/pull/108) | ตรวจ scheme ของ `linkUrl` ก่อนใส่ลงอีเมล | ✅ ควรเข้า (hardening) |
| [#107](https://github.com/certrace/Certrace/pull/107) | รับ EU default factor ที่ต่ำกว่า CN8 เต็ม | ✅ ผูกกับ R3 |
| [#106](https://github.com/certrace/Certrace/pull/106) | Sign in with Google | ตัดสินใจ — `GOOGLE_CLIENT_ID` ตั้งไว้แล้ว |
| [#111](https://github.com/certrace/Certrace/pull/111) | Smart upload (ลากเอกสารมา ระบบตรวจเอง) | ตัดสินใจ — BD+ESG อนุมัติแล้ว 20 ก.ย. |
| [#112](https://github.com/certrace/Certrace/pull/112) | ระงับบัญชี, ทำข้อมูลนิรนาม, audit trail, revoke รายลิงก์ | ⚠️ ดูให้ดี — ใกล้เรื่อง role/permission ที่ยังพักรอ business + ESG |

---

## 🟡 3. ต้องตัดสินใจ

#### **D1. เครื่องคำนวณสองตัว — ✅ ปิดช่องว่างแล้ว 10 ก.ย.**
golden fixture กลางที่ทั้งสองฝั่งอ่านไฟล์เดียวกัน ([`docs/fixtures/golden-eaf-2026.json`](docs/fixtures/golden-eaf-2026.json)) ยังอยู่ และ **backend คำนวณครบทั้ง 4 เส้นแล้ว** ตัวเลขตรงกับพอร์ทัลทุกเส้น
*   [x] **เชื้อเพลิง** — เพิ่มหน่วย `GJ` / `MTQ` / `KGM` / `LTR` และค่าความร้อน (`net_calorific_value`) เข้าโมเดล ถ้าส่งปริมาณที่วัดมาโดยไม่มีค่าความร้อนจะ **ปฏิเสธ ไม่เดาค่ามาตรฐานให้** (ก๊าซธรรมชาติ 0.0561 tCO2/GJ ถ้าอ่านผิดเป็น tCO2/m³ ตัวเลขบานขึ้นราว 25 เท่า)
*   [x] **Process emission** — เพิ่ม input แยกพร้อม trace method `MASS_BALANCE` และค่าคงที่ `CO2_PER_C = 3.664` ที่ผู้เรียก **ตั้งเองไม่ได้** จะได้ไม่มีใครยื่นด้วยค่า 44/12 ของตัวเอง
*   [x] **Precursor หลายชั้น** — มี `children` + ค่าการปล่อยของชั้นตัวเอง คำนวณจากล่างขึ้นบน กันวงจรและจำกัดความลึก 10 ชั้นเท่าฝั่งพอร์ทัล
*   [ ] **ตัดสินใจ:** จะย้ายให้ backend เป็น source of truth ของตัวเลขที่ยื่นจริงเมื่อไหร่ — ตอนนี้พอร์ทัลยังเป็นคนคำนวณสิ่งที่ลูกค้าเห็น ความพร้อมมีแล้ว เหลือแค่ตัดสินใจว่าจะสลับตอนไหน

#### **D2. Store ที่ยังไม่ได้ย้ายขึ้นเซิร์ฟเวอร์**
`team-store`, `workspace-*`, `profile`, `monthly-requests`, `precursor-suppliers`, evidence ยังเป็น localStorage ทั้งหมด
ตาม [API contract](docs/API-CONTRACT.md) ข้อ 6 อันนี้ **ตั้งใจเลื่อน** เพราะ state ของซัพพลายเออร์เดินทางเป็น JSON ก้อนเดียวอยู่แล้ว
*   [ ] ยืนยันว่ายังยอมรับได้ — ผลคือข้อมูลทีม/โปรไฟล์/คำขอรายเดือนผูกกับเบราว์เซอร์เครื่องเดียว **ย้ายเครื่องแล้วหาย**
    > อัปเดต 16 ก.ย.: ข้อนี้เคยเขียนว่า "ทำให้ R4 ทำงานไม่ได้" — ไม่จริงแล้ว R4 เลี่ยงไปโดยให้พอร์ทัล**ลงทะเบียนเฉพาะสิ่งที่ job ต้องใช้** (`reminder_subjects`) ตอนกดส่ง แทนที่จะย้ายทั้ง 3 store ขึ้นเซิร์ฟเวอร์ ตัวอีเมลเตือนจึงไม่รอ D2 อีกต่อไป แต่ที่ยังจริงคือย้ายเครื่องแล้วข้อมูลที่เหลือหาย

#### **D4. Session ฝั่งพอร์ทัลยังไม่มียาม — 🔴 ใหม่ 16 ก.ย.**
ข้อนี้จะเริ่มมีความหมายก็ต่อเมื่อพอร์ทัลบนโดเมนจริงต่อ `api.certrace.co` แล้วเท่านั้น — ตราบใดที่ยังเป็น demo mode (R2) การไม่มียามไม่ใช่ประเด็น เพราะหน้า login ก็ปล่อยทุกคนเข้าอยู่ดี
*   [ ] [`middleware.ts`](certrace-portal/middleware.ts) มีแต่เรื่อง CSP/matcher **ไม่มี redirect ตอนไม่ได้ล็อกอิน** — เปิด URL หน้าในตรงๆ ไม่มีอะไรกั้นที่ชั้น routing
*   [ ] `/api/auth/me` ประกาศไว้ที่ [`lib/api/auth.ts:98`](certrace-portal/lib/api/auth.ts:98) แต่ **ไม่มีใครเรียกเลยทั้งรีโป** → โหลดหน้ามาไม่เคยยืนยันกับเซิร์ฟเวอร์ว่า session ยังใช้ได้, ธง `onboarded` ที่ backend เก็บไว้ไม่เคยถูกอ่าน, onboarding ยังตัดสินจาก localStorage อย่างเดียว
*   [ ] ผลที่เห็นได้จริง: token หมดอายุหรือถูก revoke แล้ว UI ยังทำเหมือนล็อกอินอยู่จนกว่าจะมี request แรกเด้ง 401

> ความรุนแรงจำกัด เพราะข้อมูลจริงถูกกันที่ backend ทุก endpoint อยู่แล้ว (เป็นเจ้าของหรือไม่เป็น) — ที่พังคือ UX กับความน่าเชื่อถือของหน้าจอ ไม่ใช่การรั่วของข้อมูล

#### **D3. เศษที่ค้างในรีโป**
*   [x] ลบ `certrace-admin-portal` — ทำแล้ว 10 ก.ย. (47 ไฟล์ ไม่มีอะไรนอกโฟลเดอร์อ้างถึงนอกจากเอกสาร) และเก็บเศษที่ยังเหลือออกอีกรอบใน PR #101 (16 ก.ย.)
    > ถ้าในเครื่องยังมี `certrace-admin-portal/next-env.d.ts` หรือ `tsconfig.tsbuildinfo` โผล่เป็น untracked นั่นคือของที่ tooling ในเครื่องสร้างทิ้งไว้ ลบได้เลย
*   [x] ลบ `certrace-backend/schema.sql` — ทำแล้ว 10 ก.ย.
    > ⚠️ ตอนลบเจอว่ามันไม่ใช่ซากเฉยๆ: ในนั้นมี 13 ตารางที่ **ไม่เคยถูก migrate เลย** — 5 ตัวเป็นของ admin portal ที่ลบไปแล้ว แต่อีก 6 ตัว (`organizations`, `profiles`, `team_members`, `supplier_states`, `exporter_decl_states`, `directory_suppliers`) คือหน้าตาที่เคยออกแบบไว้ให้ store ที่ตอนนี้ยังอยู่ใน localStorage ตาม D2 พอดี
    > ไม่ได้หายไปไหน — `git show HEAD:certrace-backend/schema.sql` ดึงกลับมาอ่านได้ตลอด และตอนจะทำ D2/R4 จริงควรเปิดดูก่อนออกแบบใหม่
*   [x] venv ในเครื่องเป็น Python 3.9 แต่รัน `pytest` ของ backend ได้แล้ว (CI ใช้ 3.13) — ถ้าเจอ syntax ใหม่ของ 3.10+ ค่อยตั้ง venv ใหม่

---

## 📌 4. เส้นทางที่แนะนำ

อัปเดต 23 ก.ย. — R1, R4, R5 ปิดแล้ว ท่อ Cloudflare ปิดแล้ว เหลือ:

| ลำดับ | งาน | ใคร | ประเมินเวลา |
| :---: | :--- | :--- | :--- |
| 1 | **ถอด `NEXT_PUBLIC_DEMO_MODE` ใน Cloudflare → rebuild → ยืนยันว่ารหัสมั่วเข้าไม่ได้** (R2) | โจ้ | ~15 นาที |
| 2 | **เดิน end-to-end บนโดเมนจริงหนึ่งรอบเต็ม** สมัคร → declaration → ส่งลิงก์ → เปิดอีกเครื่อง → **อัปใบเซอร์** → ส่งกลับ — พิสูจน์ `011`/`012` ไปในตัว | โบ๊ท + เฟิน | ~ครึ่งวัน |
| 3 | **ยืนยัน env ที่เหลือบน Render (Resend ✅ แล้ว) + ตัดสินใจ Render vs Cloud Run** แล้วเก็บ `deploy.yml` ให้ตรง (R6) | เฟิน | ~1 ชม. |
| 4 | รีวิว + merge PR hardening #107–#110 ทีละตัว (R8) — เช็คทุกครั้งว่า Render deploy ตัวใหม่แล้ว | โบ๊ท | ~ครึ่งวัน |
| 5 | Import default factor ชุดจริง (R3) — หลัง #107 | เฟิน | รอเฟิน |
| 6 | ตัดสินใจ #106 (Google login), #111 (smart upload), #112 (suspension/audit) ว่าเข้ารอบนี้ไหม | ทีม | คุยกัน |
| 7 | Route guard + เรียก `/me` ตอนโหลด (D4) · ตัดสินใจ D1/D2 | — | หลังปล่อย |

**ข้อ 1 ทำก่อนทุกอย่าง** — ตราบใดที่ flag ยังอยู่ พอร์ทัลบนโดเมนจริงเปิดให้ใครก็ได้เข้าไปเห็นข้างใน และ E2E ของข้อ 2 ก็วัดอะไรไม่ได้
**ข้อ 2 คือสิ่งเดียวที่กั้นระหว่าง "ของขึ้นครบแล้ว" กับ "รู้ว่าของที่ขึ้นใช้ได้จริง"**
**ข้อ 3 คือสิ่งเดียวที่กั้นระหว่าง "backend ใช้ได้วันนี้" กับ "รู้ว่าแก้ครั้งหน้าจะขึ้นไปยังไง"** — ตอนนี้รีโปอธิบายทางที่ไม่ได้ใช้

---

## 🔮 5. ยกไป post-MVP (ตั้งใจ ไม่ได้ลืม)

ตรงกับหัวข้อ 6 ของ [API contract](docs/API-CONTRACT.md) — ทั้งหมดนี้ต้องทำก่อนรับลูกค้าที่จ่ายเงิน แต่ไม่ใช่ตอนนี้

*   RBAC ฝั่งเซิร์ฟเวอร์ (ตอนนี้แค่ "เป็นเจ้าของหรือไม่เป็น")
*   Team members / seats เป็น API แยก
*   Audit trail แบบ hash-chain
*   Rate limiting บน `/links/{token}`
*   Antivirus scan ไฟล์ที่อัปโหลด
*   Google OAuth
*   ย้าย rate limiter ของ auth จาก dict ใน process ไป Redis (วันที่ API รันเกินหนึ่ง instance)

---

## 📎 อ้างอิงไฟล์สำคัญ

| เรื่อง | ไฟล์ |
| :--- | :--- |
| สัญญา API ระหว่างสองเลน | [docs/API-CONTRACT.md](docs/API-CONTRACT.md) |
| Auth ฝั่งเซิร์ฟเวอร์ | [certrace-backend/app/routers/auth.py](certrace-backend/app/routers/auth.py) |
| Smart link ฝั่งเซิร์ฟเวอร์ | [certrace-backend/app/routers/links.py](certrace-backend/app/routers/links.py) |
| API client ฝั่งพอร์ทัล | [certrace-portal/lib/api/](certrace-portal/lib/api) |
| ธง demo mode — ตรรกะ | [certrace-portal/lib/api/config.ts](certrace-portal/lib/api/config.ts) |
| ธง demo mode — **ค่าที่ถูกฝังลง build จริง** | [certrace-portal/next.config.ts](certrace-portal/next.config.ts) + `env:` ของ step deploy ใน [.github/workflows/deploy.yml](.github/workflows/deploy.yml) |
| เครื่องคำนวณ backend | [certrace-backend/app/services/mrv_engine.py](certrace-backend/app/services/mrv_engine.py) |
| เครื่องคำนวณ frontend | [certrace-portal/lib/cbam/engine.ts](certrace-portal/lib/cbam/engine.ts) |
| Fixture กลางที่ใช้เทียบสองเครื่อง | [docs/fixtures/golden-eaf-2026.json](docs/fixtures/golden-eaf-2026.json) |
| สูตร deploy Cloud Run (ยังไม่ใช่ production — ตัวจริงอยู่ Render ดู R6) | [certrace-backend/README.md](certrace-backend/README.md) |
| Workflow deploy | [.github/workflows/deploy.yml](.github/workflows/deploy.yml) |
| Workflow CI (PR เท่านั้น) | [.github/workflows/ci.yml](.github/workflows/ci.yml) |
| ยามเช็ค header production รายคืน | [.github/workflows/security-headers.yml](.github/workflows/security-headers.yml) |
| ตัวสร้าง CSP ตอน build (บ่อเกิดของ `connect-src`) | [certrace-portal/scripts/build-csp-headers.mjs](certrace-portal/scripts/build-csp-headers.mjs) |
| คู่มือเทสต์ | [TESTING.md](TESTING.md) |
