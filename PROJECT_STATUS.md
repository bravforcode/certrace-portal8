# 📊 สถานะโครงการและตารางเช็คลิสต์เตรียมเปิดตัว (Project Status & Launch Checklist)

ไฟล์นี้สรุปว่า **โค้ดในรีโปตอนนี้ทำอะไรได้จริงบ้าง** และเหลืออะไรที่ โบ๊ท กับ เฟิน ต้องลุยต่อก่อนปล่อยให้ Design Partner ใช้งานจริง

> อัปเดตล่าสุด: 7 ก.ย. 2026 — ไล่อ่านจากโค้ดจริงทั้งรีโป + ยิงเช็คโดเมน production จริง ไม่ได้อ่านจากแผนงาน
> รอบก่อน (30 ส.ค.) ประเมินไว้ 65% ซึ่งตกยุคไปมาก — 70 คอมมิตหลังจากนั้นปิด Blocker เดิมไปเกือบทั้งหมด

---

## 📈 ความคืบหน้าภาพรวม

ต้องแยกให้ชัดว่า "MVP" หมายถึงอะไร เพราะคำตอบต่างกันมาก:

| นิยามของ MVP | สถานะ | เหลืออะไร |
| :--- | :---: | :--- |
| **เปิดเดโมให้ลูกค้าดูได้** | 🟢 100% | ไม่เหลือ — `certrace.co` และ `portal.certrace.co` ขึ้นแล้ว ตอบ 200 ทั้งคู่ |
| **Design Partner ใช้งานจริง เก็บข้อมูลซัพพลายเออร์จริงได้** | 🟡 ~80% | Backend เขียนเสร็จแล้วแต่ **ยังไม่ได้ deploy** และพอร์ทัลตัวจริงยังวิ่งใน demo mode |

```
[████████████████████████████████░░░░░░░░] 80%
```

ความต่างระหว่างสองบรรทัดนี้ไม่ใช่โค้ดที่ยังไม่ได้เขียน แต่เป็น **โค้ดที่เขียนเสร็จแล้วแต่ยังไม่ได้เอาขึ้นของจริง**

---

## 🚨 เรื่องที่ต้องรู้ก่อนอย่างอื่น

**`portal.certrace.co` ที่เปิดอยู่ตอนนี้ ล็อกอินด้วยรหัสอะไรก็ผ่าน**

[`wrangler.jsonc:46`](certrace-portal/wrangler.jsonc:46) ตั้ง `NEXT_PUBLIC_DEMO_MODE: "1"` และ [`next.config.ts:54`](certrace-portal/next.config.ts:54) ก็ default เป็น `"1"` เหมือนกัน
ส่วน `NEXT_PUBLIC_API_BASE_URL` ยังไม่ได้ตั้ง แปลว่าพอร์ทัลบนโดเมนจริงยังเป็น **เดโมที่ข้อมูลอยู่ใน localStorage ของเบราว์เซอร์คนเปิด** ทั้งหมด

อันนี้ตั้งใจ — เพราะยังไม่มี backend ให้ต่อ (ดู R1) และโค้ดกันไว้แล้วว่าถ้า **ไม่มี** backend และ **ไม่มี** ธงนี้ จะไม่ยอมให้ใครล็อกอินเลย ([`lib/api/config.ts:69`](certrace-portal/lib/api/config.ts:69) มีเทสต์คุมที่ [`demo-mode.test.ts`](certrace-portal/lib/__tests__/demo-mode.test.ts))
แต่ต้องจำไว้ว่า **ห้ามเอาลิงก์นี้ให้ Design Partner กรอกข้อมูลจริง** จนกว่าจะทำ R1 + R2 เสร็จ

---

## 🏛️ สรุปความพร้อมของแต่ละส่วน (Component Status)

| ส่วนประกอบ | ความพร้อม | ทำเสร็จแล้ว | งานที่ต้องทำต่อ |
| :--- | :---: | :--- | :--- |
| **Landing Page** | 🟢 100% | Next.js 15 หลายภาษา, ฟอร์มยิงเข้า Google Sheets แยกแท็บ, deploy อัตโนมัติแล้ว | — |
| **Outreach Scripts** | 🟢 100% | ยืนยันโดเมนบน Resend, ยิงเมลหา Design Partners ชุดแรกแล้ว | สแตนบายมอนิเตอร์ตอบกลับ |
| **Portal — หน้าจอ/UX** | 🟢 100% | ครบทุกหน้า, responsive, 2 ภาษา, เหลือพอร์ทัลเดียวแล้ว (โฟลเดอร์ซ้ำถูกลบ), empty/loading/error state ครบ | — |
| **Portal — การเชื่อมต่อข้อมูล** | 🟡 60% | auth, declarations, smart links ต่อ API จริงแล้วผ่าน [`lib/api/`](certrace-portal/lib/api) + TanStack Query | team / workspace / profile / monthly-requests ยังเป็น localStorage (ตั้งใจเลื่อน — ดู D2) |
| **Backend — Auth** | 🟢 100% | `register` `login` `me` `refresh` `logout` `change/forgot/reset-password` + JWT + refresh token + rate limit หน้าต่าง 15 นาที | — |
| **Backend — Smart Links** | 🟢 100% | สร้าง / resolve / save state / submit / ขอแก้ไข / ดูรายการที่ส่งมา — token ออกจากเซิร์ฟเวอร์ มีวันหมดอายุ | — |
| **Backend — เครื่องคำนวณ CBAM** | 🟡 85% | คำนวณ source stream / electricity / PFC / precursor พร้อม audit trace + **golden fixture เทียบกับเครื่องฝั่งพอร์ทัลแล้ว** | ครอบคลุม 2 ใน 4 เส้นของ fixture (ขาดเส้น direct/ค่าความร้อนเชื้อเพลิง) + ค่า default factor ตัวจริง |
| **Backend — อีเมลแจ้งเตือน** | 🟡 85% | เทมเพลต 7 แบบ, delivery log กันส่งซ้ำด้วย unique index, job รันเตือนตามตาราง | job ยังต่อกับ `NullSource` = ยังไม่ส่งอะไรเลย เพราะข้อมูลคำขอยังอยู่ใน localStorage (ดู R4) |
| **Deploy** | 🟡 60% | [`deploy.yml`](.github/workflows/deploy.yml) ยิง landing + portal ขึ้น Cloudflare อัตโนมัติทุก merge เข้า main พร้อมเช็ค security header ที่ปลายทาง | **ไม่มี job สำหรับ backend** และ `api.certrace.co` ยังเป็น DNS เปล่า |
| **CI / คุณภาพโค้ด** | 🟢 100% | lint, typecheck, unit test, npm audit, pip-audit, CodeQL, secret scan, Playwright E2E | — |
| **Admin Portal** | 🔴 Deprecated | ตัดออกจากขอบเขต MVP ไม่ได้อยู่ใน CI และไม่ได้ deploy | ลบโฟลเดอร์ `certrace-admin-portal` ทิ้งได้เลย |

---

## ✅ 1. งานที่ทำเสร็จแล้วจริง (ยืนยันจากโค้ด)

*   **หลังบ้าน (FastAPI) — ส่วนที่รอบก่อนยังไม่มีเลย**
    *   [x] **Auth ครบวงจร** — [`app/routers/auth.py`](certrace-backend/app/routers/auth.py): สมัคร / ล็อกอิน / ต่ออายุ token / ออกจากระบบ / เปลี่ยน-ลืม-รีเซ็ตรหัสผ่าน ออก JWT จริง ([`app/core/tokens.py`](certrace-backend/app/core/tokens.py))
    *   [x] **Smart link ฝั่งเซิร์ฟเวอร์** — [`app/routers/links.py`](certrace-backend/app/routers/links.py) + migration `009_smart_links` ซัพพลายเออร์กรอกจากเครื่องตัวเอง แล้วผู้ส่งออกเห็นจริง
    *   [x] **Declarations ตามความหมายของพอร์ทัล** — CRUD ครบที่ [`app/routers/declarations.py`](certrace-backend/app/routers/declarations.py) (migration `006_portal_declarations`)
    *   [x] **อุดช่องโหว่ auth ทั้งสองจุดของรอบก่อน** — `/forgot-password` ส่งโค้ดทางอีเมลแล้ว ไม่คืน token ใน response อีก และ in-memory store ถูกล็อกไว้เฉพาะโหมดไม่มี `DATABASE_URL` เท่านั้น ถ้าต่อ DB แล้วล้มจะ raise ไม่ตกไปใช้ memory เงียบๆ ([`auth_service.py`](certrace-backend/app/services/auth_service.py) — อ่าน docstring บนหัวไฟล์)
    *   [x] **Schema เหลือชุดเดียว** — alembic เดินถึง `010_notification_deliveries` แล้ว `schema.sql` เหลือเป็นซากที่ไม่มีใครเรียก
    *   [x] **อีเมลแจ้งเตือน** — เทมเพลต, transport, delivery log กันส่งซ้ำ, ตารางเตือนซัพพลายเออร์ ([`services/reminders.py`](certrace-backend/app/services/reminders.py), [`services/reminder_schedule.py`](certrace-backend/app/services/reminder_schedule.py))
    *   [x] **เทสต์ 14 ไฟล์** ครอบคลุม auth hardening, refresh, smart links, onboarding, notifications, reminders, parity
*   **หน้าบ้านพอร์ทัล (Next.js 15 + React 19)**
    *   [x] ครบทุกหน้าตามสถาปัตยกรรม CBAM definitive period + สลับภาษา TH/EN + empty/loading/error state
    *   [x] **ต่อ API จริงแล้ว** — [`lib/api/`](certrace-portal/lib/api) (auth, declarations, links, session, http) และ store ที่สำคัญเรียกผ่านมันแล้ว: [`declarations-store.ts`](certrace-portal/lib/declarations-store.ts), [`links-query.ts`](certrace-portal/lib/links-query.ts), [`auth-flow.ts`](certrace-portal/lib/auth-flow.ts)
    *   [x] Smart link ฝั่งซัพพลายเออร์ไม่มีสำเนา localStorage แล้ว — เซิร์ฟเวอร์เป็นคนเขียนคนเดียว, autosave ที่ล้มถูก retry, ที่ทำตอนออฟไลน์ถูกพักไว้แล้วส่งต่อเมื่อเน็ตกลับมา
    *   [x] ออกรายงาน PDF และ CBAM XML ฝั่ง client
    *   [x] **Unit test 497 ตัว ผ่านหมด** (`npm run test:unit` — รันจริงวันที่ 7 ก.ย.) + Playwright E2E 6 ไฟล์ (auth, dashboard, onboarding, smart links, reports, landing→portal)
*   **Deploy & CI**
    *   [x] [`deploy.yml`](.github/workflows/deploy.yml) — merge เข้า main แล้วส่งเฉพาะแอปที่ถูกแก้ขึ้น Cloudflare แล้ว **ยิงเช็ค header ที่ production จริง** รวมถึงจับ CSP ที่ยังอนุญาต unsafe-inline
    *   [x] `certrace.co` และ `portal.certrace.co` ขึ้นแล้ว ตอบ 200
*   **Landing & Outreach**
    *   [x] ฟอร์มทุกตัวบน landing ยิงเข้า Google Sheets แยกตามแท็บ ผ่าน [`apps-script/lead-capture.gs`](apps-script/lead-capture.gs)
    *   [x] ยืนยันโดเมนอีเมลแบรนด์บน Resend และยิงเมลหา Design Partners ชุดแรกแล้ว

---

## 🔴 2. เหลืออะไร — เรียงตามที่บล็อกกันอยู่

#### **R1. Backend ยังไม่ได้ deploy — ตัวนี้บล็อกทุกอย่างที่เหลือ**
ยิง `https://api.certrace.co/health` ตอนนี้ได้ **403 จาก Cloudflare** ซึ่งคือหน้า DNS record เปล่า ไม่มี service อยู่หลัง
โค้ดพร้อมหมดแล้ว: Dockerfile, Procfile, alembic, และสูตร Cloud Run เขียนไว้ครบที่ [`certrace-backend/README.md:258`](certrace-backend/README.md:258) เหลือแค่ลงมือ
*   [ ] **เฟิน:** เตรียม Postgres (Supabase / Neon / Cloud SQL) แล้วรัน migration ผ่าน Cloud Run Job ตามสูตรใน README
*   [ ] **เฟิน:** deploy service แล้วตั้ง env: `CERTRACE_REQUIRE_DATABASE=true`, `CERTRACE_CORS_ALLOWED_ORIGINS=https://portal.certrace.co`, `CERTRACE_ENABLE_API_DOCS=false`, `RESEND_API_KEY`
*   [ ] **เฟิน:** ตั้ง body size limit อย่างน้อย 8 MB ตามที่ [API contract](docs/API-CONTRACT.md) ระบุ ไม่งั้นเซฟพังตอนมีไฟล์แนบหลายอัน
*   [ ] เพิ่ม job deploy backend ใน [`deploy.yml`](.github/workflows/deploy.yml) (ตอนนี้มีแค่ landing กับ portal)

#### **R2. พอร์ทัล production ยังวิ่งใน demo mode**
ดูหัวข้อ 🚨 ด้านบน ทำทันทีที่ R1 เสร็จ
*   [ ] **โบ๊ท:** ตั้ง `NEXT_PUBLIC_API_BASE_URL=https://api.certrace.co` ใน [`wrangler.jsonc`](certrace-portal/wrangler.jsonc)
*   [ ] **โบ๊ท:** เอา `NEXT_PUBLIC_DEMO_MODE` ออกจาก `wrangler.jsonc` และเปลี่ยน default ใน [`next.config.ts:54`](certrace-portal/next.config.ts:54) จาก `"1"` เป็นค่าว่าง
*   [ ] **โบ๊ท & เฟิน:** รัน `npm run test:e2e:prod` ยิงโฟลว์จริงบนโดเมนจริง แล้วเดินด้วยมืออีกรอบ: สร้าง declaration → ส่งลิงก์ → เปิดจากอีกเครื่อง → กรอก → ส่งกลับ

#### **R3. ค่า EU default factor ยังเป็นไฟล์ตัวอย่าง**
[`default_factors.template.csv`](certrace-backend/default_factors.template.csv) มีแค่ **2 แถว** (เหล็ก 1 CN code, อะลูมิเนียม 1 CN code) สินค้าที่อยู่นอกสอง CN นี้จะได้ตัวเลขผิดทันที
*   [ ] **เฟิน:** ทำตาราง EU default values ให้ครบ CN code ที่เรารองรับ แล้ว import ด้วย `import_default_factors.py`
*   [ ] **เฟิน & โบ๊ท:** เอาตัวเลขจริงมากรอกเทียบกับที่เคยคำนวณใน Excel

#### **R4. อีเมลเตือนซัพพลายเออร์ยังไม่ส่งอะไรเลย**
[`app/jobs/send_reminders.py`](certrace-backend/app/jobs/send_reminders.py) ต่อกับ `NullSource` เพราะคำขอข้อมูลรายเดือนยังอยู่ใน [`lib/monthly-requests.ts`](certrace-portal/lib/monthly-requests.ts) บนเบราว์เซอร์ — เซิร์ฟเวอร์ไม่มีอะไรให้ query
ตัวกลไกถูกทั้งหมดแล้ว (กันส่งซ้ำ, ปล่อย claim เมื่อส่งไม่สำเร็จ) ขาดแค่แหล่งข้อมูล
*   [ ] ย้าย `monthly-requests` ไปหลัง API แล้วสลับ `NullSource` เป็น source จริง

#### **R5. อัปโหลดไฟล์ยังไม่มีที่เก็บจริง**
ไฟล์ยังเก็บเป็น base64 ใน localStorage ได้ราว 1.5 MB ที่ใหญ่กว่านั้นเก็บแค่ชื่อ+ขนาด — ใบเซอร์จริงส่วนใหญ่ใหญ่กว่านี้และจะหาย
*   [ ] ทำ upload pipeline (bucket + signed URL + จำกัดชนิด/ขนาดไฟล์) **หรือ** ตัดสินใจรับข้อจำกัดนี้กับ Design Partner รายแรกไปก่อน แล้วบอกเขาตรงๆ

---

## 🟡 3. ต้องตัดสินใจ

#### **D1. เครื่องคำนวณสองตัว — คืบไปเยอะแล้ว แต่ยังไม่จบ**
ตอนนี้มี golden fixture กลางที่ทั้งสองฝั่งอ่านไฟล์เดียวกัน ([`docs/fixtures/golden-eaf-2026.json`](docs/fixtures/golden-eaf-2026.json)) และมีเทสต์ parity ทั้งสองข้าง
สถานะจริง: เครื่องฝั่ง backend แสดงได้ **2 ใน 4 เส้นการปล่อย** ของ fixture (เส้น indirect กับ precursor ตรงกันแบบ exact) เส้นที่ขาดคือ direct ซึ่งต้องสอนเรื่องค่าความร้อนเชื้อเพลิงก่อน
*   [ ] ตัดสินใจว่าจะปิดช่องว่างให้ backend เป็น source of truth ก่อนรับลูกค้าที่จ่ายเงิน หรือปล่อยให้พอร์ทัลคำนวณต่อไปในรอบ MVP (แนะนำ: ปล่อยไว้ก่อน เพราะ parity test จับ regression ให้อยู่แล้ว)

#### **D2. Store ที่ยังไม่ได้ย้ายขึ้นเซิร์ฟเวอร์**
`team-store`, `workspace-*`, `profile`, `monthly-requests`, `precursor-suppliers`, evidence ยังเป็น localStorage ทั้งหมด
ตาม [API contract](docs/API-CONTRACT.md) ข้อ 6 อันนี้ **ตั้งใจเลื่อน** เพราะ state ของซัพพลายเออร์เดินทางเป็น JSON ก้อนเดียวอยู่แล้ว
*   [ ] ยืนยันว่ายังยอมรับได้ — ผลคือข้อมูลทีม/โปรไฟล์/คำขอรายเดือนผูกกับเบราว์เซอร์เครื่องเดียว ย้ายเครื่องแล้วหาย (และทำให้ R4 ทำงานไม่ได้)

#### **D3. เศษที่ค้างในรีโป**
*   [ ] ลบ `certrace-admin-portal` (deprecated ไม่อยู่ใน CI ไม่ได้ deploy)
*   [ ] ลบ [`certrace-backend/schema.sql`](certrace-backend/schema.sql) (ไม่มีใครเรียกแล้ว alembic เป็น source of truth)
*   [ ] venv ในเครื่องเป็น Python 3.9 ทำให้ `pytest` ในเครื่องรันไม่ได้ (รีโปตั้งเป้า 3.13 และ CI ใช้ 3.13) — ตั้ง venv ใหม่ถ้าจะดีบั๊ก backend ในเครื่อง

---

## 📌 4. เส้นทางที่แนะนำ

| ลำดับ | งาน | ประเมินเวลา |
| :---: | :--- | :--- |
| 1 | Deploy backend + ต่อ DB + รัน migration (R1) | ~1 วัน |
| 2 | ชี้พอร์ทัลไป API จริง + ปิด demo mode (R2) | ~ครึ่งวัน |
| 3 | ทดสอบ end-to-end บนโดเมนจริง สองเครื่องแยกกัน (R2) | ~ครึ่งวัน |
| 4 | Import default factor ชุดจริง (R3) | รอเฟิน |
| 5 | ย้าย monthly-requests ขึ้นเซิร์ฟเวอร์เพื่อปลดล็อกอีเมลเตือน (R4) | ~2 วัน |
| 6 | Upload pipeline (R5) | ~2-3 วัน หรือเลื่อน |

**ข้อ 1-3 คือทั้งหมดที่กั้นระหว่าง "เดโมสวย" กับ "Design Partner ใช้จริง"** ประมาณ 2 วันถ้าไม่ติด CORS

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
| คู่มือเทสต์ | [TESTING.md](TESTING.md) |
