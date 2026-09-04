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
  // ── context ของ declaration ที่พอร์ทัลใช้ "สร้างฟอร์ม" (ไม่ใช่ความลับ) ──
  // ซัพพลายเออร์ไม่มีสำเนา declaration และดึงเองไม่ได้ (endpoint นั้น authed)
  // slice นี้คือทุกอย่างที่ certrace-portal/lib/supplier.ts::buildFromPayload
  // ต้องใช้ประกอบ CBAM checklist + เอกสาร + งวด/เดดไลน์ จาก config ในเครื่อง
  "declaration": {
    "name": "CBAM Q2 2026",
    "regulation": "cbam",             // regulation id
    "origin": "TH",                   // jurisdiction code
    "market": "EU",                   // destination market code
    "period": "Q2 2026",
    "periodEnd": "2026-06-30",        // "" ถ้าไม่มี bounds
    "due": "31 Aug 2026",             // label เดดไลน์
    "dueInDays": 45,
    "kind": "cbam",                   // "cbam" | "buyer" — คุมการ filter fields
    "includedFieldIds": ["carbon-price"], // null = เอา default set
    "note": "Report at installation level." // notesToSuppliers, "" ถ้าไม่มี
  },
  // ── identity ของซัพพลายเออร์คนนี้เท่านั้น — ไม่มีตัวเลข emissions ────
  "supplier": {
    "name": "Siam Yamato Steel",
    "ref": "#0418",
    "country": "TH",
    "material": "Hot-rolled coil",
    "critical": true,
    "selfSupplied": false
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
  (พอร์ทัล fallback ไปสังเคราะห์จาก `supplier.material`)
- `declaration` + `supplier` เป็น **slice** — พอสร้างฟอร์มได้ แต่:
  response **ไม่มี** row ของซัพพลายเออร์รายอื่น, ตัวเลข emissions ของใคร,
  ราคา หรือเอกสาร declaration ทั้งก้อน

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

## 4 · เซฟระหว่างกรอก — `PUT /api/v1/links/{token}/state` (ไม่ต้อง auth)

Autosave ของซัพพลายเออร์ — ส่ง state ทั้งก้อน last-write-wins เหมือน localStorage เดิม
token คือ credential เส้นนี้ **ไม่แนบ** bearer

### Request

```jsonc
{
  "state": { /* SupplierState ทั้งก้อน — รูปเดียวกับที่ resolve คืน */ }
}
```

### Response `200`

คืน `state` ที่เก็บจริงกลับมา (bare blob ไม่ห่อ) — client เอาไปทับ copy ในเครื่องได้เลย
server เขียนทับให้สองฟิลด์ที่เป็นของ server ไม่ใช่ของ browser:

- `token` — ผูกกับ token ใน path เสมอ (blob จะอ้าง token อื่นไม่ได้)
- `updatedAt` — นาฬิกาฝั่ง server (epoch ms)

ฟิลด์ที่เหลือเก็บตามที่ส่งมา — blob นี้ opaque ฝั่ง server เหมือน declaration document

### Errors

เหมือน resolve (ข้อ 3): 404 `TOKEN_NOT_FOUND` · 410 `TOKEN_EXPIRED` · 410 `TOKEN_REVOKED`

### ตัวอย่าง curl

```bash
curl -X PUT http://localhost:8000/api/v1/links/kJ8f3…/state \
  -H "Content-Type: application/json" \
  -d '{"state": {"status": "draft", "values": {"hrc.qty": "200"}}}'
```

---

## 5 · เซ็นส่ง — `POST /api/v1/links/{token}/submit` (ไม่ต้อง auth)

ซัพพลายเออร์เซ็นและส่งคำตอบสุดท้าย เส้นนี้ก็ **ไม่แนบ** bearer

### Request

```jsonc
{
  "state": { /* SupplierState ทั้งก้อน */ },
  "attestation": {                 // ใครยืนยันตัวเลข — จำเป็น
    "signatoryName": "Niran T.",
    "signatoryRole": "Plant Manager",
    "signedAt": "2026-05-01",
    "statement": "…"               // ข้อความที่ตกลง เก็บ verbatim
  },
  "check": {                       // ผล AI check ที่พอร์ทัลรัน — null ได้
    "score": 88, "warnings": 2, "critical": 0, "passable": true
  }
}
```

### Response `200`

คืน `state` หลังส่ง — **ฟิลด์หลักฐาน server เป็นคน stamp** ไม่เชื่อค่าที่ browser ส่งมา:

- `status` → `"submitted"`
- ต่อ `versions[]` ด้วยเวอร์ชันใหม่: `n` = เวอร์ชันล่าสุด + 1, `submittedAt` = เวลา server,
  `score`/`warnings` จาก `check`, `signedBy`/`signedRole` จาก `attestation`
- เก็บ `attestation` และ `lastCheck` ตามที่ส่งมา · ต่อ event `kind: "submit"` ลง trail
- เคลียร์ `unlocked`/`unlockedDocs`/`revisionNote` (ปิดลูป revision ถ้ามี)

เหตุผลที่ server stamp เอง: verifier อ่านฟิลด์พวกนี้ เลขที่ browser เลือกเองไม่ใช่หลักฐาน

### Errors

เหมือน resolve (ข้อ 3): 404 `TOKEN_NOT_FOUND` · 410 `TOKEN_EXPIRED` · 410 `TOKEN_REVOKED`

### ตัวอย่าง curl

```bash
curl -X POST http://localhost:8000/api/v1/links/kJ8f3…/submit \
  -H "Content-Type: application/json" \
  -d '{"state":{"status":"draft"},"attestation":{"signatoryName":"Niran T.","signatoryRole":"Plant Manager","signedAt":"2026-05-01","statement":"…"},"check":{"score":88,"warnings":2}}'
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

## ที่ยังไม่มีในรอบนี้ (ตาม contract §6)

- `GET /api/v1/declarations/{id}/submissions` (exporter ดูว่าใครส่งแล้ว) — งานถัดไป
- `POST /api/v1/declarations/{id}/links/{token}/revision` (exporter ขอแก้) — งานถัดไป
- endpoint เพิกถอน token (schema รองรับแล้ว แต่ contract ยังไม่นิยาม endpoint)
- rate limiting + size cap บน `/links/{token}/*` — เลื่อนหลังวันที่ 6 โดยตั้งใจ
  (เส้น save/submit เป็น public รับ blob ตรงเข้า DB ยังไม่จำกัดขนาด/อัตรา)
