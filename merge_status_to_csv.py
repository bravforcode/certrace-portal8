import csv
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

resend_csv = "d:/1tb/certrace/emails-sent-1783396084869.csv"
original_csv = "d:/1tb/certrace/Certrace - Validate & Customer Info - Customer info.csv"
output_csv = "d:/1tb/certrace/Certrace_Customer_Info_with_Status.csv"

# 1. Build dictionary of email -> status
email_status = {}
with open(resend_csv, mode='r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        status = row.get('last_event', '').strip().lower()
        email = row.get('to', '').strip().lower()
        subject = row.get('subject', '').strip()
        
        if "test" in subject.lower() or "ทดสอบ" in subject.lower():
            continue
        if "full stack developer" in subject.lower():
            continue
            
        # Overwrite if we have multiple, but normally it's one status per email
        # If we already have a status, we might prefer keeping 'delivered' if there's a conflict
        if email in email_status:
            if status == 'delivered':
                email_status[email] = 'delivered'
        else:
            email_status[email] = status

# 2. Process Original CSV
try:
    with open(original_csv, mode='r', encoding='utf-8') as f_in, open(output_csv, mode='w', encoding='utf-8-sig', newline='') as f_out:
        reader = csv.reader(f_in)
        writer = csv.writer(f_out)
        
        headers = next(reader)
        # Find email column index
        try:
            email_idx = headers.index('email')
        except ValueError:
            print("Could not find 'email' column in the original CSV.")
            sys.exit(1)
            
        headers.append("Email Delivery Status")
        writer.writerow(headers)
        
        for row in reader:
            if len(row) > email_idx:
                raw_emails = row[email_idx]
                # Some rows have multiple emails separated by semicolon or comma
                emails = [e.strip().lower() for e in raw_emails.replace(',', ';').split(';') if e.strip()]
                
                row_status = "Not Sent"
                for e in emails:
                    if e in email_status:
                        row_status = email_status[e].capitalize()
                        if row_status == 'Delivered':
                            break # If at least one delivered, mark row as delivered
                
                row.append(row_status)
            else:
                row.append("Not Sent")
                
            writer.writerow(row)
            
    print(f"✅ สร้างไฟล์ผลลัพธ์สำเร็จ: {output_csv}")
    print("คุณสามารถนำไฟล์นี้ไป Import กลับเข้า Google Sheet ได้เลยครับ")

except Exception as e:
    print(f"Error processing CSV: {e}")
