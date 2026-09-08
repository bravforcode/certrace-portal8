/* ── Thai (ไทย) ────────────────────────────────────────────────
   Keyed by the English source string. See lib/i18n.tsx for the rules; the
   short version: proper nouns, CBAM master data (Annex I goods, CN/HS codes,
   unit symbols) and identifiers stay in English on purpose, because they are
   the legal wording of the filing.

   Grouped by where the copy appears, so a screen's strings stay together and
   a missing one is easy to spot. */

export const TH: Record<string, string> = {
  /* ── Chrome: navigation, topbar, account menu ─────────────── */
  /* Regulatory and product terms carry the English in brackets. A Thai user
     reading "การตรวจสอบรับรอง" on screen is dealing with a verifier, a buyer
     and an EU template that all say "verification" — dropping the English
     makes them translate back at exactly the moment precision matters. Plain
     interface words (Dashboard, Reports, Settings) do not need it. */
  Dashboard: "แดชบอร์ด",
  /* The Inbox became Smart Links — every link the account has issued, not
     only the ones that land back on the exporter. "Smart Link" is the name
     the supplier-facing product uses in both languages, so it stays English
     with the Thai gloss around it. */
  "Smart Links": "ลิงก์อัจฉริยะ (Smart Links)",
  Inbox: "กล่องงานเข้า (Inbox)",
  Suppliers: "ซัพพลายเออร์ (Suppliers)",
  Shipments: "การจัดส่ง (Shipments)",
  /* BOTH CASINGS. The nav renders "Carbon & Cost" and the dictionary only
     held "Carbon & cost", so the one nav item in the portal that is a proper
     noun fell through to English while every item around it was Thai. Keys are
     matched literally — a near-miss is a miss. */
  "Carbon & cost": "คาร์บอนและต้นทุน (Carbon & cost)",
  "Carbon & Cost": "คาร์บอนและต้นทุน (Carbon & Cost)",
  Reports: "รายงาน",
  "Team & seats": "ทีมงานและสิทธิ์ใช้งาน",
  "Plan & billing": "แพ็กเกจและการเรียกเก็บเงิน",
  Settings: "การตั้งค่า",
  "Certrace — dashboard": "Certrace — แดชบอร์ด",
  "Open menu": "เปิดเมนู",
  Notifications: "การแจ้งเตือน",
  "Mark all read": "ทำเครื่องหมายว่าอ่านแล้วทั้งหมด",
  "You're all caught up.": "คุณอ่านครบทุกรายการแล้ว",
  "Profile & account": "โปรไฟล์และบัญชี",
  "Notification settings": "ตั้งค่าการแจ้งเตือน",
  "Guide video": "วิดีโอแนะนำการใช้งาน",
  Language: "ภาษา",
  "Sign out": "ออกจากระบบ",
  "Signing out…": "กำลังออกจากระบบ…",
  "{plan} plan": "แพ็กเกจ {plan}",
  "Seats used. Suppliers are always free.": "สิทธิ์ใช้งานที่ใช้ไป ซัพพลายเออร์ใช้งานฟรีเสมอ",


  /* ── Dashboard, rebuilt on workspaces ─────────────────────── */
  "Everything you have to get verified, worst first. Nothing here rounds up.":
    "ทุกอย่างที่ต้องผ่านการตรวจสอบรับรอง เรียงจากที่มีปัญหามากที่สุดก่อน ตัวเลขทั้งหมดไม่ปัดขึ้น",
  "New workspace": "พื้นที่ทำงานใหม่ (New workspace)",
  "Create the first workspace": "สร้างพื้นที่ทำงานแรก",
  "Nothing to show yet": "ยังไม่มีข้อมูลให้แสดง",
  Workspaces: "พื้นที่ทำงาน (Workspaces)",
  "{count} ready": "พร้อมแล้ว {count} รายการ",
  "Months submitted": "เดือนที่ส่งข้อมูลแล้ว",
  "across every workspace": "รวมทุกพื้นที่ทำงาน",
  Blocked: "ติดขัด (Blocked)",
  "arithmetic that cannot run": "คำนวณไม่ได้",
  "Suppliers, org-wide": "ซัพพลายเออร์ทั้งองค์กร",
  "Where everything stands": "สถานะทั้งหมด",
  "View all": "ดูทั้งหมด",
  "Open inbox": "เปิดกล่องงานเข้า",
  "{count} months are past their due date.": "มี {count} เดือนที่เลยกำหนดส่งแล้ว",
  "{month} is past its due date on {workspace}.": "{month} เลยกำหนดส่งแล้วใน {workspace}",
  "A month that is never entered does not make the year smaller — it makes it incomplete, and a verifier reads it that way.":
    "เดือนที่ไม่ได้กรอกข้อมูลไม่ได้ทำให้ยอดทั้งปีลดลง แต่ทำให้ข้อมูลทั้งปีไม่ครบ และผู้ตรวจสอบจะอ่านแบบนั้น",

  /* ── Carbon & cost ────────────────────────────────────────── */
  "What your carbon costs.": "ต้นทุนคาร์บอนของคุณ",
  "tCO₂e shipped": "tCO₂e ที่ส่งออกแล้ว",
  "tCO₂e per tonne": "tCO₂e ต่อตัน",
  "weighted across everything shipped": "ถ่วงน้ำหนักจากทุกรายการที่ส่งออก",
  "Certificate cost so far": "ต้นทุนใบรับรองจนถึงปัจจุบัน",
  "Projected, full year": "ประมาณการทั้งปี (Projected)",
  "annualised from months in hand": "คำนวณทั้งปีจากเดือนที่มีข้อมูลแล้ว",
  "needs a part-year to project": "ต้องมีข้อมูลบางส่วนของปีก่อนจึงจะประมาณการได้",
  "Certificate price": "ราคาใบรับรอง (Certificate price)",
  "EUR per tCO₂e": "ยูโรต่อ tCO₂e",
  "THB per EUR": "บาทต่อยูโร",
  "By workspace": "แยกตามพื้นที่ทำงาน",
  Workspace: "พื้นที่ทำงาน (Workspace)",
  Months: "เดือน",
  Direct: "ทางตรง (Direct)",
  Indirect: "ทางอ้อม (Indirect)",
  Chargeable: "ที่คิดค่าธรรมเนียม (Chargeable)",
  Shipped: "ส่งออกแล้ว",
  Cost: "ต้นทุน",
  "Where the carbon is": "คาร์บอนอยู่ตรงไหน",
  "What you can show a buyer": "สิ่งที่แสดงให้ผู้ซื้อดูได้",
  "Nothing to cost yet": "ยังไม่มีข้อมูลให้คำนวณต้นทุน",
  "Create a workspace": "สร้างพื้นที่ทำงาน",
  Readiness: "ความพร้อม (Readiness)",

  /* ── Reports ──────────────────────────────────────────────── */
  "Verifier packs": "ชุดเอกสารสำหรับผู้ตรวจสอบ (Verifier packs)",
  "Export pack": "ส่งออกชุดเอกสาร",
  "Filed packages": "ชุดเอกสารที่ยื่นแล้ว",
  months: "เดือน",
  /* The page is now organised by REPORT rather than by pack — one per
     product, including the ones opened on a supplier's behalf. */
  "One report per product.": "หนึ่งรายงานต่อหนึ่งสินค้า",
  "Every product you track gets a report — your own, and any supplier's you have started tracking. Each is built from that product's months, so it always says what its workspace says today.":
    "ทุกสินค้าที่คุณติดตามจะมีรายงานของตัวเอง ทั้งของคุณเองและของซัพพลายเออร์ที่คุณเริ่มติดตามไว้ แต่ละรายงานสร้างจากข้อมูลรายเดือนของสินค้านั้น จึงตรงกับพื้นที่ทำงานเสมอ",
  "one per product": "หนึ่งรายการต่อหนึ่งสินค้า",
  "Ready to send": "พร้อมส่ง",
  "nothing outstanding": "ไม่มีสิ่งที่ค้างอยู่",
  "a figure cannot be worked out": "มีตัวเลขที่คำนวณไม่ได้",
  "months in": "เดือนที่ส่งแล้ว",
  "Your products": "สินค้าของคุณ",
  "What you send your buyer. One per product, installation and year.":
    "สิ่งที่คุณส่งให้ผู้ซื้อ หนึ่งรายการต่อหนึ่งสินค้า หนึ่งโรงงาน และหนึ่งปี",
  "Precursors you are tracking": "สารตั้งต้นที่คุณกำลังติดตาม",
  "Started from Track report on a supply-chain row. These are your evidence for one line of the report above, not something the buyer receives.":
    "เริ่มจากปุ่ม Track report ในห่วงโซ่อุปทาน เอกสารเหล่านี้เป็นหลักฐานสำหรับหนึ่งบรรทัดในรายงานด้านบน ไม่ใช่สิ่งที่ผู้ซื้อได้รับ",
  "Tracked for": "ติดตามให้กับ",
  "a supplier": "ซัพพลายเออร์",
  "No reports yet. Create a workspace for a product, or press Track report on a supplier in a chain, and it appears here.":
    "ยังไม่มีรายงาน สร้างพื้นที่ทำงานให้สินค้า หรือกด Track report ที่ซัพพลายเออร์ในห่วงโซ่ แล้วรายงานจะปรากฏที่นี่",
  "No reports yet": "ยังไม่มีรายงาน",
  "Create a workspace for a product, or press Track report on a supplier in a chain, and it appears here.":
    "สร้างพื้นที่ทำงานให้สินค้า หรือกด Track report ที่ซัพพลายเออร์ในห่วงโซ่ แล้วรายงานจะปรากฏที่นี่",
  "That didn't save.": "บันทึกไม่สำเร็จ",
  "Check your connection and try again — nothing was lost on your side.":
    "ตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง — ข้อมูลฝั่งคุณไม่ได้สูญหาย",
  "Loading…": "กำลังโหลด…",
  "We couldn't reach the server.": "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้",
  "Check your connection and try again.": "ตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง",
  "Try again": "ลองอีกครั้ง",
  "Blocked — one of the tabs has a figure that cannot be worked out yet.":
    "ติดขัด — มีแท็บหนึ่งที่ยังคำนวณตัวเลขไม่ได้",
  "Ready. Downloads clean.": "พร้อมแล้ว ดาวน์โหลดได้โดยไม่มีตราประทับ DRAFT",
  "Still incomplete — every page downloads stamped DRAFT.":
    "ยังไม่ครบ — ทุกหน้าที่ดาวน์โหลดจะมีตราประทับ DRAFT",

  /* ── Shared UI vocabulary ─────────────────────────────────── */
  Save: "บันทึก",
  "Save changes": "บันทึกการเปลี่ยนแปลง",
  "Saving…": "กำลังบันทึก…",
  Saved: "บันทึกแล้ว",
  Cancel: "ยกเลิก",
  Close: "ปิด",
  Continue: "ถัดไป",
  Back: "ย้อนกลับ",
  Next: "ถัดไป",
  Done: "เสร็จสิ้น",
  Remove: "ลบออก",
  Delete: "ลบ",
  Edit: "แก้ไข",
  Add: "เพิ่ม",
  Search: "ค้นหา",
  "Search…": "ค้นหา…",
  Copy: "คัดลอก",
  copy: "คัดลอก",
  copied: "คัดลอกแล้ว",
  Copied: "คัดลอกแล้ว",
  live: "เปิดใช้งาน",
  soon: "เร็ว ๆ นี้",
  rollout: "กำลังทยอยเปิด",
  planned: "อยู่ในแผน",
  critical: "สำคัญมาก",
  Optional: "ไม่บังคับ",
  optional: "ไม่บังคับ",
  Required: "จำเป็น",
  "Previous page": "หน้าก่อนหน้า",
  "Next page": "หน้าถัดไป",
  "Page {page} of {total}": "หน้า {page} จาก {total}",
  "Not found": "ไม่พบข้อมูล",
  "Back to suppliers": "กลับไปหน้าซัพพลายเออร์",
  Supplier: "ซัพพลายเออร์",
  Progress: "ความคืบหน้า",
  Status: "สถานะ",
  Period: "รอบรายงาน",
  Route: "เส้นทางส่งออก",
  Products: "สินค้า",
  Due: "กำหนดส่ง",
  Deadline: "กำหนดส่ง",
  Type: "ประเภท",
  Declaration: "รายการยื่นข้อมูล",
  Draft: "ฉบับร่าง",
  All: "ทั้งหมด",
  Open: "ยังไม่ปิดรอบ",
  Overdue: "เลยกำหนด",
  Submitted: "ส่งแล้ว",
  Buyer: "ผู้ซื้อ",
  buyer: "ผู้ซื้อ",
  "Buyer request": "คำขอข้อมูลจากผู้ซื้อ",
  "CBAM compliance": "การปฏิบัติตาม CBAM",
  "New declaration": "สร้างรายการยื่นข้อมูล",
  New: "สร้างใหม่",
  "Open declaration": "เปิดรายการยื่นข้อมูล",
  "due {date}": "กำหนดส่ง {date}",
  "{count} submitted": "ส่งแล้ว {count} ราย",
  "{count} overdue": "เลยกำหนด {count} ราย",
  "{count} open": "ยังไม่ปิดรอบ {count} รายการ",
  "{count} total": "ทั้งหมด {count} รายการ",
  "{count} draft": "ฉบับร่าง {count} รายการ",
  "{count} drafts": "ฉบับร่าง {count} รายการ",
  "{count} declaration": "รายการยื่นข้อมูล {count} รายการ",
  "{count} declarations": "รายการยื่นข้อมูล {count} รายการ",
  filtered: "กรองแล้ว",

  /* ── Declaration lifecycle steps ──────────────────────────── */
  Collecting: "กำลังเก็บข้อมูล",
  Calculating: "กำลังคำนวณ",
  Compliance: "การปฏิบัติตามกฎ",
  "In review": "อยู่ระหว่างตรวจสอบ",
  Report: "รายงาน",
  Submitting: "กำลังส่ง",

  /* ── Supplier statuses ────────────────────────────────────── */
  submitted: "ส่งแล้ว",
  "in progress": "กำลังดำเนินการ",
  overdue: "เลยกำหนด",
  "not started": "ยังไม่เริ่ม",
  "CBAM-critical": "สำคัญต่อ CBAM",

  /* ── Dashboard ────────────────────────────────────────────── */
  Overview: "ภาพรวม",
  "Good afternoon, {name}.": "สวัสดีตอนบ่าย คุณ {name}",
  "Your CBAM Q2 cycle is open and the deadline is inside three weeks. Here's what needs you.":
    "รอบ CBAM ไตรมาส 2 ของคุณเปิดอยู่ และเหลือเวลาไม่ถึงสามสัปดาห์ นี่คือสิ่งที่ต้องให้คุณจัดการ",
  "Active declarations": "รายการที่กำลังดำเนินการ",
  "Suppliers submitted": "ซัพพลายเออร์ที่ส่งข้อมูลแล้ว",
  "this cycle": "รอบนี้",
  "Package ready": "ชุดเอกสารพร้อม",
  "Next deadline": "กำหนดส่งถัดไป",
  "{count} CBAM-critical supplier is overdue on {declaration}.":
    "ซัพพลายเออร์ที่สำคัญต่อ CBAM {count} ราย เลยกำหนดส่งใน {declaration}",
  "{count} CBAM-critical suppliers are overdue on {declaration}.":
    "ซัพพลายเออร์ที่สำคัญต่อ CBAM {count} ราย เลยกำหนดส่งใน {declaration}",
  "Late = rejected. Send a reminder, or escalate, before the package locks.":
    "ส่งช้าเท่ากับถูกปฏิเสธ ส่งการแจ้งเตือนหรือยกระดับเรื่องก่อนที่ชุดเอกสารจะถูกล็อก",
  "Latest activity": "ความเคลื่อนไหวล่าสุด",
  "Steel & iron": "เหล็กและเหล็กกล้า",
  Aluminium: "อะลูมิเนียม",

  /* ── Declarations list ────────────────────────────────────── */
  "Reporting cycles.": "รอบการรายงาน",
  "Every regulation, market and period you're filing for. A declaration is the unit of compliance — scope it once, the platform runs the rest.":
    "ทุกกฎระเบียบ ตลาด และรอบรายงานที่คุณต้องยื่น รายการยื่นข้อมูลคือหน่วยของการปฏิบัติตามกฎ กำหนดขอบเขตครั้งเดียว แล้วให้ระบบทำงานที่เหลือ",
  "Search declarations…": "ค้นหารายการยื่นข้อมูล…",
  "Card view": "มุมมองการ์ด",
  "Table view": "มุมมองตาราง",
  "Continue editing": "แก้ไขต่อ",
  "Discard draft": "ทิ้งฉบับร่าง",
  "Draft · not yet sent": "ฉบับร่าง · ยังไม่ได้ส่ง",
  "No declarations match these filters": "ไม่มีรายการยื่นข้อมูลที่ตรงกับตัวกรองนี้",
  "Clear the filters, or start a new declaration — CBAM compliance or a custom buyer request.":
    "ล้างตัวกรอง หรือเริ่มรายการยื่นข้อมูลใหม่ — การปฏิบัติตาม CBAM หรือคำขอข้อมูลจากผู้ซื้อ",

  /* ── New-declaration wizard: chrome & steps ───────────────── */
  "Scope it once.": "กำหนดขอบเขตครั้งเดียว",
  "Suppliers fill a free guided form — no account, no seat.":
    "ซัพพลายเออร์กรอกแบบฟอร์มแบบมีคำแนะนำได้ฟรี ไม่ต้องสมัครบัญชี ไม่ใช้สิทธิ์ผู้ใช้",
  "Close and save draft": "ปิดและบันทึกเป็นฉบับร่าง",
  "Step {step} of {total}": "ขั้นที่ {step} จาก {total}",
  Scope: "ขอบเขต",
  Purpose: "วัตถุประสงค์",
  Classification: "การจัดประเภท",
  Review: "ตรวจทาน",
  "Create declaration": "สร้างรายการยื่นข้อมูล",
  "Saved as draft": "บันทึกเป็นฉบับร่างแล้ว",
  "Pick up where you left off from the Declarations list.": "กลับมาทำต่อได้จากหน้ารายการยื่นข้อมูล",
  "Declaration created.": "สร้างรายการยื่นข้อมูลแล้ว",
  "{name} — {suppliers} suppliers · {products} products · {lots} lots queued.":
    "{name} — ซัพพลายเออร์ {suppliers} ราย · สินค้า {products} รายการ · ล็อต {lots} ล็อต เข้าคิวแล้ว",

  /* Step 1 — scope */
  "Compliance regulation": "กฎระเบียบที่ต้องปฏิบัติตาม",
  "Which regime are you reporting for? Certrace launched on CBAM — the obligation that bites first for exporters into the EU. The rest run on the same engine and switch on as their data models are verified.":
    "คุณกำลังรายงานภายใต้กฎระเบียบใด Certrace เริ่มต้นที่ CBAM ซึ่งเป็นภาระผูกพันแรกที่กระทบผู้ส่งออกไปยังสหภาพยุโรป กฎระเบียบอื่นทำงานบนระบบเดียวกัน และจะเปิดใช้เมื่อโครงสร้างข้อมูลผ่านการตรวจสอบแล้ว",
  "Export route": "เส้นทางการส่งออก",
  "Where do you export from, and into which market? {reg} applies to goods entering the EU — your origin sets the emission-factor library Certrace calculates with.":
    "คุณส่งออกจากที่ใด และเข้าสู่ตลาดใด {reg} ใช้กับสินค้าที่เข้าสู่สหภาพยุโรป ประเทศต้นทางเป็นตัวกำหนดชุดค่าการปล่อยก๊าซที่ Certrace ใช้คำนวณ",
  "From — country of origin": "จาก — ประเทศต้นทาง",
  "To — destination market": "ไปยัง — ตลาดปลายทาง",
  "Enforces {reg}": "บังคับใช้ {reg}",
  "No {reg} obligation here": "ไม่มีภาระผูกพัน {reg} ที่นี่",
  "factors from": "ค่าการปล่อยจาก",
  "filed to": "ยื่นต่อ",
  Thailand: "ประเทศไทย",
  Vietnam: "เวียดนาม",
  Indonesia: "อินโดนีเซีย",
  Malaysia: "มาเลเซีย",
  "European Union": "สหภาพยุโรป",
  "United Kingdom": "สหราชอาณาจักร",
  "United States": "สหรัฐอเมริกา",
  "Coming soon · electronics, steel, textiles.": "เร็ว ๆ นี้ · อิเล็กทรอนิกส์ เหล็ก สิ่งทอ",
  "Coming soon · aluminium, palm oil (EUDR).": "เร็ว ๆ นี้ · อะลูมิเนียม น้ำมันปาล์ม (EUDR)",
  "Planned · rubber, palm oil, electronics.": "อยู่ในแผน · ยางพารา น้ำมันปาล์ม อิเล็กทรอนิกส์",
  "EU CBAM Registry · via importer / declarant": "ทะเบียน CBAM ของสหภาพยุโรป · ผ่านผู้นำเข้า / ผู้ยื่นแทน",

  /* Step 2 — purpose */
  "What is this declaration for?": "รายการยื่นข้อมูลนี้ใช้เพื่ออะไร",
  "Choose one — the official CBAM filing, or a specific buyer's data request. Each has its own qualification checklist, so keep the two separate.":
    "เลือกอย่างใดอย่างหนึ่ง — การยื่น CBAM อย่างเป็นทางการ หรือคำขอข้อมูลจากผู้ซื้อรายใดรายหนึ่ง แต่ละแบบมีรายการตรวจสอบของตนเอง จึงควรแยกจากกัน",
  "CBAM Compliance": "การปฏิบัติตาม CBAM",
  "Automatically prepares supplier data collection based on CBAM requirements. Fields, CN codes and templates are generated for you.":
    "เตรียมการเก็บข้อมูลจากซัพพลายเออร์ให้อัตโนมัติตามข้อกำหนดของ CBAM ทั้งช่องข้อมูล รหัส CN และแม่แบบเอกสาร",
  "Buyer Request": "คำขอข้อมูลจากผู้ซื้อ",
  "Create a custom supplier request for buyer-specific information — documents, certificates and questionnaires on top of the carbon data.":
    "สร้างคำขอเฉพาะสำหรับข้อมูลที่ผู้ซื้อต้องการ ทั้งเอกสาร ใบรับรอง และแบบสอบถาม เพิ่มเติมจากข้อมูลคาร์บอน",
  "e.g. CBAM 2026 Annual": "เช่น CBAM 2026 รายปี",
  "e.g. ABC Buyer Carbon Data Request": "เช่น คำขอข้อมูลคาร์บอนจากผู้ซื้อ ABC",
  "Request name": "ชื่อคำขอ",
  "Shown to suppliers and on every reminder. Make it recognisable.":
    "ชื่อนี้จะแสดงต่อซัพพลายเออร์และในการแจ้งเตือนทุกครั้ง ควรตั้งให้จำง่าย",
  "Request description (optional)": "คำอธิบายคำขอ (ไม่บังคับ)",
  "Context for your suppliers — what this is for.": "บริบทสำหรับซัพพลายเออร์ — คำขอนี้ใช้เพื่ออะไร",
  "e.g. Annual CBAM carbon data for our EU steel exports. Please report at installation level.":
    "เช่น ข้อมูลคาร์บอน CBAM รายปีสำหรับการส่งออกเหล็กไปสหภาพยุโรป กรุณารายงานในระดับโรงงาน",
  "EU buyer / importer (required)": "ผู้ซื้อ / ผู้นำเข้าในสหภาพยุโรป (จำเป็น)",
  "EU buyer / importer": "ผู้ซื้อ / ผู้นำเข้าในสหภาพยุโรป",
  "Who imports these goods into the EU? Their Authorised CBAM Declarant files the declaration — Certrace addresses the Communication Template and the O3CI share to them.":
    "ใครเป็นผู้นำเข้าสินค้านี้สู่สหภาพยุโรป ผู้ยื่น CBAM ที่ได้รับอนุญาตของเขาเป็นผู้ยื่นรายงาน Certrace จะจ่าหน้าแม่แบบการสื่อสารและการแบ่งปันข้อมูล O3CI ไปยังบุคคลนั้น",
  "The buyer this data request is for.": "ผู้ซื้อที่คำขอข้อมูลนี้จัดทำให้",
  "Buyer legal name": "ชื่อนิติบุคคลของผู้ซื้อ",
  "EORI number": "หมายเลข EORI",
  "Format: 2-letter country + 6–15 characters, e.g. DE551234567890":
    "รูปแบบ: รหัสประเทศ 2 ตัวอักษร + อีก 6–15 อักขระ เช่น DE551234567890",
  "The declarant's Registry identifier.": "รหัสประจำตัวของผู้ยื่นในระบบทะเบียน",
  "Contact email": "อีเมลติดต่อ",
  "Enter a valid email address.": "กรุณากรอกอีเมลให้ถูกต้อง",
  "Where the Communication Template is sent.": "ที่อยู่สำหรับส่งแม่แบบการสื่อสาร",

  /* Step 3 — period */
  "Reporting period": "รอบการรายงาน",
  "Buyer requests can run on any cadence. Pick the rhythm that matches how this buyer wants the data.":
    "คำขอจากผู้ซื้อกำหนดความถี่ได้อิสระ เลือกจังหวะที่ตรงกับที่ผู้ซื้อรายนี้ต้องการ",
  "Official CBAM declarations are annual — but you can collect supplier data quarterly if that fits your cycle.":
    "การยื่น CBAM อย่างเป็นทางการเป็นรายปี แต่คุณเก็บข้อมูลจากซัพพลายเออร์เป็นรายไตรมาสได้ หากเหมาะกับรอบการทำงานของคุณ",
  Annual: "รายปี",
  Quarterly: "รายไตรมาส",
  "Semi-annual": "รายครึ่งปี",
  Monthly: "รายเดือน",
  "Official CBAM cadence — recommended. Suppliers can report at year-end.":
    "ความถี่ตามข้อกำหนด CBAM — แนะนำ ซัพพลายเออร์รายงานได้เมื่อสิ้นปี",
  "Collect supplier data each quarter (one quarter at a time).":
    "เก็บข้อมูลจากซัพพลายเออร์ทุกไตรมาส (ครั้งละหนึ่งไตรมาส)",
  "Once per calendar year.": "ปีละหนึ่งครั้งตามปีปฏิทิน",
  "One half-year at a time.": "ครั้งละหนึ่งครึ่งปี",
  "One quarter at a time.": "ครั้งละหนึ่งไตรมาส",
  "One month at a time.": "ครั้งละหนึ่งเดือน",
  recommended: "แนะนำ",
  "Choose dates": "เลือกวันที่",
  "Choose period": "เลือกรอบรายงาน",
  "One-time collection": "การเก็บข้อมูลครั้งเดียว",
  Quarter: "ไตรมาส",
  Half: "ครึ่งปี",
  "Half-year": "ครึ่งปี",
  Month: "เดือน",
  Year: "ปี",
  "Start date": "วันที่เริ่มต้น",
  "End date": "วันที่สิ้นสุด",
  "A single, ad-hoc collection — no recurring period.": "เก็บข้อมูลครั้งเดียว ไม่มีรอบซ้ำ",
  "Period reads as": "รอบรายงานจะแสดงเป็น",
  "Q1 (Jan–Mar)": "ไตรมาส 1 (ม.ค.–มี.ค.)",
  "Q2 (Apr–Jun)": "ไตรมาส 2 (เม.ย.–มิ.ย.)",
  "Q3 (Jul–Sep)": "ไตรมาส 3 (ก.ค.–ก.ย.)",
  "Q4 (Oct–Dec)": "ไตรมาส 4 (ต.ค.–ธ.ค.)",
  "H1 (Jan–Jun)": "ครึ่งปีแรก (ม.ค.–มิ.ย.)",
  "H2 (Jul–Dec)": "ครึ่งปีหลัง (ก.ค.–ธ.ค.)",
  January: "มกราคม",
  February: "กุมภาพันธ์",
  March: "มีนาคม",
  April: "เมษายน",
  May: "พฤษภาคม",
  June: "มิถุนายน",
  July: "กรกฎาคม",
  August: "สิงหาคม",
  September: "กันยายน",
  October: "ตุลาคม",
  November: "พฤศจิกายน",
  December: "ธันวาคม",

  /* Step 4 — products */
  "Search the CBAM goods catalogue by product name, CN code or HS code. Pick everything in scope — reorder to match how you brief suppliers.":
    "ค้นหาสินค้าในบัญชีรายการ CBAM ด้วยชื่อสินค้า รหัส CN หรือรหัส HS เลือกทุกรายการที่อยู่ในขอบเขต และจัดลำดับให้ตรงกับที่คุณสื่อสารกับซัพพลายเออร์",
  "Search… e.g. Hot-rolled coil, 7208, or aluminium": "ค้นหา… เช่น Hot-rolled coil, 7208 หรือ aluminium",
  "All goods": "สินค้าทั้งหมด",
  "Iron & Steel": "เหล็กและเหล็กกล้า",
  "{count} in catalogue": "อยู่ในบัญชีรายการ {count} รายการ",
  "No products match “{query}”.": "ไม่พบสินค้าที่ตรงกับ “{query}”",
  "In scope": "อยู่ในขอบเขต",
  "Nothing selected yet. Tick products on the left to add them.":
    "ยังไม่ได้เลือกรายการใด ติ๊กสินค้าทางด้านซ้ายเพื่อเพิ่ม",
  "Move up": "เลื่อนขึ้น",
  "Move down": "เลื่อนลง",

  /* Step 5 — classification */
  "Classification & report fields": "การจัดประเภทและช่องข้อมูลในรายงาน",
  "Certrace classified each product automatically — category, CN / HS codes and the CBAM template come from the catalogue and can't be edited. The checklist below reflects the data points that actually apply to the goods you selected.":
    "Certrace จัดประเภทสินค้าแต่ละรายการให้อัตโนมัติ ทั้งหมวดหมู่ รหัส CN / HS และแม่แบบ CBAM มาจากบัญชีรายการและแก้ไขไม่ได้ รายการตรวจสอบด้านล่างสะท้อนข้อมูลที่ใช้จริงกับสินค้าที่คุณเลือก",
  "CBAM report fields": "ช่องข้อมูลในรายงาน CBAM",
  "Carbon data to request": "ข้อมูลคาร์บอนที่จะขอ",
  "{included} of {total} included": "รวมไว้ {included} จาก {total} รายการ",
  "These are the data points CBAM requires for the goods you selected. Required fields are locked on; the rest are recommended and on by default — keep or drop them to match how you collect data.":
    "นี่คือข้อมูลที่ CBAM กำหนดสำหรับสินค้าที่คุณเลือก ช่องที่จำเป็นถูกล็อกให้เปิดไว้ ส่วนที่เหลือเป็นข้อแนะนำและเปิดไว้เป็นค่าเริ่มต้น เก็บไว้หรือเอาออกได้ตามวิธีเก็บข้อมูลของคุณ",
  "Choose the carbon-data fields this buyer needs. Recommended fields are pre-selected because buyers commonly ask for them — adjust freely, keeping at least one.":
    "เลือกช่องข้อมูลคาร์บอนที่ผู้ซื้อรายนี้ต้องการ ช่องที่แนะนำถูกเลือกไว้ล่วงหน้าเพราะผู้ซื้อมักขอ ปรับได้อิสระแต่ต้องเหลืออย่างน้อยหนึ่งช่อง",
  "Select {field}": "เลือก {field}",
  "Deselect {field}": "ยกเลิกเลือก {field}",
  required: "จำเป็น",

  /* CBAM field groups + labels */
  Installation: "โรงงานผู้ผลิต",
  Goods: "สินค้า",
  "Embedded emissions": "การปล่อยก๊าซที่ฝังอยู่ในสินค้า",
  Electricity: "ไฟฟ้า",
  Precursors: "วัตถุดิบตั้งต้น",
  "Carbon price": "ราคาคาร์บอน",
  Verification: "การทวนสอบ (Verification)",
  "Installation name": "ชื่อโรงงานผู้ผลิต",
  "Legal name of the producing installation": "ชื่อตามกฎหมายของโรงงานที่ผลิต",
  "Installation country": "ประเทศที่ตั้งโรงงาน",
  "Country of production": "ประเทศที่ผลิต",
  "Site address": "ที่อยู่ของสถานประกอบการ",
  "Full street address of the production site": "ที่อยู่เต็มของสถานที่ผลิต",
  "UN location code of the site, e.g. THRYG": "รหัสสถานที่ UN/LOCODE ของสถานที่ เช่น THRYG",
  "Geographic coordinates": "พิกัดภูมิศาสตร์",
  "Latitude / longitude of the main emission source": "ละติจูด / ลองจิจูดของแหล่งปล่อยก๊าซหลัก",
  "Aggregated goods category": "หมวดสินค้ารวม",
  "CBAM aggregated category for the CN code": "หมวดสินค้ารวมตาม CBAM สำหรับรหัส CN นั้น",
  "CN code": "รหัส CN",
  "8-digit Combined Nomenclature code": "รหัส Combined Nomenclature 8 หลัก",
  "Production process / route": "กระบวนการ / เส้นทางการผลิต",
  "Steel: e.g. BF-BOF, EAF, DRI-EAF · Aluminium: e.g. electrolysis (Hall-Héroult), remelt, extrusion":
    "เหล็ก: เช่น BF-BOF, EAF, DRI-EAF · อะลูมิเนียม: เช่น อิเล็กโทรลิซิส (Hall-Héroult), หลอมซ้ำ, อัดรีด",
  "Quantity covered by this request (net mass, t)": "ปริมาณที่คำขอนี้ครอบคลุม (น้ำหนักสุทธิ, ตัน)",
  "Net mass the exporter bought from you in the period — not your installation's total production":
    "น้ำหนักสุทธิที่ผู้ส่งออกซื้อจากคุณในรอบนี้ ไม่ใช่ยอดผลิตรวมของโรงงานคุณ",
  "Direct specific emissions — own process (tCO₂e/t)": "การปล่อยทางตรงต่อหน่วย — กระบวนการของคุณเอง (tCO₂e/t)",
  "Direct emissions of YOUR production step only — precursors are added separately below":
    "การปล่อยทางตรงเฉพาะขั้นตอนการผลิตของคุณเท่านั้น วัตถุดิบตั้งต้นกรอกแยกด้านล่าง",
  "Indirect specific emissions — own process (tCO₂e/t)": "การปล่อยทางอ้อมต่อหน่วย — กระบวนการของคุณเอง (tCO₂e/t)",
  "Electricity-related emissions of YOUR production step only":
    "การปล่อยจากไฟฟ้าเฉพาะขั้นตอนการผลิตของคุณเท่านั้น",
  "Total embedded emissions (tCO₂e/t)": "การปล่อยที่ฝังอยู่รวม (tCO₂e/t)",
  "Derived automatically: own direct + own indirect + precursor contribution":
    "คำนวณอัตโนมัติ: ทางตรงของคุณ + ทางอ้อมของคุณ + ส่วนจากวัตถุดิบตั้งต้น",
  "Determination method (actual / default)": "วิธีการกำหนดค่า (ค่าจริง / ค่าตั้งต้น)",
  "Whether actual data or default values were used": "ใช้ข้อมูลจริงหรือค่าตั้งต้น",
  "Electricity consumed (MWh/t)": "ปริมาณไฟฟ้าที่ใช้ (MWh/t)",
  "Electricity used per tonne of output — drives indirect emissions":
    "ไฟฟ้าที่ใช้ต่อผลผลิตหนึ่งตัน เป็นตัวกำหนดการปล่อยทางอ้อม",
  "Electricity emission factor & source": "ค่าการปล่อยของไฟฟ้าและแหล่งที่มา",
  "Grid / PPA factor and its documented source": "ค่าจากระบบสายส่งหรือสัญญา PPA พร้อมแหล่งอ้างอิง",
  "Electrolysis technology (prebake / Søderberg)": "เทคโนโลยีอิเล็กโทรลิซิส (prebake / Søderberg)",
  "Smelting route — only for primary (unwrought) aluminium from electrolysis":
    "เส้นทางการถลุง ใช้เฉพาะอะลูมิเนียมปฐมภูมิที่ได้จากอิเล็กโทรลิซิส",
  "Relevant precursors & their embedded emissions": "วัตถุดิบตั้งต้นที่เกี่ยวข้องและการปล่อยที่ฝังอยู่",
  "One row per input material: quantity consumed per tonne of this good × its embedded emissions":
    "หนึ่งแถวต่อวัตถุดิบหนึ่งชนิด: ปริมาณที่ใช้ต่อสินค้าหนึ่งตัน × ค่าการปล่อยที่ฝังอยู่ของวัตถุดิบนั้น",
  "Precursor production routes": "เส้นทางการผลิตของวัตถุดิบตั้งต้น",
  "How each precursor was produced, where known": "วัตถุดิบตั้งต้นแต่ละชนิดผลิตอย่างไร เท่าที่ทราบ",
  "Carbon price due in country of origin": "ราคาคาร์บอนที่ต้องชำระในประเทศต้นทาง",
  "Carbon price actually paid per tonne of CO₂e, if any": "ราคาคาร์บอนที่ชำระจริงต่อ CO₂e หนึ่งตัน (ถ้ามี)",
  "Carbon price currency": "สกุลเงินของราคาคาร์บอน",
  "Currency the carbon price was paid in (THB or EUR)": "สกุลเงินที่ใช้ชำระราคาคาร์บอน (THB หรือ EUR)",
  "Form of carbon price (ETS / tax / levy)": "รูปแบบของราคาคาร์บอน (ETS / ภาษี / ค่าธรรมเนียม)",
  "Instrument under which the price was paid": "กลไกที่ใช้ชำระราคาดังกล่าว",
  "Verification & verifier details": "รายละเอียดการทวนสอบและผู้ทวนสอบ",
  "Accredited verifier and verification outcome": "ผู้ทวนสอบที่ได้รับการรับรองและผลการทวนสอบ",

  /* Step 6 — suppliers */
  "Suppliers, lots & quantities": "ซัพพลายเออร์ ล็อต และปริมาณ",
  "Map suppliers to each product, then add the production lots you bought in this period. Each lot keeps its own quantity and optional production period, so the embedded-emissions calculation stays fully traceable.":
    "จับคู่ซัพพลายเออร์กับสินค้าแต่ละรายการ แล้วเพิ่มล็อตการผลิตที่คุณซื้อในรอบนี้ แต่ละล็อตเก็บปริมาณและช่วงเวลาการผลิตของตนเอง การคำนวณการปล่อยที่ฝังอยู่จึงตรวจสอบย้อนกลับได้ทั้งหมด",
  "We produce this ourselves": "เราผลิตรายการนี้เอง",
  "No Smart Link is sent for {org} — you'll fill this product's data in the portal under your own org profile. Everything after that is identical: AI check, calculation, audit trail.":
    "จะไม่มีการส่ง Smart Link ให้ {org} — คุณจะกรอกข้อมูลสินค้านี้ในระบบภายใต้โปรไฟล์องค์กรของคุณเอง ขั้นตอนหลังจากนั้นเหมือนกันทุกอย่าง ทั้งการตรวจด้วย AI การคำนวณ และร่องรอยการตรวจสอบ",
  "this is us": "คือองค์กรของเรา",
  "Remove supplier": "นำซัพพลายเออร์ออก",
  "Add supplier from directory…": "เพิ่มซัพพลายเออร์จากรายชื่อ…",
  "Add supplier": "เพิ่มซัพพลายเออร์",
  "Search directory…": "ค้นหาในรายชื่อ…",
  "Invite new supplier": "เชิญซัพพลายเออร์รายใหม่",
  "Add lot": "เพิ่มล็อต",
  "Lot {n}": "ล็อตที่ {n}",
  "Remove lot": "ลบล็อต",
  Quantity: "ปริมาณ",
  "Select unit": "เลือกหน่วย",
  Unit: "หน่วย",
  "Produced from": "ผลิตตั้งแต่",
  "Produced to": "ผลิตถึง",
  "Notes (optional)": "หมายเหตุ (ไม่บังคับ)",
  "Invite supplier": "เชิญซัพพลายเออร์",
  "Saved to your directory — no onboarding needed": "บันทึกลงรายชื่อของคุณ ไม่ต้องผ่านขั้นตอนเปิดใช้งาน",
  "Saved to your supplier directory — no onboarding needed.": "บันทึกลงรายชื่อซัพพลายเออร์ของคุณแล้ว ไม่ต้องผ่านขั้นตอนเปิดใช้งาน",
  "{company} added": "เพิ่ม {company} แล้ว",
  "Company name": "ชื่อบริษัท",
  "e.g. Eastern Steel Mill": "เช่น Eastern Steel Mill",
  "Contact person": "ผู้ติดต่อ",
  "Full name": "ชื่อ-นามสกุล",
  Email: "อีเมล",
  Country: "ประเทศ",
  "Select country": "เลือกประเทศ",
  "Search countries…": "ค้นหาประเทศ…",
  "No country matches": "ไม่พบประเทศที่ตรงกัน",

  /* Step 7 — deadline */
  "Deadline & reminders": "กำหนดส่งและการแจ้งเตือน",
  "Set the submission deadline suppliers see, and let Certrace chase them automatically so you don't have to.":
    "กำหนดวันส่งที่ซัพพลายเออร์จะเห็น แล้วให้ Certrace ติดตามให้อัตโนมัติ คุณจะได้ไม่ต้องตามเอง",
  "Submission deadline": "กำหนดส่งข้อมูล",
  "The date suppliers must submit by.": "วันที่ซัพพลายเออร์ต้องส่งข้อมูลภายใน",
  "The date suppliers must submit by — defaulted to one month after the period ends ({end}).":
    "วันที่ซัพพลายเออร์ต้องส่งข้อมูลภายใน ตั้งค่าเริ่มต้นเป็นหนึ่งเดือนหลังรอบรายงานสิ้นสุด ({end})",
  "The reporting period runs until {end} — suppliers can only report complete data after it ends. Pick a later deadline.":
    "รอบรายงานสิ้นสุดวันที่ {end} ซัพพลายเออร์จะรายงานข้อมูลครบถ้วนได้หลังจากนั้นเท่านั้น กรุณาเลือกวันที่หลังจากนี้",
  "Automatic reminders": "การแจ้งเตือนอัตโนมัติ",
  "7 days before the deadline": "7 วันก่อนกำหนดส่ง",
  "3 days before the deadline": "3 วันก่อนกำหนดส่ง",
  "On the due date": "ในวันครบกำหนด",
  "Notes to suppliers (optional)": "หมายเหตุถึงซัพพลายเออร์ (ไม่บังคับ)",
  "Appears at the top of every supplier's guided form.": "จะแสดงที่ด้านบนของแบบฟอร์มของซัพพลายเออร์ทุกราย",
  "e.g. Please use installation-level actual data where possible. Contact us if you need help.":
    "เช่น กรุณาใช้ข้อมูลจริงระดับโรงงานเท่าที่ทำได้ หากต้องการความช่วยเหลือโปรดติดต่อเรา",

  /* Step 8 — review */
  "Review & create": "ตรวจทานและสร้าง",
  "One last look. We'll prepare the guided forms and reminders — you send them when you're ready.":
    "ตรวจทานอีกครั้ง เราจะเตรียมแบบฟอร์มและการแจ้งเตือนไว้ให้ คุณเป็นผู้ส่งเมื่อพร้อม",
  Lots: "ล็อต",
  "Est. completion": "ประมาณการเสร็จสิ้น",
  Regulation: "กฎระเบียบ",
  Authority: "หน่วยงานผู้รับ",
  "EU buyer": "ผู้ซื้อในสหภาพยุโรป",
  "Report fields": "ช่องข้อมูลในรายงาน",
  "Total volume": "ปริมาณรวม",
  "Self-supplied": "ผลิตเอง",
  Reminders: "การแจ้งเตือน",
  "{count} · CN-classified": "{count} รายการ · จัดประเภทด้วยรหัส CN แล้ว",
  "{included} of {total} ({required} required)": "{included} จาก {total} ({required} รายการจำเป็น)",
  "{count} selected": "เลือกไว้ {count} รายการ",
  "{tonnes} t across {lots} lots": "{tonnes} ตัน จาก {lots} ล็อต",
  "{lots} lots": "{lots} ล็อต",
  "{count} product — you fill this in-app, no Smart Link sent":
    "สินค้า {count} รายการ — คุณกรอกเองในระบบ ไม่มีการส่ง Smart Link",
  "{count} products — you fill these in-app, no Smart Link sent":
    "สินค้า {count} รายการ — คุณกรอกเองในระบบ ไม่มีการส่ง Smart Link",
  "None — every product comes from an external supplier": "ไม่มี — สินค้าทุกรายการมาจากซัพพลายเออร์ภายนอก",
  due: "ครบกำหนด",
  none: "ไม่มี",
  "Product → supplier → lots": "สินค้า → ซัพพลายเออร์ → ล็อต",
  "— no suppliers yet": "— ยังไม่มีซัพพลายเออร์",
  us: "เรา",
  "Estimated effort with Certrace:": "แรงที่ต้องใช้โดยประมาณเมื่อใช้ Certrace:",
  "3–5 working days": "3–5 วันทำการ",
  "of your time vs 9–15 weeks chasing data by email. Suppliers report for free.":
    "เทียบกับ 9–15 สัปดาห์หากไล่ตามข้อมูลทางอีเมล ซัพพลายเออร์รายงานได้ฟรี",

  /* ── Suppliers page ───────────────────────────────────────── */
  "Supplier directory.": "รายชื่อซัพพลายเออร์",
  "Everyone you collect data from, across every declaration. Suppliers fill a free guided form — no account, no fee — and their verified data carries forward.":
    "ทุกรายที่คุณเก็บข้อมูลด้วย ครอบคลุมทุกรายการยื่นข้อมูล ซัพพลายเออร์กรอกแบบฟอร์มแบบมีคำแนะนำได้ฟรี ไม่ต้องมีบัญชี ไม่มีค่าใช้จ่าย และข้อมูลที่ทวนสอบแล้วจะถูกนำไปใช้ต่อ",
  "In directory": "อยู่ในรายชื่อ",
  "Data on platform": "มีข้อมูลในระบบ",
  "Avg completion": "ความสมบูรณ์เฉลี่ย",
  "Search suppliers…": "ค้นหาซัพพลายเออร์…",
  Material: "วัสดุ",
  "Last data": "ข้อมูลล่าสุด",
  "No suppliers match “{query}”.": "ไม่พบซัพพลายเออร์ที่ตรงกับ “{query}”",
  "Invite a supplier.": "เชิญซัพพลายเออร์",
  "Supplier name": "ชื่อซัพพลายเออร์",
  "e.g. Thai Special Steel": "เช่น Thai Special Steel",
  "Material supplied": "วัสดุที่จัดหาให้",
  "What they provide into your steel chain.": "สิ่งที่เขาจัดหาเข้าสู่ห่วงโซ่การผลิตเหล็กของคุณ",
  "e.g. Steel billet": "เช่น Steel billet",
  "Optional — who to address the request to.": "ไม่บังคับ — จ่าหน้าคำขอถึงใคร",
  "Optional — where their Smart Link is sent.": "ไม่บังคับ — ที่อยู่สำหรับส่ง Smart Link ของเขา",
  "Or share a guided-form link": "หรือแชร์ลิงก์แบบฟอร์ม",
  "Send invite": "ส่งคำเชิญ",
  "Suppliers are always free and never take a seat.": "ซัพพลายเออร์ใช้งานฟรีเสมอ และไม่นับเป็นสิทธิ์ผู้ใช้",
  "Add a supplier name first.": "กรุณากรอกชื่อซัพพลายเออร์ก่อน",
  "Pick the supplier's country.": "กรุณาเลือกประเทศของซัพพลายเออร์",
  "It sets which emission-factor library their data is read against.":
    "ประเทศเป็นตัวกำหนดว่าข้อมูลของเขาจะถูกอ่านเทียบกับชุดค่าการปล่อยของประเทศใด",
  "Invite sent to {company}.": "ส่งคำเชิญถึง {company} แล้ว",
  "They get a free guided form — no account needed.": "เขาจะได้รับแบบฟอร์มแบบมีคำแนะนำฟรี ไม่ต้องสมัครบัญชี",
  "Not in your directory.": "ไม่มีในรายชื่อของคุณ",
  "Nothing is filed under “{slug}”. It may have been removed, or the link may be from another account.":
    "ไม่พบข้อมูลภายใต้ “{slug}” อาจถูกลบไปแล้ว หรือลิงก์นี้มาจากบัญชีอื่น",

  /* ── Reports ──────────────────────────────────────────────── */
  "Submission history.": "ประวัติการส่งข้อมูล",
  "Every verification-ready package you've generated and where it went. Timestamped, sealed, and re-downloadable for any verification.":
    "ชุดเอกสารพร้อมตรวจสอบทุกชุดที่คุณสร้างไว้ และปลายทางที่ส่งไป มีการประทับเวลา ผนึกไว้ และดาวน์โหลดซ้ำได้ทุกเมื่อที่ต้องตรวจสอบ",
  "Packages filed": "ชุดเอกสารที่ยื่นแล้ว",
  Accepted: "ได้รับการยอมรับ",
  Rejected: "ถูกปฏิเสธ",
  "{plan} plan —": "แพ็กเกจ {plan} —",
  "Verification-ready export": "ส่งออกเอกสารพร้อมตรวจสอบ",
  "Multi-regulation templates": "แม่แบบหลายกฎระเบียบ",
  "Multi-regulation templates — upgrade to Standard": "แม่แบบหลายกฎระเบียบ — อัปเกรดเป็น Standard",
  "generated {date}": "สร้างเมื่อ {date}",
  Verifier: "ผู้ทวนสอบ",
  draft: "ฉบับร่าง",
  "in review": "อยู่ระหว่างตรวจสอบ",
  accepted: "ได้รับการยอมรับ",
  "Declaration not found": "ไม่พบรายการยื่นข้อมูล",
  "No declaration matches {period}.": "ไม่มีรายการยื่นข้อมูลที่ตรงกับ {period}",
  "Package downloaded.": "ดาวน์โหลดชุดเอกสารแล้ว",
  "Regenerated from the sealed dataset — same figures, checkable hash.":
    "สร้างใหม่จากชุดข้อมูลที่ผนึกไว้ ตัวเลขเดิม พร้อมค่าแฮชที่ตรวจสอบได้",

  /* ── Coverage / regulations ───────────────────────────────── */
  Coverage: "ขอบเขตที่รองรับ",
  "What's live, and what's next.": "อะไรเปิดใช้แล้ว และอะไรกำลังจะมา",
  "Certrace launched on the obligation that bites first: CBAM for steel exporters into the EU. Every other regime and market is built on the same engine — we turn them on as their factor libraries and calculation routes are verified.":
    "Certrace เริ่มต้นจากภาระผูกพันที่กระทบก่อนใคร นั่นคือ CBAM สำหรับผู้ส่งออกเหล็กไปยังสหภาพยุโรป กฎระเบียบและตลาดอื่นสร้างบนระบบเดียวกัน และจะเปิดใช้เมื่อชุดค่าการปล่อยและวิธีคำนวณผ่านการตรวจสอบ",
  Regulations: "กฎระเบียบ",
  "CBAM goods coverage": "สินค้าที่ CBAM ครอบคลุม",
  Sector: "กลุ่มสินค้า",
  "CN codes": "รหัส CN",
  "Steel & iron covers CN chapters 72–73 — the bulk of Thai CBAM exports. Other goods open next.":
    "เหล็กและเหล็กกล้าครอบคลุมพิกัด CN บทที่ 72–73 ซึ่งเป็นส่วนใหญ่ของการส่งออกภายใต้ CBAM ของไทย สินค้าอื่นจะเปิดเป็นลำดับถัดไป",
  Markets: "ตลาด",
  Market: "ตลาด",
  "Emission-factor library": "ชุดค่าการปล่อยก๊าซ",
  Cement: "ซีเมนต์",
  Fertilisers: "ปุ๋ย",
  Hydrogen: "ไฮโดรเจน",
  "Quarterly data · annual declaration": "ข้อมูลรายไตรมาส · ยื่นรายงานรายปี",
  "Per shipment": "ต่อการขนส่งแต่ละครั้ง",
  Ongoing: "ต่อเนื่อง",
  "Production route & process": "เส้นทางและกระบวนการผลิต",
  "Direct (Scope 1) emissions": "การปล่อยทางตรง (ขอบเขต 1)",
  "Indirect (electricity) emissions": "การปล่อยทางอ้อมจากไฟฟ้า",
  "Precursor / input materials": "วัตถุดิบตั้งต้น / วัตถุดิบนำเข้ากระบวนการ",
  "Carbon price paid in country of origin": "ราคาคาร์บอนที่ชำระในประเทศต้นทาง",
  "Geolocation & due-diligence engine in build — live Q4 2026.":
    "ระบบพิกัดภูมิศาสตร์และการตรวจสอบสถานะกำลังพัฒนา เปิดใช้ไตรมาส 4 ปี 2026",
  "ESRS datapoint mapping in design — live 2027.": "การจับคู่ข้อมูลตาม ESRS อยู่ระหว่างออกแบบ เปิดใช้ปี 2027",
  "Buyer-request workflow on the roadmap.": "ขั้นตอนคำขอจากผู้ซื้ออยู่ในแผนพัฒนา",
  "Tracking HMRC guidance — opens ahead of the 2027 start.":
    "กำลังติดตามแนวทางของ HMRC จะเปิดใช้ก่อนเริ่มบังคับใช้ปี 2027",

  /* ── Team & seats ─────────────────────────────────────────── */
  "Who's checking what.": "ใครตรวจอะไรอยู่",
  "Your team, and the checks each person carries right now — supplier submissions to review, reports to sign off. Assign people from any declaration; suppliers are always free and never take a seat.":
    "ทีมของคุณ และงานตรวจที่แต่ละคนรับผิดชอบอยู่ตอนนี้ ทั้งการตรวจข้อมูลที่ซัพพลายเออร์ส่งมาและการลงนามรับรองรายงาน มอบหมายคนได้จากรายการยื่นข้อมูลใดก็ได้ ซัพพลายเออร์ใช้งานฟรีเสมอและไม่นับเป็นสิทธิ์ผู้ใช้",
  "Add person": "เพิ่มบุคคล",
  "Seats used": "สิทธิ์ที่ใช้ไป",
  "Open checks": "งานตรวจที่ค้างอยู่",
  "{count} assigned in total": "มอบหมายแล้วทั้งหมด {count} รายการ",
  "assign from a declaration": "มอบหมายได้จากรายการยื่นข้อมูล",
  "External partners": "พันธมิตรภายนอก",
  "legal · verifier": "ฝ่ายกฎหมาย · ผู้ทวนสอบ",
  "Current plan": "แพ็กเกจปัจจุบัน",
  "Designated checks": "งานตรวจที่ได้รับมอบหมาย",
  "Every position is assigned to specific checks, not the whole platform — a submission review here, a report sign-off there. Assign people from a declaration's submission page or its sign-off step.":
    "แต่ละตำแหน่งได้รับมอบหมายงานตรวจเฉพาะจุด ไม่ใช่ทั้งระบบ เช่น ตรวจข้อมูลที่ส่งมาในจุดหนึ่ง และลงนามรับรองรายงานในอีกจุดหนึ่ง มอบหมายคนได้จากหน้าข้อมูลที่ส่งมาหรือขั้นตอนลงนามของรายการยื่นข้อมูล",
  "no email": "ไม่มีอีเมล",
  internal: "ภายในองค์กร",
  external: "ภายนอกองค์กร",
  "No checks assigned right now.": "ยังไม่มีงานตรวจที่ได้รับมอบหมาย",
  "Report sign-off": "การลงนามรับรองรายงาน",
  "Supplier submission": "ข้อมูลที่ซัพพลายเออร์ส่ง",
  approved: "อนุมัติแล้ว",
  "revision requested": "ขอให้แก้ไข",
  confirmed: "ยืนยันแล้ว",
  "awaiting confirmation": "รอการยืนยัน",
  "Active seats": "สิทธิ์ผู้ใช้ที่ใช้งานอยู่",
  Owner: "เจ้าของบัญชี",
  Member: "สมาชิก",
  "Legal / compliance": "ฝ่ายกฎหมาย / กำกับการปฏิบัติตามกฎ",
  "Full access · billing": "เข้าถึงได้ทั้งหมด · จัดการการเรียกเก็บเงิน",
  "Build & manage declarations": "สร้างและจัดการรายการยื่นข้อมูล",
  "Review & sign off packages": "ตรวจและลงนามรับรองชุดเอกสาร",
  "Read-only source-data access": "เข้าถึงข้อมูลต้นทางแบบอ่านอย่างเดียว",
  active: "ใช้งานอยู่",
  invited: "เชิญแล้ว",
  reviewing: "กำลังตรวจ",
  "signed off": "ลงนามแล้ว",
  "What each role can do": "แต่ละบทบาททำอะไรได้บ้าง",
  "Add someone new": "เพิ่มบุคคลใหม่",
  "The same popup lives inside every declaration — add a person while reviewing a submission or requesting sign-off, and they show up here with their designated checks.":
    "หน้าต่างเดียวกันนี้มีอยู่ในทุกรายการยื่นข้อมูล เพิ่มบุคคลได้ระหว่างตรวจข้อมูลหรือขอลงนาม แล้วเขาจะปรากฏที่นี่พร้อมงานตรวจที่ได้รับมอบหมาย",
  "They join your team roster and take a seat. Assign their first check from any declaration — a submission review or a report sign-off.":
    "เขาจะถูกเพิ่มเข้าทีมและใช้สิทธิ์ผู้ใช้หนึ่งสิทธิ์ มอบหมายงานตรวจแรกได้จากรายการยื่นข้อมูลใดก็ได้ ทั้งการตรวจข้อมูลที่ส่งมาหรือการลงนามรับรองรายงาน",
  "{name} invited": "เชิญ {name} แล้ว",
  "They now appear in every reviewer picker across your declarations.":
    "ตอนนี้เขาจะปรากฏในรายชื่อผู้ตรวจของทุกรายการยื่นข้อมูลของคุณ",

  /* ── Plan & billing ─────────────────────────────────────────
     THE WHOLE SECTION WAS REWRITTEN when the meter moved from suppliers to CN
     codes. The tier names (Starter, Standard, Enterprise) stay in English —
     they are product names, like Certrace itself, and a Thai reader signing a
     Thai contract will still see "Standard" on it. So do CN, CBAM, PDF, SLA,
     LINE and DRAFT: they are the wording of the filing or of the thing on
     screen, and translating them would make the reader translate back.

     "รหัส CN" rather than "รหัสพิกัดศุลกากร CN": the portal shows the code
     itself beside the label everywhere, so the long form only pushes the
     column wider without telling the reader anything new. */
  "Pricing that scales with CN codes, not suppliers.": "ราคาที่ปรับตามจำนวนรหัส CN ไม่ใช่จำนวนซัพพลายเออร์",
  "Three tiers, annual term. Suppliers answer for free on every tier, at any chain depth — what a plan sizes is your filing: the CN codes it covers, the sites behind them, and the people working on it.":
    "สามระดับ สัญญาแบบรายปี ซัพพลายเออร์ตอบข้อมูลได้ฟรีทุกระดับ ไม่ว่าห่วงโซ่จะลึกกี่ชั้น สิ่งที่แพ็กเกจกำหนดขนาดคือการยื่นข้อมูลของคุณ ได้แก่ รหัส CN ที่ครอบคลุม โรงงานที่อยู่เบื้องหลังรหัสเหล่านั้น และจำนวนคนที่ลงมือทำงานนี้",
  "You're on": "คุณกำลังใช้",
  "annual term · renews {date}": "สัญญารายปี · ต่ออายุ {date}",
  "suppliers free": "ซัพพลายเออร์ใช้ฟรี",
  current: "ปัจจุบัน",

  /* Usage meters */
  "Production sites": "โรงงานผลิต",
  "Reporting years open": "ปีรายงานที่เปิดอยู่",
  "Team seats": "สิทธิ์ผู้ใช้ในทีม",
  Unlimited: "ไม่จำกัด",
  "No cap on your plan.": "แพ็กเกจของคุณไม่มีเพดาน",
  "At your plan's limit.": "ถึงเพดานของแพ็กเกจแล้ว",
  "In use on {plan}.": "ใช้อยู่ในแพ็กเกจ {plan}",

  /* Tier cards */
  "Plans at a glance": "ภาพรวมแพ็กเกจ",
  "One site": "หนึ่งโรงงาน",
  "Most chosen": "เลือกมากที่สุด",
  Custom: "กำหนดเอง",
  "Everything you need, for one plant.": "ครบทุกอย่างที่ต้องใช้ สำหรับโรงงานเดียว",
  "More plants, more products, more years.": "โรงงานมากขึ้น สินค้ามากขึ้น ปีรายงานมากขึ้น",
  "No limits, and we run the year with you.": "ไม่มีขีดจำกัด และเราดูแลตลอดทั้งปีไปกับคุณ",
  /* "ขอใบเสนอราคา" — asking for a quotation, which is what a Thai exporter's
     purchasing department actually does. "ขอราคา" would read as haggling. */
  "Request the price": "ขอใบเสนอราคา",
  "Priced on scope": "คิดราคาตามขอบเขตงาน",
  "5 CN codes · annual term": "รหัส CN 5 รายการ · สัญญารายปี",
  "20 CN codes · annual term": "รหัส CN 20 รายการ · สัญญารายปี",
  "From 20+ CN codes": "ตั้งแต่รหัส CN 20 รายการขึ้นไป",
  "Price on request": "สอบถามราคา",
  "Built for": "เหมาะสำหรับ",
  "Your first CBAM year. A single production site, a focused export range, one or two people doing the work.":
    "ปี CBAM ปีแรกของคุณ โรงงานผลิตแห่งเดียว สินค้าส่งออกไม่กี่รายการ และมีคนดูแลงานนี้หนึ่งถึงสองคน",
  "Several plants, complex goods with real precursor chains, and more than one reporting year in flight.":
    "โรงงานหลายแห่ง สินค้าซับซ้อนที่มีห่วงโซ่สารตั้งต้นจริง และมีปีรายงานมากกว่าหนึ่งปีดำเนินอยู่พร้อมกัน",
  "Exporters and traders past 20 CN codes, or past five plants, who need the reporting year run with them.":
    "ผู้ส่งออกและบริษัทเทรดดิ้งที่มีรหัส CN เกิน 20 รายการ หรือโรงงานเกินห้าแห่ง และต้องการให้เราดูแลปีรายงานไปด้วยกัน",
  "Up to 5": "สูงสุด 5",
  "Up to 6": "สูงสุด 6",
  "20+ custom": "20 ขึ้นไป · กำหนดเอง",
  "Contact Sales": "ติดต่อฝ่ายขาย",

  /* Comparison table */
  "Plan comparison": "เปรียบเทียบแพ็กเกจ",
  "Feature comparison table, scrollable": "ตารางเปรียบเทียบฟีเจอร์ เลื่อนดูได้",
  Feature: "ฟีเจอร์",
  Included: "รวมอยู่ในแพ็กเกจ",
  "Not included": "ไม่รวมอยู่ในแพ็กเกจ",

  "Scope & limits": "ขอบเขตและเพดานการใช้งาน",
  "CN codes included": "รหัส CN ที่รวมอยู่ในแพ็กเกจ",
  "Reporting years open at once": "ปีรายงานที่เปิดพร้อมกันได้",
  "Suppliers — always free for them": "ซัพพลายเออร์ — ฟรีสำหรับเขาเสมอ",
  "Supply-chain tiers": "ชั้นของห่วงโซ่อุปทาน",
  "20+ · priced on scope": "20 ขึ้นไป · คิดราคาตามขอบเขตงาน",

  "Collecting from your suppliers": "การเก็บข้อมูลจากซัพพลายเออร์",
  "Suppliers answer by link — no account needed": "ซัพพลายเออร์ตอบผ่านลิงก์ ไม่ต้องสมัครบัญชี",
  "Step-by-step monthly form": "แบบฟอร์มรายเดือนแบบทีละขั้นตอน",
  "Copy last month's answers": "คัดลอกคำตอบของเดือนก่อนหน้า",
  "Thai and English everywhere": "ใช้ได้ทั้งภาษาไทยและอังกฤษทุกหน้าจอ",
  "Incomplete months are blocked": "เดือนที่กรอกไม่ครบจะส่งไม่ได้",
  "All open requests on one board": "คำขอที่ค้างอยู่ทั้งหมดรวมบนกระดานเดียว",
  "Send, resend and chase, with a record": "ส่ง ส่งซ้ำ และติดตาม พร้อมบันทึกหลักฐานทุกครั้ง",
  "Set your own due day": "กำหนดวันครบกำหนดได้เอง",

  "The calculation": "การคำนวณ",
  "Direct, indirect and precursor emissions": "การปล่อยทางตรง ทางอ้อม และจากสารตั้งต้น",
  "Sector rules applied automatically": "ใช้กฎเฉพาะกลุ่มสินค้าโดยอัตโนมัติ",
  "Every supplier in the chain, with its own figure": "ซัพพลายเออร์ทุกรายในห่วงโซ่ พร้อมค่าการปล่อยของตัวเอง",
  "Chain graded by its weakest link": "ให้เกรดห่วงโซ่ตามจุดที่อ่อนที่สุด",
  "Scrap counted as zero, automatically": "นับเศษเหล็ก (scrap) เป็นศูนย์โดยอัตโนมัติ",
  "20% default-value cap watched for you": "เฝ้าติดตามเพดานการใช้ค่าตั้งต้น 20% ให้คุณ",

  /* "Verification readiness" itself is already in the dictionary, under the
     workspace section — the group heading and the tab share one string. */
  "Shows exactly what is still missing": "บอกชัดเจนว่ายังขาดอะไรบ้าง",
  "Methodology document written for you": "จัดทำเอกสารวิธีการติดตาม (MMD) ให้คุณ",
  "Every version kept when you edit": "เก็บทุกเวอร์ชันไว้เมื่อคุณแก้ไข",
  "Documents attached to the right month": "แนบเอกสารเข้ากับเดือนที่ถูกต้อง",
  "Materiality check": "การตรวจสอบสาระสำคัญ (materiality)",
  "AI reads your documents, you approve": "AI อ่านเอกสารให้ แล้วคุณเป็นผู้อนุมัติ",

  "Sign-off & record": "การลงนามรับรองและบันทึกหลักฐาน",
  "Everything saves as you type": "บันทึกอัตโนมัติขณะที่คุณพิมพ์",
  "Sign off each month": "ลงนามรับรองเป็นรายเดือน",
  "Signature voids if the figures change": "ลายเซ็นเป็นโมฆะทันทีหากตัวเลขเปลี่ยน",
  "Send a month back for correction": "ส่งเดือนนั้นกลับไปให้แก้ไข",
  "Activity feed across all reports": "ไทม์ไลน์กิจกรรมครอบคลุมทุกรายงาน",

  "What CBAM is costing you": "ต้นทุน CBAM ที่คุณต้องแบก",
  "Your figure against the EU default": "เทียบค่าของคุณกับค่าตั้งต้นของสหภาพยุโรป",
  "Estimated certificate cost, and what you save": "ประมาณการค่าใบรับรอง และส่วนที่คุณประหยัดได้",
  "Full-year projection": "การคาดการณ์ตลอดทั้งปี",
  "Trend and sector comparison": "แนวโน้มและการเปรียบเทียบกับกลุ่มอุตสาหกรรม",
  "What each precursor adds": "สารตั้งต้นแต่ละตัวเพิ่มการปล่อยเท่าไร",

  "What you hand over": "สิ่งที่คุณส่งมอบ",
  "One PDF, with every document inside it": "ไฟล์ PDF เดียว รวมเอกสารทั้งหมดไว้ข้างใน",
  "Verifier pack showing the workings": "ชุดเอกสารสำหรับผู้ทวนสอบ พร้อมแสดงวิธีคำนวณ",
  "Incomplete work stamped DRAFT": "งานที่ยังไม่ครบจะถูกประทับว่า DRAFT",

  "Onboarding & support": "การเริ่มต้นใช้งานและการสนับสนุน",
  Onboarding: "การเริ่มต้นใช้งาน",
  Support: "การสนับสนุน",
  Training: "การอบรม",
  "Self-serve, guided in-app": "เริ่มใช้เองได้ มีคำแนะนำในระบบ",
  "Guided setup + data migration": "ตั้งค่าโดยมีผู้ดูแล + ย้ายข้อมูลให้",
  "Dedicated implementation": "ทีมวางระบบเฉพาะสำหรับคุณ",
  "Email & LINE · 2 business days": "อีเมลและ LINE · ภายใน 2 วันทำการ",
  "Priority · 1 business day": "แบบเร่งด่วน · ภายใน 1 วันทำการ",
  "Named manager · agreed SLA": "ผู้ดูแลประจำบัญชี · SLA ตามที่ตกลง",
  "Help centre and videos": "ศูนย์ช่วยเหลือและวิดีโอ",
  "One workshop for your team": "เวิร์กช็อปหนึ่งครั้งสำหรับทีมของคุณ",
  "Team and supplier training, ongoing": "อบรมทีมและซัพพลายเออร์อย่างต่อเนื่อง",

  /* Colophon */
  "Certrace · EU CBAM compliance for exporters": "Certrace · การปฏิบัติตาม CBAM ของสหภาพยุโรป สำหรับผู้ส่งออก",
  "Prices exclude VAT": "ราคายังไม่รวมภาษีมูลค่าเพิ่ม",
  "Annual term": "สัญญาแบบรายปี",

  "Need EUDR, CSRD or another origin country?": "ต้องการ EUDR, CSRD หรือประเทศต้นทางอื่นหรือไม่",
  "See what's coming": "ดูสิ่งที่กำลังจะมา",

  /* ── Plan caps, wherever the product hits one ──────────────
     One banner shape across /team, Settings and the new-workspace flow, so
     the same limit is worded the same way in Thai as in English. */
  "Your {plan} plan covers {cap} CN codes, and all of them are in use.":
    "แพ็กเกจ {plan} ของคุณครอบคลุมรหัส CN {cap} รายการ และถูกใช้ครบแล้วทั้งหมด",
  "Your {plan} plan covers {cap} production sites, and all of them are registered.":
    "แพ็กเกจ {plan} ของคุณครอบคลุมโรงงานผลิต {cap} แห่ง และลงทะเบียนครบแล้วทั้งหมด",
  "Your {plan} plan keeps {cap} reporting years open at once.":
    "แพ็กเกจ {plan} ของคุณเปิดปีรายงานพร้อมกันได้ {cap} ปี",
  "Your {plan} plan includes {cap} team seats, and all of them are taken.":
    "แพ็กเกจ {plan} ของคุณมีสิทธิ์ผู้ใช้ในทีม {cap} สิทธิ์ และถูกใช้ครบแล้วทั้งหมด",
  /* The singular forms. English needs them (Starter caps three of these at
     one); Thai does not distinguish number, so these read as the natural
     "one" sentence rather than a copy of the plural with a 1 in it. */
  "Your {plan} plan covers a single CN code, and it is in use.":
    "แพ็กเกจ {plan} ของคุณครอบคลุมรหัส CN เพียงรหัสเดียว และถูกใช้ไปแล้ว",
  "Your {plan} plan covers a single production site, and it is registered.":
    "แพ็กเกจ {plan} ของคุณครอบคลุมโรงงานผลิตเพียงแห่งเดียว และลงทะเบียนไปแล้ว",
  "Your {plan} plan keeps one reporting year open at a time.":
    "แพ็กเกจ {plan} ของคุณเปิดปีรายงานได้ครั้งละหนึ่งปี",
  "Your {plan} plan includes a single team seat, and it is taken.":
    "แพ็กเกจ {plan} ของคุณมีสิทธิ์ผู้ใช้ในทีมเพียงสิทธิ์เดียว และถูกใช้ไปแล้ว",
  "Talk to sales to raise it — suppliers stay free and unlimited either way.":
    "ติดต่อฝ่ายขายเพื่อขยายเพดาน ไม่ว่าทางใดซัพพลายเออร์ก็ยังใช้ฟรีและไม่จำกัดจำนวน",
  "Compare plans": "เปรียบเทียบแพ็กเกจ",

  /* Team & seats — the cap, once it bites */
  "No seats left on your plan.": "แพ็กเกจของคุณไม่เหลือสิทธิ์ผู้ใช้แล้ว",
  "no cap on your plan": "แพ็กเกจของคุณไม่มีเพดาน",
  "see what each tier includes →": "ดูว่าแต่ละระดับได้อะไรบ้าง →",
  "Every seat on your plan is taken. Remove someone to free one, or talk to sales — suppliers still cost nothing and never take a seat.":
    "สิทธิ์ผู้ใช้ในแพ็กเกจของคุณถูกใช้ครบแล้ว ลบใครสักคนออกเพื่อคืนสิทธิ์ หรือติดต่อฝ่ายขาย ทั้งนี้ซัพพลายเออร์ยังคงไม่มีค่าใช้จ่ายและไม่นับเป็นสิทธิ์ผู้ใช้",

  /* Suppliers — no cap on any tier, and the sub-label says so */
  "free and unlimited on every plan": "ฟรีและไม่จำกัดจำนวนในทุกแพ็กเกจ",

  /* Settings — the plan card and the site cap */
  "Suppliers are free and unlimited on every tier, at any chain depth, and never take a seat.":
    "ซัพพลายเออร์ใช้งานฟรีและไม่จำกัดจำนวนในทุกระดับแพ็กเกจ ไม่ว่าห่วงโซ่จะลึกกี่ชั้น และไม่นับเป็นสิทธิ์ผู้ใช้",
  "Every site you operate yourself. Register them here once and their monthly data lands in your inbox instead of going out to a supplier. Your plan covers one site.":
    "ทุกโรงงานที่คุณดำเนินการเอง ลงทะเบียนไว้ที่นี่ครั้งเดียว แล้วข้อมูลรายเดือนของโรงงานจะเข้ากล่องงานของคุณแทนที่จะส่งออกไปหาซัพพลายเออร์ แพ็กเกจของคุณครอบคลุมหนึ่งโรงงาน",
  "Every site you operate yourself. Register them here once and their monthly data lands in your inbox instead of going out to a supplier. Your plan covers {cap} sites.":
    "ทุกโรงงานที่คุณดำเนินการเอง ลงทะเบียนไว้ที่นี่ครั้งเดียว แล้วข้อมูลรายเดือนของโรงงานจะเข้ากล่องงานของคุณแทนที่จะส่งออกไปหาซัพพลายเออร์ แพ็กเกจของคุณครอบคลุมโรงงาน {cap} แห่ง",

  /* New workspace — a new CN code, or a new reporting year */
  "CN {code} would be a new code on your plan.": "CN {code} จะนับเป็นรหัสใหม่ในแพ็กเกจของคุณ",
  "Codes you already report — and any number of sites or years reporting them — cost nothing more.":
    "รหัสที่คุณรายงานอยู่แล้ว จะมีโรงงานหรือปีรายงานที่ใช้รหัสนั้นกี่แห่งกี่ปีก็ตาม ไม่มีค่าใช้จ่ายเพิ่ม",
  "{year} would be a new reporting year. Archiving a finished year frees its slot — nothing behind it is deleted.":
    "ปี {year} จะนับเป็นปีรายงานใหม่ การจัดเก็บปีที่เสร็จแล้วเข้าคลังจะคืนช่องให้ทันที โดยไม่มีข้อมูลใดถูกลบ",

  /* Still referenced outside the billing screen. */
  "Talk to sales": "ติดต่อฝ่ายขาย",
  Update: "อัปเดต",
  Confirmed: "ยืนยันแล้ว",
  annual: "รายปี",

  /* ── Settings ─────────────────────────────────────────────── */
  "Account & organisation.": "บัญชีและองค์กร",
  "Locale and identity for your organisation, your personal profile, and how Certrace keeps you posted.":
    "ภาษาและข้อมูลระบุตัวตนขององค์กร โปรไฟล์ส่วนตัวของคุณ และวิธีที่ Certrace แจ้งข่าวถึงคุณ",
  Organisation: "องค์กร",
  Profile: "โปรไฟล์",
  "Privacy & security": "ความเป็นส่วนตัวและความปลอดภัย",
  Company: "บริษัท",
  "Legal name": "ชื่อตามกฎหมาย",
  "Primary sector": "กลุ่มสินค้าหลัก",
  "Select primary sector": "เลือกกลุ่มสินค้าหลัก",
  "Which CBAM-affected industry your organisation reports under.":
    "องค์กรของคุณรายงานภายใต้อุตสาหกรรมใดที่ได้รับผลจาก CBAM",
  "Operator / facility reference": "รหัสอ้างอิงผู้ประกอบการ / โรงงาน",
  "Your operator reference — shared with buyers and used for O3CI matching. (Exporters are never the CBAM declarant; the EU importer's declarant files.)":
    "รหัสอ้างอิงผู้ประกอบการของคุณ ใช้แบ่งปันกับผู้ซื้อและจับคู่ในระบบ O3CI (ผู้ส่งออกไม่ใช่ผู้ยื่น CBAM ผู้ยื่นคือตัวแทนของผู้นำเข้าในสหภาพยุโรป)",
  "Locale & units": "ภาษา หน่วยวัด และรูปแบบตัวเลข",
  "Locale": "ภาษาและภูมิภาค",
  "Operating jurisdiction": "เขตอำนาจที่ดำเนินกิจการ",
  "Sets the localised emission-factor library and number formats.":
    "กำหนดชุดค่าการปล่อยก๊าซประจำประเทศและรูปแบบตัวเลข",
  "Display currency": "สกุลเงินที่แสดง",
  "Emission unit": "หน่วยการปล่อยก๊าซ",
  Plan: "แพ็กเกจ",
  "Manage plan": "จัดการแพ็กเกจ",
  "Your profile": "โปรไฟล์ของคุณ",
  "First name": "ชื่อ",
  "Enter your first name": "กรอกชื่อของคุณ",
  "Last name": "นามสกุล",
  "Enter your last name": "กรอกนามสกุลของคุณ",
  Username: "ชื่อผู้ใช้",
  "generated automatically from your name.": "สร้างอัตโนมัติจากชื่อของคุณ",
  "Job title": "ตำแหน่งงาน",
  "Select job title": "เลือกตำแหน่งงาน",
  "Specify job title": "ระบุตำแหน่งงาน",
  "e.g. Regional Trade Manager": "เช่น ผู้จัดการการค้าประจำภูมิภาค",
  Other: "อื่น ๆ",
  "Head of Export Ops": "หัวหน้าฝ่ายปฏิบัติการส่งออก",
  "Compliance Manager": "ผู้จัดการฝ่ายกำกับการปฏิบัติตามกฎ",
  "Sustainability / ESG Manager": "ผู้จัดการด้านความยั่งยืน / ESG",
  "Supply Chain Manager": "ผู้จัดการห่วงโซ่อุปทาน",
  "Trade Compliance Officer": "เจ้าหน้าที่กำกับการปฏิบัติตามกฎการค้า",
  "Finance Manager": "ผู้จัดการฝ่ายการเงิน",
  "Managing Director / CEO": "กรรมการผู้จัดการ / ซีอีโอ",
  "Legal Counsel": "ที่ปรึกษากฎหมาย",
  "Save profile": "บันทึกโปรไฟล์",
  "Account identity": "ข้อมูลระบุตัวตนของบัญชี",
  "Account ID": "รหัสบัญชี",
  "This ID is permanent and never changes — your declarations, suppliers and seats stay attached to it even if the email below changes. If the person who set up this account leaves the company, ownership can move to a new email without losing any history.":
    "รหัสนี้ถาวรและไม่เปลี่ยนแปลง รายการยื่นข้อมูล ซัพพลายเออร์ และสิทธิ์ผู้ใช้ของคุณผูกอยู่กับรหัสนี้แม้อีเมลด้านล่างจะเปลี่ยนไป หากผู้ที่เปิดบัญชีนี้ลาออก สามารถโอนความเป็นเจ้าของไปยังอีเมลใหม่ได้โดยไม่สูญเสียประวัติใด ๆ",
  "Member since": "เป็นสมาชิกตั้งแต่",
  "Email address": "ที่อยู่อีเมล",
  "Primary — used to sign in and receive alerts.": "อีเมลหลัก ใช้เข้าสู่ระบบและรับการแจ้งเตือน",
  "Verification sent to": "ส่งอีเมลยืนยันไปที่",
  "Click the link there to finish the switch — nothing changes until you confirm, and your account, history and org access stay exactly the same.":
    "คลิกลิงก์ในอีเมลเพื่อเปลี่ยนให้เสร็จสมบูรณ์ จะไม่มีอะไรเปลี่ยนจนกว่าคุณจะยืนยัน และบัญชี ประวัติ รวมถึงสิทธิ์เข้าถึงองค์กรของคุณยังคงเดิมทุกประการ",
  "Change email": "เปลี่ยนอีเมล",
  "New email": "อีเมลใหม่",
  "Confirm current password": "ยืนยันรหัสผ่านปัจจุบัน",
  "For your security, we verify it's really you before changing anything.":
    "เพื่อความปลอดภัย เราจะยืนยันตัวตนของคุณก่อนเปลี่ยนแปลงข้อมูลใด ๆ",
  "That password isn't correct.": "รหัสผ่านไม่ถูกต้อง",
  "Sending…": "กำลังส่ง…",
  "Send verification": "ส่งอีเมลยืนยัน",
  Security: "ความปลอดภัย",
  "Account activity that matters — sign-ins, password changes and security alerts.":
    "กิจกรรมบัญชีที่สำคัญ ทั้งการเข้าสู่ระบบ การเปลี่ยนรหัสผ่าน และการแจ้งเตือนด้านความปลอดภัย",
  "Updates on declaration progress, approvals, revisions and reporting deadlines.":
    "อัปเดตความคืบหน้าของรายการยื่นข้อมูล การอนุมัติ การแก้ไข และกำหนดส่งรายงาน",
  "When a supplier is invited, submits their data, or needs a follow-up.":
    "เมื่อมีการเชิญซัพพลายเออร์ เมื่อเขาส่งข้อมูล หรือเมื่อต้องติดตาม",
  "AI Review & Compliance": "การตรวจด้วย AI และการปฏิบัติตามกฎ",
  "When AI flags an issue, finishes validating a submission, or compliance action is needed.":
    "เมื่อ AI พบปัญหา ตรวจสอบข้อมูลที่ส่งมาเสร็จ หรือมีเรื่องที่ต้องดำเนินการตามกฎ",
  Documents: "เอกสาร",
  "Missing, uploaded, approved, rejected or expiring documents.":
    "เอกสารที่ขาด อัปโหลดแล้ว อนุมัติแล้ว ถูกปฏิเสธ หรือใกล้หมดอายุ",
  "Product updates": "อัปเดตผลิตภัณฑ์",
  "New features, improvements and platform announcements.": "ฟีเจอร์ใหม่ การปรับปรุง และประกาศเกี่ยวกับแพลตฟอร์ม",
  "Always on — protects your account": "เปิดตลอดเวลา เพื่อปกป้องบัญชีของคุณ",
  "Change password": "เปลี่ยนรหัสผ่าน",
  "Current password": "รหัสผ่านปัจจุบัน",
  "New password": "รหัสผ่านใหม่",
  "At least 8 characters": "อย่างน้อย 8 อักขระ",
  "Confirm new password": "ยืนยันรหัสผ่านใหม่",
  "Re-enter new password": "กรอกรหัสผ่านใหม่อีกครั้ง",
  "Passwords don't match.": "รหัสผ่านไม่ตรงกัน",
  "Update password": "อัปเดตรหัสผ่าน",
  "Updating…": "กำลังอัปเดต…",
  Updated: "อัปเดตแล้ว",
  "Device login": "อุปกรณ์ที่เข้าสู่ระบบ",
  "Sign out of all other devices": "ออกจากระบบอุปกรณ์อื่นทั้งหมด",
  "Signing out of all other devices…": "กำลังออกจากระบบอุปกรณ์อื่นทั้งหมด…",
  "this device": "อุปกรณ์นี้",
  "Active now": "ใช้งานอยู่ขณะนี้",
  "2 days ago": "2 วันก่อน",
  "9 days ago": "9 วันก่อน",
  Cookies: "คุกกี้",
  "Configure how cookies are used across the platform — essential cookies keep you signed in; the rest are optional.":
    "ตั้งค่าการใช้คุกกี้ทั่วทั้งแพลตฟอร์ม คุกกี้ที่จำเป็นช่วยให้คุณอยู่ในระบบ ส่วนที่เหลือเลือกได้",
  "Manage cookies": "จัดการคุกกี้",
  Legal: "ข้อกฎหมาย",
  "Terms & Conditions": "ข้อกำหนดและเงื่อนไข",
  "Review the terms and conditions for using the platform and its services.":
    "อ่านข้อกำหนดและเงื่อนไขการใช้แพลตฟอร์มและบริการ",
  "Privacy Policy": "นโยบายความเป็นส่วนตัว",
  "Learn how your personal data is collected, used and protected in accordance with applicable laws.":
    "ดูว่าข้อมูลส่วนบุคคลของคุณถูกเก็บ ใช้ และคุ้มครองอย่างไรตามกฎหมายที่เกี่ยวข้อง",
  Essential: "จำเป็น",
  "Required to keep you signed in. Can't be disabled.": "จำเป็นเพื่อให้คุณอยู่ในระบบ ปิดไม่ได้",
  Analytics: "การวิเคราะห์การใช้งาน",
  "Helps us see which parts of Certrace actually get used.": "ช่วยให้เราเห็นว่าส่วนใดของ Certrace ถูกใช้งานจริง",
  Marketing: "การตลาด",
  "Used to tailor announcements about new coverage and features.":
    "ใช้ปรับแต่งประกาศเกี่ยวกับขอบเขตและฟีเจอร์ใหม่",
  "Essential cookies": "คุกกี้ที่จำเป็น",
  "Analytics cookies": "คุกกี้เพื่อการวิเคราะห์",
  "Marketing cookies": "คุกกี้เพื่อการตลาด",
  "Save preferences": "บันทึกการตั้งค่า",

  /* ── Carbon & cost (insights) ─────────────────────────────── */
  "Where the carbon is.": "คาร์บอนอยู่ตรงไหน",
  "Every declaration in one place: what the certificates cost, which suppliers and goods carry the emissions, and whose data has aged past the point you should still be filing it.":
    "รวมทุกรายการยื่นข้อมูลไว้ที่เดียว ทั้งต้นทุนใบรับรอง ซัพพลายเออร์และสินค้าที่ปล่อยก๊าซมากที่สุด และข้อมูลของใครที่เก่าเกินกว่าจะนำไปยื่นต่อ",
  "Open cycles": "รอบที่ยังเปิดอยู่",
  "All time": "ทั้งหมด",
  "Reading supplier records…": "กำลังอ่านข้อมูลซัพพลายเออร์…",
  "No approved emissions data yet.": "ยังไม่มีข้อมูลการปล่อยก๊าซที่อนุมัติแล้ว",
  "Once suppliers submit and you approve their figures, the cost, the hotspots and the benchmark all appear here — across every declaration at once.":
    "เมื่อซัพพลายเออร์ส่งข้อมูลและคุณอนุมัติตัวเลขแล้ว ต้นทุน จุดร้อน และค่าเปรียบเทียบจะแสดงที่นี่ ครอบคลุมทุกรายการยื่นข้อมูลพร้อมกัน",
  "Go to declarations": "ไปที่รายการยื่นข้อมูล",
  "Certificate cost": "ต้นทุนใบรับรอง",
  "Chargeable tCO₂e": "tCO₂e ที่ต้องเสียค่าใช้จ่าย",
  "{tonnes} t reported": "รายงานไว้ {tonnes} ตัน",
  "Suppliers costed": "ซัพพลายเออร์ที่คิดต้นทุนแล้ว",
  "Saved vs defaults": "ประหยัดได้เทียบกับค่าตั้งต้น",
  "Above defaults": "สูงกว่าค่าตั้งต้น",
  "real data vs fallback": "ข้อมูลจริงเทียบกับค่าสำรอง",
  "Priced at": "คิดราคาที่",
  "{amount} on every tonne you ship. An estimate for planning: the declarant buys at the published auction average for the week of import.":
    "{amount} ต่อสินค้าทุกหนึ่งตันที่คุณส่งออก เป็นค่าประมาณเพื่อการวางแผน ผู้ยื่นจะซื้อที่ราคาเฉลี่ยการประมูลที่ประกาศในสัปดาห์ที่นำเข้า",
  "Certificate price in EUR per tonne CO2e": "ราคาใบรับรองเป็นยูโรต่อ CO₂e หนึ่งตัน",
  "Carbon hotspots": "จุดที่ปล่อยคาร์บอนสูง",
  "Ranked by absolute chargeable emissions across every declaration in scope — the same mill appearing on four filings counts once, as one relationship.":
    "จัดอันดับตามปริมาณการปล่อยที่ต้องเสียค่าใช้จ่ายรวมทุกรายการยื่นข้อมูลในขอบเขต โรงงานเดียวที่ปรากฏในสี่รายการนับเป็นหนึ่งความสัมพันธ์",
  "by supplier": "ตามซัพพลายเออร์",
  "by product": "ตามสินค้า",
  "{count} of {total} suppliers": "ซัพพลายเออร์ {count} จาก {total} ราย",
  "carry {pct}% of your chargeable emissions — about {amount} in certificates. That's the shortlist for a conversation about actual data, a cleaner route, or a different supplier.":
    "คิดเป็น {pct}% ของการปล่อยที่ต้องเสียค่าใช้จ่าย หรือราว {amount} ในรูปใบรับรอง นี่คือรายชื่อที่ควรคุยเรื่องข้อมูลจริง เส้นทางการผลิตที่สะอาดกว่า หรือเปลี่ยนซัพพลายเออร์",
  "Data that needs refreshing": "ข้อมูลที่ต้องอัปเดต",
  "Supplier records age. A figure past a year, or one reported for a period you're no longer filing, has to be re-confirmed before it goes into another declaration.":
    "ข้อมูลซัพพลายเออร์มีอายุ ตัวเลขที่เกินหนึ่งปี หรือที่รายงานไว้สำหรับรอบที่คุณไม่ได้ยื่นแล้ว ต้องยืนยันใหม่ก่อนนำไปใช้ในรายการยื่นข้อมูลอื่น",
  "No supplier records yet — they build up as suppliers submit, and each one makes the next request shorter.":
    "ยังไม่มีข้อมูลซัพพลายเออร์ ข้อมูลจะสะสมขึ้นเมื่อซัพพลายเออร์ส่งข้อมูล และแต่ละครั้งจะทำให้คำขอครั้งถัดไปสั้นลง",
  "Your one supplier record is current.": "ข้อมูลซัพพลายเออร์รายเดียวของคุณเป็นปัจจุบัน",
  "All {count} supplier records are current.": "ข้อมูลซัพพลายเออร์ทั้ง {count} รายเป็นปัจจุบัน",
  "{count} goods on file": "มีสินค้าในระบบ {count} รายการ",
  "fed {count} declarations": "ใช้ในรายการยื่นข้อมูล {count} รายการ",
  "last updated {days}d ago": "อัปเดตล่าสุด {days} วันก่อน",
  "What this is built from": "ข้อมูลนี้สร้างจากอะไร",
  "{datasets} submitted supplier datasets across {declarations} declarations, costed with the same engine the declaration workspace uses — the Annex II direct-only rule for steel and aluminium, default-value markups where a supplier reported on defaults, and any carbon price already paid deducted. Nothing here is a filed figure.":
    "ชุดข้อมูลจากซัพพลายเออร์ {datasets} ชุด ครอบคลุม {declarations} รายการยื่นข้อมูล คิดต้นทุนด้วยระบบเดียวกับพื้นที่ทำงานของรายการยื่นข้อมูล ทั้งกฎ Annex II ที่นับเฉพาะการปล่อยทางตรงสำหรับเหล็กและอะลูมิเนียม ส่วนเพิ่มของค่าตั้งต้นเมื่อซัพพลายเออร์รายงานด้วยค่าตั้งต้น และหักราคาคาร์บอนที่ชำระไปแล้ว ตัวเลขทั้งหมดนี้ไม่ใช่ตัวเลขที่ยื่นจริง",
  fresh: "เป็นปัจจุบัน",
  aging: "เริ่มเก่า",
  stale: "เก่าเกินไป",
  unknown: "ไม่ทราบ",

  /* ── Auth (sign in · register · reset) ──────────────────────
     These screens are pinned to English (EnglishOnly, lib/i18n.tsx) — the
     pairs below are kept because the same strings are reused elsewhere, and
     because the switcher starting on /onboarding is a product decision that
     may move. The superseded brand-panel headline, its sub-line and the
     "CBAM live / EUDR · CSRD soon" chips were dropped with the copy itself:
     the regulation story is EU CBAM only. */
  "94% avg completion": "ความสมบูรณ์เฉลี่ย 94%",
  "6× faster filing": "ยื่นเร็วขึ้น 6 เท่า",
  "Continue with Google": "ดำเนินการต่อด้วย Google",
  "Sign up with Google": "สมัครด้วย Google",
  "Connecting…": "กำลังเชื่อมต่อ…",
  "or sign in with email": "หรือเข้าสู่ระบบด้วยอีเมล",
  "or sign up with email": "หรือสมัครด้วยอีเมล",
  "Too weak": "อ่อนมาก",
  Weak: "อ่อน",
  Okay: "พอใช้",
  Good: "ดี",
  Strong: "แข็งแรง",
  "Exporter portal": "พอร์ทัลผู้ส่งออก",
  "Sign in to continue.": "เข้าสู่ระบบเพื่อดำเนินการต่อ",
  "Work email": "อีเมลที่ทำงาน",
  Password: "รหัสผ่าน",
  "Forgot password?": "ลืมรหัสผ่าน",
  "Signing in…": "กำลังเข้าสู่ระบบ…",
  "Sign in": "เข้าสู่ระบบ",
  "New to Certrace?": "เพิ่งเริ่มใช้ Certrace",
  "Create an account": "สร้างบัญชี",
  "Create your account.": "สร้างบัญชีของคุณ",
  "One account per company. Add teammates as seats once you're in.":
    "หนึ่งบัญชีต่อหนึ่งบริษัท เพิ่มเพื่อนร่วมทีมเป็นสิทธิ์ผู้ใช้ได้หลังเข้าระบบ",
  "Confirm password": "ยืนยันรหัสผ่าน",
  "Re-enter password": "กรอกรหัสผ่านอีกครั้ง",
  "I agree to Certrace's": "ฉันยอมรับ",
  and: "และ",
  "Creating account…": "กำลังสร้างบัญชี…",
  "Create account": "สร้างบัญชี",
  "Already have an account?": "มีบัญชีอยู่แล้ว",
  "Back to sign in": "กลับไปหน้าเข้าสู่ระบบ",
  "Reset your password.": "ตั้งรหัสผ่านใหม่",
  "Enter the email on your account and we'll send a link to reset it.":
    "กรอกอีเมลของบัญชีคุณ แล้วเราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้",
  "Send reset link": "ส่งลิงก์ตั้งรหัสผ่านใหม่",
  "Check your email": "ตรวจสอบอีเมลของคุณ",
  "Reset link sent.": "ส่งลิงก์ตั้งรหัสผ่านใหม่แล้ว",
  "We've sent a password reset link to": "เราส่งลิงก์ตั้งรหัสผ่านใหม่ไปที่",
  "It expires in 15 minutes — if it doesn't show up, check spam.":
    "ลิงก์หมดอายุใน 15 นาที หากไม่พบอีเมล กรุณาตรวจสอบในกล่องจดหมายขยะ",
  "Resend in {seconds}s": "ส่งอีกครั้งใน {seconds} วินาที",
  "Resend link": "ส่งลิงก์อีกครั้ง",

  /* ── Supplier detail ──────────────────────────────────────── */
  "Production Installation": "โรงงานผู้ผลิต",
  "Send reminder": "ส่งการแจ้งเตือน",
  "Reminder sent to {name}.": "ส่งการแจ้งเตือนถึง {name} แล้ว",
  "They get a fresh guided-form link.": "เขาจะได้รับลิงก์แบบฟอร์มใหม่",
  "Downloading report for {name}…": "กำลังดาวน์โหลดรายงานของ {name}…",
  "Downloading documents for {name}…": "กำลังดาวน์โหลดเอกสารของ {name}…",
  "Open guided form": "เปิดแบบฟอร์มแบบมีคำแนะนำ",
  "Products supplied": "สินค้าที่จัดหาให้",
  "tCO₂e/t latest": "tCO₂e/t ล่าสุด",
  "Declaration status": "สถานะรายการยื่นข้อมูล",
  "Data & Documents": "ข้อมูลและเอกสาร",
  "Third-party verified": "ทวนสอบโดยหน่วยงานภายนอก",
  "Internally verified": "ทวนสอบภายใน",
  "Not verified": "ยังไม่ทวนสอบ",
  "Required fields": "ช่องข้อมูลที่จำเป็น",
  "Documents uploaded": "เอกสารที่อัปโหลดแล้ว",
  "Missing information": "ข้อมูลที่ยังขาด",
  "Electricity consumption data": "ข้อมูลปริมาณการใช้ไฟฟ้า",
  "Production route details": "รายละเอียดเส้นทางการผลิต",
  "All mandatory CBAM data": "ข้อมูล CBAM ที่จำเป็นทั้งหมด",
  "Submitted reports": "รายงานที่ส่งแล้ว",
  "No verified reports yet.": "ยังไม่มีรายงานที่ทวนสอบแล้ว",
  "Pending requests": "คำขอที่ค้างอยู่",
  "No documents on file yet.": "ยังไม่มีเอกสารในระบบ",
  Activity: "ความเคลื่อนไหว",
  "Submitted verified CBAM data": "ส่งข้อมูล CBAM ที่ทวนสอบแล้ว",
  "Reminder sent — response overdue": "ส่งการแจ้งเตือนแล้ว — เลยกำหนดตอบกลับ",
  "Opened the guided form": "เปิดแบบฟอร์มแบบมีคำแนะนำ",

  /* ── Add person / declaration menu ────────────────────────── */
  Team: "ทีมงาน",
  "Add a person": "เพิ่มบุคคล",
  "They join your team list and can be assigned to any check. We email them an invite with scoped, read-only access — they never see anything outside what you share.":
    "เขาจะถูกเพิ่มเข้ารายชื่อทีมและมอบหมายงานตรวจใดก็ได้ เราจะส่งอีเมลเชิญพร้อมสิทธิ์อ่านอย่างเดียวเฉพาะส่วนที่คุณแบ่งปัน เขาจะไม่เห็นข้อมูลอื่นเลย",
  "e.g. Preeda C.": "เช่น ปรีดา ช.",
  Position: "ตำแหน่ง",
  "ESG / Sustainability": "ESG / ความยั่งยืน",
  "Legal counsel": "ที่ปรึกษากฎหมาย",
  Finance: "การเงิน",
  Management: "ฝ่ายบริหาร",
  "Add & invite": "เพิ่มและส่งคำเชิญ",
  "Duplicate as draft": "ทำสำเนาเป็นฉบับร่าง",
  "Duplicated as a draft": "ทำสำเนาเป็นฉบับร่างแล้ว",
  "Scope and suppliers copied — adjust the period and quantities.":
    "คัดลอกขอบเขตและซัพพลายเออร์แล้ว ปรับรอบรายงานและปริมาณได้เลย",
  "Copy link": "คัดลอกลิงก์",
  "Link copied": "คัดลอกลิงก์แล้ว",
  "Anyone on your team with a seat can open it.": "คนในทีมที่มีสิทธิ์ใช้งานเปิดได้ทุกคน",
  "Delete declaration": "ลบรายการยื่นข้อมูล",
  "Click again to confirm": "คลิกอีกครั้งเพื่อยืนยัน",
  "Declaration deleted": "ลบรายการยื่นข้อมูลแล้ว",
  "Supplier submissions stay on their own record.": "ข้อมูลที่ซัพพลายเออร์ส่งยังคงอยู่ในบันทึกของเขาเอง",
  "Actions for {name}": "การดำเนินการสำหรับ {name}",
  "More actions": "การดำเนินการเพิ่มเติม",

  /* ── Declaration workspace ────────────────────────────────── */
  "All submissions": "ข้อมูลที่ส่งมาทั้งหมด",
  Insights: "มุมมองเชิงลึก",
  "Cost & carbon": "ต้นทุนและคาร์บอน",
  "Compliance intelligence": "การวิเคราะห์การปฏิบัติตามกฎ",
  "Verification trail": "ร่องรอยการตรวจสอบ",
  "Loading submissions…": "กำลังโหลดข้อมูลที่ส่งมา…",
  "Supplier data": "ข้อมูลจากซัพพลายเออร์",
  "Generate report": "สร้างรายงาน",
  "Internal sign-off": "การลงนามรับรองภายใน",
  "Send & export": "ส่งและส่งออก",
  "{approved}/{total} approved": "อนุมัติแล้ว {approved}/{total}",
  "PDF + XML generated": "สร้าง PDF + XML แล้ว",
  "ready to generate": "พร้อมสร้าง",
  "needs all approvals": "ต้องอนุมัติให้ครบก่อน",
  "{confirmed}/{total} confirmed": "ยืนยันแล้ว {confirmed}/{total}",
  "send for confirmation": "ส่งเพื่อขอการยืนยัน",
  "needs the report": "ต้องมีรายงานก่อน",
  dispatched: "ส่งออกแล้ว",
  "O3CI · buyer · verifier": "O3CI · ผู้ซื้อ · ผู้ทวนสอบ",
  "Open this step": "เปิดขั้นตอนนี้",
  "{count} new submissions ready for review": "มีข้อมูลใหม่ {count} รายการ พร้อมให้ตรวจ",
  "Supplier data has been updated.": "ข้อมูลจากซัพพลายเออร์ได้รับการอัปเดตแล้ว",
  "{count} submissions": "ข้อมูลที่ส่งมา {count} รายการ",
  "waiting for your review.": "รอให้คุณตรวจ",
  "Review supplier data": "ตรวจข้อมูลจากซัพพลายเออร์",
  "Waiting on you —": "รอคุณดำเนินการ —",
  "Waiting on suppliers —": "รอซัพพลายเออร์ —",
  "{count} suppliers haven't submitted": "ซัพพลายเออร์ {count} รายยังไม่ส่งข้อมูล",
  "{count} self-supplied products still to fill in": "สินค้าที่ผลิตเอง {count} รายการยังต้องกรอก",
  "{count} revisions still with the supplier": "การแก้ไข {count} รายการยังอยู่ที่ซัพพลายเออร์",
  "Fill in our data": "กรอกข้อมูลของเรา",
  "Edit our data": "แก้ไขข้อมูลของเรา",
  "See who's outstanding": "ดูว่าใครยังค้างอยู่",
  "All supplier data approved.": "อนุมัติข้อมูลจากซัพพลายเออร์ครบแล้ว",
  "Generate the report package.": "สร้างชุดเอกสารรายงาน",
  "Report generated.": "สร้างรายงานแล้ว",
  "Send it for internal sign-off.": "ส่งเพื่อขอลงนามรับรองภายใน",
  "Send for sign-off": "ส่งเพื่อขอลงนาม",
  "Waiting on": "กำลังรอ",
  "{count} internal confirmations": "การยืนยันภายใน {count} รายการ",
  "View sign-off": "ดูการลงนาม",
  "Registry pre-flight failed.": "การตรวจก่อนส่งเข้าระบบทะเบียนไม่ผ่าน",
  "Fix the flagged submissions before anything is sent.": "แก้ไขข้อมูลที่ถูกทำเครื่องหมายไว้ก่อนส่งออกใด ๆ",
  "View issues": "ดูปัญหา",
  "Signed off.": "ลงนามรับรองแล้ว",
  "Ready to send & export.": "พร้อมส่งและส่งออก",
  "Dispatched —": "ส่งออกแล้ว —",
  "{acked}/{wanted} recipients": "ผู้รับ {acked}/{wanted} ราย",
  "acknowledged.": "ยืนยันการรับแล้ว",
  "Track acknowledgements": "ติดตามการยืนยันการรับ",
  "Cycle complete.": "รอบนี้เสร็จสมบูรณ์",
  "All recipients acknowledged.": "ผู้รับทุกรายยืนยันการรับแล้ว",
  "{step} is locked for now.": "{step} ยังถูกล็อกอยู่",
  "Go to {step}": "ไปที่ {step}",
  "Every supplier submission must be approved before the report can be generated — the package only ever contains verified data.":
    "ต้องอนุมัติข้อมูลจากซัพพลายเออร์ทุกรายก่อนจึงจะสร้างรายงานได้ ชุดเอกสารจะมีเฉพาะข้อมูลที่ทวนสอบแล้วเท่านั้น",
  "Generate the report first — sign-off is a confirmation of the exact package that will be sent.":
    "สร้างรายงานก่อน การลงนามคือการยืนยันชุดเอกสารฉบับที่จะถูกส่งออกจริง",
  "Internal sign-off must be complete before anything is dispatched — every requested confirmation has to land first.":
    "ต้องลงนามรับรองภายในให้ครบก่อนจึงจะส่งออกได้ ทุกการยืนยันที่ร้องขอไว้ต้องเข้ามาครบ",
  "Awaiting review": "รอการตรวจ",
  "Changes requested": "ขอให้แก้ไข",
  Approved: "อนุมัติแล้ว",
  "Supplier submissions": "ข้อมูลที่ซัพพลายเออร์ส่งมา",
  "Each supplier filled their own Smart Link, the AI checked it, they e-signed and submitted. Open a submission to read the data, loop in your internal reviewers, then approve it or request a revision.":
    "ซัพพลายเออร์แต่ละรายกรอกผ่าน Smart Link ของตนเอง ระบบ AI ตรวจสอบ แล้วเขาลงลายมือชื่ออิเล็กทรอนิกส์และส่งข้อมูล เปิดรายการเพื่ออ่านข้อมูล ดึงผู้ตรวจภายในเข้ามาร่วม แล้วอนุมัติหรือขอให้แก้ไข",
  "{count} of these products are produced by you — no link goes out for them; fill them in here and they run through the same checks.":
    "สินค้า {count} รายการในนี้ผลิตโดยคุณเอง จึงไม่มีการส่งลิงก์ออกไป กรอกข้อมูลที่นี่ได้เลย และจะผ่านการตรวจแบบเดียวกัน",
  "Reminder sent": "ส่งการแจ้งเตือนแล้ว",
  "{name} nudged by email to complete their Smart Link.": "ส่งอีเมลเตือน {name} ให้กรอก Smart Link ให้เสร็จแล้ว",
  "from record": "จากบันทึกเดิม",
  "Pulled from this company's own supplier record — they answered these goods on another declaration":
    "ดึงมาจากบันทึกของบริษัทนี้เอง เขาเคยตอบข้อมูลสินค้าเหล่านี้ในรายการยื่นข้อมูลอื่นแล้ว",
  score: "คะแนน",
  "reminded {ago}": "เตือนเมื่อ {ago}",
  "Copy Smart Link": "คัดลอก Smart Link",
  Remind: "เตือน",
  awaiting: "รออยู่",
  "changes requested": "ขอให้แก้ไข",
  Submission: "ข้อมูลที่ส่ง",
  "Submission approved": "อนุมัติข้อมูลที่ส่งแล้ว",
  "{name} · v{version} locked into the compliance dataset.":
    "{name} · เวอร์ชัน {version} ถูกล็อกเข้าชุดข้อมูลการปฏิบัติตามกฎแล้ว",
  "signed by {name} ({role})": "ลงนามโดย {name} ({role})",
  "our own installation": "โรงงานของเราเอง",
  "CBAM-critical: this supplier carries a major share of the declaration's embedded emissions — the package can't be filed without them.":
    "สำคัญต่อ CBAM: ซัพพลายเออร์รายนี้คิดเป็นสัดส่วนหลักของการปล่อยที่ฝังอยู่ในรายการยื่นข้อมูลนี้ หากขาดข้อมูลของเขา ชุดเอกสารจะยื่นไม่ได้",

  /* ── Catalogue product groups (the grouping label only — the goods
        themselves keep their Annex I names) ─────────────────── */
  "Primary inputs": "วัตถุดิบตั้งต้น",
  "Semi-finished": "กึ่งสำเร็จรูป",
  "Long products": "ผลิตภัณฑ์ทรงยาว",
  "Flat products": "ผลิตภัณฑ์ทรงแบน",
  "Tubes & pipes": "ท่อและหลอด",
  "Stainless & alloy": "สเตนเลสและโลหะผสม",
  Articles: "ผลิตภัณฑ์สำเร็จรูป",
  Unwrought: "โลหะปฐมภูมิ",
  "Wrought products": "ผลิตภัณฑ์ขึ้นรูป",

  /* ── Onboarding ───────────────────────────────────────────── */
  "Your organisation": "องค์กรของคุณ",
  "A few details so we can set up your workspace and CBAM template correctly.":
    "ขอข้อมูลเล็กน้อย เพื่อตั้งค่าพื้นที่ทำงานและแม่แบบ CBAM ให้ถูกต้อง",
  "Who should suppliers and teammates expect to hear from?": "ซัพพลายเออร์และเพื่อนร่วมทีมจะได้รับการติดต่อจากใคร",
  "Your needs": "ความต้องการของคุณ",
  "Your business": "ธุรกิจของคุณ",
  "Understanding your needs": "ทำความเข้าใจความต้องการของคุณ",
  "A few quick questions so Certrace fits how you actually work.":
    "คำถามสั้น ๆ เพื่อให้ Certrace เข้ากับวิธีทำงานจริงของคุณ",
  "Simplify CBAM reporting": "ทำให้การรายงาน CBAM ง่ายขึ้น",
  "Collect supplier emissions data": "เก็บข้อมูลการปล่อยก๊าซจากซัพพลายเออร์",
  "Calculate product emissions": "คำนวณการปล่อยก๊าซของสินค้า",
  "Ensure CBAM compliance": "ให้มั่นใจว่าปฏิบัติตาม CBAM",
  "Reduce manual work": "ลดงานที่ต้องทำด้วยมือ",
  "Reduce external consulting costs": "ลดค่าใช้จ่ายที่ปรึกษาภายนอก",
  "Prepare for verification": "เตรียมพร้อมสำหรับการทวนสอบหรือการตรวจสอบ",
  "Learn about CBAM requirements": "เรียนรู้ข้อกำหนดของ CBAM",
  "How are you currently managing CBAM compliance?": "ปัจจุบันคุณจัดการเรื่อง CBAM อย่างไร",
  "Excel or spreadsheets": "Excel หรือสเปรดชีต",
  "Email and PDF forms": "อีเมลและแบบฟอร์ม PDF",
  "Internal compliance team": "ทีมกำกับการปฏิบัติตามกฎภายใน",
  "External consultant": "ที่ปรึกษาภายนอก",
  "ERP system": "ระบบ ERP",
  "Another CBAM software": "ซอฟต์แวร์ CBAM อื่น",
  "We haven't started yet": "เรายังไม่ได้เริ่ม",
  "What is your biggest challenge today?": "ความท้าทายที่ใหญ่ที่สุดของคุณตอนนี้คืออะไร",
  "Suppliers are slow to respond": "ซัพพลายเออร์ตอบกลับช้า",
  "Supplier data is incomplete": "ข้อมูลจากซัพพลายเออร์ไม่ครบถ้วน",
  "Collecting emissions data": "การเก็บข้อมูลการปล่อยก๊าซ",
  "Understanding CBAM requirements": "การทำความเข้าใจข้อกำหนดของ CBAM",
  "Managing multiple suppliers": "การจัดการซัพพลายเออร์หลายราย",
  "Preparing reports": "การจัดทำรายงาน",
  "Calculating emissions accurately": "การคำนวณการปล่อยก๊าซให้แม่นยำ",
  "Keeping documentation organized": "การจัดระเบียบเอกสาร",
  "Understanding your business": "ทำความเข้าใจธุรกิจของคุณ",
  "Almost there — this helps us support you at the right scale.":
    "อีกนิดเดียว ข้อมูลนี้ช่วยให้เราสนับสนุนคุณได้ในระดับที่เหมาะสม",
  "Approximately how many suppliers will you manage in Certrace?":
    "คุณจะจัดการซัพพลายเออร์ประมาณกี่รายใน Certrace",
  "More than 500": "มากกว่า 500 ราย",
  "How did you first hear about Certrace?": "คุณรู้จัก Certrace ครั้งแรกจากที่ใด",
  "Google Search": "การค้นหาบน Google",
  "Industry event": "งานอีเวนต์ในอุตสาหกรรม",
  "Trade association": "สมาคมการค้า",
  "Business partner": "พันธมิตรทางธุรกิจ",
  Consultant: "ที่ปรึกษา",
  "Referral from a colleague": "เพื่อนร่วมงานแนะนำ",
  "Online article or media": "บทความหรือสื่อออนไลน์",
  "Please specify": "โปรดระบุ",
  "Finish setup": "เสร็จสิ้นการตั้งค่า",
  "Setting up your workspace…": "กำลังตั้งค่าพื้นที่ทำงานของคุณ…",
  "Where can Certrace help you most?": "Certrace ช่วยคุณได้มากที่สุดในเรื่องใด",
  "Select all that apply": "เลือกได้มากกว่าหนึ่งข้อ",
  "How many of your products fall under CBAM?": "สินค้าของคุณอยู่ในขอบเขต CBAM กี่รายการ",
  "How many production installations do you have?": "คุณมีโรงงานผลิตกี่แห่ง",
  "How many customers do you have?": "คุณมีลูกค้ากี่ราย",
  "More than 100": "มากกว่า 100",
  "More than 25": "มากกว่า 25",
  "Phone number": "หมายเลขโทรศัพท์",
  "Pick your country code, then type the rest of the number.": "เลือกรหัสประเทศ แล้วพิมพ์หมายเลขที่เหลือ",
  "Country calling code": "รหัสโทรศัพท์ประเทศ",
  "Country or code…": "ประเทศหรือรหัส…",
  "Telephone number": "หมายเลขโทรศัพท์",
  "LINE ID": "LINE ID",
  "So our CBAM specialists can reach you on LINE.": "เพื่อให้ผู้เชี่ยวชาญ CBAM ของเราติดต่อคุณทาง LINE ได้",
  "Enter a real telephone number — digits only, 6 to 14 of them.": "กรุณากรอกหมายเลขโทรศัพท์จริง ใช้ตัวเลขเท่านั้น 6 ถึง 14 หลัก",
  "Every question on this step is required.": "ต้องตอบทุกคำถามในขั้นตอนนี้",

  /* ── Sign-up completed (/onboarding/done) ─────────────────── */
  "Setting up your account": "กำลังตั้งค่าบัญชีของคุณ",
  "Thanks — we've got": "ขอบคุณ",
  "everything we need.": "เราได้รับข้อมูลครบแล้ว",
  "We're preparing your free trial now and will email you the moment it's ready. If nothing has arrived, check your spam or junk folder.":
    "เรากำลังเตรียมการทดลองใช้ฟรีให้คุณ และจะส่งอีเมลแจ้งทันทีที่พร้อมใช้งาน หากยังไม่ได้รับอีเมล กรุณาตรวจสอบในกล่องสแปมหรือจดหมายขยะ",
  "Add Certrace on LINE OFFICIAL": "เพิ่ม Certrace OFFICIAL เป็นเพื่อนใน LINE",
  "Get news and offers, and ask our CBAM specialists anything — this is the fastest way to reach us.":
    "รับข่าวสารและข้อเสนอ พร้อมสอบถามผู้เชี่ยวชาญ CBAM ของเราได้ทุกเรื่อง ช่องทางนี้ติดต่อเราได้เร็วที่สุด",
  "Follow Certrace": "ติดตาม Certrace",

  /* ── Sign-in onboarding (/onboarding/setup) ─────────────────
     The flow every sign-in takes. It carries the EN/ไทย toggle, so unlike the
     auth screens these pairs are read in anger — a missing one shows as
     English inside a Thai wizard. Most of the field labels already have pairs
     further up (they are the Settings fields), so what follows is only what
     this flow adds. */
  Welcome: "ยินดีต้อนรับ",
  "Set up": "ตั้งค่า",
  "What you get": "สิ่งที่คุณจะได้รับ",
  "Free trial": "ทดลองใช้ฟรี",
  "Welcome back": "ยินดีต้อนรับกลับมา",
  "Good to see you, {name}.": "ดีใจที่ได้พบคุณอีกครั้ง {name}",
  "Good to see you.": "ดีใจที่ได้พบคุณอีกครั้ง",
  "Before your workspace opens, a quick check that we have your details right. About two minutes.":
    "ก่อนเปิดพื้นที่ทำงานของคุณ ขอตรวจสอบข้อมูลของคุณอีกครั้งสั้น ๆ ใช้เวลาประมาณ 2 นาที",
  "One short setup step": "ขั้นตอนตั้งค่าเพียงขั้นเดียว",
  "The details your workspace, filings and supplier requests are built from — already filled in where we know them.":
    "ข้อมูลที่ใช้สร้างพื้นที่ทำงาน การยื่นข้อมูล และคำขอถึงซัพพลายเออร์ของคุณ ส่วนที่เรารู้อยู่แล้วกรอกไว้ให้ล่วงหน้า",
  "Then a quick look at what's inside": "จากนั้นดูคร่าว ๆ ว่ามีอะไรอยู่ข้างใน",
  "The six things Certrace does for you, in about a minute.": "หกสิ่งที่ Certrace ทำให้คุณ ใช้เวลาประมาณหนึ่งนาที",
  "And straight into your workspace": "แล้วเข้าสู่พื้นที่ทำงานของคุณได้เลย",
  "Your free trial is running the moment setup is saved.": "การทดลองใช้ฟรีของคุณเริ่มทันทีที่บันทึกการตั้งค่า",
  "Get started": "เริ่มต้นใช้งาน",
  "Set up your workspace": "ตั้งค่าพื้นที่ทำงานของคุณ",
  "These are your Settings — what your filings, supplier requests and emission figures are built from. Anything we already know is filled in; change whatever has moved on.":
    "นี่คือการตั้งค่าของคุณ ซึ่งเป็นข้อมูลตั้งต้นของการยื่นข้อมูล คำขอถึงซัพพลายเออร์ และตัวเลขการปล่อยก๊าซ ส่วนที่เรารู้อยู่แล้วกรอกไว้ให้ หากมีอะไรเปลี่ยนไปแก้ไขได้ทันที",
  "How we reach you": "ช่องทางติดต่อคุณ",
  "All of this stays editable in Settings.": "ข้อมูลทั้งหมดนี้แก้ไขได้ภายหลังในหน้าการตั้งค่า",
  "A few answers are still missing — the fields in red.": "ยังมีข้อมูลที่ยังไม่ได้กรอก ดูที่ช่องซึ่งเป็นสีแดง",
  "Save and continue": "บันทึกและดำเนินการต่อ",
  "Still to answer:": "ยังต้องกรอก:",
  "and {count} more": "และอีก {count} ช่อง",
  "Saving your details…": "กำลังบันทึกข้อมูลของคุณ…",
  "Select jurisdiction": "เลือกเขตอำนาจที่ดำเนินกิจการ",
  "Select currency": "เลือกสกุลเงิน",
  "Select emission unit": "เลือกหน่วยการปล่อยก๊าซ",
  "Other — say which": "อื่น ๆ — โปรดระบุ",
  "Your operator reference — shared with buyers and used for O3CI matching. You can add it later in Settings.":
    "รหัสอ้างอิงผู้ประกอบการของคุณ ใช้แจ้งผู้ซื้อและจับคู่กับ O3CI เพิ่มภายหลังในหน้าการตั้งค่าได้",
  "Display only — your filings always carry the unit the EU template requires.":
    "ใช้แสดงผลเท่านั้น การยื่นข้อมูลของคุณจะใช้หน่วยตามที่แม่แบบของสหภาพยุโรปกำหนดเสมอ",
  "Shown on every supplier request you send, and on the “requested by” line a verifier reads.":
    "แสดงในทุกคำขอที่คุณส่งถึงซัพพลายเออร์ และในบรรทัด “ผู้ร้องขอ” ที่ผู้ทวนสอบอ่าน",

  /* The six features — same six the public site sells. */
  "Six things Certrace does, in the order the work actually happens.": "หกสิ่งที่ Certrace ทำ เรียงตามลำดับการทำงานจริง",
  "Smart Link supplier invite": "เชิญซัพพลายเออร์ด้วย Smart Link",
  "One link per supplier. No account for them to create.": "หนึ่งลิงก์ต่อซัพพลายเออร์หนึ่งราย ไม่ต้องสมัครบัญชี",
  "Fill-once supplier profile": "โปรไฟล์ซัพพลายเออร์ กรอกครั้งเดียว",
  "They answer once; every later request reuses it.": "ตอบครั้งเดียว คำขอครั้งถัดไปใช้ข้อมูลเดิมได้เลย",
  "Automatic quality check": "ตรวจสอบคุณภาพข้อมูลอัตโนมัติ",
  "Gaps and outliers flagged before a verifier sees them.": "แจ้งเตือนข้อมูลที่ขาดและค่าผิดปกติ ก่อนที่ผู้ทวนสอบจะเห็น",
  "CBAM calculation engine": "ระบบคำนวณ CBAM",
  "Embedded emissions computed to the EU method.": "คำนวณการปล่อยก๊าซแฝง (embedded emissions) ตามวิธีของสหภาพยุโรป",
  "Carbon benchmark dashboard": "แดชบอร์ดเทียบเกณฑ์คาร์บอน",
  "Your numbers against CBAM penalty rates, so you know what to fix.":
    "เทียบตัวเลขของคุณกับอัตราค่าปรับ CBAM เพื่อให้รู้ว่าต้องแก้ตรงไหน",
  "Always-ready report package": "ชุดรายงานที่พร้อมใช้เสมอ",
  "Audit-ready output for your buyer, on the day they ask.": "เอกสารที่พร้อมให้ตรวจสอบ ส่งให้ผู้ซื้อได้ในวันที่เขาขอ",

  /* Free-trial confirmation — the sign-in flow's ending. */
  "Free trial active": "การทดลองใช้ฟรีเปิดใช้งานแล้ว",
  "{company} is set up.": "{company} ตั้งค่าเรียบร้อยแล้ว",
  "You're set up.": "ตั้งค่าเรียบร้อยแล้ว",
  "Your workspace is built and your free trial is running. Start by inviting your first supplier.":
    "พื้นที่ทำงานของคุณพร้อมแล้ว และการทดลองใช้ฟรีกำลังทำงานอยู่ เริ่มต้นด้วยการเชิญซัพพลายเออร์รายแรกของคุณ",
  "One month, free, from today": "ฟรีหนึ่งเดือน นับจากวันนี้",
  "What the month gives you": "หนึ่งเดือนนี้ให้อะไรกับคุณ",
  "The full CBAM workflow, start to finish": "กระบวนการ CBAM ครบทั้งกระบวนการ ตั้งแต่ต้นจนจบ",
  "Advanced dashboard": "แดชบอร์ดขั้นสูง",
  "Unlimited supplier invitations": "เชิญซัพพลายเออร์ได้ไม่จำกัด",
  "Unlimited workspaces": "พื้นที่ทำงานไม่จำกัด",
  "Unlimited precursors": "สารตั้งต้นไม่จำกัด",
  "Everything above is included for the full month. Nothing is filed on your behalf and nothing leaves your workspace until you send it.":
    "ทุกอย่างข้างต้นรวมอยู่ในหนึ่งเดือนเต็ม เราไม่ยื่นข้อมูลแทนคุณ และไม่มีข้อมูลใดออกจากพื้นที่ทำงานของคุณจนกว่าคุณจะเป็นผู้ส่งเอง",
  "Go to your workspace": "ไปยังพื้นที่ทำงานของคุณ",

  /* /login's brand-panel sub-line. That screen is pinned to English
     (EnglishOnly), like the other auth screens — the pair is kept for the same
     reason the ones above it are: the pinning is a product decision that may
     move, and the string is the public site's solution line. */
  "Certrace is an AI workflow platform connecting buyers, exporters, and suppliers to automate CBAM carbon data collection — report-ready before buyers even ask.":
    "Certrace คือแพลตฟอร์มเวิร์กโฟลว์ AI ที่เชื่อมผู้ซื้อ ผู้ส่งออก และซัพพลายเออร์เข้าด้วยกัน เพื่อทำให้การเก็บข้อมูลคาร์บอนตาม CBAM เป็นอัตโนมัติ พร้อมออกรายงานก่อนที่ผู้ซื้อจะเอ่ยปากขอ",

  /* ── Carbon & Cost — year/product scope, the standing tag, the projection ─────────────────────────────── */
  "All products":
    "ทุกสินค้า",
  "What your numbers are worth":
    "ตัวเลขของคุณมีค่าแค่ไหน",
  "How much carbon is embedded in what you make, and how far that sits under the EU default a buyer would otherwise have to assume. Pick a year, then a product to negotiate with — or read the whole year at once.":
    "ปริมาณคาร์บอนที่ฝังอยู่ในสินค้าที่คุณผลิต และต่ำกว่าค่า EU default ที่ผู้ซื้อต้องใช้แทนมากเพียงใด เลือกปีรายงาน แล้วเลือกสินค้าที่จะใช้เจรจา — หรืออ่านทั้งปีในคราวเดียว",
  "This page fills itself in once you have a verification workspace with at least one submitted month of production.":
    "หน้านี้จะแสดงข้อมูลเมื่อคุณมีพื้นที่ทำงานตรวจสอบรับรอง (verification workspace) ที่ส่งข้อมูลการผลิตแล้วอย่างน้อยหนึ่งเดือน",
  "{year} reporting year":
    "ปีรายงาน {year}",
  "Reporting year":
    "ปีรายงาน (Reporting year)",
  "Which products these figures cover":
    "ตัวเลขเหล่านี้ครอบคลุมสินค้าใดบ้าง",
  "Carry the months you have submitted across the rest of the year, at the same rate. An assumption, not a forecast.":
    "นำอัตราของเดือนที่ส่งข้อมูลแล้วไปคิดต่อจนครบทั้งปีในอัตราเดิม เป็นการตั้งสมมติฐาน ไม่ใช่การพยากรณ์",
  "A projection is only offered for one product part-way through its year — a finished year has nothing to extrapolate, and an empty one has no rate to carry forward.":
    "การประมาณการทั้งปีใช้ได้เฉพาะกับสินค้าเดียวที่ยังส่งข้อมูลไม่ครบปี — ปีที่ครบแล้วไม่มีอะไรให้ประมาณต่อ และปีที่ยังไม่มีข้อมูลก็ไม่มีอัตราให้คิดต่อ",
  "Project full year":
    "ประมาณการทั้งปี",
  "Embedded emissions, month by month":
    "การปล่อยก๊าซที่ฝังอยู่ในสินค้า รายเดือน",
  "Per tonne of product, split into what your site emitted, what its electricity cost, and what was already in the materials you bought.":
    "ต่อสินค้าหนึ่งตัน แยกเป็นส่วนที่โรงงานของคุณปล่อยเอง ส่วนที่มาจากไฟฟ้าที่ใช้ และส่วนที่ฝังมากับวัตถุดิบที่จัดซื้อ",
  "Your selection covers several products — per-tonne figures are only comparable within one, so this is the first of them.":
    "สิ่งที่คุณเลือกครอบคลุมหลายสินค้า — ตัวเลขต่อตันเทียบกันได้เฉพาะภายในสินค้าเดียวกัน กราฟนี้จึงแสดงสินค้าแรกเท่านั้น",
  "No submitted months with production yet. Each month you submit adds a point here.":
    "ยังไม่มีเดือนที่ส่งข้อมูลการผลิต ทุกเดือนที่คุณส่งจะเพิ่มจุดข้อมูลในกราฟนี้",
  "None of the submitted months could be worked out yet — open Monthly data to see which readings are missing.":
    "ยังคำนวณเดือนที่ส่งข้อมูลแล้วไม่ได้เลย — เปิดแท็บข้อมูลรายเดือน (Monthly data) เพื่อดูว่าค่าใดยังขาดอยู่",
  "One month in. A second submitted month gives the lines a direction to show.":
    "มีข้อมูลเพียงเดือนเดียว เมื่อส่งเดือนที่สองแล้ว เส้นกราฟจึงจะแสดงทิศทางได้",
  "1 submitted month is not plotted — its emissions could not be worked out. Monthly data says which reading is missing.":
    "มี 1 เดือนที่ส่งข้อมูลแล้วแต่ไม่ได้แสดงในกราฟ เพราะคำนวณการปล่อยก๊าซไม่ได้ ดูที่ข้อมูลรายเดือนว่าค่าใดขาดอยู่",
  "{count} submitted months are not plotted — their emissions could not be worked out. Monthly data says which reading is missing.":
    "มี {count} เดือนที่ส่งข้อมูลแล้วแต่ไม่ได้แสดงในกราฟ เพราะคำนวณการปล่อยก๊าซไม่ได้ ดูที่ข้อมูลรายเดือนว่าค่าใดขาดอยู่",
  "Total":
    "รวม",
  "Precursor":
    "วัตถุดิบตั้งต้น (Precursor)",
  "No verified data yet":
    "ยังไม่มีข้อมูลที่ผ่านการตรวจสอบ",
  "Not entered yet":
    "ยังไม่ได้กรอก",
  "EU default":
    "ค่า EU default",
  "None on file for this good":
    "ยังไม่มีค่าสำหรับสินค้านี้",
  "what a buyer assumes":
    "ค่าที่ผู้ซื้อจะใช้แทน",
  "Projected":
    "ประมาณการ",
  "assumed":
    "ตั้งสมมติฐาน",
  "at the year-to-date rate":
    "ตามอัตราสะสมของปีจนถึงปัจจุบัน",
  "Embedded emissions per tonne for each submitted month, in {unit}. Current values are listed above the chart.":
    "การปล่อยก๊าซที่ฝังอยู่ต่อตันของแต่ละเดือนที่ส่งข้อมูลแล้ว หน่วย {unit} ค่าปัจจุบันแสดงอยู่เหนือกราฟ",
  "{month} — projected {total} {unit} at the year-to-date rate":
    "{month} — ประมาณการ {total} {unit} ตามอัตราสะสมของปี",
  "{month} — total {total} {unit} (direct {direct}, indirect {indirect})":
    "{month} — รวม {total} {unit} (ทางตรง {direct} ทางอ้อม {indirect})",
  "Months with no submitted production are left out rather than plotted as zero.":
    "เดือนที่ยังไม่ได้ส่งข้อมูลการผลิตจะถูกตัดออก ไม่ได้แสดงเป็นศูนย์",
  "The precursor line is level because a precursor figure is declared once for the whole reporting period, not month by month — the same way it enters the report.":
    "เส้นวัตถุดิบตั้งต้นเป็นเส้นราบ เพราะค่าของวัตถุดิบตั้งต้นประกาศครั้งเดียวสำหรับทั้งรอบรายงาน ไม่ได้แยกรายเดือน — เช่นเดียวกับที่นำเข้าสู่รายงาน",
  "The shaded months are not readings. They carry the year-to-date rate forward on the assumption that the rest of the year runs like the months you have submitted.":
    "เดือนที่แรเงาไม่ใช่ค่าที่วัดได้จริง แต่เป็นการนำอัตราสะสมของปีมาคิดต่อ ภายใต้สมมติฐานว่าช่วงที่เหลือของปีจะเป็นไปในอัตราเดียวกับเดือนที่คุณส่งข้อมูลแล้ว",
  "Official":
    "เป็นทางการ",
  "No data yet":
    "ยังไม่มีข้อมูล",
  "Not official":
    "ยังไม่เป็นทางการ",
  "A full twelve months submitted, with every precursor figure verified. This is the figure that goes on the report.":
    "ส่งข้อมูลครบทั้ง 12 เดือน และค่าของวัตถุดิบตั้งต้นทุกรายการผ่านการตรวจสอบแล้ว นี่คือตัวเลขที่จะปรากฏในรายงาน",
  "All {count} products have a full twelve months submitted and every precursor figure verified.":
    "สินค้าทั้ง {count} รายการส่งข้อมูลครบ 12 เดือน และค่าของวัตถุดิบตั้งต้นทุกรายการผ่านการตรวจสอบแล้ว",
  "{entered} of {possible} months have been started but not submitted, so nothing counts toward the year yet. Submit them on Monthly data and these figures fill themselves in.":
    "เริ่มกรอกแล้ว {entered} จาก {possible} เดือน แต่ยังไม่ได้ส่ง จึงยังไม่นับรวมเข้าปีนี้ ส่งข้อมูลที่แท็บข้อมูลรายเดือน แล้วตัวเลขเหล่านี้จะขึ้นเอง",
  "No months submitted yet. Each month you submit on Monthly data adds to the figures here.":
    "ยังไม่ได้ส่งข้อมูลเดือนใดเลย ทุกเดือนที่คุณส่งที่แท็บข้อมูลรายเดือนจะถูกนำมารวมในตัวเลขนี้",
  "{counted} of {possible} months submitted. The figures below are what those months add up to — real, but a part of a year, and a year is what gets declared.":
    "ส่งข้อมูลแล้ว {counted} จาก {possible} เดือน ตัวเลขด้านล่างคือผลรวมของเดือนเหล่านั้น — เป็นค่าจริง แต่เป็นเพียงส่วนหนึ่งของปี ขณะที่สิ่งที่ต้องยื่นคือทั้งปี",
  "A full year is in, but the precursor figures behind it are not all verified. Record the verified figure on each supply-chain row and this becomes official.":
    "ข้อมูลครบทั้งปีแล้ว แต่ค่าของวัตถุดิบตั้งต้นยังผ่านการตรวจสอบไม่ครบทุกรายการ บันทึกค่าที่ผ่านการตรวจสอบในแต่ละแถวของห่วงโซ่อุปทาน แล้วตัวเลขนี้จะเป็นทางการ",
  "1 month started, not submitted yet":
    "เริ่มกรอกแล้ว 1 เดือน ยังไม่ได้ส่ง",
  "{entered} months started, none submitted yet":
    "เริ่มกรอกแล้ว {entered} เดือน ยังไม่ได้ส่งสักเดือน",
  "No submitted months yet":
    "ยังไม่มีเดือนที่ส่งข้อมูล",
  "{scope} · at this year's rate":
    "{scope} · ตามอัตราของปีนี้",
  "{scope} · 1 submitted month":
    "{scope} · ส่งข้อมูลแล้ว 1 เดือน",
  "{scope} · {count} submitted months":
    "{scope} · ส่งข้อมูลแล้ว {count} เดือน",
  "Nothing comparable yet":
    "ยังไม่มีข้อมูลให้เปรียบเทียบ",
  "unchanged — a gap is a ratio, so scaling the year leaves it where it is":
    "ไม่เปลี่ยนแปลง — ส่วนต่างเป็นอัตราส่วน การขยายให้เต็มปีจึงไม่ทำให้ค่านี้เปลี่ยน",
  "below the default · one product":
    "ต่ำกว่าค่า default · 1 สินค้า",
  "above the default · one product":
    "สูงกว่าค่า default · 1 สินค้า",
  "below the default · averaged over {count} products":
    "ต่ำกว่าค่า default · เฉลี่ยจาก {count} สินค้า",
  "above the default · averaged over {count} products":
    "สูงกว่าค่า default · เฉลี่ยจาก {count} สินค้า",
  "Total embedded emissions":
    "การปล่อยก๊าซที่ฝังอยู่ทั้งหมด",
  "Avg. gap vs. default":
    "ส่วนต่างเฉลี่ยเทียบค่า default",
  "Precursors — {product}":
    "วัตถุดิบตั้งต้น — {product}",
  "Incomplete — 1 row missing data":
    "ไม่ครบ — ขาดข้อมูล 1 แถว",
  "Incomplete — {count} rows missing data":
    "ไม่ครบ — ขาดข้อมูล {count} แถว",
  "{value} tCO₂e/t total":
    "รวม {value} tCO₂e/t",
  "Unnamed precursor":
    "วัตถุดิบตั้งต้นที่ยังไม่ได้ตั้งชื่อ",
  "excluded (scrap — zero-rated)":
    "ไม่นับรวม (เศษโลหะ — คิดเป็นศูนย์)",
  "Missing a quantity, installation, or emissions figure.":
    "ยังขาดปริมาณ สถานประกอบการ หรือค่าการปล่อยก๊าซ",
  "on a default value, not yet verified":
    "ใช้ค่า default ยังไม่ผ่านการตรวจสอบ",
  "The total above is not shown as final — 1 precursor row still needs a quantity, installation, or emissions figure before this figure is complete.":
    "ยอดรวมด้านบนยังไม่ถือเป็นค่าสุดท้าย — วัตถุดิบตั้งต้นอีก 1 แถวยังต้องระบุปริมาณ สถานประกอบการ หรือค่าการปล่อยก๊าซ ก่อนตัวเลขนี้จะครบถ้วน",
  "The total above is not shown as final — {count} precursor rows still need a quantity, installation, or emissions figure before this figure is complete.":
    "ยอดรวมด้านบนยังไม่ถือเป็นค่าสุดท้าย — วัตถุดิบตั้งต้นอีก {count} แถวยังต้องระบุปริมาณ สถานประกอบการ หรือค่าการปล่อยก๊าซ ก่อนตัวเลขนี้จะครบถ้วน",

  /* ── Workspaces, the chain and its entities ─────────────────────────────── */
  "Share of readiness tabs that are fully complete. Descriptive only — never a gate to submission.":
    "สัดส่วนแท็บความพร้อมที่สมบูรณ์ครบถ้วน เป็นข้อมูลเชิงพรรณนาเท่านั้น ไม่ได้ใช้เป็นเงื่อนไขกั้นการส่ง",
  "blocked":
    "ติดขัด",
  "verified":
    "ตรวจสอบแล้ว",
  "Monthly data":
    "ข้อมูลรายเดือน (Monthly data)",
  "Supply Chain":
    "ห่วงโซ่อุปทาน",
  "Supply chain":
    "ห่วงโซ่อุปทาน",
  "Annual production":
    "ผลผลิตรายปี",
  "Last date to send":
    "วันสุดท้ายที่ส่งคำขอ",
  "About the installation":
    "เกี่ยวกับสถานประกอบการ",
  "in English":
    "เป็นภาษาอังกฤษ",
  "Save is held until these are answered:":
    "ยังบันทึกไม่ได้จนกว่าจะกรอกรายการต่อไปนี้:",
  "Everything above describes the SITE, and a site outlives any one year of reporting.":
    "ทุกอย่างด้านบนอธิบายตัวสถานประกอบการ ซึ่งคงอยู่ยาวนานกว่าปีรายงานใดปีหนึ่ง",
  "These three describe what this workspace is reporting ON: the good, the route it is made by, and the year. The same plant reports a different good next year, under a different route, in a different workspace — so they are kept apart from the record that stays the same.":
    "สามรายการนี้อธิบายสิ่งที่พื้นที่ทำงานนี้รายงาน ได้แก่ ตัวสินค้า กระบวนการผลิต และปีรายงาน โรงงานเดียวกันอาจรายงานสินค้าอื่นในปีถัดไป ด้วยกระบวนการอื่น ในพื้นที่ทำงานอื่น จึงแยกไว้ต่างหากจากข้อมูลที่คงเดิม",
  "Manage precursors →":
    "จัดการวัตถุดิบตั้งต้น →",
  "is not a production route for":
    "ไม่ใช่กระบวนการผลิตสำหรับ",
  "Product":
    "สินค้า",
  "Changing the product changes the CN code and the aggregated goods category this workspace reports under. The monthly readings stay — they describe the same furnace — but anything already sent to a verifier under the old code will not match.":
    "การเปลี่ยนสินค้าจะเปลี่ยนทั้ง CN code และ aggregated goods category ที่พื้นที่ทำงานนี้ใช้รายงาน ค่าที่บันทึกรายเดือนยังอยู่เหมือนเดิม เพราะอธิบายเตาเดียวกัน แต่สิ่งที่ส่งให้ผู้ตรวจสอบไปแล้วภายใต้รหัสเดิมจะไม่ตรงกัน",
  "Production route":
    "กระบวนการผลิต (Production route)",
  "Choose a route":
    "เลือกกระบวนการผลิต",
  "Locked. Every month and evidence item here is keyed to it.":
    "ล็อกไว้ ทุกเดือนและทุกหลักฐานในนี้อ้างอิงกับค่านี้",
  "Specific embedded emissions":
    "การปล่อยก๊าซที่ฝังอยู่เฉพาะหน่วย (SEE)",
  "Computed from the monthly entries — numerator and denominator aggregated separately, divided once.":
    "คำนวณจากข้อมูลรายเดือน โดยรวมตัวเศษและตัวส่วนแยกกัน แล้วหารเพียงครั้งเดียว",
  "SEE direct":
    "SEE ทางตรง",
  "SEE indirect":
    "SEE ทางอ้อม",
  "SEE precursor":
    "SEE จากวัตถุดิบตั้งต้น",
  "SEE total (reported)":
    "SEE รวม (ที่รายงาน)",
  "Direct emissions":
    "การปล่อยก๊าซทางตรง",
  "Chargeable SEE":
    "SEE ส่วนที่ต้องชำระ",
  "The workings":
    "วิธีคำนวณ",
  "incomplete, not smaller":
    "ไม่ครบถ้วน ไม่ใช่น้อยลง",
  ". Every per-tonne figure above divides by a denominator that is missing those months, which overstates them.":
    " ตัวเลขต่อตันทั้งหมดด้านบนหารด้วยตัวส่วนที่ยังขาดเดือนเหล่านั้น ทำให้ค่าสูงเกินจริง",
  "Rows the arithmetic refused:":
    "แถวที่คำนวณไม่ได้:",
  "Monthly deadline":
    "กำหนดส่งรายเดือน",
  "The same three sections — MMD, monthly data and precursors — are needed for every month of the reporting year.":
    "สามส่วนเดิม ได้แก่ MMD ข้อมูลรายเดือน และวัตถุดิบตั้งต้น จำเป็นต้องมีครบทุกเดือนของปีรายงาน",
  "A month can only be reported once it has ENDED, so each request is dated the last day of the month it covers. That is not a setting: asking earlier is impossible and asking later only shortens the time the other end has to answer.":
    "เดือนหนึ่งจะรายงานได้ก็ต่อเมื่อเดือนนั้นสิ้นสุดแล้ว คำขอแต่ละครั้งจึงลงวันที่เป็นวันสุดท้ายของเดือนที่ขอ นี่ไม่ใช่ค่าที่ตั้งได้ เพราะขอเร็วกว่านั้นเป็นไปไม่ได้ และขอช้ากว่านั้นมีแต่จะลดเวลาที่อีกฝ่ายมีให้ตอบ",
  "Automatic sending is not connected yet.":
    "ยังไม่ได้เชื่อมต่อระบบส่งอัตโนมัติ",
  "Request dated":
    "วันที่ของคำขอ",
  "Fixed — a month cannot be reported before it has ended.":
    "กำหนดตายตัว — รายงานเดือนหนึ่งก่อนที่เดือนนั้นจะสิ้นสุดไม่ได้",
  "The last day of the month":
    "วันสุดท้ายของเดือน",
  "Day of the month AFTER the one being reported.":
    "วันที่ของเดือนถัดจากเดือนที่รายงาน",
  "Archive this workspace":
    "เก็บพื้นที่ทำงานนี้เข้าคลัง",
  "You can still open it, and you can restore it at any time from":
    "คุณยังเปิดดูได้ และกู้คืนได้ทุกเมื่อจาก",
  "Archived":
    "เก็บเข้าคลังแล้ว",
  "on the Verification workspaces screen.":
    "ในหน้าพื้นที่ทำงานตรวจสอบรับรอง",
  "About this entity":
    "เกี่ยวกับรายการนี้",
  "Who produced this precursor, and the figure the chain carries for it.":
    "ใครเป็นผู้ผลิตวัตถุดิบตั้งต้นนี้ และค่าที่ห่วงโซ่อุปทานบันทึกไว้สำหรับรายการนี้",
  "This entity in the chain":
    "รายการนี้ในห่วงโซ่อุปทาน",
  "The same card the Supply Chain page shows for this node — its progress, its score and every action, on the one row. Documents and the four verification checks are inside Enter verified data, beside the figure they qualify.":
    "การ์ดเดียวกับที่หน้าห่วงโซ่อุปทานแสดงสำหรับรายการนี้ ทั้งความคืบหน้า คะแนน และทุกการดำเนินการ อยู่ในแถวเดียว เอกสารและการตรวจสอบทั้งสี่ข้ออยู่ในหน้าบันทึกข้อมูลที่ผ่านการตรวจสอบ ข้างค่าที่รับรอง",
  "This entity is no longer in the chain":
    "รายการนี้ไม่อยู่ในห่วงโซ่อุปทานแล้ว",
  "It may have been removed, or the link is from an older version of this chain.":
    "อาจถูกลบไปแล้ว หรือลิงก์นี้มาจากห่วงโซ่อุปทานเวอร์ชันก่อนหน้า",
  "Back to the supply chain →":
    "กลับไปที่ห่วงโซ่อุปทาน →",
  "Everything behind this product, tier by tier — starting with the installation it is made at. Every row offers the same two things: Track report to get a report moving, and Enter verified data to record one that has arrived. To go a tier deeper, press the + beside that row in the sidebar.":
    "ทุกอย่างที่อยู่เบื้องหลังสินค้านี้ ไล่ทีละชั้น เริ่มจากสถานประกอบการที่ผลิต ทุกแถวมีสองอย่างเหมือนกัน คือ ติดตามรายงาน เพื่อเริ่มขอรายงาน และ บันทึกข้อมูลที่ผ่านการตรวจสอบ เพื่อบันทึกค่าที่ได้รับมาแล้ว หากต้องการลงลึกอีกชั้น ให้กดเครื่องหมาย + ข้างแถวนั้นในแถบด้านข้าง",
  "Verification workspaces":
    "พื้นที่ทำงานตรวจสอบรับรอง",
  "One workspace per installation × product × reporting year. It is the screen you monitor each month, and the screen you hand to a verifier at the end of it.":
    "หนึ่งพื้นที่ทำงานต่อหนึ่งชุดของ สถานประกอบการ × สินค้า × ปีรายงาน เป็นหน้าที่คุณติดตามทุกเดือน และเป็นหน้าที่คุณส่งให้ผู้ตรวจสอบเมื่อสิ้นปี",
  "Cards":
    "การ์ด",
  "Table":
    "ตาราง",
  "Site name or reference…":
    "ชื่อหรือรหัสอ้างอิงของสถานประกอบการ…",
  "Name or CN code…":
    "ชื่อหรือ CN code…",
  "Clear filters":
    "ล้างตัวกรอง",
  "Nothing archived":
    "ยังไม่มีรายการในคลัง",
  "Archiving takes a finished year out of the estate — off the dashboard, out of the Inbox, and no longer counted in Reports — without deleting a single reading. Anything you archive lands here, and comes back with one click.":
    "การเก็บเข้าคลังจะนำปีที่เสร็จแล้วออกจากภาพรวม ทั้งจากแดชบอร์ด กล่องงานเข้า และไม่ถูกนับในรายงาน โดยไม่ลบค่าที่บันทึกไว้แม้แต่ค่าเดียว ทุกอย่างที่คุณเก็บเข้าคลังจะมาอยู่ที่นี่ และกู้คืนได้ด้วยคลิกเดียว",
  "Back to active workspaces":
    "กลับไปที่พื้นที่ทำงานที่ใช้งานอยู่",
  "No verification workspaces yet":
    "ยังไม่มีพื้นที่ทำงานตรวจสอบรับรอง",
  "A workspace is one installation × one product × one reporting year — “Steel billet · Plant A · 2026”. Monthly readings, the MMD, the precursor chain and evidence all hang off it.":
    "พื้นที่ทำงานหนึ่งชุดคือ สถานประกอบการหนึ่งแห่ง × สินค้าหนึ่งรายการ × ปีรายงานหนึ่งปี เช่น “Steel billet · Plant A · 2026” ทั้งค่าที่บันทึกรายเดือน MMD ห่วงโซ่วัตถุดิบตั้งต้น และหลักฐาน ล้วนผูกอยู่กับพื้นที่ทำงานนี้",
  "Nothing matches those filters":
    "ไม่มีรายการที่ตรงกับตัวกรองนี้",
  "Clear them to see every workspace, or widen one — readiness and year are the two that narrow hardest.":
    "ล้างตัวกรองเพื่อดูทุกพื้นที่ทำงาน หรือขยายเงื่อนไขสักข้อ — ความพร้อมและปีรายงานคือสองตัวที่กรองแคบที่สุด",
  "These are out of the active estate — not on the dashboard, not chased in the Inbox, and not counted in Reports. Nothing has been deleted: open one to read it, or restore it to bring it back.":
    "รายการเหล่านี้อยู่นอกภาพรวมที่ใช้งาน ไม่ปรากฏบนแดชบอร์ด ไม่ถูกติดตามในกล่องงานเข้า และไม่ถูกนับในรายงาน ไม่มีอะไรถูกลบ เปิดดูได้ หรือกู้คืนเพื่อนำกลับมา",
  "Your own sites":
    "สถานประกอบการของคุณเอง",
  "Pagination":
    "การแบ่งหน้า",
  "Scroll drafts left":
    "เลื่อนแบบร่างไปทางซ้าย",
  "Scroll drafts right":
    "เลื่อนแบบร่างไปทางขวา",
  "Open this installation's own workspace — its months, its MMD and its readiness are this product's report.":
    "เปิดพื้นที่ทำงานของสถานประกอบการนี้ — ข้อมูลรายเดือน MMD และความพร้อมของที่นี่คือรายงานของสินค้านี้",
  "Track report":
    "ติดตามรายงาน",
  "Open the report workspace already open for this precursor.":
    "เปิดพื้นที่ทำงานรายงานที่เปิดไว้แล้วสำหรับวัตถุดิบตั้งต้นนี้",
  "Open a report workspace for this precursor — same months, MMD and readiness as your own, pre-filled with what this row already knows.":
    "เปิดพื้นที่ทำงานรายงานสำหรับวัตถุดิบตั้งต้นนี้ — มีข้อมูลรายเดือน MMD และความพร้อมเหมือนของคุณเอง พร้อมกรอกข้อมูลที่แถวนี้มีอยู่แล้วให้ล่วงหน้า",
  "Enter verified data":
    "บันทึกข้อมูลที่ผ่านการตรวจสอบ",
  "Download this entity's submission record — the figure, its provenance and its verification checks, as handed to a verifier.":
    "ดาวน์โหลดบันทึกการส่งข้อมูลของรายการนี้ — ทั้งตัวเลข แหล่งที่มา และผลการตรวจสอบ ในรูปแบบที่ส่งให้ผู้ตรวจสอบ",
  "Chain view":
    "มุมมองห่วงโซ่อุปทาน",
  "Who supplies this, and where each month's request goes. What they actually ship — the material, its CN code and its emissions figure — is answered afterwards, either by them on their own link or by you in Enter verified data.":
    "ใครเป็นผู้จัดหารายการนี้ และคำขอของแต่ละเดือนจะส่งไปที่ใด ส่วนสิ่งที่เขาส่งมาจริง ทั้งตัววัสดุ CN code และค่าการปล่อยก๊าซ จะตอบภายหลัง โดยเขาเองผ่านลิงก์ของเขา หรือโดยคุณในหน้าบันทึกข้อมูลที่ผ่านการตรวจสอบ",
  "Add precursor":
    "เพิ่มวัตถุดิบตั้งต้น",
  "Cycle detected — chain not shown":
    "พบการอ้างอิงวนซ้ำ — ไม่แสดงห่วงโซ่อุปทาน",
  "Entity":
    "รายการ",
  "Emissions":
    "การปล่อยก๊าซ",
  "State":
    "สถานะ",
  "Score":
    "คะแนน",
  "Next step":
    "ขั้นตอนถัดไป",
  "This workspace isn't set up yet":
    "ยังตั้งค่าพื้นที่ทำงานนี้ไม่เสร็จ",
  "Something is missing before a chain can be built here.":
    "ยังมีข้อมูลบางอย่างขาดอยู่ก่อนจะสร้างห่วงโซ่อุปทานที่นี่ได้",
  "Go to Overview →":
    "ไปที่ภาพรวม →",
  "Resend link?":
    "ส่งลิงก์อีกครั้งหรือไม่",
  "Resend":
    "ส่งอีกครั้ง",
  "Readiness by tab":
    "ความพร้อมแยกตามแท็บ",
  "Workspace sections":
    "ส่วนต่าง ๆ ของพื้นที่ทำงาน",
  "Entity sections":
    "ส่วนต่าง ๆ ของรายการ",
  "Unnamed":
    "ยังไม่ได้ตั้งชื่อ",
  "Add a precursor under {name}":
    "เพิ่มวัตถุดิบตั้งต้นภายใต้ {name}",

  /* ── Monthly data, readiness, the review loop and instruments ─────────────────────────────── */
  "Instrument":
    "อุปกรณ์วัด",
  "This month":
    "เดือนนี้",
  "Computed from the form below. Monthly SEE is indicative only — the year's figure divides once, at the end.":
    "คำนวณจากแบบฟอร์มด้านล่าง ค่า SEE รายเดือนเป็นเพียงตัวชี้แนวโน้ม — ตัวเลขของทั้งปีจะหารเพียงครั้งเดียวตอนสิ้นปี",
  "Locked while you read it. Press":
    "ล็อกไว้ขณะอ่าน กด",
  "Nothing is outstanding in this month. Every figure the arithmetic needs is present.":
    "เดือนนี้ไม่มีรายการค้าง ทุกค่าที่การคำนวณต้องใช้มีครบแล้ว",
  "The sum of the submitted months. Nothing to type here — a second copy of this figure is a second thing that can disagree with the readings behind it.":
    "ผลรวมของเดือนที่ส่งข้อมูลแล้ว ไม่ต้องกรอกที่นี่ — การเก็บตัวเลขนี้ซ้ำอีกชุดคือการสร้างสิ่งที่อาจขัดแย้งกับค่าที่บันทึกไว้เบื้องหลัง",
  "tonnes produced":
    "ตันที่ผลิตได้",
  "months submitted":
    "เดือนที่ส่งข้อมูลแล้ว",
  "Every month is in. The annual figure is complete.":
    "ข้อมูลครบทุกเดือนแล้ว ตัวเลขรายปีสมบูรณ์",
  "The year":
    "ทั้งปี",
  "A month can only be reported once it has ended, so each request goes out in the month after the one it covers.":
    "เดือนหนึ่งจะรายงานได้เมื่อเดือนนั้นสิ้นสุดแล้ว คำขอแต่ละครั้งจึงส่งออกในเดือนถัดจากเดือนที่ขอ",
  "The deadline runs from that request. Change either here and every month below moves with it.":
    "กำหนดส่งนับจากคำขอนั้น หากเปลี่ยนค่าใดค่าหนึ่งที่นี่ ทุกเดือนด้านล่างจะขยับตาม",
  "beside it is what puts the address on your clipboard to paste into an email.":
    "ข้าง ๆ คือปุ่มที่คัดลอกลิงก์ไว้ในคลิปบอร์ดเพื่อนำไปวางในอีเมล",
  "Click a month to open it. The buttons on each one send that month's link, copy it again, or log a chase.":
    "คลิกที่เดือนเพื่อเปิด ปุ่มบนแต่ละเดือนใช้ส่งลิงก์ของเดือนนั้น คัดลอกลิงก์ซ้ำ หรือบันทึกการติดตาม",
  "Each month is asked for once it has ended — the request is dated the":
    "แต่ละเดือนจะถูกขอเมื่อเดือนนั้นสิ้นสุดแล้ว — คำขอลงวันที่เป็น",
  "last day of the month":
    "วันสุดท้ายของเดือน",
  "it covers, and the data is due by the":
    "ที่ขอ และข้อมูลครบกำหนดภายใน",
  "Changing this moves the months that have not gone out yet. A month already sent keeps the deadline it was sent under — the person answering it was told that date.":
    "การเปลี่ยนค่านี้จะขยับเฉพาะเดือนที่ยังไม่ได้ส่งออก เดือนที่ส่งไปแล้วจะคงกำหนดเดิมไว้ เพราะผู้ที่ตอบได้รับแจ้งวันที่นั้นไปแล้ว",
  "The same twelve months as a column of numbers — the shape for checking a year rather than opening a month. The review column is where each one stands with you.":
    "สิบสองเดือนเดียวกันในรูปแบบคอลัมน์ตัวเลข เหมาะกับการตรวจทานทั้งปีมากกว่าการเปิดดูทีละเดือน คอลัมน์การตรวจทานคือสถานะของแต่ละเดือนกับคุณ",
  "edited by you":
    "คุณเป็นผู้แก้ไข",
  "Precursors received":
    "วัตถุดิบตั้งต้นที่รับเข้า",
  "A blank is a gap, not a zero. A month that genuinely received none should say 0, because the arithmetic cannot tell the two apart.":
    "ช่องว่างหมายถึงข้อมูลขาด ไม่ใช่ศูนย์ เดือนที่ไม่ได้รับจริง ๆ ควรกรอก 0 เพราะการคำนวณแยกสองกรณีนี้ไม่ออก",
  "What each bought-in CBAM input weighed, month by month. The tonnage is what carries a supplier's emissions into this good, so it is printed rather than summarised.":
    "น้ำหนักของวัตถุดิบ CBAM ที่จัดซื้อแต่ละรายการ แยกรายเดือน ปริมาณตันคือสิ่งที่นำการปล่อยก๊าซของซัพพลายเออร์เข้าสู่สินค้านี้ จึงแสดงเต็มค่าแทนการสรุป",
  "Month total":
    "รวมทั้งเดือน",
  "Year to date":
    "สะสมตั้งแต่ต้นปี",
  "A document is attached to a MONTH and to the figure it stands behind. A file with nothing bound to it is a file, not evidence.":
    "เอกสารต้องแนบกับเดือนหนึ่ง ๆ และกับตัวเลขที่เอกสารนั้นรองรับ ไฟล์ที่ไม่ได้ผูกกับอะไรเลยก็เป็นเพียงไฟล์ ไม่ใช่หลักฐาน",
  "Annual paperwork — the licence, the calibration records, a carbon-price receipt — sits outside the twelve months and is counted separately below.":
    "เอกสารรายปี เช่น ใบอนุญาต บันทึกการสอบเทียบ และใบเสร็จค่าคาร์บอน อยู่นอกสิบสองเดือน และนับแยกไว้ด้านล่าง",
  "What has been uploaded against each month, from the Documents step of the supplier's link or from the month screen here.":
    "สิ่งที่อัปโหลดไว้ในแต่ละเดือน ไม่ว่าจะมาจากขั้นตอนเอกสารในลิงก์ของซัพพลายเออร์ หรือจากหน้าเดือนที่นี่",
  "Send now":
    "ส่งเลย",
  "Sent":
    "ส่งแล้ว",
  "MMD by month":
    "MMD แยกรายเดือน",
  "One methodology covers the year — this is which version applies to each month, what it says, and what is still outstanding in it.":
    "วิธีการหนึ่งชุดครอบคลุมทั้งปี ตารางนี้บอกว่าเวอร์ชันใดใช้กับเดือนใด ระบุอะไรไว้ และยังค้างอะไรอยู่",
  "The MMD describes how these figures are produced: the boundary, the instruments, the factors and their sources.":
    "MMD อธิบายวิธีได้มาซึ่งตัวเลขเหล่านี้ ทั้งขอบเขต อุปกรณ์วัด ค่าแฟกเตอร์ และแหล่งที่มา",
  "Finalising stamps a version. Editing after that forks the next one, so a document handed over in March still says in December what it said in March.":
    "การปิดฉบับจะประทับเวอร์ชันไว้ การแก้ไขหลังจากนั้นจะแตกเป็นเวอร์ชันถัดไป เอกสารที่ส่งมอบในเดือนมีนาคมจึงยังคงข้อความเดิมเมื่ออ่านในเดือนธันวาคม",
  "The boundary is a paragraph and the exclusions are a list, so those columns say only whether an answer exists — the counts beside them are what a year is actually checked against.":
    "ขอบเขตเป็นข้อความหนึ่งย่อหน้าและรายการยกเว้นเป็นลิสต์ คอลัมน์เหล่านั้นจึงบอกได้เพียงว่ามีคำตอบแล้วหรือยัง ส่วนตัวเลขข้าง ๆ คือสิ่งที่ใช้ตรวจทั้งปีจริง ๆ",
  "Overall readiness":
    "ความพร้อมโดยรวม",
  "A tab is green only when a verifier would find nothing missing there. Nothing here rounds up.":
    "แท็บจะเป็นสีเขียวก็ต่อเมื่อผู้ตรวจสอบจะไม่พบสิ่งใดขาดในแท็บนั้น ตัวเลขในหน้านี้ไม่ปัดขึ้น",
  "Materiality self-check":
    "การตรวจสอบสาระสำคัญด้วยตนเอง",
  "The share of this year's emissions that rests on estimates rather than measurements.":
    "สัดส่วนการปล่อยก๊าซของปีนี้ที่อ้างอิงการประมาณการแทนการวัดจริง",
  "tCO₂e estimated":
    "tCO₂e ที่ประมาณการ",
  "tCO₂e total":
    "tCO₂e รวม",
  "What you send the verifier":
    "สิ่งที่คุณส่งให้ผู้ตรวจสอบ",
  "One file: the EU communication template's field set with the arithmetic shown, then every supporting document as a paginated appendix.":
    "ไฟล์เดียว ประกอบด้วยชุดฟิลด์ตามแบบฟอร์มสื่อสารของ EU พร้อมแสดงวิธีคำนวณ ตามด้วยเอกสารประกอบทั้งหมดในรูปภาคผนวกที่จัดหน้าแล้ว",
  "Signed off by":
    "ลงนามรับรองโดย",
  "The figures have changed since":
    "ตัวเลขเปลี่ยนไปนับตั้งแต่",
  "Everything applicable is complete. One person inside your company signs these figures off, and the report downloads.":
    "ทุกส่วนที่เกี่ยวข้องครบถ้วนแล้ว เมื่อมีผู้รับผิดชอบในบริษัทลงนามรับรองตัวเลขเหล่านี้ รายงานจะดาวน์โหลดได้",
  "Who is approving these figures?":
    "ใครเป็นผู้รับรองตัวเลขเหล่านี้",
  "The report carries your company's name. One person inside the business puts theirs to it before it goes out.":
    "รายงานนี้ออกในนามบริษัทของคุณ ต้องมีผู้รับผิดชอบในบริษัทลงชื่อกำกับก่อนส่งออกไป",
  "Sign off":
    "ลงนามรับรอง",
  "Name":
    "ชื่อ",
  "The person answering for these figures, not the person clicking.":
    "ผู้ที่รับผิดชอบต่อตัวเลขเหล่านี้ ไม่ใช่ผู้ที่กดปุ่ม",
  "A verifier reads this to know whether the signatory could have known.":
    "ผู้ตรวจสอบใช้ข้อมูลนี้ประเมินว่าผู้ลงนามอยู่ในฐานะที่จะรู้เรื่องนี้หรือไม่",
  "If any figure changes after this — a month re-submitted, a precursor corrected, a document added — the sign-off lapses and has to be repeated. That is deliberate: it is what stops a signature outliving the numbers it was given for.":
    "หากมีตัวเลขใดเปลี่ยนหลังจากนี้ เช่น ส่งเดือนใดใหม่ แก้ค่าวัตถุดิบตั้งต้น หรือเพิ่มเอกสาร การลงนามจะสิ้นผลและต้องลงนามใหม่ นี่เป็นความตั้งใจ เพื่อไม่ให้ลายเซ็นมีอายุยืนกว่าตัวเลขที่ลงนามรับรองไว้",
  "Carbon price paid in the country of origin":
    "ราคาคาร์บอนที่ชำระในประเทศต้นทาง",
  "Annual. Zero is a valid and complete answer — record it rather than leaving it blank.":
    "เป็นค่ารายปี ศูนย์เป็นคำตอบที่ถูกต้องและครบถ้วน ให้บันทึกไว้แทนการเว้นว่าง",
  "Share of emissions covered":
    "สัดส่วนการปล่อยก๊าซที่ครอบคลุม",
  "What fraction of this good's total specific embedded emissions this instrument actually applies to. If unsure, 1.0/100% is rarely correct — check your documentation rather than guessing.":
    "มาตรการนี้ครอบคลุม SEE รวมของสินค้านี้เป็นสัดส่วนเท่าใด หากไม่แน่ใจ ค่า 1.0/100% มักไม่ถูกต้อง ให้ตรวจเอกสารของคุณแทนการเดา",
  "Rebates or free allocation":
    "ส่วนลดหรือสิทธิ์จัดสรรฟรี",
  "Any offset received against the above.":
    "ส่วนที่ได้รับชดเชยจากรายการข้างต้น",
  "An amount above zero is claimed with no payment evidence attached. Attach the excise or tax receipt below.":
    "มีการอ้างจำนวนเงินมากกว่าศูนย์โดยไม่มีหลักฐานการชำระแนบมา กรุณาแนบใบเสร็จภาษีสรรพสามิตหรือใบเสร็จภาษีด้านล่าง",
  "No receipt attached. A claimed deduction with nothing behind it is the first thing a verifier removes.":
    "ยังไม่ได้แนบใบเสร็จ รายการหักลดที่ไม่มีหลักฐานรองรับคือสิ่งแรกที่ผู้ตรวจสอบจะตัดออก",
  "What the report will contain":
    "รายงานจะมีเนื้อหาอะไรบ้าง",
  "It changes nothing about the document. It is a view of what is already in it.":
    "ส่วนนี้ไม่เปลี่ยนแปลงตัวเอกสาร เป็นเพียงมุมมองของสิ่งที่มีอยู่ในเอกสารแล้ว",
  "Section by section, in the order it prints. Nothing here is a gate — it is so you can see what a verifier will and will not find.":
    "ไล่ทีละหัวข้อตามลำดับที่พิมพ์ออกมา ไม่มีรายการใดเป็นเงื่อนไขกั้น แต่มีไว้ให้คุณเห็นว่าผู้ตรวจสอบจะพบและไม่พบอะไรบ้าง",
  "They wrote:":
    "เขาเขียนไว้ว่า:",
  "Parameter":
    "พารามิเตอร์",
  "What this instrument measures.":
    "อุปกรณ์นี้วัดอะไร",
  "Make, model and tag — enough to find it on the plant.":
    "ยี่ห้อ รุ่น และรหัสกำกับ — ให้เพียงพอที่จะหาตัวอุปกรณ์เจอในโรงงาน",
  "Read how often":
    "อ่านค่าบ่อยแค่ไหน",
  "Choose":
    "เลือก",
  "Reading frequency":
    "ความถี่ในการอ่านค่า",
  "Last calibrated":
    "สอบเทียบครั้งล่าสุด",
  "The date on the calibration certificate.":
    "วันที่บนใบรับรองการสอบเทียบ",
  "Last calibration date":
    "วันที่สอบเทียบครั้งล่าสุด",
  "Say how often":
    "ระบุความถี่",
  "CEMS calibration reference":
    "เลขอ้างอิงการสอบเทียบ CEMS",
  "The QAL2 certificate number for this analyser.":
    "หมายเลขใบรับรอง QAL2 ของเครื่องวิเคราะห์นี้",
  "Measurement point":
    "จุดวัด",
  "Name the stack and the height or distance, so a verifier can stand next to it.":
    "ระบุปล่องและความสูงหรือระยะ เพื่อให้ผู้ตรวจสอบไปยืนที่จุดนั้นได้",
  "Measurement point location":
    "ตำแหน่งของจุดวัด",
  "No version on file. Nothing has been submitted for this month yet.":
    "ยังไม่มีเวอร์ชันในระบบ ยังไม่มีการส่งข้อมูลสำหรับเดือนนี้",
  "You asked for:":
    "คุณขอให้แก้:",
  "Approving puts their form back into draft. Rejecting leaves the month exactly as it is and tells them so.":
    "การอนุมัติจะทำให้แบบฟอร์มของเขากลับเป็นแบบร่าง ส่วนการปฏิเสธจะคงเดือนนั้นไว้ตามเดิมและแจ้งให้เขาทราบ",
  "An assignment, not an approval — it records who is looking, so the month stops being everybody's job and nobody's.":
    "เป็นการมอบหมาย ไม่ใช่การอนุมัติ — บันทึกว่าใครกำลังตรวจอยู่ เพื่อให้เดือนนั้นไม่เป็นงานของทุกคนและไม่เป็นงานของใครเลย",
  "Hand it over":
    "มอบหมายต่อ",
  "Reviewer":
    "ผู้ตรวจทาน",
  "Anyone on your team. Suppliers are never reviewers of their own month.":
    "ใครก็ได้ในทีมของคุณ ซัพพลายเออร์จะไม่เป็นผู้ตรวจทานเดือนของตนเอง",
  "Certrace does not notify them yet — this build has no mail service. Tell them, and the month will be waiting under their name.":
    "Certrace ยังไม่แจ้งเตือนให้เขาโดยอัตโนมัติ เวอร์ชันนี้ยังไม่มีบริการอีเมล กรุณาแจ้งเขาเอง แล้วเดือนนั้นจะรออยู่ในชื่อของเขา",
  "Sent back for revision":
    "ส่งกลับให้แก้ไข",
  "Your edited version went back":
    "เวอร์ชันที่คุณแก้ไขถูกส่งกลับไป",
  "No particular part was named, so the whole month went back. Naming the parts next time is what puts a blue outline on their screen.":
    "ไม่ได้ระบุส่วนใดเป็นการเฉพาะ จึงส่งกลับทั้งเดือน ครั้งหน้าหากระบุส่วนที่ต้องแก้ ระบบจะขึ้นกรอบสีน้ำเงินบนหน้าจอของเขา",
  "Ask for a revision":
    "ขอให้แก้ไข",
  "Everything you tick here is outlined in blue on their own screen, on the step it belongs to.":
    "ทุกรายการที่คุณติ๊กที่นี่จะขึ้นกรอบสีน้ำเงินบนหน้าจอของเขา ในขั้นตอนที่รายการนั้นอยู่",
  "The first page of their link lists them, with a button that walks them to the first one.":
    "หน้าแรกของลิงก์ที่เขาได้รับจะแสดงรายการเหล่านั้น พร้อมปุ่มพาไปยังรายการแรก",
  "The outline stays after they answer it, so a second round of questions is readable against the first.":
    "กรอบจะยังคงอยู่หลังจากเขาตอบแล้ว เพื่อให้อ่านคำถามรอบที่สองเทียบกับรอบแรกได้",
  "Name the parts that need another look, say what is wrong with them, and the month goes back.":
    "ระบุส่วนที่ต้องดูอีกครั้ง บอกว่าผิดตรงไหน แล้วเดือนนั้นจะถูกส่งกลับ",
  "Your edited version is what goes back.":
    "เวอร์ชันที่คุณแก้ไขคือสิ่งที่จะถูกส่งกลับไป",
  "You have changed figures since this was submitted, so sending the original would ask them to fix something you have already fixed. They will see your numbers and revise from there.":
    "คุณได้แก้ตัวเลขไปหลังจากที่เขาส่งมา การส่งฉบับเดิมกลับไปจึงเท่ากับขอให้เขาแก้สิ่งที่คุณแก้ไปแล้ว เขาจะเห็นตัวเลขของคุณและแก้ไขต่อจากตรงนั้น",
  "Tick nothing and the whole month goes back with your note alone — which is what it used to do, and what leaves them guessing.":
    "หากไม่ติ๊กอะไรเลย ทั้งเดือนจะถูกส่งกลับพร้อมข้อความของคุณเพียงอย่างเดียว ซึ่งเป็นพฤติกรรมเดิมและทำให้เขาต้องเดาเอง",
  "What is wrong with them":
    "ผิดตรงไหน",
  "Name the figure and what is wrong with it. Required — a list of parts with no reason is a list of parts.":
    "ระบุตัวเลขและสิ่งที่ผิด จำเป็นต้องกรอก — รายการส่วนที่ต้องแก้โดยไม่มีเหตุผลก็เป็นเพียงรายการเปล่า ๆ",
  "The natural gas emission factor is 0.0561 tCO₂ per m³. It should be per GJ — please check the invoice and re-enter it.":
    "ค่าแฟกเตอร์การปล่อยก๊าซของก๊าซธรรมชาติระบุเป็น 0.0561 tCO₂ ต่อ m³ ซึ่งควรเป็นต่อ GJ กรุณาตรวจใบแจ้งหนี้แล้วกรอกใหม่",

  /* ── MMD — the monitoring methodology document ─────────────────────────────── */
  "Method":
    "วิธีการ",
  "The period is the calendar year, and it is not stretched. If the way you produce this good changes part-way through — a new furnace, a fuel switch, a change to what is inside the boundary — the figures either side of that date describe two different installations.":
    "รอบรายงานคือปีปฏิทิน และไม่สามารถยืดออกได้ หากวิธีผลิตสินค้านี้เปลี่ยนกลางปี เช่น เปลี่ยนเตาใหม่ เปลี่ยนเชื้อเพลิง หรือเปลี่ยนขอบเขต ตัวเลขก่อนและหลังวันนั้นจะอธิบายสถานประกอบการคนละแห่ง",
  "When that happens,":
    "เมื่อเกิดกรณีเช่นนั้น",
  "close this period at the change and report the rest of the year separately.":
    "ให้ปิดรอบรายงาน ณ จุดที่เปลี่ยน แล้วรายงานช่วงที่เหลือของปีแยกต่างหาก",
  "Averaging across the change hides exactly the difference a verifier is looking for.":
    "การเฉลี่ยคร่อมจุดที่เปลี่ยนจะกลบความต่างที่ผู้ตรวจสอบกำลังมองหาพอดี",
  "1 · Boundary":
    "1 · ขอบเขต",
  "Boundary description":
    "คำอธิบายขอบเขต",
  "Name the equipment, say where material enters and leaves, and say what is outside the line.":
    "ระบุอุปกรณ์ บอกจุดที่วัตถุดิบเข้าและออก และระบุสิ่งที่อยู่นอกขอบเขต",
  "List them in the order material moves through the boundary.":
    "เรียงตามลำดับที่วัตถุดิบเคลื่อนผ่านขอบเขต",
  "A verifier reads this as the sequence on the shop floor and checks it against your diagram. Four process names in the wrong order describe a plant that does not exist.":
    "ผู้ตรวจสอบจะอ่านลำดับนี้เป็นลำดับงานจริงในโรงงาน และเทียบกับแผนผังของคุณ ชื่อกระบวนการสี่รายการที่เรียงผิดลำดับคือการอธิบายโรงงานที่ไม่มีอยู่จริง",
  "Processes included":
    "กระบวนการที่รวมอยู่ในขอบเขต",
  "Add the next process":
    "เพิ่มกระบวนการถัดไป",
  "Other — name the process yourself":
    "อื่น ๆ — ระบุชื่อกระบวนการเอง",
  "These are processes that happen at your installation and that you are declaring to be outside the boundary. That is allowed — but every one of them needs a ground and the detail behind it. An exclusion with an empty note is the most common finding on a first engagement.":
    "รายการเหล่านี้คือกระบวนการที่เกิดขึ้นในสถานประกอบการของคุณ แต่คุณประกาศว่าอยู่นอกขอบเขต ซึ่งทำได้ แต่ทุกรายการต้องมีเหตุผลและรายละเอียดรองรับ การยกเว้นที่ไม่มีคำอธิบายคือข้อสังเกตที่พบบ่อยที่สุดในการตรวจครั้งแรก",
  "Processes excluded":
    "กระบวนการที่ยกเว้นจากขอบเขต",
  "Nothing declared as excluded. That is a valid answer if everything on the site is inside the boundary — but offices, canteens, vehicle fleets and separately metered lines almost always are not, and a verifier will ask about them by name.":
    "ยังไม่ได้ประกาศการยกเว้นใด ๆ ซึ่งเป็นคำตอบที่ถูกต้องหากทุกอย่างในพื้นที่อยู่ในขอบเขต แต่สำนักงาน โรงอาหาร ยานพาหนะ และสายการผลิตที่มีมิเตอร์แยก มักไม่อยู่ในขอบเขต และผู้ตรวจสอบจะถามถึงเป็นรายการ",
  "Remove exclusion":
    "ลบรายการยกเว้น",
  "Process":
    "กระบวนการ",
  "The same list the boundary is drawn in. A process already excluded drops off the list.":
    "รายการเดียวกับที่ใช้กำหนดขอบเขต กระบวนการที่ยกเว้นไปแล้วจะหายไปจากรายการ",
  "Ground for excluding it":
    "เหตุผลในการยกเว้น",
  "Detail":
    "รายละเอียด",
  "Which meter, which subcontractor, which threshold. This is the part a verifier reads.":
    "มิเตอร์ตัวใด ผู้รับเหมารายใด เกณฑ์เท่าใด ส่วนนี้คือส่วนที่ผู้ตรวจสอบอ่าน",
  "2 · Reporting period":
    "2 · รอบรายงาน",
  "Start":
    "เริ่ม",
  "Reporting period start":
    "วันเริ่มต้นรอบรายงาน",
  "End":
    "สิ้นสุด",
  "Reporting period end":
    "วันสิ้นสุดรอบรายงาน",
  "3 · Fuels":
    "3 · เชื้อเพลิง",
  "What.":
    "อะไร",
  "Every fuel burned inside the boundary across the year, and the instrument measuring each one.":
    "เชื้อเพลิงทุกชนิดที่เผาไหม้ภายในขอบเขตตลอดทั้งปี และอุปกรณ์ที่ใช้วัดแต่ละชนิด",
  "Why.":
    "ทำไม",
  "Combustion is where most direct CO₂ comes from. Naming the fuels makes an unexpected fourth fuel next March visible as an exception.":
    "การเผาไหม้คือแหล่งที่มาของ CO₂ ทางตรงส่วนใหญ่ การระบุชนิดเชื้อเพลิงไว้ทำให้เชื้อเพลิงชนิดที่สี่ซึ่งโผล่มาในเดือนมีนาคมปีหน้าปรากฏเป็นข้อยกเว้นที่มองเห็นได้",
  "How.":
    "อย่างไร",
  "Select every fuel, then add one instrument row per fuel — parameter, make and model, reading frequency, last calibration date.":
    "เลือกเชื้อเพลิงให้ครบ แล้วเพิ่มอุปกรณ์วัดหนึ่งแถวต่อหนึ่งเชื้อเพลิง ระบุพารามิเตอร์ ยี่ห้อและรุ่น ความถี่ในการอ่านค่า และวันที่สอบเทียบล่าสุด",
  "Example.":
    "ตัวอย่าง",
  "Direct method":
    "วิธีคำนวณทางตรง",
  "Fuel types burned":
    "ชนิดเชื้อเพลิงที่เผาไหม้",
  "The same codes the monthly rows use, so the methodology and the readings cannot name different fuels.":
    "ใช้รหัสชุดเดียวกับข้อมูลรายเดือน เพื่อไม่ให้วิธีการกับค่าที่บันทึกระบุเชื้อเพลิงคนละชนิด",
  "Select every fuel this installation burns":
    "เลือกเชื้อเพลิงทุกชนิดที่สถานประกอบการนี้ใช้เผาไหม้",
  "Fuel types":
    "ชนิดเชื้อเพลิง",
  "Describe the other fuel in the terms your invoices use":
    "อธิบายเชื้อเพลิงอื่นด้วยคำที่ใช้ในใบแจ้งหนี้ของคุณ",
  "One row per fuel. A fuel with no instrument behind it is a figure a verifier cannot test.":
    "หนึ่งแถวต่อหนึ่งเชื้อเพลิง เชื้อเพลิงที่ไม่มีอุปกรณ์วัดรองรับคือตัวเลขที่ผู้ตรวจสอบทดสอบไม่ได้",
  "Instruments — fuels":
    "อุปกรณ์วัด — เชื้อเพลิง",
  "4 · Electricity":
    "4 · ไฟฟ้า",
  "Where the power comes from, and which meter the reported MWh is read off.":
    "ไฟฟ้ามาจากที่ใด และค่า MWh ที่รายงานอ่านจากมิเตอร์ตัวใด",
  "Pick the closest match, then name the meter: the feeder, the meter number, whatever the invoice shows.":
    "เลือกตัวเลือกที่ใกล้เคียงที่สุด แล้วระบุมิเตอร์ ทั้งสายป้อน หมายเลขมิเตอร์ หรือข้อมูลใดก็ตามที่ปรากฏในใบแจ้งหนี้",
  "Electricity source":
    "แหล่งจ่ายไฟฟ้า",
  "The category decides which emission factor is admissible, which is why it is a list and not a sentence.":
    "ประเภทของแหล่งจ่ายเป็นตัวกำหนดว่าใช้ค่าแฟกเตอร์ใดได้ จึงเป็นรายการให้เลือก ไม่ใช่ข้อความเขียนเอง",
  "How is this installation supplied?":
    "สถานประกอบการนี้รับไฟฟ้าจากแหล่งใด",
  "Other arrangement — specify":
    "รูปแบบอื่น — ระบุ",
  "Describe the supply and who generates it":
    "อธิบายรูปแบบการจ่ายไฟและผู้ผลิตไฟฟ้า",
  "Electricity metering point":
    "จุดวัดไฟฟ้า",
  "Which meter, which feeder, and what the reading is reconciled against.":
    "มิเตอร์ตัวใด สายป้อนใด และนำค่าที่อ่านไปกระทบยอดกับอะไร",
  "A row appears here as soon as a supply is chosen. Fill in the meter that evidences the MWh you report.":
    "เมื่อเลือกแหล่งจ่ายแล้ว จะมีแถวปรากฏที่นี่ กรอกมิเตอร์ที่ใช้ยืนยันค่า MWh ที่คุณรายงาน",
  "Instruments — electricity":
    "อุปกรณ์วัด — ไฟฟ้า",
  "Own generation":
    "การผลิตไฟฟ้าเอง",
  "A check that the fuel your own generation burns has not been left out — or counted twice.":
    "ตรวจสอบว่าเชื้อเพลิงที่ใช้ผลิตไฟฟ้าเองไม่ได้ตกหล่น และไม่ได้ถูกนับซ้ำ",
  "On-site generation is the easiest place in a CBAM return to double-count: the gas the turbine burns is direct emissions, and the electricity it makes is the same carbon again. Only one may be reported.":
    "การผลิตไฟฟ้าในพื้นที่คือจุดที่นับซ้ำได้ง่ายที่สุดในการยื่น CBAM ก๊าซที่กังหันเผาไหม้คือการปล่อยก๊าซทางตรง และไฟฟ้าที่ผลิตได้ก็คือคาร์บอนก้อนเดียวกันอีกครั้ง รายงานได้เพียงอย่างเดียวเท่านั้น",
  "Report the FUEL in section 3 and tick the box. Do not also enter the generated MWh as purchased electricity.":
    "ให้รายงานเชื้อเพลิงในหัวข้อ 3 และติ๊กช่องนี้ อย่ากรอก MWh ที่ผลิตเองเป็นไฟฟ้าที่ซื้อมาอีก",
  "The fuel this generation burns is already listed in section 3.":
    "เชื้อเพลิงที่ใช้ผลิตไฟฟ้านี้ระบุไว้แล้วในหัวข้อ 3",
  "If it is not, add it — leaving it out understates direct emissions, and entering the generated electricity as well counts the same carbon twice.":
    "หากยังไม่ได้ระบุ ให้เพิ่มเข้าไป การละไว้จะทำให้การปล่อยก๊าซทางตรงต่ำกว่าความจริง และการกรอกไฟฟ้าที่ผลิตเองเข้าไปด้วยจะเป็นการนับคาร์บอนก้อนเดียวกันสองครั้ง",
  "5 · Data gaps":
    "5 · ช่วงข้อมูลขาด",
  "Remove gap":
    "ลบช่วงข้อมูลขาด",
  "From":
    "ตั้งแต่",
  "Gap start":
    "วันเริ่มต้นของช่วงข้อมูลขาด",
  "To":
    "ถึง",
  "Gap end":
    "วันสิ้นสุดของช่วงข้อมูลขาด",
  "Reason":
    "เหตุผล",
  "Estimation method":
    "วิธีประมาณค่า",
  "How, precisely. A verifier has to be able to recompute it.":
    "ระบุวิธีให้ชัดเจน ผู้ตรวจสอบต้องคำนวณตามได้",
  "Estimated":
    "ประมาณการ",
  "Feeds the 5% materiality self-check.":
    "ใช้ป้อนการตรวจสอบสาระสำคัญที่เกณฑ์ 5%",
  "Estimated tCO2e":
    "tCO2e ที่ประมาณการ",
  "Reviewer of record":
    "ผู้ตรวจทานที่บันทึกไว้",
  "A person, not a department — and this gap's reviewer, not necessarily the year's.":
    "ระบุเป็นบุคคล ไม่ใช่แผนก และเป็นผู้ตรวจทานของช่วงข้อมูลขาดนี้ ซึ่งไม่จำเป็นต้องเป็นคนเดียวกับผู้ตรวจทานของทั้งปี",
  "Date reviewed":
    "วันที่ตรวจทาน",
  "When the reviewer above signed off this estimate.":
    "วันที่ผู้ตรวจทานข้างต้นรับรองค่าประมาณการนี้",
  "6 · Quality assurance":
    "6 · การประกันคุณภาพ",
  "A person, not a department. A verifier will ask who.":
    "ระบุเป็นบุคคล ไม่ใช่แผนก ผู้ตรวจสอบจะถามว่าใคร",
  "Review frequency":
    "ความถี่ในการตรวจทาน",
  "When they look, and what they check it against.":
    "ตรวจทานเมื่อใด และเทียบกับอะไร",
  "7 · Installation diagram":
    "7 · แผนผังสถานประกอบการ",
  "What the drawing has to show":
    "สิ่งที่แผนผังต้องแสดง",
  "8 · Documents":
    "8 · เอกสาร",
  "The paperwork behind what this methodology claims about the installation itself.":
    "เอกสารที่รองรับสิ่งที่วิธีการนี้ระบุไว้เกี่ยวกับตัวสถานประกอบการ",
  "Installation identity":
    "หลักฐานยืนยันตัวตนของสถานประกอบการ",
  "— a registration certificate, licence or utility bill that ties the legal name and address above to a real site.":
    " — หนังสือรับรองการจดทะเบียน ใบอนุญาต หรือใบแจ้งค่าสาธารณูปโภค ที่เชื่อมชื่อและที่อยู่ตามกฎหมายข้างต้นเข้ากับสถานที่จริง",
  "Calibration records":
    "บันทึกการสอบเทียบ",
  "— the certificates for the instruments listed in section 4. An uncalibrated instrument is the fastest route to a qualified opinion, and the certificate is what closes it.":
    " — ใบรับรองของอุปกรณ์วัดที่ระบุไว้ในหัวข้อ 4 อุปกรณ์ที่ไม่ได้สอบเทียบคือทางลัดที่เร็วที่สุดสู่ความเห็นแบบมีเงื่อนไข และใบรับรองคือสิ่งที่ปิดประเด็นนั้น",
  "Monthly bills and meter logs do not go here — they attach inside the month they belong to.":
    "ใบแจ้งหนี้รายเดือนและบันทึกมิเตอร์ไม่ต้องอยู่ที่นี่ ให้แนบไว้ในเดือนที่เอกสารนั้นสังกัด",
  "Nothing attached yet. A verifier asks for both of these on day one.":
    "ยังไม่ได้แนบเอกสาร ผู้ตรวจสอบจะขอทั้งสองรายการนี้ตั้งแต่วันแรก",
  "Before finalising:":
    "ก่อนปิดฉบับ:",

  /* ── Precursor, installation and supplier forms ─────────────────────────────── */
  "Provenance":
    "แหล่งที่มา",
  "Their installation":
    "สถานประกอบการของเขา",
  "Product installation":
    "สถานประกอบการที่ผลิตสินค้า",
  "Where it was actually produced.":
    "สถานที่ผลิตจริง",
  "Installation reference":
    "รหัสอ้างอิงสถานประกอบการ",
  "Full address":
    "ที่อยู่เต็ม",
  "Latitude":
    "ละติจูด",
  "Longitude":
    "ลองจิจูด",
  "Precursor product":
    "สินค้าที่เป็นวัตถุดิบตั้งต้น",
  "Product name":
    "ชื่อสินค้า",
  "Scrap-based EAF":
    "เตาอาร์กไฟฟ้าจากเศษโลหะ (Scrap-based EAF)",
  "Direct SEE":
    "SEE ทางตรง",
  "Indirect SEE":
    "SEE ทางอ้อม",
  "Quantity — per-tonne ratio":
    "ปริมาณ — อัตราส่วนต่อตัน",
  "Per-tonne ratio":
    "อัตราส่วนต่อตัน",
  "Verification evidence":
    "หลักฐานการตรวจสอบ",
  "Two separate things: the report itself, attached in Documents below, and the facts it states, typed here. The facts are what get checked — Certrace does not read the PDF.":
    "สองสิ่งที่แยกจากกัน คือ ตัวรายงานซึ่งแนบไว้ในหัวข้อเอกสารด้านล่าง และข้อเท็จจริงที่ระบุในรายงานซึ่งกรอกไว้ที่นี่ สิ่งที่ถูกตรวจคือข้อเท็จจริง — Certrace ไม่ได้อ่านไฟล์ PDF",
  "Verifier name":
    "ชื่อผู้ตรวจสอบ",
  "Accreditation number":
    "หมายเลขการรับรองระบบงาน",
  "Accreditation issuing country":
    "ประเทศที่ออกการรับรองระบบงาน",
  "Accreditation expiry date":
    "วันหมดอายุการรับรองระบบงาน",
  "Report issue date":
    "วันที่ออกรายงาน",
  "Sectoral scope":
    "ขอบข่ายรายสาขา",
  "Report expires":
    "รายงานหมดอายุ",
  "When this report itself needs renewing — leave blank if it does not lapse.":
    "วันที่ต้องต่ออายุรายงานฉบับนี้ — เว้นว่างไว้หากไม่มีวันหมดอายุ",
  "The verification report, and anything else that stands behind this figure.":
    "รายงานการตรวจสอบ และเอกสารอื่นใดที่รองรับตัวเลขนี้",
  "Nothing attached yet — this figure needs something behind it.":
    "ยังไม่ได้แนบเอกสาร — ตัวเลขนี้ต้องมีหลักฐานรองรับ",
  "Month coverage & data gaps":
    "ความครอบคลุมรายเดือนและช่วงข้อมูลขาด",
  "Every month in the period needs a reading, or an entry explaining why not. A month that has neither is the one thing a verifier cannot work around.":
    "ทุกเดือนในรอบรายงานต้องมีค่าที่บันทึกไว้ หรือมีรายการอธิบายว่าเหตุใดจึงไม่มี เดือนที่ไม่มีทั้งสองอย่างคือสิ่งเดียวที่ผู้ตรวจสอบหาทางออกให้ไม่ได้",
  "Months with primary data — click to toggle":
    "เดือนที่มีข้อมูลปฐมภูมิ — คลิกเพื่อสลับสถานะ",
  "green":
    "เขียว",
  "amber":
    "เหลืองอำพัน",
  "red":
    "แดง",
  "Affected parameter":
    "พารามิเตอร์ที่ได้รับผลกระทบ",
  "Data gap — period start":
    "ช่วงข้อมูลขาด — วันเริ่มต้น",
  "Data gap — period end":
    "ช่วงข้อมูลขาด — วันสิ้นสุด",
  "Estimated tCO₂e":
    "tCO₂e ที่ประมาณการ",
  "Remove gap entry":
    "ลบรายการช่วงข้อมูลขาด",
  "Why there is no primary data":
    "เหตุใดจึงไม่มีข้อมูลปฐมภูมิ",
  "How the gap was filled":
    "เติมช่วงข้อมูลขาดด้วยวิธีใด",
  "Why the estimate cannot flatter you":
    "เหตุใดค่าประมาณการนี้จึงไม่เข้าข้างตนเอง",
  "Conservativeness is one of the seven things a verifier tests. The question is not whether you estimated — it is whether the estimate could have come out in your favour.":
    "ความระมัดระวังเชิงอนุรักษ์นิยมเป็นหนึ่งในเจ็ดข้อที่ผู้ตรวจสอบทดสอบ คำถามไม่ใช่ว่าคุณประมาณการหรือไม่ แต่คือค่าประมาณการนั้นอาจออกมาเข้าข้างคุณได้หรือไม่",
  "Their supplier":
    "ซัพพลายเออร์ของเขา",
  "That plant's own reference for itself.":
    "รหัสอ้างอิงที่โรงงานนั้นใช้เรียกตัวเอง",
  "How they make it.":
    "เขาผลิตด้วยวิธีใด",
  "Their own CBAM communication figure.":
    "ตัวเลขจากเอกสารสื่อสาร CBAM ของเขาเอง",
  "The TOTAL they consumed to produce what they sell you, including material that never reaches the finished good — offcuts, spillage, scrap, burn-off.":
    "ปริมาณรวมทั้งหมดที่เขาใช้เพื่อผลิตสิ่งที่ขายให้คุณ รวมถึงวัสดุที่ไม่ได้ไปถึงสินค้าสำเร็จรูป เช่น เศษตัด การหกหล่น เศษโลหะ และการสูญเสียจากการเผาไหม้",
  "Search 67 CBAM goods by name…":
    "ค้นหาสินค้า CBAM 67 รายการด้วยชื่อ…",
  "Pick from the CBAM catalogue":
    "เลือกจากแค็ตตาล็อก CBAM",
  "…or type a name the catalogue does not carry":
    "…หรือพิมพ์ชื่อที่ไม่มีในแค็ตตาล็อก",
  "Search by CN code — 7207…":
    "ค้นหาด้วย CN code — 7207…",
  "Pick a CN code":
    "เลือก CN code",
  "…or type it — 7207 11 90":
    "…หรือพิมพ์เอง — 7207 11 90",
  "How it is made — it tells a verifier which precursors should sit above this tier.":
    "ผลิตด้วยวิธีใด ข้อมูลนี้บอกผู้ตรวจสอบว่าควรมีวัตถุดิบตั้งต้นใดอยู่เหนือชั้นนี้",
  "Route, where known":
    "กระบวนการผลิต หากทราบ",
  "Supplier form":
    "แบบฟอร์มซัพพลายเออร์",
  "English":
    "ภาษาอังกฤษ",
  "Where was this precursor made?":
    "วัตถุดิบตั้งต้นนี้ผลิตที่ใด",
  "Precursor origin":
    "แหล่งกำเนิดของวัตถุดิบตั้งต้น",
  "The company you buy from.":
    "บริษัทที่คุณซื้อจาก",
  "Where it was actually produced. A trader's name is not an installation.":
    "สถานที่ผลิตจริง ชื่อผู้ค้าคนกลางไม่ใช่สถานประกอบการ",
  "The producing plant's own reference for itself.":
    "รหัสอ้างอิงที่โรงงานผู้ผลิตใช้เรียกตัวเอง",
  "In English.":
    "เป็นภาษาอังกฤษ",
  "Who fills this in":
    "ใครเป็นผู้กรอก",
  "The named person who answers for these figures. A department is not an answer.":
    "บุคคลที่ระบุชื่อซึ่งรับผิดชอบต่อตัวเลขเหล่านี้ การระบุเป็นแผนกไม่ถือเป็นคำตอบ",
  "Where this precursor's own link is sent.":
    "ที่อยู่ที่จะส่งลิงก์ของวัตถุดิบตั้งต้นนี้ไป",
  "Telephone":
    "โทรศัพท์",
  "Source production process":
    "กระบวนการผลิตต้นทาง",
  "Which of this installation's own processes made it — e.g. the sinter line, not a supplier.":
    "กระบวนการใดของสถานประกอบการนี้เป็นผู้ผลิต เช่น สายซินเตอร์ ไม่ใช่ซัพพลายเออร์",
  "Data origin":
    "ที่มาของข้อมูล",
  "Specific embedded direct emissions":
    "การปล่อยก๊าซทางตรงที่ฝังอยู่เฉพาะหน่วย",
  "Electricity embedded in the precursor.":
    "ไฟฟ้าที่ฝังอยู่ในวัตถุดิบตั้งต้น",
  "Specific embedded indirect emissions":
    "การปล่อยก๊าซทางอ้อมที่ฝังอยู่เฉพาะหน่วย",
  "Of the producing installation's own report.":
    "จากรายงานของสถานประกอบการผู้ผลิตเอง",
  "Used only when no monthly quantities are recorded. The TOTAL consumed to produce the output, including material that never reaches the finished good — offcuts, spillage, scrap, burn-off. Cut 20% away and you consumed 100 t to ship 80 t; record 100.":
    "ใช้เฉพาะเมื่อไม่ได้บันทึกปริมาณรายเดือน ให้กรอกปริมาณรวมทั้งหมดที่ใช้เพื่อผลิตผลผลิต รวมถึงวัสดุที่ไม่ได้ไปถึงสินค้าสำเร็จรูป เช่น เศษตัด การหกหล่น เศษโลหะ และการสูญเสียจากการเผาไหม้ หากตัดทิ้ง 20% เท่ากับใช้ 100 ตันเพื่อส่งมอบ 80 ตัน ให้บันทึก 100",
  "Total:":
    "รวม:",
  "Iron or steel products — sector parameters":
    "ผลิตภัณฑ์เหล็กหรือเหล็กกล้า — พารามิเตอร์รายสาขา",
  "Main reducing agent":
    "ตัวรีดิวซ์หลัก",
  "Used in this precursor's own production, if known.":
    "ที่ใช้ในการผลิตวัตถุดิบตั้งต้นนี้ หากทราบ",
  "Coke":
    "ถ่านโค้ก",
  "Manganese mass percent":
    "ร้อยละโดยมวลของแมงกานีส",
  "Chromium mass percent":
    "ร้อยละโดยมวลของโครเมียม",
  "Nickel mass percent":
    "ร้อยละโดยมวลของนิกเกิล",
  "Other alloying elements":
    "ธาตุผสมอื่น ๆ",
  "Other alloying elements mass percent":
    "ร้อยละโดยมวลของธาตุผสมอื่น ๆ",
  "Scrap per tonne of product":
    "เศษโลหะต่อสินค้าหนึ่งตัน",
  "Scrap ratio":
    "อัตราส่วนเศษโลหะ",
  "Pre-consumer share of that scrap":
    "สัดส่วนเศษโลหะก่อนถึงมือผู้บริโภค",
  "Pre-consumer scrap percent":
    "ร้อยละของเศษโลหะก่อนถึงมือผู้บริโภค",
  "This input is scrap or waste — SEE is forced to 0 at any depth.":
    "วัตถุดิบนี้เป็นเศษโลหะหรือของเสีย — ค่า SEE ถูกกำหนดเป็น 0 ในทุกชั้น",
  "Un-ticking clears the figure back to unknown rather than leaving a 0 behind.":
    "การเอาเครื่องหมายออกจะล้างค่ากลับเป็นไม่ทราบ ไม่ใช่ทิ้งค่า 0 ไว้",
  "Process excluded":
    "กระบวนการที่ยกเว้น",
  "UNLOCODE":
    "UN/LOCODE",
  "Ask the supplier":
    "ขอข้อมูลจากซัพพลายเออร์",
  "Send this supplier their own link and they answer it themselves — no account, no spreadsheet coming back.":
    "ส่งลิงก์เฉพาะของซัพพลายเออร์รายนี้ไป แล้วเขากรอกเอง ไม่ต้องสมัครบัญชี และไม่ต้องส่งสเปรดชีตกลับมา",
  "No email on file — add one below, or the link has nowhere to go.":
    "ยังไม่มีอีเมลในระบบ — เพิ่มด้านล่าง มิฉะนั้นลิงก์จะไม่มีปลายทาง",
  "Completeness":
    "ความครบถ้วน",
  "Saved versions":
    "เวอร์ชันที่บันทึกไว้",
  "Nothing saved yet — the first change you make becomes version 1.":
    "ยังไม่มีการบันทึก — การแก้ไขครั้งแรกของคุณจะกลายเป็นเวอร์ชัน 1",
  "Current":
    "ปัจจุบัน",
  "Send the supplier their own link, or record a report you already hold — it is all on this one screen, and it saves as you go.":
    "ส่งลิงก์เฉพาะให้ซัพพลายเออร์ หรือบันทึกรายงานที่คุณมีอยู่แล้ว ทำได้ครบในหน้าเดียว และบันทึกอัตโนมัติระหว่างกรอก",
  "Not applicable to this workspace right now.":
    "ยังไม่เกี่ยวข้องกับพื้นที่ทำงานนี้ในขณะนี้",
  "Work through these in order: Finance, then Operations, then Suppliers.":
    "ทำตามลำดับนี้: การเงิน จากนั้นฝ่ายปฏิบัติการ แล้วจึงซัพพลายเออร์",
  "Accept":
    "ยอมรับ",
  "Reject":
    "ปฏิเสธ",
  "Reading the document…":
    "กำลังอ่านเอกสาร…",
  "Proposed values — nothing is written until you accept":
    "ค่าที่เสนอ — จะยังไม่บันทึกจนกว่าคุณจะยอมรับ",
  "All proposals have been dealt with.":
    "จัดการข้อเสนอครบทุกรายการแล้ว",
  "Which process?":
    "กระบวนการใด",
  "Search processes…":
    "ค้นหากระบวนการ…",
  "Name it as your team names it — e.g. Billet reheating, Line 3":
    "ตั้งชื่อตามที่ทีมของคุณเรียก เช่น การอุ่นบิลเล็ตซ้ำ สาย 3",
  "Name the excluded process":
    "ระบุชื่อกระบวนการที่ยกเว้น",
  "State the ground — e.g. Leased to a tenant with its own permit":
    "ระบุเหตุผล เช่น ให้ผู้เช่าซึ่งมีใบอนุญาตของตนเองเช่าใช้",
  "Describe the ground for excluding it":
    "อธิบายเหตุผลในการยกเว้น",
  "The UN/LOCODE for this site — five letters, the two-letter country code first, then three for the place. Thailand’s Map Ta Phut is":
    "UN/LOCODE ของสถานที่นี้ — ห้าตัวอักษร โดยขึ้นต้นด้วยรหัสประเทศสองตัว ตามด้วยรหัสสถานที่อีกสามตัว เช่น มาบตาพุดของไทยคือ",
  "Laem Chabang is":
    "แหลมฉบังคือ",
  "It identifies WHERE the goods were produced. Use the code for the town or port the installation sits in — not your head office, and not the port the goods leave from if that is somewhere else.":
    "รหัสนี้ระบุว่าสินค้าผลิตที่ใด ให้ใช้รหัสของเมืองหรือท่าเรือที่สถานประกอบการตั้งอยู่ ไม่ใช่สำนักงานใหญ่ และไม่ใช่ท่าเรือที่ส่งออกหากอยู่คนละที่",
  "If this site has no code yet:":
    "หากสถานที่นี้ยังไม่มีรหัส:",
  "apply for a new one directly through UNECE, which is the body that issues them. Your customs broker cannot create one for you.":
    "ให้ยื่นขอรหัสใหม่โดยตรงกับ UNECE ซึ่งเป็นหน่วยงานผู้ออกรหัส ตัวแทนออกของของคุณไม่สามารถสร้างรหัสให้ได้",
  "In the meantime, use the code of the nearest listed town — an approximate but real code is more useful to a declarant than a blank field, and the coordinates below pin the exact location anyway.":
    "ระหว่างนี้ให้ใช้รหัสของเมืองที่ใกล้ที่สุดที่มีอยู่ในรายการ รหัสที่ใกล้เคียงแต่มีอยู่จริงมีประโยชน์ต่อผู้ยื่นสำแดงมากกว่าช่องว่าง และพิกัดด้านล่างก็ระบุตำแหน่งที่แน่นอนอยู่แล้ว",
  "This installation is us":
    "สถานประกอบการนี้คือของเราเอง",
  "Tick this when your own company produces the good. The monthly data then lands in your inbox instead of going out to a supplier.":
    "ติ๊กช่องนี้เมื่อบริษัทของคุณเป็นผู้ผลิตสินค้า ข้อมูลรายเดือนจะเข้ากล่องงานของคุณเองแทนที่จะส่งออกไปยังซัพพลายเออร์",
  "Name of the installation (English)":
    "ชื่อสถานประกอบการ (ภาษาอังกฤษ)",
  "Name of the installation":
    "ชื่อสถานประกอบการ",
  "The local-language name. Field (i) of the EU template.":
    "ชื่อในภาษาท้องถิ่น ตรงกับฟิลด์ (i) ของแบบฟอร์ม EU",
  "The id the buyer, the declarant and the verifier all quote for this site.":
    "รหัสที่ผู้ซื้อ ผู้ยื่นสำแดง และผู้ตรวจสอบ ใช้อ้างอิงถึงสถานที่นี้ตรงกัน",
  "Country code first, then letters, numbers and single hyphens — 5 to 32 characters. The country must match, because a mismatched prefix is nearly always a reference copied from another plant.":
    "ขึ้นต้นด้วยรหัสประเทศ ตามด้วยตัวอักษร ตัวเลข และขีดกลางเดี่ยว ความยาว 5 ถึง 32 อักขระ รหัสประเทศต้องตรงกัน เพราะคำนำหน้าที่ไม่ตรงมักหมายถึงรหัสที่คัดลอกมาจากโรงงานอื่น",
  "It has to be unique.":
    "ต้องไม่ซ้ำกับรายการอื่น",
  "Street, number":
    "ถนน เลขที่",
  "Economic activity":
    "กิจกรรมทางเศรษฐกิจ",
  "It helps a verifier orient themselves, but nothing downstream depends on it.":
    "ช่วยให้ผู้ตรวจสอบเข้าใจภาพรวม แต่ไม่มีส่วนใดในระบบที่ขึ้นกับข้อมูลนี้",
  "Post code":
    "รหัสไปรษณีย์",
  "P.O. Box":
    "ตู้ ปณ.",
  "P.O. Box 42":
    "ตู้ ปณ. 42",
  "City":
    "เมือง / อำเภอ",
  "Latitude — main emission source":
    "ละติจูด — แหล่งปล่อยก๊าซหลัก",
  "The main emission source, not the front gate — usually the stack of the furnace or kiln that dominates the figures. Decimal degrees, and both fields or neither.":
    "ให้ระบุแหล่งปล่อยก๊าซหลัก ไม่ใช่ประตูหน้าโรงงาน โดยทั่วไปคือปล่องของเตาหลอมหรือเตาเผาที่มีสัดส่วนมากที่สุด ใช้หน่วยองศาทศนิยม และต้องกรอกทั้งสองช่องหรือไม่กรอกเลย",
  "Longitude — main emission source":
    "ลองจิจูด — แหล่งปล่อยก๊าซหลัก",
  "Name of authorised representative":
    "ชื่อผู้แทนที่ได้รับมอบอำนาจ",
  "The named person who can answer for these figures. A verifier will ask who signed the data off, and a department is not an answer.":
    "บุคคลที่ระบุชื่อซึ่งสามารถรับผิดชอบต่อตัวเลขเหล่านี้ ผู้ตรวจสอบจะถามว่าใครเป็นผู้รับรองข้อมูล และการระบุเป็นแผนกไม่ถือเป็นคำตอบ",
  "You can nominate the representative later without holding up the site record, but it is worth filling in before verification.":
    "คุณระบุผู้แทนภายหลังได้โดยไม่ต้องหยุดการบันทึกข้อมูลสถานประกอบการ แต่ควรกรอกให้เรียบร้อยก่อนเข้าสู่การตรวจสอบ",
  "Other goods produced at this installation":
    "สินค้าอื่นที่ผลิตในสถานประกอบการนี้",
  "If this site also makes products outside CBAM scope, list them so a verifier can confirm the boundary in this report covers only the CBAM good and nothing from another line.":
    "หากสถานที่นี้ผลิตสินค้าที่อยู่นอกขอบเขต CBAM ด้วย ให้ระบุไว้ เพื่อให้ผู้ตรวจสอบยืนยันได้ว่าขอบเขตในรายงานนี้ครอบคลุมเฉพาะสินค้า CBAM ไม่รวมสายการผลิตอื่น",
  "None declared. If this site also makes products outside CBAM scope, list them here — a verifier reads this to confirm the boundary above covers only the CBAM good.":
    "ยังไม่ได้ระบุรายการใด หากสถานที่นี้ผลิตสินค้าที่อยู่นอกขอบเขต CBAM ด้วย ให้ระบุไว้ที่นี่ ผู้ตรวจสอบจะอ่านส่วนนี้เพื่อยืนยันว่าขอบเขตด้านบนครอบคลุมเฉพาะสินค้า CBAM",
  "Search by name or CN code — billet, tinplate, 7207…":
    "ค้นหาด้วยชื่อหรือ CN code — billet, tinplate, 7207…",
  "Search the CBAM catalogue":
    "ค้นหาในแค็ตตาล็อก CBAM",
  "Group":
    "กลุ่ม",
  "Showing":
    "กำลังแสดง",
  "Nothing in the CBAM catalogue matches that. If the good you export is not here, it is probably outside CBAM scope — check the CN code on your customs declaration.":
    "ไม่พบรายการที่ตรงกันในแค็ตตาล็อก CBAM หากสินค้าที่คุณส่งออกไม่มีอยู่ที่นี่ ก็มีแนวโน้มว่าอยู่นอกขอบเขต CBAM ลองตรวจ CN code ในใบขนสินค้าของคุณ",
  "The company you buy from and chase, as it appears on their invoices. Their individual plants are added underneath — one supplier can run several.":
    "บริษัทที่คุณซื้อและติดตามงานด้วย ตามชื่อที่ปรากฏในใบแจ้งหนี้ของเขา โรงงานแต่ละแห่งเพิ่มไว้ด้านล่าง — ซัพพลายเออร์รายเดียวอาจมีหลายโรงงาน",
  "Where the company is registered.":
    "ประเทศที่บริษัทจดทะเบียน",
  "The named person who fills the monthly data in. A verifier asks who answered for the figures, and a department is not an answer.":
    "บุคคลที่ระบุชื่อซึ่งเป็นผู้กรอกข้อมูลรายเดือน ผู้ตรวจสอบจะถามว่าใครเป็นผู้ตอบตัวเลขเหล่านี้ และการระบุเป็นแผนกไม่ถือเป็นคำตอบ",
  "This is the address the monthly link is sent to. It is the one field here that stops the whole arrangement working if it is wrong.":
    "นี่คือที่อยู่ที่จะส่งลิงก์รายเดือนไป เป็นช่องเดียวในหน้านี้ที่หากกรอกผิดจะทำให้ทั้งกระบวนการใช้งานไม่ได้",
  "The producing site, entered once. These are the facts a verifier asks for, so they are not re-asked every year.":
    "สถานที่ผลิต กรอกเพียงครั้งเดียว ข้อมูลเหล่านี้คือสิ่งที่ผู้ตรวจสอบขอ จึงไม่ต้องกรอกซ้ำทุกปี",
  "Add an installation":
    "เพิ่มสถานประกอบการ",
  "The company behind the plant. Their installations are added next — one supplier can run several.":
    "บริษัทที่อยู่เบื้องหลังโรงงาน สถานประกอบการของเขาจะเพิ่มในขั้นถัดไป — ซัพพลายเออร์รายเดียวอาจมีหลายแห่ง",

  /* ── The supplier's own link — the twelve monthly steps ─────────────────────────────── */
  "Fuel":
    "เชื้อเพลิง",
  "Factor source":
    "ที่มาของค่าแฟกเตอร์",
  "Process emissions":
    "การปล่อยก๊าซจากกระบวนการ",
  "Net calorific value":
    "ค่าความร้อนสุทธิ (NCV)",
  "Emission factor":
    "ค่าแฟกเตอร์การปล่อยก๊าซ",
  "The exporter filled them in from what they had. You are the one standing at the plant, so correct anything that is wrong — the coordinates especially, which are the MAIN EMISSION SOURCE and not the front gate.":
    "ผู้ส่งออกกรอกข้อมูลเหล่านี้จากสิ่งที่เขามีอยู่ คุณคือผู้ที่อยู่หน้างานจริง จึงขอให้แก้ไขส่วนที่ไม่ถูกต้อง โดยเฉพาะพิกัด ซึ่งต้องเป็นตำแหน่งของแหล่งปล่อยก๊าซหลัก ไม่ใช่ประตูหน้าโรงงาน",
  "The installation reference is the exception. It is the id everything about this plant is already filed under, so it is shown but not editable.":
    "ยกเว้นรหัสอ้างอิงสถานประกอบการ ซึ่งเป็นรหัสที่ข้อมูลทั้งหมดของโรงงานนี้จัดเก็บไว้แล้ว จึงแสดงให้เห็นแต่แก้ไขไม่ได้",
  "The boundary":
    "ขอบเขต",
  "The set of processes whose emissions belong to this good — not the site fence. A plant making three products has three boundaries.":
    "ชุดของกระบวนการที่การปล่อยก๊าซเป็นของสินค้านี้ ไม่ใช่รั้วโรงงาน โรงงานที่ผลิตสามสินค้าย่อมมีสามขอบเขต",
  "Which processes these figures cover, in the order material moves through them.":
    "ตัวเลขเหล่านี้ครอบคลุมกระบวนการใดบ้าง เรียงตามลำดับที่วัตถุดิบเคลื่อนผ่าน",
  "Describe the boundary":
    "อธิบายขอบเขต",
  "Two or three sentences. Name the furnace or line, and say where the boundary stops.":
    "สองถึงสามประโยค ระบุชื่อเตาหรือสายการผลิต และบอกว่าขอบเขตสิ้นสุดที่ใด",
  "Processes inside the boundary, in order":
    "กระบวนการภายในขอบเขต เรียงตามลำดับ",
  "Add them in the sequence material passes through.":
    "เพิ่มตามลำดับที่วัตถุดิบเคลื่อนผ่าน",
  "Add the next process…":
    "เพิ่มกระบวนการถัดไป…",
  "Deliberately outside the boundary":
    "ที่จงใจไว้นอกขอบเขต",
  "Pick it from the same list the boundary is drawn in. A process already excluded drops off the list.":
    "เลือกจากรายการเดียวกับที่ใช้กำหนดขอบเขต กระบวนการที่ยกเว้นไปแล้วจะหายไปจากรายการ",
  "On what ground":
    "ด้วยเหตุผลใด",
  "Say how you know":
    "อธิบายว่าคุณทราบได้อย่างไร",
  "Name the meter, the subcontractor or the threshold. “Not relevant” is a finding.":
    "ระบุมิเตอร์ ผู้รับเหมา หรือเกณฑ์ที่ใช้ การตอบว่า “ไม่เกี่ยวข้อง” จะกลายเป็นข้อสังเกตของผู้ตรวจสอบ",
  "Fuels burned":
    "เชื้อเพลิงที่เผาไหม้",
  "What this is.":
    "ส่วนนี้คืออะไร",
  "Every fuel burned inside the boundary across the whole year, and the meter that measures each one.":
    "เชื้อเพลิงทุกชนิดที่เผาไหม้ภายในขอบเขตตลอดทั้งปี และมิเตอร์ที่ใช้วัดแต่ละชนิด",
  "Why it is asked.":
    "ทำไมจึงถาม",
  "How to fill it.":
    "กรอกอย่างไร",
  "Tick every fuel you burn, even the ones used only occasionally. Then add one instrument row per fuel — what it measures, the make and model, how often somebody reads it, and the date on its last calibration certificate.":
    "ติ๊กเชื้อเพลิงทุกชนิดที่คุณใช้ รวมถึงชนิดที่ใช้เป็นครั้งคราว จากนั้นเพิ่มอุปกรณ์วัดหนึ่งแถวต่อหนึ่งเชื้อเพลิง ระบุสิ่งที่วัด ยี่ห้อและรุ่น ความถี่ในการอ่านค่า และวันที่บนใบรับรองการสอบเทียบล่าสุด",
  "What you burn, and the meters behind it.":
    "คุณเผาไหม้อะไร และมิเตอร์ใดรองรับตัวเลขนั้น",
  "How direct emissions are determined":
    "วิธีกำหนดค่าการปล่อยก๊าซทางตรง",
  "Fuels burned inside the boundary":
    "เชื้อเพลิงที่เผาไหม้ภายในขอบเขต",
  "Every fuel used across the year, not only this month. Choosing one adds its row to the monthly readings.":
    "เชื้อเพลิงทุกชนิดที่ใช้ตลอดทั้งปี ไม่ใช่เฉพาะเดือนนี้ เมื่อเลือกชนิดใด ระบบจะเพิ่มแถวของชนิดนั้นในค่าที่บันทึกรายเดือน",
  "Choose the fuels…":
    "เลือกเชื้อเพลิง…",
  "Name the other fuel":
    "ระบุชื่อเชื้อเพลิงอื่น",
  "In the terms your invoices use.":
    "ใช้คำเดียวกับที่ปรากฏในใบแจ้งหนี้ของคุณ",
  "Where your power comes from, and which meter the reported MWh is read off.":
    "ไฟฟ้าของคุณมาจากที่ใด และค่า MWh ที่รายงานอ่านจากมิเตอร์ตัวใด",
  "Pick the closest match — the list is written in the names Thai plants actually use. Then name the meter: the feeder, the meter number, whatever appears on the bill.":
    "เลือกตัวเลือกที่ใกล้เคียงที่สุด รายการนี้เขียนด้วยคำที่โรงงานไทยใช้จริง จากนั้นระบุมิเตอร์ ทั้งสายป้อน หมายเลขมิเตอร์ หรือข้อมูลใดก็ตามที่ปรากฏในใบแจ้งค่าไฟ",
  "Where the power comes from, and the meter behind the figure.":
    "ไฟฟ้ามาจากที่ใด และมิเตอร์ใดรองรับตัวเลขนี้",
  "Where the electricity comes from":
    "ไฟฟ้ามาจากที่ใด",
  "Decides which emission factor is admissible.":
    "เป็นตัวกำหนดว่าใช้ค่าแฟกเตอร์การปล่อยก๊าซใดได้",
  "Choose a supply":
    "เลือกแหล่งจ่ายไฟ",
  "Electricity supply":
    "แหล่งจ่ายไฟฟ้า",
  "Which meter or feeder the reported MWh is read from — the one the invoice evidences.":
    "ค่า MWh ที่รายงานอ่านจากมิเตอร์หรือสายป้อนใด — ตัวที่ใบแจ้งหนี้ยืนยัน",
  "Describe the supply":
    "อธิบายรูปแบบการจ่ายไฟ",
  "A check that the fuel your generator burns has not been left out — or counted twice.":
    "ตรวจสอบว่าเชื้อเพลิงที่เครื่องกำเนิดไฟฟ้าของคุณใช้ไม่ตกหล่น และไม่ถูกนับซ้ำ",
  "On-site generation is the easiest place in a CBAM return to double-count. The gas your turbine burns is direct emissions, and the electricity it makes is the same carbon again. Only one of them may be reported.":
    "การผลิตไฟฟ้าในพื้นที่คือจุดที่นับซ้ำได้ง่ายที่สุดในการยื่น CBAM ก๊าซที่กังหันของคุณเผาไหม้คือการปล่อยก๊าซทางตรง และไฟฟ้าที่ผลิตได้ก็คือคาร์บอนก้อนเดียวกันอีกครั้ง รายงานได้เพียงอย่างเดียวเท่านั้น",
  "Report the FUEL in the fuels card above and tick the box here. Do not also enter the generated MWh as purchased electricity.":
    "ให้รายงานเชื้อเพลิงในการ์ดเชื้อเพลิงด้านบน แล้วติ๊กช่องนี้ อย่ากรอก MWh ที่ผลิตเองเป็นไฟฟ้าที่ซื้อมาอีก",
  "A 2 MW gas cogeneration set: the natural gas goes in the fuel list, the electricity it produces does not go in as a separate purchase.":
    "ตัวอย่าง ชุดผลิตไฟฟ้าร่วมความร้อนขนาด 2 MW ที่ใช้ก๊าซ ให้ระบุก๊าซธรรมชาติในรายการเชื้อเพลิง ส่วนไฟฟ้าที่ผลิตได้ไม่ต้องกรอกเป็นการซื้อไฟแยกอีก",
  "One confirmation, so the same carbon is not counted twice.":
    "ยืนยันหนึ่งข้อ เพื่อไม่ให้คาร์บอนก้อนเดียวกันถูกนับสองครั้ง",
  "The fuel this generation burns is already listed in the fuels card above.":
    "เชื้อเพลิงที่ใช้ผลิตไฟฟ้านี้ระบุไว้แล้วในการ์ดเชื้อเพลิงด้านบน",
  "Gaps and checking":
    "ช่วงข้อมูลขาดและการตรวจทาน",
  "A period where an instrument failed or a reading was lost. Declaring it is not an admission — hiding it is the finding.":
    "ช่วงเวลาที่อุปกรณ์ขัดข้องหรือค่าที่อ่านสูญหาย การประกาศไว้ไม่ใช่การยอมรับความผิด แต่การปกปิดต่างหากที่จะกลายเป็นข้อสังเกต",
  "Anything you could not measure, and who checks the figures before they go out.":
    "สิ่งที่คุณวัดไม่ได้ และผู้ที่ตรวจทานตัวเลขก่อนส่งออกไป",
  "Data gaps":
    "ช่วงข้อมูลขาด",
  "No gaps declared. If every figure this year came off a working instrument, that is the right answer.":
    "ยังไม่ได้ประกาศช่วงข้อมูลขาด หากทุกตัวเลขของปีนี้มาจากอุปกรณ์ที่ทำงานปกติ นั่นคือคำตอบที่ถูกต้อง",
  "What happened":
    "เกิดอะไรขึ้น",
  "How the figure was estimated":
    "ประมาณค่าตัวเลขนี้อย่างไร",
  "Specific enough that a verifier could redo it.":
    "ระบุให้ละเอียดพอที่ผู้ตรวจสอบจะคำนวณตามได้",
  "This gap's reviewer — a person, not a department.":
    "ผู้ตรวจทานของช่วงข้อมูลขาดนี้ — ระบุเป็นบุคคล ไม่ใช่แผนก",
  "Alloy composition and scrap use":
    "ส่วนผสมโลหะและการใช้เศษโลหะ",
  "Annual, like the rest of this step. Every field here is optional except where the category requires it.":
    "เป็นข้อมูลรายปีเช่นเดียวกับส่วนอื่นในขั้นตอนนี้ ทุกช่องไม่บังคับ ยกเว้นกรณีที่ประเภทสินค้ากำหนดไว้",
  "If this good is made from pig iron or DRI, what reduced the iron ore? For a pure scrap-EAF route, choose “None” — that is a complete and expected answer.":
    "หากสินค้านี้ผลิตจากเหล็กดิบหรือ DRI อะไรคือสิ่งที่รีดิวซ์สินแร่เหล็ก สำหรับกระบวนการ scrap-EAF ล้วน ให้เลือก “ไม่มี” ซึ่งเป็นคำตอบที่ครบถ้วนและตรงตามที่คาด",
  "Not answered":
    "ยังไม่ได้ตอบ",
  "Describe the reducing agent":
    "อธิบายตัวรีดิวซ์",
  "Steel mill identification number":
    "หมายเลขประจำโรงงานเหล็ก",
  "Leave blank if manganese is only a trace element.":
    "เว้นว่างไว้หากแมงกานีสเป็นเพียงธาตุปริมาณน้อย",
  "Leave blank if chromium is only a trace element.":
    "เว้นว่างไว้หากโครเมียมเป็นเพียงธาตุปริมาณน้อย",
  "Leave blank if nickel is only a trace element.":
    "เว้นว่างไว้หากนิกเกิลเป็นเพียงธาตุปริมาณน้อย",
  "Combined share of any alloying elements not covered by Mn/Cr/Ni above.":
    "สัดส่วนรวมของธาตุผสมอื่นที่ไม่ได้ระบุไว้ใน Mn/Cr/Ni ข้างต้น",
  "Other materials mass percent":
    "ร้อยละโดยมวลของวัสดุอื่น",
  "Carbon mass percent":
    "ร้อยละโดยมวลของคาร์บอน",
  "Tonnes of scrap per tonne of steel":
    "ตันของเศษโลหะต่อเหล็กหนึ่งตัน",
  "Pre-consumer scrap comes from your own production process — offcuts, trimmings, rejected pieces. Post-consumer scrap comes from end-of-life products such as scrapped vehicles or appliances.":
    "เศษโลหะก่อนถึงมือผู้บริโภคมาจากกระบวนการผลิตของคุณเอง เช่น เศษตัด เศษเจียน และชิ้นงานที่ไม่ผ่าน ส่วนเศษโลหะหลังการบริโภคมาจากสินค้าที่หมดอายุใช้งาน เช่น รถยนต์หรือเครื่องใช้ไฟฟ้าที่ปลดระวาง",
  "This composition may qualify as high alloy steel rather than non-alloy steel — confirm the CN code and aggregated goods category are still correct for this workspace.":
    "ส่วนผสมนี้อาจเข้าข่ายเหล็กกล้าผสมสูงมากกว่าเหล็กกล้าไม่ผสม โปรดยืนยันว่า CN code และ aggregated goods category ยังถูกต้องสำหรับพื้นที่ทำงานนี้",
  "Production":
    "การผลิต",
  "Saleable output of this good in this month, in tonnes.":
    "ผลผลิตที่ขายได้ของสินค้านี้ในเดือนนี้ หน่วยเป็นตัน",
  "Not what shipped — what came off the line. Scrap returned into the process is not production, and a month with no output is 0 rather than blank.":
    "ไม่ใช่ปริมาณที่ส่งออกไป แต่คือปริมาณที่ออกจากสายการผลิต เศษโลหะที่ป้อนกลับเข้ากระบวนการไม่นับเป็นผลผลิต และเดือนที่ไม่มีผลผลิตให้กรอก 0 ไม่ใช่เว้นว่าง",
  "Produced this month":
    "ผลิตได้ในเดือนนี้",
  "Tonnes of saleable output.":
    "จำนวนตันของผลผลิตที่ขายได้",
  "Production tonnes":
    "ผลผลิต (ตัน)",
  "Every fuel burned inside the boundary this month, with the quantity as your invoice states it.":
    "เชื้อเพลิงทุกชนิดที่เผาไหม้ภายในขอบเขตในเดือนนี้ พร้อมปริมาณตามที่ระบุในใบแจ้งหนี้ของคุณ",
  "A quantity in m³, kg, t or litres needs a net calorific value beside it. An emission factor is per gigajoule, and applying it to a volume overstates the month by roughly twenty-five times — so the form will not let the figure through without one.":
    "ปริมาณที่กรอกเป็น m³ kg t หรือลิตร ต้องมีค่าความร้อนสุทธิกำกับด้วย เพราะค่าแฟกเตอร์การปล่อยก๊าซคิดต่อกิกะจูล การนำไปคูณกับปริมาตรโดยตรงจะทำให้ตัวเลขของเดือนสูงเกินจริงราวยี่สิบห้าเท่า แบบฟอร์มจึงไม่ยอมให้ผ่านหากไม่มีค่านี้",
  "No fuel recorded. If this installation burned nothing this month, that is a valid answer — leave it empty.":
    "ยังไม่มีการบันทึกเชื้อเพลิง หากสถานประกอบการนี้ไม่ได้เผาไหม้อะไรเลยในเดือนนี้ ถือเป็นคำตอบที่ถูกต้อง ให้เว้นว่างไว้",
  "Remove this fuel":
    "ลบเชื้อเพลิงนี้",
  "Fuel type":
    "ชนิดเชื้อเพลิง",
  "The metered figure for this month.":
    "ค่าที่อ่านจากมิเตอร์สำหรับเดือนนี้",
  "Calorific value":
    "ค่าความร้อน",
  "Where that factor comes from.":
    "ค่าแฟกเตอร์นั้นมาจากที่ใด",
  "Calorific value and emission factor unlock once a spec sheet, invoice or lab report is attached on the Documents step.":
    "ช่องค่าความร้อนและค่าแฟกเตอร์การปล่อยก๊าซจะปลดล็อกเมื่อแนบสเปกชีต ใบแจ้งหนี้ หรือผลวิเคราะห์จากห้องปฏิบัติการในขั้นตอนเอกสารแล้ว",
  "Biomass fraction":
    "สัดส่วนชีวมวล",
  "The share of this fuel's carbon treated as biomass rather than fossil — a fraction, 0 to 1, not a percentage. Zero is the legal default: an unknown fraction counts as fossil.":
    "สัดส่วนคาร์บอนของเชื้อเพลิงนี้ที่นับเป็นชีวมวลแทนฟอสซิล กรอกเป็นเศษส่วนตั้งแต่ 0 ถึง 1 ไม่ใช่ร้อยละ ค่าเริ่มต้นตามกฎหมายคือศูนย์ เพราะสัดส่วนที่ไม่ทราบจะถูกนับเป็นฟอสซิล",
  "One row per source this month, as the invoice or contract states it — not per tonne. Each source carries its own factor: grid, PPA, self-generated and a direct technical link are never the same number, so a single blended figure would hide which one applies.":
    "หนึ่งแถวต่อหนึ่งแหล่งจ่ายในเดือนนี้ ตามที่ระบุในใบแจ้งหนี้หรือสัญญา ไม่ใช่ต่อตัน แต่ละแหล่งมีค่าแฟกเตอร์ของตนเอง ทั้งไฟจากระบบจำหน่าย PPA ไฟที่ผลิตเอง และการเชื่อมต่อทางเทคนิคโดยตรง ไม่เคยเป็นตัวเลขเดียวกัน การรวมเป็นค่าเดียวจะกลบว่าค่าใดใช้กับกรณีใด",
  "No electricity source recorded. Add one, even if the plant drew nothing this month.":
    "ยังไม่มีการบันทึกแหล่งจ่ายไฟฟ้า ให้เพิ่มอย่างน้อยหนึ่งรายการ แม้โรงงานจะไม่ได้ใช้ไฟเลยในเดือนนี้",
  "Where it comes from":
    "มาจากที่ใด",
  "Electricity source type":
    "ประเภทแหล่งจ่ายไฟฟ้า",
  "Consumed":
    "ปริมาณที่ใช้",
  "Absolute MWh, real power only.":
    "ค่า MWh สัมบูรณ์ นับเฉพาะกำลังไฟฟ้าจริง",
  "Electricity MWh":
    "ไฟฟ้า (MWh)",
  "Electricity factor":
    "ค่าแฟกเตอร์ไฟฟ้า",
  "No process emissions recorded. Leave empty if there are none.":
    "ยังไม่มีการบันทึกการปล่อยก๊าซจากกระบวนการ หากไม่มีให้เว้นว่างไว้",
  "Process emission method":
    "วิธีคำนวณการปล่อยก๊าซจากกระบวนการ",
  "Pick a material":
    "เลือกวัสดุ",
  "Process emission material":
    "วัสดุที่ก่อการปล่อยก๊าซจากกระบวนการ",
  "Process emission quantity":
    "ปริมาณที่ก่อการปล่อยก๊าซจากกระบวนการ",
  "Conversion factor":
    "ค่าแปลงหน่วย",
  "Default 1.":
    "ค่าเริ่มต้นคือ 1",
  "Computed:":
    "คำนวณได้:",
  "Notes on this month":
    "หมายเหตุของเดือนนี้",
  "Anything a verifier should know that the numbers above do not say — a shutdown, a meter swapped mid-month, a delivery counted late.":
    "สิ่งที่ผู้ตรวจสอบควรทราบแต่ตัวเลขด้านบนไม่ได้บอก เช่น การหยุดเดินเครื่อง การเปลี่ยนมิเตอร์กลางเดือน หรือการรับของที่นับล่าช้า",
  "Notes":
    "หมายเหตุ",
  "Plain English. Leave it empty if the month was ordinary.":
    "เขียนเป็นภาษาอังกฤษอย่างง่าย หากเดือนนี้เป็นปกติให้เว้นว่างไว้",
  "How much of each input arrived in this month, as your goods-received records state it.":
    "วัตถุดิบแต่ละรายการรับเข้ามาเท่าใดในเดือนนี้ ตามบันทึกการรับสินค้าของคุณ",
  "A precursor is a CBAM good consumed to make this one — billet into rebar, anode into aluminium. Its emissions travel into the finished good with the tonnage.":
    "วัตถุดิบตั้งต้นคือสินค้า CBAM ที่ถูกใช้เพื่อผลิตสินค้านี้ เช่น บิลเล็ตกลายเป็นเหล็กเส้น แอโนดกลายเป็นอะลูมิเนียม การปล่อยก๊าซของวัตถุดิบจะเดินทางเข้าสู่สินค้าสำเร็จรูปไปพร้อมกับปริมาณตัน",
  "Report what was received in the month, not what was consumed from stock. Enter 0 if none arrived — a blank is read as a gap, and a gap understates the finished good.":
    "ให้รายงานปริมาณที่รับเข้าในเดือนนั้น ไม่ใช่ปริมาณที่เบิกใช้จากคลัง หากไม่มีของเข้าให้กรอก 0 เพราะช่องว่างจะถูกอ่านว่าข้อมูลขาด และข้อมูลที่ขาดจะทำให้ค่าของสินค้าสำเร็จรูปต่ำกว่าความจริง",
  "The exporter has not listed any precursors for this good. If you buy in a CBAM input to make it — billet, anode, hot-rolled coil — tell them, because it belongs in the chain.":
    "ผู้ส่งออกยังไม่ได้ระบุวัตถุดิบตั้งต้นใดสำหรับสินค้านี้ หากคุณจัดซื้อวัตถุดิบที่อยู่ในขอบเขต CBAM มาใช้ผลิต เช่น บิลเล็ต แอโนด หรือเหล็กแผ่นรีดร้อน กรุณาแจ้งเขา เพราะรายการนั้นต้องอยู่ในห่วงโซ่อุปทาน",
  "Received this month":
    "รับเข้าในเดือนนี้",
  "Net mass, from the goods-received note.":
    "มวลสุทธิ ตามใบรับสินค้า",
  "One document behind each figure — the utility invoice for electricity, the fuel invoice or delivery note for each fuel, the production log for the tonnage.":
    "หนึ่งเอกสารต่อหนึ่งตัวเลข ได้แก่ ใบแจ้งค่าไฟสำหรับไฟฟ้า ใบแจ้งหนี้หรือใบส่งของสำหรับเชื้อเพลิงแต่ละชนิด และบันทึกการผลิตสำหรับปริมาณตัน",
  "A figure with nothing behind it is the first thing a verifier removes, and removing it does not make the year smaller — it makes it unverified.":
    "ตัวเลขที่ไม่มีหลักฐานรองรับคือสิ่งแรกที่ผู้ตรวจสอบจะตัดออก และการตัดออกไม่ได้ทำให้ยอดทั้งปีลดลง แต่ทำให้ทั้งปีกลายเป็นข้อมูลที่ตรวจสอบไม่ได้",
  "Grouped by who usually holds each document — Operations, Finance, Suppliers, Lab, and Organisation-level — so nothing has to be chased from a list that mixes all five together.":
    "จัดกลุ่มตามผู้ที่มักถือเอกสารแต่ละประเภท ได้แก่ ฝ่ายปฏิบัติการ ฝ่ายการเงิน ซัพพลายเออร์ ห้องปฏิบัติการ และระดับองค์กร เพื่อไม่ต้องไล่ตามจากรายการที่ปนกันทั้งห้าฝ่าย",
  "What a verifier will ask to see behind each figure in this month, grouped by who usually holds it.":
    "สิ่งที่ผู้ตรวจสอบจะขอดูเป็นหลักฐานของแต่ละตัวเลขในเดือนนี้ จัดกลุ่มตามผู้ที่มักถือเอกสารนั้น",

  /* ── The supplier portal — questionnaire, documents, team, sign & submit ─────────────────────────────── */
  "Version history":
    "ประวัติเวอร์ชัน",
  "Register your installation":
    "ลงทะเบียนสถานประกอบการของคุณ",
  "This link looks invalid or expired.":
    "ลิงก์นี้ดูเหมือนไม่ถูกต้องหรือหมดอายุแล้ว",
  "Precursor links are personal to one supplier in one supply chain. Ask whoever asked you for this data to resend it.":
    "ลิงก์วัตถุดิบตั้งต้นเป็นลิงก์เฉพาะของซัพพลายเออร์รายหนึ่งในห่วงโซ่อุปทานหนึ่ง กรุณาขอให้ผู้ที่ร้องขอข้อมูลนี้ส่งลิงก์ใหม่ให้",
  "Submitted.":
    "ส่งข้อมูลแล้ว",
  "Save your progress on this device?":
    "บันทึกความคืบหน้าไว้ในอุปกรณ์นี้หรือไม่",
  "This is":
    "นี่",
  "not a real account":
    "ไม่ใช่บัญชีผู้ใช้จริง",
  "Save on this device":
    "บันทึกไว้ในอุปกรณ์นี้",
  "Your emissions data for this supply chain":
    "ข้อมูลการปล่อยก๊าซของคุณสำหรับห่วงโซ่อุปทานนี้",
  "This plant's own reference for itself.":
    "รหัสอ้างอิงที่โรงงานนี้ใช้เรียกตัวเอง",
  "How you make it — tells the exporter which precursors should sit above you.":
    "คุณผลิตด้วยวิธีใด ข้อมูลนี้บอกผู้ส่งออกว่าควรมีวัตถุดิบตั้งต้นใดอยู่เหนือคุณ",
  "Your own CBAM communication figure.":
    "ตัวเลขจากเอกสารสื่อสาร CBAM ของคุณเอง",
  "The TOTAL you consumed to produce what you supply, including material that never reaches the finished good — offcuts, spillage, scrap, burn-off.":
    "ปริมาณรวมทั้งหมดที่คุณใช้เพื่อผลิตสิ่งที่จัดส่ง รวมถึงวัสดุที่ไม่ได้ไปถึงสินค้าสำเร็จรูป เช่น เศษตัด การหกหล่น เศษโลหะ และการสูญเสียจากการเผาไหม้",
  "Report expiry date":
    "วันหมดอายุของรายงาน",
  "Submit":
    "ส่งข้อมูล",
  "Supplier links are personal and time-limited. Ask the exporter who contacted you to resend their data request, or try one of the demo links below.":
    "ลิงก์ของซัพพลายเออร์เป็นลิงก์เฉพาะบุคคลและมีอายุจำกัด กรุณาขอให้ผู้ส่งออกที่ติดต่อคุณส่งคำขอข้อมูลใหม่ หรือทดลองใช้ลิงก์ตัวอย่างด้านล่าง",
  "open →":
    "เปิด →",
  "Demo links open a sample CBAM Q2 2026 request from Siam Steel Export Co.":
    "ลิงก์ตัวอย่างจะเปิดคำขอ CBAM ไตรมาส 2 ปี 2026 ตัวอย่างจาก Siam Steel Export Co.",
  "Go to exporter portal":
    "ไปที่พอร์ทัลผู้ส่งออก",
  "Open the supplier link instead":
    "เปิดลิงก์ของซัพพลายเออร์แทน",
  "Role / title":
    "บทบาท / ตำแหน่ง",
  "Reference":
    "เอกสารอ้างอิง",
  "Revision requested.":
    "มีการขอให้แก้ไข",
  "auto":
    "อัตโนมัติ",
  "Carried over from your last submission — confirm it still holds for this period.":
    "นำมาจากการส่งข้อมูลครั้งก่อน กรุณายืนยันว่ายังใช้ได้กับรอบนี้",
  "Select…":
    "เลือก…",
  "Precursor material":
    "วัสดุที่เป็นวัตถุดิบตั้งต้น",
  "Precursor CN code":
    "CN code ของวัตถุดิบตั้งต้น",
  "Embedded emissions of the precursor":
    "การปล่อยก๊าซที่ฝังอยู่ในวัตถุดิบตั้งต้น",
  "Production route of this precursor (optional)":
    "กระบวนการผลิตของวัตถุดิบตั้งต้นนี้ (ไม่บังคับ)",
  "Precursor production route":
    "กระบวนการผลิตของวัตถุดิบตั้งต้น",
  "+ Add input":
    "+ เพิ่มวัตถุดิบ",
  "Remove this precursor and everything under it":
    "ลบวัตถุดิบตั้งต้นนี้และทุกรายการที่อยู่ใต้ลงไป",
  "Scrap carries an embedded emission factor of exactly 0 under CBAM — the figure is locked, not withheld.":
    "ภายใต้ CBAM เศษโลหะมีค่าการปล่อยก๊าซที่ฝังอยู่เท่ากับ 0 พอดี ค่านี้จึงถูกล็อกไว้ ไม่ใช่ถูกปิดบัง",
  "This looks like scrap. If it is, tick the box — scrap must be declared at 0, and leaving a figure on it overstates your own emissions.":
    "รายการนี้ดูเหมือนเศษโลหะ หากใช่ ให้ติ๊กช่อง เพราะเศษโลหะต้องประกาศเป็น 0 การทิ้งตัวเลขไว้จะทำให้การปล่อยก๊าซของคุณสูงเกินจริง",
  "+ Add precursor":
    "+ เพิ่มวัตถุดิบตั้งต้น",
  "Where this figure came from":
    "ตัวเลขนี้มาจากที่ใด",
  "Fuel burned":
    "เชื้อเพลิงที่เผาไหม้",
  "+ Add fuel":
    "+ เพิ่มเชื้อเพลิง",
  "Fuel quantity":
    "ปริมาณเชื้อเพลิง",
  "Invoice no. / meter id":
    "เลขที่ใบแจ้งหนี้ / รหัสมิเตอร์",
  "Declared as an assumption — it will appear in the assumptions register a verifier reads.":
    "ประกาศไว้เป็นข้อสมมติ ค่านี้จะปรากฏในทะเบียนข้อสมมติที่ผู้ตรวจสอบอ่าน",
  "+ Add meter":
    "+ เพิ่มมิเตอร์",
  "MWh (period)":
    "MWh (ทั้งรอบ)",
  "Electricity, absolute MWh":
    "ไฟฟ้า หน่วย MWh สัมบูรณ์",
  "Grid emission factor":
    "ค่าแฟกเตอร์การปล่อยก๊าซของระบบจำหน่าย",
  "Bill reference / dataset":
    "เลขที่ใบแจ้งหนี้ / ชุดข้อมูลอ้างอิง",
  "Process materials":
    "วัสดุในกระบวนการ",
  "+ Add material":
    "+ เพิ่มวัสดุ",
  "Mass (t)":
    "มวล (ตัน)",
  "Mass in tonnes":
    "มวลเป็นตัน",
  "C fraction":
    "สัดส่วนคาร์บอน",
  "Carbon content":
    "ปริมาณคาร์บอน",
  "· enter your output in Production to get the per-tonne figure":
    "· กรอกผลผลิตในหัวข้อการผลิต เพื่อให้ได้ตัวเลขต่อตัน",
  "Your carbon data":
    "ข้อมูลคาร์บอนของคุณ",
  "Take me to the field":
    "พาไปที่ช่องนั้น",
  "They’re outlined below with a note on what to check. Fix them and re-run the check before you sign.":
    "รายการเหล่านั้นมีกรอบกำกับไว้ด้านล่างพร้อมหมายเหตุว่าต้องตรวจอะไร แก้ไขแล้วรันการตรวจสอบอีกครั้งก่อนลงนาม",
  "Jump to first flagged field":
    "ไปที่ช่องแรกที่ถูกทำเครื่องหมาย",
  "Back to overview":
    "กลับไปที่ภาพรวม",
  "Continue to documents":
    "ไปต่อที่เอกสาร",
  "Certrace Supplier Portal":
    "พอร์ทัลซัพพลายเออร์ Certrace",
  "What you’ll be asked for":
    "สิ่งที่คุณจะถูกขอ",
  "Supporting documents":
    "เอกสารประกอบ",
  "Company & installation profile":
    "ข้อมูลบริษัทและสถานประกอบการ",
  "Optional, and reusable. We save this securely so your installation identity pre-fills the questionnaire now and skips re-typing on every future request from any buyer.":
    "ไม่บังคับ และนำกลับมาใช้ได้ เราจัดเก็บอย่างปลอดภัย เพื่อให้ข้อมูลสถานประกอบการของคุณถูกเติมล่วงหน้าในแบบสอบถามนี้ และไม่ต้องพิมพ์ซ้ำในคำขอครั้งต่อ ๆ ไปจากผู้ซื้อรายใดก็ตาม",
  "Legal company name":
    "ชื่อบริษัทตามกฎหมาย",
  "Production installation":
    "สถานประกอบการที่ผลิต",
  "Lat, long of the main emission source.":
    "ละติจูดและลองจิจูดของแหล่งปล่อยก๊าซหลัก",
  "Main production route":
    "กระบวนการผลิตหลัก",
  "e.g. EAF, BF-BOF, DRI-EAF.":
    "เช่น EAF, BF-BOF, DRI-EAF",
  "EAF (electric arc furnace)":
    "EAF (เตาอาร์กไฟฟ้า)",
  "Skip for now":
    "ข้ามไปก่อน",
  "Save & continue":
    "บันทึกแล้วไปต่อ",
  "Your request workspace":
    "พื้นที่ทำงานสำหรับคำขอของคุณ",
  "complete":
    "เสร็จสมบูรณ์",
  "Review the figures":
    "ตรวจทานตัวเลข",
  "Sections":
    "หัวข้อ",
  "Submitted as":
    "ส่งในนาม",
  "View the receipt and verification trail.":
    "ดูใบรับและร่องรอยการตรวจสอบ",
  "View submission":
    "ดูข้อมูลที่ส่ง",
  "Locked — not part of this revision.":
    "ล็อกไว้ — ไม่อยู่ในขอบเขตการแก้ไขรอบนี้",
  "Attach your certificates":
    "แนบใบรับรองของคุณ",
  "Take me to the document":
    "พาไปที่เอกสารนั้น",
  "Continue to team":
    "ไปต่อที่ทีมงาน",
  "Data sharing":
    "การแบ่งปันข้อมูล",
  "Who sees what.":
    "ใครเห็นอะไรบ้าง",
  "Rows marked":
    "แถวที่ทำเครื่องหมายว่า",
  "Section":
    "หัวข้อ",
  "Buyers":
    "ผู้ซื้อ",
  "Re-using your data":
    "การนำข้อมูลของคุณกลับมาใช้",
  "Allow this exporter to reuse my saved data":
    "อนุญาตให้ผู้ส่งออกรายนี้นำข้อมูลที่บันทึกไว้ของฉันกลับมาใช้",
  "Team & departments":
    "ทีมงานและแผนก",
  "Split the work by department":
    "แบ่งงานตามแผนก",
  "Invite a colleague":
    "เชิญเพื่อนร่วมงาน",
  "Department":
    "แผนก",
  "Remove colleague":
    "นำเพื่อนร่วมงานออก",
  "Assigned sections":
    "หัวข้อที่ได้รับมอบหมาย",
  "Run quality check":
    "ตรวจสอบคุณภาพข้อมูล",
  "Finish the required fields first":
    "กรอกช่องที่จำเป็นให้ครบก่อน",
  "left.":
    "เหลืออยู่",
  "Take me to the first one":
    "พาไปที่รายการแรก",
  "Back to questionnaire":
    "กลับไปที่แบบสอบถาม",
  "AI checks your data before you sign":
    "AI ตรวจข้อมูลของคุณก่อนลงนาม",
  "data quality score":
    "คะแนนคุณภาพข้อมูล",
  "Continue to sign & submit":
    "ไปต่อที่ลงนามและส่ง",
  "Review & submit":
    "ตรวจทานและส่ง",
  "One last look, then sign":
    "ตรวจอีกครั้ง แล้วลงนาม",
  "AI validation summary":
    "สรุปผลการตรวจสอบด้วย AI",
  "Emissions summary":
    "สรุปการปล่อยก๊าซ",
  "Quality score:":
    "คะแนนคุณภาพ:",
  "Electronic signature":
    "ลายเซ็นอิเล็กทรอนิกส์",
  "Your full name":
    "ชื่อ-นามสกุลของคุณ",
  "Nothing submitted yet.":
    "ยังไม่ได้ส่งข้อมูล",
  "What happens next":
    "ขั้นตอนต่อไป",
  "They approve it, or request a revision on specific fields.":
    "เขาจะอนุมัติ หรือขอให้แก้ไขเฉพาะบางช่อง",
  "If a revision is needed, you’ll get an email — only the flagged fields unlock.":
    "หากต้องแก้ไข คุณจะได้รับอีเมล และจะปลดล็อกเฉพาะช่องที่ถูกทำเครื่องหมายไว้",
  "Demo":
    "ตัวอย่างการใช้งาน",
  "Simulate the exporter requesting a revision to see the resubmission loop.":
    "จำลองกรณีผู้ส่งออกขอให้แก้ไข เพื่อดูขั้นตอนการส่งข้อมูลใหม่",
  "Request revision":
    "ขอให้แก้ไข",
  "Before you invite anyone":
    "ก่อนเชิญใคร",
  "Are you a supplier as well?":
    "คุณเป็นซัพพลายเออร์ด้วยหรือไม่",
  "Many exporters produce the good themselves. If your own company operates the installation, you do not invite a supplier — the data comes to you.":
    "ผู้ส่งออกจำนวนมากผลิตสินค้าเอง หากบริษัทของคุณเป็นผู้ดำเนินการสถานประกอบการเอง คุณไม่ต้องเชิญซัพพลายเออร์ เพราะข้อมูลจะมาถึงคุณโดยตรง",
  "No — I buy from others":
    "ไม่ใช่ — ฉันซื้อจากผู้อื่น",
  "Yes — we produce it ourselves":
    "ใช่ — เราผลิตเอง",
  "Answering yes registers your own installation and switches you to the supplier side of the portal, where the monthly requests for your own site are waiting. You can still invite third-party suppliers afterwards — most exporters do both.":
    "หากตอบว่าใช่ ระบบจะลงทะเบียนสถานประกอบการของคุณ และสลับไปยังฝั่งซัพพลายเออร์ของพอร์ทัล ซึ่งมีคำขอรายเดือนของสถานที่ของคุณรออยู่ คุณยังเชิญซัพพลายเออร์ภายนอกได้ในภายหลัง — ผู้ส่งออกส่วนใหญ่ทำทั้งสองอย่าง",
  "Your own site is the installation a verifier will scope against. Register it once and every workspace reuses it.":
    "สถานที่ของคุณเองคือสถานประกอบการที่ผู้ตรวจสอบจะใช้กำหนดขอบเขต ลงทะเบียนเพียงครั้งเดียว แล้วทุกพื้นที่ทำงานจะนำไปใช้ซ้ำ",

  /* ── Dashboard, suppliers, smart links, team, the new-workspace wizard and the monthly link ─────────────────────────────── */
  "Everything that needs you, what it is worth avoiding, and where every product stands.":
    "ทุกเรื่องที่ต้องการคุณ มูลค่าที่หลีกเลี่ยงได้ และสถานะของสินค้าแต่ละรายการ",
  "A verification workspace is one installation × one good × one reporting year. Create the first one and this screen fills itself: what needs you, what verified data is worth against the EU default, and how close each product is to surviving a verifier.":
    "พื้นที่ทำงานตรวจสอบรับรองหนึ่งชุดคือ สถานประกอบการหนึ่งแห่ง × สินค้าหนึ่งรายการ × ปีรายงานหนึ่งปี เมื่อสร้างชุดแรก หน้านี้จะแสดงข้อมูลเอง ทั้งสิ่งที่ต้องการคุณ มูลค่าของข้อมูลที่ผ่านการตรวจสอบเมื่อเทียบกับค่า EU default และระยะห่างของสินค้าแต่ละรายการจากการผ่านการตรวจสอบ",
  "activity data":
    "ข้อมูลกิจกรรม",
  "Draft pack downloaded":
    "ดาวน์โหลดชุดเอกสารฉบับร่างแล้ว",
  "Verifier pack downloaded":
    "ดาวน์โหลดชุดเอกสารสำหรับผู้ตรวจสอบแล้ว",
  "Stamped DRAFT — NOT READY FOR VERIFICATION on every page.":
    "ประทับข้อความ DRAFT — NOT READY FOR VERIFICATION ไว้ทุกหน้า",
  "The pack cannot be assembled":
    "ยังประกอบชุดเอกสารไม่ได้",
  "Could not build the pack":
    "สร้างชุดเอกสารไม่สำเร็จ",
  "Your installations":
    "สถานประกอบการของคุณ",
  "Every site you operate yourself. Register them here once and their monthly data lands in your inbox instead of going out to a supplier. Add as many as you run.":
    "ทุกสถานที่ที่คุณดำเนินการเอง ลงทะเบียนที่นี่ครั้งเดียว แล้วข้อมูลรายเดือนจะเข้ากล่องงานของคุณแทนที่จะส่งออกไปยังซัพพลายเออร์ เพิ่มได้ตามจำนวนที่คุณดำเนินการจริง",
  "Add a site":
    "เพิ่มสถานที่",
  "No sites registered yet. If you produce the good yourself, add the plant that makes it.":
    "ยังไม่ได้ลงทะเบียนสถานที่ใด หากคุณผลิตสินค้าเอง ให้เพิ่มโรงงานที่ผลิต",
  "No address yet.":
    "ยังไม่มีที่อยู่",
  "Still missing:":
    "ยังขาด:",
  "Remove {name}":
    "นำ {name} ออก",
  "Click again to remove":
    "คลิกอีกครั้งเพื่อนำออก",
  "Remove this site":
    "นำสถานที่นี้ออก",
  "Confirm":
    "ยืนยัน",
  "Your installation":
    "สถานประกอบการของคุณ",
  "These are the facts a verifier asks for about a producing site. Entered once here, reused by every workspace.":
    "ข้อมูลเหล่านี้คือสิ่งที่ผู้ตรวจสอบถามเกี่ยวกับสถานที่ผลิต กรอกที่นี่ครั้งเดียว แล้วทุกพื้นที่ทำงานจะนำไปใช้ซ้ำ",
  "Every link you have issued":
    "ทุกลิงก์ที่คุณออกไป",
  "A workspace asks for twelve months of readings and a verified figure from each of its precursor suppliers. Each of those asks is a link somebody opens and fills in — this is all of them, from every workspace, with where each one stands.":
    "พื้นที่ทำงานหนึ่งชุดจะขอค่าที่บันทึกไว้สิบสองเดือน และค่าที่ผ่านการตรวจสอบจากซัพพลายเออร์วัตถุดิบตั้งต้นทุกราย คำขอแต่ละรายการคือลิงก์ที่มีคนเปิดเข้าไปกรอก หน้านี้รวมทุกลิงก์จากทุกพื้นที่ทำงาน พร้อมสถานะของแต่ละรายการ",
  "No links yet":
    "ยังไม่มีลิงก์",
  "Links appear the moment a workspace exists — one for each month of its reporting year, and one for each precursor supplier you add to its chain. Create your first workspace and the year lays itself out here.":
    "ลิงก์จะปรากฏทันทีที่มีพื้นที่ทำงาน โดยมีหนึ่งลิงก์ต่อหนึ่งเดือนของปีรายงาน และหนึ่งลิงก์ต่อซัพพลายเออร์วัตถุดิบตั้งต้นแต่ละรายที่คุณเพิ่มเข้าห่วงโซ่ สร้างพื้นที่ทำงานแรกแล้วทั้งปีจะเรียงตัวขึ้นที่นี่",
  "Nothing matches this filter.":
    "ไม่มีรายการที่ตรงกับตัวกรองนี้",
  "Clear the filter":
    "ล้างตัวกรอง",
  "Every link, whatever state it is in.":
    "ทุกลิงก์ ไม่ว่าจะอยู่ในสถานะใด",
  "Asking for":
    "กำลังขอ",
  "Both kinds of ask.":
    "คำขอทั้งสองประเภท",
  "What is being asked":
    "สิ่งที่กำลังขอ",
  "Who fills it in":
    "ใครเป็นผู้กรอก",
  "Filled in":
    "กรอกแล้ว",
  "Tracked for a precursor":
    "ติดตามให้วัตถุดิบตั้งต้น",
  "Lands on you":
    "เข้ามาที่คุณ",
  "Open the workspace":
    "เปิดพื้นที่ทำงาน",
  "The link to hand over":
    "ลิงก์ที่จะส่งต่อ",
  "Whoever opens this fills the form in on their own — they need no Certrace account and see nothing else in yours. Certrace does not email it for you: Send records that you asked and puts the address on your clipboard to paste wherever you reach them.":
    "ผู้ที่เปิดลิงก์นี้จะกรอกแบบฟอร์มด้วยตนเอง ไม่ต้องมีบัญชี Certrace และไม่เห็นข้อมูลอื่นในบัญชีของคุณ Certrace ไม่ได้ส่งอีเมลให้ ปุ่มส่งจะบันทึกว่าคุณได้ขอแล้ว และคัดลอกลิงก์ไว้ในคลิปบอร์ดเพื่อให้คุณนำไปวางในช่องทางที่ติดต่อเขาได้",
  "Fill this in yourself":
    "กรอกเอง",
  "Edit supplier":
    "แก้ไขซัพพลายเออร์",
  "Add installation":
    "เพิ่มสถานประกอบการ",
  "Installations":
    "สถานประกอบการ",
  "Goods in verification":
    "สินค้าที่อยู่ระหว่างการตรวจสอบรับรอง",
  "Months asked for":
    "เดือนที่ขอไป",
  "Months in":
    "เดือนที่ได้รับแล้ว",
  "of what was asked":
    "ของที่ขอไปทั้งหมด",
  "No installations recorded for this supplier yet. A workspace is scoped to a plant, so until one exists there is nothing to ask them for.":
    "ยังไม่ได้บันทึกสถานประกอบการของซัพพลายเออร์รายนี้ พื้นที่ทำงานผูกกับโรงงาน จึงยังไม่มีสิ่งใดให้ขอจนกว่าจะมีสถานประกอบการ",
  "Add their first installation":
    "เพิ่มสถานประกอบการแห่งแรกของเขา",
  "What is being verified at this supplier's plants, and every month you have actually sent them. A month appears once it has gone out and leaves the late band once it is in.":
    "สิ่งที่กำลังตรวจสอบรับรองที่โรงงานของซัพพลายเออร์รายนี้ และทุกเดือนที่คุณส่งคำขอไปแล้วจริง เดือนหนึ่งจะปรากฏเมื่อส่งออกไปแล้ว และจะออกจากกลุ่มล่าช้าเมื่อได้รับข้อมูลกลับมา",
  "No goods are being verified at this supplier yet. Create a workspace for one of their plants and its twelve months start here.":
    "ยังไม่มีสินค้าใดอยู่ระหว่างการตรวจสอบรับรองที่ซัพพลายเออร์รายนี้ สร้างพื้นที่ทำงานสำหรับโรงงานของเขาสักแห่ง แล้วสิบสองเดือนจะเริ่มต้นที่นี่",
  "Nothing sent yet. Open the workspace's Monthly data tab and send a month to start the trail.":
    "ยังไม่ได้ส่งอะไรไป เปิดแท็บข้อมูลรายเดือนของพื้นที่ทำงาน แล้วส่งสักเดือนเพื่อเริ่มบันทึกร่องรอย",
  "in":
    "ใน",
  "Generated report":
    "รายงานที่สร้างขึ้น",
  "One document per good, built from what this supplier has actually sent you. Generated on download rather than stored, so it always says what the workspace says today.":
    "หนึ่งเอกสารต่อหนึ่งสินค้า สร้างจากข้อมูลที่ซัพพลายเออร์รายนี้ส่งมาจริง โดยสร้างตอนดาวน์โหลดแทนการจัดเก็บไว้ เอกสารจึงตรงกับข้อมูลในพื้นที่ทำงาน ณ วันนี้เสมอ",
  "Nothing to generate yet.":
    "ยังไม่มีข้อมูลให้สร้างเอกสาร",
  "Not connected yet":
    "ยังไม่ได้เชื่อมต่อ",
  "Export the verifier pack for {product} from Reports — it is built from the same months.":
    "ส่งออกชุดเอกสารสำหรับผู้ตรวจสอบของ {product} ได้จากหน้ารายงาน — สร้างจากข้อมูลเดือนชุดเดียวกัน",
  "Download document":
    "ดาวน์โหลดเอกสาร",
  "Add an installation for {name}":
    "เพิ่มสถานประกอบการให้ {name}",
  "Edit installation":
    "แก้ไขสถานประกอบการ",
  "Who produces your goods.":
    "ใครเป็นผู้ผลิตสินค้าของคุณ",
  "Every company you collect data from, and the plants each of them runs. A supplier answers through a link each month — no account, no seat, no fee.":
    "ทุกบริษัทที่คุณเก็บข้อมูลด้วย และโรงงานที่แต่ละรายดำเนินการ ซัพพลายเออร์ตอบผ่านลิงก์ทุกเดือน ไม่ต้องมีบัญชี ไม่ใช้สิทธิ์ใช้งาน และไม่มีค่าใช้จ่าย",
  "across every supplier":
    "รวมทุกซัพพลายเออร์",
  "workspaces on their plants":
    "พื้นที่ทำงานบนโรงงานของเขา",
  "A workspace is scoped to a plant, so until one is added there is nothing to ask them for. Open a supplier and add the plant that makes your good.":
    "พื้นที่ทำงานผูกกับโรงงาน จึงยังไม่มีสิ่งใดให้ขอจนกว่าจะเพิ่มโรงงาน เปิดซัพพลายเออร์แล้วเพิ่มโรงงานที่ผลิตสินค้าของคุณ",
  "Data suppliers":
    "ซัพพลายเออร์ผู้ให้ข้อมูล",
  "Precursor suppliers":
    "ซัพพลายเออร์วัตถุดิบตั้งต้น",
  "precursor suppliers have a Certrace account":
    "ซัพพลายเออร์วัตถุดิบตั้งต้นที่มีบัญชี Certrace",
  "saved on their own device after a submission, not a real login.":
    "บันทึกไว้ในอุปกรณ์ของเขาเองหลังส่งข้อมูล ไม่ใช่การเข้าสู่ระบบจริง",
  "No suppliers yet. Add the first company you buy from.":
    "ยังไม่มีซัพพลายเออร์ เพิ่มบริษัทแรกที่คุณซื้อจาก",
  "none yet":
    "ยังไม่มี",
  "Workspace · period":
    "พื้นที่ทำงาน · รอบรายงาน",
  "SEE & verification due":
    "SEE และกำหนดส่งการตรวจสอบ",
  "No precursor suppliers match “{query}”.":
    "ไม่พบซัพพลายเออร์วัตถุดิบตั้งต้นที่ตรงกับ “{query}”",
  "No precursor suppliers yet — they are added from a workspace's Supply Chain — Precursor Tree.":
    "ยังไม่มีซัพพลายเออร์วัตถุดิบตั้งต้น เพิ่มได้จากห่วงโซ่อุปทานของพื้นที่ทำงาน ในส่วนผังวัตถุดิบตั้งต้น",
  "Unnamed supplier":
    "ซัพพลายเออร์ที่ยังไม่ได้ตั้งชื่อ",
  "{name} removed":
    "นำ {name} ออกแล้ว",
  "Their seat is free. Nothing they already signed off is affected.":
    "สิทธิ์ใช้งานของเขาว่างแล้ว สิ่งที่เขาลงนามรับรองไว้ก่อนหน้านี้ไม่ได้รับผลกระทบ",
  "Who is on the account.":
    "ใครอยู่ในบัญชีนี้บ้าง",
  "Your team and what each person can do. Suppliers are always free and never take a seat — they answer through a link, without an account.":
    "ทีมของคุณและสิ่งที่แต่ละคนทำได้ ซัพพลายเออร์ใช้งานฟรีเสมอและไม่ใช้สิทธิ์ใช้งาน เพราะตอบผ่านลิงก์โดยไม่ต้องมีบัญชี",
  "outside your company":
    "นอกบริษัทของคุณ",
  "Remove from the account":
    "นำออกจากบัญชี",
  "They join your team and take a seat. You can hand them a month to review from that month's screen in any workspace.":
    "เขาจะเข้าร่วมทีมของคุณและใช้สิทธิ์ใช้งานหนึ่งที่นั่ง คุณมอบหมายเดือนให้เขาตรวจทานได้จากหน้าของเดือนนั้นในพื้นที่ทำงานใดก็ได้",
  "They join your team roster and take a seat. Hand them their first month to review from any workspace.":
    "เขาจะเข้าร่วมรายชื่อทีมของคุณและใช้สิทธิ์ใช้งานหนึ่งที่นั่ง มอบหมายเดือนแรกให้เขาตรวจทานได้จากพื้นที่ทำงานใดก็ได้",
  "They now appear anywhere you can hand a month over.":
    "ตอนนี้เขาจะปรากฏในทุกที่ที่คุณมอบหมายเดือนให้ได้",
  "What are we getting verified?":
    "เรากำลังตรวจสอบรับรองอะไร",
  "One installation, one good, one reporting year. Everything a verifier asks about is scoped that way.":
    "หนึ่งสถานประกอบการ หนึ่งสินค้า หนึ่งปีรายงาน ทุกสิ่งที่ผู้ตรวจสอบถามล้วนอยู่ในขอบเขตนี้",
  "Creating this on behalf of":
    "สร้างรายการนี้ในนามของ",
  "— once its data is in and Readiness is complete, its Monitoring Methodology Documentation can be downloaded from here and handed to an external verifier.":
    " — เมื่อข้อมูลครบและความพร้อมสมบูรณ์แล้ว เอกสารวิธีการติดตามตรวจวัด (MMD) จะดาวน์โหลดได้จากที่นี่เพื่อส่งให้ผู้ตรวจสอบภายนอก",
  "A workspace covers one producing installation. Often that is your own plant — an exporter who rolls their own coil is the supplier too.":
    "พื้นที่ทำงานหนึ่งชุดครอบคลุมสถานประกอบการผู้ผลิตหนึ่งแห่ง ซึ่งบ่อยครั้งคือโรงงานของคุณเอง ผู้ส่งออกที่รีดคอยล์เองก็เป็นซัพพลายเออร์ด้วย",
  "Pick your own site and the monthly data lands in your inbox. Pick another supplier and they get a link each month.":
    "หากเลือกสถานที่ของคุณเอง ข้อมูลรายเดือนจะเข้ากล่องงานของคุณ หากเลือกซัพพลายเออร์รายอื่น เขาจะได้รับลิงก์ทุกเดือน",
  "Who produces this good":
    "ใครเป็นผู้ผลิตสินค้านี้",
  "We produce it ourselves":
    "เราผลิตเอง",
  "Your own installation. Each month lands in your inbox — nothing goes to a third party.":
    "สถานประกอบการของคุณเอง ข้อมูลแต่ละเดือนจะเข้ากล่องงานของคุณ ไม่มีอะไรส่งออกไปยังบุคคลภายนอก",
  "Another supplier produces it":
    "ซัพพลายเออร์รายอื่นเป็นผู้ผลิต",
  "Their installation. They get a link each month and fill it in without an account.":
    "สถานประกอบการของเขา เขาจะได้รับลิงก์ทุกเดือนและกรอกได้โดยไม่ต้องมีบัญชี",
  "Choose one to carry on. Everything after this is scoped to the site you pick.":
    "เลือกหนึ่งรายการเพื่อดำเนินการต่อ ทุกขั้นตอนหลังจากนี้จะผูกกับสถานที่ที่คุณเลือก",
  "You have not registered your own installation yet. Fill it in here — it is saved to your organisation and appears in Settings, so you only enter it once.":
    "คุณยังไม่ได้ลงทะเบียนสถานประกอบการของตนเอง กรอกได้ที่นี่ ข้อมูลจะถูกบันทึกไว้กับองค์กรของคุณและปรากฏในหน้าการตั้งค่า จึงกรอกเพียงครั้งเดียว",
  "Which of your sites":
    "สถานที่ใดของคุณ",
  "You operate more than one. Everything after this is scoped to the one you pick.":
    "คุณดำเนินการมากกว่าหนึ่งแห่ง ทุกขั้นตอนหลังจากนี้จะผูกกับแห่งที่คุณเลือก",
  "Choose one of your sites":
    "เลือกสถานที่ของคุณหนึ่งแห่ง",
  "Some details a verifier asks for are still missing. You can carry on and finish them in Settings.":
    "ยังขาดรายละเอียดบางอย่างที่ผู้ตรวจสอบจะถาม คุณดำเนินการต่อได้ และกรอกให้ครบภายหลังในหน้าการตั้งค่า",
  "The company you buy from. Their plants are underneath.":
    "บริษัทที่คุณซื้อจาก โรงงานของเขาอยู่ด้านล่าง",
  "Supplier installation":
    "สถานประกอบการของซัพพลายเออร์",
  "Add another site of ours":
    "เพิ่มสถานที่ของเราอีกแห่ง",
  "A second plant you operate yourself. Its months land in your own inbox, exactly like the first.":
    "โรงงานแห่งที่สองที่คุณดำเนินการเอง ข้อมูลรายเดือนจะเข้ากล่องงานของคุณเช่นเดียวกับแห่งแรก",
  "Search by name or by the CN code on your customs declaration — CN is usually the faster of the two.":
    "ค้นหาด้วยชื่อ หรือด้วย CN code ที่อยู่ในใบขนสินค้าของคุณ โดยทั่วไปการค้นด้วย CN จะเร็วกว่า",
  "The type tag on each row is what decides the shape of the rest of the workspace: a precursor has nothing above it, a finished product carries a chain.":
    "ป้ายประเภทในแต่ละแถวเป็นตัวกำหนดรูปแบบของพื้นที่ทำงานทั้งหมด วัตถุดิบตั้งต้นจะไม่มีอะไรอยู่เหนือขึ้นไป ส่วนสินค้าสำเร็จรูปจะมีห่วงโซ่อุปทานตามมา",
  "Which good":
    "สินค้าใด",
  "It is declared once per workspace: a route that changes mid-year is a re-baseline, and that is a second workspace.":
    "ประกาศครั้งเดียวต่อหนึ่งพื้นที่ทำงาน หากกระบวนการผลิตเปลี่ยนกลางปี ถือเป็นการตั้งฐานใหม่ ซึ่งต้องใช้พื้นที่ทำงานอีกชุดหนึ่ง",
  "How it is produced":
    "ผลิตด้วยวิธีใด",
  "The workspace covers 1 January to 31 December of this year.":
    "พื้นที่ทำงานนี้ครอบคลุมตั้งแต่ 1 มกราคม ถึง 31 ธันวาคมของปีนี้",
  "The same three sections — MMD, monthly data and precursors — are needed for every month of the year, so this is a schedule rather than a form.":
    "สามส่วนเดิม ได้แก่ MMD ข้อมูลรายเดือน และวัตถุดิบตั้งต้น จำเป็นต้องมีครบทุกเดือนของปี ส่วนนี้จึงเป็นตารางเวลา ไม่ใช่แบบฟอร์ม",
  "A month can only be asked for once it has ENDED, so the request is dated the last day of the month it covers. That is fixed — asking earlier is impossible, and asking later only shortens the time the other end has.":
    "เดือนหนึ่งจะขอข้อมูลได้เมื่อเดือนนั้นสิ้นสุดแล้ว คำขอจึงลงวันที่เป็นวันสุดท้ายของเดือนที่ขอ ค่านี้กำหนดตายตัว เพราะขอเร็วกว่านั้นเป็นไปไม่ได้ และขอช้ากว่านั้นมีแต่จะลดเวลาที่อีกฝ่ายมี",
  "When each month falls due":
    "แต่ละเดือนครบกำหนดเมื่อใด",
  "Each month":
    "แต่ละเดือน",
  "Workspace links are personal to one installation and one reporting year. Ask the exporter who contacted you to resend it.":
    "ลิงก์พื้นที่ทำงานเป็นลิงก์เฉพาะของสถานประกอบการหนึ่งแห่งและปีรายงานหนึ่งปี กรุณาขอให้ผู้ส่งออกที่ติดต่อคุณส่งลิงก์ใหม่",
  "Monthly data request":
    "คำขอข้อมูลรายเดือน",
  "Submitted month":
    "เดือนที่ส่งข้อมูลแล้ว",
  "It goes to the exporter as a request. They decide — nothing is unlocked until they say yes.":
    "คำขอนี้จะส่งไปยังผู้ส่งออก เขาเป็นผู้ตัดสินใจ และจะยังไม่ปลดล็อกสิ่งใดจนกว่าเขาจะตอบตกลง",
  "Send the request":
    "ส่งคำขอ",
  "What needs changing":
    "สิ่งที่ต้องแก้ไข",
  "Name the figure and what is wrong with it — this is all they will see.":
    "ระบุตัวเลขและสิ่งที่ผิด — นี่คือทั้งหมดที่เขาจะเห็น",
  "The February gas invoice arrived after we submitted. The quantity should be 41,200 m³, not 38,000.":
    "ใบแจ้งหนี้ค่าก๊าซของเดือนกุมภาพันธ์มาถึงหลังจากที่เราส่งข้อมูลแล้ว ปริมาณที่ถูกต้องคือ 41,200 m³ ไม่ใช่ 38,000",
  "You are answering for":
    "คุณกำลังตอบในนามของ",
  "What this is for":
    "ส่วนนี้มีไว้เพื่ออะไร",
  "Your customer exports this good to the EU. Under CBAM the importer must state the CO₂ embedded in every tonne they bring in, and that figure can only come from the plant that made it. These twelve monthly requests collect it.":
    "ลูกค้าของคุณส่งออกสินค้านี้ไปยังสหภาพยุโรป ภายใต้ CBAM ผู้นำเข้าต้องระบุปริมาณ CO₂ ที่ฝังอยู่ในสินค้าทุกตันที่นำเข้า และตัวเลขนั้นมาจากโรงงานผู้ผลิตเท่านั้น คำขอรายเดือนทั้งสิบสองครั้งนี้มีไว้เพื่อเก็บข้อมูลดังกล่าว",
  "If it is not reported, the importer is not let off — they fall back to a default set high enough that real data is nearly always cheaper. So what you enter here has a price attached, in both directions.":
    "หากไม่มีการรายงาน ผู้นำเข้าก็ไม่ได้รับการยกเว้น แต่ต้องใช้ค่า default ซึ่งตั้งไว้สูงพอที่ข้อมูลจริงจะถูกกว่าเกือบทุกกรณี สิ่งที่คุณกรอกที่นี่จึงมีมูลค่าติดอยู่ด้วยทั้งสองทาง",
  "Nothing is sent yet.":
    "ยังไม่ได้ส่งอะไรไป",
  "Go to the first thing to fix":
    "ไปที่รายการแรกที่ต้องแก้",
  "Each one is outlined in blue on its own screen, and stays outlined after you have answered it.":
    "แต่ละรายการจะมีกรอบสีน้ำเงินในหน้าของตนเอง และกรอบจะยังคงอยู่หลังจากคุณตอบแล้ว",
  "No particular section was named — read the note above and work through the whole month again.":
    "ไม่ได้ระบุหัวข้อใดเป็นการเฉพาะ กรุณาอ่านหมายเหตุด้านบนแล้วตรวจทานทั้งเดือนอีกครั้ง",
  "What you will be asked":
    "สิ่งที่คุณจะถูกขอ",
  "Everything saves as you type, so you can leave and come back on this machine. Nothing is submitted until you sign on the last step.":
    "ระบบบันทึกอัตโนมัติระหว่างที่คุณพิมพ์ คุณจึงออกแล้วกลับมาทำต่อบนเครื่องนี้ได้ และจะยังไม่ส่งข้อมูลจนกว่าคุณจะลงนามในขั้นตอนสุดท้าย",
  "This month is closed":
    "เดือนนี้ปิดแล้ว",
  "Nothing here can be changed. If a figure was wrong, ask the exporter to reopen it — the button at the foot of this page sends the request, and they decide.":
    "ไม่สามารถแก้ไขสิ่งใดในหน้านี้ได้ หากมีตัวเลขผิด ให้ขอให้ผู้ส่งออกเปิดเดือนนี้ใหม่ ปุ่มที่ท้ายหน้าจะส่งคำขอไป และเขาเป็นผู้ตัดสินใจ",
  "Edit requested — waiting on the exporter.":
    "ส่งคำขอแก้ไขแล้ว — รอผู้ส่งออกพิจารณา",
  "They declined to reopen this month.":
    "เขาไม่อนุมัติให้เปิดเดือนนี้ใหม่",
  "Which month":
    "เดือนใด",
  "Switch if you are answering for a different one.":
    "สลับได้หากคุณกำลังตอบสำหรับเดือนอื่น",
  "Produced":
    "ผลิตได้",
  "Direct CO₂":
    "CO₂ ทางตรง",
  "Electricity CO₂":
    "CO₂ จากไฟฟ้า",
  "Per tonne":
    "ต่อตัน",
  "Nothing to report. Carry on to sign it off.":
    "ไม่มีรายการค้าง ดำเนินการต่อเพื่อลงนามรับรองได้เลย",
  "This month cannot be submitted yet.":
    "ยังส่งข้อมูลของเดือนนี้ไม่ได้",
  "Internal authorisation":
    "การอนุมัติภายใน",
  "Certrace — go to certrace.co":
    "Certrace — ไปที่ certrace.co",
  "Buyers don't wait. They pick whoever proves it first.":
    "ผู้ซื้อไม่รอ เขาเลือกรายที่พิสูจน์ได้ก่อน",
  "Buyer name":
    "ชื่อผู้ซื้อ",
  "The EU importer, as it appears on your invoice.":
    "ผู้นำเข้าในสหภาพยุโรป ตามชื่อที่ปรากฏในใบแจ้งหนี้ของคุณ",
  "Rotterdam Steel Import BV":
    "Rotterdam Steel Import BV",
  "Where the importer is established.":
    "ประเทศที่ผู้นำเข้าจัดตั้ง",
  "Recorded here rather than on each shipment so it is typed once and is identical on every consignment — which is what lets their declarant reconcile what they received.":
    "บันทึกไว้ที่นี่แทนการกรอกในแต่ละรายการจัดส่ง เพื่อให้พิมพ์เพียงครั้งเดียวและตรงกันทุกรายการ ซึ่งเป็นสิ่งที่ทำให้ผู้ยื่นสำแดงของเขากระทบยอดสิ่งที่ได้รับได้",
  "You can leave this until the importer sends it — the shipment still logs, and the buyer total still builds.":
    "คุณเว้นไว้ก่อนจนกว่าผู้นำเข้าจะส่งมาให้ได้ ระบบยังบันทึกรายการจัดส่ง และยังรวมยอดของผู้ซื้อได้ตามปกติ",
  "Who to ask about a consignment.":
    "ผู้ที่ติดต่อได้เกี่ยวกับรายการจัดส่ง",
  "The EU importer this consignment is going to. Recorded once, then picked on every shipment to them.":
    "ผู้นำเข้าในสหภาพยุโรปที่รายการจัดส่งนี้ส่งไปถึง บันทึกครั้งเดียว แล้วเลือกใช้ในทุกรายการจัดส่งถึงเขา",
  "Reported":
    "รายงานแล้ว",
  "Engine":
    "เอนจิน",
  "Choose an approver…":
    "เลือกผู้อนุมัติ…",
  "Approver":
    "ผู้อนุมัติ",
  "Why this version exists":
    "เหตุผลที่มีเวอร์ชันนี้",
  "e.g. August gas invoice arrived and replaced the estimate":
    "เช่น ใบแจ้งหนี้ค่าก๊าซเดือนสิงหาคมมาถึงและแทนที่ค่าประมาณการ",
  "Complete internal sign-off first.":
    "ดำเนินการลงนามรับรองภายในให้เสร็จก่อน",
  "Pick an approver — the preparer cannot approve their own figures.":
    "เลือกผู้อนุมัติ — ผู้จัดทำไม่สามารถอนุมัติตัวเลขของตนเองได้",
  "Linked shipments":
    "รายการจัดส่งที่เชื่อมโยง",
  "What actually left the gate under this declaration. Buyer totals are built from these rows, so nothing is linked without you confirming it.":
    "สิ่งที่ออกจากโรงงานจริงภายใต้การสำแดงนี้ ยอดรวมของผู้ซื้อสร้างจากแถวเหล่านี้ จึงไม่มีรายการใดถูกเชื่อมโยงโดยที่คุณไม่ได้ยืนยัน",
  "Select all":
    "เลือกทั้งหมด",
  "Overlapping periods mean a date match is a suggestion, not an answer. Tick the ones that belong here.":
    "รอบเวลาที่ทับซ้อนกันทำให้การจับคู่ตามวันที่เป็นเพียงข้อเสนอแนะ ไม่ใช่คำตอบ กรุณาติ๊กเฉพาะรายการที่อยู่ในขอบเขตนี้จริง",
  "Linked":
    "เชื่อมโยงแล้ว",
  "Unlink shipment":
    "ยกเลิกการเชื่อมโยงรายการจัดส่ง",
  "Embedded emissions by buyer":
    "การปล่อยก๊าซที่ฝังอยู่ แยกตามผู้ซื้อ",
  "Tonnes":
    "ตัน",
  "tCO₂e embedded":
    "tCO₂e ที่ฝังอยู่",
  "A shipment is priced by the calculation version valid on the day it left. Tonnes shipped before any version was frozen have no approved figure yet — they are shown separately rather than counted as zero.":
    "รายการจัดส่งคิดราคาตามเวอร์ชันการคำนวณที่มีผลในวันที่ออกจากโรงงาน ปริมาณที่ส่งก่อนที่จะมีการตรึงเวอร์ชันใดยังไม่มีตัวเลขที่อนุมัติ จึงแสดงแยกไว้แทนการนับเป็นศูนย์",
  "Not yet attributable":
    "ยังระบุที่มาไม่ได้",
  "Open the shipment log":
    "เปิดบันทึกรายการจัดส่ง",
  "Log one":
    "บันทึกรายการ",
  "Where this came from":
    "ข้อมูลนี้มาจากที่ใด",
  "Invoice no. / meter id / dataset":
    "เลขที่ใบแจ้งหนี้ / รหัสมิเตอร์ / ชุดข้อมูล",
  "Verification readiness":
    "ความพร้อมสำหรับการตรวจสอบ",
  "Why is this acceptable? The reason goes into the dossier.":
    "เหตุใดจึงยอมรับได้ เหตุผลนี้จะถูกบันทึกลงในแฟ้มเอกสาร",
  "Record and accept":
    "บันทึกและยอมรับ",
  "Unit change · electricity":
    "การเปลี่ยนหน่วย · ไฟฟ้า",
  "Electricity is now collected as an":
    "ปัจจุบันข้อมูลไฟฟ้าเก็บเป็น",
  "absolute total for the reporting period":
    "ยอดรวมสัมบูรณ์ของทั้งรอบรายงาน",
  ", not per tonne. The per-tonne figure is derived once, inside the calculation, by dividing by your output — previously it was divided a second time, which understated indirect emissions.":
    " ไม่ใช่ค่าต่อตัน ค่าต่อตันจะคำนวณเพียงครั้งเดียวภายในการคำนวณ โดยหารด้วยผลผลิตของคุณ ก่อนหน้านี้มีการหารซ้ำอีกครั้ง ซึ่งทำให้การปล่อยก๊าซทางอ้อมต่ำกว่าความจริง",
  "Stored":
    "ค่าที่จัดเก็บ",
  "Read as":
    "อ่านค่าเป็น",
  "Output":
    "ผลผลิต",
  "Understood":
    "รับทราบ",
  "Dismissing does not change any stored value.":
    "การปิดข้อความนี้ไม่เปลี่ยนแปลงค่าที่จัดเก็บไว้",
  "Dismiss":
    "ปิด",
  "Previous month":
    "เดือนก่อนหน้า",
  "Next month":
    "เดือนถัดไป",
  "Add this one":
    "เพิ่มรายการนี้",
  "Action queue":
    "คิวงานที่ต้องทำ",
  "Nothing needs attention right now.":
    "ขณะนี้ไม่มีรายการที่ต้องดำเนินการ",
  "Recent activity":
    "ความเคลื่อนไหวล่าสุด",
  "Against the default":
    "เทียบกับค่า default",
  "Enter monthly data to compare your facility against the EU default value.":
    "กรอกข้อมูลรายเดือนเพื่อเปรียบเทียบโรงงานของคุณกับค่า EU default",
  "No product is currently running below its default emissions factor. The comparison appears here once one does.":
    "ขณะนี้ยังไม่มีสินค้าใดที่ค่าการปล่อยก๊าซต่ำกว่าค่า default ของตนเอง เมื่อมีรายการใดต่ำกว่า การเปรียบเทียบจะปรากฏที่นี่",
  "Buyer-ready status":
    "สถานะความพร้อมสำหรับผู้ซื้อ",
  "Every product is ready to hand to a buyer today.":
    "สินค้าทุกรายการพร้อมส่งมอบให้ผู้ซื้อแล้ววันนี้",
  "Verified actual vs. EU default value":
    "ค่าจริงที่ผ่านการตรวจสอบ เทียบกับค่า EU default",
  "What is phase-in?":
    "phase-in คืออะไร",
  "Precursor chain risk":
    "ความเสี่ยงในห่วงโซ่วัตถุดิบตั้งต้น",
  "No workspaces yet.":
    "ยังไม่มีพื้นที่ทำงาน",
  "No risk flags across any precursor chain.":
    "ไม่พบสัญญาณความเสี่ยงในห่วงโซ่วัตถุดิบตั้งต้นใดเลย",
  "Workspaces blocked":
    "พื้นที่ทำงานที่ติดขัด",
  "Days to declaration deadline":
    "จำนวนวันถึงกำหนดยื่นสำแดง",
  "30 September":
    "30 กันยายน",
  "Precursor SEE on default value":
    "SEE ของวัตถุดิบตั้งต้นที่อิงค่า default",
  "across every chain":
    "รวมทุกห่วงโซ่อุปทาน",
  "Workspaces with an overdue item":
    "พื้นที่ทำงานที่มีรายการเลยกำหนด",
  "see the action queue above":
    "ดูคิวงานด้านบน",
  "SEE over time":
    "SEE ตามช่วงเวลา",
  "No submitted months with production yet — the trend appears once a month is in.":
    "ยังไม่มีเดือนที่ส่งข้อมูลการผลิต แนวโน้มจะปรากฏเมื่อมีข้อมูลเดือนแรกเข้ามา",
  "Specific embedded emissions per month":
    "การปล่อยก๊าซที่ฝังอยู่เฉพาะหน่วย รายเดือน",
  "Direct + indirect, per tonne. Months with no production are omitted rather than plotted as zero.":
    "ทางตรงบวกทางอ้อม คิดต่อตัน เดือนที่ไม่มีการผลิตจะถูกตัดออก ไม่ได้แสดงเป็นศูนย์",
  "Supplier & precursor chain health":
    "สุขภาพของซัพพลายเออร์และห่วงโซ่วัตถุดิบตั้งต้น",
  "No precursor suppliers on file yet.":
    "ยังไม่มีซัพพลายเออร์วัตถุดิบตั้งต้นในระบบ",
  "Compliance trust score":
    "คะแนนความน่าเชื่อถือด้านการปฏิบัติตามกฎ",
  "Waiting on a workspace-level calculation.":
    "รอผลการคำนวณระดับพื้นที่ทำงาน",
  "Open workspace":
    "เปิดพื้นที่ทำงาน",
  "Your workspace":
    "พื้นที่ทำงานของคุณ",
  "View all →":
    "ดูทั้งหมด →",
  "· optional":
    "· ไม่บังคับ",
  "— an EU-accredited verifier reads it. Numbers and dates stay as they are.":
    " — ผู้ตรวจสอบที่ได้รับการรับรองจากสหภาพยุโรปเป็นผู้อ่าน ตัวเลขและวันที่ให้คงไว้ตามเดิม",
  "Anything in Thai has to be translated before verification can start. English now is the same work done once, not twice.":
    "ข้อความที่เป็นภาษาไทยต้องแปลก่อนจึงจะเริ่มการตรวจสอบได้ การเขียนเป็นภาษาอังกฤษตั้งแต่ตอนนี้คือการทำงานเดียวกันเพียงครั้งเดียว ไม่ใช่สองครั้ง",
  "Numbers, dates, CN codes and meter references stay as they are. If a machine only has a Thai name, write it in English with the Thai in brackets.":
    "ตัวเลข วันที่ CN code และรหัสอ้างอิงมิเตอร์ ให้คงไว้ตามเดิม หากเครื่องจักรมีชื่อเป็นภาษาไทยเท่านั้น ให้เขียนเป็นภาษาอังกฤษและใส่ชื่อภาษาไทยไว้ในวงเล็บ",
  "Why English?":
    "ทำไมต้องภาษาอังกฤษ",
  "Write everything in English.":
    "เขียนทุกอย่างเป็นภาษาอังกฤษ",
  "An EU-accredited verifier reads it, and anything in Thai has to be translated first. Numbers and dates stay as they are.":
    "ผู้ตรวจสอบที่ได้รับการรับรองจากสหภาพยุโรปเป็นผู้อ่าน ข้อความที่เป็นภาษาไทยต้องแปลก่อน ส่วนตัวเลขและวันที่ให้คงไว้ตามเดิม",

  /* ── Declarations workflow, evidence pack, dossier and dispatch ─────────────────────────────── */
  "Activity data":
    "ข้อมูลกิจกรรม",
  "What the emissions are made of":
    "การปล่อยก๊าซนี้ประกอบขึ้นจากอะไร",
  "A verifier does not accept an emissions figure — they re-derive it. Enter the fuel, power and materials your installation actually consumed, and Certrace computes the per-tonne figure from them. Every input keeps where it came from.":
    "ผู้ตรวจสอบไม่ได้รับตัวเลขการปล่อยก๊าซมาตรง ๆ แต่จะคำนวณย้อนกลับเอง กรอกเชื้อเพลิง ไฟฟ้า และวัสดุที่สถานประกอบการของคุณใช้จริง แล้ว Certrace จะคำนวณค่าต่อตันให้ ทุกข้อมูลที่กรอกจะเก็บแหล่งที่มาไว้ด้วย",
  "Go to sign-off to revise":
    "ไปที่หน้าลงนามรับรองเพื่อแก้ไข",
  "Annual production quantity":
    "ปริมาณการผลิตรายปี",
  "The denominator behind every per-tonne figure in this filing.":
    "ตัวส่วนของทุกค่าต่อตันในการยื่นครั้งนี้",
  "Shipped, for context only":
    "ปริมาณที่จัดส่ง แสดงเพื่อเป็นบริบทเท่านั้น",
  "Linked to this declaration":
    "เชื่อมโยงกับการสำแดงนี้",
  "Unlinked in period":
    "ยังไม่เชื่อมโยงในรอบนี้",
  "Fuels":
    "เชื้อเพลิง",
  "Emission factors are per GJ. A quantity in m³, kg or litres needs its net calorific value before it can become energy.":
    "ค่าแฟกเตอร์การปล่อยก๊าซคิดต่อ GJ ปริมาณที่กรอกเป็น m³ kg หรือลิตร ต้องมีค่าความร้อนสุทธิกำกับก่อนจึงจะแปลงเป็นพลังงานได้",
  "No fuel entered yet":
    "ยังไม่ได้กรอกเชื้อเพลิง",
  "Add each fuel your installation burned in the period, taken from meter readings or supplier invoices.":
    "เพิ่มเชื้อเพลิงทุกชนิดที่สถานประกอบการของคุณเผาไหม้ในรอบนี้ โดยอ้างอิงจากค่าที่อ่านจากมิเตอร์หรือใบแจ้งหนี้ของผู้จัดจำหน่าย",
  "Oxidation":
    "ค่าออกซิเดชัน",
  "Remove fuel":
    "ลบเชื้อเพลิง",
  "Quantity — provenance":
    "ปริมาณ — แหล่งที่มา",
  "Emission factor — provenance":
    "ค่าแฟกเตอร์การปล่อยก๊าซ — แหล่งที่มา",
  "NCV — provenance":
    "ค่าความร้อนสุทธิ — แหล่งที่มา",
  "Absolute MWh for the whole period — never per tonne. Certrace divides by production once, inside the calculation.":
    "กรอกเป็น MWh สัมบูรณ์ของทั้งรอบ ไม่ใช่ค่าต่อตัน Certrace จะหารด้วยผลผลิตเพียงครั้งเดียวภายในการคำนวณ",
  "No electricity entered yet":
    "ยังไม่ได้กรอกข้อมูลไฟฟ้า",
  "Add the total drawn across the period — usually the sum of twelve monthly utility bills.":
    "เพิ่มปริมาณรวมที่ใช้ตลอดรอบ โดยทั่วไปคือผลรวมของใบแจ้งค่าไฟรายเดือนสิบสองใบ",
  "Remove meter":
    "ลบมิเตอร์",
  "enter the production quantity to derive the per-tonne figure":
    "กรอกปริมาณการผลิตเพื่อคำนวณค่าต่อตัน",
  "Carbon that leaves as CO₂ without being burned as fuel — graphite electrodes, limestone flux. Mass × carbon content × 44/12.":
    "คาร์บอนที่ออกไปในรูป CO₂ โดยไม่ได้ถูกเผาเป็นเชื้อเพลิง เช่น แท่งอิเล็กโทรดกราไฟต์ และฟลักซ์หินปูน คำนวณจาก มวล × ปริมาณคาร์บอน × 44/12",
  "No process materials entered yet":
    "ยังไม่ได้กรอกวัสดุในกระบวนการ",
  "An EAF route normally carries at least graphite electrode consumption.":
    "กระบวนการ EAF โดยทั่วไปจะมีการใช้แท่งอิเล็กโทรดกราไฟต์เป็นอย่างน้อย",
  "Remove material":
    "ลบวัสดุ",
  "Derived from what you entered":
    "คำนวณจากข้อมูลที่คุณกรอก",
  "Chargeable (own process)":
    "ส่วนที่ต้องชำระ (กระบวนการของตนเอง)",
  "before precursors":
    "ก่อนรวมวัตถุดิบตั้งต้น",
  "Evidence pack":
    "ชุดหลักฐาน",
  "One number, one document":
    "หนึ่งตัวเลข หนึ่งเอกสาร",
  "A verifier does not read a folder — they pick a figure and ask to see what proves it. Attach each document to the input it supports, and the answer takes seconds instead of an afternoon.":
    "ผู้ตรวจสอบไม่ได้อ่านทั้งโฟลเดอร์ แต่จะหยิบตัวเลขขึ้นมาแล้วขอดูหลักฐานที่พิสูจน์ตัวเลขนั้น หากแนบเอกสารไว้กับข้อมูลที่เอกสารนั้นรองรับ การตอบจะใช้เวลาไม่กี่วินาทีแทนที่จะเป็นทั้งบ่าย",
  "Evidence category":
    "ประเภทหลักฐาน",
  "Inputs and their evidence":
    "ข้อมูลที่กรอกและหลักฐานประกอบ",
  "Every figure the calculation depends on, with the document behind it. Attach from the files you have uploaded.":
    "ทุกตัวเลขที่การคำนวณอ้างอิง พร้อมเอกสารที่รองรับ เลือกแนบจากไฟล์ที่คุณอัปโหลดไว้",
  "No inputs yet":
    "ยังไม่มีข้อมูลที่กรอก",
  "Enter activity data first — the evidence list is derived from it, so there is nothing to attach documents to until then.":
    "กรอกข้อมูลกิจกรรมก่อน เพราะรายการหลักฐานสร้างจากข้อมูลนั้น จึงยังไม่มีรายการให้แนบเอกสาร",
  "Go to activity data":
    "ไปที่ข้อมูลกิจกรรม",
  "Attach a document…":
    "แนบเอกสาร…",
  "The pack":
    "ชุดเอกสาร",
  "Grouped the way a verifier files them. Open a document to see every figure that depends on it.":
    "จัดกลุ่มตามวิธีที่ผู้ตรวจสอบจัดเก็บ เปิดเอกสารเพื่อดูทุกตัวเลขที่อ้างอิงเอกสารนั้น",
  "No documents yet":
    "ยังไม่มีเอกสาร",
  "Utility bills, fuel invoices, meter logs, production reports, supplier attestations.":
    "ใบแจ้งค่าสาธารณูปโภค ใบแจ้งหนี้เชื้อเพลิง บันทึกมิเตอร์ รายงานการผลิต และหนังสือรับรองจากซัพพลายเออร์",
  "Download":
    "ดาวน์โหลด",
  "Remove document":
    "ลบเอกสาร",
  "Figures that depend on this document":
    "ตัวเลขที่อ้างอิงเอกสารนี้",
  "Nothing points at this file yet. An unattached document is storage, not evidence — attach it above.":
    "ยังไม่มีรายการใดอ้างอิงไฟล์นี้ เอกสารที่ไม่ได้แนบกับตัวเลขใดคือแค่ไฟล์ที่เก็บไว้ ไม่ใช่หลักฐาน กรุณาแนบด้านบน",
  "Monitoring methodology":
    "วิธีการติดตามตรวจวัด",
  "How you know your numbers":
    "คุณรู้ตัวเลขของคุณได้อย่างไร",
  "The method is unchanged between these versions. Same method year over year is exactly what the consistency assertion is looking for.":
    "วิธีการไม่เปลี่ยนแปลงระหว่างเวอร์ชันเหล่านี้ การใช้วิธีเดิมทุกปีคือสิ่งที่ข้อยืนยันด้านความสม่ำเสมอมองหาพอดี",
  "Boundary description — the production process, not the site":
    "คำอธิบายขอบเขต — กระบวนการผลิต ไม่ใช่พื้นที่โรงงาน",
  "Enter activity data first — the parameter list is derived from it.":
    "กรอกข้อมูลกิจกรรมก่อน เพราะรายการพารามิเตอร์สร้างจากข้อมูลนั้น",
  "Frequency, e.g. monthly":
    "ความถี่ เช่น รายเดือน",
  "Note":
    "หมายเหตุ",
  "Nothing recorded yet.":
    "ยังไม่มีการบันทึก",
  "Declaration view":
    "มุมมองการสำแดง",
  "Verification dossier":
    "แฟ้มเอกสารการตรวจสอบ",
  "What the verifier opens":
    "สิ่งที่ผู้ตรวจสอบเปิดดู",
  "Ordered by the seven assertions a verifier works through. Anything marked unanswered below is a question they will ask — cheaper to close now than during the engagement.":
    "เรียงตามข้อยืนยันเจ็ดข้อที่ผู้ตรวจสอบตรวจทีละข้อ รายการใดที่ระบุว่ายังไม่ได้ตอบ คือคำถามที่เขาจะถาม ซึ่งปิดตอนนี้ถูกกว่าปิดระหว่างการตรวจ",
  "What is in the package":
    "ในชุดเอกสารมีอะไรบ้าง",
  "Frozen calculation":
    "การคำนวณที่ตรึงไว้",
  "Dataset hash":
    "ค่าแฮชของชุดข้อมูล",
  "Sign-off":
    "การลงนามรับรอง",
  "What the verifier link does not carry":
    "สิ่งที่ลิงก์ของผู้ตรวจสอบไม่ได้รวมไว้",
  "MVP note: the verifier link is an encoding, not authentication. Production links must be server-issued, signed, expiring and revocable — see docs/SECURITY.md.":
    "หมายเหตุสำหรับรุ่น MVP: ลิงก์ของผู้ตรวจสอบเป็นเพียงการเข้ารหัสข้อมูล ไม่ใช่การยืนยันตัวตน ลิงก์ที่ใช้งานจริงต้องออกจากเซิร์ฟเวอร์ มีลายเซ็น มีวันหมดอายุ และเพิกถอนได้ ดูรายละเอียดที่ docs/SECURITY.md",
  "Terms of Service":
    "ข้อกำหนดการให้บริการ",
  "Filed for":
    "ยื่นในนาม",
  "No buyer named":
    "ยังไม่ได้ระบุผู้ซื้อ",
  "Input — no report":
    "วัตถุดิบ — ยังไม่มีรายงาน",
  "Choose the good":
    "เลือกสินค้า",
  "Which CBAM good does this supplier make for you?":
    "ซัพพลายเออร์รายนี้ผลิตสินค้า CBAM ใดให้คุณ",
  "This declaration recorded a material name but never a CN code. Pick the good and the annual report can be created.":
    "การสำแดงนี้บันทึกชื่อวัสดุไว้แต่ไม่มี CN code เลือกสินค้าแล้วจึงจะสร้างรายงานประจำปีได้",
  "What every report asks for, and from whom":
    "แต่ละรายงานขออะไร และขอจากใคร",
  "Annual reports":
    "รายงานประจำปี",
  "Verification-ready":
    "พร้อมสำหรับการตรวจสอบ",
  "Months outstanding":
    "เดือนที่ยังค้าง",
  "across every report":
    "รวมทุกรายงาน",
  "No annual reports yet":
    "ยังไม่มีรายงานประจำปี",
  "A declaration fans out into one report per supplier × product. This one has no supplier-and-product pairs recorded, so there is nothing to collect against — add them in the declaration's own setup and they will appear here.":
    "การสำแดงหนึ่งฉบับจะแตกออกเป็นหนึ่งรายงานต่อหนึ่งคู่ของซัพพลายเออร์ × สินค้า ฉบับนี้ยังไม่มีการบันทึกคู่ดังกล่าว จึงยังไม่มีสิ่งใดให้เก็บข้อมูล เพิ่มได้ในหน้าตั้งค่าของการสำแดง แล้วรายการจะปรากฏที่นี่",
  "Open declaration setup":
    "เปิดหน้าตั้งค่าการสำแดง",
  "One per supplier × product. Each one is verified separately.":
    "หนึ่งรายการต่อหนึ่งคู่ของซัพพลายเออร์ × สินค้า และแต่ละรายการตรวจสอบแยกกัน",
  "Review, sign-off, filing and dispatch":
    "การตรวจทาน การลงนามรับรอง การยื่น และการจัดส่ง",
  "The full declaration workflow — supplier submissions, the AI check, cost and carbon, the Registry XML, and sending the Communication Template to the buyer. Everything that happens once the reports above are complete.":
    "เวิร์กโฟลว์การสำแดงฉบับเต็ม ตั้งแต่ข้อมูลที่ซัพพลายเออร์ส่งมา การตรวจด้วย AI ต้นทุนและคาร์บอน ไฟล์ XML สำหรับ Registry ไปจนถึงการส่ง Communication Template ให้ผู้ซื้อ ทั้งหมดนี้เกิดขึ้นเมื่อรายงานด้านบนครบถ้วนแล้ว",
  "Open workflow":
    "เปิดเวิร์กโฟลว์",
  "Declarations":
    "การสำแดง",
  "Fix":
    "แก้ไข",
  "All checks":
    "การตรวจทั้งหมด",
  "Evidence":
    "หลักฐาน",
  "Onward sharing is restricted.":
    "การส่งต่อข้อมูลนี้ถูกจำกัด",
  "Submission evidence summary":
    "สรุปหลักฐานของข้อมูลที่ส่ง",
  "data quality":
    "คุณภาพข้อมูล",
  "Key emissions data":
    "ข้อมูลการปล่อยก๊าซที่สำคัญ",
  "Embedded total:":
    "ยอดรวมที่ฝังอยู่:",
  "Flagged for your attention":
    "รายการที่ต้องให้คุณตรวจสอบ",
  "Submitted data":
    "ข้อมูลที่ส่งมา",
  "read-only":
    "อ่านอย่างเดียว",
  "Download this file":
    "ดาวน์โหลดไฟล์นี้",
  "File larger than the inline limit - request it out-of-band":
    "ไฟล์ใหญ่เกินขีดจำกัดสำหรับการแสดงในระบบ กรุณาขอไฟล์ผ่านช่องทางอื่น",
  "not attached":
    "ยังไม่ได้แนบ",
  "Internal reviewers":
    "ผู้ตรวจทานภายใน",
  "Share this submission with the teams who need to sign off — ESG, Compliance, Legal or your verifier. We email them an invite, and they get scoped, read-only access to the source data.":
    "แบ่งปันข้อมูลที่ส่งนี้ให้ทีมที่ต้องลงนามรับรอง เช่น ESG กำกับดูแล กฎหมาย หรือผู้ตรวจสอบของคุณ ระบบจะส่งคำเชิญทางอีเมล และเขาจะเข้าถึงข้อมูลต้นทางแบบอ่านอย่างเดียวภายในขอบเขตที่กำหนด",
  "Request a revision":
    "ขอให้แก้ไข",
  "Comment to the supplier":
    "ข้อความถึงซัพพลายเออร์",
  "Explain what needs changing — e.g. “The direct emissions figure looks high for an EAF route; please confirm actual vs default and re-upload a legible Mill Test Certificate.”":
    "อธิบายสิ่งที่ต้องแก้ไข เช่น “ค่าการปล่อยก๊าซทางตรงดูสูงสำหรับกระบวนการ EAF กรุณายืนยันว่าเป็นค่าจริงหรือค่า default และอัปโหลด Mill Test Certificate ที่อ่านออกชัดเจนอีกครั้ง”",
  "Nothing to cost yet — figures appear here as suppliers submit and you approve their data.":
    "ยังไม่มีข้อมูลให้คำนวณต้นทุน ตัวเลขจะปรากฏที่นี่เมื่อซัพพลายเออร์ส่งข้อมูลและคุณอนุมัติแล้ว",
  "The same approved dataset, priced. Certificates are chargeable emissions only — the Annex II rule already excludes indirect emissions for steel and aluminium, and default-value markups are applied where a supplier reported on defaults.":
    "ชุดข้อมูลที่อนุมัติแล้วชุดเดียวกัน คิดเป็นตัวเงิน ใบรับรองคิดเฉพาะการปล่อยก๊าซส่วนที่ต้องชำระ โดยกฎ Annex II ได้ยกเว้นการปล่อยก๊าซทางอ้อมสำหรับเหล็กและอะลูมิเนียมไว้แล้ว และจะบวกส่วนเพิ่มของค่า default ในกรณีที่ซัพพลายเออร์รายงานด้วยค่า default",
  "Estimated certificate cost":
    "ต้นทุนใบรับรองโดยประมาณ",
  "An estimate for planning, not a filed figure — the declarant buys certificates at the published auction average for the week of import, and applies the official exchange rate. Change the price above to model a different scenario.":
    "เป็นค่าประมาณการสำหรับการวางแผน ไม่ใช่ตัวเลขที่ยื่น ผู้ยื่นสำแดงจะซื้อใบรับรองที่ราคาเฉลี่ยจากการประมูลที่ประกาศไว้ของสัปดาห์ที่นำเข้า และใช้อัตราแลกเปลี่ยนทางการ เปลี่ยนราคาด้านบนเพื่อจำลองสถานการณ์อื่นได้",
  "Against the EU default value":
    "เทียบกับค่า EU default",
  "What each good would be assumed to emit if nobody measured it. A figure below the fallback is the whole argument for collecting real data — and the number to put in front of a buyer.":
    "ค่าที่จะถูกสันนิษฐานว่าสินค้าแต่ละรายการปล่อยออกมา หากไม่มีใครวัดจริง ตัวเลขที่ต่ำกว่าค่าสำรองนี้คือเหตุผลทั้งหมดของการเก็บข้อมูลจริง และเป็นตัวเลขที่ควรนำเสนอต่อผู้ซื้อ",
  "Good · supplier":
    "สินค้า · ซัพพลายเออร์",
  "Difference":
    "ส่วนต่าง",
  "Indicative category-level reference values held as data in Certrace, not filed figures — the Commission sets the operative defaults per CN code.":
    "ค่าอ้างอิงระดับหมวดหมู่ที่จัดเก็บเป็นข้อมูลใน Certrace ไม่ใช่ตัวเลขที่ยื่น คณะกรรมาธิการยุโรปเป็นผู้กำหนดค่า default ที่มีผลบังคับใช้ในแต่ละ CN code",
  "· reported on defaults":
    "· รายงานด้วยค่า default",
  "no default":
    "ไม่มีค่า default",
  "No submissions yet — trust score, narrative and business impact appear once suppliers start submitting.":
    "ยังไม่มีข้อมูลที่ส่งเข้ามา คะแนนความน่าเชื่อถือ คำอธิบาย และผลกระทบทางธุรกิจจะปรากฏเมื่อซัพพลายเออร์เริ่มส่งข้อมูล",
  "Trust score":
    "คะแนนความน่าเชื่อถือ",
  "advisory · not a filed figure":
    "เพื่อเป็นข้อมูลประกอบ · ไม่ใช่ตัวเลขที่ยื่น",
  "can this be trusted":
    "เชื่อถือได้หรือไม่",
  "Nothing pulling the score down — figures look clean.":
    "ไม่มีรายการใดฉุดคะแนนลง ตัวเลขดูสะอาดดี",
  "What changed":
    "สิ่งที่เปลี่ยนแปลง",
  "Estimated business impact":
    "ผลกระทบทางธุรกิจโดยประมาณ",
  "Weak evidence":
    "หลักฐานอ่อน",
  "Assumption ledger":
    "ทะเบียนข้อสมมติ",
  "Suggested routing":
    "การส่งต่อที่แนะนำ",
  "Report package":
    "ชุดเอกสารรายงาน",
  "One approved dataset, generated into every artifact you need.":
    "ชุดข้อมูลที่อนุมัติแล้วชุดเดียว สร้างออกมาเป็นเอกสารทุกรูปแบบที่คุณต้องใช้",
  "generated":
    "สร้างแล้ว",
  "The approved dataset changed after this package was generated — regenerate before sending anything out.":
    "ชุดข้อมูลที่อนุมัติเปลี่ยนแปลงหลังจากสร้างชุดเอกสารนี้ กรุณาสร้างใหม่ก่อนส่งออกไป",
  "Regenerate":
    "สร้างใหม่",
  "Verification & Evidence Package":
    "ชุดเอกสารการตรวจสอบและหลักฐาน",
  "suppliers":
    "ซัพพลายเออร์",
  "avg score":
    "คะแนนเฉลี่ย",
  "Every supplier is approved — generate the sealed package when you're ready.":
    "ซัพพลายเออร์ทุกรายได้รับอนุมัติแล้ว สร้างชุดเอกสารฉบับปิดผนึกได้เมื่อคุณพร้อม",
  "CBAM Communication Template · O3CI-ready":
    "CBAM Communication Template · พร้อมใช้กับ O3CI",
  "Annex IV data export":
    "การส่งออกข้อมูลตาม Annex IV",
  "Feeds the CBAM Registry's O3CI module directly, or hands to a buyer not on it yet — see Send & export.":
    "ป้อนเข้าโมดูล O3CI ของ CBAM Registry ได้โดยตรง หรือส่งให้ผู้ซื้อที่ยังไม่ได้ใช้ระบบนี้ ดูที่หัวข้อส่งและส่งออก",
  "Generating the package also produces the Registry XML export.":
    "การสร้างชุดเอกสารจะสร้างไฟล์ XML สำหรับ Registry ไปพร้อมกัน",
  "All required installation and emissions data present.":
    "ข้อมูลสถานประกอบการและการปล่อยก๊าซที่จำเป็นครบถ้วนแล้ว",
  "Open this supplier's submission":
    "เปิดข้อมูลที่ซัพพลายเออร์รายนี้ส่งมา",
  "Click an issue to open that supplier's submission and request a revision.":
    "คลิกที่ประเด็นใดประเด็นหนึ่งเพื่อเปิดข้อมูลที่ซัพพลายเออร์รายนั้นส่งมา และขอให้แก้ไข",
  "Send the report for confirmation before it goes out. Each person gets a read-only preview link, and confirmations are recorded automatically.":
    "ส่งรายงานให้ยืนยันก่อนนำออกไป แต่ละคนจะได้รับลิงก์พรีวิวแบบอ่านอย่างเดียว และระบบจะบันทึกการยืนยันโดยอัตโนมัติ",
  "Anomalies were flagged in this declaration — include":
    "พบความผิดปกติในการสำแดงนี้ — ควรรวม",
  "in the sign-off.":
    "ไว้ในการลงนามรับรองด้วย",
  "Demo: records the confirmation that would arrive from their preview link.":
    "ตัวอย่างการใช้งาน: บันทึกการยืนยันที่จะได้รับจากลิงก์พรีวิวของเขา",
  "Mark confirmed":
    "ทำเครื่องหมายว่ายืนยันแล้ว",
  "Withdraw":
    "ถอนออก",
  "Pick from your team, or add a new person — they'll appear under Team & seats too.":
    "เลือกจากทีมของคุณ หรือเพิ่มบุคคลใหม่ ซึ่งจะปรากฏในหน้าทีมงานและสิทธิ์ใช้งานด้วย",
  "They join your team list and can be sent this report to confirm — an emailed, read-only preview of exactly what will be dispatched.":
    "เขาจะเข้าร่วมรายชื่อทีมของคุณ และรับรายงานนี้ไปยืนยันได้ ในรูปพรีวิวแบบอ่านอย่างเดียวทางอีเมล ซึ่งตรงกับสิ่งที่จะจัดส่งจริงทุกประการ",
  "Why this looks different":
    "ทำไมส่วนนี้จึงดูต่างออกไป",
  "Certrace never files with the CBAM authority directly — only the EU buyer's Authorised CBAM Declarant can do that. What actually reaches the regulator is either a push into the CBAM Registry's":
    "Certrace ไม่เคยยื่นต่อหน่วยงาน CBAM โดยตรง มีเพียง Authorised CBAM Declarant ของผู้ซื้อในสหภาพยุโรปเท่านั้นที่ทำได้ สิ่งที่ไปถึงหน่วยงานกำกับดูแลจริงคือการส่งเข้าโมดูล",
  "sent to a buyer who isn't on O3CI yet. Filing itself always happens on the buyer's side.":
    "ที่ส่งให้ผู้ซื้อซึ่งยังไม่ได้ใช้ O3CI ส่วนการยื่นเองนั้นเกิดขึ้นที่ฝั่งผู้ซื้อเสมอ",
  "Registry pre-flight failed":
    "การตรวจสอบเบื้องต้นก่อนส่งเข้า Registry ไม่ผ่าน",
  "Click an issue to open the submission — request a revision there, and dispatch unlocks once the resubmission passes.":
    "คลิกที่ประเด็นใดประเด็นหนึ่งเพื่อเปิดข้อมูลที่ส่งมา ขอให้แก้ไขที่นั่น แล้วการจัดส่งจะปลดล็อกเมื่อข้อมูลที่ส่งใหม่ผ่านการตรวจ",
  "pushed":
    "ส่งเข้าระบบแล้ว",
  "Acknowledgement":
    "การตอบรับ",
  "The real end state — confirmation a recipient actually received the data, not just that it was sent.":
    "สถานะปลายทางที่แท้จริง คือการยืนยันว่าผู้รับได้รับข้อมูลจริง ไม่ใช่เพียงว่ามีการส่งออกไปแล้ว",
  "Mark acknowledged":
    "ทำเครื่องหมายว่าตอบรับแล้ว",
  "Buyers receiving this dataset":
    "ผู้ซื้อที่ได้รับชุดข้อมูลนี้",
  "The same approved figures go to every EU importer who bought these goods — each under their own EORI, each acknowledging separately. Adding a buyer never re-opens collection: the dataset is already confirmed.":
    "ตัวเลขที่อนุมัติแล้วชุดเดียวกันจะส่งไปยังผู้นำเข้าในสหภาพยุโรปทุกรายที่ซื้อสินค้าเหล่านี้ โดยแต่ละรายอยู่ภายใต้ EORI ของตนเองและตอบรับแยกกัน การเพิ่มผู้ซื้อไม่ทำให้ต้องเก็บข้อมูลใหม่ เพราะชุดข้อมูลได้รับการยืนยันแล้ว",
  "No buyer on this declaration yet — add the EU importer whose declarant will file this data.":
    "ยังไม่มีผู้ซื้อในการสำแดงนี้ เพิ่มผู้นำเข้าในสหภาพยุโรปที่ผู้ยื่นสำแดงของเขาจะนำข้อมูลนี้ไปยื่น",
  "on the declaration":
    "ในการสำแดงนี้",
  "acknowledged":
    "ตอบรับแล้ว",
  "The package as this buyer receives it":
    "ชุดเอกสารในรูปแบบที่ผู้ซื้อรายนี้ได้รับ",
  "Remove this buyer":
    "นำผู้ซื้อรายนี้ออก",
  "Add a buyer":
    "เพิ่มผู้ซื้อ",
  "Importer legal name":
    "ชื่อผู้นำเข้าตามกฎหมาย",
  "e.g. Meridian Stahl GmbH":
    "เช่น Meridian Stahl GmbH",
  "Compliance email":
    "อีเมลฝ่ายกำกับดูแล",
  "Contact":
    "ผู้ติดต่อ",
  "e.g. Lena Vogt":
    "เช่น Lena Vogt",
  "That EORI is already on this declaration — one importer, one entry.":
    "EORI นี้มีอยู่ในการสำแดงนี้แล้ว — ผู้นำเข้าหนึ่งราย ต่อหนึ่งรายการ",
  "Sent by template only. Pushing to O3CI as well means any future buyer can pull the same data without another send.":
    "ส่งด้วยแบบฟอร์มเท่านั้น หากส่งเข้า O3CI ด้วย ผู้ซื้อรายใดในอนาคตก็สามารถดึงข้อมูลชุดเดียวกันไปใช้ได้โดยไม่ต้องส่งซ้ำ",
  "Nothing recorded yet — every engine run, AI pass and human decision will appear here as it happens.":
    "ยังไม่มีการบันทึก ทุกครั้งที่เอนจินทำงาน ทุกรอบการตรวจด้วย AI และทุกการตัดสินใจของคน จะปรากฏที่นี่ตามเวลาที่เกิดขึ้น",
  "One unified, append-only timeline — supplier submissions, internal sign-offs and every dispatch, newest first.":
    "ไทม์ไลน์เดียวที่เพิ่มได้อย่างเดียวลบไม่ได้ รวมข้อมูลที่ซัพพลายเออร์ส่ง การลงนามรับรองภายใน และการจัดส่งทุกครั้ง เรียงจากใหม่สุด",
  "Feature request":
    "เสนอฟีเจอร์ใหม่",
  "Report a problem":
    "แจ้งปัญหา",
  "Expired":
    "หมดอายุแล้ว",

  /* ── Carbon & Cost — the picker rows and the production line ─────────────────────────────── */
  "1 product":
    "1 สินค้า",
  "{count} products, added together":
    "{count} สินค้า รวมกัน",
  "Everything made here · {count} products":
    "ทุกอย่างที่ผลิตที่นี่ · {count} สินค้า",
  "1 month started, none submitted yet":
    "เริ่มกรอกแล้ว 1 เดือน ยังไม่ได้ส่ง",
  "{count} months started, none submitted yet":
    "เริ่มกรอกแล้ว {count} เดือน ยังไม่ได้ส่งสักเดือน",
  "{tonnes} t from 1 submitted month":
    "{tonnes} ตัน จากเดือนที่ส่งข้อมูลแล้ว 1 เดือน",
  "{tonnes} t from {count} submitted months":
    "{tonnes} ตัน จากเดือนที่ส่งข้อมูลแล้ว {count} เดือน",

  /* ── Who owns each tab, and when it is due ─────────────────────────────── */
  "Supplier fills this in":
    "ซัพพลายเออร์เป็นผู้กรอก",
  "You fill this in":
    "คุณเป็นผู้กรอก",
  "Once a year":
    "ปีละครั้ง",
  "Every month":
    "ทุกเดือน",
  "Every shipment":
    "ทุกรายการจัดส่ง",
  "Whenever something changes":
    "เมื่อใดก็ตามที่มีการเปลี่ยนแปลง",
  "Keep the identity correct. Everything downstream is scoped by it.":
    "ดูแลข้อมูลระบุตัวตนให้ถูกต้อง เพราะทุกอย่างที่ตามมาถูกกำหนดขอบเขตด้วยข้อมูลนี้",
  "Once, at the end of the reporting year":
    "ครั้งเดียว เมื่อสิ้นปีรายงาน",
  "Ask for it once. Chase it in Q4, before the year closes — a methodology finalised after the fact is the first thing a verifier questions.":
    "ขอเพียงครั้งเดียว และติดตามในไตรมาสที่ 4 ก่อนปิดปี เพราะวิธีการที่เพิ่งมาปิดฉบับย้อนหลังคือสิ่งแรกที่ผู้ตรวจสอบจะตั้งคำถาม",
  "Within a few weeks of each month closing":
    "ภายในไม่กี่สัปดาห์หลังปิดแต่ละเดือน",
  "Send monthly, not once — a March bill requested in December is usually impossible to find.":
    "ส่งคำขอทุกเดือน ไม่ใช่ครั้งเดียว เพราะใบแจ้งหนี้เดือนมีนาคมที่ไปขอเอาเดือนธันวาคมมักหาไม่เจอแล้ว",
  "With each month's readings":
    "พร้อมกับค่าที่บันทึกของแต่ละเดือน",
  "The slowest data in the workspace — your supplier has to chase theirs. Start early; top tiers often arrive as ratios, not tonnages.":
    "เป็นข้อมูลที่ช้าที่สุดในพื้นที่ทำงาน เพราะซัพพลายเออร์ของคุณต้องไปตามจากซัพพลายเออร์ของเขาอีกทอด ควรเริ่มแต่เนิ่น ๆ และชั้นบนสุดมักส่งมาเป็นอัตราส่วน ไม่ใช่จำนวนตัน",
  "Only the annual scope lives here now. Monthly bills belong inside their month, and precursor certificates belong on the precursor row — both are attached where the figure they support is entered.":
    "ตอนนี้ที่นี่เก็บเฉพาะเอกสารระดับรายปี ใบแจ้งหนี้รายเดือนให้แนบไว้ในเดือนของตนเอง และใบรับรองของวัตถุดิบตั้งต้นให้แนบไว้ที่แถวของวัตถุดิบนั้น ทั้งสองอย่างแนบไว้ตรงจุดที่กรอกตัวเลขที่เอกสารนั้นรองรับ",
  "Before you engage a verifier":
    "ก่อนว่าจ้างผู้ตรวจสอบ",
  "Read it before you book the verifier, not after.":
    "อ่านก่อนนัดหมายผู้ตรวจสอบ ไม่ใช่หลังจากนั้น",
  "Set it once, correct it when the plant changes":
    "ตั้งค่าครั้งเดียว และแก้ไขเมื่อโรงงานเปลี่ยนแปลง",
  "Match the send day to when whoever fills this in actually closes their books.":
    "กำหนดวันส่งให้ตรงกับวันที่ผู้กรอกข้อมูลปิดบัญชีจริง",
  "Once a year, only if you claim a deduction":
    "ปีละครั้ง เฉพาะกรณีที่คุณขอหักลด",
  "Claimed, never auto-applied. If you claim it, the payment receipt goes in the annual evidence scope.":
    "ต้องยื่นขอเอง ระบบไม่หักให้อัตโนมัติ หากคุณขอหักลด ใบเสร็จการชำระเงินต้องอยู่ในชุดหลักฐานรายปี",
  "Checked automatically":
    "ตรวจสอบอัตโนมัติ",
  "Derived from the MMD's data-gap register. Nothing to fill in — it moves when the gaps do.":
    "คำนวณจากทะเบียนช่วงข้อมูลขาดใน MMD ไม่ต้องกรอกอะไร ค่าจะเปลี่ยนตามช่วงข้อมูลขาด",

  /* ── The English-only notice, and the readiness percentage ─────────────────────────────── */
  "{percent}% of applicable tabs":
    "{percent}% ของแท็บที่เกี่ยวข้อง",
  "everything you type":
    "ทุกอย่างที่คุณกรอก",
  "Please write {scope} in English":
    "กรุณาเขียน{scope}เป็นภาษาอังกฤษ",

  /* ── Buttons, help titles and filter labels found on the second sweep ─────────────────────────────── */
  "Save activity data":
    "บันทึกข้อมูลกิจกรรม",
  "Add fuel":
    "เพิ่มเชื้อเพลิง",
  "Add meter":
    "เพิ่มมิเตอร์",
  "Add material":
    "เพิ่มวัสดุ",
  "Upload evidence":
    "อัปโหลดหลักฐาน",
  "Export PDF":
    "ส่งออกเป็น PDF",
  "Finalised":
    "ปิดฉบับแล้ว",
  "No inputs are declared as assumptions.":
    "ไม่มีข้อมูลใดที่ประกาศไว้เป็นข้อสมมติ",
  "Every assertion is answerable from what is in the portal. That is the definition of a dossier that passes easily.":
    "ทุกข้อยืนยันตอบได้จากข้อมูลที่มีอยู่ในพอร์ทัลแล้ว นั่นคือนิยามของแฟ้มเอกสารที่ผ่านการตรวจได้อย่างราบรื่น",
  "What the boundary is":
    "ขอบเขตคืออะไร",
  "An exclusion is a declaration":
    "การยกเว้นถือเป็นการประกาศ",
  "Fuels, and how they are measured":
    "เชื้อเพลิงและวิธีวัด",
  "Add a fuel instrument":
    "เพิ่มอุปกรณ์วัดเชื้อเพลิง",
  "Natural gas consumption":
    "ปริมาณการใช้ก๊าซธรรมชาติ",
  "Electricity, and the meter it is read from":
    "ไฟฟ้าและมิเตอร์ที่ใช้อ่านค่า",
  "Add an electricity meter":
    "เพิ่มมิเตอร์ไฟฟ้า",
  "Electricity consumption":
    "ปริมาณการใช้ไฟฟ้า",
  "PEA revenue meter, 115 kV incomer":
    "มิเตอร์คิดค่าไฟของ PEA สายเมนขาเข้า 115 kV",
  "Choose a source above and a row appears here, ready for the meter details.":
    "เลือกแหล่งจ่ายด้านบน แล้วจะมีแถวปรากฏที่นี่ให้กรอกรายละเอียดมิเตอร์",
  "Choose a supply above and a row appears here, ready for the meter details.":
    "เลือกแหล่งจ่ายด้านบน แล้วจะมีแถวปรากฏที่นี่ให้กรอกรายละเอียดมิเตอร์",
  "Why this one question matters":
    "ทำไมคำถามข้อนี้จึงสำคัญ",
  "Add gap":
    "เพิ่มช่วงข้อมูลขาด",
  "Declare a gap":
    "ประกาศช่วงข้อมูลขาด",
  "Quality assurance":
    "การประกันคุณภาพ",
  "Installation diagram":
    "แผนผังสถานประกอบการ",
  "{left} of {total} still unticked. Anything left unticked is a question a verifier will have to ask.":
    "ยังไม่ได้ติ๊ก {left} จาก {total} รายการ ทุกรายการที่ไม่ได้ติ๊กคือคำถามที่ผู้ตรวจสอบจะต้องถาม",
  "What to attach here":
    "ต้องแนบอะไรที่นี่",
  "What to attach":
    "ต้องแนบอะไร",
  "“Factory-licence-TH-RAYONG-01.pdf” for identity; “FT-2201-calibration-2026-03-12.pdf” for the gas meter named in section 4.":
    "เช่น “Factory-licence-TH-RAYONG-01.pdf” สำหรับหลักฐานยืนยันตัวตน และ “FT-2201-calibration-2026-03-12.pdf” สำหรับมิเตอร์ก๊าซที่ระบุไว้ในหัวข้อ 4",
  "Copy setup from previous month":
    "คัดลอกการตั้งค่าจากเดือนก่อนหน้า",
  "How the twelve months are asked for":
    "ขอข้อมูลสิบสองเดือนอย่างไร",
  "Where these figures come from":
    "ตัวเลขเหล่านี้มาจากที่ใด",
  "What counts as attached":
    "อะไรนับว่าแนบแล้ว",
  "The monitoring methodology":
    "วิธีการติดตามตรวจวัด",
  "Why this is a separate block":
    "ทำไมส่วนนี้จึงแยกออกมา",
  "Why this is not the same as readiness":
    "ทำไมส่วนนี้จึงไม่ใช่เรื่องเดียวกับความพร้อม",
  "What archiving does":
    "การเก็บเข้าคลังทำอะไรบ้าง",
  "Your site":
    "สถานที่ของคุณ",
  "Create a new supplier":
    "สร้างซัพพลายเออร์ใหม่",
  "Choosing the good":
    "การเลือกสินค้า",
  "The monthly ask":
    "การขอข้อมูลรายเดือน",
  "Creating…":
    "กำลังสร้าง…",
  "All installations":
    "ทุกสถานประกอบการ",
  "All years":
    "ทุกปี",
  "Any readiness":
    "ความพร้อมทุกระดับ",
  "All sectors":
    "ทุกสาขา",
  "All types":
    "ทุกประเภท",
  "All groups":
    "ทุกกลุ่ม",
  "Restore":
    "กู้คืน",
  "Restore workspace":
    "กู้คืนพื้นที่ทำงาน",
  "Continue where you left off":
    "ทำต่อจากที่ค้างไว้",
  "Nothing here is transmitted automatically — this browser only, until you submit.":
    "ไม่มีข้อมูลใดถูกส่งออกโดยอัตโนมัติ ข้อมูลอยู่ในเบราว์เซอร์นี้เท่านั้นจนกว่าคุณจะกดส่ง",
  "Back to declarations":
    "กลับไปที่การสำแดง",
  "Submitting…":
    "กำลังส่ง…",
  "Edit requested":
    "ส่งคำขอแก้ไขแล้ว",
  "Frozen":
    "ตรึงค่าแล้ว",
  "Assumption":
    "ข้อสมมติ",
  "Accept with a reason":
    "ยอมรับพร้อมระบุเหตุผล",
  "Verification report":
    "รายงานการตรวจสอบ",
  "Generate buyer summary package":
    "สร้างชุดสรุปสำหรับผู้ซื้อ",
  "avoided this year, so far":
    "ที่หลีกเลี่ยงได้ในปีนี้จนถึงปัจจุบัน",
  "Suppliers and Reports stay in the left nav — they are quick, frequent jobs, and burying them under a declaration would guarantee they never get done.":
    "ซัพพลายเออร์และรายงานยังคงอยู่ในเมนูด้านซ้าย เพราะเป็นงานสั้นที่ทำบ่อย หากซ่อนไว้ใต้การสำแดงก็แทบรับประกันได้ว่าจะไม่มีใครทำ",
  "No anomalies or gaps — figures are complete, in range and standardised.":
    "ไม่พบความผิดปกติหรือข้อมูลขาด ตัวเลขครบถ้วน อยู่ในช่วงที่สมเหตุสมผล และเป็นมาตรฐานเดียวกัน",
  "Send revision request":
    "ส่งคำขอให้แก้ไข",
  "sha-256 sealed · verification trail + version history embedded":
    "ปิดผนึกด้วย sha-256 · ฝังร่องรอยการตรวจสอบและประวัติเวอร์ชันไว้ในไฟล์",
  "Generate package":
    "สร้างชุดเอกสาร",
  "Schema valid for definitive period":
    "สคีมาถูกต้องสำหรับช่วง definitive period",
  "strict schema validation":
    "การตรวจสอบสคีมาแบบเข้มงวด",
  "Download XML":
    "ดาวน์โหลด XML",
  "Send for confirmation":
    "ส่งไปให้ยืนยัน",
  "Their copy":
    "สำเนาของเขา",
  "Send template":
    "ส่งแบบฟอร์ม",
  "Add buyer":
    "เพิ่มผู้ซื้อ",
  "Add another buyer for this dataset":
    "เพิ่มผู้ซื้ออีกรายสำหรับชุดข้อมูลนี้",
  "Add an upstream precursor of theirs":
    "เพิ่มวัตถุดิบตั้งต้นชั้นบนของเขา",
  "Enter it by hand instead":
    "กรอกด้วยตนเองแทน",
  "carried over":
    "ยกมาจากครั้งก่อน",
  "Scrap / waste":
    "เศษโลหะ / ของเสีย",
  "Why you are being asked to check this":
    "ทำไมจึงขอให้คุณตรวจสอบเรื่องนี้",
  "What a boundary is":
    "ขอบเขตคืออะไร",
  "Add the first process…":
    "เพิ่มกระบวนการแรก…",
  "Add an exclusion":
    "เพิ่มรายการยกเว้น",
  "Sector-specific parameters":
    "พารามิเตอร์เฉพาะสาขา",
  "What counts as production":
    "อะไรนับเป็นการผลิต",
  "Add source":
    "เพิ่มแหล่งจ่าย",
  "Add entry":
    "เพิ่มรายการ",
  "Precursor quantities":
    "ปริมาณวัตถุดิบตั้งต้น",
  "Questionnaire":
    "แบบสอบถาม",
  "Invite":
    "เชิญ",
  "No colleagues yet — you can fill everything yourself, or invite the right people above.":
    "ยังไม่มีเพื่อนร่วมงาน คุณกรอกเองทั้งหมดได้ หรือเชิญผู้ที่เกี่ยวข้องจากด้านบน",
  "Units validated":
    "ตรวจสอบหน่วยแล้ว",
  "No warnings":
    "ไม่มีคำเตือน",
  "Got it":
    "เข้าใจแล้ว",
  "Open document":
    "เปิดเอกสาร",
  "Which name goes here":
    "ชื่อใดที่ต้องกรอกตรงนี้",
  "Coordinates":
    "พิกัด",
  "Authorised representative":
    "ผู้แทนที่ได้รับมอบอำนาจ",
  "Add a good":
    "เพิ่มสินค้า",
  "Editing":
    "กำลังแก้ไข",
  "Hand to a colleague":
    "มอบหมายให้เพื่อนร่วมงาน",
  "Approve — reopen the month":
    "อนุมัติ — เปิดเดือนนี้ใหม่",
  "Reopening…":
    "กำลังเปิดใหม่…",
  "Reopened":
    "เปิดใหม่แล้ว",
  "Recording…":
    "กำลังบันทึก…",
  "What the supplier receives":
    "สิ่งที่ซัพพลายเออร์ได้รับ",
  "Ask for a fix":
    "ขอให้แก้ไข",
  "Sent back":
    "ส่งกลับแล้ว",
  "Who this is":
    "นี่คือใคร",
  "Where each month goes":
    "แต่ละเดือนส่งไปที่ใด",

  /* ── Final sweep — long-form help, autosave and the last of the lib tables ─────────────────────────────── */
  "No months submitted yet":
    "ยังไม่มีเดือนที่ส่งข้อมูล",
  "Produced in the period (t)":
    "ผลิตได้ในรอบนี้ (ตัน)",
  "Emission factor (tCO₂/GJ)":
    "ค่าแฟกเตอร์การปล่อยก๊าซ (tCO₂/GJ)",
  "Consumption (MWh, whole period)":
    "ปริมาณการใช้ (MWh ตลอดทั้งรอบ)",
  "Emission factor (tCO₂/MWh)":
    "ค่าแฟกเตอร์การปล่อยก๊าซ (tCO₂/MWh)",
  "Carbon content (0–1)":
    "ปริมาณคาร์บอน (0–1)",
  "Assumptions are allowed — undeclared ones are not. Every entry below appears in the Monitoring Methodology Documentation's assumptions register, and a verifier will ask how each was derived and whether it was biased in your favour.":
    "การตั้งข้อสมมติทำได้ แต่ข้อสมมติที่ไม่ได้ประกาศไว้ทำไม่ได้ ทุกรายการด้านล่างจะปรากฏในทะเบียนข้อสมมติของเอกสาร MMD และผู้ตรวจสอบจะถามว่าแต่ละข้อได้มาอย่างไร และเข้าข้างคุณหรือไม่",
  "This is the first thing a verifier asks for — before any figure is tested. Everything below is generated from what you have already entered; read it, correct what is wrong, and finalise a version.":
    "นี่คือสิ่งแรกที่ผู้ตรวจสอบขอ ก่อนจะทดสอบตัวเลขใด ๆ ทุกอย่างด้านล่างสร้างจากข้อมูลที่คุณกรอกไว้แล้ว อ่านทบทวน แก้ส่วนที่ผิด แล้วปิดฉบับเป็นเวอร์ชันหนึ่ง",
  "Certificate exposure, carbon-price spend and supplier cost stay on your side of the line. The verifier sees provenance, attestations and the derivation behind every figure — which is everything their opinion depends on and nothing of your commercial position. Suppliers can withhold their process from a buyer; they can never withhold it from the verifier.":
    "ภาระใบรับรอง ค่าใช้จ่ายด้านราคาคาร์บอน และต้นทุนซัพพลายเออร์ ยังคงอยู่ฝั่งของคุณ ผู้ตรวจสอบจะเห็นแหล่งที่มา หนังสือรับรอง และที่มาของทุกตัวเลข ซึ่งเป็นทุกสิ่งที่ความเห็นของเขาต้องใช้ และไม่มีส่วนใดเกี่ยวกับสถานะทางการค้าของคุณ ซัพพลายเออร์ปิดบังกระบวนการของตนจากผู้ซื้อได้ แต่ปิดบังจากผู้ตรวจสอบไม่ได้",
  "Add the process in order":
    "เพิ่มกระบวนการตามลำดับ",
  "Declare an exclusion":
    "ประกาศรายการยกเว้น",
  "Select a fuel above first — then add the instrument that measures it.":
    "เลือกเชื้อเพลิงด้านบนก่อน แล้วจึงเพิ่มอุปกรณ์ที่ใช้วัดเชื้อเพลิงนั้น",
  "Add one row per fuel selected above.":
    "เพิ่มหนึ่งแถวต่อหนึ่งเชื้อเพลิงที่เลือกไว้ด้านบน",
  "The source category decides which emission factor is admissible — the grid factor, or a specific generator’s, which needs the contract behind it.":
    "ประเภทของแหล่งจ่ายเป็นตัวกำหนดว่าใช้ค่าแฟกเตอร์ใดได้ ระหว่างค่าแฟกเตอร์ของระบบจำหน่าย หรือของผู้ผลิตไฟฟ้ารายใดรายหนึ่ง ซึ่งต้องมีสัญญารองรับ",
  "A 2 MW gas cogeneration set: the natural gas is a fuel row; its output is not a separate electricity purchase.":
    "ตัวอย่าง ชุดผลิตไฟฟ้าร่วมความร้อนที่ใช้ก๊าซขนาด 2 MW ก๊าซธรรมชาติถือเป็นแถวเชื้อเพลิง ส่วนไฟฟ้าที่ผลิตได้ไม่นับเป็นการซื้อไฟแยกต่างหาก",
  "No data gaps — every month is primary data. That is the answer a verifier wants; leave it empty if it is true.":
    "ไม่มีช่วงข้อมูลขาด ทุกเดือนเป็นข้อมูลปฐมภูมิ นั่นคือคำตอบที่ผู้ตรวจสอบต้องการ หากเป็นจริงก็เว้นว่างไว้ได้",
  "The same form the supplier answers on their link, field for field. What you change here is what they see; what they send is what you read.":
    "แบบฟอร์มเดียวกับที่ซัพพลายเออร์กรอกในลิงก์ของเขา ตรงกันทุกช่อง สิ่งที่คุณแก้ที่นี่คือสิ่งที่เขาเห็น และสิ่งที่เขาส่งมาคือสิ่งที่คุณอ่าน",
  "above to change a figure — doing so is recorded, and it replaces the supplier’s attestation with your own edit.":
    "ด้านบนเพื่อแก้ตัวเลข การแก้ไขจะถูกบันทึกไว้ และจะแทนที่คำรับรองของซัพพลายเออร์ด้วยการแก้ไขของคุณเอง",
  "Certrace does not deliver yet. Sending records the ask and starts the clock;":
    "Certrace ยังไม่ได้ส่งให้โดยอัตโนมัติ การกดส่งจะบันทึกว่าคุณได้ขอแล้วและเริ่มนับเวลา",
  "Entered on the Precursors step of each month’s supplier link, or on the month screen here — one record, either way.":
    "กรอกได้ที่ขั้นตอนวัตถุดิบตั้งต้นในลิงก์ของซัพพลายเออร์ในแต่ละเดือน หรือที่หน้าเดือนตรงนี้ ไม่ว่าทางใดก็เป็นข้อมูลชุดเดียวกัน",
  "Reading this installation’s record…":
    "กำลังอ่านข้อมูลของสถานประกอบการนี้…",
  "Product & production route":
    "สินค้าและกระบวนการผลิต",
  "— this workspace’s stored route doesn’t match its stored category. Fix it in Edit.":
    " — กระบวนการผลิตที่บันทึกไว้ของพื้นที่ทำงานนี้ไม่ตรงกับหมวดหมู่ที่บันทึกไว้ กรุณาแก้ไขในหน้าแก้ไข",
  "To report a different year for the same installation and product, create a second workspace. Two years in one workspace cannot answer “show me March” without asking which March.":
    "หากต้องการรายงานปีอื่นสำหรับสถานประกอบการและสินค้าเดียวกัน ให้สร้างพื้นที่ทำงานอีกชุด การรวมสองปีไว้ในพื้นที่ทำงานเดียวจะตอบคำถาม “ขอดูเดือนมีนาคม” ไม่ได้ โดยไม่ต้องถามย้อนว่ามีนาคมของปีไหน",
  "Zero is not a safe default here — enter the real share of this good's emissions the instrument actually covers before this can be submitted.":
    "ค่าศูนย์ไม่ใช่ค่าเริ่มต้นที่ปลอดภัยในช่องนี้ กรุณากรอกสัดส่วนจริงของการปล่อยก๊าซของสินค้านี้ที่มาตรการครอบคลุม ก่อนจึงจะส่งได้",
  "Readiness is per TAB, because a tab is somebody’s job. The report is organised by SECTION, and the two do not line up.":
    "ความพร้อมวัดเป็นรายแท็บ เพราะแต่ละแท็บคืองานของใครคนหนึ่ง ส่วนรายงานจัดเรียงเป็นรายหัวข้อ ซึ่งสองอย่างนี้ไม่ได้ตรงกันหนึ่งต่อหนึ่ง",
  "Section 3.4 is assembled out of three tabs; one thin tab leaves four sections short. This says which sections.":
    "หัวข้อ 3.4 ประกอบขึ้นจากสามแท็บ หากแท็บใดข้อมูลบาง จะทำให้สี่หัวข้อไม่ครบ ส่วนนี้บอกว่าเป็นหัวข้อใดบ้าง",
  "The deadline below is the last date that month’s data may be sent. It is the date Readiness, the dashboard and the Inbox all measure “late” against.":
    "กำหนดด้านล่างคือวันสุดท้ายที่ส่งข้อมูลของเดือนนั้นได้ และเป็นวันที่ทั้งหน้าความพร้อม แดชบอร์ด และกล่องงานเข้า ใช้วัดว่า “ล่าช้า” หรือไม่",
  "Until the hosted service is live, you send each month’s link yourself from the Monthly data tab.":
    "จนกว่าบริการบนคลาวด์จะเปิดใช้ คุณต้องส่งลิงก์ของแต่ละเดือนเองจากแท็บข้อมูลรายเดือน",
  "It leaves the active estate: off the dashboard, out of the Inbox, and no longer counted in Reports or Carbon & Cost. Its monthly readings, MMD drafts and precursor rows are untouched.":
    "รายการนี้จะออกจากภาพรวมที่ใช้งาน ไม่ปรากฏบนแดชบอร์ด ไม่อยู่ในกล่องงานเข้า และไม่ถูกนับในรายงานหรือหน้าคาร์บอนและต้นทุน ส่วนค่าที่บันทึกรายเดือน แบบร่าง MMD และแถววัตถุดิบตั้งต้น ยังคงอยู่ครบ",
  "The route decides which precursors are even possible above this good, and it is the first thing a verifier checks the MMD’s boundary description against.":
    "กระบวนการผลิตเป็นตัวกำหนดว่าวัตถุดิบตั้งต้นใดเป็นไปได้เหนือสินค้านี้ และเป็นสิ่งแรกที่ผู้ตรวจสอบใช้เทียบกับคำอธิบายขอบเขตใน MMD",
  "What you choose is the last date the data may be sent. You can change it later in the workspace’s Settings tab, and months already sent keep the date they went out with.":
    "สิ่งที่คุณเลือกคือวันสุดท้ายที่ส่งข้อมูลได้ เปลี่ยนภายหลังได้ในแท็บการตั้งค่าของพื้นที่ทำงาน ส่วนเดือนที่ส่งไปแล้วจะคงวันที่เดิมที่ส่งออกไป",
  "— no password, no server session, nothing sent anywhere. It only pre-fills this installation’s details the next time this SAME link is opened on this SAME device or browser.":
    " — ไม่มีรหัสผ่าน ไม่มีเซสชันบนเซิร์ฟเวอร์ และไม่มีการส่งข้อมูลไปที่ใด เพียงเติมรายละเอียดของสถานประกอบการนี้ล่วงหน้าเมื่อเปิดลิงก์เดิมบนอุปกรณ์หรือเบราว์เซอร์เดิมในครั้งถัดไป",
  "Every answer stays in this browser until Certrace’s hosted service is connected.":
    "ทุกคำตอบจะอยู่ในเบราว์เซอร์นี้จนกว่าบริการบนคลาวด์ของ Certrace จะเชื่อมต่อ",
  "Compared against Certrace’s indicative category reference values, not a filed figure — see the note in the default-value table.":
    "เปรียบเทียบกับค่าอ้างอิงระดับหมวดหมู่ของ Certrace ซึ่งไม่ใช่ตัวเลขที่ยื่น ดูหมายเหตุในตารางค่า default",
  "At full phase-in (2034 rate):":
    "เมื่อบังคับใช้เต็มรูปแบบ (อัตราปี 2034):",
  "A trust score exists for declarations, but it reads a declaration’s supplier-review rollup — a workspace has no equivalent. Rather than invent a second, differently-defined score for this page, this widget stays empty until one calculation covers both.":
    "คะแนนความน่าเชื่อถือมีอยู่สำหรับการสำแดง แต่คำนวณจากผลรวมการตรวจทานซัพพลายเออร์ของการสำแดง ซึ่งพื้นที่ทำงานไม่มีค่าเทียบเท่า แทนที่จะสร้างคะแนนชุดที่สองที่นิยามต่างกันสำหรับหน้านี้ ส่วนนี้จะว่างไว้จนกว่าจะมีการคำนวณชุดเดียวที่ครอบคลุมทั้งสองแบบ",
  "The EU importer's Authorised CBAM Declarant is the party that actually files with the Registry. Until this declaration names one, with an EORI, everything collected below it has nowhere to go.":
    "Authorised CBAM Declarant ของผู้นำเข้าในสหภาพยุโรปคือผู้ที่ยื่นต่อ Registry จริง หากการสำแดงนี้ยังไม่ได้ระบุผู้นั้นพร้อมหมายเลข EORI ข้อมูลทั้งหมดที่เก็บไว้ด้านล่างก็ไม่มีปลายทาง",
  "Ranked by absolute chargeable emissions, because that's what you pay for — a high-intensity supplier on a small lot costs less than an average one on a big one.":
    "เรียงตามปริมาณการปล่อยก๊าซส่วนที่ต้องชำระเป็นค่าสัมบูรณ์ เพราะนั่นคือสิ่งที่คุณจ่าย ซัพพลายเออร์ที่ค่าความเข้มข้นสูงแต่ปริมาณน้อย จะมีต้นทุนต่ำกว่ารายที่ค่าปานกลางแต่ปริมาณมาก",
  "module (so any declarant holding your EORI reference can pull the data straight in) or the official":
    "(ผู้ยื่นสำแดงรายใดที่มีหมายเลข EORI อ้างอิงของคุณก็ดึงข้อมูลเข้าไปได้โดยตรง) หรือผ่านเอกสาร",
  "Push to CBAM Registry (O3CI)":
    "ส่งเข้า CBAM Registry (O3CI)",
  "Uploads the approved installation + emissions dataset in the Registry's own schema. Pushed once, it serves every buyer below — any declarant holding your EORI reference pulls the same data in directly.":
    "อัปโหลดชุดข้อมูลสถานประกอบการและการปล่อยก๊าซที่อนุมัติแล้ว ในรูปแบบสคีมาของ Registry เอง ส่งเพียงครั้งเดียวก็ใช้ได้กับผู้ซื้อทุกรายด้านล่าง ผู้ยื่นสำแดงรายใดที่มีหมายเลข EORI อ้างอิงของคุณจะดึงข้อมูลชุดเดียวกันไปได้โดยตรง",
  "What buyers don't receive":
    "สิ่งที่ผู้ซื้อไม่ได้รับ",
  "· fill in":
    "· กรอก",
  "A verification report is attached in Documents, below. Actual data from a precursor made elsewhere counts only if a report from an accredited verifier covers this period — attach it there for the four-check gate under “Data origin” to pass.":
    "รายงานการตรวจสอบแนบไว้ในหัวข้อเอกสารด้านล่าง ข้อมูลจริงของวัตถุดิบตั้งต้นที่ผลิตจากที่อื่นจะนับได้ก็ต่อเมื่อมีรายงานจากผู้ตรวจสอบที่ได้รับการรับรองครอบคลุมรอบนี้ ให้แนบไว้ที่นั่นเพื่อให้ผ่านการตรวจสี่ข้อภายใต้หัวข้อ “ที่มาของข้อมูล”",
  "Add a child here only if you are modelling this precursor entry’s own upstream chain yourself. If the figure above already came verified, it already accounts for whatever went into making this precursor — do not add children under a verified figure. A single supplier may appear against more than one precursor entry; this note is about THIS entry’s material, not about the supplier as a whole.":
    "เพิ่มรายการย่อยที่นี่เฉพาะกรณีที่คุณกำลังสร้างแบบจำลองห่วงโซ่ชั้นบนของวัตถุดิบตั้งต้นรายการนี้ด้วยตนเอง หากตัวเลขด้านบนผ่านการตรวจสอบมาแล้ว ตัวเลขนั้นได้รวมทุกสิ่งที่ใช้ผลิตวัตถุดิบตั้งต้นนี้ไว้แล้ว จึงไม่ควรเพิ่มรายการย่อยใต้ค่าที่ผ่านการตรวจสอบ ซัพพลายเออร์รายเดียวอาจปรากฏในวัตถุดิบตั้งต้นมากกว่าหนึ่งรายการ หมายเหตุนี้พูดถึงวัสดุของรายการนี้ ไม่ใช่ตัวซัพพลายเออร์โดยรวม",
  "Optional — but a figure you can show the workings for is worth far more than one you cannot. Enter what the installation consumed over the whole reporting period; Certrace divides by your output to get the per-tonne figure.":
    "ไม่บังคับ แต่ตัวเลขที่แสดงวิธีคำนวณได้มีค่ามากกว่าตัวเลขที่แสดงไม่ได้มาก กรอกปริมาณที่สถานประกอบการใช้ตลอดทั้งรอบรายงาน แล้ว Certrace จะหารด้วยผลผลิตของคุณเพื่อให้ได้ค่าต่อตัน",
  "Electricity drawn (total MWh)":
    "ไฟฟ้าที่ใช้ (รวม MWh)",
  "These are the facts a verifier asks about a producing site, in the order the EU’s own template asks for them.":
    "ข้อมูลเหล่านี้คือสิ่งที่ผู้ตรวจสอบถามเกี่ยวกับสถานที่ผลิต เรียงตามลำดับที่แบบฟอร์มของสหภาพยุโรปถาม",
  "Anything you change here appears on the exporter’s screen too. It is one record, not two copies.":
    "สิ่งที่คุณแก้ที่นี่จะปรากฏบนหน้าจอของผู้ส่งออกด้วย เพราะเป็นข้อมูลชุดเดียว ไม่ใช่สำเนาสองชุด",
  "Say what is INSIDE it and, just as importantly, what is deliberately outside. A verifier’s first completeness question is what was left out.":
    "ระบุว่าอะไรอยู่ภายในขอบเขต และที่สำคัญไม่แพ้กันคืออะไรที่จงใจไว้ภายนอก คำถามแรกด้านความครบถ้วนของผู้ตรวจสอบคือมีอะไรถูกละไว้บ้าง",
  "Nothing declared as excluded. If part of the plant is genuinely outside this good’s boundary — a separate line, a leased workshop, the canteen — say so here. An undeclared exclusion is the most common first-engagement finding.":
    "ยังไม่ได้ประกาศการยกเว้นใด หากส่วนใดของโรงงานอยู่นอกขอบเขตของสินค้านี้จริง เช่น สายการผลิตแยก โรงงานที่ให้เช่า หรือโรงอาหาร ให้ระบุไว้ที่นี่ การยกเว้นที่ไม่ได้ประกาศคือข้อสังเกตที่พบบ่อยที่สุดในการตรวจครั้งแรก",
  "Burning fuel is where most of a steel plant’s direct CO₂ comes from. Naming the fuels here means a month that suddenly shows a fourth fuel is visible as an exception rather than passing unnoticed.":
    "การเผาไหม้เชื้อเพลิงคือแหล่งที่มาของ CO₂ ทางตรงส่วนใหญ่ของโรงงานเหล็ก การระบุชนิดเชื้อเพลิงไว้ที่นี่ทำให้เดือนที่จู่ ๆ มีเชื้อเพลิงชนิดที่สี่โผล่มาปรากฏเป็นข้อยกเว้นที่มองเห็นได้ แทนที่จะผ่านไปโดยไม่มีใครสังเกต",
  "Natural gas + diesel. Instrument: “Natural gas volume · Elster RVG G250 · monthly · calibrated 15 Mar 2026”.":
    "ตัวอย่าง ก๊าซธรรมชาติและดีเซล อุปกรณ์วัด: “Natural gas volume · Elster RVG G250 · รายเดือน · สอบเทียบเมื่อ 15 มี.ค. 2026”",
  "The source decides which emission factor you are allowed to use. Grid power uses the national factor; a direct line or a power purchase agreement uses the generator’s own, and that needs the contract behind it.":
    "แหล่งจ่ายเป็นตัวกำหนดว่าคุณใช้ค่าแฟกเตอร์ใดได้ ไฟจากระบบจำหน่ายใช้ค่าแฟกเตอร์ระดับประเทศ ส่วนสายส่งตรงหรือสัญญาซื้อขายไฟฟ้าใช้ค่าของผู้ผลิตไฟฟ้าเอง ซึ่งต้องมีสัญญารองรับ",
  "“Grid — Provincial Electricity Authority (PEA)”, meter PEA 3392011 on main incomer MDB-1.":
    "ตัวอย่าง “ระบบจำหน่าย — การไฟฟ้าส่วนภูมิภาค (PEA)” มิเตอร์ PEA 3392011 ที่สายเมนขาเข้า MDB-1",
  "Tick this once you have checked. If the fuel is not up there, add it — leaving it out understates your direct emissions; entering the generated electricity as well would count the same carbon twice.":
    "ติ๊กช่องนี้เมื่อคุณตรวจแล้ว หากเชื้อเพลิงยังไม่อยู่ด้านบน ให้เพิ่มเข้าไป การละไว้จะทำให้การปล่อยก๊าซทางตรงต่ำกว่าความจริง และการกรอกไฟฟ้าที่ผลิตเองเข้าไปด้วยจะเป็นการนับคาร์บอนก้อนเดียวกันสองครั้ง",
  "“Estimated” on its own is a finding. HOW it was estimated — from the mean of the months either side, normalised to production — is an answer.":
    "การเขียนเพียงว่า “ประมาณการ” จะกลายเป็นข้อสังเกต แต่การอธิบายว่าประมาณอย่างไร เช่น ใช้ค่าเฉลี่ยของเดือนก่อนและหลัง ปรับตามปริมาณการผลิต จึงถือเป็นคำตอบ",
  "Zero-rating this fuel needs the sustainability criteria of Directive (EU) 2018/2001 Art. 29(2)–(7) and (10) evidenced first — attach it on the Documents step to unlock a fraction above zero.":
    "การคิดเชื้อเพลิงนี้เป็นศูนย์ต้องมีหลักฐานตามเกณฑ์ความยั่งยืนของ Directive (EU) 2018/2001 มาตรา 29(2)–(7) และ (10) ก่อน ให้แนบไว้ในขั้นตอนเอกสารเพื่อปลดล็อกการกรอกสัดส่วนที่มากกว่าศูนย์",
  "Burned to generate this month’s self-generated electricity.":
    "เผาไหม้เพื่อผลิตไฟฟ้าใช้เองในเดือนนี้",
  "CO₂ released by the chemistry rather than by burning fuel — flux decomposition, electrode consumption, carbon injection. Pick the material and the quantity; the figure is computed, not typed. Zero rows recorded is a common and correct answer.":
    "CO₂ ที่ปล่อยจากปฏิกิริยาเคมี ไม่ใช่จากการเผาไหม้เชื้อเพลิง เช่น การสลายตัวของฟลักซ์ การสึกหรอของอิเล็กโทรด และการฉีดคาร์บอน เลือกวัสดุและปริมาณ แล้วระบบจะคำนวณค่าให้ ไม่ต้องพิมพ์เอง การไม่มีรายการใดเลยเป็นคำตอบที่พบบ่อยและถูกต้อง",
  "They're all still correct":
    "ทั้งหมดยังถูกต้องอยู่",
  "Files stay in your browser for this demo — names and sizes are recorded so you can see the flow; nothing is uploaded to a server.":
    "ในเวอร์ชันตัวอย่างนี้ ไฟล์จะอยู่ในเบราว์เซอร์ของคุณ ระบบบันทึกเพียงชื่อและขนาดไฟล์เพื่อให้เห็นขั้นตอนการทำงาน และไม่มีการอัปโหลดขึ้นเซิร์ฟเวอร์",
  "can't be withheld from buyers — they're what the CBAM declaration is made of, and holding them back would only mean your goods can't clear. The rest is genuinely optional, and turning it off costs you nothing.":
    "ปิดบังจากผู้ซื้อไม่ได้ เพราะเป็นส่วนประกอบของการสำแดง CBAM การกักไว้มีแต่จะทำให้สินค้าของคุณผ่านพิธีการไม่ได้ ส่วนที่เหลือเป็นตัวเลือกจริง ๆ และการปิดไว้ไม่มีผลเสียกับคุณ",
  "On — their next request opens pre-filled and you confirm or update the figures instead of retyping them. Off — every request starts blank. Either way, data you've already submitted stays with them; this only governs what gets carried forward.":
    "เปิด — คำขอครั้งถัดไปของเขาจะเปิดขึ้นพร้อมข้อมูลที่กรอกไว้ล่วงหน้า คุณเพียงยืนยันหรืออัปเดตตัวเลขแทนการพิมพ์ใหม่ ปิด — ทุกคำขอเริ่มจากแบบฟอร์มเปล่า ไม่ว่ากรณีใด ข้อมูลที่คุณส่งไปแล้วยังคงอยู่กับเขา การตั้งค่านี้ควบคุมเพียงว่าจะยกข้อมูลใดมาใช้ต่อ",
  "This data lives in different teams — emissions with ESG, carbon price with finance, certificates with QA. Invite a colleague and assign the sections that are theirs. They get a link to just their part; you stay in control and sign at the end.":
    "ข้อมูลชุดนี้อยู่กับหลายทีม การปล่อยก๊าซอยู่กับฝ่าย ESG ราคาคาร์บอนอยู่กับฝ่ายการเงิน และใบรับรองอยู่กับฝ่ายประกันคุณภาพ เชิญเพื่อนร่วมงานแล้วมอบหมายหัวข้อที่เป็นของเขา เขาจะได้รับลิงก์เฉพาะส่วนของตน ส่วนคุณยังคุมภาพรวมและลงนามในตอนท้าย",
  "Completeness, validation, anomaly detection and standardization run automatically. Critical issues must be fixed; warnings you can acknowledge and proceed.":
    "ระบบตรวจความครบถ้วน ความถูกต้อง ความผิดปกติ และการปรับให้เป็นมาตรฐาน โดยอัตโนมัติ ประเด็นระดับวิกฤตต้องแก้ไข ส่วนคำเตือนสามารถรับทราบแล้วดำเนินการต่อได้",
  "All changes saved":
    "บันทึกการเปลี่ยนแปลงทั้งหมดแล้ว",
  "Unsaved changes…":
    "มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก…",
  "Saved automatically at {time}":
    "บันทึกอัตโนมัติเมื่อ {time}",
  "Saved automatically":
    "บันทึกอัตโนมัติแล้ว",
  "Could not save — copy your entries before leaving":
    "บันทึกไม่สำเร็จ กรุณาคัดลอกข้อมูลที่กรอกไว้ก่อนออกจากหน้านี้",
  "An EU-accredited verifier reads this. Implementing Regulation (EU) 2025/2547 puts it in writing — the monitoring methodology under Article 5(6), the emissions report under Article 10(4).":
    "ผู้ตรวจสอบที่ได้รับการรับรองจากสหภาพยุโรปเป็นผู้อ่านเอกสารนี้ Implementing Regulation (EU) 2025/2547 ระบุไว้เป็นลายลักษณ์อักษร โดยวิธีการติดตามตรวจวัดอยู่ในมาตรา 5(6) และรายงานการปล่อยก๊าซอยู่ในมาตรา 10(4)",
  "{count} awaiting review":
    "รอการตรวจทาน {count} รายการ",
  "{covered} of {total} have a document behind them.":
    "มีเอกสารรองรับแล้ว {covered} จาก {total} รายการ",
  "Every process on the list is already declared outside the boundary. If that is right, nothing is inside it — check the “Processes included” list above.":
    "ทุกกระบวนการในรายการถูกประกาศว่าอยู่นอกขอบเขตแล้ว หากถูกต้องก็เท่ากับไม่มีสิ่งใดอยู่ในขอบเขตเลย กรุณาตรวจรายการ “กระบวนการที่รวมอยู่ในขอบเขต” ด้านบน",
  "The English name of the producing site — the one your buyer’s declarant and the verifier will use. A Thai name goes in the optional field beside it.":
    "ชื่อภาษาอังกฤษของสถานที่ผลิต ซึ่งเป็นชื่อที่ผู้ยื่นสำแดงของผู้ซื้อและผู้ตรวจสอบจะใช้ ส่วนชื่อภาษาไทยให้กรอกในช่องที่ไม่บังคับข้าง ๆ",
  "Two sites cannot share a reference: every workspace, shipment and document points at this id, and a duplicate would attach one plant’s year of data to another. To change a site you have already added, open it from Settings → Installations rather than re-entering it here.":
    "สองสถานที่ใช้รหัสอ้างอิงเดียวกันไม่ได้ เพราะทุกพื้นที่ทำงาน ทุกรายการจัดส่ง และทุกเอกสารชี้มาที่รหัสนี้ หากซ้ำกันจะทำให้ข้อมูลทั้งปีของโรงงานหนึ่งไปผูกกับอีกโรงงานหนึ่ง หากต้องการแก้ไขสถานที่ที่เพิ่มไว้แล้ว ให้เปิดจากการตั้งค่า → สถานประกอบการ แทนการกรอกใหม่ที่นี่",
  "What this site actually does, not the company’s line of business. A verifier reads it against the MMD boundary, so “manufacture of steel” is too broad.":
    "สถานที่นี้ทำอะไรจริง ๆ ไม่ใช่สายธุรกิจของบริษัท ผู้ตรวจสอบจะอ่านเทียบกับขอบเขตใน MMD คำว่า “ผลิตเหล็ก” จึงกว้างเกินไป",
  "Where in the duct or stack the analyser takes its sample. This is a defined term — Annex I item 25 of Implementing Regulation (EU) 2025/2547 — and it applies only to continuous emission measurement.":
    "ตำแหน่งในท่อหรือปล่องที่เครื่องวิเคราะห์เก็บตัวอย่าง คำนี้เป็นคำนิยาม ตาม Annex I ข้อ 25 ของ Implementing Regulation (EU) 2025/2547 และใช้เฉพาะกับการวัดการปล่อยก๊าซแบบต่อเนื่องเท่านั้น",
  "It is not the same thing as the electricity metering point on the card below. That one is a revenue meter; this one is a sampling location on a flue.":
    "ไม่ใช่สิ่งเดียวกับจุดวัดไฟฟ้าในการ์ดด้านล่าง จุดนั้นคือมิเตอร์สำหรับคิดค่าไฟ ส่วนจุดนี้คือตำแหน่งเก็บตัวอย่างบนปล่องระบาย",

  /* ── The lib tables — labels, hints, issue messages and section help ─────────────────────────────── */
  "Cold rolling":
    "การรีดเย็น",
  "Surface treatment":
    "การปรับสภาพผิว",
  "EU standard value":
    "ค่ามาตรฐานของสหภาพยุโรป",
  "Laboratory analysis":
    "ผลวิเคราะห์จากห้องปฏิบัติการ",
  "National inventory":
    "บัญชีก๊าซเรือนกระจกระดับประเทศ",
  "The default factor published by the Commission for this fuel or material. Always acceptable, never the most favourable.":
    "ค่าแฟกเตอร์ default ที่คณะกรรมาธิการยุโรปประกาศไว้สำหรับเชื้อเพลิงหรือวัสดุนี้ ใช้ได้เสมอ แต่ไม่เคยเป็นค่าที่ได้เปรียบที่สุด",
  "A factor measured from your own samples. The strongest evidence, and it needs the certificate and the sampling frequency behind it.":
    "ค่าแฟกเตอร์ที่วัดจากตัวอย่างของคุณเอง เป็นหลักฐานที่หนักแน่นที่สุด และต้องมีใบรับรองพร้อมความถี่ในการเก็บตัวอย่างรองรับ",
  "Thailand's national GHG inventory value (TGO). Acceptable where it is the more representative figure — say why it is.":
    "ค่าจากบัญชีก๊าซเรือนกระจกแห่งชาติของไทย (อบก./TGO) ใช้ได้ในกรณีที่เป็นตัวเลขที่สะท้อนความจริงมากกว่า และต้องอธิบายว่าเพราะเหตุใด",
  "A figure your supplier gave you. It is only as good as their own monitoring, so a verifier will ask what sits behind it.":
    "ตัวเลขที่ซัพพลายเออร์ให้มา ซึ่งดีได้เท่าที่ระบบติดตามตรวจวัดของเขาดี ผู้ตรวจสอบจะถามว่ามีอะไรรองรับ",
  "Logged automatically without an operator present — a CEMS or a SCADA-connected meter.":
    "บันทึกอัตโนมัติโดยไม่ต้องมีผู้ควบคุมอยู่ เช่น ระบบ CEMS หรือมิเตอร์ที่เชื่อมกับ SCADA",
  "Recorded every hour, usually by a data logger.":
    "บันทึกทุกชั่วโมง โดยทั่วไปด้วยเครื่องบันทึกข้อมูล",
  "Read at each shift handover. Say how many shifts a day in the note if it is not three.":
    "อ่านค่าทุกครั้งที่เปลี่ยนกะ หากไม่ใช่วันละสามกะ ให้ระบุจำนวนกะไว้ในหมายเหตุ",
  "One reading per production day.":
    "อ่านค่าวันละครั้งในวันที่มีการผลิต",
  "One reading per week.":
    "อ่านค่าสัปดาห์ละครั้ง",
  "One reading per month — most commonly the utility meter read against the invoice.":
    "อ่านค่าเดือนละครั้ง โดยทั่วไปคือการอ่านมิเตอร์เทียบกับใบแจ้งหนี้",
  "Per batch / per heat":
    "ต่อรอบการผลิต / ต่อเตา",
  "Tied to production events rather than the clock. The right answer for furnace charges.":
    "ผูกกับเหตุการณ์ในการผลิตแทนที่จะผูกกับเวลา เป็นคำตอบที่ถูกต้องสำหรับการป้อนเตา",
  "Per delivery":
    "ต่อการส่งมอบแต่ละครั้ง",
  "Read when fuel is delivered — the usual answer for tanked diesel and fuel oil.":
    "อ่านค่าเมื่อมีการส่งเชื้อเพลิง เป็นคำตอบทั่วไปสำหรับดีเซลและน้ำมันเตาที่เก็บในถัง",
  "One reading per quarter. Expect a question about how the monthly figures are derived from it.":
    "อ่านค่าไตรมาสละครั้ง ควรเตรียมตอบว่าตัวเลขรายเดือนได้มาจากค่านี้อย่างไร",
  "One reading a year. Rarely sufficient on its own for monthly reporting.":
    "อ่านค่าปีละครั้ง ซึ่งมักไม่เพียงพอสำหรับการรายงานรายเดือน",
  "Direct technical link":
    "การเชื่อมต่อทางเทคนิคโดยตรง",
  "Power purchase agreement":
    "สัญญาซื้อขายไฟฟ้า (PPA)",
  "Every process step inside the boundary, in the order material moves through them.":
    "ทุกขั้นตอนของกระบวนการภายในขอบเขต เรียงตามลำดับที่วัตถุดิบเคลื่อนผ่าน",
  "A drawn boundary line, with the excluded processes visibly outside it.":
    "เส้นขอบเขตที่วาดไว้ชัดเจน โดยกระบวนการที่ยกเว้นอยู่นอกเส้นให้เห็นได้",
  "Where each fuel and each electricity feed enters, and which meter records it.":
    "จุดที่เชื้อเพลิงและสายจ่ายไฟแต่ละเส้นเข้าสู่ระบบ และมิเตอร์ตัวใดเป็นผู้บันทึก",
  "Where precursors enter and where the finished good leaves.":
    "จุดที่วัตถุดิบตั้งต้นเข้า และจุดที่สินค้าสำเร็จรูปออก",
  "The meter or instrument reference beside each point where something is measured, matching the parameter names used above.":
    "รหัสอ้างอิงของมิเตอร์หรืออุปกรณ์กำกับไว้ข้างทุกจุดที่มีการวัด โดยให้ตรงกับชื่อพารามิเตอร์ที่ใช้ด้านบน",
  "A process flow diagram, not a site plan. Annex II A.5(13) of IR (EU) 2025/2547 makes it a required element of the monitoring plan, and it asks the drawing to do one specific job: show the system boundaries of the installation and its production processes, and evidence that there is neither double counting nor a data gap. A drawing of where the buildings sit cannot answer that.":
    "ต้องเป็นแผนผังกระบวนการผลิต ไม่ใช่ผังบริเวณโรงงาน Annex II A.5(13) ของ IR (EU) 2025/2547 กำหนดให้เป็นองค์ประกอบบังคับของแผนการติดตามตรวจวัด และกำหนดหน้าที่ของแผนผังไว้ชัดเจน คือแสดงขอบเขตของระบบของสถานประกอบการและกระบวนการผลิต พร้อมพิสูจน์ว่าไม่มีการนับซ้ำและไม่มีช่วงข้อมูลขาด ภาพที่แสดงเพียงตำแหน่งอาคารตอบเรื่องนี้ไม่ได้",
  "None (scrap-only route)":
    "ไม่มี (กระบวนการที่ใช้เศษโลหะล้วน)",
  "Set per instrument, not once for the plant. The EAF stack analyser is measurement-based and carries its own QAL2 certificate; the ladle-preheater gas meter and the standby generator's diesel are calculation-based — activity data × emission factor × oxidation factor. Annex II B.2 allows the two to be combined, one choice per source stream.":
    "กำหนดเป็นรายอุปกรณ์ ไม่ใช่กำหนดครั้งเดียวทั้งโรงงาน เครื่องวิเคราะห์ที่ปล่อง EAF ใช้วิธีวัดโดยตรงและมีใบรับรอง QAL2 ของตนเอง ส่วนมิเตอร์ก๊าซของเครื่องอุ่นกระทะน้ำโลหะและดีเซลของเครื่องกำเนิดไฟฟ้าสำรองใช้วิธีคำนวณ คือ ข้อมูลกิจกรรม × ค่าแฟกเตอร์การปล่อยก๊าซ × ค่าออกซิเดชัน Annex II B.2 อนุญาตให้ใช้ทั้งสองวิธีร่วมกันได้ โดยเลือกหนึ่งวิธีต่อหนึ่งกระแสแหล่งกำเนิด",
  "Natural gas (pipeline) for the ladle preheaters, and diesel for the standby generator and yard handling equipment. Both appear as fuel rows every month; the methodology lists them so a month with an unexpected third fuel is visible as an exception.":
    "ก๊าซธรรมชาติจากท่อสำหรับเครื่องอุ่นกระทะน้ำโลหะ และดีเซลสำหรับเครื่องกำเนิดไฟฟ้าสำรองและอุปกรณ์ขนย้ายในลานโรงงาน ทั้งสองปรากฏเป็นแถวเชื้อเพลิงทุกเดือน วิธีการระบุไว้เพื่อให้เดือนที่มีเชื้อเพลิงชนิดที่สามโผล่มาผิดคาดปรากฏเป็นข้อยกเว้นที่เห็นได้",
  "Grid — Provincial Electricity Authority (PEA)":
    "ระบบจำหน่าย — การไฟฟ้าส่วนภูมิภาค (PEA)",
  "Single 115 kV incoming feeder into substation SS-01, revenue meter PEA-88214, read monthly against the PEA invoice. Furnace load is sub-metered at E-101 but the reported figure is the incoming feeder, because that is the figure the invoice evidences.":
    "สายป้อนขาเข้า 115 kV เส้นเดียวเข้าสถานีย่อย SS-01 มิเตอร์คิดค่าไฟ PEA-88214 อ่านค่ารายเดือนเทียบกับใบแจ้งหนี้ของ PEA โหลดของเตามีมิเตอร์ย่อยที่ E-101 แต่ตัวเลขที่รายงานคือค่าจากสายป้อนขาเข้า เพราะเป็นตัวเลขที่ใบแจ้งหนี้ยืนยัน",
  "Endress+Hauser Promag 400 electromagnetic flow meter, tag FT-2201, DN80, ±0.5% of reading":
    "มิเตอร์วัดอัตราการไหลแบบแม่เหล็กไฟฟ้า Endress+Hauser Promag 400 รหัส FT-2201 ขนาด DN80 ความคลาดเคลื่อน ±0.5% ของค่าที่อ่าน",
  "Four eyes principle":
    "หลักการสี่ตา (Four eyes principle)",
  "Third-party verification":
    "การตรวจสอบโดยบุคคลที่สาม",
  "Internal audits":
    "การตรวจสอบภายใน",
  "Monthly, against the PEA invoice and the gas supplier's delivery note, before the month is submitted":
    "รายเดือน โดยเทียบกับใบแจ้งหนี้ของ PEA และใบส่งของของผู้จำหน่ายก๊าซ ก่อนส่งข้อมูลของเดือนนั้น",
  "Draw the line around what you are reporting. A verifier's first question is always what happens on this site that is NOT in these numbers, and why that is correct.":
    "ขีดเส้นรอบสิ่งที่คุณกำลังรายงาน คำถามแรกของผู้ตรวจสอบคือมีอะไรเกิดขึ้นในพื้นที่นี้ที่ไม่อยู่ในตัวเลขเหล่านี้ และเหตุใดจึงถูกต้อง",
  "The window every figure in this workspace belongs to. It is the calendar year, and it does not stretch to cover a change in how you produce.":
    "ช่วงเวลาที่ทุกตัวเลขในพื้นที่ทำงานนี้สังกัดอยู่ ซึ่งคือปีปฏิทิน และไม่สามารถยืดออกเพื่อคร่อมการเปลี่ยนวิธีผลิตได้",
  "What you measure and how you turn it into a CO₂ figure. Naming the fuels here makes an unexpected fuel next March visible as an exception.":
    "คุณวัดอะไร และแปลงเป็นตัวเลข CO₂ อย่างไร การระบุชนิดเชื้อเพลิงไว้ที่นี่ทำให้เชื้อเพลิงที่โผล่มาผิดคาดในเดือนมีนาคมปีหน้าปรากฏเป็นข้อยกเว้นที่เห็นได้",
  "For each thing you measure: the instrument, how often it is read, when it was last calibrated, and where its factor comes from. An uncalibrated instrument is the fastest route to a qualified opinion.":
    "สำหรับทุกสิ่งที่คุณวัด ให้ระบุอุปกรณ์ ความถี่ในการอ่านค่า วันที่สอบเทียบล่าสุด และที่มาของค่าแฟกเตอร์ อุปกรณ์ที่ไม่ได้สอบเทียบคือทางลัดที่เร็วที่สุดสู่ความเห็นแบบมีเงื่อนไข",
  "Where primary data was missing and how you filled it. A gap you declared and quantified is manageable; one a verifier finds is not.":
    "จุดที่ข้อมูลปฐมภูมิขาดหาย และคุณเติมอย่างไร ช่วงข้อมูลขาดที่คุณประกาศและระบุปริมาณไว้จัดการได้ แต่ช่วงที่ผู้ตรวจสอบมาพบเองจัดการไม่ได้",
  "What stops an error reaching the filing. Somebody's name, and how often they look.":
    "อะไรที่กันไม่ให้ข้อผิดพลาดหลุดไปถึงการยื่น ต้องมีชื่อผู้รับผิดชอบ และความถี่ในการตรวจ",
  "One drawing that lets a verifier check the boundary you described against the plant that exists. A required element of the monitoring plan — Annex II A.5(13) of IR (EU) 2025/2547 — not an optional extra.":
    "แผนผังหนึ่งภาพที่ทำให้ผู้ตรวจสอบเทียบขอบเขตที่คุณอธิบายกับโรงงานจริงได้ เป็นองค์ประกอบบังคับของแผนการติดตามตรวจวัดตาม Annex II A.5(13) ของ IR (EU) 2025/2547 ไม่ใช่ส่วนเสริมที่เลือกได้",
  "No processes are marked as included. A boundary with nothing inside it cannot be verified.":
    "ยังไม่ได้ระบุกระบวนการใดว่าอยู่ในขอบเขต ขอบเขตที่ไม่มีอะไรอยู่ภายในย่อมตรวจสอบไม่ได้",
  "Reporting period is incomplete.":
    "รอบรายงานยังไม่ครบถ้วน",
  "Reporting period ends before it starts.":
    "วันสิ้นสุดรอบรายงานอยู่ก่อนวันเริ่มต้น",
  "No fuel is listed. Choose every fuel burned inside the boundary across the year — at least one, and anything unlisted goes in under Other fuel.":
    "ยังไม่ได้ระบุเชื้อเพลิงใด เลือกเชื้อเพลิงทุกชนิดที่เผาไหม้ภายในขอบเขตตลอดทั้งปี อย่างน้อยหนึ่งชนิด และชนิดที่ไม่มีในรายการให้กรอกในหัวข้อเชื้อเพลิงอื่น",
  "Electricity source is not set. The category decides which emission factor is admissible, so it cannot be left open.":
    "ยังไม่ได้กำหนดแหล่งจ่ายไฟฟ้า ประเภทของแหล่งจ่ายเป็นตัวกำหนดว่าใช้ค่าแฟกเตอร์ใดได้ จึงเว้นว่างไม่ได้",
  "Electricity source is set to Other with no description.":
    "เลือกแหล่งจ่ายไฟฟ้าเป็น อื่น ๆ แต่ยังไม่ได้อธิบาย",
  "No electricity metering point named. A verifier reconciles the reported MWh against one specific meter.":
    "ยังไม่ได้ระบุจุดวัดไฟฟ้า ผู้ตรวจสอบจะกระทบยอดค่า MWh ที่รายงานกับมิเตอร์ตัวใดตัวหนึ่งโดยเฉพาะ",
  "A quality-assurance method is claimed with no reviewer named. A verifier will ask who.":
    "ระบุวิธีประกันคุณภาพไว้แต่ไม่ได้ระบุชื่อผู้ตรวจทาน ผู้ตรวจสอบจะถามว่าใคร",
  "Fuels are declared but no instrument measures them. Add one row per fuel — what is measured, on what, how often, and when it was last calibrated.":
    "ระบุเชื้อเพลิงไว้แล้วแต่ยังไม่มีอุปกรณ์ที่ใช้วัด เพิ่มหนึ่งแถวต่อหนึ่งเชื้อเพลิง ระบุสิ่งที่วัด อุปกรณ์ที่ใช้ ความถี่ในการอ่านค่า และวันที่สอบเทียบล่าสุด",
  "This MMD is a DRAFT. It does not satisfy the readiness gate, and a verifier engaged against a draft methodology will ask for the final one before starting. Finalise it when the methodology is settled — editing afterwards forks a new version rather than changing this one.":
    "MMD ฉบับนี้เป็นแบบร่าง ยังไม่ผ่านเงื่อนไขความพร้อม และผู้ตรวจสอบที่ได้รับมอบหมายโดยอ้างอิงวิธีการฉบับร่างจะขอฉบับสมบูรณ์ก่อนเริ่มงาน ให้ปิดฉบับเมื่อวิธีการนิ่งแล้ว การแก้ไขหลังจากนั้นจะแตกเป็นเวอร์ชันใหม่ ไม่ใช่การเปลี่ยนฉบับนี้",
  "Production & Process Records":
    "บันทึกการผลิตและกระบวนการ",
  "Financial & Procurement Records":
    "บันทึกทางการเงินและการจัดซื้อ",
  "Supplier-Submitted Documentation":
    "เอกสารที่ซัพพลายเออร์ส่งมา",
  "Laboratory Analysis & Third-Party Verification":
    "ผลวิเคราะห์จากห้องปฏิบัติการและการตรวจสอบโดยบุคคลที่สาม",
  "Organisational & Compliance Documentation":
    "เอกสารระดับองค์กรและการปฏิบัติตามกฎ",
  "An external fuel-testing company":
    "บริษัทภายนอกที่ทดสอบเชื้อเพลิง",
  "HR or management, once per company — not once per month":
    "ฝ่ายบุคคลหรือฝ่ายบริหาร ทำครั้งเดียวต่อบริษัท ไม่ใช่ทุกเดือน",
  "Emission factor for electricity consumed":
    "ค่าแฟกเตอร์การปล่อยก๊าซของไฟฟ้าที่ใช้",
  "Verification report for purchased precursor emissions data":
    "รายงานการตรวจสอบข้อมูลการปล่อยก๊าซของวัตถุดิบตั้งต้นที่จัดซื้อ",
  "Mill test certificate":
    "ใบรับรองผลการทดสอบจากโรงงาน (Mill test certificate)",
  "Contract or PPA — the electricity purchase agreement":
    "สัญญาหรือ PPA — สัญญาซื้อขายไฟฟ้า",
  "Laboratory analysis reports for calculation factors":
    "รายงานผลวิเคราะห์จากห้องปฏิบัติการสำหรับค่าที่ใช้คำนวณ",
  "Justification for using default values":
    "เหตุผลประกอบการใช้ค่า default",
  "Evidence of the carbon price due or paid in the country of origin":
    "หลักฐานราคาคาร์บอนที่ถึงกำหนดชำระหรือชำระแล้วในประเทศต้นทาง",
  "7 · Data gaps and estimation methods":
    "7 · ช่วงข้อมูลขาดและวิธีประมาณค่า",
  "8 · Information on quality assurance":
    "8 · ข้อมูลการประกันคุณภาพ",
  "9 · Assumptions register":
    "9 · ทะเบียนข้อสมมติ",
  "10 · Installation diagram":
    "10 · แผนผังสถานประกอบการ",
  "Who produced the goods, and where. Pulled from the installation profile.":
    "ใครเป็นผู้ผลิตสินค้า และผลิตที่ใด ดึงมาจากข้อมูลสถานประกอบการ",
  "Which production steps are inside the boundary and which are explicitly outside. The boundary is the process, not the site.":
    "ขั้นตอนการผลิตใดอยู่ในขอบเขต และขั้นตอนใดระบุไว้ชัดเจนว่าอยู่นอกขอบเขต ขอบเขตคือกระบวนการ ไม่ใช่พื้นที่โรงงาน",
  "The window every figure in the dossier belongs to.":
    "ช่วงเวลาที่ทุกตัวเลขในแฟ้มเอกสารสังกัดอยู่",
  "Everything monitored, derived from what you entered as activity data.":
    "ทุกสิ่งที่ติดตามตรวจวัด คำนวณจากข้อมูลกิจกรรมที่คุณกรอกไว้",
  "How each parameter is measured — the instrument, how often, and when it was last calibrated.":
    "แต่ละพารามิเตอร์วัดอย่างไร ทั้งอุปกรณ์ ความถี่ และวันที่สอบเทียบล่าสุด",
  "Every emission factor and calorific value, with the source behind it.":
    "ค่าแฟกเตอร์การปล่อยก๊าซและค่าความร้อนทุกค่า พร้อมแหล่งที่มา",
  "Where primary data was missing, how it was estimated, and why the estimate cannot flatter you.":
    "จุดที่ข้อมูลปฐมภูมิขาดหาย ประมาณค่าอย่างไร และเหตุใดค่าประมาณการจึงไม่เข้าข้างคุณ",
  "What stops an error reaching the filing.":
    "อะไรที่กันไม่ให้ข้อผิดพลาดหลุดไปถึงการยื่น",
  "Every input declared as an assumption. A verifier reads this list first and tests it hardest.":
    "ข้อมูลทุกรายการที่ประกาศไว้เป็นข้อสมมติ ผู้ตรวจสอบจะอ่านรายการนี้ก่อนและตรวจหนักที่สุด",
  "A process flow showing the boundary. Almost always the fastest way to answer the completeness question.":
    "แผนผังกระบวนการที่แสดงขอบเขต เกือบทุกครั้งเป็นวิธีที่เร็วที่สุดในการตอบคำถามด้านความครบถ้วน",
  "MWh (period total)":
    "MWh (รวมทั้งรอบ)",
  "Utility metering":
    "การวัดจากมิเตอร์ของการไฟฟ้า",
  "Process material":
    "วัสดุในกระบวนการ",
  "Installation name is missing.":
    "ยังไม่ได้ระบุชื่อสถานประกอบการ",
  "Geographic coordinates are missing — CBAM identifies the installation by them.":
    "ยังไม่ได้ระบุพิกัดภูมิศาสตร์ ซึ่ง CBAM ใช้ระบุตัวสถานประกอบการ",
  "The boundary has no description.":
    "ยังไม่มีคำอธิบายขอบเขต",
  "No parameters are monitored — enter activity data first.":
    "ยังไม่มีพารามิเตอร์ที่ติดตามตรวจวัด กรุณากรอกข้อมูลกิจกรรมก่อน",
  "No quality assurance is claimed. A verifier will ask what stops an error reaching the filing.":
    "ยังไม่ได้ระบุการประกันคุณภาพ ผู้ตรวจสอบจะถามว่าอะไรกันไม่ให้ข้อผิดพลาดหลุดไปถึงการยื่น",
  "No installation diagram attached.":
    "ยังไม่ได้แนบแผนผังสถานประกอบการ",
  "No diagram attached.":
    "ยังไม่ได้แนบแผนผัง",
  "No final MMD exists for this period. A verifier cannot start without an approved monitoring methodology.":
    "ยังไม่มี MMD ฉบับสมบูรณ์สำหรับรอบนี้ ผู้ตรวจสอบเริ่มงานไม่ได้หากไม่มีวิธีการติดตามตรวจวัดที่อนุมัติแล้ว",
  "Finalise the MMD":
    "ปิดฉบับ MMD",
  "Write and finalise the MMD":
    "จัดทำและปิดฉบับ MMD",
  "No EU standard value is on file for this fuel — pick a Type II source and enter it from a document.":
    "ยังไม่มีค่ามาตรฐานของสหภาพยุโรปสำหรับเชื้อเพลิงนี้ ให้เลือกแหล่งข้อมูลประเภท Type II แล้วกรอกค่าจากเอกสาร",
  "Drawn from the public grid. Factor is the published country default — locked, never typed.":
    "รับไฟจากระบบจำหน่ายสาธารณะ ค่าแฟกเตอร์คือค่า default ระดับประเทศที่ประกาศไว้ ล็อกไว้และไม่ต้องกรอกเอง",
  "Bought under a power purchase agreement. Factor is the contracted generator's own, evidenced by the agreement.":
    "ซื้อภายใต้สัญญาซื้อขายไฟฟ้า ค่าแฟกเตอร์คือค่าของผู้ผลิตไฟฟ้าตามสัญญา โดยมีสัญญาเป็นหลักฐาน",
  "Generated on site. Factor is derived from the fuels burned to generate it — see the fuel rows above, flagged for self-generation.":
    "ผลิตเองในพื้นที่ ค่าแฟกเตอร์คำนวณจากเชื้อเพลิงที่ใช้ผลิต ดูแถวเชื้อเพลิงด้านบนที่ทำเครื่องหมายว่าใช้ผลิตไฟฟ้าเอง",
  "A dedicated line from a specific generating installation, outside the public grid. Factor is that generator's own.":
    "สายส่งเฉพาะจากโรงไฟฟ้าแห่งหนึ่งโดยตรง อยู่นอกระบบจำหน่ายสาธารณะ ค่าแฟกเตอร์คือค่าของโรงไฟฟ้านั้น",
  "Self-generated share must be between 0 and 100%.":
    "สัดส่วนไฟฟ้าที่ผลิตเองต้องอยู่ระหว่าง 0 ถึง 100%",
  "Default value":
    "ค่า default",
  "Supplier — verified":
    "ซัพพลายเออร์ — ผ่านการตรวจสอบ",
  "Supplier — unverified":
    "ซัพพลายเออร์ — ยังไม่ผ่านการตรวจสอบ",
  "The supplier's own figure, with an accredited verification statement behind it.":
    "ตัวเลขของซัพพลายเออร์เอง โดยมีหนังสือรับรองการตรวจสอบจากผู้ได้รับการรับรองรองรับ",
  "The supplier gave a figure but no verification statement. Usable, and a verifier will test it.":
    "ซัพพลายเออร์ให้ตัวเลขมาแต่ไม่มีหนังสือรับรองการตรวจสอบ ใช้ได้ และผู้ตรวจสอบจะทดสอบตัวเลขนี้",
  "No supplier figure — a published default was used. Carries a markup, and is capped for complex goods.":
    "ไม่มีตัวเลขจากซัพพลายเออร์ จึงใช้ค่า default ที่ประกาศไว้ ซึ่งมีส่วนเพิ่มและมีเพดานสำหรับสินค้าเชิงซ้อน",
  "Purchased from another installation":
    "จัดซื้อจากสถานประกอบการอื่น",
  "Produced here, in a different production process":
    "ผลิตที่นี่ ในกระบวนการผลิตอื่น",
  "No verification report is attached.":
    "ยังไม่ได้แนบรายงานการตรวจสอบ",
  "The verifier's accreditation expiry date and the report's issue date are not both recorded.":
    "ยังบันทึกไม่ครบทั้งวันหมดอายุการรับรองระบบงานของผู้ตรวจสอบและวันที่ออกรายงาน",
  "The verifier's sectoral scope is not recorded.":
    "ยังไม่ได้บันทึกขอบข่ายรายสาขาของผู้ตรวจสอบ",
  "The producing installation's reporting period is not recorded, so the report's coverage cannot be checked.":
    "ยังไม่ได้บันทึกรอบรายงานของสถานประกอบการผู้ผลิต จึงตรวจสอบความครอบคลุมของรายงานไม่ได้",
  "unnamed supplier":
    "ซัพพลายเออร์ที่ยังไม่ได้ตั้งชื่อ",
  "Company name is required.":
    "ต้องระบุชื่อบริษัท",
  "What this precursor is — a name or a CN code — is required.":
    "ต้องระบุว่าวัตถุดิบตั้งต้นนี้คืออะไร โดยระบุชื่อหรือ CN code",
  "Production route is required.":
    "ต้องระบุกระบวนการผลิต",
  "Which of your own production processes made this is required.":
    "ต้องระบุว่ากระบวนการผลิตใดของคุณเป็นผู้ผลิตรายการนี้",
  "The producing installation's name is required.":
    "ต้องระบุชื่อสถานประกอบการผู้ผลิต",
  "Country of origin is required.":
    "ต้องระบุประเทศต้นทาง",
  "Specific embedded emissions — direct and indirect — are required.":
    "ต้องระบุค่าการปล่อยก๊าซที่ฝังอยู่เฉพาะหน่วย ทั้งทางตรงและทางอ้อม",
  "The producing installation's reporting period is required.":
    "ต้องระบุรอบรายงานของสถานประกอบการผู้ผลิต",
  "A quantity — monthly tonnage or a per-tonne ratio — is required.":
    "ต้องระบุปริมาณ ไม่ว่าจะเป็นจำนวนตันรายเดือนหรืออัตราส่วนต่อตัน",
  "The installation reference is required.":
    "ต้องระบุรหัสอ้างอิงสถานประกอบการ",
  "UN/LOCODE is required.":
    "ต้องระบุ UN/LOCODE",
  "The installation's full address is required.":
    "ต้องระบุที่อยู่เต็มของสถานประกอบการ",
  "The installation's latitude and longitude are required.":
    "ต้องระบุละติจูดและลองจิจูดของสถานประกอบการ",
  "The verification report (PDF) is required.":
    "ต้องแนบรายงานการตรวจสอบ (PDF)",
  "Verifier name is required.":
    "ต้องระบุชื่อผู้ตรวจสอบ",
  "Verifier accreditation number is required.":
    "ต้องระบุหมายเลขการรับรองระบบงานของผู้ตรวจสอบ",
  "Accreditation issuing country is required.":
    "ต้องระบุประเทศที่ออกการรับรองระบบงาน",
  "Accreditation expiry date is required.":
    "ต้องระบุวันหมดอายุการรับรองระบบงาน",
  "Report issue date is required.":
    "ต้องระบุวันที่ออกรายงาน",
  "Sectoral scope is required.":
    "ต้องระบุขอบข่ายรายสาขา",
  "Verified data":
    "ข้อมูลที่ผ่านการตรวจสอบ",
  "One month of production, fuel and electricity readings from the installation that made the goods.":
    "ค่าการผลิต เชื้อเพลิง และไฟฟ้าของหนึ่งเดือน จากสถานประกอบการที่ผลิตสินค้า",
  "One precursor supplier's emissions figure for the whole year, and the verification report behind it.":
    "ตัวเลขการปล่อยก๊าซทั้งปีของซัพพลายเออร์วัตถุดิบตั้งต้นหนึ่งราย พร้อมรายงานการตรวจสอบที่รองรับ",
  "Sent, past its deadline, still unanswered. Chase whoever it went to.":
    "ส่งไปแล้ว เลยกำหนด และยังไม่ได้รับคำตอบ ให้ติดตามผู้รับ",
  "Answered. Nothing outstanding.":
    "ตอบกลับแล้ว ไม่มีรายการค้าง",
  "Not sent, and not answerable yet — the month it covers is still running.":
    "ยังไม่ได้ส่ง และยังตอบไม่ได้ เพราะเดือนที่ครอบคลุมยังไม่สิ้นสุด",
  "Required figure missing or unusable":
    "ตัวเลขที่จำเป็นขาดหายหรือใช้ไม่ได้",
  "Worth checking":
    "ควรตรวจสอบ",
  "Production is well below the rest of the year":
    "ผลผลิตต่ำกว่าช่วงอื่นของปีอย่างมาก",
  "Cannot start or end with a hyphen.":
    "ขึ้นต้นหรือลงท้ายด้วยขีดกลางไม่ได้",
  "Use single hyphens.":
    "ใช้ขีดกลางเดี่ยวเท่านั้น",
  "Country code, then a hyphen, then letters and numbers — “TH-RAYONG-01”.":
    "รหัสประเทศ ตามด้วยขีดกลาง แล้วจึงเป็นตัวอักษรและตัวเลข เช่น “TH-RAYONG-01”",
  "Substitute meter or parallel reading":
    "มิเตอร์สำรองหรือค่าที่อ่านคู่ขนาน",
  "Prior-period average":
    "ค่าเฉลี่ยของรอบก่อนหน้า",
  "Scaled from production volume":
    "ปรับตามปริมาณการผลิต",
  "Reconstructed from supplier invoices":
    "สร้างขึ้นใหม่จากใบแจ้งหนี้ของผู้จำหน่าย",
  "Conservative default value":
    "ค่า default แบบระมัดระวัง",
  "Engineering estimate":
    "การประมาณเชิงวิศวกรรม",
  "Strongest option — another measurement of the same flow. Say which meter and how it was reconciled.":
    "ตัวเลือกที่หนักแน่นที่สุด คือค่าที่วัดจากการไหลเดียวกันอีกชุด ให้ระบุว่าใช้มิเตอร์ตัวใดและกระทบยอดอย่างไร",
  "Accepted where the process was unchanged. A verifier will ask what proves it was unchanged.":
    "ยอมรับได้หากกระบวนการไม่เปลี่ยนแปลง ผู้ตรวจสอบจะถามว่ามีอะไรพิสูจน์ว่าไม่เปลี่ยน",
  "Defensible when consumption tracks output closely. Show the ratio you used and the period it came from.":
    "ป้องกันได้เมื่อปริมาณการใช้แปรผันตามผลผลิตอย่างใกล้ชิด ให้แสดงอัตราส่วนที่ใช้และช่วงเวลาที่นำมาคำนวณ",
  "Good evidence, but invoices cover delivery dates rather than consumption — explain the timing adjustment.":
    "เป็นหลักฐานที่ดี แต่ใบแจ้งหนี้อ้างอิงวันที่ส่งมอบ ไม่ใช่วันที่ใช้จริง กรุณาอธิบายการปรับช่วงเวลา",
  "Deliberately unflattering by design, which is why it is safe. Expect no challenge, but it costs you.":
    "ออกแบบมาให้ไม่เข้าข้างตนเองโดยเจตนา จึงปลอดภัย มักไม่ถูกโต้แย้ง แต่ทำให้ต้นทุนของคุณสูงขึ้น",
  "Weakest option. Only defensible with the calculation written out and a stated conservative bias.":
    "ตัวเลือกที่อ่อนที่สุด ป้องกันได้เฉพาะเมื่อเขียนวิธีคำนวณไว้ครบและระบุความเอนเอียงเชิงระมัดระวังไว้ชัดเจน",
  "Calculation-based":
    "อิงการคำนวณ",
  "Measurement-based":
    "อิงการวัดโดยตรง",
  "Emissions derived from activity data × emission factor. The route almost every CBAM installation uses.":
    "คำนวณการปล่อยก๊าซจาก ข้อมูลกิจกรรม × ค่าแฟกเตอร์การปล่อยก๊าซ เป็นวิธีที่สถานประกอบการ CBAM เกือบทุกแห่งใช้",
  "Emissions read directly from a continuous emissions monitoring system. Requires the CEMS' own calibration record.":
    "อ่านค่าการปล่อยก๊าซโดยตรงจากระบบตรวจวัดแบบต่อเนื่อง ต้องมีบันทึกการสอบเทียบของระบบ CEMS เอง",
  "Installation identity — name, address and operator":
    "หลักฐานยืนยันตัวตนของสถานประกอบการ — ชื่อ ที่อยู่ และผู้ดำเนินการ",
  "Calibration certificate for measuring instruments":
    "ใบรับรองการสอบเทียบของอุปกรณ์วัด",
  "Installation diagram — process flow with measurement points marked":
    "แผนผังสถานประกอบการ — ผังกระบวนการพร้อมทำเครื่องหมายจุดวัด",
  "Internal QA record — the review log before data is submitted":
    "บันทึกการประกันคุณภาพภายใน — บันทึกการตรวจทานก่อนส่งข้อมูล",
  "Boundary description is empty. Describe the PRODUCTION PROCESS boundary — not the site fence — and say what is excluded.":
    "ยังไม่ได้กรอกคำอธิบายขอบเขต ให้อธิบายขอบเขตของกระบวนการผลิต ไม่ใช่รั้วโรงงาน และระบุสิ่งที่ยกเว้น",

  /* ── Two stragglers ─────────────────────────────── */
  "No installation diagram attached. Annex II A.5(13) makes it a required element of the monitoring plan: it has to show the system boundaries and evidence that nothing is double counted or missing.":
    "ยังไม่ได้แนบแผนผังสถานประกอบการ Annex II A.5(13) กำหนดให้เป็นองค์ประกอบบังคับของแผนการติดตามตรวจวัด โดยแผนผังต้องแสดงขอบเขตของระบบ และพิสูจน์ว่าไม่มีการนับซ้ำและไม่มีสิ่งใดตกหล่น",
  "No quality assurance":
    "ไม่มีการประกันคุณภาพ",
  "None":
    "ไม่มี",

  /* ── Estate list — who supplies each workspace ─────────────────────────────── */
  "Our own site":
    "สถานที่ของเราเอง",
  "Unassigned supplier":
    "ยังไม่ได้ระบุซัพพลายเออร์",
  "Unassigned":
    "ยังไม่ได้ระบุ",

  /* ── What the report will contain — the document's own table of contents ─────────────────────────────── */
  "Ready":
    "พร้อม",
  "In progress":
    "กำลังดำเนินการ",
  "Concern":
    "ต้องระวัง",
  "Not started":
    "ยังไม่เริ่ม",
  "The installation record itself":
    "ตัวบันทึกข้อมูลสถานประกอบการ",
  "Installation details":
    "รายละเอียดสถานประกอบการ",
  "No installation record is attached to this workspace.":
    "ยังไม่มีบันทึกข้อมูลสถานประกอบการผูกกับพื้นที่ทำงานนี้",
  "All fourteen template fields are answered.":
    "กรอกครบทั้งสิบสี่ช่องของแบบฟอร์มแล้ว",
  "Verifier of the report":
    "ผู้ตรวจสอบรายงาน",
  "No verifier has been engaged yet. The block prints empty, which is what a pre-verification report looks like.":
    "ยังไม่ได้ว่าจ้างผู้ตรวจสอบ ส่วนนี้จะพิมพ์ออกมาเป็นช่องว่าง ซึ่งเป็นลักษณะของรายงานก่อนการตรวจสอบตามปกติ",
  "Carbon price instrument":
    "มาตรการราคาคาร์บอน",
  "Nothing claimed. Zero is a complete answer — record it rather than leaving it blank.":
    "ไม่ได้ขอหักลดใด ค่าศูนย์เป็นคำตอบที่ครบถ้วน ให้บันทึกไว้แทนการเว้นว่าง",
  "Production process — none declared":
    "กระบวนการผลิต — ยังไม่ได้ประกาศ",
  "The methodology names no production process, so this table prints one empty row.":
    "วิธีการยังไม่ได้ระบุกระบวนการผลิตใด ตารางนี้จึงพิมพ์ออกมาเป็นแถวว่างหนึ่งแถว",
  "Declared in the draft methodology. It prints, but under a version nobody has stamped.":
    "ประกาศไว้ในวิธีการฉบับร่าง จะพิมพ์ออกมาได้ แต่อยู่ภายใต้เวอร์ชันที่ยังไม่มีใครประทับรับรอง",
  "Production processes and routes":
    "กระบวนการและเส้นทางการผลิต",
  "Aggregated goods category and production route":
    "หมวดหมู่สินค้ารวมและกระบวนการผลิต",
  "The route or the category is not set, so the route columns print empty.":
    "ยังไม่ได้กำหนดกระบวนการผลิตหรือหมวดหมู่ คอลัมน์กระบวนการผลิตจึงพิมพ์ออกมาเป็นช่องว่าง",
  "Emissions and data quality":
    "การปล่อยก๊าซและคุณภาพข้อมูล",
  "Fuel balance":
    "ดุลเชื้อเพลิง",
  "No month has been submitted, so there is nothing to balance.":
    "ยังไม่มีเดือนใดที่ส่งข้อมูล จึงไม่มีอะไรให้คำนวณดุล",
  "GHG balance by type of GHG":
    "ดุลก๊าซเรือนกระจก แยกตามชนิดของก๊าซ",
  "Nothing is computable yet — there is no denominator to divide by.":
    "ยังคำนวณอะไรไม่ได้ เพราะไม่มีตัวส่วนให้หาร",
  "All twelve months are in. The balance prints complete.":
    "ข้อมูลครบทั้งสิบสองเดือนแล้ว ดุลจะพิมพ์ออกมาครบถ้วน",
  "GHG balance by type of monitoring methodology":
    "ดุลก๊าซเรือนกระจก แยกตามวิธีการติดตามตรวจวัด",
  "No measurement instruments are declared, so this table cannot attribute anything to a method.":
    "ยังไม่ได้ประกาศอุปกรณ์วัดใด ตารางนี้จึงไม่สามารถระบุว่าค่าใดมาจากวิธีใด",
  "Data quality and quality assurance":
    "คุณภาพข้อมูลและการประกันคุณภาพ",
  "The quality-assurance answers and the data-gap register will print.":
    "คำตอบด้านการประกันคุณภาพและทะเบียนช่วงข้อมูลขาดจะพิมพ์ออกมา",
  "The methodology's quality-assurance block is empty, so this section prints with nothing in it.":
    "ส่วนการประกันคุณภาพของวิธีการยังว่างอยู่ หัวข้อนี้จึงพิมพ์ออกมาโดยไม่มีเนื้อหา",
  "Products and appendix":
    "สินค้าและภาคผนวก",
  "Per-product summary":
    "สรุปรายสินค้า",
  "The specific embedded emissions are not computable yet.":
    "ยังคำนวณค่าการปล่อยก๊าซที่ฝังอยู่เฉพาะหน่วยไม่ได้",
  "A month cannot be computed, so the per-tonne figure would be wrong rather than incomplete.":
    "มีเดือนที่คำนวณไม่ได้ ค่าต่อตันจึงจะผิด ไม่ใช่เพียงไม่ครบ",
  "Carbon price and rebate detail":
    "รายละเอียดราคาคาร์บอนและส่วนลด",
  "Claim, share and receipt are all on file.":
    "มีทั้งการขอหักลด สัดส่วน และใบเสร็จครบในระบบแล้ว",
  "A deduction is claimed with something still missing behind it.":
    "มีการขอหักลดโดยยังขาดหลักฐานรองรับบางส่วน",
  "Nothing claimed, so this section prints a nil return — which is a complete answer.":
    "ไม่ได้ขอหักลดใด หัวข้อนี้จึงพิมพ์ออกมาเป็นการรายงานค่าศูนย์ ซึ่งเป็นคำตอบที่ครบถ้วน",
  "Supporting documents appendix":
    "ภาคผนวกเอกสารประกอบ",
  "Nothing is attached, so the report goes out with no appendix behind its figures.":
    "ยังไม่ได้แนบเอกสารใด รายงานจะส่งออกไปโดยไม่มีภาคผนวกรองรับตัวเลข",
  "{percent}% of applicable tabs are complete. This percentage is descriptive — it is never used as a gate.":
    "แท็บที่เกี่ยวข้องเสร็จสมบูรณ์แล้ว {percent}% ตัวเลขนี้เป็นข้อมูลเชิงพรรณนา ไม่เคยถูกใช้เป็นเงื่อนไขกั้น",
  "Within the self-check threshold.":
    "อยู่ภายในเกณฑ์การตรวจสอบด้วยตนเอง",
  "Building the PDF…":
    "กำลังสร้างไฟล์ PDF…",
  "Download Monitoring Methodology Documentation":
    "ดาวน์โหลดเอกสารวิธีการติดตามตรวจวัด (MMD)",
  "Available once the monitoring methodology is finalised.":
    "ดาวน์โหลดได้เมื่อปิดฉบับวิธีการติดตามตรวจวัดแล้ว",
  "Amount per tCO₂e ({currency})":
    "จำนวนเงินต่อ tCO₂e ({currency})",
  "Part {number}":
    "ส่วนที่ {number}",

  /* ── Monthly data — the schedule line and the MMD-by-month table ─────────────────────────────── */
  "{day} of the month after it":
    "วันที่ {day} ของเดือนถัดไป",
  "{day} of the following month":
    "วันที่ {day} ของเดือนถัดไป",
  "It lands in your own inbox.":
    "ข้อมูลจะเข้ากล่องงานของคุณเอง",
  "It goes to {installation}.":
    "ส่งไปยัง {installation}",
  "No annual paperwork attached yet — the licence, calibration records and any carbon-price receipt live on the Readiness tab, outside the twelve months.":
    "ยังไม่ได้แนบเอกสารรายปี ทั้งใบอนุญาต บันทึกการสอบเทียบ และใบเสร็จค่าคาร์บอน อยู่ในแท็บความพร้อม ซึ่งอยู่นอกสิบสองเดือน",
  "Version in force":
    "เวอร์ชันที่มีผลบังคับใช้",
  "Boundary":
    "ขอบเขต",
  "Processes":
    "กระบวนการ",
  "Fuels declared":
    "เชื้อเพลิงที่ประกาศไว้",
  "Outstanding":
    "ค้างอยู่",

  /* ── Smart Links — the five states and who a link goes to ─────────────────────────────── */
  "In process":
    "กำลังดำเนินการอยู่",
  "Late":
    "ล่าช้า",
  "Not due yet":
    "ยังไม่ถึงกำหนด",
  "Nobody has been asked yet, and it can be answered now. You owe the send.":
    "ยังไม่ได้ขอจากใคร และตอบได้แล้วในตอนนี้ ฝ่ายที่ต้องส่งคือคุณ",
  "Sent and waiting, still inside the deadline. Nothing to do yet.":
    "ส่งไปแล้วและกำลังรอ ยังอยู่ในกำหนด ยังไม่ต้องทำอะไร",
  "Your own site":
    "สถานที่ของคุณเอง",

  /* ── Supplier directory counts ─────────────────────────────── */
  "1 supplier has no installation recorded.":
    "มีซัพพลายเออร์ 1 รายที่ยังไม่ได้บันทึกสถานประกอบการ",
  "{count} suppliers have no installation recorded.":
    "มีซัพพลายเออร์ {count} รายที่ยังไม่ได้บันทึกสถานประกอบการ",

  /* ── Team roles ─────────────────────────────── */
  "Everything a member can do, plus billing, seats and deleting workspaces. There is always exactly one.":
    "ทำได้ทุกอย่างเหมือนสมาชิก และเพิ่มการเรียกเก็บเงิน สิทธิ์ใช้งาน และการลบพื้นที่ทำงาน มีได้เพียงหนึ่งคนเสมอ",
  "Build and manage workspaces, fill months in, chase suppliers.":
    "สร้างและจัดการพื้นที่ทำงาน กรอกข้อมูลรายเดือน และติดตามซัพพลายเออร์",
  "Review and sign off packages before they leave.":
    "ตรวจทานและลงนามรับรองชุดเอกสารก่อนส่งออกไป",
  "Build and manage workspaces.":
    "สร้างและจัดการพื้นที่ทำงาน",

  /* ── The workspace shell's back links ─────────────────────────────── */
  "All months":
    "ทุกเดือน",
  "{supplier} — supply chain":
    "{supplier} — ห่วงโซ่อุปทาน",
  "Upload diagram":
    "อัปโหลดแผนผัง",
  "Replace diagram":
    "เปลี่ยนแผนผัง",

  /* ── Readiness tab names, states and the supplier portal's own tabs ─────────────────────────────── */
  "Materiality":
    "สาระสำคัญ",
  "Complete":
    "สมบูรณ์",
  "Incomplete":
    "ไม่ครบ",
  "Not applicable":
    "ไม่เกี่ยวข้อง",
  "Pending":
    "รอดำเนินการ",
  "The MMD is still a draft. A draft methodology does not satisfy the readiness gate — finalise it to stamp the version a verifier will work from.":
    "MMD ยังเป็นฉบับร่าง วิธีการฉบับร่างไม่ผ่านเงื่อนไขความพร้อม ให้ปิดฉบับเพื่อประทับเวอร์ชันที่ผู้ตรวจสอบจะใช้ทำงาน",
  "Fix the precursor chain":
    "แก้ไขห่วงโซ่วัตถุดิบตั้งต้น",
  "No precursor suppliers recorded for a complex good":
    "ยังไม่ได้บันทึกซัพพลายเออร์วัตถุดิบตั้งต้นสำหรับสินค้าเชิงซ้อน",
  "No months submitted yet — there is nothing to evidence":
    "ยังไม่มีเดือนที่ส่งข้อมูล จึงยังไม่มีอะไรให้แสดงหลักฐาน",
  "Attach the carbon price payment receipt":
    "แนบใบเสร็จการชำระราคาคาร์บอน",
  "Carbon price not recorded":
    "ยังไม่ได้บันทึกราคาคาร์บอน",
  "Nothing recorded yet to assess materiality against":
    "ยังไม่มีข้อมูลให้ประเมินสาระสำคัญ",
  "Reduce the estimated share in the MMD's data-gap register":
    "ลดสัดส่วนที่ประมาณการในทะเบียนช่วงข้อมูลขาดของ MMD",
  "Quality check":
    "ตรวจสอบคุณภาพ",

  /* ── What the report will contain — the interpolated detail lines ─────────────────────────────── */
  "{from} to {to}. Fixed at creation and printed as it stands.":
    "{from} ถึง {to} กำหนดตายตัวตั้งแต่สร้าง และพิมพ์ออกมาตามนั้น",
  "1 template field still blank — {first}":
    "ยังเว้นว่างอีก 1 ช่องของแบบฟอร์ม — {first}",
  "{count} template fields still blank — {first}":
    "ยังเว้นว่างอีก {count} ช่องของแบบฟอร์ม — {first}",
  "{amount} {currency} per tCO₂e claimed.":
    "ขอหักลด {amount} {currency} ต่อ tCO₂e",
  "Production process {n} — {process}":
    "กระบวนการผลิตที่ {n} — {process}",
  "Declared and covered by MMD v{version}.":
    "ประกาศไว้และครอบคลุมโดย MMD เวอร์ชัน {version}",
  "{route} is not a production route for {category}. The table will print a contradiction.":
    "{route} ไม่ใช่กระบวนการผลิตของ {category} ตารางจะพิมพ์ข้อมูลที่ขัดแย้งกันเอง",
  "1 row the arithmetic refused — the balance would print short by it.":
    "มี 1 แถวที่คำนวณไม่ได้ ดุลที่พิมพ์ออกมาจะขาดไปเท่านั้น",
  "{count} rows the arithmetic refused — the balance would print short by them.":
    "มี {count} แถวที่คำนวณไม่ได้ ดุลที่พิมพ์ออกมาจะขาดไปเท่านั้น",
  "{covered} of {total} submitted months carry fuel rows.":
    "มีแถวเชื้อเพลิงใน {covered} จาก {total} เดือนที่ส่งข้อมูลแล้ว",
  "1 month missing — the table prints incomplete, not smaller.":
    "ขาดไป 1 เดือน ตารางจะพิมพ์ออกมาไม่ครบ ไม่ใช่ค่าน้อยลง",
  "{count} months missing — the table prints incomplete, not smaller.":
    "ขาดไป {count} เดือน ตารางจะพิมพ์ออกมาไม่ครบ ไม่ใช่ค่าน้อยลง",
  "{count} instruments declared under MMD v{version}.":
    "ประกาศอุปกรณ์วัดไว้ {count} รายการ ภายใต้ MMD เวอร์ชัน {version}",
  "{count} instruments declared, in a draft methodology.":
    "ประกาศอุปกรณ์วัดไว้ {count} รายการ ในวิธีการฉบับร่าง",
  "{share}% of the year rests on estimates — past the {threshold}% self-check threshold.":
    "{share}% ของทั้งปีอ้างอิงการประมาณการ ซึ่งเกินเกณฑ์การตรวจสอบด้วยตนเองที่ {threshold}%",
  "SEE total {see} tCO₂e per tonne over {counted} of 12 months.":
    "SEE รวม {see} tCO₂e ต่อตัน จาก {counted} จาก 12 เดือน",
  "1 document will be appended, on its own paginated page.":
    "จะแนบเอกสาร 1 ฉบับ โดยจัดหน้าแยกของตนเอง",
  "{count} documents will be appended, each on its own paginated page.":
    "จะแนบเอกสาร {count} ฉบับ โดยแต่ละฉบับจัดหน้าแยกของตนเอง",

  /* ── Carbon-price instruments, month-quality flags and chain stages ─────────────────────────────── */
  "Emissions trading scheme":
    "ระบบซื้อขายสิทธิ์การปล่อยก๊าซ",
  "Carbon tax":
    "ภาษีคาร์บอน",
  "Embedded in fuel excise":
    "รวมอยู่ในภาษีสรรพสามิตน้ำมัน",
  "None paid":
    "ไม่ได้ชำระ",
  "Allowances surrendered under a trading scheme. Evidence is the settlement or surrender statement.":
    "การส่งคืนสิทธิ์ภายใต้ระบบซื้อขาย หลักฐานคือใบยืนยันการชำระบัญชีหรือการส่งคืนสิทธิ์",
  "A standalone carbon tax, charged per tonne of CO₂e. Evidence is the tax receipt.":
    "ภาษีคาร์บอนแบบเอกเทศ คิดต่อ CO₂e หนึ่งตัน หลักฐานคือใบเสร็จภาษี",
  "A levy charged on emissions or on fuel with an emissions basis.":
    "ค่าธรรมเนียมที่เก็บจากการปล่อยก๊าซ หรือจากเชื้อเพลิงโดยอิงปริมาณการปล่อย",
  "A carbon component inside an existing excise — Thailand's THB 200/tCO₂e in the oil excise structure is this. Whether the EU accepts it under Art. 9 is unsettled, so it is recorded as claimed and never auto-applied.":
    "องค์ประกอบด้านคาร์บอนที่อยู่ในภาษีสรรพสามิตเดิม เช่น อัตรา 200 บาท/tCO₂e ในโครงสร้างภาษีสรรพสามิตน้ำมันของไทย ยังไม่แน่ชัดว่าสหภาพยุโรปจะยอมรับตามมาตรา 9 หรือไม่ จึงบันทึกไว้เป็นรายการที่ขอหักลด และไม่หักให้อัตโนมัติ",
  "No carbon price paid in the country of origin. A valid and common answer — record it rather than leaving the field empty.":
    "ไม่มีการชำระราคาคาร์บอนในประเทศต้นทาง เป็นคำตอบที่ถูกต้องและพบบ่อย ให้บันทึกไว้แทนการเว้นว่าง",
  "Carbon price has not been recorded. Zero is a valid answer — record it rather than leaving it blank.":
    "ยังไม่ได้บันทึกราคาคาร์บอน ค่าศูนย์เป็นคำตอบที่ถูกต้อง ให้บันทึกไว้แทนการเว้นว่าง",
  "The installation record is incomplete":
    "ข้อมูลสถานประกอบการยังไม่ครบถ้วน",
  "Methodology is incomplete":
    "วิธีการยังไม่ครบถ้วน",
  "Grid emission factor is implausibly high":
    "ค่าแฟกเตอร์ของระบบจำหน่ายสูงจนไม่น่าเป็นไปได้",
  "Emissions per tonne are outside the sector range":
    "การปล่อยก๊าซต่อตันอยู่นอกช่วงปกติของสาขานี้",
  "Electricity per tonne is very high":
    "ปริมาณไฟฟ้าต่อตันสูงมาก",
  "Fuel burned in a month with no production":
    "มีการเผาไหม้เชื้อเพลิงในเดือนที่ไม่มีการผลิต",
  "Fuel is recorded but production is zero. If the plant ran, the tonnage is missing; if it was idle, the fuel belongs outside the boundary and the methodology should say so.":
    "บันทึกเชื้อเพลิงไว้แต่ผลผลิตเป็นศูนย์ หากโรงงานเดินเครื่องจริง แสดงว่าปริมาณตันขาดหายไป หากหยุดเดินเครื่อง เชื้อเพลิงนั้นควรอยู่นอกขอบเขต และวิธีการควรระบุไว้",
  "Precursors received into a month with no output":
    "รับวัตถุดิบตั้งต้นเข้าในเดือนที่ไม่มีผลผลิต",
  "Material arrived but nothing was produced. That happens — stock builds — but a verifier asks, so make sure the production figure is right.":
    "มีวัสดุเข้ามาแต่ไม่มีการผลิต ซึ่งเกิดขึ้นได้เมื่อสะสมสต็อก แต่ผู้ตรวจสอบจะถาม จึงควรตรวจว่าตัวเลขการผลิตถูกต้อง",
  "Production is well above the rest of the year":
    "ผลผลิตสูงกว่าช่วงอื่นของปีอย่างมาก",
  "A new fuel is fine if the plant genuinely switched or trialled one. If it is the same fuel under a different name, pick the name the other months use so the year can be summed.":
    "การมีเชื้อเพลิงชนิดใหม่ไม่ผิด หากโรงงานเปลี่ยนหรือทดลองใช้จริง แต่หากเป็นเชื้อเพลิงเดิมที่เรียกชื่อต่างออกไป ให้เลือกชื่อเดียวกับเดือนอื่น เพื่อให้รวมยอดทั้งปีได้",
  "Nothing is attached to this month":
    "ยังไม่ได้แนบเอกสารใดในเดือนนี้",
  "A figure with no document behind it is the first thing a verifier removes. Attach the utility invoice, the fuel delivery notes and the production log.":
    "ตัวเลขที่ไม่มีเอกสารรองรับคือสิ่งแรกที่ผู้ตรวจสอบจะตัดออก ให้แนบใบแจ้งค่าสาธารณูปโภค ใบส่งของเชื้อเพลิง และบันทึกการผลิต",
  "Must be fixed":
    "ต้องแก้ไข",
  "Out of range":
    "อยู่นอกช่วง",
  "Contradicts itself":
    "ขัดแย้งกันเอง",
  "The form will not submit until these are answered. Each one is a figure something downstream divides by or multiplies with.":
    "แบบฟอร์มจะยังส่งไม่ได้จนกว่าจะตอบรายการเหล่านี้ครบ เพราะแต่ละรายการคือตัวเลขที่ขั้นตอนถัดไปนำไปหารหรือคูณ",
  "Present, but outside what the quantity can physically be or what the sector reports. Usually a unit.":
    "มีค่าอยู่ แต่อยู่นอกช่วงที่ปริมาณนั้นเป็นไปได้ทางกายภาพ หรือนอกช่วงที่สาขานี้รายงาน โดยมากมักเป็นเรื่องหน่วยวัด",
  "Plausible on its own, unusual next to the rest of the year. Worth one look, then carry on.":
    "ดูสมเหตุสมผลในตัวเอง แต่ผิดปกติเมื่อเทียบกับช่วงอื่นของปี ควรตรวจสักครั้งแล้วดำเนินการต่อ",
  "Two answers in this month disagree with each other.":
    "คำตอบสองรายการในเดือนนี้ขัดแย้งกัน",
  "Tracking report":
    "กำลังติดตามรายงาน",
  "Updated with buyer":
    "อัปเดตกับผู้ซื้อแล้ว",
  "Nothing has been asked for and nothing entered. Track a report to start chasing this figure.":
    "ยังไม่ได้ขอและยังไม่ได้กรอกอะไร กดติดตามรายงานเพื่อเริ่มตามตัวเลขนี้",
  "A report has been asked for — a Smart Link is out, or a report workspace is open for this entity.":
    "ขอรายงานไปแล้ว โดยส่งลิงก์อัจฉริยะออกไป หรือเปิดพื้นที่ทำงานรายงานให้รายการนี้แล้ว",
  "Being filled in — by the supplier on their link, or by you in the workspace.":
    "กำลังกรอกข้อมูล ไม่ว่าจะโดยซัพพลายเออร์ผ่านลิงก์ของเขา หรือโดยคุณในพื้นที่ทำงาน",
  "Verified and rolled into the chain. This figure is ready to hand to your buyer.":
    "ผ่านการตรวจสอบและรวมเข้าห่วงโซ่แล้ว ตัวเลขนี้พร้อมส่งให้ผู้ซื้อ",
  "Share of this workspace's applicable readiness tabs that are complete. Descriptive only — never a gate to submission.":
    "สัดส่วนแท็บความพร้อมที่เกี่ยวข้องของพื้นที่ทำงานนี้ที่เสร็จสมบูรณ์ เป็นข้อมูลเชิงพรรณนาเท่านั้น ไม่ได้ใช้เป็นเงื่อนไขกั้นการส่ง",
  "Version":
    "เวอร์ชัน",
  "Files":
    "ไฟล์",
  "Figures covered":
    "ตัวเลขที่ครอบคลุม",
  "Last upload":
    "อัปโหลดล่าสุด",
  "Nothing yet":
    "ยังไม่มี",
  "Process CO₂":
    "CO₂ จากกระบวนการ",
  "Monthly CO₂":
    "CO₂ รายเดือน",
  "SEE (indicative)":
    "SEE (ตัวชี้แนวโน้ม)",
  "{count} to answer":
    "รอตอบ {count} รายการ",
  "estimated share · threshold {threshold}%":
    "สัดส่วนที่ประมาณการ · เกณฑ์ {threshold}%",

  /* ── Month submission states, revision parts and the precursor field log ─────────────────────────────── */
  "Not submitted":
    "ยังไม่ได้ส่ง",
  "Awaiting your review":
    "รอคุณตรวจทาน",
  "Revision requested":
    "ขอให้แก้ไข",
  "The installation record":
    "ข้อมูลสถานประกอบการ",
  "Address, economic activity, UNLOCODE, the coordinates of the main emission source, the authorised representative.":
    "ที่อยู่ กิจกรรมทางเศรษฐกิจ UN/LOCODE พิกัดของแหล่งปล่อยก๊าซหลัก และผู้แทนที่ได้รับมอบอำนาจ",
  "What the reported figures cover, and where the plant stops.":
    "ตัวเลขที่รายงานครอบคลุมอะไร และขอบเขตของโรงงานสิ้นสุดที่ใด",
  "Which production processes are inside the boundary.":
    "กระบวนการผลิตใดบ้างที่อยู่ในขอบเขต",
  "Anything deliberately left out, and on what ground.":
    "สิ่งใดที่จงใจไม่รวมไว้ และด้วยเหตุผลใด",
  "Direct emissions method":
    "วิธีคำนวณการปล่อยก๊าซทางตรง",
  "Calculation-based or measurement-based, and why.":
    "ใช้วิธีอิงการคำนวณหรืออิงการวัด และเพราะเหตุใด",
  "Fuels declared in the methodology":
    "เชื้อเพลิงที่ประกาศไว้ในวิธีการ",
  "The fuel list the monthly readings are supposed to match.":
    "รายการเชื้อเพลิงที่ค่าที่บันทึกรายเดือนควรตรงกัน",
  "Electricity supply and metering":
    "แหล่งจ่ายไฟฟ้าและการวัด",
  "Where the power comes from and which meter it is read off.":
    "ไฟฟ้ามาจากที่ใด และอ่านค่าจากมิเตอร์ตัวใด",
  "Anything that could not be measured, and what stood in for it.":
    "สิ่งใดที่วัดไม่ได้ และใช้อะไรแทน",
  "Production for the month":
    "ผลผลิตของเดือนนี้",
  "Net tonnes of the good produced — the denominator of every per-tonne figure.":
    "จำนวนตันสุทธิของสินค้าที่ผลิตได้ ซึ่งเป็นตัวส่วนของทุกค่าต่อตัน",
  "Fuels burned this month":
    "เชื้อเพลิงที่เผาไหม้ในเดือนนี้",
  "Quantities, units, calorific values and emission factors.":
    "ปริมาณ หน่วยวัด ค่าความร้อน และค่าแฟกเตอร์การปล่อยก๊าซ",
  "Electricity consumed":
    "ไฟฟ้าที่ใช้",
  "Absolute MWh from the invoice, and the factor applied to it.":
    "ค่า MWh สัมบูรณ์จากใบแจ้งหนี้ และค่าแฟกเตอร์ที่ใช้",
  "Emissions from the materials themselves rather than from fuel.":
    "การปล่อยก๊าซจากตัววัสดุเอง ไม่ใช่จากเชื้อเพลิง",
  "How much of each bought-in CBAM input arrived this month.":
    "วัตถุดิบ CBAM ที่จัดซื้อแต่ละรายการรับเข้ามาเท่าใดในเดือนนี้",
  "The invoices and logs behind the figures above.":
    "ใบแจ้งหนี้และบันทึกที่รองรับตัวเลขด้านบน",
  "Producing installation":
    "สถานประกอบการผู้ผลิต",
  "Catalogue product":
    "สินค้าในแค็ตตาล็อก",
  "Scrap flag":
    "เครื่องหมายเศษโลหะ",
  "Indirect emissions":
    "การปล่อยก๊าซทางอ้อม",
  "Monthly quantities":
    "ปริมาณรายเดือน",
  "Quantity used":
    "ปริมาณที่ใช้",
  "Where it was made":
    "ผลิตที่ใด",
  "Source process":
    "กระบวนการต้นทาง",
  "Installation unique ID":
    "รหัสเฉพาะของสถานประกอบการ",
  "Accreditation country":
    "ประเทศที่ออกการรับรองระบบงาน",
  "Accreditation expiry":
    "วันหมดอายุการรับรองระบบงาน",
  "Report expiry":
    "วันหมดอายุของรายงาน",
  "Verification checks":
    "การตรวจสอบตามเกณฑ์",
  "Reducing agent":
    "ตัวรีดิวซ์",
  "Report workspace":
    "พื้นที่ทำงานรายงาน",
  "Local name":
    "ชื่อภาษาท้องถิ่น",
  "Other goods made here":
    "สินค้าอื่นที่ผลิตที่นี่",
  "This precursor has no workspace of its own yet. Track a report for it and its own months, readiness and settings open here.":
    "วัตถุดิบตั้งต้นนี้ยังไม่มีพื้นที่ทำงานของตนเอง กดติดตามรายงานให้รายการนี้ แล้วข้อมูลรายเดือน ความพร้อม และการตั้งค่าของมันจะเปิดขึ้นที่นี่",

  /* ── Chain node status pills and the chain counters ─────────────────────────────── */
  "Not sent":
    "ยังไม่ได้ส่ง",
  "Sent — pending":
    "ส่งแล้ว — รอตอบกลับ",
  "Submitted — pending verification":
    "ส่งข้อมูลแล้ว — รอการตรวจสอบ",
  "Verified":
    "ผ่านการตรวจสอบ",
  "Verification expired":
    "การตรวจสอบหมดอายุ",
  "Actual value":
    "ค่าจริง",
  "supplier":
    "ซัพพลายเออร์",
  "tier deep":
    "ชั้น",
  "tiers deep":
    "ชั้น",

  /* ── Supplier demo links ─────────────────────────────── */
  "submitted earlier":
    "ส่งข้อมูลแล้วก่อนหน้านี้",
  "not started (critical)":
    "ยังไม่เริ่ม (วิกฤต)",

  /* ── The supplier's own link — the landing page and its section list ─────────────────────────────── */
  "No Smart Link goes out for these — {supplier} is you. Report the embedded emissions of your own installation the same way an external supplier would, and the declaration treats it identically: same {regulation} checklist, same AI check, same verification trail.":
    "รายการเหล่านี้ไม่มีการส่งลิงก์อัจฉริยะออกไป เพราะ {supplier} คือคุณเอง ให้รายงานการปล่อยก๊าซที่ฝังอยู่ของสถานประกอบการของคุณแบบเดียวกับที่ซัพพลายเออร์ภายนอกทำ และการสำแดงจะปฏิบัติต่อข้อมูลนี้เหมือนกันทุกประการ ทั้งรายการตรวจสอบ {regulation} ชุดเดียวกัน การตรวจด้วย AI ชุดเดียวกัน และร่องรอยการตรวจสอบชุดเดียวกัน",
  "You’re {supplier}. To keep shipping {origin} {sector} into the {destination}, {exporter} has to report the embedded emissions of the goods they buy from you — under {regulation}. This takes about 10 minutes, it’s free, and you don’t need an account.":
    "คุณคือ {supplier} เพื่อให้ส่งออกสินค้า {sector} จาก {origin} ไปยัง {destination} ได้ต่อไป {exporter} ต้องรายงานการปล่อยก๊าซที่ฝังอยู่ในสินค้าที่ซื้อจากคุณ ตาม {regulation} ขั้นตอนนี้ใช้เวลาประมาณ 10 นาที ไม่มีค่าใช้จ่าย และไม่ต้องสมัครบัญชี",
  "Your figures are checked automatically before you submit and land in your own supplier record, so the next declaration starts pre-filled instead of blank. Colleagues can be assigned the sections that belong to their department.":
    "ตัวเลขของคุณจะถูกตรวจอัตโนมัติก่อนส่ง และบันทึกไว้ในข้อมูลซัพพลายเออร์ของคุณเอง การสำแดงครั้งถัดไปจึงเริ่มต้นด้วยข้อมูลที่กรอกไว้ล่วงหน้าแทนแบบฟอร์มเปล่า และคุณมอบหมายหัวข้อให้เพื่อนร่วมงานตามแผนกของเขาได้",
  "Your figures are checked automatically before you submit, encrypted, and shared only with {exporter} for this declaration. You can invite colleagues to fill the parts that belong to their department.":
    "ตัวเลขของคุณจะถูกตรวจอัตโนมัติก่อนส่ง เข้ารหัสไว้ และแบ่งปันเฉพาะกับ {exporter} สำหรับการสำแดงครั้งนี้เท่านั้น คุณเชิญเพื่อนร่วมงานมากรอกส่วนที่เป็นของแผนกเขาได้",
  "Reporting as":
    "รายงานในนาม",
  "Requested by":
    "ผู้ร้องขอ",
  "Goods in scope":
    "สินค้าที่อยู่ในขอบเขต",
  "Documents requested":
    "เอกสารที่ขอ",
  "{total} ({required} required)":
    "{total} รายการ (จำเป็น {required} รายการ)",
  "One request for the period":
    "หนึ่งคำขอต่อหนึ่งรอบรายงาน",
  "One request per month":
    "หนึ่งคำขอต่อเดือน",
  "Works / alloy test certificate (EN 10204 3.1)":
    "ใบรับรองผลการทดสอบโรงงาน / โลหะผสม (EN 10204 3.1)",
  "Mill Test Certificate (EN 10204 3.1)":
    "ใบรับรองผลการทดสอบจากโรงงาน (EN 10204 3.1)",
  "CBAM communication / embedded-emissions sheet":
    "เอกสารสื่อสาร CBAM / แผ่นข้อมูลการปล่อยก๊าซที่ฝังอยู่",
  "Certificate of Origin (COO)":
    "หนังสือรับรองถิ่นกำเนิดสินค้า (COO)",
  "Verification statement (accredited verifier)":
    "หนังสือรับรองการตรวจสอบ (จากผู้ตรวจสอบที่ได้รับการรับรอง)",
  "Please report at installation level using actual data where you have it. If you only have default factors, mark the method as “default”. Reach out if anything is unclear — we'd rather help than receive a guess.":
    "กรุณารายงานในระดับสถานประกอบการ โดยใช้ข้อมูลจริงเท่าที่คุณมี หากมีเพียงค่าแฟกเตอร์ default ให้ระบุวิธีเป็น “default” หากมีข้อสงสัยกรุณาติดต่อเรา เรายินดีช่วยมากกว่าจะได้รับตัวเลขที่เดาเอา",
  "Who produced the goods and where.":
    "ใครเป็นผู้ผลิตสินค้า และผลิตที่ใด",
  "Route and quantity per good.":
    "กระบวนการผลิตและปริมาณของแต่ละสินค้า",
  "Direct & indirect emissions per tonne.":
    "การปล่อยก๊าซทางตรงและทางอ้อมต่อตัน",
  "Fuel, power and materials the figure is derived from.":
    "เชื้อเพลิง ไฟฟ้า และวัสดุที่ใช้คำนวณตัวเลขนี้",
  "Power use & grid factor (electrolysis goods).":
    "การใช้ไฟฟ้าและค่าแฟกเตอร์ของระบบจำหน่าย (สินค้าที่ผลิตด้วยกระบวนการอิเล็กโทรลิซิส)",
  "Embedded emissions carried in from inputs.":
    "การปล่อยก๊าซที่ฝังมากับวัตถุดิบ",
  "Any carbon price paid in country of origin.":
    "ราคาคาร์บอนที่ชำระในประเทศต้นทาง หากมี",
  "Accredited verifier and outcome.":
    "ผู้ตรวจสอบที่ได้รับการรับรองและผลการตรวจ",
  "Certificates and supporting files.":
    "ใบรับรองและไฟล์ประกอบ",
  "Zinc coating":
    "การเคลือบสังกะสี",
  "Grid electricity":
    "ไฟฟ้าจากระบบจำหน่าย",

  /* ── Supplier link — the section chips and the header line ─────────────────────────────── */
  "data request":
    "คำขอข้อมูล",
  "· our own installation":
    "· สถานประกอบการของเราเอง",

  /* ── Supplier link — the headline ─────────────────────────────── */
  "You produce these goods yourself.":
    "สินค้าเหล่านี้คุณผลิตเอง",
  "{exporter} needs your carbon data.":
    "{exporter} ต้องการข้อมูลคาร์บอนของคุณ",

  /* ── Supplier portal — departments, audiences and the section list ─────────────────────────────── */
  "Supplier Portal":
    "พอร์ทัลซัพพลายเออร์",
  "Our own data":
    "ข้อมูลของเราเอง",
  "For {exporter} — fill each section, attach documents, run the check, then sign and submit.":
    "สำหรับ {exporter} — กรอกให้ครบทุกหัวข้อ แนบเอกสาร รันการตรวจสอบ แล้วลงนามและส่ง",
  "Note from {exporter}":
    "ข้อความจาก {exporter}",
  "Continue questionnaire":
    "ทำแบบสอบถามต่อ",
  "Start questionnaire":
    "เริ่มทำแบบสอบถาม",
  "Start filling in the questionnaire to enable the quality check.":
    "เริ่มกรอกแบบสอบถามเพื่อเปิดใช้การตรวจสอบคุณภาพ",
  "Upload {document}":
    "อัปโหลด {document}",
  "Share {section} with {audience}":
    "แบ่งปัน {section} ให้ {audience}",
  "Compliance / QA":
    "กำกับดูแล / ประกันคุณภาพ",
  "Energy":
    "พลังงาน",
  "Operations / EHS":
    "ฝ่ายปฏิบัติการ / EHS",
  "Procurement":
    "จัดซื้อ",
  "Production / Energy":
    "ฝ่ายผลิต / พลังงาน",
  "Production / Plant":
    "ฝ่ายผลิต / โรงงาน",
  "QA / Verifier":
    "ประกันคุณภาพ / ผู้ตรวจสอบ",
  "Sustainability / ESG":
    "ความยั่งยืน / ESG",
  "EU buyers":
    "ผู้ซื้อในสหภาพยุโรป",
  "The importers your exporter sells to — their declarant files the CBAM declaration.":
    "ผู้นำเข้าที่ผู้ส่งออกของคุณขายให้ ซึ่งผู้ยื่นสำแดงของเขาเป็นผู้ยื่นการสำแดง CBAM",
  "The accredited verifier checking the dataset before it's filed.":
    "ผู้ตรวจสอบที่ได้รับการรับรอง ซึ่งตรวจชุดข้อมูลก่อนนำไปยื่น",

  /* ── Supplier link — autosave indicator and submission status ─────────────────────────────── */
  "Offline — not saved":
    "ออฟไลน์ — ยังไม่ได้บันทึก",

  /* ── Supplier submission status chips ─────────────────────────────── */
  "quality check":
    "ตรวจสอบคุณภาพ",

  /* ── The free trial: the countdown, the sidebar strip, the end ─────────────
     "Free trial" itself is already above. The tier NAMES stay English
     everywhere in the product (Starter / Standard / Enterprise), and so does
     "Free trial" as a plan name — but the sentences around it are read, not
     scanned, so they translate. */
  ended:
    "สิ้นสุดแล้ว",
  "{days}d left":
    "เหลือ {days} วัน",
  "Your trial has ended.":
    "ช่วงทดลองใช้ของคุณสิ้นสุดแล้ว",
  "Days left in your trial. Everything is unlimited.":
    "จำนวนวันที่เหลือในช่วงทดลองใช้ ทุกอย่างไม่จำกัด",
  "Your free month is over.":
    "หนึ่งเดือนที่ใช้ฟรีของคุณสิ้นสุดแล้ว",
  "One day left in your free month.":
    "เหลืออีก 1 วันในเดือนที่ใช้ฟรีของคุณ",
  "{days} days left in your free month.":
    "เหลืออีก {days} วันในเดือนที่ใช้ฟรีของคุณ",
  "Everything you built is still here and still readable. Choose a tier to start working on it again.":
    "ทุกอย่างที่คุณทำไว้ยังอยู่ครบและยังเปิดดูได้ เลือกแพ็กเกจเพื่อกลับมาทำงานต่อ",
  "Nothing is capped while it runs — every CN code, site, seat and supplier. It ends on {date}.":
    "ระหว่างนี้ไม่มีการจำกัดใด ๆ ทั้งรหัส CN โรงงาน สิทธิ์ใช้งาน และซัพพลายเออร์ โดยจะสิ้นสุดวันที่ {date}",
  "Days left in your free trial":
    "จำนวนวันที่เหลือในช่วงทดลองใช้ฟรี",
  "Day {used} of {total}":
    "วันที่ {used} จาก {total}",
  "ends {date}":
    "สิ้นสุด {date}",
  "ended {date}":
    "สิ้นสุดแล้วเมื่อ {date}",
  "No cap on your plan":
    "แพ็กเกจของคุณไม่จำกัด",

  /* ── Dashboard: the band of six above everything ─────────────── */
  "Days to declaration":
    "วันจนถึงกำหนดยื่น",
  "Overdue now":
    "เลยกำหนดแล้ว",
  "in the action queue":
    "อยู่ในคิวงาน",
  "nothing is late":
    "ไม่มีรายการเลยกำหนด",
  "Waiting on suppliers":
    "รอซัพพลายเออร์",
  "{count} past its date":
    "เลยกำหนด {count} รายการ",
  "none past its date":
    "ไม่มีรายการเลยกำหนด",
  "Buyer-ready":
    "พร้อมส่งผู้ซื้อ",
  "verification complete":
    "การตรวจสอบครบถ้วน",
  "Year collected":
    "เก็บข้อมูลของปีแล้ว",
  "every product":
    "ทุกสินค้า",
  "Avoided this year":
    "ประหยัดได้ในปีนี้",
  "needs monthly data":
    "ต้องมีข้อมูลรายเดือนก่อน",
  "against the EU default":
    "เทียบกับค่าตั้งต้นของสหภาพยุโรป",
  Loading:
    "กำลังโหลด",

  /* ── Dashboard: what you've asked for (Smart Links, summarised) ─────────── */
  "What you've asked for":
    "สิ่งที่คุณขอไว้",
  "All links":
    "ลิงก์ทั้งหมด",
  "No requests yet. They appear here the moment a workspace asks for its first month.":
    "ยังไม่มีคำขอ รายการจะปรากฏที่นี่ทันทีที่พื้นที่ทำงานขอข้อมูลเดือนแรก",
  "To send":
    "รอคุณส่ง",
  "yours to send":
    "เป็นหน้าที่ของคุณที่ต้องส่ง",
  "past the date you set":
    "เลยวันที่คุณกำหนดไว้",
  "with the supplier":
    "อยู่ที่ซัพพลายเออร์",
  Answered:
    "ตอบกลับแล้ว",
  "back and readable":
    "ได้รับกลับมาและเปิดอ่านได้",
  "{percent}% of precursor figures still rest on an EU default value.":
    "ตัวเลขสารตั้งต้น {percent}% ยังอ้างอิงค่าตั้งต้นของสหภาพยุโรปอยู่",

  /* ── Dashboard: the four bands ─────────────── */
  "What needs you":
    "สิ่งที่ต้องให้คุณจัดการ",
  "Who you're waiting on":
    "คุณกำลังรอใครอยู่",
  "Where each product stands":
    "สถานะของสินค้าแต่ละรายการ",
  "What it's worth":
    "มูลค่าที่ได้",
  Recently:
    "ความเคลื่อนไหวล่าสุด",

  /* ── Team: three roles, and the two you can hand out ─────────────── */
  "The three roles":
    "สามบทบาทในบัญชี",
  Role:
    "บทบาท",
  "builds workspaces and fills months in":
    "สร้างพื้นที่ทำงานและกรอกข้อมูลรายเดือน",
  "reviews and signs off before it leaves":
    "ตรวจทานและอนุมัติก่อนส่งออกไป",
  "Everything a member can do, plus reviewing and signing packages off before they leave.":
    "ทำได้ทุกอย่างเท่าที่สมาชิกทำได้ และตรวจทานพร้อมลงนามอนุมัติชุดเอกสารก่อนส่งออกไป",

  /* ── Dashboard widgets that were still speaking English ─────────────
     Two headline figures and the cost widget's empty states. The readiness
     ENGINE's blocking sentences (lib/readiness.ts) are still English: they
     are composed at runtime with the numbers already substituted in, so they
     cannot be looked up as source strings — translating them means turning
     each into a template with placeholders, which is a change to the
     compliance engine's wording rather than to a screen. */
  "{ready} of {total} products are buyer-ready":
    "สินค้าพร้อมส่งผู้ซื้อ {ready} จาก {total} รายการ",
  "Cost avoidance, {year}":
    "ต้นทุนที่หลีกเลี่ยงได้ ปี {year}",
  "No production data has been entered for this workspace yet.":
    "ยังไม่มีการกรอกข้อมูลการผลิตในพื้นที่ทำงานนี้",
  "No default emissions figure is on file for this product's category yet.":
    "ยังไม่มีค่าการปล่อยตั้งต้นสำหรับหมวดสินค้านี้ในระบบ",
  "Enter export volume to see savings.":
    "กรอกปริมาณส่งออกเพื่อดูส่วนที่ประหยัดได้",
  "No certificate price is on file for this period yet.":
    "ยังไม่มีราคาใบรับรองสำหรับช่วงเวลานี้ในระบบ",
  "Enter export volume":
    "กรอกปริมาณส่งออก",
  "Enter monthly data":
    "กรอกข้อมูลรายเดือน",
  "Check the product category":
    "ตรวจสอบหมวดสินค้า",
  "Add a certificate price":
    "เพิ่มราคาใบรับรอง",
  "Confirm the phase-in rate":
    "ยืนยันอัตราการทยอยบังคับใช้",
};
