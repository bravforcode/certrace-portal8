import csv
from collections import Counter
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

csv_file = "emails-sent-1783396084869.csv"

status_counts = Counter()
delivered_emails = []
bounced_emails = []

try:
    with open(csv_file, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            status = row.get('last_event', '').strip().lower()
            email = row.get('to', '').strip()
            subject = row.get('subject', '').strip()
            
            # Skip the internal tests and interview invites to focus on CBAM outreach
            if "test" in subject.lower() or "ทดสอบ" in subject.lower():
                continue
            if "full stack developer" in subject.lower():
                continue

            status_counts[status] += 1
            if status == 'delivered':
                delivered_emails.append(email)
            elif status == 'bounced':
                bounced_emails.append(email)

    print("=== สรุปผลจาก Resend CSV (แคมเปญ CBAM) ===")
    print(f"Delivered (ส่งถึงผู้รับ): {status_counts['delivered']} ฉบับ")
    print(f"Bounced (ตีกลับ/ส่งไม่ถึง): {status_counts['bounced']} ฉบับ")
    print(f"อื่นๆ: {sum(status_counts.values()) - status_counts['delivered'] - status_counts['bounced']} ฉบับ")
    print("-" * 40)
    print("ตัวอย่าง Bounced Emails (5 อันแรก):")
    for email in bounced_emails[:5]:
        print(f"  - {email}")

except Exception as e:
    print(f"Error reading CSV: {e}")
