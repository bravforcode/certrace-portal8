# EU CBAM — แหล่งข้อมูลทางการ (ข้อมูล ณ 14 พ.ย. 2026)

อ่านไฟล์นี้ก่อนค้นข้อมูล EU CBAM ใหม่ ในนี้มีรายการเอกสารทางการทั้งหมดที่เก็บไว้ บอกว่าอะไรเป็นฉบับล่าสุด อะไรตัดทิ้งไปเพราะอะไร และถ้าจะอัปเดตต้องทำอย่างไร

## ชุดไฟล์อยู่ที่ไหน

- โฟลเดอร์ `EU_CBAM_files_2026-11-14/` และไฟล์ `.zip` ขนาด 119 MB มีทั้งหมด 88 ไฟล์
- อยู่ที่ `C:\Certrace\EU_CBAM_files_2026-11-14\` และ `C:\Certrace\EU_CBAM_files_2026-11-14.zip` (นอก repo เพราะไฟล์ใหญ่)
- `INDEX.csv` ในโฟลเดอร์นั้นมีข้อมูลทุกไฟล์: title, วันที่หรือ CELEX, ขนาด, ผลตรวจ magic bytes, SHA-256 และ URL ต้นทาง
- `INDEX.md` สรุปโฟลเดอร์ รายการที่ตัดทิ้ง และรายการที่หาไม่ได้

## สถานะเวลา (ข้อเท็จจริงที่ยืนยันแล้ว)

- ช่วง definitive เริ่ม 1 ม.ค. 2026 ส่วนช่วง transitional (2023–2025) จบแล้ว เอกสารของช่วงนั้นอยู่ในหน้า archive และตัดทิ้งไป
- ราคา CBAM certificate ปี 2026 ประกาศเป็นรายไตรมาส: Q1 €75.36, Q2 €75.28, Q3 €82.32 ส่วน Q4 จะประกาศ 4 ม.ค. 2027
  - ที่มา: https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/price-cbam-certificates_en
- กฎหมายหลักคือ Reg (EU) 2023/956 ฉบับ consolidated ล่าสุดคือ 02023R0956-20251020 ซึ่งรวม Omnibus 2025/2083 ไว้แล้ว
- ข้อเสนอที่ยังไม่ผ่าน:
  - COM(2025)989 ขยายไปสินค้า downstream และ anti-circumvention อยู่ในขั้น trilogue
  - COM(2025)990 ใช้ฉบับ corrigendum R(01) ลงวันที่ 16 มี.ค. 2026
- CJEU คดี C-512/23 (Poland v EP and Council) มีคำสั่งเมื่อ 12 พ.ย. 2026

## เอกสารแยกตามโฟลเดอร์

| โฟลเดอร์ | เอกสารหลัก (ฉบับ/วันที่) |
|---|---|
| 01_Legislation_and_guidance | Guidance No.1–4 และ 5a–5f แยกตาม sector: cement, hydrogen, fertilisers, iron & steel, aluminium, electricity (14 ส.ค. 2026); guidance สำหรับ verifier/NAB (24 ส.ค. 2026); guidance นำเข้าไฟฟ้าและก๊าซภายใต้ CCI (6 พ.ย. 2026); Default values xlsx (10 ส.ค. 2026); Benchmarks xlsx (13 ก.พ. 2026); synopsis reports; guidance สำหรับ importer (30 พ.ค. 2024) |
| 02_Sectors | Factsheet สำหรับ importer (2023–24) และ non-EU producer (31 ต.ค. 2024) แยกตาม sector |
| 03_Registry_and_reporting | User manual ของ CBAM Registry: Declarants portal (21 ส.ค. 2026) และ Verifiers/Operators portal (27 ส.ค. 2026); คู่มือ O3CI (ก.พ.–มิ.ย. 2026); access request; privacy statement |
| 04_Verification | สถานะ CBAM accreditation (13 พ.ย. 2026) |
| 05_Definitive_regime | รายชื่อ NCA (26 มิ.ย. 2026); CBAM กับประเทศกำลังพัฒนา; ราคา certificate ปี 2026 (CSV) |
| 06_Communication_and_FAQs | Q&A (15 ต.ค. 2026); Q&A Art 27a (8 ม.ค. 2026); Q&A ไฟฟ้า (25 มี.ค. 2026); actual vs default values (23 มิ.ย. 2026); How CBAM certificates work (30 ก.ย. 2026); communication template และตัวอย่าง; webinar one-pager และ slides; Quick Guide |
| 07_EU_Law/A ฉบับ consolidated | 2023/956 (20 ต.ค. 2025); 2023/1773 transitional (31 ต.ค. 2024); 2024/3210 registry (1 ม.ค. 2026); 2025/486 authorised declarant (25 ธ.ค. 2025); 2025/2621 default values (1 ม.ค. 2026) |
| 07_EU_Law/B ยังไม่มีฉบับ consolidated | 2025/2083 Omnibus; 2025/2210; 2546 verification; 2547 วิธีคำนวณ embedded emissions; 2548; 2551 accreditation; 2619; 2620 benchmarks; 2026/1740 แก้ default values |
| 07_EU_Law/D เอกสารทางการอื่น | Council Decision 2026/2240 และ 2026/2256 (EEA); Joint Procurement Agreement ของ Common Central Platform; EP non-objection; รายชื่อ NCA ใน OJ C (31 ก.ค. 2026); คำสั่ง CJEU C-512/23 |
| 08_Review_and_pending_proposals | COM(2025)783 รายงานการบังคับใช้; COM(2025)989; COM(2025)990 R(01); SWD 987/988/989 (impact assessment) |
| 10_European_Parliament | EPRS briefing 2026 เรื่อง CBAM review (EPRS_BRI(2026)789314) |

## ที่ตัดทิ้ง (มีฉบับใหม่แทนแล้ว)

### CN catalogue จากชุดเอกสาร

- ไฟล์ `CBAM Benchmarks_20260206.xlsx` มี CN 8 หลัก 570 รหัส และ Annex I ของ Regulation 2023/956 ฉบับ consolidated เพิ่มไฟฟ้า `2716 00 00` เป็น 571 รหัสใน catalogue ไฟฟ้าใช้ MWh และไม่มี benchmark สำหรับ free allocation ตาม 2025/2620 recital 11
- Communication template ฉบับปี 2024 ยังมี `3102 10 10` แต่ตาราง benchmark และ default values ในชุดปัจจุบันใช้ `3102 10 12`, `3102 10 15`, `3102 10 19` แทน จึงไม่เพิ่มรหัสเก่ากลับเข้า catalogue โดยเก็บทั้งสามรหัสย่อยไว้
- รายการข้อยกเว้นใน Annex I ไม่ใช่สินค้าในขอบเขต เช่น `3105 60 00` และ ferro-alloy ที่ระบุหลัง Except; 2026/1740 recital 11 ระบุว่า `7615 10 10`, `7615 10 30`, `7615 10 80`, `7615 20 00` เป็นรหัสที่พิมพ์ผิดในตาราง Tunisia และต้องแก้ไข ไม่ใช่สินค้าใหม่ ข้อเสนอ downstream ใน COM(2025)989 ยังไม่ใช่กฎหมายที่มีผลใช้

- เอกสารในหน้า archive ของช่วง transitional
- Act แก้ไขที่รวมเข้าฉบับ consolidated แล้ว: 2024/2649, 2025/2549, 2025/2550
- รายชื่อ NCA ฉบับ 5 ม.ค. 2026 ถูกแทนด้วยฉบับ 26 มิ.ย. 2026
- COM(2025)990 ฉบับแรก ถูกแทนด้วย R(01)
- COM(2026)335 และ 402 ผ่านเป็น Council Decision 2026/2240 และ 2026/2256 แล้ว
- ประวัติร่างกฎหมายก่อนผ่าน: proposal ปี 2021, ความเห็นของ EP/EESC/CoR, COM(2025)87 (ผ่านเป็น 2025/2083 แล้ว)
- ฉบับแปลภาษาอื่น เก็บเฉพาะภาษาอังกฤษ

**ค่า default ใน portal ยังต้องปรับก่อนใช้อ้างอิง 2026/1740:** ปรับรายการที่ตรวจพบ ได้แก่ Angola `2601 12 00`, Other countries `7226 20 00` และ Annex IV `7616 99 10` / `7616 99 90` แล้ว แต่ยังต้องตรวจ default values และ route indicators ที่เหลืออีกหลายรายการ กฎหมายแก้ไขลบคอลัมน์ค่าที่บวก markup แล้วและให้คำนวณจาก total ใน registry จึงห้ามถือว่าข้อมูล default ใน portal ผ่านการปรับครบแล้ว

## ที่ยังหาไม่ได้ (ต้องเช็คเองถ้าต้องใช้)

- 2025/2547 ฉบับ consolidated (02025R2547-20251222): Cellar ยังไม่มีภาษาอังกฤษ จึงเก็บฉบับเดิมไว้แทน
- Corrigenda ที่ Cellar ไม่มีภาษาอังกฤษ ต้องเช็คบน EUR-Lex:
  - 32025R2083R(01)
  - 32023R1773R(02)
  - 32025R2547R(01) และ R(02)
  - 32025R2621R(01)
- ร่างใน Have Your Say และ XSD ของ CBAM Registry ต้องใช้ EU Login

## วิธีอัปเดตรอบหน้า

1. เริ่มที่ https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en แล้วไล่ทุกหน้าย่อย
   - ไฟล์อยู่ใน block `ecl-file` ลิงก์เป็นรูปแบบ `/document/download/<uuid>_en?filename=...` และหน้าเว็บระบุวันที่กับขนาดไว้ให้
2. เช็คหน้าข่าวของ CBAM ด้วย เพราะ guidance ใหม่มักประกาศในข่าวก่อน ตัวอย่างเช่น guidance CCI ที่ออก 6 พ.ย. 2026
3. ดึงกฎหมาย EU จาก Cellar ของ Publications Office ผ่าน SPARQL ใช้ CELEX หา consolidated version ล่าสุด
   - EUR-Lex มีปัญหา TLS hostname mismatch ห้ามใช้ skipTlsVerification
4. แหล่งนอกเว็บหลัก:
   - EPRS (europarl.europa.eu/RegData) ต้องส่ง header แบบ browser และ Referer ไม่อย่างนั้นได้ 403
   - customs-taxation.learning.europa.eu (webinar) ใช้ curl ได้ แต่ Python urllib จะเจอ SSL error
5. taxation-customs.ec.europa.eu จำกัด rate (429) ต้องเว้นช่วงและ retry
6. ไฟล์ที่ดาวน์โหลดมาถือว่าไม่น่าเชื่อถือ แยกโฟลเดอร์ไว้ และรัน Python ด้วย `-I`
7. ตรวจทุกไฟล์:
   - magic bytes: PDF ต้องขึ้นต้น `%PDF`, xlsx/pptx/zip ต้องขึ้นต้น `PK`
   - ขนาดต้องตรงกับที่เว็บระบุ คลาดได้ไม่เกิน 2% ยกเว้น factsheet HTML ที่โครงหน้าเปลี่ยนทุกครั้งที่โหลด
   - เก็บ SHA-256 แล้วเทียบกับ INDEX.csv เดิม เพื่อดูว่าไฟล์ไหนเปลี่ยน

## สิ่งที่ต้องติดตาม

- ราคา certificate Q4 2026 จะประกาศ 4 ม.ค. 2027
- COM(2025)989 จะผ่านหรือไม่หลัง trilogue
- 2025/2547 ฉบับ consolidated ภาษาอังกฤษ และ corrigenda ที่ยังหาไม่ได้
- Guidance No.1–5f ฉบับใหม่กว่า 14 ส.ค. 2026
