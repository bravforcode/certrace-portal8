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
`INVALID_CREDENTIALS` · `EMAIL_TAKEN` · `TOKEN_NOT_FOUND` · `TOKEN_EXPIRED` ·
`TOKEN_REVOKED` · `ALREADY_SUBMITTED` · `DECLARATION_NOT_FOUND`

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

### ของเดิมที่มีอยู่แล้ว

`change-password` · `forgot-password` · `reset-password` ใช้ต่อได้
**แต่ต้องแก้ก่อน:** `forgot-password` ห้ามคืน `resetToken` กลับมาใน response
ให้ส่งทางอีเมลแทน และคืนแค่ข้อความกลางๆ เสมอไม่ว่าอีเมลนั้นจะมีอยู่จริงหรือไม่

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

**ข้อจำกัดที่ยอมรับในรอบนี้:** `docs[].files[].dataUrl` เป็น base64 ของไฟล์
ถ้าไฟล์ใหญ่เกิน ~1.5 MB พอร์ทัลจะเก็บแค่ชื่อกับขนาด รอบนี้ยังไม่ทำ upload pipeline
จริง แต่ **backend ต้องตั้ง body size limit ให้รับได้อย่างน้อย 8 MB**
ไม่งั้นการเซฟจะพังตอนมีไฟล์แนบหลายอัน

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
- Upload pipeline จริงและ antivirus scan
- Audit trail แบบ hash-chain
- Rate limiting บน `/links/{token}`
- Google OAuth
