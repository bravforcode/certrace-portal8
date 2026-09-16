# 📊 สถานะโครงการและตารางเช็คลิสต์เตรียมเปิดตัว (Project Status & Launch Checklist)

ไฟล์นี้สรุปว่า **โค้ดในรีโปตอนนี้ทำอะไรได้จริงบ้าง** และเหลืออะไรที่ โบ๊ท กับ เฟิน ต้องลุยต่อก่อนปล่อยให้ Design Partner ใช้งานจริง

> อัปเดตล่าสุด: 16 ก.ย. 2026 — **R1 และ R2 ปิดแล้ว** backend ขึ้นของจริง พอร์ทัลออกจาก demo mode แล้ว
> รอบนี้ยิงเช็ค production จริงทุกข้อ (`api.certrace.co/readyz` ตอบ 200 `databaseConfigured: true`, preflight CORS ผ่าน, CSP `connect-src` มี `https://api.certrace.co`) + อ่าน `gh run list` / `gh api .../actions/secrets` ไม่ได้อ่านจากแผนงาน
> รอบ 10 ก.ย. เขียนไว้ว่า R1 ยังไม่ได้ deploy และ `api.certrace.co` เป็น DNS เปล่า — ตกยุคไปแล้วทั้งคู่
> ⚠️ ของใหม่ที่ต้องรู้: **ท่อ deploy อัตโนมัติยังไม่เคยส่งอะไรขึ้นเลยสักครั้ง** ทุกอย่างที่ขึ้นไปแล้วขึ้นด้วยมือ — ดูหัวข้อ 🚨 ใหม่ด้านล่าง

---

## 📈 ความคืบหน้าภาพรวม

ต้องแยกให้ชัดว่า "MVP" หมายถึงอะไร เพราะคำตอบต่างกันมาก:

| นิยามของ MVP | สถานะ | เหลืออะไร |
| :--- | :---: | :--- |
| **เปิดเดโมให้ลูกค้าดูได้** | 🟢 100% | ไม่เหลือ — `certrace.co` และ `portal.certrace.co` ขึ้นแล้ว ตอบ 200 ทั้งคู่ |
| **Design Partner ใช้งานจริง เก็บข้อมูลซัพพลายเออร์จริงได้** | 🟢 ~95% | ทั้งสามชั้นขึ้นของจริงแล้วและต่อถึงกัน เหลือ **เดินเทสต์ end-to-end บนโดเมนจริง** กับ default factor ชุดจริง (R3) |

```
[██████████████████████████████████████░░] 95%
```

สิ่งที่เปลี่ยนจากรอบก่อน: `api.certrace.co` ไม่ใช่ DNS เปล่าอีกแล้ว มี service อยู่หลังจริง ต่อฐานข้อมูลจริง และพอร์ทัล production ถูก build มาพร้อม `NEXT_PUBLIC_API_BASE_URL` แล้ว — **demo mode ปิดไปเองโดยอัตโนมัติ** เพราะ [`config.ts:67`](certrace-portal/lib/api/config.ts:67) เขียนไว้ว่า `if (apiConfigured()) return false` คือ backend จริงชนะธงเสมอ

สิ่งที่ยัง**ไม่**เปลี่ยน และเป็นความเสี่ยงหลักตอนนี้: ท่อ CI/CD ยังส่งของไม่ได้ ทุกอย่างที่ขึ้นไปขึ้นด้วยมือ แปลว่าไม่มีใครรู้ว่า main กับของบนโดเมนจริงตรงกันหรือเปล่า

---

## 🚨 เรื่องที่ต้องรู้ก่อนอย่างอื่น

**ท่อ deploy อัตโนมัติไม่เคยส่งอะไรขึ้นไปเลยสักครั้ง — ของที่อยู่บนโดเมนจริงตอนนี้ขึ้นด้วยมือทั้งหมด**

`gh api repos/:owner/:repo/actions/secrets` และ `.../actions/variables` **คืนค่าว่างทั้งคู่** ทั้งระดับรีโปและระดับ environment `production` แปลว่าไม่มี `CLOUDFLARE_API_TOKEN`, ไม่มี `CLOUDFLARE_ACCOUNT_ID`, ไม่มี `EXPORTER_PORTAL_URL` และไม่มี `GCP_*` สักตัว

ผลที่ตามมามีสองแบบ และแบบที่สองอันตรายกว่า:

1. **ตายตรงไปตรงมา** — run เก่า (เช่น merge PR #95) ตายที่ step ชื่อ `Fail early if Cloudflare credentials are missing` ตรงตามที่ step นั้นถูกเขียนมาให้ทำ
2. **เขียวทั้งที่ไม่ได้ส่งอะไร** — run ล่าสุดสองอัน (`35100274381`, `35101005229`) ขึ้น ✅ เพราะ job `plan` ตัดสินว่าไม่มีแอปไหนถูกแตะ แล้ว **job deploy ทั้งหมด skip ตัวเอง** run เขียวจึงไม่ได้แปลว่า deploy สำเร็จ ต้องเปิดดูว่า job deploy รันจริงหรือ skip

> ⚠️ **อย่าอ่านแค่สีของ run** เช็คด้วย `gh run view <id> --json jobs` ว่า `Deploy ...` เป็น `success` ไม่ใช่ `skipped`

นอกจากนี้ตั้งแต่ 11 ก.ย. run ที่ merge เข้า main (#96, #99, #100) job `plan` **ตายภายใน 2 วินาทีโดยไม่รัน step ใดเลย** — log หมดอายุแล้วดึงไม่ได้ อาการแบบนี้ปกติคือโควตา Actions หมด ซึ่งตรงกับเหตุผลที่ทำ PR #99 พอดี ต้องไปดู Settings → Billing ยืนยัน

**ข่าวดี:** ปัญหานี้ไม่ได้บล็อก Design Partner เพราะทั้งสามชั้นขึ้นของจริงไปแล้วด้วยมือ — มันบล็อกความมั่นใจว่า main ตรงกับ production ต่างหาก

---

## 🏛️ สรุปความพร้อมของแต่ละส่วน (Component Status)

| ส่วนประกอบ | ความพร้อม | ทำเสร็จแล้ว | งานที่ต้องทำต่อ |
| :--- | :---: | :--- | :--- |
| **Landing Page** | 🟢 100% | Next.js 15 หลายภาษา, ฟอร์มยิงเข้า Google Sheets แยกแท็บ, `certrace.co` ตอบ 200 | deploy ยังต้องทำด้วยมือ (ดู 🚨) |
| **Outreach Scripts** | 🟢 100% | ยืนยันโดเมนบน Resend, ยิงเมลหา Design Partners ชุดแรกแล้ว | สแตนบายมอนิเตอร์ตอบกลับ |
| **Portal — หน้าจอ/UX** | 🟢 100% | ครบทุกหน้า, responsive, 2 ภาษา, เหลือพอร์ทัลเดียวแล้ว (โฟลเดอร์ซ้ำถูกลบ), empty/loading/error state ครบ | — |
| **Portal — การเชื่อมต่อข้อมูล** | 🟡 70% | auth, declarations, smart links, ไฟล์แนบ, reminder subjects ต่อ API จริงแล้วผ่าน [`lib/api/`](certrace-portal/lib/api) + TanStack Query และ**build บนโดเมนจริงชี้มาที่ `api.certrace.co` แล้ว** | team / workspace / profile / monthly-requests ยังเป็น localStorage (ตั้งใจเลื่อน — ดู D2) · ไม่มี route guard และ `/api/auth/me` ไม่มีใครเรียก (ดู D4) |
| **Backend — Auth** | 🟢 100% | `register` `login` `me` `refresh` `logout` `change/forgot/reset-password` + JWT + refresh token + rate limit หน้าต่าง 15 นาที | — |
| **Backend — Smart Links** | 🟢 100% | สร้าง / resolve / save state / submit / ขอแก้ไข / ดูรายการที่ส่งมา — token ออกจากเซิร์ฟเวอร์ มีวันหมดอายุ | — |
| **Backend — เครื่องคำนวณ CBAM** | 🟢 100%* | คำนวณครบ **ทั้ง 4 เส้น** ของ fixture แล้ว (10 ก.ย.) — เชื้อเพลิงผ่านค่าความร้อน, process emission แบบ mass balance, indirect, precursor หลายชั้น พร้อม audit trace ทุกเส้น | \* ตัวเครื่องครบแล้ว แต่ยังต้องรอ **ค่า default factor ตัวจริง** (R3) ถึงจะใช้กับสินค้านอก 2 CN code ได้ |
| **Backend — อีเมลแจ้งเตือน** | 🟢 95% | เทมเพลต 7 แบบ, delivery log กันส่งซ้ำด้วย unique index, job รันเตือนตามตาราง, **ต่อ `DatabaseReminderSource` แล้ว** (migration `012_reminder_subjects`) | อีเมลเตือน trial ยังส่งไม่ได้ เพราะ plan/billing ยังไม่มีฝั่งเซิร์ฟเวอร์ (ดู R4) |
| **Backend — ขึ้นของจริง** | 🟢 100% | `api.certrace.co/readyz` ตอบ 200 `{"status":"ready","databaseConfigured":true}` · preflight CORS อนุญาต `https://portal.certrace.co` จริง · validation ทำงาน (ยิง email ปลอมได้ 422) | ยืนยันว่า alembic เดินถึง `012` แล้วหรือยัง — ต้องยิงด้วย token จริง (ดู R1) |
| **Deploy (ท่ออัตโนมัติ)** | 🔴 25% | [`deploy.yml`](.github/workflows/deploy.yml) เขียนครบแล้วทั้ง Cloudflare และ Cloud Run (build → migration job → deploy → เช็ค `/readyz` + CORS + security header ที่ปลายทาง) | **ไม่มี secret/variable สักตัวในรีโป → ไม่เคยส่งอะไรขึ้นเลย** ของบนโดเมนจริงขึ้นด้วยมือทั้งหมด (ดู 🚨 + R6) |
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
    *   [x] [`deploy.yml`](.github/workflows/deploy.yml) — **เขียนเสร็จแล้ว** merge เข้า main แล้วส่งเฉพาะแอปที่ถูกแก้ขึ้น Cloudflare/Cloud Run แล้วยิงเช็ค header ที่ production จริง รวมถึงจับ CSP ที่ยังอนุญาต unsafe-inline — แต่ **ยังไม่เคยได้รันจริง** เพราะไม่มี credential (ดู 🚨)
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
*   [x] ~~ตั้ง body size limit 8 MB~~ — ไม่ต้องทำอะไร Cloud Run รับ body ได้ถึง 32 MiB อยู่แล้ว ตัวที่ต้องระวังคือ proxy ที่มาคั่นข้างหน้าเท่านั้น
*   [ ] **ยังต้องยืนยัน: alembic เดินถึง `012` แล้วหรือยัง** — ยิง `/api/v1/links/<token>ปลอม` ได้ 404 (ไม่ใช่ 500) พิสูจน์ได้แค่ว่า `009_smart_links` ลงแล้ว ส่วน `011_uploaded_files` กับ `012_reminder_subjects` ต้องล็อกอินจริงแล้วยิง endpoint อัปโหลด/reminder ถึงจะรู้ **ถ้ายังไม่ได้รัน อาการจะโผล่ตอน Design Partner อัปใบเซอร์ใบแรก ไม่ใช่ตอนนี้**
*   [ ] ตั้ง repository variable ฝั่ง GCP 4 ตัว (`GCP_PROJECT_ID`, `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_DEPLOY_SERVICE_ACCOUNT`, `GCP_RUNTIME_SERVICE_ACCOUNT`) ตาม [README §Deploy from CI](certrace-backend/README.md:454) — ย้ายไปเป็นงานของ **R6** แล้ว เพราะไม่บล็อกการใช้งาน บล็อกแค่การ deploy รอบต่อไป

> ⚠️ **สองตัวแปรที่ลืมแล้วเจ็บ** (เพิ่งเพิ่มเข้าตาราง env ของ README รอบนี้)
> `CERTRACE_JWT_SECRET` — ไม่มีแล้ว **แอปไม่ start เลย** ถ้ามี `DATABASE_URL` ([`main.py:68`](certrace-backend/app/main.py:68)) อาการคือ revision ไม่ผ่าน startup probe
> `CERTRACE_APP_BASE_URL` — อันนี้ร้ายกว่า เพราะ**ไม่มีอาการอะไรเลย** ไม่ตั้งแล้ว service ยังขึ้นปกติ ผ่าน probe ปกติ แต่ smart link ทุกอันที่ mint ออกไปจะชี้ไป `https://app.certrace.co` ตาม default ([`config.py:51`](certrace-backend/app/config.py:51)) ซึ่งเป็นโดเมนที่ไม่มีอยู่จริง กว่าจะรู้ตัวคือตอนซัพพลายเออร์กดลิงก์ในอีเมลที่เราส่งไปแล้ว — ต้องตั้งเป็น `https://portal.certrace.co`

#### **R2. พอร์ทัล production ออกจาก demo mode แล้ว — ✅ ปิด 16 ก.ย.**
หลักฐานที่ยิงเช็คได้จากข้างนอก: response header ของ `https://portal.certrace.co/login` มี

```
connect-src 'self' https://api.anthropic.com https://api.certrace.co
```

ค่านั้นถูกสร้างโดย [`build-csp-headers.mjs:154`](certrace-portal/scripts/build-csp-headers.mjs:154) ซึ่งอ่าน `NEXT_PUBLIC_API_BASE_URL` **ตอน build เท่านั้น** ถ้าตัวแปรไม่ถูกตั้ง โฮสต์นั้นจะไม่มีทางโผล่ใน CSP เลย — แปลว่า build ที่อยู่บนโดเมนจริงมีค่านี้แน่นอน
เมื่อ `apiConfigured()` เป็น true แล้ว `demoModeEnabled()` คืน `false` ทันทีที่บรรทัดแรก ([`config.ts:67`](certrace-portal/lib/api/config.ts:67) — *"A real backend always wins"*) **ไม่ต้องไปแก้ default ใน `next.config.ts` ก็ปิดแล้ว**

> ⚠️ **`NEXT_PUBLIC_*` ตั้งใน `wrangler.jsonc` ไม่มีผล** — Next ฝังค่าเหล่านี้เป็นค่าคงที่ตอน build ส่วน `vars` ของ wrangler เป็น runtime binding ของ Worker ที่มาถึงหลังการแทนค่าไปแล้ว ข้อนี้ยังจริงอยู่ ถ้าวันหนึ่งย้ายไปตั้งที่นั่นจะเงียบสนิทไม่มีอะไรฟ้อง

*   [x] `NEXT_PUBLIC_API_BASE_URL=https://api.certrace.co` เข้าไปอยู่ใน build แล้ว
*   [x] demo mode ปิดแล้วบนโดเมนจริง — ปิดโดยผลของ `apiConfigured()` ไม่ใช่โดยการแก้ธง
*   [ ] **เก็บกวาด:** default `"1"` ใน [`next.config.ts:54`](certrace-portal/next.config.ts:54) ยังอยู่ ตอนนี้ไม่มีพิษเพราะ backend ชนะเสมอ **แต่มันเป็นกับดัก** — วันไหน build หลุดไปโดยไม่มี `NEXT_PUBLIC_API_BASE_URL` (เช่นตอนที่ท่อ CI เริ่มทำงานแล้วลืมใส่ env) พอร์ทัลจะกลับไปรับรหัสอะไรก็ได้เงียบๆ เปลี่ยนเป็นค่าว่างซะ
*   [ ] **เก็บกวาด:** ลบ `NEXT_PUBLIC_DEMO_MODE` ออกจาก [`wrangler.jsonc:46`](certrace-portal/wrangler.jsonc:46) — ไม่เคยมีผล แต่ทำให้คนอ่านเข้าใจผิด
*   [ ] **โบ๊ท & เฟิน:** รัน `npm run test:e2e:prod` ยิงโฟลว์จริงบนโดเมนจริง แล้วเดินด้วยมืออีกรอบ: สมัคร → สร้าง declaration → ส่งลิงก์ → เปิดจากอีกเครื่อง → กรอก → **อัปใบเซอร์** (ตัวนี้จะพิสูจน์ `011` ไปในตัว) → ส่งกลับ ← **นี่คืองานที่เหลือจริงของ R2**

#### **R3. ค่า EU default factor ยังเป็นไฟล์ตัวอย่าง**
[`default_factors.template.csv`](certrace-backend/default_factors.template.csv) มีแค่ **2 แถว** (เหล็ก 1 CN code, อะลูมิเนียม 1 CN code) สินค้าที่อยู่นอกสอง CN นี้จะได้ตัวเลขผิดทันที
*   [ ] **เฟิน:** ทำตาราง EU default values ให้ครบ CN code ที่เรารองรับ แล้ว import ด้วย `import_default_factors.py`
*   [ ] **เฟิน & โบ๊ท:** เอาตัวเลขจริงมากรอกเทียบกับที่เคยคำนวณใน Excel

#### **R4. อีเมลเตือนซัพพลายเออร์ — ✅ ต่อ source จริงแล้ว 10 ก.ย.**
[`app/jobs/send_reminders.py`](certrace-backend/app/jobs/send_reminders.py) เคยต่อกับ `NullSource` กลไกถูกหมดแล้ว (กันส่งซ้ำ, ปล่อย claim เมื่อส่งไม่สำเร็จ) ขาดแค่แหล่งข้อมูล — ตอนนี้มีแล้ว

> ⚠️ **สิ่งที่เจอตอนลงมือ:** ข้อนี้เขียนไว้ว่า "ย้าย `monthly-requests` ไปหลัง API" แต่ของจริงกระจายอยู่ **3 store** ไม่ใช่อันเดียว — `workspace` (เดือน+กำหนดส่ง), `supplier-companies` (**อีเมลที่จะส่งไปหา**) และ `month-dispatch` (ส่งไปหรือยัง) ส่วน `monthly-requests` เป็นของเก่าที่ workspace มาแทนแล้ว
> ถ้าย้ายทั้งกองก็คือทำ D2 ทั้งข้อ ซึ่งยังเป็นเรื่องที่ต้องตัดสินใจอยู่ เลยเลือกให้พอร์ทัล**ลงทะเบียนเฉพาะสิ่งที่ job ต้องใช้**ตอนกดส่งแทน

*   [x] ตาราง `reminder_subjects` + 5 endpoint ([API contract §8](docs/API-CONTRACT.md)) — พอร์ทัลบอกเซิร์ฟเวอร์ว่า "ขอเดือนนี้จากรายนี้ ส่งไปที่อีเมลนี้ ครบกำหนดวันนี้"
*   [x] `DatabaseReminderSource` แทน `NullSource` เมื่อมี `DATABASE_URL` — บันได/การ claim/ข้อความไม่ต้องแก้อะไรเลย ตรงตามที่ docstring เดิมเขียนไว้ว่าจะเหลือแค่ adapter เดียว
*   [x] พอร์ทัลต่อแล้ว — กดส่งเดือน = ลงทะเบียน + ทำเครื่องหมายว่าส่ง, ซัพพลายเออร์ตอบ = ปิดการตาม
*   [x] **ขึ้น main แล้ว** (16 ก.ย.) — PR #98 merge เข้า feature branch ไม่ใช่ main จึงดูเหมือนไม่เคยขึ้น ตัวที่พามาจริงคือ **PR #100** (`claude/r4-r5-to-main`)
*   [x] ~~ต้องรอ R1~~ — R1 ปิดแล้ว มีฐานข้อมูลจริงแล้ว endpoint ไม่ตอบ 503 อีก
*   [ ] **อีเมลเตือน trial ยังส่งไม่ได้** — plan/billing ยังไม่มีฝั่งเซิร์ฟเวอร์เลย ถ้าเดาวันหมดอายุเองจะกลายเป็นส่งเรื่องที่ระบบไม่ได้บังคับใช้จริง
*   [ ] **ยังไม่ได้ยืนยันว่า job รันจริงบน production** — โค้ดพร้อม ตารางพร้อม แต่ไม่มีใครดูว่ามีอะไรถูกส่งออกไปแล้วหรือยัง ต้องเช็ค `notification_deliveries` หลังคืนแรกที่มี subject ค้างกำหนด

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

#### **R6. ท่อ deploy ยังส่งของไม่ได้ — 🔴 ใหม่ 16 ก.ย. บล็อกรอบถัดไป ไม่บล็อกรอบนี้**
ดูหัวข้อ 🚨 ตอนนี้ทุกอย่างที่อยู่บนโดเมนจริงขึ้นด้วยมือ ซึ่งแปลว่า **ไม่มีใครรู้ว่าของบน production ตรงกับ main หรือเปล่า** ทุกการแก้นับจากนี้ต้องมีคนจำให้ได้ว่าต้อง deploy เอง ถ้าลืม อาการคือแก้บั๊กแล้วบั๊กยังอยู่

*   [ ] **โบ๊ท:** ใส่ `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` (Settings → Secrets and variables → Actions) — ปลดล็อก landing + portal
*   [ ] **โบ๊ท:** ใส่ `NEXT_PUBLIC_API_BASE_URL=https://api.certrace.co` เป็น repository **variable** แล้วอ้างใน `env:` ของ job portal — **ห้ามลืม** ถ้า CI เริ่ม build เองแล้วไม่มีค่านี้ พอร์ทัลจะถอยกลับไป demo mode เงียบๆ (ดู R2)
*   [ ] **โบ๊ท:** ใส่ `EXPORTER_PORTAL_URL` เป็น repository variable — ขาดตัวนี้ step เช็ค security header จะ `exit 0` แล้ว deploy ผ่านทั้งที่ header อาจไม่ติด
*   [ ] **โบ๊ท:** ใส่ `GCP_*` 4 ตัวตาม [README §Deploy from CI](certrace-backend/README.md:454) — ปลดล็อก backend + ทำให้ alembic รันเองทุก deploy (แก้ปัญหา migration ค้างตั้งแต่ต้นทาง)
*   [ ] **โบ๊ท:** เช็ค Settings → Billing ว่าโควตา Actions เหลือเท่าไหร่ — run `plan` ที่ตายใน 2 วินาทีตั้งแต่ 11 ก.ย. เข้าได้กับอาการโควตาหมด
*   [ ] **ทั้งคู่:** merge ทดสอบหนึ่งครั้งแล้วเปิดดูว่า job `Deploy ...` เป็น `success` จริง ไม่ใช่ `skipped`

#### **R7. เช็ค security header ที่ production — ✅ แก้บั๊ก HSTS แล้ว**
[`security-headers.yml`](.github/workflows/security-headers.yml) ยิงถามโดเมนจริงทุกคืน (cron `17 2 * * *`) เพราะ config ถูกไม่เท่ากับ production ถูก — `next.config.ts` ประกาศ header ครบมาหลายเดือนขณะที่หน้า prerender ออกไปโดยไม่มี header สักตัว เพราะ Cloudflare เสิร์ฟจาก asset layer ไม่เรียก Worker ไม่มีอะไรในรีโปจับได้

*   [x] **บั๊ก HSTS แก้แล้ว** — เดิมอ่าน `max-age` ตัวแรกที่เจอในทั้ง response ซึ่งไปเจอ `cache-control: ... max-age=0` ของพอร์ทัลก่อน ทำให้ **fail ทุกรอบ** ตอนนี้ล็อกให้อ่านจากบรรทัด `strict-transport-security:` เท่านั้น
*   [x] เกณฑ์ไม่ใช่แค่ "มี header" — HSTS ต้อง `max-age ≥ 15768000` (6 เดือน) และ `script-src` ที่ยังมี `unsafe-inline` ถือว่า fail (CSP ที่ผ่านทุกข้อแต่ยังปล่อย inline script รันได้ = ซื้อมาเปล่าๆ)
*   [x] ยิงทั้ง `/` ของสองโฮสต์ + `/login` โดยเจตนา — `/` คือหน้า prerender ซึ่งเป็นเคสที่เคยไม่มี header จริงๆ ถ้ายิงแต่ route ที่ render ตอน runtime จะผ่านหมดโดยไม่เจออะไร
*   [x] ไม่มี push trigger โดยตั้งใจ — push เข้า main จะเริ่ม deploy พอดี probe ที่ยิงตอนนั้นจะไปอ่าน build ที่กำลังจะถูกแทน

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
ตอนที่ยังเป็น demo mode ข้อนี้ไม่มีความหมาย ตอนนี้มีบัญชีจริงหลัง `api.certrace.co` แล้วมันเริ่มมีความหมาย
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
*   [ ] venv ในเครื่องเป็น Python 3.9 ทำให้ `pytest` ในเครื่องรันไม่ได้ (รีโปตั้งเป้า 3.13 และ CI ใช้ 3.13) — ตั้ง venv ใหม่ถ้าจะดีบั๊ก backend ในเครื่อง

---

## 📌 4. เส้นทางที่แนะนำ

R1, R2, R4, R5 ปิดไปหมดแล้ว รายการเดิมจึงตกยุคทั้งตาราง นี่คือลำดับใหม่:

| ลำดับ | งาน | ประเมินเวลา |
| :---: | :--- | :--- |
| 1 | **เดิน end-to-end บนโดเมนจริงหนึ่งรอบเต็ม** สมัคร → declaration → ส่งลิงก์ → เปิดอีกเครื่อง → **อัปใบเซอร์** → ส่งกลับ (R2) — จะพิสูจน์ `011`/`012` ว่าถูก migrate จริงไปในตัว | ~ครึ่งวัน |
| 2 | ใส่ secret/variable ให้ท่อ deploy ทำงาน (R6) — หลังจากนี้ไม่ต้องจำว่าต้อง deploy เอง | ~1–2 ชม. |
| 3 | เก็บกวาด default `"1"` ของ demo mode ไม่ให้เป็นกับดักของข้อ 2 (R2) | ~15 นาที |
| 4 | Import default factor ชุดจริง (R3) | รอเฟิน |
| 5 | Route guard + เรียก `/me` ตอนโหลด (D4) | ~ครึ่งวัน |
| 6 | ตัดสินใจ D1 (ใครเป็นเจ้าของตัวเลขที่ยื่นจริง) และ D2 (store ที่ยังอยู่ localStorage) | คุยกัน |

**ข้อ 1 คือสิ่งเดียวที่กั้นระหว่าง "ของขึ้นครบแล้ว" กับ "รู้ว่าของที่ขึ้นใช้ได้จริง"** — ตอนนี้ทั้งสามชั้นขึ้นแล้วแต่ยังไม่มีใครเดินทะลุจากต้นจนจบสักครั้ง
**ข้อ 2 คือสิ่งเดียวที่กั้นระหว่าง "ใช้ได้วันนี้" กับ "ยังใช้ได้อยู่หลังแก้ครั้งหน้า"**

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
| ธง demo mode | [certrace-portal/lib/api/config.ts](certrace-portal/lib/api/config.ts) |
| เครื่องคำนวณ backend | [certrace-backend/app/services/mrv_engine.py](certrace-backend/app/services/mrv_engine.py) |
| เครื่องคำนวณ frontend | [certrace-portal/lib/cbam/engine.ts](certrace-portal/lib/cbam/engine.ts) |
| Fixture กลางที่ใช้เทียบสองเครื่อง | [docs/fixtures/golden-eaf-2026.json](docs/fixtures/golden-eaf-2026.json) |
| สูตร deploy Cloud Run | [certrace-backend/README.md](certrace-backend/README.md) |
| Workflow deploy | [.github/workflows/deploy.yml](.github/workflows/deploy.yml) |
| Workflow CI (PR เท่านั้น) | [.github/workflows/ci.yml](.github/workflows/ci.yml) |
| ยามเช็ค header production รายคืน | [.github/workflows/security-headers.yml](.github/workflows/security-headers.yml) |
| ตัวสร้าง CSP ตอน build (บ่อเกิดของ `connect-src`) | [certrace-portal/scripts/build-csp-headers.mjs](certrace-portal/scripts/build-csp-headers.mjs) |
| คู่มือเทสต์ | [TESTING.md](TESTING.md) |
