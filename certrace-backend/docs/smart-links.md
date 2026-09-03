# Smart Links API — คู่มือสำหรับคนเรียกใช้

> **Postman**: import `certrace-smart-links.postman_collection.json` (โฟลเดอร์นี้)
> แล้วยิงตามลำดับ 1→6 ได้เลย — jwt กับ token ถูกเก็บเข้า variable ให้อัตโนมัติ

## Smart Link คืออะไร

ลิงก์ที่ผู้ส่งออก (exporter) ส่งให้ซัพพลายเออร์มากรอกข้อมูล carbon
**ซัพพลายเออร์ไม่มีบัญชี** — token ในลิงก์คือสิทธิ์การเข้าถึงทั้งหมด

Flow:

```
exporter (มีบัญชี, login แล้ว)
  │  POST /api/v1/declarations/{id}/links   ← ออก token
  ▼
ได้ url เช่น https://app.certrace.co/s/kJ8…  → ส่งให้ซัพพลายเออร์ (อีเมล ฯลฯ)
  │
ซัพพลายเออร์เปิดลิงก์ → พอร์ทัลหน้า /s/[token]
  │  GET /api/v1/links/{token}              ← resolve token เป็นข้อมูล (ไม่ต้อง auth)
  ▼
ได้คำขอของตัวเอง + state ที่เคยกรอกค้างไว้ → กรอกต่อ
```

คุณสมบัติของ token:

- สุ่ม 32 bytes ฝั่ง server (base64url ~43 ตัวอักษร) — เดาไม่ได้ ไม่ได้ derive จาก id ใดๆ
- **มีอายุ** ค่าเริ่มต้น 60 วัน กำหนดเองได้ตอนออก (1–365 วัน)
- เพิกถอนได้ฝั่ง server (เก็บ `revoked_at` แล้ว แต่รอบนี้ยังไม่มี endpoint ให้กด revoke)
- หนึ่ง token = หนึ่ง (declaration, supplier, เดือน) — งานรายเดือนออกเดือนละ token

---

## 1 · ออก token — `POST /api/v1/declarations/{id}/links` 🔒

ต้องแนบ `Authorization: Bearer <jwt>` และ `{id}` ต้องเป็น declaration ของบัญชีที่ login อยู่

### Request

```jsonc
{
  "supplierId": "d1",        // จำเป็น — id ของซัพพลายเออร์ในเอกสาร declaration
  "month": "2026-03",        // ไม่บังคับ — รูปแบบ YYYY-MM เท่านั้น
  "expiresInDays": 60        // ไม่บังคับ — 1 ถึง 365, ไม่ส่ง = 60
}
```

### Response `201`

```jsonc
{
  "token": "kJ8f3…",                              // เก็บไว้ถ้าจะ track สถานะ
  "url": "https://app.certrace.co/s/kJ8f3…",      // ส่งอันนี้ให้ซัพพลายเออร์
  "expiresAt": 1772000000000                       // epoch milliseconds
}
```

โดเมนใน `url` มาจาก env `CERTRACE_APP_BASE_URL` ของ backend
(ไม่ตั้ง = `https://app.certrace.co`, dev ตั้งเป็น `http://localhost:3000`)

### Errors

| Status | `detail.code` | เมื่อไหร่ |
| :-- | :-- | :-- |
| 401 | `INVALID_CREDENTIALS` | ไม่มี/หมดอายุ bearer token |
| 404 | `DECLARATION_NOT_FOUND` | declaration ไม่มีอยู่ **หรือ** ไม่ใช่ของบัญชีนี้ (ตอบเหมือนกันโดยตั้งใจ) |
| 422 | — (รูปแบบ validation ของ FastAPI) | `supplierId` ว่าง, `month` ผิดรูปแบบ, `expiresInDays` นอกช่วง 1–365 |

### ตัวอย่าง curl

```bash
curl -X POST http://localhost:8000/api/v1/declarations/decl-abc123/links \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"supplierId": "d1", "month": "2026-03"}'
```

ออกซ้ำได้เรื่อยๆ — token เก่าที่ยังไม่หมดอายุ **ยังใช้ได้อยู่** การออกใบใหม่ไม่ได้ฆ่าใบเก่า

---

## 2 · ดึง token ที่เคยออก — `GET /api/v1/declarations/{id}/links` 🔒

Response ตอน mint หายไปแล้ว? เส้นนี้คืนลิงก์ทุกใบของ declaration นั้น เรียงใหม่สุดก่อน
เอา `token`/`url` ไป copy ส่งซ้ำ หรือเอา token ไปยิง resolve (ข้อ 3) ต่อได้เลย

### Response `200`

```jsonc
{
  "links": [
    {
      "token": "kJ8f3…",
      "url": "https://app.certrace.co/s/kJ8f3…",
      "supplierId": "d1",
      "month": "2026-03",              // null ถ้าตอนออกไม่ได้ระบุ
      "expiresAt": 1772000000000,
      "revokedAt": null,               // ไม่ null = ใบนี้ถูกเพิกถอนแล้ว
      "createdAt": 1770000000000
    }
  ]
}
```

- ใบที่หมดอายุ/ถูกเพิกถอนก็ยังโผล่ในรายการ (ดู `expiresAt`/`revokedAt` เอง) —
  รายการนี้คือประวัติ ไม่ใช่เฉพาะใบที่ยังใช้ได้
- **ไม่มี** `state` ของซัพพลายเออร์ในนี้ — เส้นนี้เบา ไว้ดู token ไม่ใช่ดูคำตอบ

### Errors

เหมือนตอน mint: 401 `INVALID_CREDENTIALS` · 404 `DECLARATION_NOT_FOUND`

### ตัวอย่าง curl

```bash
curl http://localhost:8000/api/v1/declarations/decl-abc123/links \
  -H "Authorization: Bearer $JWT"
```

---

## 3 · Resolve token — `GET /api/v1/links/{token}` (ไม่ต้อง auth)

Endpoint สาธารณะตัวเดียวของระบบ — ซัพพลายเออร์ไม่มีบัญชี token คือ credential

### Response `200`

```jsonc
{
  "token": "kJ8f3…",
  "declId": "decl-abc123",
  "supplierId": "d1",
  "month": "2026-03",                 // null ถ้าตอนออกไม่ได้ระบุ
  "expiresAt": 1772000000000,         // epoch ms — พอร์ทัลเอาไปโชว์ countdown ได้
  "exporter": {
    "companyName": "Siam Steel Export Co."   // "" ถ้าบัญชีผู้ส่งออกไม่ได้กรอกชื่อบริษัท
  },
  "request": {
    // เฉพาะ slice ของซัพพลายเออร์คนนี้ จาก requests[] ใน declaration
    // รูปเดียวกับ SupplierRequestSpec.products (certrace-portal/lib/data.ts)
    "products": [
      {
        "productId": "hrc",
        "lots": [
          { "qty": 200, "unit": "tonnes (t)", "from": "2026-04-01", "to": "2026-05-31", "notes": "" }
        ]
      }
    ]
  },
  "state": { /* SupplierState — ดูด้านล่าง */ }
}
```

สิ่งที่การันตี:

- `state` **ไม่มีวันเป็น `null`** — ถ้ายังไม่มีใครกรอก จะได้ก้อนเปล่ารูปเดียวกับ
  `emptyState()` ใน `certrace-portal/lib/supplier-store.ts` (`status: "new"`,
  `values: {}`, `versions: []`, …) client ไม่ต้องแยกเคส
- `request.products` เป็น array เสมอ — ซัพพลายเออร์ที่ไม่มี spec ในเอกสารได้ `[]`
- response **ไม่มี** ข้อมูลซัพพลายเออร์รายอื่น ราคา หรือเอกสาร declaration ทั้งก้อน

### Errors

| Status | `detail.code` | เมื่อไหร่ | พอร์ทัลควรโชว์ |
| :-- | :-- | :-- | :-- |
| 404 | `TOKEN_NOT_FOUND` | token ไม่เคยออก หรือ declaration ต้นทางถูกลบไปแล้ว | "ลิงก์ไม่ถูกต้อง" |
| 410 | `TOKEN_EXPIRED` | เลย `expiresAt` แล้ว | "ลิงก์หมดอายุ ติดต่อผู้ส่งออกเพื่อขอลิงก์ใหม่" |
| 410 | `TOKEN_REVOKED` | ถูกเพิกถอน | "ลิงก์ถูกยกเลิก" |

### ตัวอย่าง curl

```bash
curl http://localhost:8000/api/v1/links/kJ8f3…
```

---

## รูปแบบ error กลาง

ทุก error ตอบ body หน้าตาเดียวกันทั้ง API:

```json
{ "detail": { "code": "TOKEN_EXPIRED", "message": "This link has expired." } }
```

branch ด้วย `detail.code` เท่านั้น — `message` เป็นภาษาอังกฤษและเปลี่ยนได้

## หมายเหตุเวลา

timestamp ทุกตัวเป็น **epoch milliseconds** (number) ตาม convention ของพอร์ทัล
ไม่มี ISO string

## ลองในเครื่อง (ไม่ต้องมี database)

Backend รันโหมด in-memory ได้เลย:

```bash
cd certrace-backend
uvicorn main:app --reload
# register → ได้ jwt → POST declaration → POST links → GET links/{token}
```

ข้อมูลหายเมื่อ restart process — โหมดนี้มีไว้ demo/test เท่านั้น

## ที่ยังไม่มีในรอบนี้ (ตาม contract §3, §6)

- `PUT /api/v1/links/{token}/state` (ซัพพลายเออร์เซฟระหว่างกรอก) — งานถัดไป
- `POST /api/v1/links/{token}/submit` — งานถัดไป
- endpoint เพิกถอน token (schema รองรับแล้ว แต่ contract ยังไม่นิยาม endpoint)
- rate limiting บน `/links/{token}` — เลื่อนหลังวันที่ 6 โดยตั้งใจ
