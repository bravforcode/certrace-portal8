# -*- coding: utf-8 -*-
import os
import urllib.request
import json
import time
from dotenv import load_dotenv
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
SENDER_EMAIL = os.getenv("SENDER_EMAIL")

def send_email(to_email, subject, html_body):
    url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    data = {
        "from": SENDER_EMAIL,
        "to": to_email,
        "subject": subject,
        "html": html_body
    }
    
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as response:
            resp_data = json.loads(response.read().decode("utf-8"))
            return True, resp_data
    except urllib.error.HTTPError as e:
        error_msg = e.read().decode("utf-8")
        return False, {"error": error_msg}
    except Exception as e:
        return False, {"error": str(e)}

thai_candidates = [
    ("ชนินท์ เมืองบาล", "itsmelmtz@gmail.com"),
    ("Thiraphat Chorakhe", "thiraboaty@gmail.com"),
    ("Attachai Bunruang", "b.attachai6088@gmail.com"),
    ("Chalermphan Eursukkul", "chalermphan.eur@gmail.com"),
    ("Nophagulporn Salasbsree (Time)", "nophagulporn.work@gmail.com"),
    ("Natthanan Thongchomphu", "natthanan.thongchomp@gmail.com"),
    ("Jaekapat Tongla", "jarkapat.to@gmail.com"),
    ("Chanon Pakeenuya", "c.pakeenuya@gmail.com"),
    ("Kanyaphatchr Disawat", "kanyaphatchr.d@gmail.com"),
    ("Jetsadakorn Pipitakun", "Addking27@gmail.com"),
    ("Chanchai Chakam", "chanchaichakam1997@gmail.com"),
    ("Lukman Yusoh", "luk20435@gmail.com"),
    ("Pongsapuk Sawaroj", "pongsapuk.sawarote@gmail.com"),
    ("Phee Dansateinsakul", "pee.dansatiensakul@gmail.com"),
    ("Natthawut Jampasaeng", "natthawut.jps@gmail.com")
]

eng_candidates = [
    ("Vivek Singh Adhikari", "adhikari.vivek33@gmail.com"),
    ("Kyaw Htet Aung", "august810.a@gmail.com"),
    ("Min Phone Thit", "minphonethitcs001@gmail.com"),
    ("Sai Naw Main", "jaimain671@gmail.com")
]

def format_thai_body(name):
    text = f"""<p>สวัสดีครับ คุณ {name},</p>
<p>ทางทีมงาน Certrace ได้ดูโปรไฟล์ของคุณแล้วน่าสนใจมากครับ!</p>
<p>ตอนนี้ Certrace ของเรายังอยู่ในช่วงเริ่มต้นของการพัฒนาโปรดักต์ (Early-stage) บรรยากาศในทีมเลยจะเน้นความรวดเร็ว ยืดหยุ่น และลุยไปด้วยกัน เราเลยอยากนัดคุยผ่านวิดีโอคอลสั้นๆ ประมาณ <b>15 นาที</b> เพื่อทำความรู้จักกันเบื้องต้นครับ</p>
<p>หลักๆ จะเป็นการพูดคุยสบายๆ เกี่ยวกับความสนใจของคุณในการลุยงานแบบ Startup แลกเปลี่ยนมุมมองกัน และเล่าให้ฟังคร่าวๆ ว่าตอนนี้ทีมเรากำลังปั้นอะไรกันอยู่ เพื่อดูว่าเคมีตรงกันไหมครับ</p>
<p>ไม่ทราบว่าคุณ {name} สะดวกเป็น <b>ช่วงวันและเวลาไหนบ้างครับในสัปดาห์หน้า?</b> (รบกวนเสนอเวลาที่สะดวกมาสัก 2-3 ช่วงเวลาได้เลยครับ)</p>
<p>เดี๋ยวทางเราจะสร้าง Google Meet แล้วส่ง Invite ไปให้ครับ</p>
<p>รอที่จะได้พูดคุยกันนะครับ!</p>
<p>ขอบคุณครับ,<br><br>
Parinyapat S.<br>
HR, Certrace Team</p>"""
    return text

def format_eng_body(name):
    text = f"""<p>Hi {name},</p>
<p>Thank you for your interest in joining Certrace! We have reviewed your profile and are very impressed with your experience.</p>
<p>Currently, Certrace is in the early stages of product development. Our environment is very fast-paced, flexible, and hands-on. We would love to schedule a quick 15-minute video call to get to know you better.</p>
<p>This will be a casual introductory chat. We’d like to hear about your passion for working in an early-stage startup, exchange perspectives, and share a bit about what we are building to see if we’re a great mutual fit.</p>
<p>Could you please let me know 2-3 time slots that work best for you next week?</p>
<p>Once confirmed, I will send over a Google Meet invite.</p>
<p>Looking forward to speaking with you!</p>
<p>Best regards,<br><br>
Parinyapat S.<br>
HR, Certrace Team</p>"""
    return text

def main():
    print("Starting Interview Invites...")
    
    subj_th = "ชวนคุยสั้นๆ 15 นาที ตำแหน่ง Full Stack Developer กับทีม Certrace ครับ 🚀"
    for name, email in thai_candidates:
        body = format_thai_body(name)
        success, resp = send_email(email, subj_th, body)
        if success:
            print(f"[SUCCESS TH] {name} ({email})")
        else:
            print(f"[ERROR TH] {name} ({email}): {resp}")
        time.sleep(1.0)

    subj_en = "Quick 15-min chat: Full Stack Developer @ Certrace 🚀"
    for name, email in eng_candidates:
        body = format_eng_body(name)
        success, resp = send_email(email, subj_en, body)
        if success:
            print(f"[SUCCESS EN] {name} ({email})")
        else:
            print(f"[ERROR EN] {name} ({email}): {resp}")
        time.sleep(1.0)
        
    print("All done!")

if __name__ == "__main__":
    main()
