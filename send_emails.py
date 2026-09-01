# -*- coding: utf-8 -*-
import os
import re
import csv
import time
import json
import urllib.request
import urllib.error
import sys
import io
from dotenv import load_dotenv

# โหลดค่าคอนฟิกจากไฟล์ .env
load_dotenv()

# --- ตั้งค่าการเชื่อมต่อ Resend และ Google Sheets ---
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
SENDER_EMAIL = os.getenv("SENDER_EMAIL")     # เช่น "Thanakit Inkaew <thanakit@yourdomain.com>"
LOGO_URL = os.getenv("LOGO_URL", "")         # ลิงก์ URL ของโลโก้ PNG/JPG บนเว็บสาธารณะ
GOOGLE_SHEET_URL = os.getenv("GOOGLE_SHEET_URL", "") # ลิงก์ Google Sheets (รองรับคั่นด้วยจุลภาค , หลายลิงก์)

# --- ค่าคอนฟิกเริ่มต้น ---
CSV_FILE_PATH = "Certrace - Validate & Customer Info - Customer info.csv"
MAX_EMAILS = 300  # จำนวนจำกัดส่ง (300 คนแรกเพื่อให้ครอบคลุมข้อมูล 281 บริษัท)
DRY_RUN = True   # True = จำลองการส่งและบันทึกลงไฟล์ draft_emails.txt / False = ส่งจริงผ่าน Resend API

# --- เนื้อหาอีเมลภาษาไทย ---
SUBJECT_TH = "ขอความอนุเคราะห์สัมภาษณ์เกี่ยวกับกระบวนการดำเนินงานด้าน CBAM"
BODY_TEMPLATE_TH = """เรียน {contact_name}

สวัสดีครับ

พวกเราเป็นสตาร์ทอัพที่กำลังพัฒนาโซลูชันเพื่อช่วยให้บริษัทผู้ส่งออกไปยังสหภาพยุโรปจัดการกระบวนการปฏิบัติตามมาตรการ Carbon Border Adjustment Mechanism (CBAM) ได้อย่างมีประสิทธิภาพมากขึ้น โดยเฉพาะความท้าทายในการรวบรวมข้อมูลจากซัพพลายเออร์หลายราย ซึ่งมักอยู่ในรูปแบบที่แตกต่างกัน กระจัดกระจาย และต้องใช้เวลา รวมถึงทรัพยากรบุคคลจำนวนมากในการติดตาม ตรวจสอบ และจัดทำข้อมูลให้พร้อมสำหรับการรายงาน

เพื่อให้เข้าใจปัญหาและกระบวนการทำงานจริงของผู้ประกอบการ พวกเรากำลังพูดคุยกับบริษัทผู้ส่งออกไปยังสหภาพยุโรป เพื่อศึกษาวิธีการดำเนินงานและความท้าทายที่พบในการปฏิบัติตามข้อกำหนดของ CBAM โดยการสัมภาษณ์ครั้งนี้มีวัตถุประสงค์เพื่อการวิจัยและพัฒนาผลิตภัณฑ์เท่านั้น ไม่มีการนำเสนอหรือจำหน่ายผลิตภัณฑ์หรือบริการใด ๆ และจะใช้เวลาประมาณ 20–30 นาที ในวันและเวลาที่สะดวกสำหรับท่าน

หากเป็นไปได้ พวกเราขอความอนุเคราะห์พูดคุยกับผู้ที่รับผิดชอบด้านการส่งออกไปยังสหภาพยุโรปหรือการดำเนินงานด้าน CBAM เช่น ผู้จัดการหรือผู้บริหารฝ่ายส่งออก (Export Manager/Executive) หรือผู้จัดการด้าน ESG ทั้งนี้ หากมีบุคคลอื่นภายในองค์กรที่เหมาะสมกว่า รบกวนช่วยแนะนำหรือประสานงานให้ด้วย จะเป็นพระคุณอย่างยิ่งครับ

ขอขอบพระคุณสำหรับเวลาและความกรุณาของท่านเป็นอย่างสูง และหวังว่าจะได้รับโอกาสในการพูดคุยกับท่าน

ขอแสดงความนับถือ
ธนกฤต อินแก้ว"""

# --- เนื้อหาอีเมลภาษาอังกฤษ ---
BODY_TEMPLATE_EN = """Hi {contact_name_en},

I hope you’re doing well.

We’re an early-stage startup researching how companies exporting to Europe collect environmental and production data for compliance with the EU Carbon Border Adjustment Mechanism (CBAM).

We’re speaking with exporters to better understand their current workflows and challenges. This is purely a research interview—we’re not selling anything. We’d greatly appreciate 20–30 minutes to learn from your experience at a time that’s convenient for you.

If possible, we’d especially love to speak with your Export Manager/Executive or ESG Manager, as they are often closely involved in exports to Europe and the CBAM compliance process. If someone else in your organization would be a better fit, we’d be grateful if you could kindly point us in the right direction.

Thank you for your consideration!

Best regards,
Thanakit Inkaew"""

# --- ฟังก์ชันตัวช่วยแปลง Text เป็น HTML Paragraphs ---
def text_to_html_paragraphs(text):
    paragraphs = text.strip().split('\n\n')
    html_paras = []
    for p in paragraphs:
        p_html = p.replace('\n', '<br>')
        html_paras.append(f'<p style="margin-top: 0; margin-bottom: 16px; font-size: 15px; color: #333333; line-height: 1.6;">{p_html}</p>')
    return "".join(html_paras)

def clean_email(email_str):
    """ทำความสะอาดอีเมล ลบวงเล็บและช่องว่าง"""
    if not email_str:
        return []
    
    cleaned = re.sub(r'\(.*?\)', '', email_str)
    emails = re.split(r'[;,]', cleaned)
    
    valid_emails = []
    for email in emails:
        email = email.strip()
        if email and "@" in email and "." in email and email.lower() != "n/a":
            valid_emails.append(email)
            
    return valid_emails

def build_combined_email(company_name):
    """สร้างเนื้อหาอีเมลแบบสองภาษาคู่กัน ทั้งแบบ Text และ HTML พร้อมโลโก้"""
    contact_th = "ผู้จัดการฝ่ายส่งออก / ฝ่าย ESG (บริษัท {})".format(company_name)
    contact_en = "Export Manager / ESG Team (at {})".format(company_name)
    
    th_text = BODY_TEMPLATE_TH.format(contact_name=contact_th)
    en_text = BODY_TEMPLATE_EN.format(contact_name_en=contact_en)
    
    # 1. สร้างเนื้อหาแบบ Plain Text
    text_body = f"{th_text}\n\n" \
                f"--------------------------------------------------\n" \
                f"English Version\n" \
                f"--------------------------------------------------\n\n" \
                f"{en_text}"
    
    # 2. สร้างเนื้อหาแบบ HTML
    logo_html = ""
    if LOGO_URL:
        logo_html = f'<div style="margin-bottom: 25px;"><img src="{LOGO_URL}" alt="Certrace Logo" width="150" style="display: block; border: 0;" /></div>'
    
    th_html = text_to_html_paragraphs(th_text)
    en_html = text_to_html_paragraphs(en_text)
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #F5F4F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e0e0e0; margin: 20px auto; border-radius: 4px; overflow: hidden;">
            <tr>
                <td style="padding: 40px 30px;">
                    {logo_html}
                    <div>
                        {th_html}
                    </div>
                    <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 30px 0;" />
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                        {en_html}
                    </div>
                </td>
            </tr>
            <tr>
                <td style="background-color: #111111; padding: 20px; text-align: center; color: #ffffff; font-size: 12px; font-family: Courier New, Courier, monospace;">
                    Certrace Carbon Compliance &copy; 2026
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    
    return SUBJECT_TH, text_body, html_body

def send_via_resend_api(to_email, subject, text_body, html_body):
    """ส่งอีเมลผ่าน Resend REST API"""
    url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    payload = {
        "from": SENDER_EMAIL,
        "to": [to_email],
        "subject": subject,
        "text": text_body,
        "html": html_body
    }
    
    req = urllib.request.Request(
        url, 
        data=json.dumps(payload).encode('utf-8'), 
        headers=headers, 
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode('utf-8')
            return True, json.loads(res_body)
    except urllib.error.HTTPError as e:
        error_msg = e.read().decode('utf-8')
        return False, f"HTTP Error {e.code}: {error_msg}"
    except Exception as e:
        return False, str(e)

def download_google_sheet_csv(url):
    """ดึงข้อมูล CSV จาก Google Sheets URL โดยใช้ export URL"""
    id_match = re.search(r'/d/([a-zA-Z0-9-_]+)', url)
    gid_match = re.search(r'[#&?]gid=([0-9]+)', url)
    
    if not id_match:
        raise ValueError("ไม่พบ Spreadsheet ID ใน URL ของ Google Sheets")
        
    spreadsheet_id = id_match.group(1)
    gid = gid_match.group(1) if gid_match else "0"
    
    export_url = f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/export?format=csv&gid={gid}"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    req = urllib.request.Request(export_url, headers=headers)
    with urllib.request.urlopen(req) as response:
        return response.read().decode('utf-8')

def detect_columns(headers):
    """วิเคราะห์หาคอลัมน์ชื่อบริษัทและคอลัมน์อีเมลแบบยืดหยุ่น"""
    company_col = None
    email_col = None
    
    # 1. ค้นหาคอลัมน์บริษัท
    for h in headers:
        h_clean = h.strip().lower()
        if h_clean == "company name":
            company_col = h
            break
    if not company_col:
        for h in headers:
            if "company" in h.lower():
                company_col = h
                break
                
    # 2. ค้นหาคอลัมน์อีเมล
    for h in headers:
        h_clean = h.strip().lower()
        if h_clean in ["email", "public contact email"]:
            email_col = h
            break
    if not email_col:
        for h in headers:
            if "email" in h.lower():
                email_col = h
                break
                
    return company_col, email_col

def main():
    import sys
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
        
    print("="*60)
    print("  Certrace - HTML Bulk Email Sender via Resend API")
    print("="*60)
    
    if DRY_RUN:
        print("[MODE] DRY RUN (จำลองการส่ง - จะบันทึกผลลงใน draft_emails.txt เท่านั้น)")
    else:
        print("[MODE] LIVE RUN (ส่งจริงผ่าน Resend API)")
        if not RESEND_API_KEY or not SENDER_EMAIL:
            print("[ERROR] กรุณาตั้งค่า RESEND_API_KEY และ SENDER_EMAIL ในไฟล์ .env ก่อนรันระบบจริง")
            return

    merged_rows = []
    seen_emails = set()  # เก็บอีเมลที่ประมวลผลแล้ว ป้องกันการส่งซ้ำ
    seen_companies = set() # เก็บชื่อบริษัทที่ประมวลผลแล้ว

    # แยก URL ของ Google Sheets (รองรับคั่นด้วยจุลภาค)
    urls = [u.strip() for u in GOOGLE_SHEET_URL.split(",") if u.strip()]

    if urls:
        print(f"[INFO] พบ Google Sheets ทั้งหมด {len(urls)} แผ่นที่ระบุใน .env")
        for i, url in enumerate(urls):
            print(f"[INFO] กำลังดาวน์โหลดข้อมูลจากแผ่นที่ {i+1}...")
            try:
                csv_content = download_google_sheet_csv(url)
                file_stream = io.StringIO(csv_content)
                reader = csv.DictReader(file_stream)
                
                if not reader.fieldnames:
                    print(f"[WARNING] แผ่นที่ {i+1} ว่างเปล่าหรือไม่มีคอลัมน์")
                    continue
                    
                company_col, email_col = detect_columns(reader.fieldnames)
                
                if not company_col or not email_col:
                    print(f"[WARNING] แผ่นที่ {i+1} โครงสร้างไม่ถูกต้อง (ขาดคอลัมน์ Company หรือ Email) จึงขอข้ามแผ่นนี้")
                    continue
                
                sheet_row_count = 0
                duplicate_count = 0
                
                for row in reader:
                    company_name = row.get(company_col, "").strip()
                    raw_email = row.get(email_col, "")
                    emails = clean_email(raw_email)
                    
                    if not emails or not company_name:
                        continue
                    
                    # คัดกรองและแยกอีเมลเดี่ยวๆ พร้อมเช็กความซ้ำซ้อน
                    unique_emails_for_row = []
                    for email in emails:
                        email_lower = email.lower().strip()
                        if email_lower in seen_emails:
                            duplicate_count += 1
                            continue
                        
                        seen_emails.add(email_lower)
                        unique_emails_for_row.append(email)
                    
                    if unique_emails_for_row:
                        merged_rows.append({
                            "company_name": company_name,
                            "emails": unique_emails_for_row
                        })
                        sheet_row_count += 1
                        
                print(f"[SUCCESS] โหลดสำเร็จ: เพิ่มมา {sheet_row_count} บริษัท (ข้ามข้อมูลที่ซ้ำกัน {duplicate_count} อีเมล)")
                
            except Exception as e:
                print(f"[ERROR] เกิดข้อผิดพลาดขณะโหลดแผ่นที่ {i+1}: {e}")
    else:
        # อ่านจากไฟล์โลคอลหากไม่ได้ระบุ Google Sheets URL
        print(f"[INFO] ไม่พบ Google Sheets URL ใน .env เริ่มสลับมาอ่านไฟล์โลคอล {CSV_FILE_PATH}...")
        if not os.path.exists(CSV_FILE_PATH):
            print(f"[ERROR] ไม่พบไฟล์ข้อมูลโลคอล {CSV_FILE_PATH}")
            return
            
        try:
            with open(CSV_FILE_PATH, mode='r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                company_col, email_col = detect_columns(reader.fieldnames)
                
                if not company_col or not email_col:
                    print(f"[ERROR] โครงสร้างไฟล์ CSV โลคอลไม่ถูกต้อง")
                    return
                    
                for row in reader:
                    company_name = row.get(company_col, "").strip()
                    raw_email = row.get(email_col, "")
                    emails = clean_email(raw_email)
                    
                    if not emails or not company_name:
                        continue
                        
                    unique_emails = []
                    for email in emails:
                        email_lower = email.lower().strip()
                        if email_lower in seen_emails:
                            continue
                        seen_emails.add(email_lower)
                        unique_emails.append(email)
                        
                    if unique_emails:
                        merged_rows.append({
                            "company_name": company_name,
                            "emails": unique_emails
                        })
        except Exception as e:
            print(f"[ERROR] เกิดข้อผิดพลาดขณะอ่านไฟล์ CSV โลคอล: {e}")
            return

    print("="*60)
    print(f"[SUMMARY] รวมข้อมูลผู้รับทั้งหมดแบบไม่ซ้ำกันได้: {len(merged_rows)} บริษัท")
    print("="*60)

    # โหลดประวัติการส่งสำเร็จเพื่อป้องกันการส่งซ้ำ (ใช้สำหรับการส่งต่อข้ามวันหรือหลังจากอัพเกรดโควตา)
    history_file = "sent_emails_success.txt"
    sent_success_set = set()
    if os.path.exists(history_file):
        with open(history_file, mode="r", encoding="utf-8") as h_f:
            for line in h_f:
                email_line = line.strip().lower()
                if email_line:
                    sent_success_set.add(email_line)
        print(f"[INFO] ตรวจพบประวัติส่งสำเร็จแล้ว {len(sent_success_set)} อีเมล (สคริปต์จะข้ามอีเมลเหล่านี้โดยอัตโนมัติ)")
        print("="*60)

    emails_processed = 0
    drafts_output = []

    for row in merged_rows:
        if emails_processed >= MAX_EMAILS:
            break
            
        company_name = row["company_name"]
        emails = row["emails"]
        
        subject, text_body, html_body = build_combined_email(company_name)
        
        for dest_email in emails:
            dest_email_lower = dest_email.lower().strip()
            if dest_email_lower in sent_success_set:
                # ข้ามการสร้างดราฟต์และการส่งจริงเนื่องจากส่งไปแล้ว
                continue
                
            draft_info = f"--- EMAIL #{emails_processed + 1} ---\n" \
                         f"To: {dest_email}\n" \
                         f"Subject: {subject}\n" \
                         f"Company: {company_name}\n" \
                         f"Content HTML Preview (Text-only snippet):\n{text_body}\n" \
                         f"{'='*60}\n\n"
            drafts_output.append(draft_info)
            
            if not DRY_RUN:
                success, response = send_via_resend_api(dest_email, subject, text_body, html_body)
                if success:
                    print(f"[{emails_processed + 1}] ส่งอีเมลสำเร็จ -> {company_name} ({dest_email}) | Resend ID: {response.get('id')}")
                    # บันทึกลงประวัติ
                    try:
                        with open(history_file, mode="a", encoding="utf-8") as h_f:
                            h_f.write(dest_email + "\n")
                    except Exception as h_err:
                        print(f"[WARNING] ไม่สามารถเขียนบันทึกประวัติการส่งลงไฟล์ได้: {h_err}")
                else:
                    print(f"[ERROR] เกิดข้อผิดพลาดขณะส่งหา {company_name} ({dest_email}): {response}")
                time.sleep(1.0)
            else:
                print(f"[DRY RUN] สร้างดราฟต์ HTML สำเร็จ -> {company_name} ({dest_email})")
                
            emails_processed += 1
            if emails_processed >= MAX_EMAILS:
                break

    # เขียนดราฟต์ลงไฟล์ .txt
    draft_file = "draft_emails.txt"
    with open(draft_file, mode="w", encoding="utf-8") as df:
        df.writelines(drafts_output)
        
    print("="*60)
    print(f"ประมวลผลเสร็จสิ้น ทั้งหมด {emails_processed} อีเมล")
    print(f"บันทึกตัวอย่างดราฟต์ลงในไฟล์ '{draft_file}' แล้ว")
    print("="*60)

if __name__ == "__main__":
    main()
