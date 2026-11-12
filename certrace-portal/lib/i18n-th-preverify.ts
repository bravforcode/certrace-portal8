/* Thai for the CBAM pre-verification panel on Convert (components/convert/preverify-panel.tsx). Keyed on the
   English text. Only strings Thai did not already carry are here: "Done", "Pending", "In progress" and
   "Complete first" come from their existing rows. */

export const TH_PREVERIFY: Record<string, string> = {
  "Pre-verification": "ตรวจสอบล่วงหน้า",
  "The AI checks the workbook first. A Certrace team member then reviews it.":
    "AI ตรวจเวิร์กบุ๊กก่อน จากนั้นทีมงาน Certrace จะตรวจทานอีกครั้ง",
  "AI check": "การตรวจด้วย AI",
  "Certrace team review": "ทีมงาน Certrace ตรวจทาน",
  "Pre-verified": "ผ่านการตรวจสอบล่วงหน้า",
  "Action needed": "ต้องดำเนินการ",
  Outdated: "ล้าสมัย",
  Error: "ข้อผิดพลาด",
  Warning: "คำเตือน",
  "Submit for pre-verification": "ส่งเพื่อตรวจสอบล่วงหน้า",
  "Resubmit for pre-verification": "ส่งใหม่เพื่อตรวจสอบล่วงหน้า",
  "Submitted for pre-verification": "ส่งเพื่อตรวจสอบล่วงหน้าแล้ว",
  "Waiting for Certrace team review.": "กำลังรอทีมงาน Certrace ตรวจทาน",
  "Submitted {time}": "ส่งเมื่อ {time}",
  "Reviewed {time}": "ตรวจทานเมื่อ {time}",
  "Pre-verified by Certrace": "ผ่านการตรวจสอบล่วงหน้าโดย Certrace",
  "Certrace asked for changes": "Certrace ขอให้แก้ไข",
  "Data changed since the review. Resubmit.": "ข้อมูลเปลี่ยนแปลงหลังการตรวจทาน กรุณาส่งใหม่",
  "Fix the points below in the workbook, then resubmit.": "แก้ไขประเด็นด้านล่างในเวิร์กบุ๊ก แล้วส่งใหม่",
  "Could not load the pre-verification status.": "ไม่สามารถโหลดสถานะการตรวจสอบล่วงหน้าได้",
  "Could not submit for pre-verification. Try again.": "ไม่สามารถส่งเพื่อตรวจสอบล่วงหน้าได้ กรุณาลองอีกครั้ง",
  "Too many submissions. Try again later.": "ส่งบ่อยเกินไป กรุณาลองใหม่ภายหลัง",
  "This workbook is already waiting for the Certrace team. Change the data to submit again.":
    "เวิร์กบุ๊กนี้กำลังรอทีมงาน Certrace ตรวจทานอยู่แล้ว เปลี่ยนแปลงข้อมูลก่อนจึงจะส่งใหม่ได้",
  "Fill in the CBAM requirements before you submit for pre-verification.":
    "กรุณากรอกข้อกำหนด CBAM ให้ครบก่อนส่งเพื่อตรวจสอบล่วงหน้า",
};
