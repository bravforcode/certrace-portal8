# API Contract — MVP รอบวันที่ 6 ก.ย. 2026

เอกสารนี้คือข้อตกลงระหว่าง **เลน Backend** (คนที่เขียน endpoint) กับ **เลน Wiring**
(คนที่ย้ายพอร์ทัลมาเรียก API) เขียนไว้เพื่อให้สองฝั่งทำงานขนานกันได้ตั้งแต่วันแรก
โดยไม่ต้องรอให้อีกฝั่งเสร็จก่อน

**สถานะ: ร่าง — รอ dev B รีวิว** ถ้าตรงไหนไม่เห็นด้วยให้แก้ในไฟล์นี้แล้วบอกกัน
ก่อนเริ่มเขียนโค้ด อย่าแก้เงียบๆ ที่ฝั่งใดฝั่งหนึ่ง

---

## หลักการของรอบนี้

เหลือ 7 วัน เพราะฉะนั้นตั้งใจ **ไม่** normalize ทุกอย่าง

1. **เซิร์ฟเวอร์เป็นเจ้าของแค่ 3 เรื่อง** — ตัวตน (JWT), token ของ smart link,
   และการเปลี่ยนสถานะตอน submit ที่เหลือปล่อยให้เป็นข้อมูลที่ client ส่งมาทั้งก้อน
2. **State ของซัพพลายเออร์เก็บเป็น JSON blob ก้อนเดียว** — วันนี้ฝั่งพอร์ทัลก็เก็บ
   แบบนี้อยู่แล้ว (หนึ่ง key ต่อหนึ่ง token) การแตกเป็นตารางย่อยรอหลังวันที่ 6 ได้
3. **ไม่มี endpoint ไหนคืน HTML หรือ redirect** — JSON อย่างเดียว
4. **ทุก error หน้าตาเหมือนกัน** ดูหัวข้อ Error ด้านล่าง

---

## ⚠️ เรื่องที่ต้องเคาะก่อนเขียนโค้ด

**คำว่า "declaration" ตอนนี้หมายถึงคนละอย่างในสองฝั่ง**

| | หมายถึงอะไร | อยู่ที่ไหน |
| :-- | :-- | :-- |
| Backend วันนี้ | ผลการคำนวณหนึ่งครั้ง ที่เก็บไว้ดูย้อนหลัง | `POST /api/v1/declarations` รับ `DeclarationInput` แล้วคืน `calculation` |
| พอร์ทัลวันนี้ | งานรายงานหนึ่งชิ้น มีซัพพลายเออร์ ผู้ซื้อ รอบเวลา สถานะ | `lib/data.ts` type `Declaration` |

ถ้าปล่อยไว้ สองฝั่งจะเขียนทับความหมายกันที่ path เดียวกัน **ข้อเสนอ:**

- `POST /api/v1/calculate` — คำนวณอย่างเดียว **ใช้ของเดิม ไม่ต้องแก้**
- `/api/v1/declarations/*` — ยกให้ความหมายของพอร์ทัล (งานรายงาน) ตามสเปกข้างล่าง
- endpoint เดิมที่คำนวณแล้วเก็บ ให้เลิกใช้ ถ้ายังอยากเก็บผลคำนวณย้อนหลัง
  ให้ backend เขียนลง `calculation_runs` เองตอนเรียก `/calculate` ไม่ต้องมี path แยก

ถ้า dev B ไม่เห็นด้วย ทางเลือกสำรองคือย้ายของพอร์ทัลไปที่ `/api/v1/reports/*` แทน —
**เลือกอันไหนก็ได้ แต่ต้องเลือกวันที่ 1** เพราะฝั่ง client layer ต้องรู้ path ที่ถูกต้อง

---

## กติกากลาง

**Base URL** — `https://api.certrace.co` (production) · `http://localhost:8000` (dev)
ฝั่งพอร์ทัลอ่านจาก `NEXT_PUBLIC_API_BASE_URL`

**Auth header** — `Authorization: Bearer <jwt>` ทุก endpoint ที่ทำเครื่องหมาย 🔒

**Error** — ทุก error คืน HTTP status ที่เหมาะสม พร้อม body หน้าตานี้เสมอ
(รูปแบบเดียวกับที่ backend ใช้อยู่แล้วใน `/calculate`)

```json
{ "detail": { "code": "TOKEN_EXPIRED", "message": "ลิงก์นี้หมดอายุแล้ว" } }
```

code ที่ฝั่งพอร์ทัลจะดักเป็นพิเศษ:
`INVALID_CREDENTIALS` · `INVALID_RESET_TOKEN` · `EMAIL_TAKEN` ·
`TOKEN_NOT_FOUND` · `TOKEN_EXPIRED` · `TOKEN_REVOKED` · `ALREADY_SUBMITTED` ·
`DECLARATION_NOT_FOUND` · `RATE_LIMITED` (429 — ยิงถี่เกิน หน้าต่าง 15 นาที)

**เวลา** — ทุก timestamp เป็น epoch milliseconds (number) ให้ตรงกับที่พอร์ทัลใช้อยู่
อย่าส่ง ISO string ปนมา

---

## 1 · Auth

### `POST /api/auth/register`

```jsonc
// request
{ "email": "a@b.co", "password": "…", "firstName": "", "lastName": "", "companyName": "" }
// response 201
{ "accessToken": "eyJ…", "user": { "id": "…", "email": "…", "onboarded": false } }
```

`onboarded: false` เสมอสำหรับคนสมัครใหม่ — พอร์ทัลใช้ค่านี้ตัดสินว่าจะพาไป
`/onboarding` หรือเข้าแดชบอร์ดตรงๆ

### `POST /api/auth/login`

```jsonc
{ "email": "a@b.co", "password": "…" }
// 200 → { "accessToken": "eyJ…", "user": { … } }
// 401 → detail.code = "INVALID_CREDENTIALS"
```

### `GET /api/auth/me` 🔒

คืน `{ "user": { … } }` — พอร์ทัลเรียกตอนโหลดหน้าแรกเพื่อเช็คว่า token ยังใช้ได้

### `POST /api/auth/onboarded` 🔒 (เพิ่ม 2026-09-02)

ไม่มี body — bearer บอกอยู่แล้วว่าบัญชีไหน ตั้ง `onboarded = true` ถาวรแล้วคืน
`{ "user": { … } }` พอร์ทัลยิงตอน wizard จบ จากนั้น login/`/` จะพาเข้า
`/dashboard` ตรง ๆ ไม่ผ่าน `/onboarding/setup` อีก (`/` เช็คค่าสดจาก `/me`)

### `POST /api/auth/refresh` · `POST /api/auth/logout` (เพิ่ม 2026-09-02)

Session แยกเป็นสองส่วนแล้ว: **access token (JWT) อายุ 1 ชั่วโมง** +
**refresh token อายุ 7 วัน** (opaque 256-bit เก็บ hash ฝั่ง server — revoke ได้)
ทุก response ของ register/login/refresh คืนทั้งคู่:

```jsonc
{ "accessToken": "eyJ…", "refreshToken": "…", "user": { … } }
```

- `POST /refresh` รับ `{ "refreshToken": "…" }` → คืน session ใหม่ทั้งชุด
  **ใบเดิมตายทันทีที่ใช้** (single-use rotation) ใบตาย/หมดอายุ/มั่ว →
  401 `INVALID_REFRESH_TOKEN`
- `POST /logout` รับ `{ "refreshToken": "…" }` → revoke ฝั่ง server ตอบ 200 เสมอ
- ฝั่งพอร์ทัล `lib/api/http.ts` จัดการเองหมด: เจอ 401 บนเส้น authed →
  refresh หนึ่งครั้ง → ยิงซ้ำ → ถ้า refresh ตายด้วยค่อยเคลียร์ session
  (migration 008 สร้างตาราง `refresh_tokens`)

### ของเดิมที่มีอยู่แล้ว

`change-password` 🔒 · `forgot-password` · `reset-password` ใช้ต่อได้

**✅ hardening รอบ 2026-09-02** —

- `change-password` **ต้องแนบ bearer แล้ว** server เปลี่ยนรหัสของเจ้าของ token
  เท่านั้น (email ใน body ถูกเมิน) — ปิด oracle เดารหัสแบบไม่ต้อง login
- ทุก endpoint auth มี rate limit ต่ออีเมล หน้าต่าง 15 นาที เกินแล้วตอบ
  429 `RATE_LIMITED`: register 5 · login 10 · forgot-password 5 ·
  reset-password 10 · change-password 10
- โค้ด reset: ขอใบใหม่ = ใบเก่าตายทันที (ใช้งานได้ทีละใบเดียว) และเดาผิดครบ
  5 ครั้งโค้ดตาย ต้องขอใหม่ (migration 007 เพิ่มคอลัมน์ `attempts`)

~~**แต่ต้องแก้ก่อน:** `forgot-password` ห้ามคืน `resetToken` กลับมาใน response~~
**✅ แก้แล้ว** — `AuthResponse` ไม่มีฟิลด์ `reset_token` อีกต่อไป รหัส 6 หลัก
ส่งไปที่กล่องจดหมายทางเดียว และ response คืนข้อความกลางๆ ประโยคเดียวเสมอ
ไม่ว่าอีเมลนั้นจะมีอยู่จริงหรือไม่ (ถ้าไม่มีบัญชี = ไม่ส่งเมล แต่ตอบเหมือนเดิมเป๊ะ)

```jsonc
// POST /api/auth/forgot-password
{ "email": "a@b.co", "locale": "th" }   // locale ใส่หรือไม่ใส่ก็ได้
// 200 (ทุกกรณี)
{ "success": true,
  "message": "If an account exists for that email, a reset code is on its way." }
```

**`locale` เพิ่มใหม่ในทั้งสาม endpoint** — `"en"` หรือ `"th"` ไม่ใส่ = `"en"`
ฝั่งพอร์ทัลส่งค่าจาก `certrace:lang` (localStorage) ได้เลย ค่าที่ไม่รู้จัก
เช่น `"de"` หรือ `"th-TH"` ไม่ error — normalize ให้เอง

รหัสมีอายุ 15 นาที ใช้ได้ครั้งเดียว และ `change-password` / `reset-password`
จะยิงเมลยืนยัน "รหัสผ่านถูกเปลี่ยนแล้ว" ตามไปด้วยเสมอ (ปิดไม่ได้ เป็นเมลความปลอดภัย)

**ฝั่งพอร์ทัลต่อเสร็จแล้ว** — `/forgot-password` ยิง API จริง และมีหน้า
`/reset-password` ใหม่สำหรับกรอกรหัส 6 หลัก + ตั้งรหัสผ่านใหม่
(client อยู่ที่ `lib/api/auth.ts` — `requestPasswordReset` · `resetPassword`
ส่ง `auth: false` ไม่แนบ bearer ส่วน `changePassword` แนบ bearer แล้วตาม
hardening ด้านบน)

**error ของสามตัวนี้ใช้ `{detail: {code, message}}` แล้ว** (เดิมเป็น string เปล่า):

| Endpoint | code | เมื่อไหร่ |
| :-- | :-- | :-- |
| `reset-password` | `INVALID_RESET_TOKEN` | รหัสผิด ถูกใช้ไปแล้ว หรือหมดอายุ |
| `change-password` | `INVALID_CREDENTIALS` | รหัสผ่านปัจจุบันไม่ถูกต้อง |

**อย่าลืม CSP** — origin ของ backend ต้องอยู่ใน `connect-src` ไม่งั้นเบราว์เซอร์
บล็อกทุก call เงียบ ๆ และหน้าจอจะขึ้นว่า "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้" ทั้งที่
เซิร์ฟเวอร์ปกติ ตอนนี้ดึงมาจาก `NEXT_PUBLIC_API_BASE_URL` อัตโนมัติแล้ว
ทั้งใน `middleware.ts` และ `scripts/build-csp-headers.mjs`

---

## 2 · Declarations (งานรายงานของผู้ส่งออก)

ทุก endpoint ในหมวดนี้ 🔒 และเห็นเฉพาะของ user ตัวเอง

| Method | Path | ทำอะไร |
| :-- | :-- | :-- |
| `GET` | `/api/v1/declarations` | `{ "declarations": Declaration[] }` |
| `POST` | `/api/v1/declarations` | สร้าง — รับ `Declaration` ทั้งก้อน คืนก้อนที่บันทึกแล้ว |
| `GET` | `/api/v1/declarations/{id}` | อ่านอันเดียว |
| `PUT` | `/api/v1/declarations/{id}` | เขียนทับทั้งก้อน |
| `DELETE` | `/api/v1/declarations/{id}` | ลบ |

**`Declaration` คือ type เดิมของพอร์ทัลตรงๆ** อยู่ที่ `certrace-portal/lib/data.ts`
backend ไม่ต้องรู้จักฟิลด์ข้างในทั้งหมด เก็บเป็น `jsonb` ได้เลย ขอแค่
`id`, `name`, `period`, `step`, `updatedAt` แยกออกมาเป็นคอลัมน์เพื่อ query และเรียงลำดับ

`id` ฝั่ง client เป็นคนสร้าง (`decl-<uuid>`) แล้วส่งมาใน POST — ไม่ต้องให้ server
gen ให้ เพราะพอร์ทัลต้อง redirect ไปหน้ารายละเอียดทันทีหลังกดสร้าง

**✅ ทำแล้วทั้งสองฝั่ง** — backend: `app/routers/declarations.py` + ตาราง
`portal_declarations` (migration 006, PK = `(user_id, id)` เห็นเฉพาะของตัวเองโดย
โครงสร้าง) · `PUT` เป็น upsert (id ฝั่ง client, retry ได้) · ลบแล้วลบซ้ำ = 204 ·
404 ใช้ `DECLARATION_NOT_FOUND` · `updatedAt` server ประทับเป็น epoch ms ·
เอกสารเกิน 512KB โดน 422 `INVALID_DECLARATION` — พอร์ทัล: หน้ารายละเอียดทั้งห้า
อ่านผ่าน `lib/declarations-store.ts` (ตอนนี้ API-backed, localStorage ออกแล้ว)
เมนูลบยิง `DELETE` จริง fixtures ใน `lib/data.ts` เหลือไว้เฉพาะ flow ซัพพลายเออร์
เดโมที่จะย้ายพร้อม §3

---

## 3 · Smart Links — หัวใจของรอบนี้

### token ต้องเปลี่ยนวิธีสร้าง

วันนี้ token คือ `base64url("declId|supplierId")` ซึ่ง **เดาได้** ใครรู้ id สองตัวก็
มินต์ลิงก์เองได้ (มีคอมเมนต์เตือนไว้แล้วใน `lib/supplier.ts:34`)

รอบนี้ให้ server เป็นคนออก:

- สุ่ม 32 bytes → base64url ไม่ derive จาก id ใดๆ
- เก็บ mapping ฝั่ง server: `token → (declId, supplierId, month?, expiresAt, revokedAt)`
- อายุเริ่มต้น 60 วัน
- เพิกถอนได้

### `POST /api/v1/declarations/{id}/links` 🔒

```jsonc
{ "supplierId": "d1", "month": "2026-03", "expiresInDays": 60 }
// 201
{ "token": "kJ8…", "url": "https://app.certrace.co/s/kJ8…", "expiresAt": 1772000000000 }
```

`month` ใส่หรือไม่ใส่ก็ได้ — งานรายเดือนหนึ่งเดือนหนึ่งลิงก์ ตามที่พอร์ทัลทำอยู่

**✅ backend ทำแล้ว (2026-09-03)** — `app/routers/links.py` + ตาราง `smart_links`
(migration 009, FK ผูกกับ `portal_declarations` ลบ declaration = ลิงก์ตายตาม) ·
token = `secrets.token_urlsafe(32)` · `expiresInDays` รับ 1–365 default 60 ·
`month` ต้องเป็น `YYYY-MM` · base URL ของลิงก์อ่านจาก `CERTRACE_APP_BASE_URL`
(default `https://app.certrace.co`) · `revoked_at` เก็บและเช็คแล้วตอน resolve
แต่ยังไม่มี endpoint เพิกถอน (contract ยังไม่ได้นิยาม) · resolve ตอบ 404
`TOKEN_NOT_FOUND` / 410 `TOKEN_EXPIRED` / 410 `TOKEN_REVOKED` และคืน `request`
เฉพาะ slice ของซัพพลายเออร์คนนั้นจาก `requests[]` ในเอกสาร declaration ·
`state` ที่ยังไม่มีใครกรอกคืนก้อนเปล่ารูปเดียวกับ `emptyState()` ไม่คืน `null`

### `GET /api/v1/declarations/{id}/links` 🔒 (เพิ่ม 2026-09-03)

ดึงลิงก์ทั้งหมดที่เคยออกของ declaration นั้น เรียงใหม่สุดก่อน — ฝั่งผู้ส่งออกใช้
เอา token/url กลับมาหลังจาก response ตอน mint หายไปแล้ว (copy ส่งซ้ำ, เช็คว่า
ใบไหนยังไม่หมดอายุ) **ไม่มี** `state` ของซัพพลายเออร์ในนี้ — อยากได้คำตอบให้ใช้
submissions (งานถัดไป)

```jsonc
// 200
{ "links": [
  { "token": "kJ8…", "url": "https://app.certrace.co/s/kJ8…",
    "supplierId": "d1", "month": "2026-03",
    "expiresAt": 1772000000000, "revokedAt": null, "createdAt": 1770000000000 }
] }
```

**✅ backend ทำแล้ว (2026-09-03)**

### `GET /api/v1/links/{token}` — **ไม่ต้อง auth**

ซัพพลายเออร์ไม่มีบัญชี นี่คือ endpoint เดียวที่เปิดสาธารณะ

```jsonc
{
  "token": "kJ8…",
  "declId": "decl-…",
  "supplierId": "d1",
  "month": "2026-03",
  "expiresAt": 1772000000000,
  "exporter": { "companyName": "Siam Steel Export Co." },
  "request": { /* ที่ผู้ส่งออกขอ — products + lots จาก SupplierRequestSpec */ },
  "state": { /* SupplierState — ดูหัวข้อ 4 */ }
}
```

ถ้ายังไม่เคยมีใครกรอก ให้คืน `state` เป็นก้อนเปล่าตาม `emptyState()` — อย่าคืน `null`
ฝั่ง client จะได้ไม่ต้องแยกเคส

**ห้ามใส่** ข้อมูลของซัพพลายเออร์รายอื่น ราคา หรืออะไรที่เกินกว่าคำขอนี้ลงไปใน response
คนที่ถือลิงก์ไม่ใช่ลูกค้าเรา

### `PUT /api/v1/links/{token}/state` — ไม่ต้อง auth

ซัพพลายเออร์กดเซฟระหว่างกรอก รับ `{ "state": SupplierState }` เขียนทับทั้งก้อน คืนก้อนที่บันทึกแล้ว

- ถ้า `state.status` เป็น `submitted` อยู่แล้วและไม่ได้อยู่ในรอบแก้ไข → ปฏิเสธด้วย `ALREADY_SUBMITTED`
- server เป็นคนเซ็ต `updatedAt` เอง อย่าเชื่อค่าที่ client ส่งมา

### `POST /api/v1/links/{token}/submit` — ไม่ต้อง auth

```jsonc
{ "state": { … }, "attestation": { "name": "…", "role": "…" }, "check": { … } }
```

**server เป็นคนทำสามอย่างนี้ ไม่ใช่ client:**

1. เซ็ต `status = "submitted"`
2. append เข้า `versions[]` พร้อมเลขเวอร์ชันถัดไปและเวลาที่ server เห็น
3. append เข้า `events[]` ว่า submit แล้ว

เหตุผล: ถ้าให้ client เขียนเอง ซัพพลายเออร์แก้เวลาหรือเลขเวอร์ชันได้ ซึ่งเป็นสิ่งที่
ผู้ตรวจสอบจะดู

### `POST /api/v1/declarations/{id}/links/{token}/revision` 🔒

ผู้ส่งออกขอให้แก้ รับ `{ "note": "…", "unlocked": ["…"], "unlockedDocs": ["…"] }`
→ server เซ็ต `status = "revision_requested"` แล้วเขียนสามฟิลด์นั้นลง state

**✅ backend ทำแล้ว (2026-09-04)** — `app/routers/links.py::request_revision`
คืน `SupplierState` ทั้งก้อน (เหมือน submit/save) และ append event `revision_requested`

### `GET /api/v1/declarations/{id}/submissions` 🔒

หน้าจอฝั่งผู้ส่งออกใช้อันนี้ดูว่าใครส่งแล้วบ้าง — ต้องเบา เรียกบ่อย

```jsonc
{ "submissions": [
  { "supplierId": "d1", "token": "kJ8…", "status": "submitted",
    "version": 2, "score": 92, "updatedAt": 1772000000000 }
] }
```

---

## 4 · `SupplierState`

**ไม่ต้องเขียน type ใหม่** — ใช้ของเดิมที่ `certrace-portal/lib/supplier-store.ts:81`
backend เก็บเป็น `jsonb` ทั้งก้อน โดยแยกออกมาเป็นคอลัมน์แค่ที่ต้อง query:
`token`, `status`, `updated_at`

ฟิลด์ข้างในก้อน (ย่อ — ดูของจริงในไฟล์):

```ts
{
  token, status, values, docs, seats, profile, profileSaved,
  versions, lastCheck, events, unlocked, unlockedDocs,
  revisionNote, carried, attestation, updatedAt
}
```

**อัปเดต 10 ก.ย. — ข้อจำกัดนี้ปิดไปแล้ว ดู §7**

เดิม `docs[].files[].dataUrl` เป็น base64 ของไฟล์ ถ้าใหญ่เกิน ~1.5 MB พอร์ทัลเก็บแค่ชื่อกับขนาด
ตอนนี้ไฟล์ขึ้นเซิร์ฟเวอร์แล้ว และใน state เหลือแค่ `docs[].files[].fileId` อ้างถึงมัน

| ฟิลด์ | เมื่อไหร่ที่ใช้ |
| :-- | :-- |
| `fileId` | มี backend — ไฟล์อยู่บนเซิร์ฟเวอร์ ใหญ่ได้ถึงลิมิตที่ประกาศไว้ |
| `dataUrl` | demo mode ที่ไม่มีเซิร์ฟเวอร์ให้เก็บ ยังตันที่ ~1.5 MB เหมือนเดิม |
| ไม่มีทั้งคู่ | ไฟล์ที่แนบไว้ตั้งแต่ก่อนมีท่อนี้ เหลือแค่ชื่อ |

ทั้งสามแบบต้องอ่านได้หมด — ของเก่าที่บันทึกไว้แล้วต้องไม่พังเพราะรูปแบบใหม่

**body size limit ยังต้องรับได้อย่างน้อย 8 MB** เพราะ state ที่มี `dataUrl` เก่าปนอยู่ยังเซฟผ่าน endpoint เดิม

---

## 5 · ลำดับความสำคัญ

ถ้าเวลาไม่พอ ให้ทำตามลำดับนี้ อย่าไล่ทำตามหัวข้อในเอกสาร

| ลำดับ | Endpoint | ฝั่ง wiring รอใช้วันที่ |
| :-- | :-- | :-- |
| **P0** | `login` · `register` · `me` | วันที่ 2 |
| **P0** | `GET/POST/PUT /declarations` | วันที่ 3 |
| **P0** | `GET /links/{token}` | วันที่ 4 |
| **P0** | `PUT /links/{token}/state` · `POST …/submit` | วันที่ 5 |
| **P1** | `POST /declarations/{id}/links` | วันที่ 5 |
| **P1** | `GET /declarations/{id}/submissions` | วันที่ 5 |
| **P2** | `revision` · `DELETE /declarations/{id}` | วันที่ 6 |

ระหว่างที่ P0 ยังไม่ขึ้น ฝั่ง wiring จะเขียน client layer ยิงไปที่ path เหล่านี้
โดยมี mock ไว้ก่อน พอ endpoint จริงขึ้นก็แค่สลับ base URL — เพราะฉะนั้น
**ชื่อ path และชื่อฟิลด์ห้ามเปลี่ยนโดยไม่บอก** ถ้าจะเปลี่ยนให้แก้ในไฟล์นี้ก่อน

---

## 6 · อะไรที่ยังไม่อยู่ในรอบนี้

เขียนไว้กันเข้าใจผิดว่าลืม — ทั้งหมดนี้ตั้งใจเลื่อนออกไปหลังวันที่ 6

- RBAC ฝั่งเซิร์ฟเวอร์ (ตอนนี้แค่ "เป็นเจ้าของหรือไม่เป็น")
- Team members / seats เป็น API แยก (ยังอยู่ในก้อน state)
- Antivirus scan ของไฟล์ที่อัปโหลด (ตัว upload pipeline เองทำแล้ว — §7)
- Plan / billing ฝั่งเซิร์ฟเวอร์ — ทำให้อีเมลเตือน trial ยังส่งไม่ได้ (§8)
- Audit trail แบบ hash-chain
- Rate limiting บน `/links/{token}`
- Google OAuth

---

## 7 · Evidence files (ทำแล้ว 10 ก.ย.)

ไฟล์ขึ้นไปทั้งก้อนเป็น **raw body** ไม่ใช่ JSON และไม่ใช่ multipart — ชื่อไฟล์อยู่ใน query string
ชนิดไฟล์อยู่ใน `Content-Type` ซึ่งเป็นสองอย่างที่เบราว์เซอร์รู้อยู่แล้วจากตัว `File`

| Method | Path | ใคร |
| :-- | :-- | :-- |
| `GET` | `/api/v1/uploads/limits` | ใครก็ได้ ไม่ต้องล็อกอิน |
| `POST` | `/api/v1/declarations/{id}/files?filename=&docId=` | ผู้ส่งออก (Bearer) |
| `GET` | `/api/v1/declarations/{id}/files` | ผู้ส่งออก |
| `GET` · `DELETE` | `/api/v1/files/{fileId}` | ผู้ส่งออก |
| `POST` | `/api/v1/links/{token}/files?filename=&docId=` | ซัพพลายเออร์ (token เท่านั้น) |
| `GET` | `/api/v1/links/{token}/files` | ซัพพลายเออร์ |
| `GET` | `/api/v1/links/{token}/files/{fileId}` | ซัพพลายเออร์ |

**สิ่งที่เซิร์ฟเวอร์ปฏิเสธ** (ทุกอันตอบ 422 พร้อม `code`)

| code | เมื่อไหร่ |
| :-- | :-- |
| `FILE_TOO_LARGE` | เกินลิมิต (ค่าเริ่มต้น 15 MB ตั้งได้ที่ `CERTRACE_MAX_UPLOAD_BYTES`) |
| `FILE_EMPTY` | body ว่าง |
| `FILE_TYPE_NOT_ALLOWED` | ไม่ใช่ pdf / png / jpeg / csv / xlsx |
| `FILE_CONTENT_MISMATCH` | ประกาศชนิดมาอย่าง แต่ magic bytes เป็นอีกอย่าง |

**กติกาที่ต้องไม่พลาด**

- token ของ smart link **ไม่ใช่บัญชี** — ผู้ถือ token อ่านได้เฉพาะไฟล์ที่ตัวเองอัปผ่าน link นั้น ไม่ใช่ทั้ง declaration
- ไฟล์ของคนอื่นตอบ **404 ไม่ใช่ 403** — 403 เท่ากับยืนยันว่า id นั้นมีจริง
- ดาวน์โหลดเสิร์ฟเป็น `attachment` เสมอ ไม่เคย inline — เอกสารของคนอื่นต้องไม่ได้ render ใน origin ของเรา
- `sha256` คำนวณฝั่งเซิร์ฟเวอร์ ไม่ใช่ในเบราว์เซอร์ (ของเดิมพิสูจน์ได้แค่ว่าเบราว์เซอร์เลือกจะบอกอะไร)
- revoke link แล้ว **ไฟล์ไม่หาย** — ซัพพลายเออร์ทำงานไปแล้ว FK เป็น `SET NULL` ไม่ใช่ `CASCADE`

**ที่เก็บจริงตอนนี้เป็น PostgreSQL ไม่ใช่ bucket** — ตั้งใจ และมี `ObjectStore` คั่นไว้แล้วให้ย้ายไป bucket ได้โดยไม่ต้องแก้ route
เหตุผลกับราคาที่ต้องจ่ายเขียนไว้ครบใน [`app/services/file_store.py`](../certrace-backend/app/services/file_store.py)

---

## 8 · Reminder subjects (ทำแล้ว 10 ก.ย.)

job เตือนซัพพลายเออร์เคยต่อกับ `NullSource` แล้วส่งอะไรไม่ได้เลย เพราะทุกอย่างที่ต้องใช้เขียนอีเมลอยู่ใน localStorage ของเบราว์เซอร์ — **สามที่ด้วยกัน** คือ workspace (เดือนกับกำหนดส่ง), supplier-companies (อีเมลที่จะส่งไปหา) และ month-dispatch (ส่งไปหรือยัง)

รอบนี้**ยังไม่ย้ายทั้งกอง** (นั่นคือ D2 ที่ยังเปิดอยู่) แต่ให้พอร์ทัล**ลงทะเบียนสิ่งเดียวที่ job ต้องใช้**ตอนกดส่ง

| Method | Path | ทำอะไร |
| :-- | :-- | :-- |
| `GET` | `/api/v1/reminder-subjects` | รายการทั้งหมดของบัญชีนี้ ทั้งที่ยังเปิดและปิดแล้ว |
| `PUT` | `/api/v1/reminder-subjects/{key}` | ลงทะเบียน/แก้ไขคำขอ (upsert บน key) |
| `POST` | `/api/v1/reminder-subjects/{key}/sent` | **ส่งจริงแล้ว** — ครั้งแรกเริ่มจับเวลา ครั้งต่อไปนับเป็นการตาม |
| `POST` | `/api/v1/reminder-subjects/{key}/answered` | ตอบแล้ว หยุดตาม |
| `DELETE` | `/api/v1/reminder-subjects/{key}` | ถอนคำขอ หยุดตาม |

ทุก endpoint ต้องมี Bearer — ไม่มีฝั่งซัพพลายเออร์โดยตั้งใจ คนที่ถูกตามไม่ควรมีปุ่มหยุดการตามตัวเอง

**กติกาที่ต้องไม่พลาด**

- **ลงทะเบียน ≠ ส่ง** คำขอที่ร่างไว้แต่ยังไม่ได้ส่ง **ต้องไม่ถูกตาม** — ซัพพลายเออร์ยังไม่เคยได้ยินจากใคร `sent_at` จึงเป็น endpoint แยก และ job ไม่อ่านแถวที่ยังไม่มีค่านี้
- `periodLabel` ส่งไปเป็น **"March 2026"** ไม่ใช่วันที่ เพราะ job ไม่รู้ภาษาของผู้รับดีพอจะจัดรูปแบบวันที่เอง ส่วน `linkUrl` ต้องเป็น URL เต็ม ด้วยเหตุผลเดียวกัน
- `subjectKey` เป็น id ของพอร์ทัลเอง (`w:<workspaceId>:<month>`) และเป็น**คีย์ของ delivery log ฝั่งเซิร์ฟเวอร์** ถ้ามันเปลี่ยนทุกคืน ทุกขั้นของบันไดจะดูเหมือนยังไม่เคยส่งแล้วส่งซ้ำทั้งชุด
- **ไม่มีการลบ** `answeredAt` / `cancelledAt` เป็นตราประทับ เพราะ "ตามสี่ครั้งกว่าจะตอบ" คือประวัติที่บอกว่าซัพพลายเออร์รายนี้ควรใช้ต่อไหม
- **ไม่มี in-memory fallback** ต่างจาก declarations/links ที่เบราว์เซอร์เดิมอ่านกลับเองได้ — reminder ถูกอ่านโดย job คนละ process วันรุ่งขึ้น ถ้าเก็บใน memory มันจะรับลงทะเบียนทุกอันแล้วไม่ตามใครเลย ซึ่งคือความล้มเหลวที่ข้อนี้มีไว้แก้ ดังนั้นไม่มี DB = ตอบ **503 `REMINDERS_UNAVAILABLE`**

**อีเมลเตือน trial ยังว่างอยู่** ไม่ใช่ลืม — plan/billing ยังไม่ถูก modelling ฝั่งเซิร์ฟเวอร์เลย ถ้าเดาวันหมดอายุขึ้นมาเองจะกลายเป็นส่งอีเมลเรื่องที่ระบบไม่ได้บังคับใช้จริง
