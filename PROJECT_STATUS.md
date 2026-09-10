# 📊 สถานะโครงการและตารางเช็คลิสต์เตรียมเปิดตัว (Project Status & Launch Checklist)

ไฟล์นี้สรุปว่า **โค้ดในรีโปตอนนี้ทำอะไรได้จริงบ้าง** และเหลืออะไรที่ โบ๊ท กับ เฟิน ต้องลุยต่อก่อนปล่อยให้ Design Partner ใช้งานจริง

> อัปเดตล่าสุด: 10 ก.ย. 2026 — เพิ่ม job deploy backend ใน `deploy.yml` และเขียนสูตร Cloud Run ใน README ใหม่ให้ครบ
> ฐานของไฟล์นี้ยังเป็นการไล่อ่านโค้ดจริงทั้งรีโปเมื่อ 7 ก.ย. + ยิงเช็คโดเมน production จริง ไม่ได้อ่านจากแผนงาน
> รอบ 30 ส.ค. ประเมินไว้ 65% ซึ่งตกยุคไปมาก — 70 คอมมิตหลังจากนั้นปิด Blocker เดิมไปเกือบทั้งหมด

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

ตัวที่ทำให้ demo mode ติดไปกับ build คือ [`next.config.ts:54`](certrace-portal/next.config.ts:54) ที่ default เป็น `"1"` — CI ไม่ได้ตั้งตัวแปรนี้ ([`deploy.yml:115`](.github/workflows/deploy.yml:115)) และไม่มีไฟล์ `.env` ในรีโป ค่า `"1"` จึงถูกฝังเข้า bundle ทุกครั้งที่ deploy
ส่วน [`wrangler.jsonc:46`](certrace-portal/wrangler.jsonc:46) ที่ตั้ง `NEXT_PUBLIC_DEMO_MODE: "1"` ไว้ **ไม่มีผลอะไรเลย** — ดู ⚠️ ใน R2
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
| **Backend — เครื่องคำนวณ CBAM** | 🟢 100%* | คำนวณครบ **ทั้ง 4 เส้น** ของ fixture แล้ว (10 ก.ย.) — เชื้อเพลิงผ่านค่าความร้อน, process emission แบบ mass balance, indirect, precursor หลายชั้น พร้อม audit trace ทุกเส้น | \* ตัวเครื่องครบแล้ว แต่ยังต้องรอ **ค่า default factor ตัวจริง** (R3) ถึงจะใช้กับสินค้านอก 2 CN code ได้ |
| **Backend — อีเมลแจ้งเตือน** | 🟡 85% | เทมเพลต 7 แบบ, delivery log กันส่งซ้ำด้วย unique index, job รันเตือนตามตาราง | job ยังต่อกับ `NullSource` = ยังไม่ส่งอะไรเลย เพราะข้อมูลคำขอยังอยู่ใน localStorage (ดู R4) |
| **Deploy** | 🟡 75% | [`deploy.yml`](.github/workflows/deploy.yml) ยิง landing + portal ขึ้น Cloudflare อัตโนมัติทุก merge เข้า main พร้อมเช็ค security header ที่ปลายทาง + **มี job `backend` ยิงขึ้น Cloud Run แล้ว** (build → migration job → deploy → เช็ค `/readyz` + CORS) | job นั้นยัง **skip ตัวเองอยู่** เพราะ repository variable ฝั่ง GCP ยังไม่มีใครตั้ง และ `api.certrace.co` ยังเป็น DNS เปล่า |
| **CI / คุณภาพโค้ด** | 🟢 100% | lint, typecheck, unit test, npm audit, pip-audit, CodeQL, secret scan, Playwright E2E | — |
| **Admin Portal** | ⚫ ลบแล้ว | ตัดออกจากขอบเขต MVP ตั้งแต่ต้น ไม่เคยอยู่ใน CI และไม่เคย deploy — ลบโฟลเดอร์ทิ้งแล้ว 10 ก.ย. | — (ยังอยู่ใน git history ถ้าวันหนึ่งจะรื้อกลับมา) |

---

## ✅ 1. งานที่ทำเสร็จแล้วจริง (ยืนยันจากโค้ด)

*   **หลังบ้าน (FastAPI) — ส่วนที่รอบก่อนยังไม่มีเลย**
    *   [x] **Auth ครบวงจร** — [`app/routers/auth.py`](certrace-backend/app/routers/auth.py): สมัคร / ล็อกอิน / ต่ออายุ token / ออกจากระบบ / เปลี่ยน-ลืม-รีเซ็ตรหัสผ่าน ออก JWT จริง ([`app/core/tokens.py`](certrace-backend/app/core/tokens.py))
    *   [x] **Smart link ฝั่งเซิร์ฟเวอร์** — [`app/routers/links.py`](certrace-backend/app/routers/links.py) + migration `009_smart_links` ซัพพลายเออร์กรอกจากเครื่องตัวเอง แล้วผู้ส่งออกเห็นจริง
    *   [x] **Declarations ตามความหมายของพอร์ทัล** — CRUD ครบที่ [`app/routers/declarations.py`](certrace-backend/app/routers/declarations.py) (migration `006_portal_declarations`)
    *   [x] **อุดช่องโหว่ auth ทั้งสองจุดของรอบก่อน** — `/forgot-password` ส่งโค้ดทางอีเมลแล้ว ไม่คืน token ใน response อีก และ in-memory store ถูกล็อกไว้เฉพาะโหมดไม่มี `DATABASE_URL` เท่านั้น ถ้าต่อ DB แล้วล้มจะ raise ไม่ตกไปใช้ memory เงียบๆ ([`auth_service.py`](certrace-backend/app/services/auth_service.py) — อ่าน docstring บนหัวไฟล์)
    *   [x] **Schema เหลือชุดเดียว** — alembic เดินถึง `010_notification_deliveries` ส่วน `schema.sql` ที่เป็นซากถูกลบทิ้งแล้ว 10 ก.ย.
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
ยิง `https://api.certrace.co/readyz` ตอนนี้ได้ **403 จาก Cloudflare** ซึ่งคือหน้า DNS record เปล่า ไม่มี service อยู่หลัง
โค้ดพร้อมหมดแล้ว: Dockerfile, Procfile, alembic, สูตร Cloud Run ที่ [`certrace-backend/README.md:260`](certrace-backend/README.md:260) และตั้งแต่ 10 ก.ย. **ท่อ deploy อัตโนมัติก็เขียนเสร็จแล้ว** — เหลือแค่ของจริงฝั่ง GCP ที่ต้องมีคนเปิดคอนโซลทำ

ทำครั้งแรกด้วยมือหนึ่งรอบ จากนั้น job `backend` ใน [`deploy.yml`](.github/workflows/deploy.yml) จะรับช่วงต่อทุก merge ที่แตะ `certrace-backend/` (ตอนนี้มันเห็นว่า variable ยังไม่ครบ เลย skip ตัวเองพร้อมโน้ตบอกว่าขาดตัวไหน — ไม่ทำให้ main แดง)

*   [ ] **เฟิน:** เตรียม Postgres (Supabase / Neon / Cloud SQL) แล้วยัด pooled URI เข้า Secret Manager
*   [ ] **เฟิน:** สร้าง secret ให้ครบ **3 ตัว** — `certrace-database-url`, `certrace-jwt-secret`, `certrace-resend-api-key`
*   [ ] **เฟิน:** รัน migration ผ่าน Cloud Run Job แล้ว deploy service ตามสูตรใน README (env ครบอยู่ในคำสั่งเดียวที่นั่นแล้ว)
*   [ ] **เฟิน:** ทำ domain mapping `api.certrace.co` → Cloud Run แล้วตั้ง record ใน Cloudflare เป็น **DNS only** (เมฆเทา) — ถ้าเปิด proxy สีส้ม managed certificate จะจับมือไม่สำเร็จ
*   [ ] **โบ๊ท:** ตั้ง repository variable 4 ตัวที่บังคับ (`GCP_PROJECT_ID`, `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_DEPLOY_SERVICE_ACCOUNT`, `GCP_RUNTIME_SERVICE_ACCOUNT`) ตามตารางใน [README §Deploy from CI](certrace-backend/README.md:446) — ตั้งเสร็จเมื่อไหร่ merge ถัดไปยิงขึ้นเองเลย
*   [x] เพิ่ม job deploy backend ใน [`deploy.yml`](.github/workflows/deploy.yml) — ทำแล้ว 10 ก.ย. (pytest → build image ติดแท็ก commit → Cloud Run Job รัน alembic → deploy service → เช็ค `/readyz` ทั้ง service URL และโดเมนจริง + ยิง preflight CORS ด้วย Origin ของพอร์ทัล)
*   [x] ~~ตั้ง body size limit 8 MB~~ — ไม่ต้องทำอะไร Cloud Run รับ body ได้ถึง 32 MiB อยู่แล้ว ตัวที่ต้องระวังคือ proxy ที่มาคั่นข้างหน้าเท่านั้น

> ⚠️ **สองตัวแปรที่ลืมแล้วเจ็บ** (เพิ่งเพิ่มเข้าตาราง env ของ README รอบนี้)
> `CERTRACE_JWT_SECRET` — ไม่มีแล้ว **แอปไม่ start เลย** ถ้ามี `DATABASE_URL` ([`main.py:59`](certrace-backend/app/main.py:59)) อาการคือ revision ไม่ผ่าน startup probe
> `CERTRACE_APP_BASE_URL` — อันนี้ร้ายกว่า เพราะ**ไม่มีอาการอะไรเลย** ไม่ตั้งแล้ว service ยังขึ้นปกติ ผ่าน probe ปกติ แต่ smart link ทุกอันที่ mint ออกไปจะชี้ไป `https://app.certrace.co` ตาม default ([`config.py:51`](certrace-backend/app/config.py:51)) ซึ่งเป็นโดเมนที่ไม่มีอยู่จริง กว่าจะรู้ตัวคือตอนซัพพลายเออร์กดลิงก์ในอีเมลที่เราส่งไปแล้ว — ต้องตั้งเป็น `https://portal.certrace.co`

#### **R2. พอร์ทัล production ยังวิ่งใน demo mode**
ดูหัวข้อ 🚨 ด้านบน ทำทันทีที่ R1 เสร็จ
> ⚠️ **`NEXT_PUBLIC_*` ตั้งใน `wrangler.jsonc` ไม่มีผล** — Next ฝังค่าเหล่านี้เป็นค่าคงที่ตอน build ส่วน `vars` ของ wrangler เป็น runtime binding ของ Worker ที่มาถึงหลังการแทนค่าไปแล้ว และโค้ดที่อ่านค่าเหล่านี้ ([`config.ts:29`](certrace-portal/lib/api/config.ts:29)) ถูกเรียกจากหน้า `"use client"` ทั้งหมด
> ถ้าตั้งผิดที่ อาการคือพอร์ทัลยังวิ่ง demo เหมือนเดิม ไม่ error ไม่มีอะไรฟ้อง — หาสาเหตุยากมาก

*   [ ] **โบ๊ท:** ตั้ง `NEXT_PUBLIC_API_BASE_URL=https://api.certrace.co` ใน **build environment** — เพิ่มใน `env:` block ของ [`deploy.yml:115`](.github/workflows/deploy.yml:115) หรือทำเป็น repository variable ไม่ใช่ `wrangler.jsonc`
*   [ ] **โบ๊ท:** เปลี่ยน default ใน [`next.config.ts:54`](certrace-portal/next.config.ts:54) จาก `"1"` เป็นค่าว่าง — **นี่คือสวิตช์ตัวจริงที่ปิด demo mode** ข้ออื่นไม่มีผลถ้าไม่ทำข้อนี้
*   [ ] **โบ๊ท:** ลบ `NEXT_PUBLIC_DEMO_MODE` ออกจาก [`wrangler.jsonc:46`](certrace-portal/wrangler.jsonc:46) เป็นการเก็บกวาดเฉย ๆ เพราะไม่เคยมีผลอยู่แล้ว
*   [ ] **โบ๊ท:** หลัง deploy เช็คว่าปิดจริง — เปิด `https://portal.certrace.co/login` ต้องเห็นแผง "Not open yet" แทนช่องกรอกรหัสผ่าน (ก่อน R1 เสร็จ) หรือล็อกอินด้วยบัญชีจริงได้ (หลัง R1 เสร็จ)
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

#### **D1. เครื่องคำนวณสองตัว — ✅ ปิดช่องว่างแล้ว 10 ก.ย.**
golden fixture กลางที่ทั้งสองฝั่งอ่านไฟล์เดียวกัน ([`docs/fixtures/golden-eaf-2026.json`](docs/fixtures/golden-eaf-2026.json)) ยังอยู่ และ **backend คำนวณครบทั้ง 4 เส้นแล้ว** ตัวเลขตรงกับพอร์ทัลทุกเส้น
*   [x] **เชื้อเพลิง** — เพิ่มหน่วย `GJ` / `MTQ` / `KGM` / `LTR` และค่าความร้อน (`net_calorific_value`) เข้าโมเดล ถ้าส่งปริมาณที่วัดมาโดยไม่มีค่าความร้อนจะ **ปฏิเสธ ไม่เดาค่ามาตรฐานให้** (ก๊าซธรรมชาติ 0.0561 tCO2/GJ ถ้าอ่านผิดเป็น tCO2/m³ ตัวเลขบานขึ้นราว 25 เท่า)
*   [x] **Process emission** — เพิ่ม input แยกพร้อม trace method `MASS_BALANCE` และค่าคงที่ `CO2_PER_C = 3.664` ที่ผู้เรียก **ตั้งเองไม่ได้** จะได้ไม่มีใครยื่นด้วยค่า 44/12 ของตัวเอง
*   [x] **Precursor หลายชั้น** — มี `children` + ค่าการปล่อยของชั้นตัวเอง คำนวณจากล่างขึ้นบน กันวงจรและจำกัดความลึก 10 ชั้นเท่าฝั่งพอร์ทัล
*   [ ] **ตัดสินใจ:** จะย้ายให้ backend เป็น source of truth ของตัวเลขที่ยื่นจริงเมื่อไหร่ — ตอนนี้พอร์ทัลยังเป็นคนคำนวณสิ่งที่ลูกค้าเห็น ความพร้อมมีแล้ว เหลือแค่ตัดสินใจว่าจะสลับตอนไหน

#### **D2. Store ที่ยังไม่ได้ย้ายขึ้นเซิร์ฟเวอร์**
`team-store`, `workspace-*`, `profile`, `monthly-requests`, `precursor-suppliers`, evidence ยังเป็น localStorage ทั้งหมด
ตาม [API contract](docs/API-CONTRACT.md) ข้อ 6 อันนี้ **ตั้งใจเลื่อน** เพราะ state ของซัพพลายเออร์เดินทางเป็น JSON ก้อนเดียวอยู่แล้ว
*   [ ] ยืนยันว่ายังยอมรับได้ — ผลคือข้อมูลทีม/โปรไฟล์/คำขอรายเดือนผูกกับเบราว์เซอร์เครื่องเดียว ย้ายเครื่องแล้วหาย (และทำให้ R4 ทำงานไม่ได้)

#### **D3. เศษที่ค้างในรีโป**
*   [x] ลบ `certrace-admin-portal` — ทำแล้ว 10 ก.ย. (47 ไฟล์ ไม่มีอะไรนอกโฟลเดอร์อ้างถึงนอกจากเอกสาร)
*   [x] ลบ `certrace-backend/schema.sql` — ทำแล้ว 10 ก.ย.
    > ⚠️ ตอนลบเจอว่ามันไม่ใช่ซากเฉยๆ: ในนั้นมี 13 ตารางที่ **ไม่เคยถูก migrate เลย** — 5 ตัวเป็นของ admin portal ที่ลบไปแล้ว แต่อีก 6 ตัว (`organizations`, `profiles`, `team_members`, `supplier_states`, `exporter_decl_states`, `directory_suppliers`) คือหน้าตาที่เคยออกแบบไว้ให้ store ที่ตอนนี้ยังอยู่ใน localStorage ตาม D2 พอดี
    > ไม่ได้หายไปไหน — `git show HEAD:certrace-backend/schema.sql` ดึงกลับมาอ่านได้ตลอด และตอนจะทำ D2/R4 จริงควรเปิดดูก่อนออกแบบใหม่
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
