/* ── Thai (ไทย) — Smart intake prototype ────────────────────────
   Kept apart from lib/i18n-th.ts so the prototype's copy can be rewritten
   freely while the UX moves, and merged into the Thai dictionary in
   lib/i18n.ts. Keyed by the English source string, same as the main file. */

export const TH_INTAKE: Record<string, string> = {
  "Smart upload": "สมาร์ทอัพโหลด",

  /* Drop zone */
  "Drop any documents here": "โยนเอกสารมาได้เลย",
  "Drop your plant's documents here": "โยนเอกสารของโรงงานคุณมาได้เลย",
  "Bills, invoices, meter logs, ERP exports, certificates — as many as you like. Certrace works out what each one is, which month it covers and where it belongs. Nothing is filed until you confirm.":
    "บิลค่าไฟ ใบแจ้งหนี้ บันทึกมิเตอร์ รายงานจาก ERP ใบรับรอง — ใส่มากี่ไฟล์ก็ได้ Certrace จะดูให้ว่าแต่ละไฟล์คือเอกสารอะไร ของเดือนไหน และควรเข้าช่องไหน ไม่มีอะไรถูกบันทึกจนกว่าคุณจะยืนยัน",
  "Choose files": "เลือกไฟล์",
  "Try sample documents": "ลองด้วยเอกสารตัวอย่าง",
  "Sample documents could not be loaded": "โหลดเอกสารตัวอย่างไม่สำเร็จ",
  "Prototype — detection is simulated. Nothing leaves this browser.": "ต้นแบบ — ผลการตรวจจับเป็นการจำลอง ไม่มีข้อมูลออกจากเบราว์เซอร์นี้",

  /* Summary strip */
  "{n} reading": "กำลังอ่าน {n}",
  "{n} need you": "รอคุณตรวจ {n}",
  "{n} ready to file": "พร้อมบันทึก {n}",
  "{n} done": "เสร็จแล้ว {n}",
  "Clear done": "ล้างรายการที่เสร็จแล้ว",
  "File all ready ({n})": "บันทึกทั้งหมดที่พร้อม ({n})",
  "{n} documents filed": "บันทึกเอกสารแล้ว {n} ไฟล์",
  "Needs your answer": "รอคุณตรวจ",
  "Ready to file": "พร้อมบันทึก",
  Done: "เสร็จแล้ว",

  /* Card */
  "Reading the document…": "กำลังอ่านเอกสาร…",
  "Read from the document": "อ่านจากเนื้อหาเอกสาร",
  "Guessed from the file name": "เดาจากชื่อไฟล์",
  "Not recognised": "ไม่รู้จักเอกสารนี้",
  "How sure the detection is": "ความมั่นใจของการตรวจจับ",
  "Issued by": "ออกโดย",
  View: "ดูไฟล์",
  "Looks like the same file as {name}.": "ดูเหมือนเป็นไฟล์เดียวกับ {name}",
  "What it is": "เอกสารนี้คือ",
  "Month it covers": "เป็นของเดือน",
  "No specific month": "ไม่ระบุเดือน",
  "{month} is outside this reporting year.": "{month} อยู่นอกปีที่รายงาน",
  Fuel: "เชื้อเพลิง",
  "Files to": "บันทึกเข้าช่อง",
  "Pick a checklist row": "เลือกช่องใน checklist",
  "There is no {fuel} row in {month} yet. Filing adds one, with the EU standard factors.":
    "เดือน {month} ยังไม่มีแถว {fuel} ถ้ายืนยัน ระบบจะเพิ่มแถวให้ พร้อมค่า factor มาตรฐาน EU",
  "Values found — untick anything you don't want kept": "ค่าที่อ่านได้ — เอาเครื่องหมายถูกออกจากค่าที่ไม่ต้องการเก็บ",
  "writes {field}": "ใส่ลงช่อง {field}",
  "Check this against the document": "ตรวจค่านี้กับเอกสารอีกครั้ง",
  "Set aside": "พักไว้ก่อน",
  "Confirm & file": "ยืนยันและบันทึก",
  "Could not file": "บันทึกไม่สำเร็จ",
  Filed: "บันทึกแล้ว",
  "Filed to": "บันทึกเข้า",
  "whole year": "ทั้งปี",
  "Set aside — not filed": "พักไว้ — ยังไม่ได้บันทึก",
  "Open month": "เปิดเดือนนี้",
  "Bring back": "นำกลับมา",
  "Supplier (via Smart Link)": "ซัพพลายเออร์ (ผ่าน Smart Link)",

  /* Document types */
  "Electricity bill": "บิลค่าไฟฟ้า",
  "Electricity meter log": "บันทึกมิเตอร์ไฟฟ้า",
  "Fuel invoice / delivery note": "ใบแจ้งหนี้ / ใบส่งเชื้อเพลิง",
  "Fuel consumption record": "บันทึกการใช้เชื้อเพลิง",
  "Production record / ERP export": "บันทึกการผลิต / รายงานจาก ERP",
  "Calibration certificate": "ใบรับรองการสอบเทียบ",
  "Mill test certificate": "ใบรับรองผลทดสอบ",
  "Precursor verification report": "รายงานทวนสอบวัตถุดิบตั้งต้น",
  "Carbon price receipt": "หลักฐานการจ่ายราคาคาร์บอน",
  "Installation diagram": "แผนผังโรงงาน",
  "Laboratory analysis": "ผลวิเคราะห์จากห้องปฏิบัติการ",
  "Not a CBAM document": "ไม่ใช่เอกสาร CBAM",

  /* Values */
  "Billing period start": "วันเริ่มรอบบิล",
  "Billing period end": "วันสิ้นสุดรอบบิล",
  "Electricity consumed": "ปริมาณไฟฟ้าที่ใช้",
  "Meter number": "หมายเลขมิเตอร์",
  "Total amount": "ยอดเงินรวม",
  "Fuel quantity": "ปริมาณเชื้อเพลิง",
  "Net calorific value": "ค่าความร้อนสุทธิ (NCV)",
  "Delivery date": "วันที่ส่ง",
  "Production output": "ปริมาณการผลิต",
  Scrap: "เศษเหล็ก (Scrap)",
  "CN code": "รหัส CN",
  "Instrument serial": "หมายเลขเครื่องมือวัด",
  "Calibration date": "วันที่สอบเทียบ",
  "Next calibration due": "กำหนดสอบเทียบครั้งถัดไป",
  "Heat number": "Heat number",
  "Net mass": "น้ำหนักสุทธิ",
  "Production route": "เส้นทางการผลิต",
  "Electricity consumed (MWh)": "ไฟฟ้าที่ใช้ (MWh)",
  "Production (t)": "ปริมาณการผลิต (t)",

  /* Detection summary popup + AI-filled highlight */
  "AI auto-detect": "AI ตรวจจับอัตโนมัติ",
  "Reading {n} documents…": "กำลังอ่านเอกสาร {n} ไฟล์…",
  "Certrace read your documents": "Certrace อ่านเอกสารของคุณแล้ว",
  "Here is what AI found and where each value will go. Nothing is saved until you confirm.":
    "นี่คือสิ่งที่ AI พบ และแต่ละค่าจะไปลงช่องไหน ไม่มีอะไรถูกบันทึกจนกว่าคุณจะยืนยัน",
  "AI is reading the document…": "AI กำลังอ่านเอกสาร…",
  "Reading…": "กำลังอ่าน…",
  Ready: "พร้อม",
  "Needs your check": "รอคุณตรวจ",
  "Not needed": "ไม่ต้องใช้",
  Fills: "กรอกช่อง",
  "Not filled until you tick it on the card — check it against the document.": "จะยังไม่กรอกจนกว่าคุณจะติ๊กบนการ์ด — ตรวจกับเอกสารก่อน",
  "Replaces {old}": "แทนค่าเดิม {old}",
  "+{n} more values kept with the document": "+ อีก {n} ค่าเก็บไว้กับเอกสาร",
  "Review one by one": "ตรวจทีละไฟล์",
  "{done} of {total} read": "อ่านแล้ว {done} จาก {total}",
  "{n} ready": "พร้อม {n}",
  "{n} need your check": "รอตรวจ {n}",
  "{n} values to fill": "จะกรอก {n} ค่า",
  "No documents in this batch.": "ไม่มีเอกสารในรอบนี้",
  "AI filled": "AI กรอกให้",

  /* Review popup as the one review screen + landing banner */
  "Check and confirm": "ตรวจและยืนยัน",
  "Nothing waiting for review": "ไม่มีเอกสารรอตรวจ",
  "{n} still need your tick — they stay here for later.": "ยังรอคุณติ๊กอีก {n} ไฟล์ — เก็บไว้ให้ตรวจทีหลังได้",
  Later: "ไว้ทีหลัง",
  "Needs your check ({n})": "รอคุณตรวจ ({n})",
  "Answer the question above first": "ตอบคำถามด้านบนก่อน",
  "I've checked this — file it": "ตรวจแล้ว — บันทึกไฟล์นี้",
  "Checked — this file will be filed": "ตรวจแล้ว — ไฟล์นี้จะถูกบันทึก",
  "Tap again to leave it out.": "แตะอีกครั้งถ้าไม่ต้องการบันทึก",
  "Unticked files are not filed.": "ไฟล์ที่ไม่ได้ติ๊กจะไม่ถูกบันทึก",
  "Compare the values with the document, then tap here. Unticked files are not filed.": "เทียบค่ากับเอกสาร แล้วแตะที่นี่ ไฟล์ที่ไม่ได้ติ๊กจะไม่ถูกบันทึก",
  "This file can be ticked once every question is answered.": "ติ๊กได้เมื่อตอบคำถามครบแล้ว",
  "Ready ({n})": "พร้อมบันทึก ({n})",
  Change: "แก้ไข",
  "{n} not needed — won't be filed": "ไม่ต้องใช้ {n} ไฟล์ — จะไม่ถูกบันทึก",
  "Everything you dropped has been filed or set aside.": "เอกสารที่ใส่มาถูกบันทึกหรือพักไว้หมดแล้ว",
  "Not filled unless you tick it below — check it against the document.": "จะยังไม่กรอกจนกว่าคุณจะติ๊กด้านล่าง — ตรวจกับเอกสารก่อน",
  "Confirm {docs} documents · fill {values} values": "ยืนยัน {docs} ไฟล์ · กรอก {values} ค่า",
  "Confirm {docs} documents": "ยืนยัน {docs} ไฟล์",
  "Guessed from the file name — check what it is.": "เดาจากชื่อไฟล์ — ตรวจว่าเป็นเอกสารอะไร",
  "{n} documents waiting for your check": "มีเอกสาร {n} ไฟล์รอคุณตรวจ",
  "Continue review": "ตรวจต่อ",
  "AI filled {n} values from your documents — they are in blue.": "AI กรอกให้ {n} ค่าจากเอกสารของคุณ — คือค่าที่เป็นสีฟ้า",
  "AI can make mistakes — check each value against its document. Typing over a value makes it yours.":
    "AI อาจผิดพลาดได้ — ตรวจแต่ละค่ากับเอกสารอีกครั้ง ถ้าพิมพ์ทับ ค่านั้นจะนับเป็นค่าที่คุณกรอกเอง",
  "AI can make mistakes, even on rows marked ready. Check each value against its document before you confirm.":
    "AI อาจผิดพลาดได้ แม้แต่รายการที่ขึ้นว่าพร้อมบันทึก ตรวจแต่ละค่ากับเอกสารก่อนกดยืนยัน",
  "AI can make mistakes. You check every value before anything is saved.": "AI อาจผิดพลาดได้ คุณจะได้ตรวจทุกค่าก่อนมีการบันทึก",
  "Also filled:": "กรอกให้เดือนอื่นด้วย:",

  /* Smart Link overview shortcut */
  "Have the documents already?": "มีเอกสารอยู่แล้วใช่ไหม",
  "Add documents and let Certrace fill the form": "เพิ่มเอกสาร แล้วให้ Certrace กรอกข้อมูลให้",
  "Drop this month's bills, fuel invoices and ERP exports. AI reads each one, files it and fills the matching figures. You check everything before it is saved — AI can make mistakes.":
    "ใส่บิลค่าไฟ ใบแจ้งหนี้เชื้อเพลิง และรายงานจาก ERP ของเดือนนี้ AI จะอ่านทีละไฟล์ บันทึกเข้าช่อง และกรอกตัวเลขที่ตรงกันให้ คุณจะได้ตรวจทุกอย่างก่อนบันทึก — AI อาจผิดพลาดได้",
  "Add documents & auto-fill": "เพิ่มเอกสารและกรอกข้อมูลอัตโนมัติ",
  "AI reads your bills and invoices and fills the form. You check before saving — AI can make mistakes.":
    "AI อ่านบิลและใบแจ้งหนี้ แล้วกรอกแบบฟอร์มให้ คุณตรวจก่อนบันทึก — AI อาจผิดพลาดได้",

  /* Smart Link overview — shorter */
  "Why this is asked": "ทำไมถึงขอข้อมูลนี้",
  "6 steps — installation, methodology, monthly data, precursors, documents, then check and sign. Everything saves as you type.":
    "6 ขั้น — โรงงาน วิธีการวัด ข้อมูลรายเดือน วัตถุดิบตั้งต้น เอกสาร แล้วตรวจและลงนาม ระบบบันทึกให้ระหว่างพิมพ์",
  "See the steps": "ดูรายละเอียดแต่ละขั้น",
  "Copy starts from last month's figures. Clear empties this month only.": "คัดลอกจะเริ่มจากตัวเลขเดือนที่แล้ว ล้างจะลบเฉพาะเดือนนี้",
  "First month of the year — nothing to copy from yet.": "เดือนแรกของปี — ยังไม่มีข้อมูลให้คัดลอก",

  /* Monitor — the phone view */
  Monitor: "ติดตามงาน",
  "Where the year stands": "ภาพรวมของปีนี้",
  "Open the phone view": "เปิดมุมมองสำหรับมือถือ",
  "Where every month stands, and what is waiting on you.": "ดูว่าแต่ละเดือนถึงไหนแล้ว และมีอะไรรอคุณอยู่",
  "Months received so far": "เดือนที่ได้รับข้อมูลแล้ว",
  "Waiting for your review": "รอคุณตรวจ",
  "Months overdue": "เดือนที่เกินกำหนด",
  "{n} months overdue · {first}–{last}": "เกินกำหนด {n} เดือน · {first}–{last}",
  "Days to declaration · {date}": "วันก่อนถึงกำหนดยื่น · {date}",
  "Needs attention": "ต้องดูแล",
  "Nothing is waiting on you right now.": "ตอนนี้ไม่มีอะไรรอคุณ",
  "+{n} more": "+ อีก {n} รายการ",
  "{done} of 12 months in": "ได้รับแล้ว {done} จาก 12 เดือน",
  "Ready {n}%": "พร้อม {n}%",
  Received: "ได้รับแล้ว",
  "Sent back for revision": "ส่งกลับให้แก้ไข",
  Overdue: "เกินกำหนด",
  "Asked — waiting": "ส่งคำขอแล้ว — รอคำตอบ",
  "Being filled in": "กำลังกรอก",
  "Not asked yet": "ยังไม่ได้ส่งคำขอ",
  "Not due yet": "ยังไม่ถึงกำหนด",
  "Recent activity": "ความเคลื่อนไหวล่าสุด",
  "Nothing has happened yet.": "ยังไม่มีความเคลื่อนไหว",
  "Document added": "เพิ่มเอกสาร",
  "Document read by AI": "AI อ่านเอกสาร",
  "Request sent": "ส่งคำขอข้อมูล",
  "Data received": "ได้รับข้อมูล",
  "Sent back": "ส่งกลับให้แก้ไข",
  "Adding and checking documents is easier on a computer. On a phone, use this page to keep track.":
    "การเพิ่มและตรวจเอกสารทำบนคอมพิวเตอร์ได้สะดวกกว่า บนมือถือใช้หน้านี้ติดตามงาน",
  "No months are due yet this year.": "ปีนี้ยังไม่มีเดือนที่ถึงกำหนด",
  "Filled by AI from {file}. AI can make mistakes — check it against the document and edit it if it is wrong.":
    "AI กรอกจากไฟล์ {file} — AI อาจผิดพลาดได้ ตรวจกับเอกสาร และแก้ค่าถ้าไม่ถูกต้อง",
  "File all ready ({n}) now": "บันทึกทั้งหมดที่พร้อม ({n})",
  "Fills into the questionnaire": "จะกรอกลงแบบสอบถาม",
  "Other values are shown for reference only.": "ค่าอื่นแสดงไว้เพื่ออ้างอิงเท่านั้น",

  /* Supplier Portal intake (/s/ and /self/) */
  "Drop your documents here": "โยนเอกสารของคุณมาได้เลย",
  "Certificates, CBAM sheets, verification statements — Certrace matches each file to what {exporter} asked for. Nothing is attached until you confirm.":
    "ใบรับรอง แบบฟอร์ม CBAM รายงานทวนสอบ — Certrace จะจับคู่แต่ละไฟล์กับเอกสารที่ {exporter} ขอ ไม่มีอะไรถูกแนบจนกว่าคุณจะยืนยัน",
  "Attach to": "แนบกับเอกสาร",
  "Pick a requested document": "เลือกเอกสารที่ถูกขอ",
  "Confirm & attach": "ยืนยันและแนบ",
  "Attach all ready ({n})": "แนบทั้งหมดที่พร้อม ({n})",
  "{n} documents attached": "แนบเอกสารแล้ว {n} ไฟล์",
  "{n} ready to attach": "พร้อมแนบ {n}",
  "{n} not requested": "ไม่ได้ถูกขอ {n}",
  "Ready to attach": "พร้อมแนบ",
  "Not requested by {exporter}": "{exporter} ไม่ได้ขอเอกสารเหล่านี้",
  Attached: "แนบแล้ว",
  "Attached to": "แนบกับ",
  "Could not attach": "แนบไม่สำเร็จ",
  "OK, don't attach": "รับทราบ ไม่ต้องแนบ",
  "Not needed — not attached.": "ไม่ต้องใช้ — ไม่ได้แนบ",
  "Set aside — not attached": "พักไว้ — ยังไม่ได้แนบ",
  "{exporter} did not ask for this document. Pick a requested document above if it belongs to one.":
    "{exporter} ไม่ได้ขอเอกสารนี้ ถ้าเอกสารนี้ตรงกับรายการที่ถูกขอ ให้เลือกด้านบน",
  "Locked — not part of this revision.": "ล็อกอยู่ — ไม่ได้อยู่ในรอบแก้ไขนี้",
  "The file is no longer in this page. Drop it again.": "ไฟล์ไม่อยู่ในหน้านี้แล้ว โยนไฟล์ใหม่อีกครั้ง",
  "Pick a requested document for this file.": "เลือกเอกสารที่ถูกขอให้ไฟล์นี้",
  "Values found": "ค่าที่อ่านได้",
  "Shown for reference — these values are not written into the questionnaire.": "แสดงเพื่ออ้างอิงเท่านั้น — ค่าเหล่านี้ไม่ได้ถูกใส่ลงแบบสอบถาม",
  "Requested documents": "เอกสารที่ถูกขอ",
  required: "จำเป็น",
  "CBAM communication sheet": "แบบฟอร์มสื่อสาร CBAM",
  "Certificate of Origin": "หนังสือรับรองถิ่นกำเนิดสินค้า",
  "This document belongs to a supplier's data request, not to this workspace's checklist.":
    "เอกสารนี้เป็นของคำขอข้อมูลถึงซัพพลายเออร์ ไม่ได้อยู่ใน checklist ของงานนี้",
  "Direct emissions": "การปล่อยทางตรง",
  "Indirect emissions": "การปล่อยทางอ้อม",
  "Reporting period": "ช่วงเวลาที่รายงาน",
  "Certificate number": "เลขที่หนังสือรับรอง",
  "Country of origin": "ประเทศถิ่นกำเนิด",
  "Issue date": "วันที่ออก",
  Verifier: "ผู้ทวนสอบ",
  Opinion: "ความเห็น",

  /* Document preview */
  "View document": "ดูเอกสาร",
  "Open in a new tab": "เปิดในแท็บใหม่",
  "What Certrace read": "สิ่งที่ Certrace อ่านได้",
  kept: "เก็บ",
  "not kept": "ไม่เก็บ",
  "This file is too large to keep in the browser, so there is nothing to show.": "ไฟล์ใหญ่เกินกว่าจะเก็บไว้ในเบราว์เซอร์ จึงแสดงไม่ได้",
  "No preview for this file type. Open it in a new tab instead.": "ไฟล์ประเภทนี้แสดงตัวอย่างไม่ได้ ให้เปิดในแท็บใหม่แทน",
  "No values were read from this document.": "ไม่มีค่าที่อ่านได้จากเอกสารนี้",

  /* What filing wrote */
  "Electricity: {kwh} kWh → {mwh} MWh": "ไฟฟ้า: {kwh} kWh → {mwh} MWh",
  "Electricity: {mwh} MWh": "ไฟฟ้า: {mwh} MWh",
  "Production: {t} t": "ปริมาณการผลิต: {t} t",
  "Fuel quantity: {qty} {unit}": "ปริมาณเชื้อเพลิง: {qty} {unit}",
  "Fuel quantity not written — the document says {docUnit}, the row is in {rowUnit}":
    "ไม่ได้ใส่ปริมาณเชื้อเพลิง — เอกสารใช้หน่วย {docUnit} แต่แถวในระบบใช้หน่วย {rowUnit}",

  /* Folded ready card */
  "{n} values kept": "เก็บ {n} ค่า",
  "Check details": "ดูรายละเอียด",

  /* Short checklist row names */
  "Production volume": "ปริมาณการผลิต",
  "Electricity meter readings": "ค่ามิเตอร์ไฟฟ้า",
  "Electricity emission factor": "ค่า emission factor ของไฟฟ้า",
  "{fuel} — invoice": "{fuel} — ใบแจ้งหนี้",
  "{fuel} — consumption records": "{fuel} — บันทึกการใช้",
  "{fuel} — biomass sustainability documents": "{fuel} — เอกสารความยั่งยืนของชีวมวล",
  "Installation identity": "ข้อมูลโรงงาน",
  "Internal QA record": "บันทึกการตรวจสอบภายใน (QA)",
  "Electricity contract / PPA": "สัญญาซื้อไฟฟ้า / PPA",
  "Default value justification": "เหตุผลที่ใช้ค่า default",

  /* Supplier Documents step, below the upload box */
  "What's still missing": "ยังขาดเอกสารอะไรบ้าง",
  "Add documents with the upload box above. This list shows what each figure still needs.":
    "เพิ่มเอกสารด้วยช่องโยนเอกสารด้านบน รายการนี้บอกว่าตัวเลขแต่ละตัวยังขาดเอกสารอะไร",

  /* Not needed */
  "{n} not needed": "ไม่ต้องใช้ {n}",
  "Not needed for this workspace": "ไม่ต้องใช้สำหรับงานนี้",
  "Electricity emissions are not counted for {product}, so no electricity document is required.":
    "{product} ไม่นับการปล่อยก๊าซจากไฟฟ้า จึงไม่ต้องใช้เอกสารเกี่ยวกับไฟฟ้า",
  "It is needed": "ที่จริงต้องใช้",
  "OK, don't file": "รับทราบ ไม่ต้องบันทึก",
  "Not needed — not filed.": "ไม่ต้องใช้ — ไม่ได้บันทึก",
  "Pick a row above if it is needed anyway.": "ถ้ายังต้องใช้ ให้เลือกช่องด้านบน",

  /* Why a document cannot file yet */
  "Workspace not found.": "ไม่พบ workspace",
  "This does not look like anything a CBAM verifier asks for.": "เอกสารนี้ดูไม่ใช่สิ่งที่ผู้ทวนสอบ CBAM ขอ",
  "Pick what this document is first.": "เลือกก่อนว่าเอกสารนี้คืออะไร",
  "This product does not count electricity emissions, so the checklist has no electricity row to file it to.":
    "สินค้านี้ไม่นับการปล่อยก๊าซจากไฟฟ้า จึงไม่มีช่องไฟฟ้าใน checklist ให้บันทึก",
  "Pick which month this document covers.": "เลือกว่าเอกสารนี้เป็นของเดือนไหน",
  "Pick which fuel this is for.": "เลือกว่าเป็นเชื้อเพลิงชนิดไหน",
  "Pick a checklist row for this document.": "เลือกช่องใน checklist ให้เอกสารนี้",
  "No checklist row to file to.": "ไม่มีช่องใน checklist ให้บันทึก",

  /* Detection summaries for the sample documents */
  "Nothing in the file name says what this is. Pick the document type below.": "ชื่อไฟล์ไม่บอกว่าเป็นเอกสารอะไร เลือกประเภทเอกสารด้านล่าง",
  "Guessed from the file name only. Nothing inside the file was read, so no values were proposed.":
    "เดาจากชื่อไฟล์อย่างเดียว ไม่ได้อ่านเนื้อหาในไฟล์ จึงไม่มีค่าที่เสนอให้",
  "Electricity bill for March 2026 — 412,800 kWh on meter SMP-7781204.": "บิลค่าไฟเดือนมีนาคม 2569 — 412,800 kWh มิเตอร์ SMP-7781204",
  "Scanned electricity bill for April 2026. Several digits are smudged; the total kWh is partly obscured and a handwritten note repeats it with a question mark.":
    "บิลค่าไฟเดือนเมษายน 2569 แบบสแกน ตัวเลขหลายตัวเลอะ ยอด kWh รวมมองเห็นไม่ชัด และมีลายมือเขียนซ้ำพร้อมเครื่องหมายคำถาม",
  "Natural gas invoice for March 2026 — 185,400 Sm³ delivered at RY-DP-014.": "ใบแจ้งหนี้ก๊าซธรรมชาติเดือนมีนาคม 2569 — 185,400 Sm³ ส่งที่จุด RY-DP-014",
  "Delivery note for 12,000 litres of diesel B7 on 18 April 2026. No price on the note.": "ใบส่งน้ำมันดีเซล B7 จำนวน 12,000 ลิตร วันที่ 18 เมษายน 2569 ไม่มีราคาในเอกสาร",
  "ERP production summary for March 2026 — 8,420.5 t of hot-rolled coil.": "สรุปการผลิตจาก ERP เดือนมีนาคม 2569 — เหล็กม้วนรีดร้อน 8,420.5 t",
  "Calibration certificate for gas flow meter GFM-22-0391, calibrated 12 January 2026, next due 12 January 2027.":
    "ใบรับรองการสอบเทียบมิเตอร์ก๊าซ GFM-22-0391 สอบเทียบ 12 มกราคม 2569 ครั้งถัดไป 12 มกราคม 2570",
  "EN 10204 3.1 certificate for 250 t of SS400 slab, heat H26-03117, delivered March 2026.": "ใบรับรอง EN 10204 3.1 สำหรับ slab SS400 250 t heat H26-03117 ส่งเดือนมีนาคม 2569",
  "Receipt for paper and printer ink. Nothing on it relates to emissions, energy or production.": "ใบเสร็จค่ากระดาษและหมึกพิมพ์ ไม่เกี่ยวกับการปล่อยก๊าซ พลังงาน หรือการผลิต",
};
