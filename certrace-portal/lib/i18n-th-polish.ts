/* Thai for the screens reworked in the Verification alignment pass: Dashboard, Smart Links, Reports, Carbon & Cost, the product report's
   tabs, and the "who fills this in" vocabulary. Written to read as Thai, not as English with Thai words in it — short, no brackets of
   English after a Thai label, and the same words the Verification page uses (รายงานผลิตภัณฑ์, โรงงาน, วัตถุดิบตั้งต้น, ผู้ทวนสอบ).
   Merged last, so a line here wins over the same key elsewhere. */

export const TH_POLISH: Record<string, string> = {
  /* ── Dashboard ─────────────────────────────────────────────── */
  "Where your company stands.": "สถานะของบริษัทคุณตอนนี้",
  Documents: "เอกสาร",
  Group: "กลุ่มย่อย",
  "All groups": "ทุกกลุ่มย่อย",
  "Step {n} of {total}": "ขั้นที่ {n} จาก {total}",
  Supplier: "ซัพพลายเออร์",
  "Country & good": "ประเทศและสินค้า",
  "Route & year": "เส้นทางและปี",
  Schedule: "กำหนดส่ง",
  Address: "ที่อยู่",
  "Name of the installation": "ชื่อโรงงาน",
  "Go to product {name}": "ไปที่สินค้า {name}",
  "Installation reference": "รหัสอ้างอิงโรงงาน",
  "{from} to {to}": "{from} ถึง {to}",
  "Nothing to compute yet — no month has been submitted. Start with":
    "ยังคำนวณไม่ได้ เพราะยังไม่มีเดือนที่ส่งแล้ว เริ่มจาก",
  "Sintered ore": "แร่ซินเตอร์",
  "Pig iron": "เหล็กดิบ",
  "Ferro-alloys": "เฟอร์โรอัลลอย",
  "Direct reduced iron": "เหล็กรีดิวซ์โดยตรง (DRI)",
  "Crude steel": "เหล็กกล้าขั้นต้น",
  "Iron or steel products": "ผลิตภัณฑ์เหล็กหรือเหล็กกล้า",
  "Unwrought aluminium": "อะลูมิเนียมที่ยังไม่ขึ้นรูป",
  "Aluminium products": "ผลิตภัณฑ์อะลูมิเนียม",
  "Calcined clay": "ดินเผาแคลไซน์",
  "Cement clinker": "ปูนเม็ด",
  "Aluminous cement": "ซีเมนต์อะลูมินัส",
  Ammonia: "แอมโมเนีย",
  "Nitric acid": "กรดไนตริก",
  Urea: "ยูเรีย",
  "Mixed fertilisers": "ปุ๋ยสูตรผสม",
  Precursor: "วัตถุดิบตั้งต้น",
  "Semi-finished": "กึ่งสำเร็จรูป",
  "Finished product": "สินค้าสำเร็จรูป",
  "Carbon steel — BF/BOF": "เหล็กกล้าคาร์บอน — BF/BOF",
  "Carbon steel — DRI/EAF": "เหล็กกล้าคาร์บอน — DRI/EAF",
  "Carbon steel — scrap/EAF": "เหล็กกล้าคาร์บอน — เศษเหล็ก/EAF",
  "Low-alloy steel — BF/BOF": "เหล็กกล้าเจือต่ำ — BF/BOF",
  "Low-alloy steel — DRI/EAF": "เหล็กกล้าเจือต่ำ — DRI/EAF",
  "Low-alloy steel — scrap/EAF": "เหล็กกล้าเจือต่ำ — เศษเหล็ก/EAF",
  "High-alloy steel — EAF": "เหล็กกล้าเจือสูง — EAF",
  "Primary aluminium": "อะลูมิเนียมปฐมภูมิ",
  "Secondary aluminium": "อะลูมิเนียมทุติยภูมิ",
  "The cross-sectoral correction factor (CSCF) that also multiplies the benchmark is published by the Commission and is not yet applied here.":
    "ปัจจัยปรับข้ามภาคส่วน (CSCF) ที่คูณกับเกณฑ์อ้างอิงด้วยนั้น คณะกรรมาธิการเป็นผู้ประกาศ และยังไม่ได้นำมาใช้ในที่นี้",
  of: "จาก",
  Installation: "โรงงาน",
  "All installations": "ทุกโรงงาน",
  Good: "สินค้า",
  "No matches out of {n}.": "ไม่พบรายการที่ตรง จากทั้งหมด {n}",
  filtered: "กรองแล้ว",
  "{n} site": "{n} โรงงาน",
  "{n} sites": "{n} โรงงาน",
  "{n} product report": "{n} รายงานผลิตภัณฑ์",
  "{n} precursor": "วัตถุดิบตั้งต้น {n} รายการ",
  "{n} precursors": "วัตถุดิบตั้งต้น {n} รายการ",
  "EU default for {country}": "ค่าเริ่มต้นของ EU สำหรับ {country}",
  "Open report": "เปิดรายงาน",
  "Open link": "เปิดลิงก์",
  "Check readiness": "ตรวจความพร้อม",
  "Open site": "เปิดโรงงาน",
  Packages: "ชุดรายงาน",
  "Your own site": "โรงงานของคุณเอง",
  "Asking for": "ประเภทคำขอ",
  "Make one and this page fills in.": "สร้างรายงานแรก แล้วหน้านี้จะเริ่มมีข้อมูล",
  "Needs you": "รอคุณจัดการ",
  "Your sites": "โรงงานของคุณ",
  "Packages ready": "ชุดรายงานที่พร้อม",
  "to send to the verifier": "พร้อมส่งให้ผู้ทวนสอบ",
  "Reports ready": "รายงานที่พร้อม",
  "average of all reports": "ค่าเฉลี่ยของทุกรายงาน",
  "submitted so far": "ส่งแล้วจนถึงตอนนี้",
  "{n} product reports": "{n} รายงานผลิตภัณฑ์",
  "{in} of {of} months in": "ส่งแล้ว {in} จาก {of} เดือน",
  "No deadline pending": "ไม่มีกำหนดที่รออยู่",
  "Due now": "ครบกำหนดแล้ว",
  "Not yet buyer-ready": "ยังไม่พร้อมสำหรับผู้ซื้อ",
  "Not yet ready": "ยังไม่พร้อม",
  "Blocked on {label}": "ติดขัดที่{label}",
  "Buyer-ready": "พร้อมสำหรับผู้ซื้อ",
  "If a buyer asked for proof today, could we send it":
    "ถ้าผู้ซื้อขอหลักฐานวันนี้ เราส่งได้ไหม",

  /* ── Verification list ─────────────────────────────────────── */
  "Your sites, and the product reports you file at each one.":
    "โรงงานของคุณ และรายงานผลิตภัณฑ์ที่ยื่นของแต่ละโรงงาน",
  "Archived reports stay here, and come back with one click.":
    "รายงานที่เก็บถาวรอยู่ที่นี่ และกู้คืนได้ในคลิกเดียว",
  "Back to active reports": "กลับไปรายงานที่ใช้งานอยู่",
  "Back to the active estate": "กลับไปรายการที่ใช้งานอยู่",
  "One product at one site for one year — like “Steel billet · Plant A · 2026”.":
    "หนึ่งผลิตภัณฑ์ ที่หนึ่งโรงงาน ในหนึ่งปี เช่น “บิลเล็ตเหล็ก · โรงงาน A · 2026”",
  "Clear a filter to see more.": "ล้างตัวกรองเพื่อดูเพิ่ม",
  "Search archived workspaces…": "ค้นหารายงานที่เก็บถาวร…",
  "Search archived workspaces": "ค้นหารายงานที่เก็บถาวร",
  "Search workspaces": "ค้นหารายงาน",
  "Search by product, CN code, supplier or installation…":
    "ค้นหาด้วยผลิตภัณฑ์ รหัส CN ซัพพลายเออร์ หรือโรงงาน…",
  "Show archived workspaces — off the dashboard, out of the Inbox, not counted in Reports. Nothing is deleted.":
    "แสดงรายการที่เก็บถาวร — ไม่แสดงในแดชบอร์ด ไม่อยู่ในกล่องงาน และไม่นับในรายงาน ไม่มีอะไรถูกลบ",
  "Workspace restored": "กู้คืนรายงานผลิตภัณฑ์แล้ว",
  "Workspace archived": "เก็บรายงานผลิตภัณฑ์เข้าคลังแล้ว",
  "It is out of the estate but nothing was deleted — restore it from Archived.":
    "ย้ายออกจากรายการแล้ว แต่ไม่มีอะไรถูกลบ กู้คืนได้จากหน้าที่เก็บถาวร",
  "Click to confirm archive": "คลิกเพื่อยืนยันการเก็บถาวร",
  "Archive workspace": "เก็บรายงานผลิตภัณฑ์เข้าคลัง",
  "Signed off": "ลงนามรับรองแล้ว",

  /* ── New product report ────────────────────────────────────── */
  "Unnamed installation": "โรงงานที่ยังไม่ตั้งชื่อ",
  "No good chosen yet": "ยังไม่ได้เลือกสินค้า",
  "Saved as a draft": "บันทึกเป็นแบบร่างแล้ว",
  "It is waiting at the top of your verification workspaces.":
    "อยู่บนสุดของรายการรายงานผลิตภัณฑ์ของคุณ",
  "Workspace created": "สร้างรายงานผลิตภัณฑ์แล้ว",
  "Close and save draft — back to the supply chain":
    "ปิดและบันทึกแบบร่าง — กลับไปห่วงโซ่อุปทาน",
  "Choose a supplier": "เลือกซัพพลายเออร์",
  "No suppliers yet": "ยังไม่มีซัพพลายเออร์",
  "Choose an installation": "เลือกโรงงาน",
  "your site": "โรงงานของคุณ",
  "No installations for this supplier yet": "ซัพพลายเออร์รายนี้ยังไม่มีโรงงาน",
  "Standard name": "ชื่อมาตรฐาน",
  "Precursors this implies": "วัตถุดิบตั้งต้นที่เกี่ยวข้อง",
  "Where the emissions are": "แหล่งที่เกิดการปล่อย",
  "This installation is yours, so each month appears in your own inbox once you send it — nothing goes to a third party.":
    "โรงงานนี้เป็นของคุณ เมื่อกดส่ง แต่ละเดือนจะเข้ากล่องงานของคุณเอง ไม่มีอะไรส่งถึงบุคคลที่สาม",
  "This installation is yours, so the month appears in your own inbox once it has been sent — nothing needs to go to a third party.":
    "โรงงานนี้เป็นของคุณ เมื่อส่งแล้วแต่ละเดือนจะเข้ากล่องงานของคุณเอง ไม่ต้องส่งถึงบุคคลที่สาม",
  "Asked when it ends, due by the {day} of the next month":
    "ขอเมื่อสิ้นเดือน ส่งภายในวันที่ {day} ของเดือนถัดไป",
  "Example: January {year} is asked on 31 January and due by the {day} of February.":
    "ตัวอย่าง: ข้อมูลเดือนมกราคม {year} ขอวันที่ 31 มกราคม และต้องส่งภายในวันที่ {day} กุมภาพันธ์",

  /* ── Product report: overview ──────────────────────────────── */
  "Has precursors": "มีวัตถุดิบตั้งต้น",
  "No precursors": "ไม่มีวัตถุดิบตั้งต้น",
  "— the EU recognises other routes for this code. Make a new product report with the right one.":
    "— EU รับรองเส้นทางอื่นสำหรับรหัสนี้ ให้สร้างรายงานผลิตภัณฑ์ใหม่ด้วยเส้นทางที่ถูกต้อง",
  "Main emission source": "แหล่งปล่อยหลัก",
  "Indirect included": "รวมทางอ้อมแล้ว",
  "Annex II — direct only": "Annex II — เฉพาะทางตรง",

  /* ── Product report: precursors ────────────────────────────── */
  "Goods that go straight into this product. For each, use the EU default value or the producer's actual value.":
    "สินค้าที่ใช้ในผลิตภัณฑ์นี้โดยตรง แต่ละรายการเลือกใช้ค่าเริ่มต้นของ EU หรือค่าจริงของผู้ผลิต",
  "No precursor yet.": "ยังไม่มีวัตถุดิบตั้งต้น",
  "Add what you buy in and use in this product.": "เพิ่มสิ่งที่คุณซื้อมาใช้ในผลิตภัณฑ์นี้",
  "One link. They answer once, after their own year is verified.":
    "ลิงก์เดียว ผู้ผลิตตอบครั้งเดียวหลังปีของเขาผ่านการทวนสอบ",
  "Send it to the precursor's operator.": "ส่งให้ผู้ดำเนินการของวัตถุดิบตั้งต้น",
  "Pick the good from the catalogue.": "เลือกสินค้าจากรายการ",
  "Where it was made, and which value to use.": "ผลิตที่ไหน และใช้ค่าแบบใด",
  "Default value in use": "ใช้ค่าเริ่มต้น",
  "Actual value in use": "ใช้ค่าจริง",
  "Your part is incomplete": "ส่วนของคุณยังไม่ครบ",
  "Not requested yet": "ยังไม่ได้ขอ",
  "Waiting for the precursor": "รอผู้ผลิตวัตถุดิบตั้งต้น",
  "A product this site makes and uses here — billet rolled into wire rod. Pick its report and the tonnes used.":
    "สินค้าที่โรงงานนี้ผลิตและใช้เองที่นี่ เช่น บิลเล็ตที่นำไปรีดเป็นเหล็กลวด เลือกรายงานของสินค้านั้นและระบุจำนวนตัน",
  "No other product report at this installation for {year}.":
    "ปี {year} โรงงานนี้ยังไม่มีรายงานผลิตภัณฑ์อื่น",
  "None yet.": "ยังไม่มี",
  "All of it, including what never reached the product.":
    "ทั้งหมด รวมส่วนที่ไม่ได้เข้าสู่ผลิตภัณฑ์",
  "Not an item of Annex IV": "ไม่ใช่รายการใน Annex IV",
  "Nothing attached yet.": "ยังไม่ได้แนบอะไร",

  /* ── Product report: readiness and evidence ────────────────── */
  "Yearly. Zero is a valid answer — enter it, don't leave it blank.":
    "ปีละครั้ง ใส่ 0 ได้ อย่าเว้นว่าง",
  "Claimed deduction for the year:": "ยอดหักที่ขอสำหรับปีนี้:",
  "Not required": "ไม่จำเป็น",
  "Drop a file, or click to attach": "วางไฟล์ หรือคลิกเพื่อแนบ",
  "Add parameter": "เพิ่มพารามิเตอร์",
  "Show a worked example": "ดูตัวอย่างที่คำนวณแล้ว",
  "Hide example": "ซ่อนตัวอย่าง",
  "Add an instrument": "เพิ่มเครื่องมือวัด",
  "Save draft": "บันทึกแบบร่าง",
  "Other fuel — specify": "เชื้อเพลิงอื่น — โปรดระบุ",
  "Anything the list does not name. Describe it in the field below.":
    "สิ่งที่ไม่มีในรายการ อธิบายในช่องด้านล่าง",
  "It is now read-only. Editing forks a new version.":
    "ตอนนี้อ่านได้อย่างเดียว การแก้ไขจะสร้างเวอร์ชันใหม่",
  "Upload a diagram": "อัปโหลดแผนภาพ",
  "Choose a fuel above first — then add the meter that measures it.":
    "เลือกเชื้อเพลิงด้านบนก่อน แล้วค่อยเพิ่มมิเตอร์ที่วัดเชื้อเพลิงนั้น",
  "Add one row per fuel you selected. A fuel with no instrument behind it is a figure a verifier cannot test.":
    "เพิ่มหนึ่งแถวต่อเชื้อเพลิงที่เลือก เชื้อเพลิงที่ไม่มีเครื่องมือวัดรองรับ ผู้ทวนสอบจะตรวจสอบตัวเลขไม่ได้",
  "The main reducing agent of the precursor, if known":
    "ตัวรีดิวซ์หลักของวัตถุดิบตั้งต้น ถ้าทราบ",

  /* ── Monthly data ──────────────────────────────────────────── */
  "The document behind the Type II factor was removed, so the figure can no longer stand as entered.":
    "เอกสารที่รองรับค่าประเภท II ถูกลบแล้ว ตัวเลขจึงใช้ตามที่กรอกไว้ไม่ได้อีก",
  "Methodology and month updated together": "อัพเดทวิธีการและเดือนพร้อมกัน",
  "Nothing to copy": "ไม่มีอะไรให้คัดลอก",
  "The previous month has no fuel or electricity setup yet.":
    "เดือนก่อนหน้ายังไม่มีการตั้งค่าเชื้อเพลิงหรือไฟฟ้า",
  "Setup copied": "คัดลอกการตั้งค่าแล้ว",
  "Fuel types, factors, NCVs and the electricity factor were cloned. Quantities were NOT — enter this month's readings.":
    "คัดลอกชนิดเชื้อเพลิง ค่าสัมประสิทธิ์ ค่า NCV และค่าไฟฟ้าแล้ว แต่ไม่ได้คัดลอกปริมาณ — กรอกค่าของเดือนนี้เอง",
  "Fuel CO₂": "CO₂ จากเชื้อเพลิง",
  "Chase this month": "ติดตามเดือนนี้",
  "Electricity emissions": "การปล่อยจากไฟฟ้า",
  "Precursor SEE": "SEE ของวัตถุดิบตั้งต้น",
  "Total SEE (reported)": "SEE รวม (ที่รายงาน)",

  /* ── Who fills it in, and when ─────────────────────────────── */
  "Supplier fills in": "ซัพพลายเออร์กรอก",
  "You fill in": "คุณกรอก",
  "Whenever it changes": "เมื่อมีการเปลี่ยนแปลง",
  "What this report covers.": "รายงานนี้ครอบคลุมอะไร",
  "Keep it correct.": "ดูแลให้ถูกต้อง",
  "How the plant measures. Written once, changed only when the plant changes.":
    "โรงงานวัดอย่างไร เขียนครั้งเดียว แก้เมื่อโรงงานเปลี่ยนเท่านั้น",
  "Ask early — finish it before the year closes.": "ขอแต่เนิ่น ๆ — ให้เสร็จก่อนปีสิ้นสุด",
  "Ask every month, not once.": "ขอทุกเดือน ไม่ใช่ครั้งเดียว",
  "One final figure for each direct precursor.":
    "ตัวเลขสุดท้ายหนึ่งค่าต่อวัตถุดิบตั้งต้นโดยตรงแต่ละรายการ",
  "Choose default or actual. For actual, copy the link and send it.":
    "เลือกค่าเริ่มต้นหรือค่าจริง ถ้าใช้ค่าจริง ให้คัดลอกลิงก์แล้วส่ง",
  "Attach each document next to its figure.":
    "แนบเอกสารไว้ข้างตัวเลขของแต่ละรายการ",
  "Before the verifier": "ก่อนถึงผู้ทวนสอบ",
  "Whether this report would pass verification.": "รายงานนี้จะผ่านการทวนสอบหรือไม่",
  "Read it before you book a verifier.": "อ่านก่อนนัดผู้ทวนสอบ",
  "Set once": "ตั้งครั้งเดียว",
  "When the monthly request goes out.": "ส่งคำขอรายเดือนเมื่อไร",
  "Match the send day to their month-end.": "ตั้งวันส่งให้ตรงกับวันสิ้นเดือนของเขา",
  "Once a year, if you claim it": "ปีละครั้ง ถ้าคุณขอหัก",
  "Carbon price paid at home.": "ราคาคาร์บอนที่ชำระในประเทศ",
  "Keep the payment receipt.": "เก็บใบเสร็จการชำระไว้",
  "Whether estimates stay under 5 % of the year's emissions.":
    "ค่าประมาณยังต่ำกว่า 5 % ของการปล่อยทั้งปีหรือไม่",
  "Nothing to fill in.": "ไม่ต้องกรอก",

  /* ── Smart Links ───────────────────────────────────────────── */
  "Every request for data, and where it stands.":
    "คำขอข้อมูลทั้งหมด และสถานะของแต่ละคำขอ",
  "A product report gets one link for each month, and one for each precursor supplier.":
    "รายงานผลิตภัณฑ์หนึ่งฉบับมีลิงก์สำหรับแต่ละเดือน และสำหรับผู้ผลิตวัตถุดิบตั้งต้นแต่ละราย",
  "What needs me today": "สิ่งที่ต้องทำวันนี้",
  "Every link.": "ทุกลิงก์",
  "Both kinds.": "ทั้งสองแบบ",
  Request: "คำขอ",
  "No {kind} links are {state}.": "ไม่มีลิงก์ {kind} ในสถานะ {state}",
  "No links are {state}.": "ไม่มีลิงก์ในสถานะ {state}",
  "No {kind} links yet.": "ยังไม่มีลิงก์ {kind}",
  "Clear the filter to see every link.": "ล้างตัวกรองเพื่อดูลิงก์ทั้งหมด",
  "Deadline met": "ส่งทันกำหนด",
  Met: "ทันกำหนด",
  "Open the product report": "เปิดรายงานผลิตภัณฑ์",
  "Send again": "ส่งอีกครั้ง",
  Link: "ลิงก์",
  "No account needed. Send marks it as asked and copies the link — paste it wherever you reach them.":
    "ไม่ต้องมีบัญชี การกดส่งจะบันทึกว่าขอแล้วและคัดลอกลิงก์ นำไปวางในช่องทางที่คุณติดต่อได้เลย",
  "First sent": "ส่งครั้งแรก",
  Chased: "ติดตามแล้ว",
  "{n} times · last {date}": "{n} ครั้ง · ล่าสุด {date}",
  Opened: "เปิดอ่านแล้ว",
  "{n}% answered": "ตอบแล้ว {n}%",
  "Due today": "ครบกำหนดวันนี้",
  "{n} day late": "ล่าช้า {n} วัน",
  "{n} days late": "ล่าช้า {n} วัน",
  "In {n} day": "อีก {n} วัน",
  "In {n} days": "อีก {n} วัน",
  "No contact on file": "ไม่มีข้อมูลติดต่อ",
  "One month of production, fuel and electricity.":
    "การผลิต เชื้อเพลิง และไฟฟ้าของหนึ่งเดือน",
  "A supplier's verified emissions for the whole year.":
    "ค่าการปล่อยที่ผ่านการทวนสอบของซัพพลายเออร์ทั้งปี",
  "Not asked yet. Send it now.": "ยังไม่ได้ขอ ส่งได้เลย",
  "Sent and waiting. Nothing to do yet.": "ส่งแล้วและกำลังรอ ยังไม่ต้องทำอะไร",
  "Past the deadline, still unanswered. Chase it.":
    "เลยกำหนดแล้วและยังไม่มีคำตอบ ควรติดตาม",
  "The month is still running.": "เดือนนี้ยังไม่สิ้นสุด",
  "Copied to your clipboard — paste it wherever you reach them.":
    "คัดลอกลงคลิปบอร์ดแล้ว นำไปวางในช่องทางที่คุณติดต่อได้เลย",
  "Couldn't create the link": "สร้างลิงก์ไม่สำเร็จ",
  "Your own installation — nobody to chase": "โรงงานของคุณเอง — ไม่มีใครให้ติดตาม",
  "Nothing owed": "ไม่มีสิ่งค้างส่ง",

  /* ── Reports ───────────────────────────────────────────────── */
  "One package per site and year. It downloads once everything in it is complete.":
    "หนึ่งชุดต่อโรงงานต่อปี ดาวน์โหลดได้เมื่อทุกอย่างในชุดครบ",
  "A package appears once you create a product report.":
    "ชุดรายงานจะปรากฏเมื่อคุณสร้างรายงานผลิตภัณฑ์",
  "What you send your buyer.": "สิ่งที่คุณส่งให้ผู้ซื้อ",
  "Suppliers' sites": "โรงงานของซัพพลายเออร์",
  "Your evidence for one line of the package. The buyer does not receive these.":
    "หลักฐานของหนึ่งรายการในชุดรายงาน ผู้ซื้อจะไม่ได้รับส่วนนี้",
  "Your free trial leaves the monitoring plan out.":
    "ช่วงทดลองใช้ฟรีไม่รวมแผนการติดตามไว้ในชุดรายงาน",

  /* ── Carbon & Cost ─────────────────────────────────────────── */
  "What your goods carry, against the EU default.":
    "ค่าคาร์บอนในสินค้าของคุณ เทียบกับค่าเริ่มต้นของ EU",
  "This fills in once a product report has one submitted month.":
    "ข้อมูลจะปรากฏเมื่อรายงานผลิตภัณฑ์มีเดือนที่ส่งแล้วอย่างน้อยหนึ่งเดือน",
  "Carry the submitted months across the year at the same rate. An assumption, not a forecast.":
    "ขยายเดือนที่ส่งแล้วไปทั้งปีด้วยอัตราเดิม เป็นสมมติฐาน ไม่ใช่การพยากรณ์",
  "Only for one product part-way through its year.": "ใช้ได้กับผลิตภัณฑ์เดียวที่ปียังไม่จบ",
  "First that has data": "รายการแรกที่มีข้อมูล",
  "Nothing to project from yet": "ยังไม่มีข้อมูลให้ขยายผล",
  "Per tonne: your site, its electricity and the materials you bought.":
    "ต่อตัน: โรงงานของคุณ ไฟฟ้า และวัตถุดิบที่ซื้อมา",
  "Several products selected. Showing the first — per-tonne figures only compare within one product.":
    "เลือกหลายผลิตภัณฑ์ แสดงรายการแรก — ค่าต่อตันเทียบกันได้เฉพาะภายในผลิตภัณฑ์เดียว",
  "No submitted month yet.": "ยังไม่มีเดือนที่ส่งแล้ว",
  "The submitted months could not be worked out. Check Monthly data for missing readings.":
    "คำนวณเดือนที่ส่งแล้วไม่ได้ ตรวจสอบค่าที่ขาดในข้อมูลรายเดือน",
  "One month in. A second gives the lines a direction.":
    "ส่งแล้วหนึ่งเดือน เมื่อมีเดือนที่สอง เส้นจะเริ่มเห็นแนวโน้ม",
  "1 month is not plotted — a reading is missing.":
    "1 เดือนไม่แสดงในกราฟ — ขาดค่าที่อ่านได้",
  "{count} months are not plotted — readings are missing.":
    "{count} เดือนไม่แสดงในกราฟ — ขาดค่าที่อ่านได้",
  "Embedded emissions per tonne, by submitted month, in {unit}.":
    "ค่าการปล่อยแฝงต่อตัน แยกตามเดือนที่ส่งแล้ว หน่วย {unit}",
  "Months without production are left out.": "เดือนที่ไม่มีการผลิตจะไม่แสดง",
  "The precursor line is level: it is declared once for the year.":
    "เส้นวัตถุดิบตั้งต้นเป็นเส้นตรง เพราะรายงานครั้งเดียวต่อปี",
  "Shaded months are not readings. They carry the year-to-date rate forward.":
    "เดือนที่แรเงาไม่ใช่ค่าที่อ่านได้ แต่ใช้อัตราสะสมถึงปัจจุบันต่อไป",
  "All twelve months are in and every precursor is verified.":
    "ส่งครบ 12 เดือนและวัตถุดิบตั้งต้นทุกรายการผ่านการทวนสอบ",
  "All {count} products: twelve months in, precursors verified.":
    "ทั้ง {count} ผลิตภัณฑ์ ส่งครบ 12 เดือนและวัตถุดิบตั้งต้นผ่านการทวนสอบ",
  "{entered} of {possible} months started, none submitted yet.":
    "เริ่มกรอกแล้ว {entered} จาก {possible} เดือน แต่ยังไม่ส่งเดือนใด",
  "No month submitted yet.": "ยังไม่ส่งเดือนใด",
  "{counted} of {possible} months submitted. Part of a year, so not official.":
    "ส่งแล้ว {counted} จาก {possible} เดือน เป็นเพียงบางส่วนของปี จึงยังไม่เป็นทางการ",
  "The year is in, but not every precursor is verified yet.":
    "ส่งครบทั้งปีแล้ว แต่วัตถุดิบตั้งต้นบางรายการยังไม่ผ่านการทวนสอบ",
  "unchanged by scaling": "ไม่เปลี่ยนเมื่อขยายทั้งปี",
  "Not final — 1 precursor still needs a quantity, site or emissions figure.":
    "ยังไม่สุดท้าย — วัตถุดิบตั้งต้น 1 รายการยังขาดปริมาณ โรงงาน หรือค่าการปล่อย",
  "Not final — {count} precursors still need a quantity, site or emissions figure.":
    "ยังไม่สุดท้าย — วัตถุดิบตั้งต้น {count} รายการยังขาดปริมาณ โรงงาน หรือค่าการปล่อย",

  /* ── Supplier month page (smartlink) ───────────────────────── */
  "Clear the form": "ล้างแบบฟอร์ม",
  "Form cleared": "ล้างแบบฟอร์มแล้ว",
  "Press again to clear": "กดอีกครั้งเพื่อล้าง",
  "Was covered": "มีผลครอบคลุมแล้ว",
  "Not sent yet": "ยังไม่ได้ส่ง",
  "Your answers are saved here. Check your connection and submit again.":
    "บันทึกคำตอบของคุณไว้ที่นี่แล้ว ตรวจสอบการเชื่อมต่อแล้วส่งอีกครั้ง",
  "The exporter can see it now.": "ผู้ส่งออกเห็นข้อมูลนี้แล้ว",
  "Request an edit": "ขอแก้ไข",
  "Which processes these figures cover, which meters they come off, and anything you could not measure.":
    "กระบวนการที่ตัวเลขเหล่านี้ครอบคลุม มิเตอร์ที่ใช้อ่าน และสิ่งที่วัดไม่ได้",
  "This month's production, the fuel burned, the electricity drawn and any process emissions.":
    "การผลิตของเดือนนี้ เชื้อเพลิงที่ใช้ ไฟฟ้าที่ใช้ และการปล่อยจากกระบวนการ (ถ้ามี)",
  "The invoices and logs behind the figures.": "ใบแจ้งหนี้และบันทึกที่รองรับตัวเลข",
  "Check and sign": "ตรวจและลงนาม",
  "Everything checks out. Nothing is missing and nothing looks unusual.":
    "ทุกอย่างผ่าน ไม่มีสิ่งที่ขาดและไม่มีสิ่งผิดปกติ",
  "Your final emissions data for the year": "ข้อมูลการปล่อยฉบับสุดท้ายของปีของคุณ",
  "tab.": "แท็บ",
  "{exporter} uses a good you make as an input and has asked for your final, verified figure for the reporting year. One request, answered once — nothing is collected month by month. Please answer":
    "{exporter} ใช้สินค้าที่คุณผลิตเป็นวัตถุดิบ และขอตัวเลขสุดท้ายที่ผ่านการทวนสอบของปีรายงาน ขอครั้งเดียว ตอบครั้งเดียว ไม่เก็บข้อมูลรายเดือน กรุณาตอบ",

  /* ── Cera ──────────────────────────────────────────────────── */
  "Pasted file": "ไฟล์ที่วาง",
  "Cera has to ask": "Cera ต้องถามเพิ่ม",
  "What does the plant fill in each month?": "โรงงานต้องกรอกอะไรบ้างในแต่ละเดือน",
  "Working out where it goes…": "กำลังหาว่าควรอยู่ตรงไหน…",
  "Smart upload is on. Drop one file into the bar below — or choose one — and press send. I'll work out which product report and month it's for and what readings it holds, and ask only what I can't tell.":
    "เปิดสมาร์ทอัพโหลดแล้ว วางหรือเลือกไฟล์หนึ่งไฟล์ในแถบด้านล่างแล้วกดส่ง ฉันจะดูว่าเป็นของรายงานผลิตภัณฑ์และเดือนไหน มีค่าอะไรบ้าง และถามเฉพาะสิ่งที่ยังไม่แน่ใจ",
  "That file isn't open any more — give it to me again with Smart upload and I'll pick up from there.":
    "ไฟล์นั้นปิดไปแล้ว ส่งให้ฉันอีกครั้งด้วยสมาร์ทอัพโหลด แล้วฉันจะทำต่อจากตรงนั้น",

  /* ── Google connection ─────────────────────────────────────── */
  "Couldn't connect Google.": "เชื่อมต่อ Google ไม่สำเร็จ",
  "Couldn't sign you in.": "ลงชื่อเข้าใช้ไม่สำเร็จ",
  "Connecting Google…": "กำลังเชื่อมต่อ Google…",
  "Signing you in…": "กำลังลงชื่อเข้าใช้…",
  "Back to settings": "กลับไปที่การตั้งค่า",
  "This file was read in an earlier version — give it to me again to fill it in.":
    "ไฟล์นี้อ่านไว้ตั้งแต่เวอร์ชันก่อน — ส่งให้ฉันอีกครั้งเพื่อกรอกข้อมูล",
  litres: "ลิตร",
  carbonate: "คาร์บอเนต",
  "Fuel {n}": "เชื้อเพลิง {n}",
  "Source {n}": "แหล่ง {n}",
  "Entry {n}": "รายการ {n}",
  "Steel scrap": "เศษเหล็กกล้า",
  "Iron scrap": "เศษเหล็ก",
  "Aluminium scrap": "เศษอะลูมิเนียม",
  "Remove file": "เอาไฟล์ออก",
  "All changes saved": "บันทึกครบแล้ว",
  "Unsaved changes…": "ยังไม่ได้บันทึก…",
  "Duplicate report": "ทำสำเนารายงาน",
  "Duplicate this report": "ทำสำเนารายงานนี้",
  "Where should the copy go?": "สำเนาจะไปอยู่ที่ไหน",
  "There is already a report for this good at this site in {year}. You can still make the copy — a second one is how a mid-year change is kept apart.":
    "ที่ตั้งนี้มีรายงานของสินค้านี้ในปี {year} อยู่แล้ว ทำสำเนาต่อได้ — ใช้แยกรายงานเมื่อมีการเปลี่ยนแปลงกลางปี",
  "Same good, same CN code — a code you already report costs nothing more.":
    "สินค้าเดิม รหัส CN เดิม — รหัสที่คุณรายงานอยู่แล้วไม่มีค่าใช้จ่ายเพิ่ม",
  "What comes across to {year}": "สิ่งที่คัดลอกไปปี {year}",
  "The good and its CN code": "สินค้าและรหัส CN",
  "Production route and country": "เส้นทางการผลิตและประเทศ",
  "The supplier and the monthly schedule": "ผู้จัดหาและกำหนดการรายเดือน",
  "Methodology answers": "คำตอบวิธีการติดตาม",
  "Fuels, electricity sources and instruments, as a draft you can edit.":
    "เชื้อเพลิง แหล่งไฟฟ้า และอุปกรณ์วัด เป็นฉบับร่างที่แก้ไขได้",
  "This is a different site — check that they fit it.":
    "เป็นที่ตั้งอื่น — ตรวจว่าใช้ได้กับที่ตั้งนี้",
  "Left behind: the monthly figures, documents and sign-offs. They belong to the year they describe.":
    "ที่ไม่คัดลอก: ตัวเลขรายเดือน เอกสาร และการลงนาม เพราะเป็นของปีนั้น",
  "Copy created": "สร้างสำเนาแล้ว",
  "Open and ready for {year}.": "เปิดแล้ว พร้อมสำหรับปี {year}",
  "Create copy": "สร้างสำเนา",
  "I read your documents for this month and fill them in.":
    "ฉันอ่านเอกสารของเดือนนี้แล้วกรอกให้",
  "Enter 0 if there is none.": "ถ้าไม่มีให้ใส่ 0",
  "Combined share of any alloying elements not covered by Mn/Cr/Ni above. Enter 0 if there is none.":
    "ส่วนรวมของธาตุผสมอื่นที่ไม่ใช่ Mn, Cr, Ni ข้างบน ถ้าไม่มีให้ใส่ 0",
  "Over the year. Your monthly scrap figures give it; enter the annual one here if you keep it. Enter 0 if you use none.":
    "เฉลี่ยทั้งปี ตัวเลขเศษโลหะรายเดือนของคุณให้ค่านี้อยู่แล้ว ถ้ามีตัวเลขรายปีก็ใส่ที่นี่ได้ ถ้าไม่ใช้เศษโลหะเลยให้ใส่ 0",
  "Over the year, for this good — including the steel you buy in. Leave it empty and Certrace works it out from your monthly scrap and your precursors' own figures. Enter 0 if you use none.":
    "เฉลี่ยทั้งปีของสินค้านี้ รวมเหล็กที่ซื้อมาด้วย ถ้าเว้นว่าง Certrace จะคำนวณจากเศษโลหะรายเดือนและตัวเลขของวัตถุดิบตั้งต้นให้ ถ้าไม่ใช้เศษโลหะเลยให้ใส่ 0",
  "Pre-consumer scrap is offcuts, trimmings and rejects from another manufacturer's production. Scrap that goes straight back into the process it came from is not counted. Post-consumer scrap comes from end-of-life products such as scrapped vehicles or appliances.":
    "เศษโลหะก่อนการบริโภคคือเศษตัด เศษขอบ และของเสียจากการผลิตของผู้ผลิตรายอื่น เศษที่วนกลับเข้ากระบวนการเดิมของมันไม่นับ ส่วนเศษโลหะหลังการบริโภคมาจากผลิตภัณฑ์ที่หมดอายุการใช้งาน เช่น รถหรือเครื่องใช้ไฟฟ้าที่ทิ้งแล้ว",
  "Steel: the Mn/Cr/Ni and other alloy percentages, the scrap per tonne and its pre-consumer share; for pig iron and direct reduced iron, the main reducing agent.":
    "เหล็ก: เปอร์เซ็นต์ Mn, Cr, Ni และธาตุผสมอื่น เศษโลหะต่อตัน และส่วนที่เป็นเศษก่อนการบริโภค ส่วนเหล็กดิบและเหล็กรีดิวซ์โดยตรงให้ระบุตัวรีดิวซ์หลัก",
  "A product made from steel or aluminium you buy in takes its scrap from that metal's own figures when it is on actual values; otherwise enter the total for the good.":
    "ผลิตภัณฑ์ที่ทำจากเหล็กหรืออะลูมิเนียมที่ซื้อมา จะใช้ตัวเลขเศษโลหะของโลหะนั้นเมื่อเป็นค่าจริง ถ้าไม่ใช่ให้ใส่ยอดรวมของสินค้าเอง",
  "No electricity source recorded. It is optional for this good — only direct emissions count for it. Add it if you have it.":
    "ยังไม่มีแหล่งไฟฟ้า สินค้านี้ไม่บังคับ เพราะนับเฉพาะการปล่อยทางตรง ถ้ามีข้อมูลก็เพิ่มได้",
  "No electricity is entered for this month. It is not part of this good's embedded emissions — only direct emissions count for it — so it does not hold the month back, but the report lists it and a verifier may ask. Enter it if you have it.":
    "เดือนนี้ยังไม่ได้ใส่ไฟฟ้า ไฟฟ้าไม่รวมอยู่ในการปล่อยแฝงของสินค้านี้ เพราะนับเฉพาะการปล่อยทางตรง จึงไม่ขัดการส่งเดือนนี้ แต่รายงานจะแสดงค่านี้และผู้ทวนสอบอาจถาม ถ้ามีข้อมูลก็ใส่ได้",
  "{name} has no production counted yet, so it has no embedded emissions to carry.":
    "{name} ยังไม่มีปริมาณการผลิตที่นับแล้ว จึงยังไม่มีการปล่อยแฝงให้ส่งต่อ",
  "In the monthly readings of each product report":
    "ในข้อมูลรายเดือนของรายงานผลิตภัณฑ์แต่ละฉบับ",
  "Documents in this index": "เอกสารในดัชนีนี้",
  "{a} uses {b} t of {c}, made at this installation.":
    "{a} ใช้ {c} {b} ตัน ซึ่งผลิตที่โรงงานนี้",
  "Annex II point A.5 (elements 1 to 22) · Annex IV point 2, Implementing Regulation (EU) 2025/2547":
    "ภาคผนวก II ข้อ A.5 (องค์ประกอบที่ 1 ถึง 22) · ภาคผนวก IV ข้อ 2 ของ Implementing Regulation (EU) 2025/2547",
  "Annex IV point 1.1, Implementing Regulation (EU) 2025/2547 — items 1 to 35":
    "ภาคผนวก IV ข้อ 1.1 ของ Implementing Regulation (EU) 2025/2547 — รายการที่ 1 ถึง 35",
  "Annex IV point 1.2, Implementing Regulation (EU) 2025/2547 — items 1 to 16":
    "ภาคผนวก IV ข้อ 1.2 ของ Implementing Regulation (EU) 2025/2547 — รายการที่ 1 ถึง 16",
  "Annex IV point 1.1.1, Implementing Regulation (EU) 2025/2547":
    "ภาคผนวก IV ข้อ 1.1.1 ของ Implementing Regulation (EU) 2025/2547",
  "Annex II point A.1(4) and recital 18, Implementing Regulation (EU) 2025/2547 · verification report template, Implementing Regulation (EU) 2025/2546":
    "ภาคผนวก II ข้อ A.1(4) และข้อพิจารณา 18 ของ Implementing Regulation (EU) 2025/2547 · แบบรายงานการทวนสอบ ตาม Implementing Regulation (EU) 2025/2546",
  "Annex II points A.5(22)(h), D.2.4 and D.4.3, Implementing Regulation (EU) 2025/2547":
    "ภาคผนวก II ข้อ A.5(22)(h), D.2.4 และ D.4.3 ของ Implementing Regulation (EU) 2025/2547",
  "of which pre-consumer": "ในนั้นเป็นเศษก่อนการบริโภค",
  "pre-consumer": "ก่อนการบริโภค",
  "% pre-consumer scrap": "% เศษโลหะก่อนการบริโภค",
  "Pre-consumer scrap": "เศษโลหะก่อนการบริโภค",
  "Pre-consumer (offcuts, runaround, from manufacturing)":
    "ก่อนการบริโภค (เศษตัดและของเสียจากกระบวนการผลิต)",
  "Post-consumer (end of life)": "หลังการบริโภค (สินค้าหมดอายุการใช้งาน)",
  "Fuel {n} — not named yet": "เชื้อเพลิงที่ {n} — ยังไม่ได้ระบุชื่อ",
  "These are the facts a verifier asks for about a producing site. Entered once here, reused by every product report.":
    "ข้อมูลเหล่านี้คือสิ่งที่ผู้ตรวจสอบถามเกี่ยวกับสถานที่ผลิต กรอกที่นี่ครั้งเดียว แล้วทุกรายงานผลิตภัณฑ์จะนำไปใช้ซ้ำ",
  "product reports on their plants": "รายงานผลิตภัณฑ์บนโรงงานของเขา",
  "A product report is scoped to a plant, so until one is added there is nothing to ask them for. Open a supplier and add the plant that makes your good.":
    "รายงานผลิตภัณฑ์ผูกกับโรงงาน จึงยังไม่มีสิ่งใดให้ขอจนกว่าจะเพิ่มโรงงาน เปิดซัพพลายเออร์แล้วเพิ่มโรงงานที่ผลิตสินค้าของคุณ",
  "Product report · period": "รายงานผลิตภัณฑ์ · รอบรายงาน",
  "No precursor suppliers yet — they are added from a product report's Supply Chain — Precursor Tree.":
    "ยังไม่มีซัพพลายเออร์วัตถุดิบตั้งต้น เพิ่มได้จากห่วงโซ่อุปทานของรายงานผลิตภัณฑ์ ในส่วนผังวัตถุดิบตั้งต้น",
  "No installations recorded for this supplier yet. A product report is scoped to a plant, so until one exists there is nothing to ask them for.":
    "ยังไม่ได้บันทึกสถานประกอบการของซัพพลายเออร์รายนี้ รายงานผลิตภัณฑ์ผูกกับโรงงาน จึงยังไม่มีสิ่งใดให้ขอจนกว่าจะมีสถานประกอบการ",
  "No goods are being verified at this supplier yet. Create a product report for one of their plants and its twelve months start here.":
    "ยังไม่มีสินค้าใดอยู่ระหว่างการตรวจสอบรับรองที่ซัพพลายเออร์รายนี้ สร้างรายงานผลิตภัณฑ์สำหรับโรงงานของเขาสักแห่ง แล้วสิบสองเดือนจะเริ่มต้นที่นี่",
  "Nothing sent yet. Open the product report's Monthly data tab and send a month to start the trail.":
    "ยังไม่ได้ส่งอะไรไป เปิดแท็บข้อมูลรายเดือนของรายงานผลิตภัณฑ์ แล้วส่งสักเดือนเพื่อเริ่มบันทึกร่องรอย",
  "One document per good, built from what this supplier has actually sent you. Generated on download rather than stored, so it always says what the product report says today.":
    "หนึ่งเอกสารต่อหนึ่งสินค้า สร้างจากข้อมูลที่ซัพพลายเออร์รายนี้ส่งมาจริง โดยสร้างตอนดาวน์โหลดแทนการจัดเก็บไว้ เอกสารจึงตรงกับข้อมูลในรายงานผลิตภัณฑ์ ณ วันนี้เสมอ",
  "Search archived product reports…": "ค้นหารายงานที่เก็บถาวร…",
  "Search archived product reports": "ค้นหารายงานที่เก็บถาวร",
  "Search product reports": "ค้นหารายงาน",
  "Show archived product reports — off the dashboard, out of the Inbox, not counted in Reports. Nothing is deleted.":
    "แสดงรายการที่เก็บถาวร — ไม่แสดงในแดชบอร์ด ไม่อยู่ในกล่องงาน และไม่นับในรายงาน ไม่มีอะไรถูกลบ",
  "It is waiting at the top of your verification product reports.":
    "อยู่บนสุดของรายการรายงานผลิตภัณฑ์ของคุณ",
  "Product report created": "สร้างรายงานผลิตภัณฑ์แล้ว",
  "A product report covers one producing installation. Often that is your own plant — an exporter who rolls their own coil is the supplier too.":
    "รายงานผลิตภัณฑ์หนึ่งชุดครอบคลุมสถานประกอบการผู้ผลิตหนึ่งแห่ง ซึ่งบ่อยครั้งคือโรงงานของคุณเอง ผู้ส่งออกที่รีดคอยล์เองก็เป็นซัพพลายเออร์ด้วย",
  "The type tag on each row is what decides the shape of the rest of the product report: a precursor has nothing above it, a finished product carries precursors.":
    "ป้ายประเภทในแต่ละแถวกำหนดรูปแบบของส่วนที่เหลือ: วัตถุดิบตั้งต้นไม่มีอะไรอยู่เหนือมัน ส่วนผลิตภัณฑ์สำเร็จรูปมีวัตถุดิบตั้งต้น",
  "It is declared once per product report: a route that changes mid-year is a re-baseline, and that is a second product report.":
    "ประกาศครั้งเดียวต่อหนึ่งรายงานผลิตภัณฑ์ หากกระบวนการผลิตเปลี่ยนกลางปี ถือเป็นการตั้งฐานใหม่ ซึ่งต้องใช้รายงานผลิตภัณฑ์อีกชุดหนึ่ง",
  "The product report covers 1 January to 31 December of this year.":
    "รายงานผลิตภัณฑ์นี้ครอบคลุมตั้งแต่ 1 มกราคม ถึง 31 ธันวาคมของปีนี้",
  "What you choose is the last date the data may be sent. You can change it later in the product report’s Settings tab, and months already sent keep the date they went out with.":
    "สิ่งที่คุณเลือกคือวันสุดท้ายที่ส่งข้อมูลได้ เปลี่ยนภายหลังได้ในแท็บการตั้งค่าของรายงานผลิตภัณฑ์ ส่วนเดือนที่ส่งไปแล้วจะคงวันที่เดิมที่ส่งออกไป",
  "Product report archived": "เก็บรายงานผลิตภัณฑ์เข้าคลังแล้ว",
  "Archive this product report": "เก็บรายงานผลิตภัณฑ์นี้เข้าคลัง",
  "on the Verification page.": "ในหน้าการทวนสอบ",
  "Archive product report": "เก็บรายงานผลิตภัณฑ์เข้าคลัง",
  "Everything a member can do, plus billing, seats and deleting product reports. There is always exactly one.":
    "ทำได้ทุกอย่างเหมือนสมาชิก และเพิ่มการเรียกเก็บเงิน สิทธิ์ใช้งาน และการลบรายงานผลิตภัณฑ์ มีได้เพียงหนึ่งคนเสมอ",
  "Build and manage product reports, fill months in, chase suppliers.":
    "สร้างและจัดการรายงานผลิตภัณฑ์ กรอกข้อมูลรายเดือน และติดตามซัพพลายเออร์",
  "Build and manage product reports.": "สร้างและจัดการรายงานผลิตภัณฑ์",
  "They join your team and take a seat. You can hand them a month to review from that month's screen in any product report.":
    "เขาจะเข้าร่วมทีมของคุณและใช้สิทธิ์ใช้งานหนึ่งที่นั่ง คุณมอบหมายเดือนให้เขาตรวจทานได้จากหน้าของเดือนนั้นในรายงานผลิตภัณฑ์ใดก็ได้",
  "They join your team roster and take a seat. Hand them their first month to review from any product report.":
    "เขาจะเข้าร่วมรายชื่อทีมของคุณและใช้สิทธิ์ใช้งานหนึ่งที่นั่ง มอบหมายเดือนแรกให้เขาตรวจทานได้จากรายงานผลิตภัณฑ์ใดก็ได้",
  "Product report links are personal to one installation and one reporting year. Ask the exporter who contacted you to resend it.":
    "ลิงก์รายงานผลิตภัณฑ์เป็นลิงก์เฉพาะของสถานประกอบการหนึ่งแห่งและปีรายงานหนึ่งปี กรุณาขอให้ผู้ส่งออกที่ติดต่อคุณส่งลิงก์ใหม่",
  "Open this installation's own product report — its months, its MMD and its readiness are this product's report.":
    "เปิดรายงานผลิตภัณฑ์ของสถานประกอบการนี้ — ข้อมูลรายเดือน MMD และความพร้อมของที่นี่คือรายงานของสินค้านี้",
  "Open the product report already open for this precursor.":
    "เปิดรายงานผลิตภัณฑ์ที่เปิดไว้แล้วสำหรับวัตถุดิบตั้งต้นนี้",
  "Open a product report for this precursor — same months, MMD and readiness as your own, pre-filled with what this row already knows.":
    "เปิดรายงานผลิตภัณฑ์สำหรับวัตถุดิบตั้งต้นนี้ — มีข้อมูลรายเดือน MMD และความพร้อมเหมือนของคุณเอง พร้อมกรอกข้อมูลที่แถวนี้มีอยู่แล้วให้ล่วงหน้า",
  "Your own site is the installation a verifier will scope against. Register it once and every product report reuses it.":
    "สถานที่ของคุณเองคือสถานประกอบการที่ผู้ตรวจสอบจะใช้กำหนดขอบเขต ลงทะเบียนเพียงครั้งเดียว แล้วทุกรายงานผลิตภัณฑ์จะนำไปใช้ซ้ำ",
  "Two sites cannot share a reference: every product report, shipment and document points at this id, and a duplicate would attach one plant’s year of data to another. To change a site you have already added, open it from Settings → Installations rather than re-entering it here.":
    "สองสถานที่ใช้รหัสอ้างอิงเดียวกันไม่ได้ เพราะทุกรายงานผลิตภัณฑ์ ทุกรายการจัดส่ง และทุกเอกสารชี้มาที่รหัสนี้ หากซ้ำกันจะทำให้ข้อมูลทั้งปีของโรงงานหนึ่งไปผูกกับอีกโรงงานหนึ่ง หากต้องการแก้ไขสถานที่ที่เพิ่มไว้แล้ว ให้เปิดจากการตั้งค่า → สถานประกอบการ แทนการกรอกใหม่ที่นี่",
  "This product report isn't set up yet": "ยังตั้งค่ารายงานผลิตภัณฑ์นี้ไม่เสร็จ",
  "Not applicable to this product report right now.":
    "ยังไม่เกี่ยวข้องกับรายงานผลิตภัณฑ์นี้ในขณะนี้",
  "Product report sections": "ส่วนต่าง ๆ ของรายงานผลิตภัณฑ์",
  "Product report restored": "กู้คืนรายงานผลิตภัณฑ์แล้ว",
  "Open product report": "เปิดรายงานผลิตภัณฑ์",
  "Restore product report": "กู้คืนรายงานผลิตภัณฑ์",
  "Product reports blocked": "รายงานผลิตภัณฑ์ที่ติดขัด",
  "Product reports with an overdue item": "รายงานผลิตภัณฑ์ที่มีรายการเลยกำหนด",
  "Waiting on a product-report-level calculation.":
    "รอผลการคำนวณระดับรายงานผลิตภัณฑ์",
  "A trust score exists for declarations, but it reads a declaration’s supplier-review rollup — a product report has no equivalent. Rather than invent a second, differently-defined score for this page, this widget stays empty until one calculation covers both.":
    "คะแนนความน่าเชื่อถือมีอยู่สำหรับการสำแดง แต่คำนวณจากผลรวมการตรวจทานซัพพลายเออร์ของการสำแดง ซึ่งรายงานผลิตภัณฑ์ไม่มีค่าเทียบเท่า แทนที่จะสร้างคะแนนชุดที่สองที่นิยามต่างกันสำหรับหน้านี้ ส่วนนี้จะว่างไว้จนกว่าจะมีการคำนวณชุดเดียวที่ครอบคลุมทั้งสองแบบ",
  "Your product report": "รายงานผลิตภัณฑ์ของคุณ",
  "No product reports yet.": "ยังไม่มีรายงานผลิตภัณฑ์",
  "No requests yet. They appear here the moment a product report asks for its first month.":
    "ยังไม่มีคำขอ รายการจะปรากฏที่นี่ทันทีที่รายงานผลิตภัณฑ์ขอข้อมูลเดือนแรก",
  "This composition may qualify as high alloy steel rather than non-alloy steel — confirm the CN code and aggregated goods category are still correct for this product report.":
    "ส่วนผสมนี้อาจเข้าข่ายเหล็กกล้าผสมสูงมากกว่าเหล็กกล้าไม่ผสม โปรดยืนยันว่า CN code และ aggregated goods category ยังถูกต้องสำหรับรายงานผลิตภัณฑ์นี้",
  "Product report not found.": "ไม่พบ workspace",
  "This document belongs to a supplier's data request, not to this product report's checklist.":
    "เอกสารนี้เป็นของคำขอข้อมูลถึงซัพพลายเออร์ ไม่ได้อยู่ใน checklist ของงานนี้",
  "The window every figure in this product report belongs to. It is the calendar year, and it does not stretch to cover a change in how you produce.":
    "ช่วงเวลาที่ทุกตัวเลขในรายงานผลิตภัณฑ์นี้สังกัดอยู่ ซึ่งคือปีปฏิทิน และไม่สามารถยืดออกเพื่อคร่อมการเปลี่ยนวิธีผลิตได้",
  "A report has been asked for — a Smart Link is out, or a product report is open for this entity.":
    "ขอรายงานไปแล้ว โดยส่งสมาร์ทลิงค์ออกไป หรือเปิดรายงานผลิตภัณฑ์ให้รายการนี้แล้ว",
  "Being filled in — by the supplier on their link, or by you in the product report.":
    "กำลังกรอกข้อมูล ไม่ว่าจะโดยซัพพลายเออร์ผ่านลิงก์ของเขา หรือโดยคุณในรายงานผลิตภัณฑ์",
  "Share of this product report's applicable readiness tabs that are complete. Descriptive only — never a gate to submission.":
    "สัดส่วนแท็บความพร้อมที่เกี่ยวข้องของรายงานผลิตภัณฑ์นี้ที่เสร็จสมบูรณ์ เป็นข้อมูลเชิงพรรณนาเท่านั้น ไม่ได้ใช้เป็นเงื่อนไขกั้นการส่ง",
  "No installation record is attached to this product report.":
    "ยังไม่มีบันทึกข้อมูลสถานประกอบการผูกกับรายงานผลิตภัณฑ์นี้",
  "This precursor has no product report of its own yet. Track a report for it and its own months, readiness and settings open here.":
    "วัตถุดิบตั้งต้นนี้ยังไม่มีรายงานผลิตภัณฑ์ของตนเอง กดติดตามรายงานให้รายการนี้ แล้วข้อมูลรายเดือน ความพร้อม และการตั้งค่าของมันจะเปิดขึ้นที่นี่",
  "builds product reports and fills months in":
    "สร้างรายงานผลิตภัณฑ์และกรอกข้อมูลรายเดือน",
  "No production data has been entered for this product report yet.":
    "ยังไม่มีการกรอกข้อมูลการผลิตในรายงานผลิตภัณฑ์นี้",
  "Create product report": "สร้างรายงานผลิตภัณฑ์",
  "{a} uses {b} t of {c}": "{a} ใช้ {c} {b} ตัน",
  "G J Steel is overdue": "G J Steel เลยกำหนดส่ง",
  "CBAM Q2 2026 · 9 days no response":
    "CBAM ไตรมาส 2 ปี 2026 · ไม่มีการตอบกลับ 9 วัน",
  "Legal sign-off requested": "ขอให้ฝ่ายกฎหมายลงนามรับรอง",
  "Krit Legal Partners notified": "แจ้ง Krit Legal Partners แล้ว",
  "Q1 2026 package accepted": "แพ็กเกจไตรมาส 1 ปี 2026 ได้รับการยอมรับแล้ว",
  "EU importer confirmed receipt": "ผู้นำเข้าใน EU ยืนยันว่าได้รับแล้ว",
  "New sign-in from Chrome on macOS": "เข้าสู่ระบบใหม่จาก Chrome บน macOS",
  "Bangkok, TH · if this wasn't you, secure your account":
    "กรุงเทพฯ ประเทศไทย · ถ้าไม่ใช่คุณ ให้รีบรักษาความปลอดภัยของบัญชี",
  "Thai Metal Pro submitted their form": "Thai Metal Pro ส่งแบบฟอร์มแล้ว",
  "64% → 100% complete · ready to review": "ครบ 64% → 100% · พร้อมให้ตรวจ",
  "EUDR coverage is opening soon": "ขอบเขต EUDR จะเปิดเร็ว ๆ นี้",
  "Join the waitlist from Coverage": "เข้าคิวรอได้ที่หน้าขอบเขต",
  "2h ago": "2 ชม. ที่แล้ว",
  "1d ago": "1 วันที่แล้ว",
  "3d ago": "3 วันที่แล้ว",
  "4d ago": "4 วันที่แล้ว",
  "5d ago": "5 วันที่แล้ว",
  "1w ago": "1 สัปดาห์ที่แล้ว",
  "Version {n}, finalised {date}": "ฉบับที่ {n} สรุปเมื่อ {date}",
  "Ferro-manganese: Mn 78%, carbon 6.5%": "เฟอร์โรแมงกานีส: Mn 78% คาร์บอน 6.5%",
  "Version 1, finalised 12 January 2026": "ฉบับที่ 1 สรุปเมื่อ 12 มกราคม 2026",
  "not named yet": "ยังไม่ได้ระบุชื่อ",
  "Fuel 1": "เชื้อเพลิงที่ 1",
  "Fuel 2": "เชื้อเพลิงที่ 2",
  "Fuel 3": "เชื้อเพลิงที่ 3",
  "Fuel 4": "เชื้อเพลิงที่ 4",
  "Fuel 5": "เชื้อเพลิงที่ 5",
  "Fuel 6": "เชื้อเพลิงที่ 6",
  "Fuel 7": "เชื้อเพลิงที่ 7",
  "Fuel 8": "เชื้อเพลิงที่ 8",
  "Fuel 9": "เชื้อเพลิงที่ 9",
  "Fuel 10": "เชื้อเพลิงที่ 10",
  "Fuel 11": "เชื้อเพลิงที่ 11",
  "Fuel 12": "เชื้อเพลิงที่ 12",
  "About default values": "เรื่องค่า default",
  "A default is the EU's cautious figure: it carries a +{markup}% mark-up this year, and the highest country value if the origin is unknown. A direct precursor carries most of a product's emissions, so a default can raise your total — even above the finished good's own default. A verified actual value from the precursor's site is often lower.":
    "ค่า default คือตัวเลขแบบระมัดระวังของ EU: ปีนี้บวกเพิ่ม +{markup}% และถ้าไม่รู้แหล่งผลิตจะใช้ค่าสูงสุดของประเทศ วัตถุดิบตั้งต้นโดยตรงเป็นส่วนใหญ่ของการปล่อยของสินค้า ค่า default จึงอาจดันยอดรวมของคุณขึ้น แม้เกินค่า default ของสินค้าสำเร็จรูปเอง ค่าจริงที่ผ่านการทวนสอบจากโรงงานของวัตถุดิบตั้งต้นมักต่ำกว่า",
  "Today the precursors add {a} tCO₂e per tonne{share}; the finished good's EU default is {b}.":
    "ตอนนี้วัตถุดิบตั้งต้นเพิ่ม {a} tCO₂e ต่อตัน{share} ส่วนค่า default ของ EU สำหรับสินค้าสำเร็จรูปคือ {b}",
  "{p} of it on default values": "{p} ใช้ค่า default",
  "The precursors alone already reach that default. Get an actual value for the largest one, or use the finished good's own default instead.":
    "วัตถุดิบตั้งต้นอย่างเดียวก็ถึงค่า default นั้นแล้ว ควรหาค่าจริงของตัวใหญ่สุด หรือใช้ค่า default ของสินค้าสำเร็จรูปแทน",
  "Using the default value for now": "ตอนนี้ใช้ค่า default",
  "An actual value replaces it once the precursor's data and a verification report covering the period are in.":
    "ค่าจริงจะมาแทนเมื่อมีข้อมูลของวัตถุดิบตั้งต้นและรายงานการทวนสอบที่ครอบคลุมช่วงเวลานั้น",
  "Fuel consumption": "การใช้เชื้อเพลิง",
  "Fuel delivered": "เชื้อเพลิงที่รับเข้า",
  "CO₂ concentration in the flue gas": "ความเข้มข้น CO₂ ในก๊าซไอเสีย",
  "Flue gas flow": "อัตราการไหลของก๊าซไอเสีย",
  "Electricity generated on site": "ไฟฟ้าที่ผลิตในโรงงาน",
  "Electricity exported": "ไฟฟ้าที่ส่งออก",
  "Other — name it": "อื่น ๆ — ระบุชื่อ",
  "Say what it measures": "ระบุว่าวัดอะไร",
  "A default is the EU's cautious figure: +{markup}% mark-up this year, and the highest country value if the origin is unknown. A direct precursor carries most of a product's emissions, so it can raise your total. A verified actual value is often lower.":
    "ค่า default คือค่าระมัดระวังของ EU: ปีนี้บวกเพิ่ม +{markup}% และถ้าไม่รู้แหล่งผลิตจะใช้ค่าสูงสุดของประเทศ วัตถุดิบตั้งต้นโดยตรงเป็นส่วนใหญ่ของการปล่อยของสินค้า จึงอาจดันยอดรวมของคุณขึ้น ค่าจริงที่ผ่านการทวนสอบมักต่ำกว่า",
  "Annex IV items 2 to 6.": "Annex IV ข้อ 2 ถึง 6",
  "Fill this in.": "กรอกส่วนนี้",
  "Everything is filled in. Carry on to sign it off.":
    "กรอกครบทุกส่วนแล้ว ไปขั้นตอนลงนามได้เลย",
  "Ready to submit. 1 more thing is worth adding.":
    "ส่งได้แล้ว และยังมี 1 อย่างที่ควรเพิ่ม",
  "Ready to submit. {n} more things are worth adding.":
    "ส่งได้แล้ว และยังมี {n} อย่างที่ควรเพิ่ม",
  "This month’s data": "ข้อมูลของเดือนนี้",
  "Every part of the month, and whether it is filled in yet. Tap a row to go to it.":
    "ทุกส่วนของเดือนนี้และสถานะการกรอก แตะแถวเพื่อไปที่ช่องนั้น",
  "Can be submitted": "ส่งได้แล้ว",
  "Add if you can": "เพิ่มได้ก็ดี",
  "Authorisation history": "ประวัติการอนุมัติภายใน",
  "Only the months the exporter has sent you can be opened.":
    "เปิดได้เฉพาะเดือนที่ผู้ส่งออกส่งให้คุณแล้ว",
  "Boundary description": "คำอธิบายขอบเขต",
  "Processes inside the boundary": "กระบวนการภายในขอบเขต",
  "Fuels burned in the year": "เชื้อเพลิงที่ใช้ในปีนี้",
  "Electricity source": "แหล่งไฟฟ้า",
  "Electricity metering point": "จุดวัดไฟฟ้า",
  "Instruments that measure the fuels": "เครื่องมือวัดเชื้อเพลิง",
  "Meter the electricity is read from": "มิเตอร์ที่ใช้อ่านค่าไฟฟ้า",
  "Production for the month": "ปริมาณผลิตของเดือน",
  "Fuel burned this month": "เชื้อเพลิงที่ใช้ในเดือนนี้",
  "Electricity consumed this month": "ไฟฟ้าที่ใช้ในเดือนนี้",
  "Documents behind the figures": "เอกสารรองรับตัวเลข",
  "No fuel is recorded. If the plant burned nothing, say so in the notes — a verifier will ask.":
    "ยังไม่มีเชื้อเพลิงที่บันทึกไว้ หากโรงงานไม่ได้ใช้เชื้อเพลิง ให้ระบุในหมายเหตุ เพราะผู้ตรวจสอบจะถาม",
  "Nothing is attached yet. Add the utility invoice, the fuel delivery notes and the production log.":
    "ยังไม่ได้แนบเอกสาร ควรแนบใบแจ้งหนี้ค่าสาธารณูปโภค ใบส่งมอบเชื้อเพลิง และบันทึกการผลิต",
  "Precursor data": "ข้อมูลวัตถุดิบตั้งต้น",
  "A precursor supplier's verified emissions for the whole year.":
    "ค่าการปล่อยที่ผ่านการทวนสอบของซัพพลายเออร์วัตถุดิบตั้งต้นทั้งปี",
  View: "ดู",
  "Take back": "ยกเลิกรายการ",
  "No production": "ไม่มีการผลิต",
  Exporter: "ผู้ส่งออก",
  "Clear and mark": "ล้างข้อมูลและบันทึก",
  "Nothing was made this month.": "เดือนนี้ไม่มีการผลิต",
  "Take this back — the month returns to not started":
    "ยกเลิกรายการนี้ — เดือนนี้จะกลับเป็นยังไม่เริ่ม",
  "This clears what was typed for the month. Press again to confirm.":
    "การกดนี้จะล้างข้อมูลที่กรอกไว้ของเดือนนี้ กดอีกครั้งเพื่อยืนยัน",
  "Record that nothing was made this month — no data is asked for":
    "บันทึกว่าเดือนนี้ไม่มีการผลิต — จะไม่ขอข้อมูลใด ๆ",
  "No production this month": "เดือนนี้ไม่มีการผลิต",
  "You recorded that nothing was made in {month}. The plant is not asked for it, it counts as answered, and it adds no tonnes and no emissions to the year.":
    "คุณบันทึกว่า {month} ไม่มีการผลิต โรงงานจะไม่ถูกขอข้อมูลเดือนนี้ เดือนนี้นับว่าตอบแล้ว และไม่เพิ่มปริมาณหรือการปล่อยให้ปีนี้",
  "Undo — the plant did produce": "ยกเลิก — โรงงานมีการผลิตจริง",
  "What the plant is asked for": "ข้อมูลที่ขอจากโรงงาน",
  "Every part of this month and whether it is filled in. Tap a row to go to it — you can fill any of it in for them.":
    "ทุกส่วนของเดือนนี้และสถานะการกรอก แตะแถวเพื่อไปที่ช่องนั้น คุณกรอกแทนโรงงานได้ทุกช่อง",
  "On top, what the plant is asked for. Below it, what has been entered — fill in anything for them, or change it. It is the same form they answer on their link.":
    "ด้านบนคือข้อมูลที่ขอจากโรงงาน ด้านล่างคือข้อมูลที่กรอกไว้ กรอกแทนหรือแก้ไขได้ทุกช่อง เป็นแบบฟอร์มเดียวกับที่โรงงานตอบในลิงก์",
  "The exporter recorded no production in {month}.":
    "ผู้ส่งออกบันทึกว่า {month} ไม่มีการผลิต",
  "Nothing is needed from you for this month. If the plant did produce, ask the exporter to reopen it — the button at the foot of this page sends the request, and they decide.":
    "เดือนนี้ไม่ต้องกรอกอะไร หากโรงงานมีการผลิตจริง ให้ขอให้ผู้ส่งออกเปิดใหม่ — ปุ่มท้ายหน้าจะส่งคำขอ และผู้ส่งออกเป็นผู้ตัดสิน",
  "Check or enter the precursor's data": "ตรวจสอบหรือกรอกข้อมูลวัตถุดิบตั้งต้น",
  "What the precursor sent shows here. Check it, or enter and change anything for them — it is the same form they fill in on their link, and the same checks apply.":
    "ข้อมูลที่ผู้ผลิตวัตถุดิบตั้งต้นส่งมาจะแสดงที่นี่ ตรวจสอบได้ หรือจะกรอกและแก้ไขแทนก็ได้ — เป็นแบบฟอร์มเดียวกับที่เขากรอกในลิงก์ และใช้การตรวจสอบเดียวกัน",
  "The verification report is required: without a report from an accredited verifier that covers this good and the period, the EU's default value is used instead of this figure (Annex II A.1(4) of Implementing Regulation (EU) 2025/2547).":
    "ต้องมีรายงานการทวนสอบ: หากไม่มีรายงานจากผู้ทวนสอบที่ได้รับการรับรองซึ่งครอบคลุมสินค้านี้และช่วงเวลา จะใช้ค่า default ของ EU แทนตัวเลขนี้ (Annex II A.1(4) ของ Implementing Regulation (EU) 2025/2547)",
  "Share of emissions covered (%)": "สัดส่วนการปล่อยที่ครอบคลุม (%)",
  "What share, 0 to 100%, of this good's total specific embedded emissions this instrument actually applies to. If unsure, 100% is rarely correct — check your documentation rather than guessing.":
    "สัดส่วน 0 ถึง 100% ของการปล่อยแฝงรวมของสินค้านี้ที่เครื่องมือนี้ครอบคลุมจริง หากไม่แน่ใจ 100% แทบไม่ใช่คำตอบที่ถูก — ตรวจเอกสารแทนการเดา",
  "Any offset received against the above, in words.":
    "ส่วนชดเชยที่ได้รับสำหรับรายการข้างต้น เขียนเป็นข้อความ",
  "Rebate per tCO₂e ({currency})": "ส่วนลดต่อ tCO₂e ({currency})",
  "The same offset as a figure, so the report can take it off. 0 if there was none.":
    "ส่วนชดเชยเดียวกันนี้ในรูปตัวเลข เพื่อให้รายงานหักออกได้ ใส่ 0 หากไม่มี",
  "Charged under": "จัดเก็บตามกฎหมาย",
  "The law or regulation the price is charged under — Article 9 asks for the reference. Write it in English.":
    "กฎหมายหรือข้อบังคับที่ใช้จัดเก็บราคาคาร์บอน — Article 9 ขอให้อ้างอิงไว้ เขียนเป็นภาษาอังกฤษ",
  "Payment certified by": "ผู้รับรองการชำระเงิน",
  "The independent person who certified the payment records — name and contact. Not someone from your own company.":
    "ผู้ที่เป็นอิสระซึ่งรับรองบันทึกการชำระเงิน ระบุชื่อและช่องทางติดต่อ ต้องไม่ใช่คนในบริษัทของคุณ",
  "The act or regulation, and its article": "ชื่อกฎหมายหรือข้อบังคับ และมาตรา",
  "Auditor name, firm, email": "ชื่อผู้ตรวจสอบ บริษัท อีเมล",
  "To stand as a claim, Article 9 also asks for the law the price is charged under and a payment certified by an independent person. They do not hold this tab back, but the report prints them as not recorded until they are here.":
    "การขอหักลดตาม Article 9 ยังต้องมีกฎหมายที่ใช้จัดเก็บและการรับรองการชำระเงินโดยผู้เป็นอิสระ สองรายการนี้ไม่ได้ขวางแท็บนี้ แต่รายงานจะแสดงว่ายังไม่ได้บันทึกจนกว่าจะกรอก",
  "Add a document & auto-fill": "เพิ่มเอกสารและกรอกอัตโนมัติ",
  "Cera reads a verification statement or emissions summary (text or CSV) and fills in this form. You check every answer before it is kept — Cera can make mistakes.":
    "Cera อ่านหนังสือรับรองการทวนสอบหรือสรุปการปล่อย (ไฟล์ข้อความหรือ CSV) แล้วกรอกแบบฟอร์มนี้ให้ คุณตรวจทุกคำตอบก่อนบันทึก — Cera อาจผิดพลาดได้",
  "I read the documents behind your emissions figure and fill in the form.":
    "ฉันอ่านเอกสารที่รองรับตัวเลขการปล่อยของคุณและกรอกแบบฟอร์มให้",
  "Give me a file — I'll fill in the form": "ส่งไฟล์มา — ฉันจะกรอกแบบฟอร์มให้",
  "Write the date as 2025-12-31.": "เขียนวันที่เป็น 2025-12-31",
  "Enter a value.": "กรอกค่า",
  Currency: "สกุลเงิน",
  "Show made-up figures so you can see the page. Your own data is not touched.":
    "แสดงตัวเลขสมมติให้ดูหน้านี้ ข้อมูลจริงของคุณไม่ถูกแตะต้อง",
  "Sample numbers": "ตัวเลขตัวอย่าง",
  "Sample numbers.": "ตัวเลขตัวอย่าง",
  "Nothing has been submitted yet, so this shows a made-up estate to give you the picture. Your own data is not touched.":
    "ยังไม่มีการส่งข้อมูลเลย จึงแสดงข้อมูลสมมติให้เห็นภาพรวม ข้อมูลจริงของคุณไม่ถูกแตะต้อง",
  "This is a made-up estate. Your own data is not touched.":
    "นี่คือข้อมูลสมมติ ข้อมูลจริงของคุณไม่ถูกแตะต้อง",
  "Use my own data": "ใช้ข้อมูลของฉัน",
  "Preview with sample numbers": "ดูตัวอย่างด้วยตัวเลขสมมติ",
  Analysis: "การวิเคราะห์",
  "What your goods carry, and what that costs: with your own data, and on the EU default.":
    "สินค้าของคุณมีคาร์บอนเท่าไร และต้นทุนเท่าไร ทั้งจากข้อมูลของคุณเองและจากค่า default ของ EU",
  "Every product in view already has its full year.":
    "สินค้าทั้งหมดที่แสดงอยู่มีครบทั้งปีแล้ว",
  "Full-year estimate": "ประมาณการทั้งปี",
  "Nothing has been submitted yet, so this shows made-up figures to give you the picture. Your own data is not touched.":
    "ยังไม่มีการส่งข้อมูลเลย จึงแสดงตัวเลขสมมติให้เห็นภาพ ข้อมูลจริงของคุณไม่ถูกแตะต้อง",
  "These are made-up figures. Your own data is not touched.":
    "นี่คือตัวเลขสมมติ ข้อมูลจริงของคุณไม่ถูกแตะต้อง",
  "All reporting years": "ทุกปีรายงาน",
  "No product report matches these filters.": "ไม่มีรายงานผลิตภัณฑ์ที่ตรงกับตัวกรองนี้",
  "Figures are carried to a full year at this year's rate.":
    "ตัวเลขถูกขยายเป็นทั้งปีตามอัตราของปีนี้",
  "This product in detail": "รายละเอียดของสินค้านี้",
  "Who is in your supply chain, how healthy each part is, and where it worries us.":
    "ใครอยู่ในห่วงโซ่อุปทานของคุณ แต่ละส่วนสุขภาพดีแค่ไหน และตรงไหนน่ากังวล",
  "Send requests": "ส่งคำขอ",
  "Nobody has been asked for anything yet, so this shows a made-up supply chain to give you the picture. Your own data is not touched.":
    "ยังไม่ได้ขอข้อมูลจากใครเลย จึงแสดงห่วงโซ่อุปทานสมมติให้เห็นภาพ ข้อมูลจริงของคุณไม่ถูกแตะต้อง",
  "This is a made-up supply chain. Your own data is not touched.":
    "นี่คือห่วงโซ่อุปทานสมมติ ข้อมูลจริงของคุณไม่ถูกแตะต้อง",
  "Nobody in your supply chain yet": "ยังไม่มีใครในห่วงโซ่อุปทานของคุณ",
  "Plants appear with the first product report, and precursor suppliers when you add them to its chain.":
    "โรงงานจะแสดงเมื่อมีรายงานผลิตภัณฑ์แรก และซัพพลายเออร์วัตถุดิบตั้งต้นจะแสดงเมื่อคุณเพิ่มเข้าในสายโซ่ของรายงาน",
  "Cera Intelligence": "Cera Intelligence",
  "Days to the declaration": "วันที่เหลือก่อนยื่นแสดงรายการ",
  "First CBAM declaration: {date}": "ยื่นแสดงรายการ CBAM ครั้งแรก: {date}",
  "{pct}% of the months your reports carry are submitted":
    "ส่งแล้ว {pct}% ของเดือนในรายงานของคุณ",
  "{n} past the deadline": "{n} เกินกำหนด",
  "Report packages that can go to a verifier": "ชุดรายงานที่ส่งให้ผู้ทวนสอบได้",
  "{n} blocked": "{n} ติดขัด",
  "below the EU default": "ต่ำกว่าค่า default ของ EU",
  "above the EU default": "สูงกว่าค่า default ของ EU",
  "No EU default on file yet": "ยังไม่มีค่า default ของ EU ในระบบ",
  "Certificate cost with your data": "ต้นทุนใบรับรองจากข้อมูลของคุณ",
  "{amount} on the EU default": "{amount} ตามค่า default ของ EU",
  "Needs a certificate price and a year from 2026":
    "ต้องมีราคาใบรับรองและปีตั้งแต่ 2026",
  "Supply chain health": "สุขภาพห่วงโซ่อุปทาน",
  "{n} in your chain, {m} on track": "ในห่วงโซ่ของคุณมี {n} ราย ปกติ {m} ราย",
  "{n} at risk": "{n} มีความเสี่ยง",
  "None at risk": "ไม่มีรายที่เสี่ยง",
  "Emissions against the EU default": "การปล่อยก๊าซเทียบกับค่า default ของ EU",
  "What your goods carry each month, and what the EU would assume for the same tonnes":
    "สินค้าของคุณมีคาร์บอนเท่าไรในแต่ละเดือน และ EU จะสมมติเท่าไรสำหรับปริมาณตันเดียวกัน",
  "Open Carbon & Cost": "เปิดคาร์บอนและต้นทุน",
  charged: "ที่ถูกคิด",
  "Your data": "ข้อมูลของคุณ",
  "Embedded emissions by month against the EU default":
    "การปล่อยก๊าซที่ฝังอยู่รายเดือนเทียบกับค่า default ของ EU",
  "No submitted months to draw yet": "ยังไม่มีเดือนที่ส่งแล้วให้แสดง",
  "{n} item(s) are overdue.": "{n} รายการเลยกำหนด",
  "Your own data saves {amount} against the EU default.":
    "ข้อมูลของคุณเองช่วยประหยัด {amount} เมื่อเทียบกับค่า default ของ EU",
  "Nothing is late and nothing worries me. A good time to look ahead.":
    "ไม่มีอะไรล่าช้าและไม่มีอะไรน่ากังวล เหมาะกับการมองไปข้างหน้า",
  "Who is late and what should I chase first?": "ใครล่าช้า และควรตามใครก่อน",
  "What should I do next?": "ฉันควรทำอะไรต่อ",
  "Which suppliers should I get verified figures from?":
    "ควรขอตัวเลขที่ผ่านการทวนสอบจากซัพพลายเออร์รายใด",
  "What stands out today": "วันนี้มีอะไรน่าสนใจ",
  "Ask about your data…": "ถามเรื่องข้อมูลของคุณ…",
  "How far each report has got": "แต่ละรายงานคืบหน้าไปถึงไหน",
  "By installation and reporting year; the tick is where the year should be by now":
    "แยกตามโรงงานและปีรายงาน ขีดคือจุดที่ปีควรจะถึงแล้ว",
  "Open Verification": "เปิดการทวนสอบ",
  "No report yet.": "ยังไม่มีรายงาน",
  "Package ready to send": "ชุดรายงานพร้อมส่ง",
  "{n} blocked, {m} items holding the package":
    "{n} ติดขัด มี {m} รายการที่ค้างชุดรายงานอยู่",
  "{m} items holding the package": "มี {m} รายการที่ค้างชุดรายงานอยู่",
  "Compliance status": "สถานะการปฏิบัติตามข้อกำหนด",
  "Each part of the filing, across every product report":
    "ทุกส่วนของการยื่น ในรายงานผลิตภัณฑ์ทั้งหมด",
  "{n} of {m} reports complete": "รายงานครบ {n} จาก {m}",
  "Late or about to be, most overdue first":
    "ที่ล่าช้าหรือใกล้ถึงกำหนด เรียงจากเลยกำหนดนานสุด",
  "Dates that matter": "วันสำคัญ",
  "From the CBAM regulation as amended in 2025":
    "จากกฎระเบียบ CBAM ที่แก้ไขในปี 2025",
  "in {n} days": "อีก {n} วัน",
  "Where it worries us": "ตรงไหนที่น่ากังวล",
  "Open Supply Chain": "เปิดห่วงโซ่อุปทาน",
  "Parties in the supply chain by state": "ผู้ที่อยู่ในห่วงโซ่อุปทานแยกตามสถานะ",
  "Nothing worries us in the chain right now.": "ตอนนี้ไม่มีอะไรน่ากังวลในห่วงโซ่",
  "just now": "เมื่อสักครู่",
  "{n}m ago": "{n} นาทีที่แล้ว",
  "{n}h ago": "{n} ชม.ที่แล้ว",
  "{n}d ago": "{n} วันที่แล้ว",
  "The last things that changed across your reports":
    "สิ่งที่เปลี่ยนล่าสุดในรายงานของคุณ",
  "Entries per page": "จำนวนรายการต่อหน้า",
  "entries per page": "รายการต่อหน้า",
  "Pick a prompt below, or just tell me what you need.":
    "เลือกหัวข้อด้านล่าง หรือบอกได้เลยว่าต้องการอะไร",
  "Your numbers": "ตัวเลขของคุณ",
  "Where you stand, what is late, what is open":
    "คุณอยู่ตรงไหน อะไรล่าช้า อะไรยังเปิดอยู่",
  "Need more options? Let me know.": "ต้องการตัวเลือกเพิ่มไหม บอกได้เลย",
  "Ask again": "ถามอีกครั้ง",
  "Cera can make mistakes. Check important information.":
    "Cera อาจผิดพลาดได้ โปรดตรวจสอบข้อมูลสำคัญ",
  "What the cost rests on": "ต้นทุนนี้อิงจากอะไร",
  "Change a price here and every page of the portal uses it":
    "เปลี่ยนราคาตรงนี้แล้วทุกหน้าของพอร์ทัลจะใช้ราคานี้",
  "CBAM certificates start with 2026 imports.":
    "ใบรับรอง CBAM เริ่มตั้งแต่การนำเข้าปี 2026",
  "Free allocation left": "การจัดสรรฟรีที่เหลือ",
  "Default mark-up": "ส่วนบวกเพิ่มของค่า default",
  "Certificate price {year}": "ราคาใบรับรอง {year}",
  "Exchange rate": "อัตราแลกเปลี่ยน",
  "Used to show every euro figure in baht, yuan and rupees.":
    "ใช้แสดงตัวเลขยูโรทั้งหมดเป็นบาท หยวน และรูปี",
  "The cross-sectoral correction factor is taken as 1: the Commission has not published it in the rules this was built from.":
    "ตัวคูณปรับข้ามภาคส่วน (CSCF) ใช้ค่า 1 เพราะคณะกรรมาธิการยังไม่ได้เผยแพร่ไว้ในกฎที่ใช้สร้างระบบนี้",
  "A bought-in precursor's own free allocation is not netted off, so a complex good's cost is never shown lower than it is.":
    "ไม่ได้หักการจัดสรรฟรีของวัตถุดิบตั้งต้นที่ซื้อมา ต้นทุนของสินค้าซับซ้อนจึงไม่เคยแสดงต่ำกว่าความเป็นจริง",
  "{n} product(s) have no EU volume entered, so all the tonnes made are assumed shipped to the EU.":
    "สินค้า {n} รายการยังไม่ได้ใส่ปริมาณส่งไป EU จึงสมมติว่าตันที่ผลิตทั้งหมดส่งไป EU",
  "A carbon price paid at home is recorded for {n} product(s). It is shown as claimed and never subtracted.":
    "บันทึกราคาคาร์บอนที่จ่ายในประเทศไว้สำหรับสินค้า {n} รายการ แสดงเป็นที่อ้างสิทธิ์ และไม่เคยนำไปหักออก",
  "Fuel burned and process emissions": "เชื้อเพลิงที่เผาและการปล่อยจากกระบวนการ",
  "of the total": "ของทั้งหมด",
  "Electricity: reported, not charged for steel and aluminium":
    "ไฟฟ้า: รายงานแต่ไม่คิดเงินสำหรับเหล็กและอะลูมิเนียม",
  "Electricity: counts toward the certificate bill":
    "ไฟฟ้า: นับรวมในค่าใช้จ่ายใบรับรอง",
  "Electricity: charged for some goods, not for others":
    "ไฟฟ้า: คิดเงินกับสินค้าบางอย่าง ไม่คิดกับบางอย่าง",
  "What the bought-in inputs already carry": "สิ่งที่วัตถุดิบที่ซื้อมามีติดมาแล้ว",
  "Nothing bought in carries emissions here": "ไม่มีวัตถุดิบที่ซื้อมาที่มีการปล่อยก๊าซที่นี่",
  "on a default value": "ใช้ค่า default",
  "Cost with your data": "ต้นทุนจากข้อมูลของคุณ",
  "Cost on the EU default": "ต้นทุนตามค่า default ของ EU",
  "What an importer pays when nobody gives them a real figure":
    "ที่ผู้นำเข้าต้องจ่ายเมื่อไม่มีใครให้ตัวเลขจริง",
  "Total embedded": "ฝังอยู่ทั้งหมด",
  "Emissions month by month": "การปล่อยก๊าซรายเดือน",
  "On the tonnes made, against the EU default for the same tonnes":
    "ตามตันที่ผลิต เทียบกับค่า default ของ EU สำหรับตันเดียวกัน",
  "The dark line is what the certificate bill is raised on. Electricity counts only for goods where the rules charge it.":
    "เส้นสีเข้มคือฐานที่ใช้คิดค่าใบรับรอง ไฟฟ้านับเฉพาะสินค้าที่กฎกำหนดให้คิด",
  "The dark line is what the certificate bill is raised on: direct plus precursors, and electricity only where the rules charge it.":
    "เส้นสีเข้มคือฐานที่ใช้คิดค่าใบรับรอง: ทางตรงบวกวัตถุดิบตั้งต้น และไฟฟ้าเฉพาะที่กฎกำหนดให้คิด",
  "Precursors are declared once for the year, so they move with production, not with the month.":
    "วัตถุดิบตั้งต้นแจ้งปีละครั้ง จึงเปลี่ยนตามการผลิต ไม่ใช่ตามเดือน",
  "The shaded months are carried forward at this year's rate, not measured.":
    "เดือนที่แรเงาเป็นค่าที่ขยายตามอัตราปีนี้ ไม่ใช่ค่าที่วัดได้",
  "What your data saves": "ข้อมูลของคุณช่วยประหยัดได้เท่าไร",
  "{pct} less than the EU default": "น้อยกว่าค่า default ของ EU {pct}",
  "Not enough to compare yet": "ยังไม่มีพอให้เปรียบเทียบ",
  "With your data": "จากข้อมูลของคุณ",
  "On the EU default": "ตามค่า default ของ EU",
  "Tonnes the bill is on": "ตันที่ใช้คิดค่าใช้จ่าย",
  "Carbon price paid at home, if accepted":
    "ราคาคาร์บอนที่จ่ายในประเทศ หากได้รับการยอมรับ",
  "Shown as claimed and never subtracted: the EU has not settled whether it accepts it.":
    "แสดงเป็นที่อ้างสิทธิ์และไม่หักออก เพราะ EU ยังไม่ได้ข้อสรุปว่าจะยอมรับหรือไม่",
  "Fuel and process": "เชื้อเพลิงและกระบวนการ",
  "Bought-in inputs": "วัตถุดิบที่ซื้อมา",
  "What it is made of": "ประกอบด้วยอะไรบ้าง",
  "Share of the total embedded emissions": "สัดส่วนของการปล่อยก๊าซที่ฝังอยู่ทั้งหมด",
  "Direct, indirect and precursor emissions as a share of the total":
    "การปล่อยทางตรง ทางอ้อม และวัตถุดิบตั้งต้น เป็นสัดส่วนของทั้งหมด",
  "{pct} of the precursor emissions rest on a default value, which carries a mark-up. A verified figure from that supplier usually lowers it.":
    "การปล่อยจากวัตถุดิบตั้งต้น {pct} ใช้ค่า default ซึ่งมีส่วนบวกเพิ่ม ตัวเลขที่ผ่านการทวนสอบจากซัพพลายเออร์นั้นมักทำให้ต่ำลง",
  "Every precursor figure comes from a supplier, none from a default value.":
    "ตัวเลขวัตถุดิบตั้งต้นทุกตัวมาจากซัพพลายเออร์ ไม่มีที่ใช้ค่า default",
  "per tonne": "ต่อตัน",
  "per piece": "ต่อชิ้น",
  "Cost per unit": "ต้นทุนต่อหน่วย",
  "What the energy and the carbon cost, against what the good sells for":
    "พลังงานและคาร์บอนมีต้นทุนเท่าไร เทียบกับราคาขายของสินค้า",
  "Per piece": "ต่อชิ้น",
  "Per tonne": "ต่อตัน",
  "Energy {unit}": "พลังงาน {unit}",
  "Carbon {unit}, your data": "คาร์บอน {unit} จากข้อมูลของคุณ",
  "Sells for {unit}": "ราคาขาย {unit}",
  "Energy and carbon, share of the price": "พลังงานและคาร์บอน คิดเป็นสัดส่วนของราคา",
  "Carbon, your data": "คาร์บอน จากข้อมูลของคุณ",
  "Carbon, EU default": "คาร์บอน ตามค่า default ของ EU",
  "Sells for": "ราคาขาย",
  "Where the price goes": "ราคาไปอยู่ตรงไหน",
  "Add the weight of one piece to see this per piece.":
    "ใส่น้ำหนักต่อชิ้นเพื่อดูเป็นต่อชิ้น",
  "Edit prices": "แก้ไขราคา",
  "Everything else in the price": "ส่วนอื่นทั้งหมดในราคา",
  "What is left of the price is not profit: wages, materials and every other cost are still in it.":
    "ส่วนที่เหลือของราคาไม่ใช่กำไร เพราะยังรวมค่าแรง วัสดุ และต้นทุนอื่นทั้งหมด",
  "Add the price of {n} energy item(s) to see this.":
    "ใส่ราคาของพลังงาน {n} รายการเพื่อดูส่วนนี้",
  "No energy was recorded in the submitted months.":
    "ไม่มีการบันทึกพลังงานในเดือนที่ส่งแล้ว",
  "Add the selling price": "ใส่ราคาขาย",
  "Add the energy prices": "ใส่ราคาพลังงาน",
  "Sample numbers: switch them off to enter your own.":
    "ตัวเลขตัวอย่าง: ปิดก่อนจึงจะใส่ของคุณเองได้",
  "Selling price": "ราคาขาย",
  "฿ / tonne": "฿ / ตัน",
  "Weight of one piece": "น้ำหนักต่อชิ้น",
  "Turns every figure into a per-piece one.": "ทำให้ทุกตัวเลขเป็นต่อชิ้น",
  "Tonnes shipped to the EU": "ตันที่ส่งไป EU",
  "The certificate bill is on these. Left empty, all tonnes made are assumed.":
    "ค่าใช้จ่ายใบรับรองคิดจากตันเหล่านี้ ถ้าเว้นว่างจะสมมติว่าตันที่ผลิตทั้งหมด",
  "Electricity price": "ราคาไฟฟ้า",
  "฿ / kWh": "฿ / kWh",
  "Part year": "บางส่วนของปี",
  "CBAM certificates start with 2026 imports, so earlier years have no cost.":
    "ใบรับรอง CBAM เริ่มตั้งแต่การนำเข้าปี 2026 ปีก่อนหน้าจึงไม่มีต้นทุน",
  "No production counted yet, so there is no figure to price.":
    "ยังไม่มีการนับการผลิต จึงไม่มีตัวเลขให้คิดราคา",
  "No EU default is on file for this good.": "ไม่มีค่า default ของ EU สำหรับสินค้านี้",
  "No certificate price is on file for this year. Add one in the prices table below.":
    "ยังไม่มีราคาใบรับรองของปีนี้ เพิ่มได้ในตารางราคาด้านล่าง",
  "Show the breakdown": "แสดงรายละเอียด",
  "Look at this one only": "ดูเฉพาะรายการนี้",
  "Assumes all the tonnes made were shipped to the EU: no EU volume entered.":
    "สมมติว่าตันที่ผลิตทั้งหมดส่งไป EU: ยังไม่ได้ใส่ปริมาณส่งไป EU",
  Compare: "เปรียบเทียบ",
  "Every installation, product and reporting year, side by side":
    "ทุกโรงงาน สินค้า และปีรายงาน เทียบกันแบบเคียงข้าง",
  "Search a name, product or year": "ค้นหาชื่อ สินค้า หรือปี",
  "Compare by": "เปรียบเทียบตาม",
  "Break down by": "แยกย่อยตาม",
  "Made (t)": "ผลิต (ตัน)",
  "Embedded (tCO₂e)": "ที่ฝังอยู่ (tCO₂e)",
  "vs EU default": "เทียบค่า default ของ EU",
  "Cost, your data": "ต้นทุน จากข้อมูลของคุณ",
  "Cost, EU default": "ต้นทุน ตามค่า default ของ EU",
  "Nothing matches that.": "ไม่พบรายการที่ตรงกัน",
  "Your data against the EU default": "ข้อมูลของคุณเทียบกับค่า default ของ EU",
  "Certificate cost, by {dim}": "ต้นทุนใบรับรอง แยกตาม{dim}",
  "No cost to draw yet": "ยังไม่มีต้นทุนให้แสดง",
  "In your supply chain": "ในห่วงโซ่อุปทานของคุณ",
  "Plants that fill in monthly, and suppliers of what you buy in":
    "โรงงานที่กรอกข้อมูลรายเดือน และซัพพลายเออร์ของที่คุณซื้อเข้ามา",
  Plants: "โรงงาน",
  "{n} your own": "ของคุณเอง {n}",
  "Managers on file": "ผู้จัดการโรงงานในระบบ",
  "On track": "เป็นไปตามแผน",
  "Answering on time, data in order": "ตอบตรงเวลา ข้อมูลเรียบร้อย",
  Completed: "เสร็จสมบูรณ์",
  "Average health": "สุขภาพเฉลี่ย",
  "Answered on time": "ตอบตรงเวลา",
  "At risk": "เสี่ยง",
  "Late, failing a check, or nobody to ask": "ล่าช้า ไม่ผ่านการตรวจ หรือไม่มีใครให้ขอ",
  "Need attention": "ต้องดูแล",
  "Months past the deadline": "เดือนที่เกินกำหนด",
  "Months ready to send": "เดือนที่พร้อมส่ง",
  "Data coverage": "ความครอบคลุมของข้อมูล",
  "Months in and suppliers answered, of what is due":
    "เดือนที่ได้รับและซัพพลายเออร์ที่ตอบ จากทั้งหมดที่ถึงกำหนด",
  "Suppliers answered": "ซัพพลายเออร์ที่ตอบแล้ว",
  "On verified data": "ใช้ข้อมูลที่ทวนสอบแล้ว",
  "On a default value": "ใช้ค่า default",
  "Plants and suppliers": "โรงงานและซัพพลายเออร์",
  "Health, aspect by aspect": "สุขภาพ แยกเป็นแต่ละด้าน",
  "What each score is made of, across the whole chain":
    "คะแนนแต่ละตัวประกอบด้วยอะไร ทั่วทั้งห่วงโซ่",
  "The chain by state": "ห่วงโซ่แยกตามสถานะ",
  "Everyone in it, in one count": "ทุกคนในห่วงโซ่ นับรวมในที่เดียว",
  healthy: "ปกติดี",
  "{n} month(s) past the deadline and still unanswered":
    "{n} เดือนเกินกำหนดและยังไม่ตอบ",
  "No factory manager on file to send the monthly link to":
    "ไม่มีผู้จัดการโรงงานในระบบให้ส่งลิงก์รายเดือน",
  "{n} month(s) ready to send: nobody has been asked yet":
    "{n} เดือนพร้อมส่ง: ยังไม่ได้ขอจากใครเลย",
  "Its reports are only {n}% complete": "รายงานของที่นี่ครบเพียง {n}%",
  "{product}: the year has ended and the figure is still not in":
    "{product}: ปีสิ้นสุดแล้วแต่ยังไม่ได้รับตัวเลข",
  "{product}: not invited yet": "{product}: ยังไม่ได้เชิญ",
  "{product}: invited {n} days ago, no answer":
    "{product}: เชิญไปเมื่อ {n} วันก่อน ยังไม่ตอบ",
  "{product}: on a default value, carrying {n}% of the precursor emissions":
    "{product}: ใช้ค่า default และมีสัดส่วน {n}% ของการปล่อยจากวัตถุดิบตั้งต้น",
  "{product}: on a default value": "{product}: ใช้ค่า default",
  "{product}: the verification report fails a check":
    "{product}: รายงานการทวนสอบไม่ผ่านการตรวจข้อหนึ่ง",
  "{product}: a figure with no verification report behind it":
    "{product}: ตัวเลขที่ไม่มีรายงานการทวนสอบรองรับ",
  "Most serious first": "ร้ายแรงที่สุดก่อน",
  High: "สูง",
  Medium: "ปานกลาง",
  Low: "ต่ำ",
  Plant: "โรงงาน",
  "What the emissions depend on": "การปล่อยก๊าซขึ้นอยู่กับใคร",
  "Share of the bought-in emissions each supplier carries":
    "สัดส่วนของการปล่อยจากวัตถุดิบที่ซื้อมา ที่ซัพพลายเออร์แต่ละรายรับผิดชอบ",
  "No bought-in input carries emissions yet.": "ยังไม่มีวัตถุดิบที่ซื้อมาที่มีการปล่อยก๊าซ",
  "The bar is coloured by that supplier's state. A big share on a default value is the quickest place to lower the bill.":
    "สีของแท่งตามสถานะของซัพพลายเออร์รายนั้น สัดส่วนใหญ่ที่ใช้ค่า default คือจุดที่ลดค่าใช้จ่ายได้เร็วที่สุด",
  "Accreditation valid": "การรับรองยังมีผล",
  "Scope covers the good": "ขอบเขตครอบคลุมสินค้า",
  "Period covered": "ครอบคลุมช่วงเวลา",
  "File on record": "มีไฟล์ในระบบ",
  "The four report checks": "การตรวจรายงานสี่ข้อ",
  passed: "ผ่าน",
  failed: "ไม่ผ่าน",
  "The score, taken apart": "คะแนน แยกเป็นส่วน ๆ",
  "Not measured yet": "ยังไม่ได้วัด",
  "What worries us": "สิ่งที่น่ากังวล",
  "Nothing.": "ไม่มี",
  "Factory manager": "ผู้จัดการโรงงาน",
  "No name on file": "ไม่มีชื่อในระบบ",
  "No email: nobody can be sent the link": "ไม่มีอีเมล: ส่งลิงก์ให้ใครไม่ได้",
  "Your own site: the answers come to you.": "โรงงานของคุณเอง: คำตอบจะมาถึงคุณ",
  "Nobody on file to send it to.": "ไม่มีใครในระบบให้ส่ง",
  "Open monthly data": "เปิดข้อมูลรายเดือน",
  "Open the precursor": "เปิดวัตถุดิบตั้งต้น",
  "Smart links": "สมาร์ทลิงค์",
  "Show the detail": "แสดงรายละเอียด",
  "Own site": "โรงงานของเรา",
  "No factory manager on file": "ไม่มีผู้จัดการโรงงานในระบบ",
  answered: "ตอบแล้ว",
  late: "ล่าช้า",
  "tier {n}": "ลำดับชั้น {n}",
  "past the year's end": "เลยสิ้นปี",
  "{n} days ago": "{n} วันที่แล้ว",
  "Everyone in the chain": "ทุกคนในห่วงโซ่",
  "Plants, with the factory manager who has to fill each one in":
    "โรงงาน พร้อมผู้จัดการโรงงานที่ต้องกรอกข้อมูลแต่ละแห่ง",
  "Suppliers of what you buy in, each asked once a year":
    "ซัพพลายเออร์ของที่คุณซื้อเข้ามา แต่ละรายถูกขอปีละครั้ง",
  "Search a name, product or contact": "ค้นหาชื่อ สินค้า หรือผู้ติดต่อ",
  "Which list": "รายการไหน",
  Health: "สุขภาพ",
  "Last activity": "กิจกรรมล่าสุด",
  Invitation: "คำเชิญ",
  "Data and report checks": "ข้อมูลและการตรวจรายงาน",
  "Share of emissions": "สัดส่วนการปล่อยก๊าซ",
  "No plants yet. They appear with the first product report.":
    "ยังไม่มีโรงงาน จะแสดงเมื่อมีรายงานผลิตภัณฑ์แรก",
  "No precursor suppliers yet. Add them in a product report's Precursors tab.":
    "ยังไม่มีซัพพลายเออร์วัตถุดิบตั้งต้น เพิ่มได้ในแท็บวัตถุดิบตั้งต้นของรายงานผลิตภัณฑ์",
  "Each square is a month": "แต่ละช่องคือหนึ่งเดือน",
  "Needs attention": "ต้องดูแล",
  Answered: "ตอบแล้ว",
  "Past the deadline": "เกินกำหนด",
  Waiting: "รอคำตอบ",
  "Ready to send": "พร้อมส่ง",
  "Not yet": "ยังไม่ถึง",
  Verified: "ทวนสอบแล้ว",
  "No report": "ไม่มีรายงาน",
  "Not invited": "ยังไม่ได้เชิญ",
  Invited: "เชิญแล้ว",
  Timeliness: "ความตรงเวลา",
  Coverage: "ความครอบคลุม",
  Completeness: "ความครบถ้วน",
  Contact: "ผู้ติดต่อ",
  Response: "การตอบกลับ",
  "Data basis": "ฐานของข้อมูล",
  "Report checks": "การตรวจรายงาน",
  "Months answered by their deadline, of those answered or late":
    "เดือนที่ตอบทันกำหนด จากเดือนที่ตอบแล้วหรือล่าช้า",
  "Months in, of the months that have ended": "เดือนที่ได้รับ จากเดือนที่สิ้นสุดแล้ว",
  "How complete the product reports are": "รายงานผลิตภัณฑ์ครบถ้วนเพียงใด",
  "A named factory manager and an email to send the link to":
    "มีชื่อผู้จัดการโรงงานและอีเมลสำหรับส่งลิงก์",
  "How far each invitation has got: sent, opened, answered":
    "คำเชิญแต่ละรายการคืบหน้าไปถึงไหน: ส่งแล้ว เปิดแล้ว ตอบแล้ว",
  "Verified figure, figure without a report, or a default value":
    "ตัวเลขที่ทวนสอบแล้ว ตัวเลขที่ไม่มีรายงาน หรือค่า default",
  "The four checks on a verification report: accreditation, scope, period, file":
    "การตรวจรายงานการทวนสอบสี่ข้อ: การรับรอง ขอบเขต ช่วงเวลา ไฟล์",
  "Reporting year {year} ends: every month and supplier figure should be in":
    "ปีรายงาน {year} สิ้นสุด: ทุกเดือนและตัวเลขจากซัพพลายเออร์ควรครบ",
  "Buyers start holding certificates each quarter": "ผู้ซื้อเริ่มถือใบรับรองทุกไตรมาส",
  "Certificate sales open": "เปิดขายใบรับรอง",
  "First CBAM declaration, and certificates surrendered, for 2026":
    "ยื่นแสดงรายการ CBAM ครั้งแรกและส่งคืนใบรับรองสำหรับปี 2026",
  "Last day to ask for surplus certificates to be repurchased":
    "วันสุดท้ายที่ขอให้ซื้อคืนใบรับรองส่วนเกิน",
  "Unused 2026 certificates are cancelled": "ใบรับรองปี 2026 ที่ไม่ได้ใช้จะถูกยกเลิก",
  You: "คุณ",
  "Your buyers": "ผู้ซื้อของคุณ",
  "You and your buyers": "คุณและผู้ซื้อของคุณ",
  "Not verified": "ยังไม่ทวนสอบ",
  "No data yet": "ยังไม่มีข้อมูล",
  Official: "เป็นทางการ",
  "Where do I stand?": "ตอนนี้ฉันอยู่ตรงไหน",
  "e.g. scrap-fed EAF steelmaking from scrap receipt through continuous casting and hot rolling; the on-site fabrication shop serving the domestic market is outside the boundary":
    "เช่น การผลิตเหล็กด้วยเตาอาร์กไฟฟ้าจากเศษเหล็ก ตั้งแต่รับเศษเหล็กจนถึงการหล่อต่อเนื่องและการรีดร้อน ส่วนโรงงานประกอบในพื้นที่ที่ขายตลาดในประเทศอยู่นอกขอบเขต",
  "e.g. every figure is entered by production and checked by ESG before sign-off":
    "เช่น ทุกตัวเลขบันทึกโดยฝ่ายผลิตและตรวจสอบโดยฝ่าย ESG ก่อนลงนาม",
  "Look at the share of embedded emissions on default values (summary report, item 4(b)). A default is a published figure with the year’s mark-up added, not something you measured.":
    "ดูสัดส่วนการปล่อยก๊าซที่ฝังอยู่ในสินค้าที่ใช้ค่า default (รายงานสรุป ข้อ 4(b)) ค่า default คือตัวเลขที่ประกาศไว้บวกส่วนเพิ่มของปีนั้น ไม่ใช่สิ่งที่คุณวัดเอง",
  "Start at the weighbridge, end at the cooling bed…":
    "เริ่มที่เครื่องชั่งรถบรรทุก จบที่แท่นระบายความร้อน…",
  "Fed from substation SS-02, meter E-221. Reported under CN 7213 91 10.":
    "รับไฟจากสถานีย่อย SS-02 มิเตอร์ E-221 รายงานภายใต้ CN 7213 91 10",
  "Natural gas · Elster RVG G250 rotary meter · monthly · calibrated 15 Mar 2026.":
    "ก๊าซธรรมชาติ · มิเตอร์โรตารี Elster RVG G250 · รายเดือน · สอบเทียบ 15 มี.ค. 2026",
  "Grid — PEA · 115 kV incoming feeder, substation SS-01, meter PEA-88214.":
    "ไฟจากโครงข่าย — กฟภ. · สายป้อนขาเข้า 115 kV สถานีย่อย SS-01 มิเตอร์ PEA-88214",
  "115 kV incoming feeder, substation SS-01, meter PEA-88214":
    "สายป้อนขาเข้า 115 kV สถานีย่อย SS-01 มิเตอร์ PEA-88214",
  "Gas meter FT-2201 failed": "มิเตอร์ก๊าซ FT-2201 เสีย",
  "Mean of Feb and Apr consumption per tonne × March output":
    "ค่าเฉลี่ยการใช้ต่อตันของเดือน ก.พ. และ เม.ย. × ผลผลิตเดือน มี.ค.",
  "QAL2-2026-0148, issued 12 Feb 2026": "QAL2-2026-0148 ออกเมื่อ 12 ก.พ. 2026",
  "You have confirmed this month. Asking for a revision reopens the conversation and puts it back with the supplier.":
    "คุณยืนยันเดือนนี้แล้ว การขอให้แก้ไขจะเปิดการสนทนาอีกครั้งและส่งกลับไปที่ซัพพลายเออร์",
  "A note on its own leaves them matching one sentence against twenty screens. Tick the parts as well and their screen marks them.":
    "ถ้ามีแค่หมายเหตุ เขาต้องเทียบประโยคเดียวกับยี่สิบหน้าจอ ติ๊กส่วนที่เกี่ยวข้องด้วย แล้วหน้าจอของเขาจะทำเครื่องหมายให้",
  "The version they submitted goes back unchanged. You have not edited it.":
    "เวอร์ชันที่เขาส่งมาจะถูกส่งกลับโดยไม่เปลี่ยนแปลง คุณยังไม่ได้แก้ไข",
  "e.g. natural gas consumption": "เช่น การใช้ก๊าซธรรมชาติ",
  "e.g. the main gas meter failed on 12 August and was replaced on 3 September":
    "เช่น มิเตอร์ก๊าซหลักเสียเมื่อ 12 สิงหาคม และเปลี่ยนใหม่เมื่อ 3 กันยายน",
  "e.g. we used the highest monthly consumption of the year rather than the average, so the estimate is above any plausible actual":
    "เช่น เราใช้ปริมาณการใช้รายเดือนสูงสุดของปีแทนค่าเฉลี่ย ค่าประมาณจึงสูงกว่าค่าจริงที่เป็นไปได้ทุกกรณี",
  Yes: "ใช่",
  No: "ไม่ใช่",
  "Sinter line 1": "สายเผาผนึก 1",
  "Thai, English, Chinese and Hindi everywhere":
    "ใช้ได้ทั้งภาษาไทย อังกฤษ จีน และฮินดีทุกหน้าจอ",
  "Days to get your figures to buyers": "เหลืออีกกี่วันที่ต้องส่งตัวเลขให้ผู้ซื้อ",
  "Your buyers file their first CBAM declaration on {date} and need your verified figures before then.":
    "ผู้ซื้อของคุณยื่นแสดงรายการ CBAM ครั้งแรกวันที่ {date} และต้องการตัวเลขที่ทวนสอบแล้วของคุณก่อนหน้านั้น",
  "{name} submitted their data": "{name} ส่งข้อมูลของตนแล้ว",
  "{file} uploaded by {who}": "{who} อัปโหลด {file}",
  "{file} uploaded": "อัปโหลด {file} แล้ว",
  "Monitoring plan v{n} finalised by {who}": "{who} สรุปแผนการติดตามฉบับ v{n}",
  "{month} submitted by {who}": "{who} ส่ง{month}แล้ว",
  "{month} submitted": "ส่ง{month}แล้ว",
  "Aluminium sheet": "แผ่นอะลูมิเนียม",
  "Reinforcing bar": "เหล็กเส้นเสริมแรง",
  Document: "เอกสาร",
  "Meter calibration certificate": "ใบรับรองการสอบเทียบมิเตอร์",
  "The plants that fill in your months — your own sites and your suppliers'":
    "โรงงานที่กรอกเดือนให้คุณ — ไซต์ของคุณเองและของซัพพลายเออร์",
  "Search a name or a product": "ค้นหาชื่อหรือผลิตภัณฑ์",
  "No email on file to send the monthly link to": "ไม่มีอีเมลสำหรับส่งลิงก์รายเดือน",
  "An email to send the monthly link to": "อีเมลสำหรับส่งลิงก์รายเดือน",
  "Suppliers that fill in monthly, and what you buy in":
    "ซัพพลายเออร์ที่กรอกรายเดือน และสิ่งที่คุณซื้อเข้ามา",
  "Chat History": "ประวัติการแชท",
  "{month} data is overdue": "ข้อมูลของ {month} เลยกำหนดแล้ว",
  "{month} data is due soon": "ข้อมูลของ {month} ใกล้ครบกำหนด",
  "{product} · 1 day late": "{product} · ช้า 1 วัน",
  "{product} · {n} days late": "{product} · ช้า {n} วัน",
  "{product} · due today": "{product} · ครบกำหนดวันนี้",
  "{product} · due tomorrow": "{product} · ครบกำหนดพรุ่งนี้",
  "{product} · due in {n} days": "{product} · ครบกำหนดใน {n} วัน",
  "{name} hasn't answered": "{name} ยังไม่ตอบกลับ",
  "{product} · asked {n} days ago": "{product} · ส่งคำขอไปเมื่อ {n} วันก่อน",
  "{n} documents are uploaded but not yet bound":
    "อัปโหลดเอกสาร {n} ฉบับแล้ว แต่ยังไม่ได้ผูกกับรายการ",
  "Open Verification, then the report that holds them":
    "เปิดการทวนสอบ แล้วเลือกรายงานที่เก็บเอกสารเหล่านั้น",
  "1 report is blocked on {tab}": "รายงาน 1 ฉบับติดขัดที่ {tab}",
  "{n} reports are blocked on {tab}": "รายงาน {n} ฉบับติดขัดที่ {tab}",
  "Open Verification to see which": "เปิดการทวนสอบเพื่อดูว่าฉบับไหน",
  "1 day left to get your figures to buyers": "เหลืออีก 1 วันก่อนต้องส่งตัวเลขให้ผู้ซื้อ",
  "{n} days left to get your figures to buyers":
    "เหลืออีก {n} วันก่อนต้องส่งตัวเลขให้ผู้ซื้อ",
  "First-year verification includes a site visit, so line up your verifier early and keep the months coming in.":
    "การทวนสอบปีแรกต้องมีการตรวจที่โรงงาน จึงควรหาผู้ทวนสอบไว้ล่วงหน้า และกรอกข้อมูลรายเดือนให้ต่อเนื่อง",
  "The dashboard shows how far each report has got, and which ones are holding the package up.":
    "แดชบอร์ดแสดงว่าแต่ละรายงานคืบหน้าไปแค่ไหน และรายงานใดที่ทำให้ชุดรายงานค้าง",
  "Your free trial has ended": "การทดลองใช้ฟรีสิ้นสุดแล้ว",
  "Everything you built is still here and still readable, but nothing can be changed, sent or downloaded until you choose a plan.":
    "ทุกอย่างที่คุณสร้างไว้ยังอยู่ครบและอ่านได้ แต่จะแก้ไข ส่ง หรือดาวน์โหลดไม่ได้จนกว่าจะเลือกแพ็กเกจ",
  "Suppliers keep their links and are never charged.":
    "ซัพพลายเออร์ยังใช้ลิงก์ของตนได้ และไม่ต้องเสียค่าใช้จ่าย",
  "Your free trial ends tomorrow": "การทดลองใช้ฟรีจะสิ้นสุดพรุ่งนี้",
  "Your free trial ends in {n} days": "การทดลองใช้ฟรีจะสิ้นสุดใน {n} วัน",
  "When the trial ends the account becomes read-only: you can still open everything, but nothing can be changed, sent or downloaded.":
    "เมื่อสิ้นสุดการทดลอง บัญชีจะเป็นแบบอ่านอย่างเดียว คุณยังเปิดดูได้ทุกอย่าง แต่แก้ไข ส่ง หรือดาวน์โหลดไม่ได้",
  "Choose a plan before then to keep working without a break.":
    "เลือกแพ็กเกจก่อนถึงวันนั้นเพื่อทำงานต่อได้ไม่สะดุด",
  "You've reached your plan's limit on {what}":
    "คุณใช้ {what} ถึงเพดานของแพ็กเกจแล้ว",
  "New sign-in to your account": "มีการเข้าสู่ระบบบัญชีของคุณใหม่",
  "Your account was signed in on {device}.": "บัญชีของคุณถูกเข้าสู่ระบบบน {device}",
  "If that was you, there is nothing to do. If it was not, change your password now and sign out the other sessions.":
    "ถ้าเป็นคุณเอง ไม่ต้องทำอะไร ถ้าไม่ใช่ ให้เปลี่ยนรหัสผ่านทันทีและออกจากระบบอุปกรณ์อื่นทั้งหมด",
  "Your password was changed": "เปลี่ยนรหัสผ่านของคุณแล้ว",
  "The password for your account was changed.": "รหัสผ่านของบัญชีคุณถูกเปลี่ยนแล้ว",
  "If you did not do this, change it again now and sign out the other sessions.":
    "ถ้าคุณไม่ได้เป็นคนทำ ให้เปลี่ยนอีกครั้งทันทีและออกจากระบบอุปกรณ์อื่นทั้งหมด",
  "Your other sessions were signed out": "ออกจากระบบอุปกรณ์อื่นทั้งหมดแล้ว",
  "Every other browser and device signed in to your account was signed out.":
    "เบราว์เซอร์และอุปกรณ์อื่นทุกเครื่องที่เข้าสู่ระบบบัญชีของคุณถูกออกจากระบบแล้ว",
  "Only this one is signed in now.": "ตอนนี้เหลือเครื่องนี้เครื่องเดียวที่เข้าสู่ระบบอยู่",
  "Open security settings": "เปิดการตั้งค่าความปลอดภัย",
  "Ask Cera about this": "ถาม Cera เรื่องนี้",
  "Certrace now speaks 中文 and हिन्दी": "Certrace ใช้ภาษา 中文 และ हिन्दी ได้แล้ว",
  "The whole portal, the smart links your suppliers open, and Cera now work in English, ไทย, 中文 and हिन्दी.":
    "ทั้งพอร์ทัล สมาร์ทลิงค์ที่ซัพพลายเออร์ของคุณเปิด และ Cera ใช้ได้ทั้งภาษาอังกฤษ ไทย จีน และฮินดีแล้ว",
  "Change the language from the menu under your name. Cera answers in the language you write to her in.":
    "เปลี่ยนภาษาได้จากเมนูใต้ชื่อของคุณ Cera จะตอบเป็นภาษาเดียวกับที่คุณพิมพ์",
  "Carbon & Cost and Supply Chain were redesigned":
    "ปรับหน้าคาร์บอนและต้นทุนกับห่วงโซ่อุปทานใหม่แล้ว",
  "Carbon & Cost now compares your sites, years and products in baht, euro, yuan or rupee, with the cost on your own figures set against the EU default.":
    "คาร์บอนและต้นทุนเปรียบเทียบโรงงาน ปี และผลิตภัณฑ์ของคุณเป็นบาท ยูโร หยวน หรือรูปี โดยวางต้นทุนจากตัวเลขของคุณเองเทียบกับค่าเริ่มต้นของ EU",
  "Supply Chain scores every supplier and precursor on how reliably the data arrives, and says where it worries us.":
    "ห่วงโซ่อุปทานให้คะแนนซัพพลายเออร์และวัตถุดิบตั้งต้นทุกรายตามความสม่ำเสมอของข้อมูลที่ส่งมา และบอกว่าจุดไหนน่ากังวล",
  "Notifications — {n} unread": "การแจ้งเตือน — ยังไม่ได้อ่าน {n}",
  "Sample notifications — your own data is not touched.":
    "การแจ้งเตือนตัวอย่าง — ข้อมูลของคุณไม่ถูกแตะต้อง",
  "Nothing to tell you right now.": "ตอนนี้ไม่มีอะไรต้องแจ้ง",
  "See all {n}": "ดูทั้งหมด {n} รายการ",
  "See all notifications": "ดูการแจ้งเตือนทั้งหมด",
  "System message": "ข้อความจากระบบ",
  "Message from Certrace": "ข้อความจาก Certrace",
  "From Certrace": "จาก Certrace",
  "This is the rules as Certrace has them, not a live feed. Check the official text before you rely on it.":
    "นี่คือกฎตามที่ Certrace มี ไม่ใช่ข้อมูลสด โปรดตรวจข้อความทางการก่อนนำไปใช้",
  "Open Coverage": "เปิดความครอบคลุม",
  Unread: "ยังไม่ได้อ่าน",
  Account: "บัญชี",
  "What needs you, what has just happened, and what Certrace has to tell you — drawn from the same figures as the dashboard.":
    "สิ่งที่รอคุณ สิ่งที่เพิ่งเกิดขึ้น และสิ่งที่ Certrace อยากแจ้ง — มาจากตัวเลขชุดเดียวกับแดชบอร์ด",
  "Sample notifications.": "การแจ้งเตือนตัวอย่าง",
  "These come from the made-up estate on the dashboard. Your own data is not touched.":
    "การแจ้งเตือนเหล่านี้มาจากข้อมูลสมมติบนแดชบอร์ด ข้อมูลของคุณไม่ถูกแตะต้อง",
  "Needs action": "ต้องดำเนินการ",
  Happened: "เกิดขึ้นแล้ว",
  Messages: "ข้อความ",
  "A notice appears when a month runs late, a supplier answers, a package is ready, or Certrace has something to say.":
    "จะมีการแจ้งเตือนเมื่อเดือนใดล่าช้า ซัพพลายเออร์ตอบกลับ ชุดรายงานพร้อม หรือ Certrace มีเรื่องจะแจ้ง",
  "CBAM news": "ข่าว CBAM",
  "Rule changes, new certificate prices and the dates that matter — as Certrace has them.":
    "กฎที่เปลี่ยน ราคาใบรับรองใหม่ และวันที่สำคัญ — ตามที่ Certrace มี",
  "Your trial, the limits of your plan and anything that needs your attention on it.":
    "การทดลองใช้ ขีดจำกัดของแพ็กเกจ และเรื่องที่ต้องให้คุณดูเกี่ยวกับแพ็กเกจ",
  "Thailand's excise on oil products, which carries a carbon component of THB 200/tCO₂e — Excise Department notice in the Government Gazette of 22 April 2025, unchanged at 26 October 2026":
    "ภาษีสรรพสามิตน้ำมันของไทยที่มีส่วนคาร์บอน 200 บาท/tCO₂e — ประกาศกรมสรรพสามิตในราชกิจจานุเบกษา 22 เมษายน 2568 และยังไม่เปลี่ยน ณ 26 ตุลาคม 2569",
  "Monthly schedule": "กำหนดการรายเดือน",
  "The day of the month each month's data is due.":
    "วันที่ของเดือนที่ต้องส่งข้อมูลของแต่ละเดือน",
  "The report": "รายงาน",
  "Brought across as a draft you can edit. A finished version is never copied.":
    "ย้ายมาเป็นฉบับร่างที่แก้ไขได้ ฉบับที่สรุปแล้วจะไม่ถูกคัดลอก",
  "Boundary and processes": "ขอบเขตและกระบวนการ",
  "The boundary description, the processes inside it and what is left out, with the ground for each.":
    "คำอธิบายขอบเขต กระบวนการที่อยู่ภายใน และสิ่งที่ไม่รวม พร้อมเหตุผลของแต่ละข้อ",
  "Fuels and electricity": "เชื้อเพลิงและไฟฟ้า",
  "The fuels burned, the electricity supply and the meter it is read from.":
    "เชื้อเพลิงที่เผา แหล่งไฟฟ้า และมิเตอร์ที่ใช้อ่านค่า",
  "Measuring instruments": "เครื่องมือวัด",
  "The instrument and the reading frequency for each fuel and for electricity.":
    "เครื่องมือและความถี่ในการอ่านค่าของเชื้อเพลิงแต่ละชนิดและไฟฟ้า",
  "The estimates standing in for missing readings. They describe last year, so they start new unless you choose otherwise.":
    "ค่าประมาณที่ใช้แทนค่าที่อ่านไม่ได้ ซึ่งเป็นเรื่องของปีที่แล้ว จึงเริ่มใหม่ เว้นแต่คุณเลือกเอง",
  "Who reviews the data, and how often.": "ใครตรวจข้อมูล และตรวจบ่อยแค่ไหน",
  "The drawing of the installation and what it shows.":
    "ภาพแผนผังสถานประกอบการและสิ่งที่แสดง",
  "Steel: the reducing agent and the mill. Aluminium: the way perfluorocarbons are counted.":
    "เหล็ก: ตัวรีดิวซ์และโรงรีด อะลูมิเนียม: วิธีนับสารเพอร์ฟลูออโรคาร์บอน",
  "Sampling plan": "แผนการสุ่มตัวอย่าง",
  "How the calculation factors are determined.": "วิธีกำหนดค่าตัวประกอบที่ใช้คำนวณ",
  "Control system": "ระบบควบคุม",
  "The controls that keep the data right.": "มาตรการควบคุมที่ทำให้ข้อมูลถูกต้อง",
  "Who supplies what, in the same tree: names, countries, CN codes, routes and contacts. Not their figures, reports or links — those are asked again.":
    "ใครส่งอะไร ในโครงสร้างเดิม: ชื่อ ประเทศ รหัส CN เส้นทาง และผู้ติดต่อ ไม่รวมตัวเลข รายงาน หรือลิงก์ของเขา — จะขอใหม่อีกครั้ง",
  "The instrument, the amount per tonne, the law it is charged under and who certifies it. The receipt and any rebate are left behind.":
    "รูปแบบการเก็บ จำนวนต่อตัน กฎหมายที่เรียกเก็บ และผู้รับรอง ใบเสร็จและส่วนลดจะไม่ถูกนำมา",
  "Who makes it": "ใครเป็นผู้ผลิต",
  "The supplier, or your own site.": "ซัพพลายเออร์ หรือโรงงานของคุณเอง",
  "Monthly figures": "ตัวเลขรายเดือน",
  "Production, fuels and electricity for each month.":
    "ผลผลิต เชื้อเพลิง และไฟฟ้าของแต่ละเดือน",
  "Documents and evidence": "เอกสารและหลักฐาน",
  "Receipts, invoices, calibration certificates.":
    "ใบเสร็จ ใบแจ้งหนี้ ใบรับรองการสอบเทียบ",
  "Sign-offs and finished versions": "การอนุมัติและฉบับที่สรุปแล้ว",
  "The approvals and the stamped monitoring plans of the year behind it.":
    "การอนุมัติและแผนการติดตามที่ประทับตราของปีก่อนหน้า",
  "Worked out again from the new year's figures.": "คำนวณใหม่จากตัวเลขของปีใหม่",
  "Nothing recorded in this report": "ยังไม่มีข้อมูลในรายงานนี้",
  "{n} in the chain": "{n} รายในห่วงโซ่",
  "{n} exclusions": "ไม่รวม {n} รายการ",
  "{n} rows": "{n} แถว",
  "For each part, choose whether it comes across or starts new.":
    "เลือกแต่ละส่วนว่าจะนำมาหรือเริ่มใหม่",
  "Bring everything across": "นำมาทั้งหมด",
  "Start everything new": "เริ่มใหม่ทั้งหมด",
  "Bring across": "นำมา",
  "Start new": "เริ่มใหม่",
  "This is a different site, so the parts that describe the old plant start new. Switch any back on if they fit.":
    "นี่เป็นคนละโรงงาน ส่วนที่อธิบายโรงงานเดิมจึงเริ่มใหม่ เปิดกลับได้ถ้าใช้ได้",
  "Always comes across": "นำมาเสมอ",
  "Always starts new": "เริ่มใหม่เสมอ",
  "They belong to the year they describe, so a copy never brings them.":
    "สิ่งเหล่านี้เป็นของปีที่มันบันทึก สำเนาจึงไม่นำมาด้วย",
  "{n} of {total} parts come across. The rest start new.":
    "นำมา {n} จาก {total} ส่วน ที่เหลือเริ่มใหม่",
  "Nothing comes across — everything starts new.":
    "ไม่มีอะไรถูกนำมา — ทุกอย่างเริ่มใหม่",
  "All {n} parts come across.": "นำมาทั้ง {n} ส่วน",
  "1 item is overdue.": "1 รายการเลยกำหนด",
  "{n} items are overdue.": "{n} รายการเลยกำหนด",
  "1 month past the deadline and still unanswered": "1 เดือนเกินกำหนดและยังไม่ตอบ",
  "{n} months past the deadline and still unanswered":
    "{n} เดือนเกินกำหนดและยังไม่ตอบ",
  "1 month ready to send: nobody has been asked yet":
    "1 เดือนพร้อมส่ง: ยังไม่ได้ขอจากใครเลย",
  "{n} months ready to send: nobody has been asked yet":
    "{n} เดือนพร้อมส่ง: ยังไม่ได้ขอจากใครเลย",
  "1 product has no EU volume entered, so all the tonnes made are assumed shipped to the EU.":
    "สินค้า 1 รายการยังไม่ได้ใส่ปริมาณส่งไป EU จึงสมมติว่าตันที่ผลิตทั้งหมดส่งไป EU",
  "{n} products have no EU volume entered, so all the tonnes made are assumed shipped to the EU.":
    "สินค้า {n} รายการยังไม่ได้ใส่ปริมาณส่งไป EU จึงสมมติว่าตันที่ผลิตทั้งหมดส่งไป EU",
  "A carbon price paid at home is recorded for 1 product. It is shown as claimed and never subtracted.":
    "บันทึกราคาคาร์บอนที่จ่ายในประเทศไว้สำหรับสินค้า 1 รายการ แสดงเป็นที่อ้างสิทธิ์ และไม่เคยนำไปหักออก",
  "A carbon price paid at home is recorded for {n} products. It is shown as claimed and never subtracted.":
    "บันทึกราคาคาร์บอนที่จ่ายในประเทศไว้สำหรับสินค้า {n} รายการ แสดงเป็นที่อ้างสิทธิ์ และไม่เคยนำไปหักออก",
  "Add the price of 1 energy item to see this.":
    "ใส่ราคาของพลังงาน 1 รายการเพื่อดูส่วนนี้",
  "Add the price of {n} energy items to see this.":
    "ใส่ราคาของพลังงาน {n} รายการเพื่อดูส่วนนี้",
  "1 item of the installation's information is still missing":
    "ข้อมูลของโรงงานยังขาดอีก 1 รายการ",
  "{n} items of the installation's information are still missing":
    "ข้อมูลของโรงงานยังขาดอีก {n} รายการ",
  "1 item to do": "ต้องทำอีก 1 รายการ",
  "{n} items to do": "ต้องทำอีก {n} รายการ",
  "1 month is not submitted, so the annual figure is **incomplete, not smaller**. Every per-tonne figure above divides by a denominator that is missing that month, which overstates them.":
    "1 เดือนยังไม่ได้ส่ง ตัวเลขรายปีจึง**ไม่ครบถ้วน ไม่ใช่น้อยลง** ตัวเลขต่อตันทั้งหมดด้านบนหารด้วยตัวส่วนที่ยังขาดเดือนนั้น ทำให้ค่าสูงเกินจริง",
  "{n} months are not submitted, so the annual figure is **incomplete, not smaller**. Every per-tonne figure above divides by a denominator that is missing those months, which overstates them.":
    "{n} เดือนยังไม่ได้ส่ง ตัวเลขรายปีจึง**ไม่ครบถ้วน ไม่ใช่น้อยลง** ตัวเลขต่อตันทั้งหมดด้านบนหารด้วยตัวส่วนที่ยังขาดเดือนเหล่านั้น ทำให้ค่าสูงเกินจริง",
  "{n} of 12 months": "{n} จาก 12 เดือน",
  "{fuel} fuel + {process} process":
    "{fuel} จากเชื้อเพลิง + {process} จากกระบวนการ",
  "{n} months are overdue": "{n} เดือนเลยกำหนด",
  "{product} · the oldest is {month}, {days} days late":
    "{product} · เก่าสุดคือ {month} ช้า {days} วัน",
  "Plans sized to your filing.": "แพ็กเกจตามขนาดงานที่คุณต้องยื่น",
  "Annual term. A plan counts your own side — companies, installations, CN codes, precursors and seats. Suppliers and precursor suppliers enter and fill in through their smart link on every plan, without limit.":
    "สัญญารายปี แพ็กเกจนับเฉพาะฝั่งของคุณ — บริษัท สถานประกอบการ รหัส CN วัตถุดิบตั้งต้น และสิทธิ์ผู้ใช้ ส่วนซัพพลายเออร์และซัพพลายเออร์วัตถุดิบตั้งต้นเข้ามากรอกข้อมูลผ่านสมาร์ทลิงค์ได้ในทุกแพ็กเกจ ไม่จำกัด",
  "smart links unlimited": "สมาร์ทลิงค์ไม่จำกัด",
  "{n} pages": "{n} หน้า",
  "{n} questions": "{n} คำถาม",
  "What the plan covers": "สิ่งที่แพ็กเกจครอบคลุม",
  "What you can use": "สิ่งที่ใช้ได้",
  "Installation & report package": "สถานประกอบการและชุดเอกสารรายงาน",
  "Provided + 1 meeting session": "จัดให้ + ประชุม 1 ครั้ง",
  "1 business day": "1 วันทำการ",
  "Smart link": "สมาร์ทลิงค์",
  "Smart upload counts pages: an Excel file is 1 page, and every image inside it counts as one more page.":
    "สมาร์ทอัพโหลดนับเป็นหน้า: ไฟล์ Excel นับเป็น 1 หน้า และทุกรูปภาพในไฟล์นับเพิ่มอีกหน้าละรูป",
  "Suppliers and precursor suppliers enter and fill in through their smart link on every plan — no cap, no account, no seat.":
    "ซัพพลายเออร์และซัพพลายเออร์วัตถุดิบตั้งต้นเข้ามากรอกผ่านสมาร์ทลิงค์ได้ทุกแพ็กเกจ — ไม่จำกัด ไม่ต้องมีบัญชี ไม่ใช้สิทธิ์ผู้ใช้",
  "One company": "หนึ่งบริษัท",
  Widest: "กว้างที่สุด",
  "One company, one installation, one CN code.":
    "หนึ่งบริษัท หนึ่งสถานประกอบการ หนึ่งรหัส CN",
  "Two installations and three CN codes, with a chain behind them.":
    "สองสถานประกอบการและสามรหัส CN พร้อมห่วงโซ่อุปทานที่รองรับ",
  "Three installations and six CN codes, with the most room to work.":
    "สามสถานประกอบการและหกรหัส CN พร้อมพื้นที่ทำงานมากที่สุด",
  "Your {plan} plan covers a single installation, and it is registered.":
    "แพ็กเกจ {plan} ของคุณครอบคลุมหนึ่งสถานประกอบการ และลงทะเบียนครบแล้ว",
  "Your {plan} plan covers {cap} installations, and all of them are registered.":
    "แพ็กเกจ {plan} ของคุณครอบคลุม {cap} สถานประกอบการ และลงทะเบียนครบทั้งหมดแล้ว",
  "Talk to sales to raise it — suppliers and precursor suppliers can still fill in through their link, without limit.":
    "ติดต่อฝ่ายขายเพื่อขยายเพดาน — ซัพพลายเออร์และซัพพลายเออร์วัตถุดิบตั้งต้นยังกรอกผ่านลิงก์ได้ไม่จำกัด",
  "Seats used. Suppliers fill in through their link without limit.":
    "สิทธิ์ผู้ใช้ที่ใช้แล้ว ซัพพลายเออร์กรอกผ่านลิงก์ได้ไม่จำกัด",
  "Your team and what each person can do. Suppliers never take a seat — they fill in through a link, without an account.":
    "ทีมของคุณและสิ่งที่แต่ละคนทำได้ ซัพพลายเออร์ไม่ใช้สิทธิ์ผู้ใช้ — เขากรอกผ่านลิงก์โดยไม่ต้องมีบัญชี",
  "Every seat on your plan is taken. Remove someone to release a seat, or talk to sales — suppliers never take a seat.":
    "สิทธิ์ผู้ใช้ในแพ็กเกจของคุณถูกใช้ครบแล้ว ลบใครสักคนเพื่อคืนสิทธิ์ หรือคุยกับฝ่ายขาย — ซัพพลายเออร์ไม่ใช้สิทธิ์ผู้ใช้",
  "Suppliers and precursor suppliers fill in through their link without limit on every plan, at any chain depth, and never take a seat.":
    "ซัพพลายเออร์และซัพพลายเออร์วัตถุดิบตั้งต้นกรอกผ่านลิงก์ได้ไม่จำกัดในทุกแพ็กเกจ ทุกระดับของห่วงโซ่ และไม่ใช้สิทธิ์ผู้ใช้",
  "We couldn't save your details. Please try again.":
    "บันทึกรายละเอียดของคุณไม่สำเร็จ โปรดลองอีกครั้ง",
  "Your workspace is ready.": "พื้นที่ทำงานของคุณพร้อมแล้ว",
  "Your current plan": "แพ็กเกจปัจจุบันของคุณ",
  "Free trial ended": "ช่วงทดลองใช้ฟรีสิ้นสุดแล้ว",
  "Your plan": "แพ็กเกจของคุณ",
  "Your workspace is ready when setup is saved.":
    "พื้นที่ทำงานของคุณพร้อมใช้งานเมื่อบันทึกการตั้งค่าแล้ว",
  /* ── Cookie banner ─────────────────────────────────────────── */
  "Cookie consent": "การยินยอมใช้คุกกี้",
  "We use necessary cookies to keep you signed in. With your permission we also use analytics cookies to improve Certrace.":
    "เราใช้คุกกี้ที่จำเป็นเพื่อให้คุณลงชื่อเข้าใช้ไว้ และหากคุณอนุญาต เราจะใช้คุกกี้วิเคราะห์เพื่อพัฒนา Certrace",
  "Reject optional": "ปฏิเสธส่วนที่ไม่จำเป็น",
  "Accept all": "ยอมรับทั้งหมด",
  Customise: "ปรับแต่ง",
  "Could not save your cookie choice. Please try again.":
    "บันทึกตัวเลือกคุกกี้ไม่สำเร็จ กรุณาลองอีกครั้ง",
};
