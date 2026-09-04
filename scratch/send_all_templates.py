# -*- coding: utf-8 -*-
import os
import sys
import json
import time
import urllib.request
import urllib.error
from pathlib import Path
from dotenv import load_dotenv

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

root_dir = Path('.').resolve()
sys.path.insert(0, str(root_dir))
sys.path.insert(0, str(root_dir / 'certrace-backend'))

load_dotenv(root_dir / '.env')

from app.services import email_templates

api_key = os.getenv('RESEND_API_KEY')
sender = os.getenv('SENDER_EMAIL', 'Certrace <contact@certrace.co>')
to_email = 'nawinpat@certrace.co'

templates_to_send = [
    (
        'supplier_data_request',
        'th',
        {
            'supplier_name': 'Xingda Steel Cord (Thailand) Co., Ltd.',
            'exporter_name': 'Siam Steel Industries',
            'period_label': 'มีนาคม 2569',
            'due_date': '10 เมษายน 2569',
            'link_url': 'https://app.certrace.co/s/tok_9f2a7c',
        }
    ),
    (
        'supplier_submission_reminder',
        'th',
        {
            'supplier_name': 'Xingda Steel Cord (Thailand) Co., Ltd.',
            'exporter_name': 'Siam Steel Industries',
            'period_label': 'มีนาคม 2569',
            'due_date': '10 เมษายน 2569',
            'days_left': 3,
            'link_url': 'https://app.certrace.co/s/tok_9f2a7c',
        }
    ),
    (
        'supplier_submission_overdue',
        'th',
        {
            'supplier_name': 'Xingda Steel Cord (Thailand) Co., Ltd.',
            'exporter_name': 'Siam Steel Industries',
            'period_label': 'มีนาคม 2569',
            'due_date': '10 เมษายน 2569',
            'days_overdue': 6,
            'link_url': 'https://app.certrace.co/s/tok_9f2a7c',
        }
    ),
    (
        'trial_ended',
        'th',
        {
            'org_name': 'Siam Steel Industries',
            'trial_days': 30,
            'ends_on': '3 กันยายน 2569',
            'billing_url': 'https://app.certrace.co/billing',
        }
    ),
    (
        'password_reset',
        'th',
        {
            'email': to_email,
            'code': '482 913',
            'expires_in_minutes': 15,
        }
    ),
    (
        'password_changed',
        'th',
        {
            'email': to_email,
            'changed_at': '3 ก.ย. 2569, 14:22 ICT',
            'support_email': 'contact@certrace.co',
        }
    ),
]

headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json',
    'User-Agent': 'Certrace-Backend/1.0',
}

for key, locale, ctx in templates_to_send:
    rendered = email_templates.render(key, locale, ctx)
    payload = {
        'from': sender,
        'to': [to_email],
        'subject': rendered.subject,
        'html': rendered.html,
        'text': rendered.text,
    }
    req = urllib.request.Request(
        'https://api.resend.com/emails',
        data=json.dumps(payload).encode('utf-8'),
        headers=headers,
        method='POST'
    )
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            msg_id = data.get('id')
            print(f'[SUCCESS] {key} -> ID: {msg_id}')
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode('utf-8')
        print(f'[ERROR] {key} -> HTTP {e.code}: {err_msg}')
    except Exception as e:
        print(f'[ERROR] {key} -> {e}')
    time.sleep(1.0)

# Outreach email from send_emails.py
try:
    import send_emails
    s_subj, s_text, s_html = send_emails.build_combined_email('Siam Steel Industries')
    payload = {
        'from': sender,
        'to': [to_email],
        'subject': s_subj,
        'html': s_html,
        'text': s_text,
    }
    req = urllib.request.Request(
        'https://api.resend.com/emails',
        data=json.dumps(payload).encode('utf-8'),
        headers=headers,
        method='POST'
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        msg_id = data.get('id')
        print(f'[SUCCESS] outreach_interview -> ID: {msg_id}')
except Exception as e:
    print(f'[ERROR] outreach_interview -> {e}')

print('ALL_FINISHED')
