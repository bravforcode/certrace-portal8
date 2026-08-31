# 📊 สถานะโครงการและตารางเช็คลิสต์เตรียมเปิดตัว (Project Status & Launch Checklist)

ไฟล์นี้สรุปความคืบหน้าของ **Certrace** ว่าตอนนี้ **โค้ดในรีโปทำอะไรได้จริงบ้าง** และเหลืออะไรที่ โบ๊ท กับ เฟิน ต้องลุยต่อก่อนจะปล่อยให้ Design Partner ใช้งานจริง

> อัปเดตล่าสุด: 30 ส.ค. 2026 — ทบทวนจากโค้ดจริงทั้งรีโป ไม่ใช่จากแผนงาน
> ตัวเลขก่อนหน้านี้ (92%) นับเฉพาะงาน Landing Page และ Outreach ซึ่งเสร็จจริง แต่ยังไม่ได้นับว่าตัวโปรดักต์ยังขาดชั้น Backend ทั้งชั้น

---

## 📈 ความคืบหน้าภาพรวม (Overall Progress): 65%

```
[██████████████████████████░░░░░░░░░░░░░░] 65%
```

ต้องแยกให้ชัดว่า "MVP" หมายถึงอะไร เพราะคำตอบต่างกันมาก:

| นิยามของ MVP | สถานะ | เหลืออะไร |
| :--- | :---: | :--- |
| **เปิดเดโมให้ลูกค้าดูได้** (เดินโฟลว์บนเครื่องเดียว) | 🟢 ~95% | Deploy อย่างเดียว |
| **Design Partner ใช้งานจริง เก็บข้อมูลซัพพลายเออร์จริงได้** | 🟡 ~55% | ต้องมี Backend + Auth + ที่เก็บข้อมูลจริง (ดูหัวข้อ 🔴 ด้านล่าง) |

---

## 🏛️ สรุปความพร้อมของแต่ละส่วน (Component Status)

| ส่วนประกอบ | ความพร้อม | ทำเสร็จแล้ว | งานที่ต้องทำต่อ |
| :--- | :---: | :--- | :--- |
| **Landing Page** | 🟢 100% | Next.js 15 หลายภาษา, ฟอร์ม Book Demo & Waitlist ยิงเข้า Google Sheets ผ่าน Apps Script เรียบร้อย | Deploy ขึ้น Cloudflare |
| **Outreach Scripts** | 🟢 100% | ยืนยันโดเมนอีเมลบน Resend, ยิงเมลหา Design Partners ชุดแรกแล้ว | สแตนบายมอนิเตอร์ตอบกลับ |
| **Portal — หน้าจอ/UX** | 🟢 95% | ครบทุกหน้า: dashboard, workspaces, precursor tree, MMD, evidence, verification, รายงาน PDF/XML, responsive, 2 ภาษา | เลือกให้เหลือพอร์ทัลเดียว (ตอนนี้มี 2 โฟลเดอร์ซ้ำกัน) |
| **Portal — การเชื่อมต่อข้อมูล** | 🔴 0% | — | **ยังไม่มี `fetch` แม้แต่จุดเดียวในพอร์ทัล** ข้อมูลทั้งหมดอยู่ใน `localStorage` |
| **Backend — เครื่องคำนวณ CBAM** | 🟢 85% | `app/services/mrv_engine.py` คำนวณ source stream / electricity / PFC / precursor ครบ พร้อม audit trace | นำเข้าค่า EU default factor ตัวจริง (ตอนนี้มีแค่ 2 แถวตัวอย่าง) |
| **Backend — API ที่พอร์ทัลต้องใช้** | 🔴 25% | มี `/api/v1/calculate`, `/api/v1/declarations`, health checks, เปลี่ยน/รีเซ็ตรหัสผ่าน | **ไม่มี register / login / JWT / suppliers / smart-link / team / upload** |
| **Admin Portal** | 🔴 Deprecated | ตัดออกจากขอบเขต MVP | ใช้ Supabase Dashboard จัดการข้อมูลแทน (โฟลเดอร์ยังค้างในรีโป ไม่ได้อยู่ใน CI) |
| **CI / คุณภาพโค้ด** | 🟢 90% | GitHub Actions: lint, typecheck, unit test, npm audit, pip-audit, CodeQL, secret scan | ยังไม่มี workflow สำหรับ deploy |

---

## ✅ 1. งานที่ทำเสร็จแล้วจริง (ยืนยันจากโค้ด)

*   **Landing & Outreach**
    *   [x] Landing page Next.js 15 หลายภาษา (`landingpage/certrace-landing`)
    *   [x] ฟอร์ม Book Demo / Waitlist ผูกเข้า Google Sheets ผ่าน `apps-script/lead-capture.gs` — จัดการฟิลด์ใหม่อัตโนมัติ, กัน submit ชนกันด้วย LockService, กันเบอร์โทรกลายเป็น #ERROR!
    *   [x] ยืนยันโดเมนอีเมลแบรนด์บน Resend และยิงเมลหา Design Partners ชุดแรกแล้ว
*   **หน้าบ้านพอร์ทัล (Next.js 15 + React 19)**
    *   [x] ครบทุกหน้าตามสถาปัตยกรรม CBAM definitive period: workspaces, precursor tree, monthly data, MMD, evidence, readiness, verification, carbon cost
    *   [x] หน้ากรอกข้อมูลของคู่ค้าแบบไม่ต้องสมัครสมาชิก (`app/s/[token]`, `app/p/[token]`, `app/w/[token]`, `app/self/[token]`)
    *   [x] ออกรายงาน PDF และ CBAM XML ฝั่ง client (`lib/cbam/final-report-pdf.ts`, `lib/cbam-xml.ts`)
    *   [x] Responsive ครบทุกขนาดจอ + สลับภาษา TH/EN
    *   [x] Unit test ฝั่ง logic กว่า 5,200 บรรทัด (`lib/__tests__` + `lib/cbam/__tests__`)
*   **หลังบ้าน (FastAPI)**
    *   [x] เครื่องคำนวณ MRV ตามสูตร CBAM พร้อม audit trace และ error code ที่ระบุสาเหตุได้
    *   [x] แฮชรหัสผ่านด้วย PBKDF2-HMAC-SHA256 600,000 รอบ (`app/core/security.py`)
    *   [x] CORS allowlist + security headers middleware
    *   [x] Alembic migrations, Dockerfile, Procfile พร้อม deploy
    *   [x] ต่อ Supabase/Neon ได้ (`DatabaseRepository` + `.env.example`)

---

## 🔴 2. Blocker — ไม่ทำ = ใช้กับลูกค้าจริงไม่ได้

#### **B1. Smart Link ซัพพลายเออร์ยังใช้งานข้ามเครื่องไม่ได้ — อันนี้คือหัวใจของโปรดักต์**
`certrace-portal/lib/supplier-store.ts:9` — state ผูกกับ token แต่เก็บใน `localStorage` ของเบราว์เซอร์ตัวเอง
แปลว่าซัพพลายเออร์เปิดลิงก์บนเครื่องเขา กรอกเสร็จ → **ฝั่งผู้ส่งออกไม่เห็นอะไรเลย**
*   [ ] ทำ API รับ-ส่ง state ของ smart link แล้วย้าย store มาเรียก API

#### **B2. พอร์ทัลไม่ได้ต่อ backend เลยแม้แต่จุดเดียว**
`grep "fetch("` ทั้งโฟลเดอร์ `certrace-portal/` ได้ 0 ผลลัพธ์ และ `lib/profile.tsx:7` เขียนไว้ตรงๆ ว่า *"no backend in this MVP"*
*   [ ] ย้าย `declarations-store`, `supplier-store`, `team-store`, `workspace-*` จาก localStorage ไปเรียก API

#### **B3. Login เป็นของปลอม และ backend ยังไม่มี endpoint ให้ล็อกอิน**
`certrace-portal/app/login/page.tsx:39` — กดปุ่มแล้ว `setTimeout` เด้งเข้า onboarding ไม่ตรวจรหัสผ่าน ไม่มี session
ฝั่ง backend ก็ไม่มี `/register`, `/login` และไม่มี JWT เลย (`grep jwt` ใน backend = 0) มีแค่ change/forgot/reset password
*   [ ] เพิ่ม `/api/auth/register` + `/api/auth/login` ออก JWT
*   [ ] ต่อหน้า login/register ของพอร์ทัลเข้ากับ endpoint จริง

#### **B4. ช่องโหว่ auth 2 จุดใน backend**
*   [ ] `app/routers/auth.py:45` — `/forgot-password` คืน `reset_token` กลับมาใน response ยิง API ด้วยอีเมลใครก็รีเซ็ตรหัสคนนั้นได้ทันที ต้องส่งโค้ดทางอีเมลแทน
*   [ ] `app/services/auth_service.py:65` — path fallback สร้าง user ใหม่จาก `current_password` ที่ผู้เรียกส่งมาเอง = เปลี่ยนรหัสอีเมลไหนก็ได้ ต้องเอา in-memory store ออกจาก production path

#### **B5. Schema ตีกันสองชุด**
`certrace-backend/schema.sql` (users / profiles / directory_suppliers / team_members + seed mock) กับ `migrations/versions/001_initial_schema.py` (declarations / calculation_runs / default_emission_factors — คนละคอลัมน์กันคนละเรื่อง)
`auth_service` query `public.users` ซึ่ง alembic ไม่ได้สร้าง → ถ้า deploy ด้วย alembic ระบบ auth จะเงียบๆ ตกไปใช้ memory store โดยไม่ error
*   [ ] รวมให้เหลือ source of truth เดียว (แนะนำ: alembic) แล้วเขียน migration ของตารางที่ขาด

---

## 🟡 3. ต้องตัดสินใจก่อนลุยต่อ

#### **D1. พอร์ทัลซ้ำสองโฟลเดอร์**
`certrace-portal` กับ `certrace-exporter-portal` ต่างกันแค่ ~15 ไฟล์ แต่ build คนละระบบ (`@cloudflare/next-on-pages` vs `@opennextjs/cloudflare`) และ CI รันทั้งคู่
*   [ ] เลือกอันเดียว ลบอีกอัน ไม่งั้นแก้บั๊กต้องแก้สองที่และ CI จ่ายเวลาสองเท่า

#### **D2. เครื่องคำนวณมีสองตัว**
`certrace-portal/lib/cbam/engine.ts` (frontend) กับ `certrace-backend/app/services/mrv_engine.py` (backend)
*   [ ] ชี้ว่าอันไหนเป็น source of truth ไม่งั้นตัวเลขบนจอกับในรายงานที่ยื่นไม่ตรงกัน

#### **D3. ค่า default factor ยังเป็นไฟล์ตัวอย่าง**
`default_factors.template.csv` มีแค่ 2 แถว (เหล็ก 1 CN code, อะลูมิเนียม 1 CN code)
*   [ ] **เฟิน:** ทำตาราง EU default values ตัวจริงให้ครบ CN code ที่เรารองรับ แล้ว import ด้วย `import_default_factors.py`
*   [ ] **เฟิน & โบ๊ท:** เอาตัวเลขจริงมากรอกเทียบกับที่เคยคำนวณใน Excel

#### **D4. อัปโหลดไฟล์ยังไม่มีที่เก็บจริง**
`lib/supplier-store.ts` เก็บไฟล์เป็น base64 ใน localStorage ได้ ~1.5 MB ไฟล์ที่ใหญ่กว่านั้นเก็บแค่ชื่อ+ขนาด — ใบเซอร์จริงส่วนใหญ่ใหญ่กว่านี้และจะหาย
*   [ ] ทำ upload pipeline (bucket + signed URL + จำกัดชนิด/ขนาดไฟล์)

---

## 🚀 4. งาน Deploy ที่ยังค้าง

*   [ ] **เฟิน:** deploy backend ขึ้นของจริง (Dockerfile / Procfile พร้อมแล้ว — Render / Fly.io / Cloud Run ได้หมด)
*   [ ] **โบ๊ท:** deploy พอร์ทัลขึ้น Cloudflare + ผูกโดเมนบริษัท + HTTPS
*   [ ] **โบ๊ท:** deploy landing page ขึ้น Cloudflare
*   [ ] **เฟิน:** ตั้ง `CERTRACE_CORS_ALLOWED_ORIGINS` เป็นโดเมนจริง และปิด `CERTRACE_ENABLE_API_DOCS` บน production
*   [ ] เพิ่ม workflow deploy ใน `.github/workflows/` (ตอนนี้มีแต่ CI)
*   [ ] **โบ๊ท & เฟิน:** ทดลองกดใช้จริงบนโดเมนจริงว่า API เชื่อมลื่น ไม่ติด CORS

---

## 📌 5. เส้นทางที่แนะนำ (ถ้าอยากให้ Design Partner ใช้จริงเร็วที่สุด)

ตัดขอบเขต MVP ให้เหลือแค่โฟลว์เดียว: **ผู้ส่งออกสร้างรายงาน → ส่งลิงก์ → ซัพพลายเออร์กรอกจากเครื่องตัวเอง → ข้อมูลกลับมาที่ผู้ส่งออก**

| ลำดับ | งาน | ประเมินเวลา |
| :---: | :--- | :--- |
| 1 | อุดช่องโหว่ auth (B4) + รวม schema ให้เหลือชุดเดียว (B5) | ~1 วัน |
| 2 | เลือกพอร์ทัลตัวเดียว (D1) | ~ครึ่งวัน |
| 3 | เพิ่ม register/login + JWT + API สำหรับ smart-link token แบบ server-issued มีวันหมดอายุ (B3, B1) | ~1 สัปดาห์ |
| 4 | ย้าย store ฝั่งพอร์ทัลมาเรียก API (B2) | ~1 สัปดาห์ |
| 5 | Deploy ทั้งสามชิ้น + ทดสอบ end-to-end | ~2 วัน |

ส่วนงานที่ระบุไว้ใน `certrace-portal/docs/SECURITY.md` — audit trail แบบ hash-chain, RBAC ฝั่งเซิร์ฟเวอร์, antivirus scan, nonce-based CSP — ยกไป post-MVP ได้ แต่ต้องทำก่อนรับลูกค้าที่จ่ายเงิน

---

## 📎 อ้างอิงไฟล์สำคัญ

| เรื่อง | ไฟล์ |
| :--- | :--- |
| Schema ชุด portal | [certrace-backend/schema.sql](certrace-backend/schema.sql) |
| Schema ชุด alembic | [certrace-backend/migrations/versions/](certrace-backend/migrations/versions/) |
| เครื่องคำนวณ backend | [certrace-backend/app/services/mrv_engine.py](certrace-backend/app/services/mrv_engine.py) |
| เครื่องคำนวณ frontend | [certrace-portal/lib/cbam/engine.ts](certrace-portal/lib/cbam/engine.ts) |
| Store ของ smart link | [certrace-portal/lib/supplier-store.ts](certrace-portal/lib/supplier-store.ts) |
| สรุปสถานะความปลอดภัย | [certrace-portal/docs/SECURITY.md](certrace-portal/docs/SECURITY.md) |
| สคริปต์รับ lead | [apps-script/lead-capture.gs](apps-script/lead-capture.gs) |
